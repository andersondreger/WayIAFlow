
export enum AppView {
  LANDING = 'LANDING',
  LOGIN = 'LOGIN',
  CHECKOUT = 'CHECKOUT',
  DASHBOARD = 'DASHBOARD',
  CHAT_MANAGER = 'CHAT_MANAGER',
  AGENT_BUILDER = 'AGENT_BUILDER',
  CONNECTIONS = 'CONNECTIONS',
  ADMIN = 'ADMIN'
}

export type LLMModel = 'gemini-3-flash-preview' | 'gemini-3-pro-preview' | 'gemini-2.5-flash-native-audio-preview-09-2025';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'admin' | 'user';
  plan: 'Trial' | 'Pro' | 'Enterprise';
  apiKey?: string;
}

export interface KanbanLead {
  id: string;
  name: string;
  phone: string;
  lastMessage: string;
  value: number;
  avatar: string;
  columnId: 'new' | 'ai_processing' | 'human_needed' | 'won';
  status: 'online' | 'offline';
  unreadCount?: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent' | 'system';
  content: string;
  timestamp: string;
  type?: 'text' | 'audio' | 'image';
}

export interface Client {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive' | 'trial' | 'expired';
  plan: string;
  lastActive: string;
  remainingDays: number;
  totalSpent: number;
}
