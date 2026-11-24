import { useRef, useState, type ReactNode } from 'react';
import { Text, TextInput, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

import { useSupportUpload } from '../hooks/use-support';
import { MAX_ATTACHMENTS, MAX_MESSAGE_LENGTH, replyTicketSchema, type ReplyTicketInput } from '../types/support.schema';
import { supportError } from '../utils/support-error';
import { SupportAttachments, type PendingAttachment } from './support-attachments';
import { SupportButton, SupportText, ui } from './support-ui';

export function SupportMessageForm({ label, title = 'Trả lời Vedora', hint, pending, onSend, children }: { label: string; title?: string; hint?: string; pending: boolean; onSend: (input: ReplyTicketInput) => Promise<void>; children?: ReactNode }) {
  const theme = useTheme();
  const upload = useSupportUpload();
  const [body, setBody] = useState('');
  const [images, setImages] = useState<PendingAttachment[]>([]);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const busy = pending || upload.isPending;
  async function addImage() {
    if (lock.current || pending || images.length >= MAX_ATTACHMENTS) return;
    lock.current = true;
    setError('');
    try {
      const image = await upload.mutateAsync();
      if (image) setImages((previous) => [...previous, image]);
    } catch (error) { setError(supportError(error)); }
    finally { lock.current = false; }
  }
  async function send() {
    if (lock.current || busy) return;
    lock.current = true;
    setError('');
    try {
      const input = replyTicketSchema.parse({ body, attachmentIds: images.map((image) => image.id) });
      await onSend(input);
      setBody(''); setImages([]);
    } catch (error) { setError(supportError(error)); }
    finally { lock.current = false; }
  }
  return <View style={[ui.card, { borderColor: theme.border, backgroundColor: theme.card }]}>
    <Text accessibilityRole="header" style={[ui.heading, { color: theme.foreground }]}>{title}</Text>
    {hint ? <SupportText muted small>{hint}</SupportText> : null}
    {children}
    <TextInput accessibilityLabel="Nội dung yêu cầu hoặc phản hồi" value={body} onChangeText={setBody} multiline maxLength={MAX_MESSAGE_LENGTH} editable={!busy}
      placeholder="Trình bày nội dung bạn cần hỗ trợ…" placeholderTextColor={theme.mutedForeground}
      style={[ui.input, ui.multiline, { color: theme.foreground, borderColor: theme.border, backgroundColor: theme.background }]} />
    <View style={{ alignItems: 'flex-end' }}><SupportText muted small>{body.length}/{MAX_MESSAGE_LENGTH} ký tự</SupportText></View>
    <SupportAttachments images={images} busy={busy} onAdd={() => void addImage()} onRemove={(id) => setImages((previous) => previous.filter((image) => image.id !== id))} />
    {error ? <SupportText error>{error}</SupportText> : null}
    <SupportButton label={pending ? 'Đang gửi…' : label} icon={{ ios: 'paperplane', android: 'send', web: 'send' }} disabled={busy || (!body.trim() && !images.length)} onPress={() => void send()} />
  </View>;
}
