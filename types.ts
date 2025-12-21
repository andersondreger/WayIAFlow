
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

export interface Client {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive' | 'trial' | 'expired';
  plan: 'Free Trial' | 'Basic' | 'Pro' | 'Enterprise';
  lastActive: string;
  trialStartDate: string;
  remainingDays: number;
  totalSpent: number;
}

export interface Integration {
  id: string;
  name: string;
  type: 'n8n' | 'evolution' | 'llm';
  status: 'connected' | 'disconnected' | 'pending';
  apiUrl: string;
  apiKey: string;
  secret?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent' | 'system';
  content: string;
  timestamp: string;
  type?: 'text' | 'audio' | 'image';
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
}
