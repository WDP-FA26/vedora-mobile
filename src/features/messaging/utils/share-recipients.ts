import type { ProfileSummary } from '@/features/profile/types/profile.schema';

import type { Conversation } from '../types/messaging.schema';

export function shareRecipients(conversations: Conversation[], following: ProfileSummary[], selfId: string, filter: string) {
  const recipients = new Map<string, { peer: Pick<ProfileSummary, 'id' | 'fullName' | 'username' | 'avatarUrl' | 'isProfessional'>; conversationId: string | null; canSend: boolean }>(following.map((peer) => [peer.id, { peer, conversationId: null, canSend: true }]));
  // Conversation permissions take precedence, including suspended accounts and pending requests.
  for (const conversation of conversations) recipients.set(conversation.peer.id, {
    peer: conversation.peer, conversationId: conversation.id, canSend: conversation.canSend,
  });
  const normalize = (text: string) => text.toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
  const query = normalize(filter.trim());
  return [...recipients.values()].filter(({ peer }) => peer.id !== selfId && normalize(`${peer.fullName} ${peer.username}`).includes(query));
}
