import { z } from 'zod';
import { ApiError } from '@/shared/api/api-error';
import { createVoiceSession, sendVoiceTurn } from './voice.service';
import { createVoiceAudio } from './voice-audio';
import type { VoiceAudio } from '../utils/voice-audio';
import { FarewellTracker, TurnQueue, UtteranceAssembler } from './voice-call-state';
import { VOICE_INSTRUCTIONS } from '../utils/voice-config';
import { delegationSchema, realtimeEventSchema, transcriptSchema, voiceRefreshSchema, voiceScreenCommandSchema, VOICE_MAX_SECONDS, type VoiceRefresh, type VoiceScreen, type VoiceScreenCommand } from '../types/voice.schema';

export type VoiceStatus = 'connecting' | 'listening' | 'speaking' | 'thinking' | 'muted' | 'ending' | 'ended' | 'error';
type CallOptions = {
  threadId: string; fullName: string | null; today: string; screen: VoiceScreen;
  getScreen: () => VoiceScreen;
  onStatus: (status: VoiceStatus) => void; onText: (text: string) => void; onHeard: (text: string) => void;
  onError: (text: string) => void; onScreen: (command: VoiceScreenCommand) => void;
  onRefresh: (command: VoiceRefresh) => void; onTurnEnd: () => void;
};

export function voiceFailureText(error: unknown) {
  if (error instanceof Error && ['NotAllowedError', 'SecurityError'].includes(error.name)) return 'Hãy cho phép Vedora dùng mic trong Cài đặt để trò chuyện.';
  if (error instanceof Error && error.name === 'NotFoundError') return 'Chưa tìm thấy mic. Hãy kết nối thiết bị âm thanh và thử lại.';
  if (error instanceof ApiError) {
    if (error.code === 'AI_QUOTA_EXCEEDED') return 'Bạn đã dùng hết lượt trợ lý AI hiện có.';
    if (error.status === 429) return 'Bạn thao tác hơi nhanh. Đợi một chút rồi thử lại nhé.';
    if (error.status === 401) return 'Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.';
    if (error.status === 503) return 'Trợ lý giọng nói đang tạm ngưng. Hãy thử lại sau.';
  }
  return 'Chưa kết nối được trợ lý giọng nói. Hãy kiểm tra mạng và thử lại.';
}

/** Same normalized Gateway Live protocol and delegation ledger as FE web (gateway 4.0.154). */
export class PlannerVoiceCall {
  private stopped = false;
  private ready = false;
  private muted = false;
  private status?: VoiceStatus;
  private setup = new AbortController();
  private socket?: WebSocket;
  private audio?: VoiceAudio;
  private utterances = new UtteranceAssembler();
  private turns = new TurnQueue();
  private farewell = new FarewellTracker();
  private seen = new Set<string>();
  private pending = 0;
  private clock?: ReturnType<typeof setInterval>;
  private startup?: ReturnType<typeof setTimeout>;
  private limit?: ReturnType<typeof setTimeout>;
  private screen: VoiceScreen;

