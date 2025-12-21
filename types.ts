
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

export interface Client {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive' | 'trial' | 'expired';
  plan: 'Free Trial' | 'Basic' | 'Pro' | 'Enterprise';
  lastActive: string;
  trialStartDate: string; // ISO Date
  remainingDays: number;
  totalSpent: number;
}

export interface Integration {
  id: string;
  name: string;
  type: 'n8n' | 'evolution' | 'custom';
  status: 'connected' | 'disconnected' | 'pending';
  lastSync: string;
  apiUrl?: string;
  apiKey?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent' | 'system';
  content: string;
  timestamp: string;
}

export interface KanbanLead {
  id: string;
  name: string;
  lastMessage: string;
  value: number;
  avatar: string;
  columnId: 'new' | 'chatting' | 'followup' | 'won';
}
