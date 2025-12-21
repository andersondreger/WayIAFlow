
import React, { useState, useEffect } from 'react';
import { 
  Search, MessageCircle, MoreVertical, Smartphone, Users, Zap, CheckCircle2, 
  Clock, Loader2, RefreshCw, Send, Mic, Paperclip, Smile, ShieldCheck, 
  ChevronLeft, Info, Phone, Video, MoreHorizontal, UserCircle2
} from 'lucide-react';
import Layout from '../components/Layout.tsx';
import { AppView, KanbanLead, ChatMessage } from '../types.ts';

const ChatManager: React.FC<{ onLogout: () => void, onNavigate: (v: AppView) => void }> = ({ onLogout, onNavigate }) => {
  const [selectedLead, setSelectedLead] = useState<KanbanLead | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [leads, setLeads] = useState<KanbanLead[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Simula a sincronização vindo da Evolution API
  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      const mockLeads: KanbanLead[] = [
        { id: '1', name: 'Ricardo Santos', phone: '+55 11 98822-1100', lastMessage: 'Como funciona o desconto de checkout?', value: 497, avatar: 'https://picsum.photos/seed/1/100/100', columnId: 'new', status: 'online' },
        { id: '2', name: 'Mariana Lima', phone: '+55 21 97711-2233', lastMessage: 'O áudio que você enviou me ajudou.', value: 997, avatar: 'https://picsum.photos/seed/2/100/100', columnId: 'ai_processing', status: 'online' },
        { id: '3', name: 'Gerson Oliveira', phone: '+55 31 96655-4422', lastMessage: 'Quero falar com um humano.', value: 1200, avatar: 'https://picsum.photos/seed/3/100/100', columnId: 'human_needed', status: 'offline' },
        { id: '4', name: 'Beatriz Costa', phone: '+55 41 95544-3322', lastMessage: 'Pagamento confirmado!', value: 297, avatar: 'https://picsum.photos/seed/4/100/100', columnId: 'won', status: 'online' },
      ];
      setLeads(mockLeads);
      setIsSyncing(false);
    }, 2000);
  };

  const loadChat = (lead: KanbanLead) => {
    setSelectedLead(lead);
    setMessages([
      { id: '1', sender: 'user', content: 'Olá, vi seu produto mas o boleto não gerou.', timestamp: '14:20' },
      { id: '2', sender: 'agent', content: 'Olá Ricardo! Sou a IA da WayFlow. Já estou resolvendo seu acesso agora mesmo.', timestamp: '14:21' },
      { id: '3', sender: 'user', content: lead.lastMessage, timestamp: '14:25' }
    ]);
  };

  const columns = [
    { id: 'new', label: 'Novos Leads', color: 'bg-orange-500' },
    { id: 'ai_processing', label: 'IA Atendendo', color: 'bg-purple-500' },
    { id: 'human_needed', label: 'Suporte Humano', color: 'bg-red-500' },
    { id: 'won', label: 'Convertidos', color: 'bg-emerald-500' },
  ];

  return (
    <Layout activeView={AppView.CHAT_MANAGER} onNavigate={onNavigate} onLogout={onLogout}>
      <div className="h-full flex flex-col gap-6 animate-in fade-in duration-500">
        
        {/* Chat Header Control */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tighter italic">Fluxo de Atendimento.</h1>
            <p className="text-slate-500 text-sm font-medium">Gerencie suas conversas do WhatsApp Web em tempo real.</p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
             <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                <input placeholder="Buscar contato..." className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-orange-500 transition-all" />
             </div>
             <button 
                onClick={handleSync}
                className="px-6 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-orange-600/20 transition-all flex items-center gap-2"
             >
                {isSyncing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} Sincronizar WhatsApp
             </button>
          </div>
        </div>

        <div className="flex-1 flex gap-6 overflow-hidden">
          {/* Kanban Sidebar */}
          <div className={`flex-1 flex gap-6 overflow-x-auto pb-4 custom-scrollbar ${selectedLead ? 'hidden xl:flex' : 'flex'}`}>
            {columns.map(col => (
              <div key={col.id} className="flex-none w-80 flex flex-col gap-4">
                <div className="flex items-center justify-between px-2">
                   <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${col.color}`} />
                      <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">{col.label}</span>
                   </div>
                   <span className="text-[10px] font-black text-slate-600 bg-white/5 px-2 py-0.5 rounded-full">
                     {leads.filter(l => l.columnId === col.id).length}
                   </span>
                </div>
                
                <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-2">
                  {leads.filter(l => l.columnId === col.id).map(lead => (
                    <div 
                      key={lead.id}
                      onClick={() => loadChat(lead)}
                      className={`p-4 rounded-3xl border transition-all cursor-pointer group ${selectedLead?.id === lead.id ? 'bg-orange-600/10 border-orange-500/50' : 'bg-white/[0.02] border-white/5 hover:border-white/20'}`}
                    >
                      <div className="flex items-center gap-4 mb-3">
                         <div className="relative">
                            <img src={lead.avatar} className="w-10 h-10 rounded-2xl border border-white/10" alt="" />
                            {lead.status === 'online' && <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#020617] rounded-full" />}
                         </div>
                         <div className="flex-1 min-w-0">
                            <h4 className="text-white font-black text-sm truncate">{lead.name}</h4>
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{lead.phone}</p>
                         </div>
                      </div>
                      <p className="text-slate-500 text-[11px] font-medium line-clamp-1 italic">"{lead.lastMessage}"</p>
                      <div className="mt-4 flex items-center justify-between">
                         <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/5 px-2 py-0.5 rounded-lg border border-emerald-500/10">R$ {lead.value}</span>
                         <div className="flex -space-x-2">
                            <div className="w-5 h-5 rounded-full bg-orange-600 flex items-center justify-center text-[8px] border border-[#020617]"><Zap size={10} /></div>
                            <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[8px] border border-[#020617]"><Smartphone size={10} /></div>
                         </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Full Chat Window */}
          {selectedLead ? (
            <div className="flex-1 flex flex-col bg-[#020617] border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl animate-in slide-in-from-right-6 duration-700">
              {/* Chat Header */}
              <div className="p-6 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <button onClick={() => setSelectedLead(null)} className="xl:hidden p-2 text-slate-500"><ChevronLeft /></button>
                   <img src={selectedLead.avatar} className="w-12 h-12 rounded-2xl border border-white/10" alt="" />
                   <div>
                      <h3 className="text-white font-black tracking-tight">{selectedLead.name}</h3>
                      <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Sincronizado via Evolution
                      </p>
                   </div>
                </div>
                <div className="flex items-center gap-3">
                   <button className="p-3 bg-white/5 rounded-2xl text-slate-400 hover:text-white transition-all"><Phone size={18} /></button>
                   <button className="p-3 bg-white/5 rounded-2xl text-slate-400 hover:text-white transition-all"><Video size={18} /></button>
                   <button className="p-3 bg-white/5 rounded-2xl text-slate-400 hover:text-white transition-all"><MoreHorizontal size={18} /></button>
                </div>
              </div>

              {/* Chat Content */}
              <div className="flex-1 p-10 overflow-y-auto custom-scrollbar space-y-8 bg-[radial-gradient(circle_at_top_right,_rgba(245,158,11,0.03),_transparent)]">
                 {messages.map(msg => (
                   <div key={msg.id} className={`flex ${msg.sender === 'agent' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] space-y-2`}>
                         <div className={`p-5 rounded-[2.5rem] text-sm font-medium leading-relaxed ${msg.sender === 'agent' ? 'bg-orange-600 text-white rounded-tr-none shadow-xl shadow-orange-600/10' : 'bg-white/5 text-slate-300 border border-white/10 rounded-tl-none'}`}>
                            {msg.content}
                         </div>
                         <p className={`text-[9px] font-black text-slate-600 uppercase tracking-widest px-4 ${msg.sender === 'agent' ? 'text-right' : 'text-left'}`}>
                           {msg.timestamp} • {msg.sender === 'agent' ? 'IA Neuro-Flow' : 'Cliente'}
                         </p>
                      </div>
                   </div>
                 ))}
              </div>

              {/* Chat Input */}
              <div className="p-8 bg-white/[0.01] border-t border-white/5">
                 <div className="flex items-center gap-4">
                    <div className="flex gap-2">
                       <button className="p-4 bg-white/5 rounded-2xl text-slate-500 hover:text-white transition-all"><Paperclip size={20} /></button>
                       <button className="p-4 bg-white/5 rounded-2xl text-slate-500 hover:text-white transition-all"><Mic size={20} /></button>
                    </div>
                    <div className="flex-1 relative">
                       <input 
                        placeholder="Escreva uma mensagem..."
                        className="w-full bg-white/[0.02] border border-white/10 rounded-[2rem] py-4 px-8 text-sm text-white focus:outline-none focus:border-orange-500 transition-all"
                       />
                       <button className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-orange-500"><Smile size={20} /></button>
                    </div>
                    <button className="p-5 bg-orange-600 hover:bg-orange-500 text-white rounded-[2rem] shadow-2xl shadow-orange-600/20 transition-all active:scale-95">
                       <Send size={22} />
                    </button>
                 </div>
                 <div className="mt-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/5">
                          <Zap size={12} className="text-orange-500" />
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">IA Co-Pilot Active</span>
                       </div>
                       <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/5">
                          <Smartphone size={12} className="text-emerald-500" />
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Mobile Sync</span>
                       </div>
                    </div>
                    <button className="text-[9px] font-black text-slate-700 uppercase tracking-widest hover:text-white transition-colors">Visualizar Logs n8n</button>
                 </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[3rem] text-center p-20 animate-pulse">
               <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center text-slate-800 mb-6">
                  <MessageCircle size={48} />
               </div>
               <h3 className="text-2xl font-black text-white italic tracking-tighter">Selecione uma Conversa.</h3>
               <p className="text-slate-500 text-sm max-w-xs mx-auto font-medium">Sincronize sua Evolution API para visualizar os leads do WhatsApp Web aqui.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ChatManager;