  constructor(private options: CallOptions) { this.screen = options.screen; }
  private update(status: VoiceStatus) {
    if (this.status === status) return;
    this.status = status;
    this.options.onStatus(status);
  }
  private send(event: Record<string, unknown>) {
    if (!this.stopped && this.socket?.readyState === WebSocket.OPEN) {
      try { this.socket.send(JSON.stringify(event)); }
      catch { if (event.type !== 'session-close') this.fail(voiceFailureText(null)); }
    }
  }
  context(content: string, delegationId: string | null = null, channel: 'thinking' | 'commentary' = 'thinking') {
    this.send({ type: 'context-append', content: content.slice(0, 1200), delegationId, providerOptions: { openai: { channel } } });
  }
  updateScreen(screen: VoiceScreen) {
    this.screen = screen;
    if (this.ready) this.context(`Màn hình hiện tại: ${JSON.stringify(screen)}`);
  }
  async start() {
    this.update('connecting');
    try {
      this.audio = await createVoiceAudio();
      if (this.stopped) { await this.audio.stop(); return; }
      await this.audio.start((audio) => {
        if (this.ready && !this.muted && (this.socket?.bufferedAmount ?? 0) < 64_000) this.send({ type: 'input-audio-append', audio });
      }, (error) => this.fail(error.message));
      if (this.stopped) return;
      const session = await createVoiceSession(this.options.threadId, this.setup.signal);
      if (this.stopped) return;
      const socket = new WebSocket(session.url, ['ai-gateway-realtime.v1', `ai-gateway-auth.${session.token}`]);
      this.socket = socket;
      this.startup = setTimeout(() => this.fail('Kết nối mất quá lâu. Hãy thử lại.'), 30_000);
      socket.onopen = () => this.send({ type: 'session-start', modelId: session.model, config: {
        instructions: VOICE_INSTRUCTIONS,
        inputAudioFormat: { type: 'audio/pcm', rate: 24_000 }, outputAudioFormat: { type: 'audio/pcm', rate: 24_000 },
        providerOptions: { openai: { delegation: { type: 'client' }, input: [{ type: 'message', role: 'developer', content: [{ type: 'input_text', text: `Greet the user right away in natural Vietnamese${this.options.fullName ? ` (name: ${this.options.fullName})` : ''}. Briefly introduce yourself as Vedora's assistant, then pause and listen.` }] }] } },
      } });
      socket.onmessage = (event) => {
        if (this.stopped || typeof event.data !== 'string') return;
        try { this.handle(JSON.parse(event.data)); } catch { this.fail('Phản hồi giọng nói không hợp lệ. Hãy kết nối lại.'); }
      };
      socket.onerror = () => this.fail(voiceFailureText(null));
      socket.onclose = () => { if (!this.stopped) this.fail('Cuộc gọi bị ngắt kết nối. Những thay đổi đã lưu vẫn được giữ.'); };
    } catch (error) {
      if (!this.stopped) this.fail(error instanceof Error && /mic|ghi âm|HTTPS/i.test(error.message) ? error.message : voiceFailureText(error));
    }
  }
  private handle(raw: unknown) {
    const parsed = realtimeEventSchema.safeParse(raw);
    if (!parsed.success) throw new Error('Invalid realtime event');
    const event = parsed.data;
    if (event.type === 'session-started') {
      if (this.ready) return;
      clearTimeout(this.startup);
      this.ready = true;
      this.context(`Người dùng ở trang thực đơn Vedora, tuần bắt đầu ${this.screen.weekStart}. Hôm nay là ${this.options.today}.`);
      this.updateScreen(this.screen);
      this.limit = setTimeout(() => this.end(), VOICE_MAX_SECONDS * 1000);
      this.clock = setInterval(() => {
        if (this.farewell.done(this.audio?.isPlaying() ?? false)) { this.end(); return; }
        this.update(this.farewell.phase !== 'idle' ? 'ending' : this.muted ? 'muted' : this.audio?.isPlaying() ? 'speaking' : this.pending ? 'thinking' : 'listening');
      }, 200);
      return;
    }
    if (event.type === 'audio-chunk') { this.audio?.play(z.string().parse(event.delta)); return; }
    if (event.type === 'speech-started' || event.type === 'audio-cleared') { this.audio?.interrupt(); return; }
    if (event.type === 'transcript-fragment') {
      const fragment = transcriptSchema.parse(event);
      if (fragment.speaker === 'user') {
        this.utterances.addFragment({ text: fragment.delta, startMs: fragment.startMs, endMs: fragment.endMs });
        this.options.onHeard(fragment.delta);
        this.audio?.interrupt();
        if (this.farewell.shouldCancel(fragment.delta)) this.farewell.reset();
      } else this.farewell.spoke(fragment.startMs, fragment.endMs);
      return;
    }
    if (event.type === 'delegation-created') {
      const delegation = delegationSchema.parse(event);
      if (this.seen.has(delegation.delegationId)) return;
      this.seen.add(delegation.delegationId);
      this.farewell.reset();
      void this.delegate(delegation.delegationId, delegation.offsetMs);
    }
    if (event.type === 'session-usage') {
      const usage = z.object({ seconds: z.number().nonnegative() }).parse(event.usage);
      if (usage.seconds >= VOICE_MAX_SECONDS) this.end();
    }
    if (event.type === 'session-closed') this.end();
    if (event.type === 'error') this.fail('Dịch vụ giọng nói gặp lỗi. Hãy kết nối lại sau.');
  }
  private async delegate(id: string, offset?: number) {
    if (!(await this.utterances.waitForUtterance(offset, 3000)) || this.stopped) return;
    const message = this.utterances.takeUtterance(offset);
    if (!message) { this.context('Chưa nghe rõ yêu cầu. Hãy nhờ người dùng nói lại.', id, 'commentary'); return; }
    const superseded = this.turns.cancel();
    this.turns.nextCall();
    if (superseded) {
      this.context('Yêu cầu cũ đã dừng vì người dùng nói tiếp; thay đổi đã lưu vẫn giữ.', superseded);
      this.refreshAll();
    }
    this.turns.enqueue(() => this.runTurn(id, message));
  }
  private async runTurn(id: string, message: string) {
    if (this.stopped) return;
    const controller = this.turns.begin(id, message);
    let reply = '';
    let summary = '';
    let ended = false;
    let complete = false;
    let progress: ReturnType<typeof setTimeout> | undefined;
    const deliver = () => {
      if (complete || controller.signal.aborted || this.stopped) return;
      complete = true;
      clearTimeout(progress);
      const spoken = reply.trim() || summary || 'Đã xong.';
      this.options.onText(spoken);
      if (ended) this.farewell.sent();
      this.context(spoken, id, 'commentary');
    };
    this.pending++;
    try {
      const screen = this.options.getScreen();
      await sendVoiceTurn({ weekStart: screen.weekStart, screen, message, threadId: this.options.threadId, requestId: id }, controller.signal, (event) => {
        if (controller.signal.aborted || this.stopped) return;
        if (event.type === 'text-delta') reply += z.string().parse(event.delta);
        if (event.type === 'data-screen') this.options.onScreen(voiceScreenCommandSchema.parse(event.data));
        if (event.type === 'data-refresh') this.options.onRefresh(voiceRefreshSchema.parse(event.data));
        if (event.type === 'data-summary') summary = z.object({ text: z.string() }).parse(event.data).text;
        if (event.type === 'data-end-call') ended = true;
        if (event.type === 'data-progress') {
          const text = z.object({ text: z.string() }).parse(event.data).text;
          this.options.onText(text);
          this.context(text, id);
          clearTimeout(progress);
          progress = setTimeout(() => { if (!complete && !controller.signal.aborted && this.turns.runningFor(id) > 6000) this.context(text, id, 'commentary'); }, 2000);
        }
        if (event.type === 'finish') deliver();
      });
      if (!complete) throw new Error('Incomplete voice stream');
    } catch (error) {
      if (!controller.signal.aborted && !this.stopped) {
        const text = error instanceof ApiError && error.code === 'AI_QUOTA_EXCEEDED' ? voiceFailureText(error) : 'Yêu cầu chưa xử lý xong. Một phần có thể đã được lưu; hãy kiểm tra dữ liệu trước khi thử lại.';
        this.options.onText(text);
        this.context(text, id, 'commentary');
      }
      this.refreshAll();
    } finally {
      clearTimeout(progress);
      this.pending--;
      this.turns.finish(id);
      if (!this.stopped && !controller.signal.aborted) this.options.onTurnEnd();
    }
  }
  toggleMute() {
    if (!this.ready || this.stopped) return;
    this.muted = !this.muted;
    this.send({ type: this.muted ? 'input-audio-mute' : 'input-audio-unmute' });
  }
  private refreshAll() { this.options.onRefresh({ plan: true, log: true, dietary: true, nutrition: true }); }
  private fail(message: string) { if (!this.stopped) { this.options.onError(message); this.end('error'); } }
  end(status: 'ended' | 'error' = 'ended') {
    if (this.stopped) return;
    this.send({ type: 'session-close' });
    this.stopped = true;
    this.ready = false;
    this.setup.abort();
    this.utterances.clearWatchers();
    this.turns.stop();
    clearTimeout(this.startup);
    clearTimeout(this.limit);
    clearInterval(this.clock);
    void this.audio?.stop().catch(() => undefined);
    const socket = this.socket;
    if (socket) {
      socket.onmessage = null; socket.onopen = null; socket.onerror = null; socket.onclose = null;
      // Give Gateway a short window to finalize usage after session-close.
      setTimeout(() => socket.close(), 500);
    }
    this.refreshAll();
    this.options.onTurnEnd();
    this.update(status);
  }
}
