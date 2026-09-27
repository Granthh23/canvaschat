import { Conversation, Message, User } from '@/types/chat';

export const CURRENT_USER: User = {
  id: 'user',
  name: 'You',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
  status: 'online',
};

// Clean platform storage - No dummy conversations or sample messages
export const MOCK_CONVERSATIONS: Conversation[] = [];
export const INITIAL_MOCK_MESSAGES: Message[] = [];
