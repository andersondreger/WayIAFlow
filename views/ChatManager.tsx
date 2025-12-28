
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
      } catch (e) {}
    };
    fetchInstances();
  }, [config]);

  const handleSync = useCallback(async () => {
    if (!selectedInstanceName || !config.evoUrl || !config.evoKey) return;
    setIsSyncing(true);
    try {
      const baseUrl = config.evoUrl.trim().replace(/\/$/, "");
      const response = await fetch(`${baseUrl}/chat/fetchChats/${selectedInstanceName}`, { headers: { 'apikey': config.evoKey } });
      const data = await response.json();
      const mappedLeads: KanbanLead[] = data.map((chat: any) => ({
        id: chat.id || chat.remoteJid,
        name: chat.name || chat.pushName || chat.id.split('@')[0],
        phone: chat.id.split('@')[0],
        lastMessage: chat.lastMessage?.message?.conversation || chat.lastMessage?.message?.extendedTextMessage?.text || "Mídia",
        value: 0,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(chat.name || 'W')}&background=random&color=fff`,
        columnId: chat.unreadCount > 0 ? 'new' : 'ai_processing',
        status: 'online',
        unreadCount: chat.unreadCount
      }));
      setLeads(mappedLeads);
    } catch (error) { alert("Falha ao sincronizar."); } finally { setIsSyncing(false); }
  }, [selectedInstanceName, config]);

  const loadChat = async (lead: KanbanLead) => {
    setSelectedLead(lead);
    setMessages([]);
    if (!selectedInstanceName || !config.evoUrl) return;
    try {
      const baseUrl = config.evoUrl.trim().replace(/\/$/, "");
      const response = await fetch(`${baseUrl}/chat/fetchMessages/${selectedInstanceName}`, {
        method: 'POST',
        headers: { 'apikey': config.evoKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ where: { remoteJid: lead.id }, limit: 15 })
      });
      const data = await response.json();
      const rawMessages = data.messages || data;
      const formattedMsgs: ChatMessage[] = Array.isArray(rawMessages) ? rawMessages.map((m: any) => ({
        id: m.key?.id || Math.random().toString(),
        sender: (m.key?.fromMe ? 'agent' : 'user') as 'agent' | 'user',
        content: m.message?.conversation || m.message?.extendedTextMessage?.text || "Mídia",
        timestamp: new Date(m.messageTimestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      })).reverse() : [];
      setMessages(formattedMsgs);
    } catch (e) {}
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedLead || isSending) return;
    setIsSending(true);
    const tempMsg = newMessage;
    setNewMessage('');
    try {
      const baseUrl = config.evoUrl.trim().replace(/\/$/, "");
      const response = await fetch(`${baseUrl}/message/sendText/${selectedInstanceName}`, {
        method: 'POST',
        headers: { 'apikey': config.evoKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: selectedLead.id, text: tempMsg })
      });
      if (response.ok) {
        setMessages(prev => [...prev, { id: Math.random().toString(), sender: 'agent', content: tempMsg, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
      }
    } catch (e) { setNewMessage(tempMsg); } finally { setIsSending(false); }
  };

  return (
    <Layout activeView={AppView.CHAT_MANAGER} onNavigate={onNavigate} onLogout={onLogout}>
      <div className="h-full flex flex-col gap-4 animate-in fade-in">
        
        {/* Chat Control Compacto */}
        <div className="flex items-center justify-between gap-4 bg-[#03081a] border border-white/5 p-5 rounded-2xl shadow-lg shrink-0">
          <h1 className="text-xl font-black text-white italic uppercase tracking-tighter">Live.</h1>
          
          <div className="flex items-center gap-3 flex-1 justify-end max-w-2xl">
             <select 
               value={selectedInstanceName}
               onChange={(e) => setSelectedInstanceName(e.target.value)}
               className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[10px] text-white font-black uppercase tracking-widest outline-none"
             >
               {availableInstances.map(inst => (
                 <option key={inst.instanceId} value={inst.instanceName || inst.name}>🟢 {inst.instanceName || inst.name}</option>
               ))}
             </select>

             <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-700" size={12} />
                <input placeholder="Procurar..." className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-[10px] text-white font-bold outline-none" />
             </div>

             <button onClick={handleSync} disabled={isSyncing} className="px-4 py-2 bg-orange-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                {isSyncing ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />} Sincronizar
             </button>
          </div>
        </div>

        <div className="flex-1 flex gap-4 overflow-hidden">
          {/* Leads List Compacta */}
          <div className="w-80 flex flex-col gap-3 overflow-y-auto custom-scrollbar">
            {leads.map(lead => (
              <div 
                key={lead.id}
                onClick={() => loadChat(lead)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${selectedLead?.id === lead.id ? 'bg-orange-600/10 border-orange-500/30' : 'bg-[#03081a] border-white/5'}`}
              >
                <div className="flex items-center gap-3 mb-2">
                   <img src={lead.avatar} className="w-10 h-10 rounded-xl border border-white/5" alt="" />
                   <div className="flex-1 min-w-0">
                      <h4 className="text-white font-black text-[11px] truncate uppercase">{lead.name}</h4>
                      <p className="text-[9px] text-slate-600 font-bold">+{lead.phone}</p>
                   </div>
                   {lead.unreadCount ? <div className="w-4 h-4 bg-orange-600 rounded-full flex items-center justify-center text-[8px] font-black text-white">{lead.unreadCount}</div> : null}
                </div>
                <p className="text-slate-500 text-[10px] truncate">"{lead.lastMessage}"</p>
              </div>
            ))}
          </div>

          {/* Chat Window Compacta */}
          {selectedLead ? (
            <div className="flex-1 flex flex-col bg-[#03081a] border border-white/5 rounded-3xl overflow-hidden shadow-xl">
              <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                <div className="flex items-center gap-4">
                   <img src={selectedLead.avatar} className="w-10 h-10 rounded-xl border border-white/5" alt="" />
                   <div>
                      <h3 className="text-sm font-black text-white italic tracking-tight uppercase leading-none mb-1">{selectedLead.name}</h3>
                      <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Ativo no Canal: {selectedInstanceName}</span>
                   </div>
                </div>
              </div>

              <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-6">
                 {messages.map(msg => (
                   <div key={msg.id} className={`flex ${msg.sender === 'agent' ? 'justify-end' : 'justify-start'}`}>
                      <div className="max-w-[80%]">
                         <div className={`p-4 rounded-2xl text-[13px] font-medium leading-relaxed ${msg.sender === 'agent' ? 'bg-orange-600 text-white rounded-tr-none' : 'bg-white/5 text-slate-200 rounded-tl-none'}`}>
                            {msg.content}
                         </div>
                         <p className={`text-[8px] font-black text-slate-700 uppercase mt-1 ${msg.sender === 'agent' ? 'text-right' : 'text-left'}`}>{msg.timestamp}</p>
                      </div>
                   </div>
                 ))}
              </div>

              <div className="p-4 bg-white/[0.01] border-t border-white/5">
                 <div className="flex items-center gap-3">
                    <button className="p-3 bg-white/5 rounded-xl text-slate-500"><Paperclip size={18} /></button>
                    <input 
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Mensagem..."
                      className="flex-1 bg-slate-950 border border-white/10 rounded-xl py-3 px-4 text-xs text-white outline-none focus:border-orange-500"
                    />
                    <button onClick={sendMessage} disabled={!newMessage.trim() || isSending} className="p-3 bg-orange-600 text-white rounded-xl">
                       {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    </button>
                 </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-3xl opacity-20">
               <MessageCircle size={40} className="mb-4" />
               <p className="text-[10px] font-black uppercase tracking-widest">Selecione uma conversa</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ChatManager;
