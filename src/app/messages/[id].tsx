import { useLocalSearchParams } from 'expo-router';

import { ChatScreen } from '@/features/messaging/components/chat-screen';

export default function ConversationRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ChatScreen key={id} conversationId={id} />;
}
