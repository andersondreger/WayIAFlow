
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, MessageCircle, MoreVertical, Smartphone, Users, Zap, CheckCircle2, 
  Clock, Loader2, RefreshCw, Send, Mic, Paperclip, Smile, ShieldCheck, 
  ChevronLeft, Info, Phone, Video, MoreHorizontal, UserCircle2, AlertCircle
} from 'lucide-react';
import Layout from '../components/Layout.tsx';
import { AppView, KanbanLead, ChatMessage } from '../types.ts';

interface EvolutionChat {
  id: string;
  name: string;
  unreadCount: number;
  lastMessage?: {
    message?: {
      conversation?: string;
      extendedTextMessage?: { text: string };
    };
  };
}

const ChatManager: React.FC<{ onLogout: () => void, onNavigate: (v: AppView) => void }> = ({ onLogout, onNavigate }) => {
  const [selectedLead, setSelectedLead] = useState<KanbanLead | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [leads, setLeads] = useState<KanbanLead[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Carregar Configurações da API
  const [config] = useState(() => {
    const saved = localStorage.getItem('wayflow_evo_config');
    return saved ? JSON.parse(saved) : { evoUrl: '', evoKey: '' };
  });

  // Lista de Instâncias para seleção
  const [availableInstances, setAvailableInstances] = useState<any[]>([]);
  const [selectedInstanceName, setSelectedInstanceName] = useState<string>('');

  // 1. Carregar instâncias disponíveis ao abrir a tela
  useEffect(() => {
    const fetchInstances = async () => {
      if (!config.evoUrl || !config.evoKey) return;
      try {
        const baseUrl = config.evoUrl.trim().replace(/\/$/, "");
        const response = await fetch(`${baseUrl}/instance/fetchInstances`, {
          headers: { 'apikey': config.evoKey }
        });
        const data = await response.json();
        const connected = data.filter((i: any) => i.connectionStatus === 'open' || i.status === 'open');
        setAvailableInstances(connected);
        if (connected.length > 0) setSelectedInstanceName(connected[0].instanceName || connected[0].name);
      } catch (e) {
        console.error("Erro ao buscar instâncias para atendimento:", e);
      }
    };
    fetchInstances();
  }, [config]);

  // 2. Sincronizar conversas reais da instância selecionada
  const handleSync = useCallback(async () => {
    if (!selectedInstanceName || !config.evoUrl || !config.evoKey) {
      alert("Selecione uma instância conectada primeiro.");
      return;
    }
    
    setIsSyncing(true);
    const baseUrl = config.evoUrl.trim().replace(/\/$/, "");
    
    try {
      const response = await fetch(`${baseUrl}/chat/fetchChats/${selectedInstanceName}`, {
        headers: { 'apikey': config.evoKey }
      });
      
      if (!response.ok) throw new Error("Erro na API Evolution ao buscar chats.");
      
      const data = await response.json();
      
      // Converter chats da Evolution para o formato Kanban da nossa UI
      const mappedLeads: KanbanLead[] = data.map((chat: any) => ({
        id: chat.id || chat.remoteJid,
        name: chat.name || chat.pushName || chat.id.split('@')[0],
        phone: chat.id.split('@')[0],
        lastMessage: chat.lastMessage?.message?.conversation || 
                     chat.lastMessage?.message?.extendedTextMessage?.text || 
                     "Mensagem de mídia ou sistema",
        value: 0,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(chat.name || 'W')}&background=random&color=fff`,
        columnId: chat.unreadCount > 0 ? 'new' : 'ai_processing',
        status: 'online',
        unreadCount: chat.unreadCount
      }));

      setLeads(mappedLeads);
    } catch (error) {
      console.error(error);
      alert("Falha ao sincronizar chats. Verifique se a instância está aberta no celular.");
    } finally {
      setIsSyncing(false);
    }
  }, [selectedInstanceName, config]);

  // 3. Carregar mensagens de um chat específico
  const loadChat = async (lead: KanbanLead) => {
    setSelectedLead(lead);
    setMessages([]); // Limpa mensagens atuais
    
    if (!selectedInstanceName || !config.evoUrl) return;
    const baseUrl = config.evoUrl.trim().replace(/\/$/, "");

    try {
      const response = await fetch(`${baseUrl}/chat/fetchMessages/${selectedInstanceName}`, {
        method: 'POST',
        headers: { 
          'apikey': config.evoKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          where: { remoteJid: lead.id },
          limit: 20
        })
      });
      
      const data = await response.json();
      const rawMessages = data.messages || data;

      // Fix for ChatMessage mapping error by explicitly casting sender to literal types
      const formattedMsgs: ChatMessage[] = Array.isArray(rawMessages) ? rawMessages.map((m: any) => ({
        id: m.key?.id || Math.random().toString(),
        sender: (m.key?.fromMe ? 'agent' : 'user') as 'agent' | 'user',
        content: m.message?.conversation || m.message?.extendedTextMessage?.text || "Mensagem não suportada nesta prévia",
        timestamp: new Date(m.messageTimestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      })).reverse() : [];

      setMessages(formattedMsgs);
    } catch (e) {
      console.error("Erro ao carregar mensagens:", e);
    }
  };

  // 4. Enviar mensagem real via API
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedLead || !selectedInstanceName || isSending) return;
    
    setIsSending(true);
    const baseUrl = config.evoUrl.trim().replace(/\/$/, "");
    const tempMsg = newMessage;
    setNewMessage('');

    try {
      const response = await fetch(`${baseUrl}/message/sendText/${selectedInstanceName}`, {
        method: 'POST',
        headers: {
          'apikey': config.evoKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          number: selectedLead.id,
          text: tempMsg,
          delay: 1200,
          linkPreview: true
        })
      });

      if (response.ok) {
        // Adiciona a mensagem enviada na UI localmente
        const sent: ChatMessage = {
          id: Math.random().toString(),
          sender: 'agent',
          content: tempMsg,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, sent]);
      } else {
        throw new Error("Erro ao enviar");
      }
    } catch (e) {
      alert("Não foi possível enviar a mensagem. Verifique a conexão.");
      setNewMessage(tempMsg);
    } finally {
      setIsSending(false);
    }
  };

  const columns = [
    { id: 'new', label: 'Não Lidas', color: 'bg-orange-500' },
    { id: 'ai_processing', label: 'Conversas', color: 'bg-purple-500' },
    { id: 'won', label: 'Convertidos', color: 'bg-emerald-500' },
  ];

  return (
    <Layout activeView={AppView.CHAT_MANAGER} onNavigate={onNavigate} onLogout={onLogout}>
      <div className="h-full flex flex-col gap-6 animate-in fade-in duration-500">
        
        {/* Chat Header Control */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-[#03081a] border border-white/5 p-8 rounded-[2.5rem] shadow-xl">
          <div>
            <div className="flex items-center gap-3 mb-2">
               <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]" />
               <h1 className="text-3xl font-black text-white tracking-tighter italic uppercase">Atendimento Live.</h1>
            </div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Sincronizado com Evolution API v2</p>
          </div>
          
          <div className="flex flex-wrap gap-4 w-full md:w-auto">
             <div className="flex flex-col gap-1.5 min-w-[200px]">
                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-2">Canais Conectados</span>
                <select 
                  value={selectedInstanceName}
                  onChange={(e) => setSelectedInstanceName(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500 transition-all font-bold appearance-none"
                >
                  {availableInstances.length === 0 && <option>Nenhum Canal Ativo</option>}
                  {availableInstances.map(inst => (
                    <option key={inst.instanceId} value={inst.instanceName || inst.name}>
                      🟢 {inst.instanceName || inst.name}
                    </option>
                  ))}
                </select>
             </div>

             <div className="flex flex-col gap-1.5 flex-1 md:w-64">
                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-2">Pesquisar Lead</span>
                <div className="relative">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
                   <input placeholder="Nome ou número..." className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-orange-500 transition-all font-bold" />
                </div>
             </div>

             <div className="flex flex-col gap-1.5">
                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest invisible">Ação</span>
                <button 
                    onClick={handleSync}
                    disabled={isSyncing || !selectedInstanceName}
                    className="px-6 py-2.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-orange-600/20 transition-all flex items-center gap-3 h-[42px]"
                >
                    {isSyncing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} Sincronizar Chats
                </button>
             </div>
          </div>
        </div>

        <div className="flex-1 flex gap-6 overflow-hidden">
          {/* Kanban Sidebar */}
          <div className={`flex-1 flex gap-6 overflow-x-auto pb-4 custom-scrollbar ${selectedLead ? 'hidden xl:flex' : 'flex'}`}>
            {columns.map(col => (
              <div key={col.id} className="flex-none w-80 flex flex-col gap-4">
                <div className="flex items-center justify-between px-4 py-2 bg-white/[0.02] border border-white/5 rounded-2xl">
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
                      className={`p-6 rounded-[2.5rem] border transition-all cursor-pointer group relative overflow-hidden ${selectedLead?.id === lead.id ? 'bg-orange-600/10 border-orange-500/50 shadow-lg shadow-orange-500/5' : 'bg-[#03081a] border-white/5 hover:border-white/20'}`}
                    >
                      {lead.unreadCount && lead.unreadCount > 0 ? (
                        <div className="absolute top-6 right-6 w-5 h-5 bg-orange-600 rounded-full flex items-center justify-center text-[9px] font-black text-white shadow-lg animate-bounce">
                           {lead.unreadCount}
                        </div>
                      ) : null}

                      <div className="flex items-center gap-4 mb-4">
                         <div className="relative">
                            <img src={lead.avatar} className="w-12 h-12 rounded-2xl border border-white/10" alt="" />
                            {lead.status === 'online' && <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-[#020617] rounded-full" />}
                         </div>
                         <div className="flex-1 min-w-0">
                            <h4 className="text-white font-black text-sm truncate uppercase italic tracking-tight">{lead.name}</h4>
                            <p className="text-[9px] text-slate-500 font-bold tracking-widest">{lead.phone}</p>
                         </div>
                      </div>
                      
                      <p className="text-slate-400 text-[11px] font-medium line-clamp-2 leading-relaxed h-8">
                        {lead.lastMessage ? `"${lead.lastMessage}"` : "Sem mensagens"}
                      </p>
                      
                      <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                         <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Sincronizado</span>
                         </div>
                         <Zap size={14} className="text-slate-800" />
                      </div>
                    </div>
                  ))}
                  
                  {leads.filter(l => l.columnId === col.id).length === 0 && (
                    <div className="py-12 flex flex-col items-center justify-center opacity-20 grayscale">
                       <MessageCircle size={32} className="text-slate-500 mb-2" />
                       <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">Vazio</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Full Chat Window */}
          {selectedLead ? (
            <div className="flex-1 flex flex-col bg-[#03081a] border border-white/5 rounded-[3.5rem] overflow-hidden shadow-2xl animate-in slide-in-from-right-6 duration-700">
              {/* Chat Header */}
              <div className="p-8 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
                <div className="flex items-center gap-5">
                   <button onClick={() => setSelectedLead(null)} className="xl:hidden p-3 bg-white/5 rounded-2xl text-slate-500"><ChevronLeft size={20} /></button>
                   <div className="relative">
                      <img src={selectedLead.avatar} className="w-14 h-14 rounded-[1.2rem] border-2 border-white/10" alt="" />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-[#03081a] rounded-full" />
                   </div>
                   <div>
                      <h3 className="text-xl font-black text-white italic tracking-tighter uppercase leading-none mb-1.5">{selectedLead.name}</h3>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">Canal: {selectedInstanceName}</span>
                        <div className="w-1 h-1 bg-slate-800 rounded-full" />
                        <span className="text-[10px] font-black text-slate-500 tracking-widest">+{selectedLead.phone}</span>
                      </div>
                   </div>
                </div>
                <div className="flex items-center gap-3">
                   <button className="p-4 bg-white/5 rounded-2xl text-slate-400 hover:text-white transition-all border border-white/5"><Phone size={20} /></button>
                   <button className="p-4 bg-white/5 rounded-2xl text-slate-400 hover:text-white transition-all border border-white/5"><Video size={20} /></button>
                   <button className="p-4 bg-white/5 rounded-2xl text-slate-400 hover:text-white transition-all border border-white/5"><MoreHorizontal size={20} /></button>
                </div>
              </div>

              {/* Chat Content */}
              <div className="flex-1 p-12 overflow-y-auto custom-scrollbar space-y-10 bg-[radial-gradient(circle_at_top_right,_rgba(245,158,11,0.03),_transparent)]">
                 {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-800 space-y-4">
                       <Loader2 size={48} className="animate-spin opacity-10" />
                       <p className="text-[10px] font-black uppercase tracking-widest opacity-20">Carregando Histórico Neural...</p>
                    </div>
                 ) : messages.map(msg => (
                   <div key={msg.id} className={`flex ${msg.sender === 'agent' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                      <div className={`max-w-[75%] space-y-2`}>
                         <div className={`p-6 rounded-[2.5rem] text-[15px] font-medium leading-relaxed shadow-xl ${
                            msg.sender === 'agent' 
                              ? 'bg-orange-600 text-white rounded-tr-none shadow-orange-600/10' 
                              : 'bg-white/5 text-slate-200 border border-white/10 rounded-tl-none'
                          }`}>
                            {msg.content}
                         </div>
                         <div className={`flex items-center gap-3 px-4 ${msg.sender === 'agent' ? 'flex-row-reverse' : 'flex-row'}`}>
                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{msg.timestamp}</p>
                            <div className="w-1 h-1 bg-slate-800 rounded-full" />
                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{msg.sender === 'agent' ? 'WayFlow Agent' : 'Cliente'}</p>
                         </div>
                      </div>
                   </div>
                 ))}
              </div>

              {/* Chat Input */}
              <div className="p-10 bg-white/[0.01] border-t border-white/5">
                 <div className="flex items-center gap-5">
                    <div className="flex gap-2">
                       <button className="p-5 bg-white/5 rounded-[1.5rem] text-slate-500 hover:text-white transition-all border border-white/5"><Paperclip size={24} /></button>
                       <button className="p-5 bg-white/5 rounded-[1.5rem] text-slate-500 hover:text-white transition-all border border-white/5"><Mic size={24} /></button>
                    </div>
                    <div className="flex-1 relative">
                       <input 
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Digite sua mensagem mestre..."
                        className="w-full bg-[#020617] border border-white/10 rounded-[2rem] py-5 px-10 text-base text-white focus:outline-none focus:border-orange-500 transition-all font-medium placeholder:text-slate-800"
                       />
                       <button className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-700 hover:text-orange-500"><Smile size={24} /></button>
                    </div>
                    <button 
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || isSending}
                      className="p-6 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-[2rem] shadow-2xl shadow-orange-600/30 transition-all active:scale-95 flex items-center justify-center"
                    >
                       {isSending ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} />}
                    </button>
                 </div>
                 <div className="mt-8 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                       <div className="flex items-center gap-3 px-4 py-2 bg-emerald-500/5 rounded-full border border-emerald-500/10">
                          <ShieldCheck size={14} className="text-emerald-500" />
                          <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">E2E Encryption</span>
                       </div>
                       <div className="flex items-center gap-3 px-4 py-2 bg-orange-600/5 rounded-full border border-orange-500/10">
                          <Zap size={14} className="text-orange-500" />
                          <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest">IA Co-Pilot Monitorando</span>
                       </div>
                    </div>
                    <div className="flex items-center gap-3">
                       <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                       <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Sincronia estável</span>
                    </div>
                 </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[4rem] text-center p-20 animate-in zoom-in duration-1000">
               <div className="relative mb-10">
                  <div className="absolute -inset-10 bg-orange-600/10 blur-3xl rounded-full animate-pulse" />
                  <div className="relative w-32 h-32 bg-[#03081a] border border-white/5 rounded-full flex items-center justify-center text-slate-800 shadow-2xl">
                     <MessageCircle size={56} className="opacity-20" />
                  </div>
               </div>
               <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-4">Aguardando Seleção.</h3>
               <p className="text-slate-500 text-sm max-w-sm mx-auto font-medium leading-relaxed">
                 Selecione uma conversa ao lado para carregar o histórico de mensagens e iniciar o atendimento via <span className="text-white font-bold">Evolution API</span>.
               </p>
               
               {leads.length === 0 && (
                 <button 
                  onClick={handleSync}
                  className="mt-10 px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] hover:text-white hover:bg-white/10 transition-all flex items-center gap-3"
                 >
                   <RefreshCw size={14} /> Carregar Primeiros Leads
                 </button>
               )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ChatManager;
