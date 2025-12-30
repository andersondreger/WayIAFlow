
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  MessageSquare, Users, Loader2, RefreshCw, Send, Search, AlertTriangle, Zap, 
  ShieldCheck, LayoutGrid, X, Clock, DollarSign, CheckCircle, CheckCircle2, ArrowRight, Sparkles, 
  Paperclip, Mic, Image as ImageIcon, FileText, MoreVertical, Hash, UserCircle, 
  Check, CheckCheck, Play, Pause, ChevronLeft, Filter, UserCheck, Phone, Video,
  PaperclipIcon, Smile, SendHorizonal, StickyNote
} from 'lucide-react';
import Layout from '../components/Layout.tsx';
import { AppView, KanbanLead, ChatMessage, KanbanColumnId, AgentProfile } from '../types.ts';
import { GoogleGenAI } from "@google/genai";

const AGENTS: AgentProfile[] = [
  { id: '1', name: 'Suporte Neural (Bot)', role: 'Agente IA', avatar: 'https://ui-avatars.com/api/?name=IA&background=f59e0b&color=fff', status: 'online' },
  { id: '2', name: 'Ricardo Santos', role: 'Gerente de Contas', avatar: 'https://i.pravatar.cc/150?u=ricardo', status: 'online' },
  { id: '3', name: 'Carla Lima', role: 'Especialista de Checkout', avatar: 'https://i.pravatar.cc/150?u=carla', status: 'busy' },
];

