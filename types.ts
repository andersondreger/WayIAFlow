
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

export type KanbanColumnId = 'awaiting' | 'processing' | 'pending_payment' | 'completed';

export interface AgentProfile {
  id: string;
  name: string;
  role: string;
  avatar: string;
  status: 'online' | 'offline' | 'busy';
}

export interface InternalNote {
  id: string;
  content: string;
  agentId: string;
  timestamp: number;
}

export interface KanbanLead {
  id: string;
  name: string;
  phone: string;
  lastMessage: string;
  lastMessageTimestamp: number;
  value: number;
  avatar: string;
  columnId: KanbanColumnId;
  status: 'online' | 'offline';
  unreadCount: number;
  incidentType: 'cartao_negado' | 'pix_expirado' | 'boleto_vencido' | 'saldo_insuficiente';
  protocol: string;
  assignedAgentId?: string;
  notes: InternalNote[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent' | 'system';
  content: string;
  timestamp: string;
  type: 'text' | 'audio' | 'image' | 'document';
  mediaUrl?: string;
  caption?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'admin' | 'user';
  plan: 'Trial' | 'Pro' | 'Enterprise';
  apiKey?: string;
}

// Fixed missing Client interface used in Admin view to track customer licenses and statuses
export interface Client {
  id: string;
  name: string;
  email: string;
  plan: string;
  status: 'active' | 'trial' | 'expired';
  lastActive: string;
  remainingDays: number;
  totalSpent: number;
}
