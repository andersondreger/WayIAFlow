
import React, { useState, useEffect } from 'react';
import { 
  Search, MessageCircle, MoreVertical, Smartphone, Users, Zap, CheckCircle2, 
  Clock, Loader2, RefreshCw, Send, Mic, Paperclip, Smile, ShieldCheck, 
  ChevronLeft, Info, ExternalLink
} from 'lucide-react';
import Layout from '../components/Layout.tsx';
import { AppView, KanbanLead, ChatMessage } from '../types.ts';

const ChatManager: React.FC<{ onLogout: () => void, onNavigate: (v: AppView) => void }> = ({ onLogout, onNavigate }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedLead, setSelectedLead] = useState<KanbanLead | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  
  const mockLeads: KanbanLead[] = [
    { id: '1', name: 'Marcos Silva', lastMessage: 'Como funciona o Pix?', value: 297, avatar: 'https://picsum.photos/seed/1/40/40', columnId: 'new' },
    { id: '2', name: 'Julia Paes', lastMessage: 'Link expirado.', value: 497, avatar: 'https://picsum.photos/seed/2/40/40', columnId: 'new' },
    { id: '3', name: 'Sérgio Lopez', lastMessage: 'Vou pagar amanhã.', value: 997, avatar: 'https://picsum.photos/seed/3/40/40', columnId: 'chatting' },
    { id: '4', name: 'Ana Bia', lastMessage: 'Obrigado!', value: 127, avatar: 'https://picsum.photos/seed/4/40/40', columnId: 'won' },
  ];

  const [leads, setLeads] = useState<KanbanLead[]>(mockLeads);

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      // Aqui o sistema buscaria dados reais da Evolution API via n8n/Supabase
    }, 2000);
  };

  const handleSelectLead = (lead: KanbanLead) => {
    setSelectedLead(lead);
    // Simula carregamento de histórico
    setChatHistory([
      { id: '1', sender: 'user', content: lead.lastMessage, timestamp: '10:30' },
      { id: '2', sender: 'agent', content: 'Olá! Sou a IA da WayFlow. Vou te ajudar com isso agora mesmo.', timestamp: '10:31' }
    ]);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    const msg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'agent',
      content: newMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setChatHistory([...chatHistory, msg]);
    setNewMessage('');
  };

  const columns = [
    { id: 'new', label: 'Novos Leads', color: 'bg-orange-500', icon: Smartphone },
    { id: 'chatting', label: 'Em Atendimento', color: 'bg-purple-500', icon: MessageCircle },
    { id: 'followup', label: 'Follow-up', color: 'bg-blue-500', icon: Clock },
    { id: 'won', label: 'Convertidos', color: 'bg-emerald-500', icon: CheckCircle2 },
  ];

  return (
    <Layout activeView={AppView.CHAT_MANAGER} onNavigate={onNavigate} onLogout={onLogout}>
      <div className="h-full flex flex-col space-y-6">
        {/* Header de Atendimento */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tighter italic">Central de Atendimento.</h1>
            <p className="text-slate-500 text-sm font-medium">Gestão de conversas via Evolution API & Agentes Neurais.</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handleSync}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-xs font-black uppercase tracking-widest text-slate-300 transition-all"
            >
              {isSyncing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              Sincronizar API
            </button>
            <button className="flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-orange-600/20 transition-all">
              <Zap size={14} /> Ativar IA em Massa
            </button>
          </div>
        </div>

        <div className="flex-1 flex gap-6 overflow-hidden">
          {/* Kanban / Lista de Leads */}
          <div className={`flex-1 flex gap-6 overflow-x-auto pb-4 custom-scrollbar transition-all ${selectedLead ? 'hidden xl:flex' : 'flex'}`}>
            {columns.map((col) => (
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
                  {leads.filter(l => l.columnId === col.id).map((lead) => (
                    <div 
                      key={lead.id}
                      onClick={() => handleSelectLead(lead)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer group animate-in slide-in-from-bottom-2 ${
                        selectedLead?.id === lead.id 
                        ? 'bg-orange-600/10 border-orange-500/50 shadow-lg shadow-orange-500/5' 
                        : 'bg-white/[0.02] border-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="relative">
                          <img src={lead.avatar} className="w-10 h-10 rounded-full border border-white/10" alt="" />
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#020617] rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-slate-500 uppercase">Valor</p>
                          <p className="text-xs font-black text-emerald-500">R$ {lead.value}</p>
                        </div>
                      </div>
                      <h4 className="text-white font-bold text-sm mb-1">{lead.name}</h4>
                      <p className="text-slate-500 text-[11px] line-clamp-1 font-medium italic">"{lead.lastMessage}"</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Interface de Chat Detalhada */}
          {selectedLead ? (
            <div className="flex-1 lg:flex-none lg:w-[450px] xl:w-[600px] bg-[#020617] border border-white/5 rounded-[2.5rem] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-right-4 duration-500">
              {/* Top Bar Chat */}
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                <div className="flex items-center gap-4">
                  <button onClick={() => setSelectedLead(null)} className="xl:hidden p-2 text-slate-400"><ChevronLeft /></button>
                  <img src={selectedLead.avatar} className="w-12 h-12 rounded-2xl border border-white/10" alt="" />
                  <div>
                    <h3 className="text-white font-black tracking-tight">{selectedLead.name}</h3>
                    <div className="flex items-center gap-2">
                       <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                       <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">WhatsApp Online</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                   <button className="p-2.5 rounded-xl bg-white/5 text-slate-400 hover:text-white transition-all"><Info size={18} /></button>
                   <button className="p-2.5 rounded-xl bg-white/5 text-slate-400 hover:text-white transition-all"><MoreVertical size={18} /></button>
                </div>
              </div>

              {/* Mensagens */}
              <div className="flex-1 p-8 overflow-y-auto custom-scrollbar space-y-6 bg-[radial-gradient(circle_at_top_right,_rgba(245,158,11,0.03),_transparent)]">
                {chatHistory.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender === 'agent' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-4 rounded-3xl text-sm font-medium leading-relaxed ${
                      msg.sender === 'agent' 
                      ? 'bg-orange-600 text-white rounded-tr-none' 
                      : 'bg-white/5 text-slate-300 border border-white/5 rounded-tl-none'
                    }`}>
                      {msg.content}
                      <p className={`text-[9px] mt-2 font-black uppercase tracking-widest opacity-50 ${msg.sender === 'agent' ? 'text-right' : 'text-left'}`}>
                        {msg.timestamp} • {msg.sender === 'agent' ? 'IA Ativa' : 'Lead'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input Area */}
              <div className="p-6 bg-white/[0.02] border-t border-white/5">
                 <form onSubmit={handleSendMessage} className="relative">
                    <div className="flex items-center gap-4">
                       <div className="flex gap-2">
                          <button type="button" className="p-3 bg-white/5 rounded-xl text-slate-500 hover:text-white transition-all"><Paperclip size={20} /></button>
                          <button type="button" className="p-3 bg-white/5 rounded-xl text-slate-500 hover:text-white transition-all"><Mic size={20} /></button>
                       </div>
                       <input 
                          type="text" 
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Digite sua mensagem ou deixe a IA responder..."
                          className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-all placeholder:text-slate-700"
                       />
                       <button type="submit" className="p-4 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl shadow-xl shadow-orange-600/20 transition-all active:scale-95">
                          <Send size={20} />
                       </button>
                    </div>
                 </form>
                 <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <div className="px-3 py-1 bg-orange-500/10 text-orange-500 rounded-full border border-orange-500/20 text-[9px] font-black uppercase tracking-widest">IA Co-Pilot On</div>
                       <div className="px-3 py-1 bg-white/5 text-slate-500 rounded-full border border-white/5 text-[9px] font-black uppercase tracking-widest italic">Evolution API Node A</div>
                    </div>
                    <button className="text-[9px] font-black text-slate-600 uppercase tracking-widest hover:text-orange-500 transition-colors">Ver Log de Automação</button>
                 </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[3rem] p-20 text-center space-y-6">
               <div className="relative">
                  <div className="absolute -inset-10 bg-orange-500/5 blur-3xl rounded-full" />
                  <div className="relative w-32 h-32 bg-white/[0.02] border border-white/5 rounded-full flex items-center justify-center text-slate-800">
                    <MessageCircle size={64} strokeWidth={1} />
                  </div>
               </div>
               <div>
                  <h3 className="text-2xl font-black text-white mb-2 italic tracking-tighter">Selecione um Atendimento.</h3>
                  <p className="text-slate-500 text-sm max-w-sm mx-auto font-medium">Clique em um lead no Kanban para iniciar a supervisão manual ou ativar a resposta neural.</p>
               </div>
               <div className="flex gap-4">
                  <div className="px-4 py-2 bg-white/5 border border-white/5 rounded-xl flex items-center gap-2">
                     <ShieldCheck size={14} className="text-emerald-500" />
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sessão Criptografada</span>
                  </div>
               </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ChatManager;