const ChatManager: React.FC<{ onLogout: () => void, onNavigate: (v: AppView) => void }> = ({ onLogout, onNavigate }) => {
  const [selectedLead, setSelectedLead] = useState<KanbanLead | null>(null);
  const [leads, setLeads] = useState<KanbanLead[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [filter, setFilter] = useState<KanbanColumnId | 'all'>('all');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [activeAgent, setActiveAgent] = useState<AgentProfile>(AGENTS[0]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [config] = useState(() => {
    const saved = localStorage.getItem('wayflow_evo_config');
    return saved ? JSON.parse(saved) : { evoUrl: '', evoKey: '' };
  });

  const [selectedInstanceName] = useState(() => localStorage.getItem('wayflow_last_instance') || '');

  const getCleanUrl = useCallback(() => {
    if (!config.evoUrl) return '';
    let url = config.evoUrl.trim();
    if (!url.startsWith('http')) url = 'https://' + url;
    return url.replace(/\/+$/, "");
  }, [config.evoUrl]);

  const performFetch = async (endpoint: string, options: RequestInit = {}) => {
    try {
      const res = await fetch(endpoint, {
        ...options,
        headers: { 
          'apikey': config.evoKey.trim(), 
          'Content-Type': 'application/json', 
          ...(options.headers || {}) 
        },
        mode: 'cors'
      });
      return await res.json();
    } catch (e) { 
      console.error("Fetch Error:", e);
      return null; 
    }
  };

  const handleSync = useCallback(async () => {
    setIsSyncing(true);
    const baseUrl = getCleanUrl();
    
    // Se não houver configuração, carregamos dados mockados de alta qualidade para não travar a UI
    if (!selectedInstanceName || !baseUrl || !config.evoKey) {
      const mockLeads: KanbanLead[] = [
        { id: '5511999999999@s.whatsapp.net', name: 'Marcos Oliveira', phone: '5511999999999', lastMessage: 'Consegue melhorar o valor?', lastMessageTimestamp: Date.now()/1000 - 45, value: 497, avatar: 'https://i.pravatar.cc/150?u=1', columnId: 'awaiting', status: 'online', unreadCount: 3, incidentType: 'cartao_negado', protocol: 'WF-2025-X01', notes: [] },
        { id: '5521888888888@s.whatsapp.net', name: 'Ana Beatriz', phone: '5521888888888', lastMessage: 'Já fiz o pagamento via Pix', lastMessageTimestamp: Date.now()/1000 - 1200, value: 297, avatar: 'https://i.pravatar.cc/150?u=2', columnId: 'processing', status: 'online', unreadCount: 0, incidentType: 'pix_expirado', protocol: 'WF-2025-X02', notes: [] },
        { id: '5531777777777@s.whatsapp.net', name: 'Carlos Log', phone: '5531777777777', lastMessage: 'O boleto não chegou no e-mail', lastMessageTimestamp: Date.now()/1000 - 3600, value: 890, avatar: 'https://i.pravatar.cc/150?u=3', columnId: 'awaiting', status: 'offline', unreadCount: 1, incidentType: 'boleto_vencido', protocol: 'WF-2025-X03', notes: [] },
      ];
      setLeads(mockLeads);
      setIsSyncing(false);
      return;
    }

    try {
      // Busca chats/mensagens reais da Evolution API
      const data = await performFetch(`${baseUrl}/chat/findMessages/${selectedInstanceName}`, {
        method: 'POST',
        body: JSON.stringify({ where: {}, limit: 50 })
      });
      
      if (data && data.records) {
        const records = data.records;
        const leadsMap = new Map();
        records.forEach((m: any) => {
          const jid = m.key?.remoteJid;
          if (jid && !jid.includes('@g.us')) {
            if (!leadsMap.has(jid)) {
              leadsMap.set(jid, {
                id: jid,
                name: m.pushName || jid.split('@')[0],
                phone: jid.split('@')[0],
                lastMessage: m.message?.conversation || m.message?.extendedTextMessage?.text || "Mídia recebida",
                lastMessageTimestamp: m.messageTimestamp,
                value: 0,
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(m.pushName || 'C')}&background=random&color=fff`,
                columnId: 'awaiting',
                status: 'online',
                unreadCount: 0,
                protocol: `WF-2025-${Math.floor(1000 + Math.random() * 9000)}`,
                notes: []
              });
            }
          }
        });
        setLeads(Array.from(leadsMap.values()));
      }
    } catch (e) {
      console.error("Sync failed:", e);
    } finally {
      setIsSyncing(false);
    }
  }, [selectedInstanceName, getCleanUrl, config.evoKey]);

  useEffect(() => { handleSync(); }, [handleSync]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isTyping]);

  const sendMessage = async (type: 'text' | 'image' | 'audio' = 'text', mediaData?: string) => {
    if ((!newMessage.trim() && type === 'text') || !selectedLead) return;
    setIsSending(true);
    
    // UI Optimism: Adiciona mensagem na tela imediatamente
    const tempMsg: ChatMessage = {
      id: Math.random().toString(),
      sender: 'agent',
      content: newMessage,
      type,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages(prev => [...prev, tempMsg]);
    const currentText = newMessage;
    setNewMessage('');

    const baseUrl = getCleanUrl();
    if (baseUrl && selectedInstanceName) {
      const endpoint = type === 'text' ? 'sendText' : 'sendMedia';
      const payload = type === 'text' 
        ? { number: selectedLead.id, text: currentText, linkPreview: true }
        : { number: selectedLead.id, media: mediaData, mediaType: type };

      await performFetch(`${baseUrl}/message/${endpoint}/${selectedInstanceName}`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    }
    
    setIsSending(false);
  };

  const openChat = (lead: KanbanLead) => {
    setSelectedLead(lead);
    // Simular carregamento de mensagens do chat selecionado
    setMessages([
      { id: '1', sender: 'user', content: lead.lastMessage, type: 'text', timestamp: '14:20' },
      { id: '2', sender: 'system', content: `Protocolo Gerado: ${lead.protocol}`, type: 'text', timestamp: '14:21' }
    ]);
    
    // Marcar como lida na Evolution
    const baseUrl = getCleanUrl();
    if (baseUrl && selectedInstanceName) {
      performFetch(`${baseUrl}/chat/markRead/${selectedInstanceName}`, {
        method: 'POST',
        body: JSON.stringify({ number: lead.id, read: true })
      });
    }

    // Reset unread count localmente
    setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, unreadCount: 0 } : l));
  };

  const filteredLeads = leads.filter(l => filter === 'all' || l.columnId === filter);

  return (
    <Layout activeView={AppView.CHAT_MANAGER} onNavigate={onNavigate} onLogout={onLogout}>
      <div className="h-full flex bg-[#020617] rounded-[2.5rem] border border-white/5 overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)]">
        
        {/* COL 1: AGENTES & NAVEGAÇÃO INTERNA */}
        <div className="w-20 lg:w-64 border-r border-white/5 flex flex-col bg-[#03081a] shrink-0">
           <div className="p-6 border-b border-white/5 flex flex-col gap-6">
              <div className="hidden lg:flex items-center justify-between">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Agentes Online</h3>
                <span className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_#10b981]" />
              </div>
              <div className="space-y-3">
                 {AGENTS.map(agent => (
                   <button 
                    key={agent.id}
                    onClick={() => setActiveAgent(agent)}
                    className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${activeAgent.id === agent.id ? 'bg-orange-600/10 border border-orange-500/20 shadow-lg' : 'hover:bg-white/5 border border-transparent'}`}
                   >
                      <div className="relative shrink-0">
                         <img src={agent.avatar} className="w-10 h-10 rounded-xl" />
                         <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-[#03081a] ${agent.status === 'online' ? 'bg-emerald-500' : 'bg-yellow-500'}`} />
                      </div>
                      <div className="hidden lg:block text-left overflow-hidden">
                         <p className={`text-xs font-black truncate tracking-tight ${activeAgent.id === agent.id ? 'text-white' : 'text-slate-400'}`}>{agent.name}</p>
                         <p className="text-[8px] text-slate-600 uppercase font-black tracking-widest">{agent.role}</p>
                      </div>
                   </button>
                 ))}
              </div>
           </div>
           
           <div className="flex-1 p-6 flex flex-col">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6 hidden lg:block">Status Atendimento</h3>
              <div className="space-y-2">
                 <FilterBtn active={filter === 'all'} onClick={() => setFilter('all')} label="Fluxo Geral" icon={LayoutGrid} />
                 <FilterBtn active={filter === 'awaiting'} onClick={() => setFilter('awaiting')} label="Aguardando" icon={Clock} color="text-red-500" />
                 <FilterBtn active={filter === 'processing'} onClick={() => setFilter('processing')} label="Em Aberto" icon={Zap} color="text-orange-500" />
                 <FilterBtn active={filter === 'completed'} onClick={() => setFilter('completed')} label="Concluídos" icon={CheckCircle} color="text-emerald-500" />
              </div>
              <div className="mt-auto pt-6">
                <button className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-white/5 text-slate-500 transition-all border border-transparent">
                  <UserCircle size={18} />
                  <span className="hidden lg:block text-[10px] font-black uppercase tracking-widest">Meus Dados</span>
                </button>
              </div>
           </div>
        </div>

        {/* COL 2: LISTA DE LEADS (CHATS) */}
        <div className="w-80 lg:w-96 border-r border-white/5 flex flex-col bg-[#020617] shrink-0">
           <div className="p-6 border-b border-white/5 space-y-4 bg-white/[0.01]">
              <div className="flex items-center justify-between mb-2">
                 <h2 className="text-sm font-black text-white uppercase tracking-widest italic">Leads Evolution</h2>
                 <button onClick={handleSync} disabled={isSyncing} className="p-2 text-slate-600 hover:text-white transition-all">
                    {isSyncing ? <Loader2 size={16} className="animate-spin text-orange-500" /> : <RefreshCw size={16} />}
                 </button>
              </div>
              <div className="relative group">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within:text-orange-500 transition-colors" size={16} />
                 <input placeholder="Buscar contato ou protocolo..." className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-xs text-white focus:outline-none focus:border-orange-500 transition-all placeholder:text-slate-800" />
              </div>
           </div>
           
           <div className="flex-1 overflow-y-auto custom-scrollbar bg-black/20">
              {filteredLeads.map(lead => (
                <div 
                  key={lead.id}
                  onClick={() => openChat(lead)}
                  className={`p-5 border-b border-white/5 cursor-pointer transition-all hover:bg-white/[0.03] relative group ${selectedLead?.id === lead.id ? 'bg-orange-600/5' : ''}`}
                >
                   {selectedLead?.id === lead.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-600" />}
                   <div className="flex items-center gap-4">
                      <div className="relative shrink-0">
                         <img src={lead.avatar} className="w-12 h-12 rounded-2xl border border-white/10 group-hover:scale-105 transition-transform" />
                         {lead.status === 'online' && <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#020617]" />}
                      </div>
                      <div className="min-w-0 flex-1">
                         <div className="flex justify-between items-center mb-1">
                            <h4 className="text-[13px] font-black text-white italic truncate tracking-tight">{lead.name}</h4>
                            <span className="text-[9px] font-black text-slate-700 uppercase">{new Date(lead.lastMessageTimestamp * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                         </div>
                         <div className="flex justify-between items-center">
                            <p className="text-[11px] text-slate-500 truncate font-medium italic">"{lead.lastMessage}"</p>
                            {lead.unreadCount > 0 && <span className="bg-orange-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg shadow-orange-600/30">{lead.unreadCount}</span>}
                         </div>
                      </div>
                   </div>
                </div>
              ))}
              {filteredLeads.length === 0 && (
                <div className="p-20 text-center space-y-4">
                   <div className="w-16 h-16 bg-white/5 rounded-[2rem] mx-auto flex items-center justify-center text-slate-800"><MessageSquare size={32} /></div>
                   <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Nenhum lead encontrado</p>
                </div>
              )}
           </div>
        </div>

        {/* COL 3: ÁREA DE CONVERSA PRINCIPAL (Ocupa Máximo Espaço Vertical) */}
        <div className="flex-1 flex flex-col relative bg-[#010411] min-w-0 overflow-hidden">
           {selectedLead ? (
             <div className="flex flex-col h-full w-full">
               {/* Chat Header */}
               <div className="h-20 p-6 border-b border-white/5 flex items-center justify-between bg-[#03081a]/50 backdrop-blur-md shrink-0 z-10">
                  <div className="flex items-center gap-4">
                     <button onClick={() => setSelectedLead(null)} className="lg:hidden p-2 -ml-2 text-slate-500 hover:text-white"><ChevronLeft size={20} /></button>
                     <div className="relative">
                        <img src={selectedLead.avatar} className="w-12 h-12 rounded-2xl border border-white/10" />
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#010411]" />
                     </div>
                     <div>
                        <h3 className="text-lg font-black text-white italic uppercase tracking-tighter leading-none">{selectedLead.name}</h3>
                        <div className="flex items-center gap-3 mt-1.5">
                           <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Online • Ativo</span>
                           <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest italic">{selectedLead.protocol}</span>
                        </div>
                     </div>
                  </div>
                  <div className="flex items-center gap-2">
                     <HeaderAction icon={Phone} />
                     <HeaderAction icon={Video} />
                     <div className="h-6 w-px bg-white/5 mx-2" />
                     <HeaderAction icon={Search} />
                     <HeaderAction icon={MoreVertical} />
                  </div>
               </div>

               {/* Messages Area (Scroll Suave e Flex-1) */}
               <div 
                ref={scrollRef} 
                className="flex-1 p-8 overflow-y-auto custom-scrollbar space-y-6 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] scroll-smooth"
               >
                  <div className="flex justify-center py-10">
                    <div className="px-6 py-2 bg-white/5 border border-white/10 rounded-full text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] italic backdrop-blur-md">
                      Segurança de Atendimento: WF-NEURAL-SECURE
                    </div>
                  </div>

                  {messages.map(msg => (
                    <div key={msg.id} className={`flex w-full animate-in fade-in slide-in-from-bottom-2 duration-300 ${msg.sender === 'agent' ? 'justify-end' : 'justify-start'}`}>
                       <div className={`max-w-[70%] lg:max-w-[60%] flex flex-col ${msg.sender === 'agent' ? 'items-end' : 'items-start'}`}>
                          <div className={`p-5 rounded-[2rem] text-[14px] font-medium leading-relaxed shadow-2xl relative ${
                            msg.sender === 'agent' 
                              ? 'bg-orange-600 text-white border border-orange-500/50 rounded-tr-none' 
                              : (msg.sender === 'system' 
                                  ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 w-full text-center italic' 
                                  : 'bg-[#03081a] text-slate-200 border border-white/10 rounded-tl-none')
                          }`}>
                            {msg.content}
                            {msg.type === 'audio' && (
                              <div className="flex items-center gap-4 py-2 min-w-[200px]">
                                <button className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all"><Play size={18} fill="currentColor" /></button>
                                <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden relative">
                                  <div className="h-full bg-white w-1/3 shadow-[0_0_8px_#fff]" />
                                </div>
                                <span className="text-[10px] font-black">0:42</span>
                              </div>
                            )}
                          </div>
                          <div className={`flex items-center gap-2 mt-2 px-3 ${msg.sender === 'agent' ? 'flex-row-reverse' : 'flex-row'}`}>
                             <span className="text-[9px] font-black text-slate-700 uppercase italic">{msg.timestamp}</span>
                             {msg.sender === 'agent' && <CheckCheck size={14} className="text-emerald-500" />}
                          </div>
                       </div>
                    </div>
                  ))}

                  {isTyping && (
                    <div className="flex justify-start animate-pulse">
                       <div className="bg-[#03081a] border border-white/5 p-4 rounded-[1.5rem] flex gap-1.5 items-center">
                          <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce" />
                          <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce delay-100" />
                          <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce delay-200" />
                          <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest ml-2">Cliente escrevendo...</span>
                       </div>
                    </div>
                  )}
               </div>

               {/* Chat Input Core (Sticky Bottom) */}
               <div className="p-6 lg:p-10 border-t border-white/5 bg-[#03081a]/50 backdrop-blur-md shrink-0">
                  <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-4 mb-4 overflow-x-auto custom-scrollbar pb-2">
                       <QuickReply label="/ola" onClick={() => setNewMessage('Olá! Como posso te ajudar hoje?')} />
                       <QuickReply label="/pix" onClick={() => setNewMessage('Segue nossa chave Pix CNPJ: 00.000.000/0001-00')} />
                       <QuickReply label="/cupom" onClick={() => setNewMessage('Use o cupom RECOVERY10 para 10% de desconto adicional.')} />
                       <QuickReply label="/boleto" onClick={() => setNewMessage('Seu boleto já foi enviado para o e-mail cadastrado.')} />
                    </div>
                    
                    <div className="flex items-end gap-4 bg-black/40 p-2 rounded-[2.5rem] border border-white/10 shadow-inner group-focus-within:border-orange-500/50 transition-all">
                       <button onClick={() => fileInputRef.current?.click()} className="p-4 text-slate-700 hover:text-orange-500 transition-colors shrink-0"><Paperclip size={24} /></button>
                       <input type="file" ref={fileInputRef} className="hidden" />
                       
                       <textarea 
                        rows={1}
                        value={newMessage}
                        onChange={(e) => {
                          setNewMessage(e.target.value);
                          if (e.target.value.length > 0) setIsTyping(false); // In a real scenario, this would send an event
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                          }
                        }}
                        placeholder="Escreva sua mensagem aqui..." 
                        className="flex-1 bg-transparent border-none py-4 px-2 text-white text-[15px] outline-none placeholder:text-slate-800 font-medium resize-none max-h-32" 
                       />
                       
                       <div className="flex items-center gap-2 p-1">
                          <button className="p-4 text-slate-700 hover:text-orange-500 transition-colors shrink-0"><Smile size={24} /></button>
                          <button className="p-4 text-slate-700 hover:text-emerald-500 transition-colors shrink-0"><Mic size={24} /></button>
                          <button 
                            onClick={() => sendMessage()}
                            disabled={!newMessage.trim() || isSending}
                            className={`p-5 rounded-full shadow-2xl transition-all active:scale-90 shrink-0 ${
                              newMessage.trim() ? 'bg-orange-600 text-white shadow-orange-600/30' : 'bg-white/5 text-slate-700'
                            }`}
                          >
                            {isSending ? <Loader2 size={24} className="animate-spin" /> : <SendHorizonal size={24} />}
                          </button>
                       </div>
                    </div>
                  </div>
               </div>
             </div>
           ) : (
             <div className="flex-1 flex flex-col items-center justify-center p-20 space-y-8 animate-in zoom-in duration-1000">
                <div className="relative">
                   <div className="absolute inset-0 bg-orange-600/20 blur-[120px] animate-pulse" />
                   <div className="w-40 h-40 bg-[#03081a] border border-white/10 rounded-[4rem] flex items-center justify-center text-orange-500 relative z-10 shadow-[0_20px_60px_rgba(0,0,0,0.8)] border-orange-500/10">
                      <Zap size={80} strokeWidth={1} />
                   </div>
                </div>
                <div className="text-center space-y-3">
                   <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">WayFlow Neural Station</h2>
                   <p className="text-[11px] text-slate-600 font-black uppercase tracking-[0.5em] max-w-sm mx-auto leading-relaxed">Pronto para processar incidentes de checkout em tempo real. Selecione um atendimento.</p>
                </div>
                <div className="flex gap-4">
                  <div className="px-6 py-2 bg-white/5 border border-white/5 rounded-full text-[9px] font-black text-slate-700 uppercase tracking-widest italic">Evolution API Node: {selectedInstanceName || 'OFFLINE'}</div>
                  <div className="px-6 py-2 bg-white/5 border border-white/5 rounded-full text-[9px] font-black text-slate-700 uppercase tracking-widest italic">Cluster: BRA-ALPHA</div>
                </div>
             </div>
           )}
        </div>

        {/* COL 4: CRM INTEL & DETALHES (Sidebar Direita Opcional) */}
        {selectedLead && (
          <div className="hidden xl:flex w-80 lg:w-96 border-l border-white/5 flex-col bg-[#03081a] shrink-0 animate-in slide-in-from-right duration-500">
             <div className="p-10 border-b border-white/5 text-center bg-white/[0.01]">
                <div className="relative w-28 h-28 mx-auto mb-6">
                   <img src={selectedLead.avatar} className="w-full h-full rounded-[3rem] border-2 border-white/10 shadow-2xl object-cover" />
                   <div className="absolute -bottom-2 -right-2 bg-emerald-500 p-2 rounded-xl border-4 border-[#03081a] text-white">
                      <CheckCircle size={16} />
                   </div>
                </div>
                <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">{selectedLead.name}</h3>
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mt-1 mb-8 italic">ID: {selectedLead.id.split('@')[0]}</p>
                
                <div className="grid grid-cols-2 gap-3 text-left">
                   <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Ticket Valor</p>
                      <p className="text-sm font-black text-emerald-500">R$ {selectedLead.value}</p>
                   </div>
                   <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Motivo Falha</p>
                      <p className="text-[9px] font-black text-red-500 uppercase truncate">Recusa Cartão</p>
                   </div>
                </div>
             </div>
             
             <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-10">
                <section>
                   <div className="flex items-center justify-between mb-6">
                      <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2"><Clock size={14} className="text-orange-500" /> Timeline Eventos</h4>
                      <span className="text-[8px] font-black text-slate-700 uppercase">Ver Tudo</span>
                   </div>
                   <div className="space-y-4">
                      <HistoryItem label="Check-in WayFlow" time="14:20" icon={Check} />
                      <HistoryItem label="Falha de Pagamento" time="14:21" icon={AlertTriangle} color="text-red-500" />
                      <HistoryItem label="Atendimento Iniciado" time="14:22" icon={Hash} />
                   </div>
                </section>

                <section>
                   <div className="flex justify-between items-center mb-6">
                      <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2"><StickyNote size={14} className="text-orange-500" /> Notas Internas</h4>
                      <button className="text-[9px] font-black text-orange-500 uppercase tracking-widest hover:underline">+ Add</button>
                   </div>
                   <div className="space-y-4">
                      <div className="p-5 bg-black/40 border border-dashed border-white/10 rounded-2xl text-[11px] text-slate-400 font-medium leading-relaxed italic group hover:border-orange-500/50 transition-all cursor-text">
                         "Cliente tentou passar o cartão 3 vezes sem sucesso. Proposta de boleto com desconto já em negociação."
                      </div>
                      <div className="p-5 bg-black/40 border border-dashed border-white/10 rounded-2xl text-[11px] text-slate-400 font-medium leading-relaxed italic group hover:border-orange-500/50 transition-all cursor-text">
                         "Agendado retorno para amanhã às 10h."
                      </div>
                   </div>
                </section>
             </div>

             <div className="p-8 border-t border-white/5 bg-white/[0.01]">
                <button className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(16,185,129,0.3)] group">
                   <CheckCircle2 size={18} className="group-hover:scale-125 transition-transform" /> Concluir Atendimento
                </button>
                <p className="text-center text-[9px] font-black text-slate-700 uppercase tracking-[0.3em] mt-6">SLA Ativo: 00:12:45</p>
             </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

const FilterBtn: React.FC<{ active: boolean, onClick: () => void, label: string, icon: any, color?: string }> = ({ active, onClick, label, icon: Icon, color = "text-white" }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group ${active ? 'bg-orange-600/10 border border-orange-500/20 shadow-lg' : 'hover:bg-white/[0.02] border border-transparent'}`}
  >
     <Icon size={18} className={active ? color : 'text-slate-700'} />
     <span className={`text-[10px] font-black uppercase tracking-[0.2em] hidden lg:block ${active ? 'text-white' : 'text-slate-600'}`}>{label}</span>
  </button>
);

const HistoryItem: React.FC<{ label: string, time: string, icon: any, color?: string }> = ({ label, time, icon: Icon, color = "text-emerald-500" }) => (
  <div className="flex items-center gap-4 group">
     <div className={`w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center ${color} border border-white/5 transition-transform group-hover:scale-110`}>
        <Icon size={14} />
     </div>
     <div className="flex-1">
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-tight leading-none mb-1 group-hover:text-white transition-colors">{label}</p>
        <p className="text-[9px] text-slate-700 font-bold">{time}</p>
     </div>
  </div>
);

const QuickReply: React.FC<{ label: string, onClick: () => void }> = ({ label, onClick }) => (
  <button 
    onClick={onClick}
    className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-[10px] font-black text-slate-400 hover:text-orange-500 uppercase tracking-widest whitespace-nowrap transition-all active:scale-95"
  >
    {label}
  </button>
);

const HeaderAction: React.FC<{ icon: any }> = ({ icon: Icon }) => (
  <button className="p-3 bg-white/5 text-slate-500 hover:text-white hover:bg-white/10 rounded-xl border border-white/5 transition-all active:scale-90">
    <Icon size={18} />
  </button>
);

export default ChatManager;
