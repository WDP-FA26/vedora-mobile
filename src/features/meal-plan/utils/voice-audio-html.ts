// A local secure origin enables browser mic capture; no page is fetched from this address.
export const VOICE_AUDIO_ORIGIN = 'https://vedora-voice.invalid/';

/** Local Web Audio capture/playback with browser echo cancellation, matching FE web. */
export const VOICE_AUDIO_HTML = `<!doctype html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' blob:; worker-src blob:; connect-src 'none'; media-src blob:">
<title>Vedora Voice</title></head><body><script>
(() => {
  const post = (event) => window.ReactNativeWebView.postMessage(JSON.stringify(event));
  let current;
  const errorCode = (error) => error?.name === 'NotAllowedError' || error?.name === 'SecurityError' ? 'permission' : error?.name === 'NotFoundError' ? 'missing-mic' : 'unsupported';
  const interrupt = (session) => {
    for (const source of session.sources) { source.onended = null; try { source.stop(); source.disconnect(); } catch {} }
    session.sources.clear(); session.until = 0;
    post({ type: 'playback', id: session.id, sequence: session.sequence, playing: false });
  };
  const stop = async (session) => {
    if (!session || session.closed) return;
    session.closed = true;
    if (session.processor) {
      session.processor.onaudioprocess = null;
      if (session.processor.port) session.processor.port.onmessage = null;
    }
    for (const node of [session.processor, session.input, session.gain]) { try { node?.disconnect(); } catch {} }
    session.stream?.getTracks().forEach((track) => { track.onended = null; try { track.stop(); } catch {} });
    interrupt(session);
    if (session.context) { session.context.onstatechange = null; await session.context.close().catch(() => {}); }
    post({ type: 'stopped', id: session.id });
  };
  const capture = (session, samples, rate) => {
    if (session.closed || current !== session) return;
    const ratio = rate / 24000, count = Math.floor(samples.length / ratio);
    let bytes = '';
    for (let i = 0; i < count; i++) {
      const position = i * ratio, left = Math.floor(position);
      const a = samples[left] ?? 0, b = samples[Math.min(left + 1, samples.length - 1)] ?? a;
      const sample = Math.max(-1, Math.min(1, a + (b - a) * (position - left)));
      const value = Math.round(sample * (sample < 0 ? 32768 : 32767));
      bytes += String.fromCharCode(value & 255, (value >> 8) & 255);
    }
    if (bytes) post({ type: 'input', id: session.id, audio: btoa(bytes) });
  };
  const start = async (id) => {
    const previous = current;
    const session = { id, closed: false, sources: new Set(), until: 0, sequence: 0 };
    current = session;
    await stop(previous);
    if (session.closed) return;
    try {
      if (!navigator.mediaDevices?.getUserMedia || !window.AudioContext) throw new Error('Unsupported browser audio');
      session.context = new AudioContext({ sampleRate: 24000 });
      await session.context.resume();
      if (session.closed) return;
      session.stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: false });
      if (session.closed || current !== session) {
        session.stream.getTracks().forEach((track) => track.stop());
        if (session.context.state !== 'closed') await session.context.close();
        return;
      }
      session.stream.getAudioTracks().forEach((track) => { track.onended = () => { if (!session.closed) post({ type: 'error', id, code: 'interrupted' }); }; });
      session.context.onstatechange = () => { if (!session.closed && session.context.state !== 'running') post({ type: 'error', id, code: 'interrupted' }); };
      session.input = session.context.createMediaStreamSource(session.stream);
      session.gain = session.context.createGain(); session.gain.gain.value = 0;
      if (session.context.audioWorklet && window.AudioWorkletNode) {
        const code = "class Capture extends AudioWorkletProcessor { constructor() { super(); this.frame = new Float32Array(Math.round(sampleRate * 0.02)); this.offset = 0; } process(inputs) { const input = inputs[0]?.[0]; if (input) for (const value of input) { this.frame[this.offset++] = value; if (this.offset === this.frame.length) { this.port.postMessage(this.frame.buffer, [this.frame.buffer]); this.frame = new Float32Array(Math.round(sampleRate * 0.02)); this.offset = 0; } } return true; } } registerProcessor('vedora-capture', Capture);";
        const url = URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
        try {
          await session.context.audioWorklet.addModule(url);
          if (session.closed) return;
          session.processor = new AudioWorkletNode(session.context, 'vedora-capture', { channelCount: 1, channelCountMode: 'explicit' });
          session.processor.port.onmessage = (event) => capture(session, new Float32Array(event.data), session.context.sampleRate);
        } catch { /* Older WebViews use the same ScriptProcessor fallback as web. */ }
        finally { URL.revokeObjectURL(url); }
      }
      if (session.closed) return;
      if (!session.processor) {
        session.processor = session.context.createScriptProcessor(1024, 1, 1);
        session.processor.onaudioprocess = (event) => capture(session, event.inputBuffer.getChannelData(0), event.inputBuffer.sampleRate);
      }
      session.input.connect(session.processor); session.processor.connect(session.gain); session.gain.connect(session.context.destination);
      post({ type: 'started', id });
    } catch (error) {
      if (!session.closed) post({ type: 'error', id, code: errorCode(error) });
      await stop(session);
    }
  };
  window.vedoraVoice = (command) => {
    if (command.type === 'start') { void start(command.id); return; }
    const session = current;
    if (!session || session.id !== command.id) {
      if (command.type === 'stop') post({ type: 'stopped', id: command.id });
      return;
    }
    if (command.type === 'stop') { void stop(session); return; }
    if (session.closed) return;
    session.sequence = command.sequence;
    if (command.type === 'interrupt') { interrupt(session); return; }
    if (command.type !== 'play' || !session.context) return;
    try {
      const raw = atob(command.audio);
      if (!raw.length || raw.length % 2 || Math.max(session.until, session.context.currentTime) + raw.length / 48000 - session.context.currentTime > 60) throw new Error('Invalid PCM or playback backlog');
      const buffer = session.context.createBuffer(1, raw.length / 2, 24000);
      const samples = buffer.getChannelData(0);
      for (let i = 0; i < samples.length; i++) { const word = raw.charCodeAt(i * 2) | raw.charCodeAt(i * 2 + 1) << 8; samples[i] = (word >= 32768 ? word - 65536 : word) / 32768; }
      const source = session.context.createBufferSource(); source.buffer = buffer; source.connect(session.context.destination);
      session.sources.add(source);
      source.onended = () => { session.sources.delete(source); source.disconnect(); if (!session.sources.size && !session.closed) post({ type: 'playback', id: session.id, sequence: session.sequence, playing: false }); };
      session.until = Math.max(session.context.currentTime, session.until);
      source.start(session.until); session.until += buffer.duration;
      post({ type: 'playback', id: session.id, sequence: session.sequence, playing: true });
    } catch { post({ type: 'error', id: session.id, code: 'playback' }); }
  };
  window.addEventListener('pagehide', () => { void stop(current); });
  post({ type: 'ready' });
})();
</script></body></html>`;
