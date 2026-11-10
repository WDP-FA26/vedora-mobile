import type { Message } from '../types/messaging.schema';

/** Pages arrive newest first; join them, drop duplicates by id and return the thread oldest first. */
export function mergeMessages(pages: { items: Message[] }[] | undefined): Message[] {
  const byId = new Map<string, Message>();
  for (const page of pages ?? []) for (const message of page.items) byId.set(message.id, message);
  return [...byId.values()].sort((a, b) => a.sequence - b.sequence);
}

/** RFC 4122 version 4 UUID, which is what the API requires for `clientMessageId`. */
export function createClientMessageId() {
  const bytes = new Uint8Array(16);
  const source = globalThis.crypto;
  if (source?.getRandomValues) source.getRandomValues(bytes);
  else for (let index = 0; index < 16; index++) bytes[index] = Math.floor(Math.random() * 256);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** Short time for lists and bubbles: hour:minute today, "Hôm qua", else day/month. */
export function formatMessageTime(value: string, now = new Date()) {
  const date = new Date(value);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  if (date.getTime() >= startOfToday) return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  if (date.getTime() >= startOfToday - dayMs) return 'Hôm qua';
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

export function messagingErrorText(error: unknown): string {
  const status = typeof error === 'object' && error !== null && 'status' in error ? Number((error as { status: unknown }).status) : 0;
  const code = typeof error === 'object' && error !== null && 'code' in error ? String((error as { code: unknown }).code) : '';
  if (code === 'MESSAGE_FOLLOW_REQUIRED') return 'Bạn cần theo dõi người này trước khi nhắn tin.';
  if (code === 'MESSAGE_ID_CONFLICT') return 'Tin nhắn này đã được gửi với nội dung khác. Hãy nhập lại rồi gửi.';
  if (status === 401) return 'Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.';
  if (status === 404) return 'Không tìm thấy người nhận hoặc cuộc trò chuyện.';
  if (status === 409) return 'Chưa gửi được do trùng lặp thao tác. Nội dung vẫn còn, hãy thử lại.';
  return 'Chưa gửi được tin nhắn. Nội dung vẫn còn để bạn thử lại.';
}
