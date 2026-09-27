export interface User {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'offline' | 'away';
  isAi?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  subtitle: string;
  avatar: string;
  roleOrType: string;
  isGroup?: boolean;
  isAi?: boolean;
  status?: 'online' | 'offline' | 'away';
}

export interface MessageReaction {
  emoji: string;
  count: number;
  users: string[]; // user IDs who reacted
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string; // 'user' or contact id
  senderName: string;
  senderAvatar?: string;
  text: string;
  createdAt: string; // ISO timestamp
  reactions?: MessageReaction[];
}

