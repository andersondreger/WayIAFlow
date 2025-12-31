
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  MessageSquare, Loader2, RefreshCw, Send, Search, Zap, 
  LayoutGrid, Clock, CheckCircle, CheckCircle2, 
  Paperclip, Mic, MoreVertical, Hash, Phone, Video, 
  CheckCheck, StickyNote, Columns, List, Tag, CreditCard, 
  Plus, History, ArrowUpRight, Target, AlertCircle, 
  Smartphone, SendHorizonal, UserCircle2
} from 'lucide-react';
import Layout from '../components/Layout.tsx';
import { AppView, KanbanLead, ChatMessage, KanbanColumnId, AgentProfile } from '../types.ts';

const AGENTS: AgentProfile[] = [
  { id: '1', name: 'Suporte Neural (IA)', role: 'Especialista em Recuperação', avatar: 'https://ui-avatars.com/api/?name=IA&background=f59e0b&color=fff', status: 'online' },
  { id: '2', name: 'Gestor WayFlow', role: 'Administrador', avatar: 'https://ui-avatars.com/api/?name=Admin&background=020617&color=fff', status: 'online' },
];

const ChatManager: React.FC<{ onLogout: () => void, onNavigate: (v: AppView) => void }> = ({ onLogout, onNavigate }) => {
  const [leads, setLeads] = useState<KanbanLead[]>([]);
  const [selectedLead, setSelectedLead] = useState<KanbanLead | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSyncingMessages, setIsSyncingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [activeFilter, setActiveFilter] = useState<KanbanColumnId | 'all'>('all');
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const config = JSON.parse(localStorage.getItem('wayflow_evo_config') || '{"evoUrl":"", "evoKey":""}');
  const activeInstanceName = localStorage.getItem('wayflow_last_instance') || '';

  // 1. SINCRONIZAÇÃO DE CONTATOS (ESTÁVEL)
  const syncLeads = useCallback(async () => {
    if (!config.evoUrl || !activeInstanceName) return;
    setIsSyncing(true);

    try {
      const baseUrl = config.evoUrl.replace(/\/$/, '');
      const response = await fetch(`${baseUrl}/chat/findMany/${activeInstanceName}`, {
        headers: { 'apikey': config.evoKey, 'Content-Type': 'application/json' }
      });

      if (!response.ok) throw new Error("Falha na resposta da API");
      const data = await response.json();
      
      // A Evolution API v2 pode retornar os chats diretamente ou dentro de .data
      const rawChats = Array.isArray(data) ? data : (data.data || []);

      const mapped = rawChats
        .filter((c: any) => c.id && !c.id.includes('@g.us')) // Filtra apenas contatos privados
        .map((c: any) => ({
          id: c.id,
          name: c.pushName || c.name || c.id.split('@')[0],
          phone: c.id.split('@')[0],
          lastMessage: c.lastMessage || 'Sem mensagens recentes',
          lastMessageTimestamp: c.messageTimestamp || Date.now() / 1000,
          value: Math.floor(Math.random() * 500) + 150,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(c.pushName || 'U')}&background=random`,
          columnId: 'awaiting',
          status: 'online',
          unreadCount: c.unreadCount || 0,
          incidentType: 'cartao_negado',
          protocol: `WF-${Math.floor(1000 + Math.random() * 9000)}`,
          notes: []
        }));

      setLeads(mapped);
    } catch (err) {
      console.error("Erro na sincronização:", err);
      // Fallback para não deixar a tela vazia em ambiente de teste
      if (leads.length === 0) {
        setLeads([{ 
          id: 'demo', name: 'Lead de Teste (API Offline)', phone: '00000000', 
          lastMessage: 'Aguardando conexão real...', lastMessageTimestamp: Date.now()/1000, 
          value: 0, avatar: 'https://i.pravatar.cc/150?u=demo', columnId: 'awaiting', 
          status: 'offline', unreadCount: 0, incidentType: 'cartao_negado', protocol: 'DEMO', notes: [] 
        }]);
      }
    } finally {
      setIsSyncing(false);
    }
  }, [config.evoUrl, config.evoKey, activeInstanceName]);

  // 2. BUSCA DE MENSAGENS DO LEAD
  const fetchMessages = useCallback(async (leadId: string) => {
    if (!config.evoUrl || !activeInstanceName) return;
    setIsSyncingMessages(true);

    try {
      const baseUrl = config.evoUrl.replace(/\/$/, '');
      const response = await fetch(`${baseUrl}/chat/findMessages/${activeInstanceName}?number=${leadId.split('@')[0]}&count=15`, {
        headers: { 'apikey': config.evoKey, 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        const rawMsgs = Array.isArray(data) ? data : (data.messages || data.data || []);
        
        const mapped = rawMsgs.map((m: any) => ({
          id: m.key?.id || Math.random().toString(),
          sender: m.key?.fromMe ? 'agent' : 'user',
          content: m.message?.conversation || m.message?.extendedTextMessage?.text || 'Mídia/Outro',
          timestamp: new Date(m.messageTimestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'text'
        })).reverse();

        setMessages(mapped);
      }
    } catch (e) {
      console.error("Erro ao buscar mensagens:", e);
    } finally {
      setIsSyncingMessages(false);
    }
  }, [config.evoUrl, config.evoKey, activeInstanceName]);

  useEffect(() => { syncLeads(); }, [syncLeads]);

  useEffect(() => {
    if (selectedLead) fetchMessages(selectedLead.id);
  }, [selectedLead, fetchMessages]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedLead || !config.evoUrl) return;
    setIsSending(true);

    const text = newMessage;
    setNewMessage('');

    try {
      const baseUrl = config.evoUrl.replace(/\/$/, '');
      const response = await fetch(`${baseUrl}/message/sendText/${activeInstanceName}`, {
        method: 'POST',
        headers: { 'apikey': config.evoKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: selectedLead.id, text, delay: 500 })
      });

      if (response.ok) {
        setMessages(prev => [...prev, {
          id: Date.now().toString(), sender: 'agent', content: text, 
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), type: 'text'
        }]);
      }
    } catch (e) {
      alert("Erro ao enviar. Verifique sua conexão.");
    } finally {
      setIsSending(false);
    }
  };

  const filteredLeads = leads.filter(l => activeFilter === 'all' || l.columnId === activeFilter);

  return (
    <Layout activeView={AppView.CHAT_MANAGER} onNavigate={onNavigate} onLogout={onLogout}>
      <div className="h-full flex flex-col bg-[#010413] rounded-[2rem] border border-white/5 overflow-hidden shadow-2xl">
        
        {/* TOP HEADER */}
        <header className="h-20 px-8 border-b border-white/5 flex items-center justify-between bg-black/20 shrink-0">
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg"><Zap size={20} className="text-white" /></div>
                <h2 className="text-xl font-black text-white italic tracking-tighter uppercase">WayFlow Desk</h2>
             </div>
             <div className="h-8 w-px bg-white/5" />
             <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">{activeInstanceName || 'Nenhuma Instância Ativa'}</span>
             </div>
          </div>
          <button onClick={syncLeads} disabled={isSyncing} className="p-3 bg-white/5 text-slate-400 hover:text-white rounded-xl transition-all border border-white/5">
             <RefreshCw size={18} className={isSyncing ? 'animate-spin text-orange-500' : ''} />
          </button>
        </header>

        <div className="flex-1 flex overflow-hidden">
           
           {/* COL 1: FILTROS */}
           <div className="w-64 border-r border-white/5 bg-[#020617] shrink-0 p-6 space-y-8 overflow-y-auto custom-scrollbar">
              <section className="space-y-4">
                 <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Atendente</h3>
                 {AGENTS.map(a => (
                   <div key={a.id} className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                      <img src={a.avatar} className="w-8 h-8 rounded-lg" />
                      <div className="min-w-0">
                         <p className="text-xs font-black text-white truncate">{a.name}</p>
                         <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest">Disponível</p>
                      </div>
                   </div>
                 ))}
              </section>
              <section className="space-y-2">
                 <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4">Pipeline</h3>
                 <FilterItem active={activeFilter === 'all'} onClick={() => setActiveFilter('all')} icon={LayoutGrid} label="Todos" />
                 <FilterItem active={activeFilter === 'awaiting'} onClick={() => setActiveFilter('awaiting')} icon={Clock} label="Aguardando" color="text-rose-500" />
                 <FilterItem active={activeFilter === 'processing'} onClick={() => setActiveFilter('processing')} icon={Zap} label="Em Aberto" color="text-amber-500" />
                 <FilterItem active={activeFilter === 'completed'} onClick={() => setActiveFilter('completed')} icon={CheckCircle} label="Finalizados" color="text-emerald-500" />
              </section>
           </div>

           {/* COL 2: LISTA DE CHATS */}
           <div className="w-80 border-r border-white/5 bg-[#010413] shrink-0 flex flex-col">
              <div className="p-5 border-b border-white/5">
                 <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-800" size={14} />
                    <input placeholder="Buscar lead..." className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs text-white outline-none focus:border-orange-500" />
                 </div>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                 {filteredLeads.map(lead => (
                   <div 
                    key={lead.id} 
                    onClick={() => setSelectedLead(lead)}
                    className={`p-5 border-b border-white/5 cursor-pointer transition-all hover:bg-white/[0.03] relative ${selectedLead?.id === lead.id ? 'bg-orange-600/5' : ''}`}
                   >
                      {selectedLead?.id === lead.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-600 shadow-[0_0_15px_#ea580c]" />}
                      <div className="flex items-center gap-4">
                         <div className="relative">
                            <img src={lead.avatar} className="w-11 h-11 rounded-xl border border-white/10" />
                            {lead.unreadCount > 0 && <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-[8px] font-black w-5 h-5 flex items-center justify-center rounded-full border border-white/10">{lead.unreadCount}</span>}
                         </div>
                         <div className="min-w-0 flex-1">
                            <h4 className="text-[13px] font-black text-white truncate uppercase italic">{lead.name}</h4>
                            <p className="text-[11px] text-slate-600 truncate italic">"{lead.lastMessage}"</p>
                         </div>
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           {/* COL 3: ÁREA DE MENSAGENS */}
           <div className="flex-1 flex flex-col bg-[#01020a] min-w-0 border-r border-white/5 overflow-hidden">
              {selectedLead ? (
                <>
                   <header className="h-20 px-8 border-b border-white/5 flex items-center justify-between bg-black/20 shrink-0">
                      <div className="flex items-center gap-4">
                         <img src={selectedLead.avatar} className="w-12 h-12 rounded-xl border border-white/10" />
                         <div>
                            <h3 className="text-lg font-black text-white italic uppercase tracking-tighter leading-none">{selectedLead.name}</h3>
                            <p className="text-[9px] font-black text-slate-700 uppercase tracking-widest mt-1.5">{selectedLead.protocol}</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-2">
                         <button className="p-3 bg-white/5 text-slate-600 hover:text-white rounded-xl border border-white/5"><Phone size={18} /></button>
                         <button className="p-3 bg-white/5 text-slate-600 hover:text-white rounded-xl border border-white/5"><MoreVertical size={18} /></button>
                      </div>
                   </header>

                   <div ref={scrollRef} className="flex-1 p-10 overflow-y-auto space-y-8 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] custom-scrollbar">
                      {isSyncingMessages ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-30 gap-4">
                           <Loader2 size={32} className="animate-spin text-orange-500" />
                           <p className="text-[10px] font-black uppercase tracking-widest">Sincronizando Histórico...</p>
                        </div>
                      ) : (
                        messages.map((msg, i) => (
                          <div key={i} className={`flex w-full ${msg.sender === 'agent' ? 'justify-end' : 'justify-start'}`}>
                             <div className={`max-w-[75%] p-5 rounded-[2rem] text-[14px] leading-relaxed shadow-2xl ${msg.sender === 'agent' ? 'bg-orange-600 text-white rounded-tr-none' : 'bg-slate-900 text-slate-100 rounded-tl-none border border-white/5'}`}>
                                {msg.content}
                                <div className="flex items-center gap-2 mt-2 opacity-50 justify-end">
                                   <span className="text-[8px] font-black uppercase">{msg.timestamp}</span>
                                   {msg.sender === 'agent' && <CheckCheck size={10} />}
                                </div>
                             </div>
                          </div>
                        ))
                      )}
                   </div>

                   <footer className="p-6 border-t border-white/5 bg-black/40">
                      <div className="flex items-end gap-4 bg-white/[0.02] p-3 rounded-[2.5rem] border border-white/10">
                         <button className="p-4 text-slate-700 hover:text-orange-500"><Paperclip size={24} /></button>
                         <textarea 
                           rows={1}
                           value={newMessage}
                           onChange={(e) => setNewMessage(e.target.value)}
                           onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                           placeholder="Sua resposta neural..." 
                           className="flex-1 bg-transparent border-none py-4 px-2 text-white text-[15px] outline-none resize-none max-h-32 custom-scrollbar" 
                         />
                         <button 
                           onClick={handleSendMessage}
                           disabled={!newMessage.trim() || isSending}
                           className={`p-5 rounded-full shadow-2xl transition-all ${newMessage.trim() ? 'bg-orange-600 text-white shadow-orange-600/30' : 'bg-white/5 text-slate-800'}`}
                         >
                            {isSending ? <Loader2 className="animate-spin" size={24} /> : <SendHorizonal size={24} />}
                         </button>
                      </div>
                   </footer>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center opacity-20">
                   <Target size={96} strokeWidth={1} />
                   <p className="text-xs font-black uppercase tracking-[0.4em] mt-8">Selecione um contato para atendimento</p>
                </div>
              )}
           </div>

           {/* COL 4: SIDEBAR CRM */}
           {selectedLead && (
             <aside className="hidden xl:flex w-96 flex-col bg-[#020617] p-10 shrink-0 overflow-y-auto custom-scrollbar">
                <div className="text-center mb-10">
                   <img src={selectedLead.avatar} className="w-28 h-28 mx-auto mb-6 rounded-[2.5rem] border-2 border-white/10 shadow-2xl" />
                   <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">{selectedLead.name}</h3>
                   <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest mt-2">+{selectedLead.phone}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-10">
                   <div className="bg-white/5 p-5 rounded-3xl border border-white/5 text-left">
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Ticket</p>
                      <p className="text-lg font-black text-white">R$ {selectedLead.value.toFixed(2)}</p>
                   </div>
                   <div className="bg-white/5 p-5 rounded-3xl border border-white/5 text-left">
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Incidente</p>
                      <p className="text-[10px] font-black text-rose-500 uppercase truncate italic">CARD_DECLINED</p>
                   </div>
                </div>

                <section className="flex-1 space-y-8">
                   <h4 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2"><History size={16} className="text-orange-500" /> Histórico</h4>
                   <div className="space-y-6">
                      <TimelineItem label="Checkout Abandonado" time="15m atrás" icon={Smartphone} />
                      <TimelineItem label="Alerta Disparado" time="14m atrás" icon={AlertCircle} color="text-rose-500" />
                   </div>
                </section>

                <button className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-3 mt-10">
                   <CheckCircle2 size={20} /> Concluir Lead
                </button>
             </aside>
           )}
        </div>
      </div>
    </Layout>
  );
};

const FilterItem: React.FC<{ active: boolean, onClick: () => void, icon: any, label: string, color?: string }> = ({ active, onClick, icon: Icon, label, color = "text-white" }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all ${active ? 'bg-orange-600/10 border border-orange-500/20 shadow-lg' : 'hover:bg-white/[0.02] border border-transparent'}`}>
     <Icon size={16} className={active ? color : 'text-slate-800'} />
     <span className={`text-[10px] font-black uppercase tracking-widest ${active ? 'text-white' : 'text-slate-600'}`}>{label}</span>
  </button>
);

const TimelineItem: React.FC<{ label: string, time: string, icon: any, color?: string }> = ({ label, time, icon: Icon, color = "text-emerald-500" }) => (
  <div className="flex items-center gap-4">
     <div className={`w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center ${color} border border-white/5`}>
        <Icon size={14} />
     </div>
     <div className="min-w-0">
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-tight truncate">{label}</p>
        <p className="text-[9px] text-slate-800 font-bold">{time}</p>
     </div>
  </div>
);

export default ChatManager;
