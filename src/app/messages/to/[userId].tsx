import { useLocalSearchParams } from 'expo-router';

import { ChatScreen } from '@/features/messaging/components/chat-screen';

export default function DirectMessageRoute() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  return <ChatScreen key={userId} userId={userId} />;
}
