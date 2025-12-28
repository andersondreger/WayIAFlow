
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, MessageCircle, MoreVertical, Smartphone, Users, Zap, CheckCircle2, 
  Clock, Loader2, RefreshCw, Send, Mic, Paperclip, Smile, ShieldCheck, 
  ChevronLeft, Info, Phone, Video, MoreHorizontal, UserCircle2, AlertCircle
} from 'lucide-react';
import Layout from '../components/Layout.tsx';
import { AppView, KanbanLead, ChatMessage } from '../types.ts';

const ChatManager: React.FC<{ onLogout: () => void, onNavigate: (v: AppView) => void }> = ({ onLogout, onNavigate }) => {
  const [selectedLead, setSelectedLead] = useState<KanbanLead | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [leads, setLeads] = useState<KanbanLead[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const [config] = useState(() => {
    const saved = localStorage.getItem('wayflow_evo_config');
    return saved ? JSON.parse(saved) : { evoUrl: '', evoKey: '' };
  });

  const [availableInstances, setAvailableInstances] = useState<any[]>([]);
  const [selectedInstanceName, setSelectedInstanceName] = useState<string>('');

  // Carregar instâncias disponíveis
  useEffect(() => {
    const fetchInstances = async () => {
      if (!config.evoUrl || !config.evoKey) return;
      try {
        const baseUrl = config.evoUrl.trim().replace(/\/$/, "");
        const response = await fetch(`${baseUrl}/instance/fetchInstances`, {
          headers: { 'apikey': config.evoKey }
        });
        const data = await response.json();
        const raw = Array.isArray(data) ? data : (data.instances || data.data || []);
        const connected = raw.filter((i: any) => {
          const inst = i.instance || i;
          return i.connectionStatus === 'open' || i.status === 'open' || inst.status === 'open' || i.state === 'open';
        });
        setAvailableInstances(connected);
        if (connected.length > 0 && !selectedInstanceName) {
          setSelectedInstanceName(connected[0].instanceName || connected[0].name);
        }
      } catch (e) { console.error("Erro fetch inst:", e); }
    };
    fetchInstances();
  }, [config]);

  // SINCRONIZAÇÃO HÍBRIDA (CHATS + CONTATOS)
  const handleSync = useCallback(async () => {
    if (!selectedInstanceName || !config.evoUrl) {
      alert("Selecione um canal conectado.");
      return;
    }
    setIsSyncing(true);
    try {
      const baseUrl = config.evoUrl.trim().replace(/\/$/, "");
      
      // Busca paralela para velocidade
      const [chatsRes, contactsRes] = await Promise.all([
        fetch(`${baseUrl}/chat/fetchChats/${selectedInstanceName}`, { headers: { 'apikey': config.evoKey } }).catch(() => null),
        fetch(`${baseUrl}/contact/fetchContacts/${selectedInstanceName}`, { headers: { 'apikey': config.evoKey } }).catch(() => null)
      ]);

      let chatsData = chatsRes ? await chatsRes.json() : [];
      let contactsData = contactsRes ? await contactsRes.json() : [];

      const rawChats = Array.isArray(chatsData) ? chatsData : (chatsData.chats || chatsData.data || []);
      const rawContacts = Array.isArray(contactsData) ? contactsData : (contactsData.contacts || contactsData.data || []);

      // MAPA DE UNIFICAÇÃO (Remover duplicados e grupos)
      const leadMap = new Map<string, KanbanLead>();

      // Primeiro, processar chats (têm histórico de mensagens)
      rawChats.forEach((chat: any) => {
        const jid = chat.id || chat.remoteJid || chat.jid;
        if (!jid || jid.includes('@g.us')) return; // Pula grupos

        // Fix: Added missing 'value' property required by KanbanLead type to resolve TS error on line 81
        leadMap.set(jid, {
          id: jid,
          name: chat.name || chat.pushName || jid.split('@')[0],
          phone: jid.split('@')[0],
          lastMessage: chat.lastMessage?.message?.conversation || chat.lastMessage?.message?.extendedTextMessage?.text || "Nova Conversa",
          value: 0,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(chat.name || 'W')}&background=f59e0b&color=fff`,
          columnId: chat.unreadCount > 0 ? 'new' : 'ai_processing',
          status: 'online',
          unreadCount: chat.unreadCount || 0
        });
      });

      // Depois, adicionar contatos que não estavam nos chats
      rawContacts.forEach((contact: any) => {
        const jid = contact.id || contact.jid || contact.remoteJid;
        if (!jid || jid.includes('@g.us') || leadMap.has(jid)) return;

        // Fix: Added missing 'value' property required by KanbanLead type to resolve TS error on line 98
        leadMap.set(jid, {
          id: jid,
          name: contact.name || contact.pushName || jid.split('@')[0],
          phone: jid.split('@')[0],
          lastMessage: "Sem mensagens recentes",
          value: 0,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name || 'W')}&background=334155&color=fff`,
          columnId: 'new',
          status: 'online',
          unreadCount: 0
        });
      });

      const finalLeads = Array.from(leadMap.values());
      setLeads(finalLeads);
      
      if (finalLeads.length === 0) {
        console.warn("Nenhum lead encontrado para a instância:", selectedInstanceName);
      }
    } catch (error: any) { 
      console.error("Erro Sync:", error);
      alert("Erro ao sincronizar. Verifique se a instância não desconectou."); 
    } finally { setIsSyncing(false); }
  }, [selectedInstanceName, config]);

  // Carregar mensagens de um contato específico
  const loadChat = async (lead: KanbanLead) => {
    setSelectedLead(lead);
    setMessages([]);
    if (!selectedInstanceName || !config.evoUrl) return;
    try {
      const baseUrl = config.evoUrl.trim().replace(/\/$/, "");
      const response = await fetch(`${baseUrl}/chat/fetchMessages/${selectedInstanceName}`, {
        method: 'POST',
        headers: { 'apikey': config.evoKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ where: { remoteJid: lead.id }, limit: 50 })
      });
      const data = await response.json();
      const rawMsgs = Array.isArray(data) ? data : (data.messages || data.data || []);

      const formatted: ChatMessage[] = rawMsgs.map((m: any) => ({
        id: m.key?.id || Math.random().toString(),
        sender: (m.key?.fromMe ? 'agent' : 'user') as any,
        content: m.message?.conversation || m.message?.extendedTextMessage?.text || m.content || "Mídia não suportada",
        timestamp: new Date((m.messageTimestamp || Date.now() / 1000) * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      })).reverse();
      setMessages(formatted);
    } catch (e) { console.error("Erro msgs:", e); }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedLead || isSending) return;
    setIsSending(true);
    const text = newMessage;
    setNewMessage('');
    try {
      const baseUrl = config.evoUrl.trim().replace(/\/$/, "");
      const response = await fetch(`${baseUrl}/message/sendText/${selectedInstanceName}`, {
        method: 'POST',
        headers: { 'apikey': config.evoKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: selectedLead.id, text: text })
      });
      if (response.ok) {
        setMessages(prev => [...prev, { 
          id: Math.random().toString(), sender: 'agent', content: text, 
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        }]);
      }
    } catch (e) { setNewMessage(text); } finally { setIsSending(false); }
  };

  return (
    <Layout activeView={AppView.CHAT_MANAGER} onNavigate={onNavigate} onLogout={onLogout}>
      <div className="h-full flex flex-col gap-4 animate-in fade-in">
        
        {/* Toolbar Superior */}
        <div className="flex items-center justify-between gap-4 bg-[#03081a] border border-white/5 p-5 rounded-2xl shadow-lg shrink-0">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-orange-600/10 rounded-xl flex items-center justify-center text-orange-500 border border-orange-500/20">
                <MessageCircle size={20} />
             </div>
             <h1 className="text-xl font-black text-white italic uppercase tracking-tighter">Atendimento.</h1>
          </div>
          
          <div className="flex items-center gap-3 flex-1 justify-end max-w-2xl">
             <select 
               value={selectedInstanceName}
               onChange={(e) => setSelectedInstanceName(e.target.value)}
               className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-[10px] text-white font-black uppercase tracking-widest outline-none cursor-pointer"
             >
               {availableInstances.length === 0 && <option>Nenhum Canal Ativo</option>}
               {availableInstances.map(inst => (
                 <option key={inst.id} value={inst.instanceName || inst.name}>🟢 {inst.instanceName || inst.name}</option>
               ))}
             </select>

             <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-700" size={12} />
                <input placeholder="Procurar lead..." className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-9 pr-4 text-[10px] text-white font-bold outline-none focus:border-orange-500/50" />
             </div>

             <button 
              onClick={handleSync} 
              disabled={isSyncing || !selectedInstanceName} 
              className="px-6 py-2.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-orange-600/20"
             >
                {isSyncing ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />} 
                Atualizar Leads
             </button>
          </div>
        </div>

        <div className="flex-1 flex gap-4 overflow-hidden">
          {/* Coluna Lateral de Leads */}
          <div className="w-80 flex flex-col gap-3 overflow-y-auto custom-scrollbar pr-2">
            {leads.length === 0 && !isSyncing && (
              <div className="py-20 text-center opacity-30 flex flex-col items-center border border-dashed border-white/5 rounded-3xl">
                <Users size={32} className="mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest">Nenhuma conversa <br/> sincronizada</p>
              </div>
            )}
            {leads.map(lead => (
              <div 
                key={lead.id}
                onClick={() => loadChat(lead)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer relative group ${selectedLead?.id === lead.id ? 'bg-orange-600/10 border-orange-500/30' : 'bg-[#03081a] border-white/5 hover:border-white/20'}`}
              >
                <div className="flex items-center gap-3 mb-2">
                   <img src={lead.avatar} className="w-10 h-10 rounded-xl border border-white/5" alt="" />
                   <div className="flex-1 min-w-0">
                      <h4 className="text-white font-black text-[11px] truncate uppercase italic">{lead.name}</h4>
                      <p className="text-[9px] text-slate-600 font-bold">+{lead.phone}</p>
                   </div>
                   {lead.unreadCount > 0 && <div className="w-5 h-5 bg-orange-600 rounded-full flex items-center justify-center text-[8px] font-black text-white shadow-lg">{lead.unreadCount}</div>}
                </div>
                <p className="text-slate-500 text-[10px] truncate font-medium italic">"{lead.lastMessage}"</p>
              </div>
            ))}
          </div>

          {/* Área de Chat Principal */}
          {selectedLead ? (
            <div className="flex-1 flex flex-col bg-[#03081a] border border-white/5 rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-right-4">
              <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                <div className="flex items-center gap-4">
                   <img src={selectedLead.avatar} className="w-10 h-10 rounded-xl border border-white/5" alt="" />
                   <div>
                      <h3 className="text-sm font-black text-white italic tracking-tight uppercase leading-none mb-1">{selectedLead.name}</h3>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Atendimento via {selectedInstanceName}</span>
                      </div>
                   </div>
                </div>
                <div className="flex gap-2">
                   <button className="p-3 bg-white/5 rounded-xl text-slate-600 hover:text-white transition-all"><Phone size={16} /></button>
                   <button className="p-3 bg-white/5 rounded-xl text-slate-600 hover:text-white transition-all"><MoreHorizontal size={16} /></button>
                </div>
              </div>

              <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-6 bg-[radial-gradient(circle_at_top_right,_rgba(245,158,11,0.03),_transparent)]">
                 {messages.length === 0 ? (
                   <div className="h-full flex flex-col items-center justify-center opacity-10">
                      <Loader2 size={32} className="animate-spin mb-2" />
                      <p className="text-[10px] font-black uppercase tracking-widest">Puxando Histórico...</p>
                   </div>
                 ) : messages.map(msg => (
                   <div key={msg.id} className={`flex ${msg.sender === 'agent' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                      <div className="max-w-[75%]">
                         <div className={`p-4 rounded-2xl text-[13px] font-medium leading-relaxed shadow-lg ${msg.sender === 'agent' ? 'bg-orange-600 text-white rounded-tr-none' : 'bg-white/5 text-slate-200 border border-white/10 rounded-tl-none'}`}>
                            {msg.content}
                         </div>
                         <p className={`text-[8px] font-black text-slate-700 uppercase mt-1.5 px-1 ${msg.sender === 'agent' ? 'text-right' : 'text-left'}`}>{msg.timestamp} • {msg.sender === 'agent' ? 'EU' : 'CLIENTE'}</p>
                      </div>
                   </div>
                 ))}
              </div>

              <div className="p-5 bg-white/[0.01] border-t border-white/5">
                 <div className="flex items-center gap-3">
                    <button className="p-3.5 bg-white/5 rounded-xl text-slate-500 hover:text-white transition-all"><Paperclip size={20} /></button>
                    <input 
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Escreva sua mensagem aqui..."
                      className="flex-1 bg-slate-950 border border-white/10 rounded-xl py-4 px-5 text-sm text-white outline-none focus:border-orange-500 transition-all placeholder:text-slate-800"
                    />
                    <button 
                      onClick={sendMessage} 
                      disabled={!newMessage.trim() || isSending} 
                      className="p-4 bg-orange-600 text-white rounded-xl shadow-xl hover:bg-orange-500 disabled:opacity-50 transition-all"
                    >
                       {isSending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                    </button>
                 </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-3xl opacity-20 text-center p-10 bg-white/[0.01]">
               <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                 <MessageCircle size={40} />
               </div>
               <h3 className="text-xl font-black text-white italic uppercase tracking-tight mb-2">Central Neural.</h3>
               <p className="text-[10px] font-bold uppercase tracking-widest max-w-xs">Sincronize sua Evolution API e selecione uma conversa para responder em tempo real.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ChatManager;
