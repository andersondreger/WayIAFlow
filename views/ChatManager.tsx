
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  MessageSquare, Users, Loader2, RefreshCw, Send, Paperclip, Phone, MoreHorizontal, UserCircle, Search
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
  const [searchTerm, setSearchTerm] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const [config] = useState(() => {
    const saved = localStorage.getItem('wayflow_evo_config');
    return saved ? JSON.parse(saved) : { evoUrl: '', evoKey: '' };
  });

  const [availableInstances, setAvailableInstances] = useState<any[]>([]);
  const [selectedInstanceName, setSelectedInstanceName] = useState<string>(() => {
     return localStorage.getItem('wayflow_last_instance') || '';
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Busca instâncias e garante que a URL esteja correta
  useEffect(() => {
    const fetchInstances = async () => {
      if (!config.evoUrl || !config.evoKey) return;
      try {
        let url = config.evoUrl.trim();
        if (!url.startsWith('http')) url = 'https://' + url;
        const baseUrl = url.replace(/\/$/, "");

        const response = await fetch(`${baseUrl}/instance/fetchInstances`, {
          headers: { 'apikey': config.evoKey }
        });
        const data = await response.json();
        const raw = Array.isArray(data) ? data : (data.instances || data.data || []);
        
        const connected = raw.filter((i: any) => {
          const inst = i.instance || i;
          const st = i.connectionStatus || i.status || inst.status || i.state;
          return st === 'open' || st === 'CONNECTED';
        });
        
        setAvailableInstances(connected);
        if (connected.length > 0 && !selectedInstanceName) {
          const name = connected[0].instanceName || connected[0].name;
          setSelectedInstanceName(name);
        }
      } catch (e) { console.error("Erro instâncias:", e); }
    };
    fetchInstances();
  }, [config]);

  const handleSync = useCallback(async () => {
    if (!selectedInstanceName || !config.evoUrl || !config.evoKey) return;
    setIsSyncing(true);
    
    try {
      let url = config.evoUrl.trim();
      if (!url.startsWith('http')) url = 'https://' + url;
      const baseUrl = url.replace(/\/$/, "");
      
      // BUSCA EM TRÊS FONTES (Resiliência Total)
      const requests = [
        fetch(`${baseUrl}/chat/fetchChats/${selectedInstanceName}`, { headers: { 'apikey': config.evoKey } }).then(r => r.json()).catch(() => []),
        fetch(`${baseUrl}/contact/fetchContacts/${selectedInstanceName}`, { headers: { 'apikey': config.evoKey } }).then(r => r.json()).catch(() => [])
      ];

      const [chatsData, contactsData] = await Promise.all(requests);
      const leadMap = new Map<string, KanbanLead>();

      // Normaliza dados de Chats
      const rawChats = Array.isArray(chatsData) ? chatsData : (chatsData.chats || chatsData.data || []);
      rawChats.forEach((chat: any) => {
        const jid = chat.id || chat.remoteJid || chat.jid;
        if (!jid || jid.includes('@g.us')) return; 

        leadMap.set(jid, {
          id: jid,
          name: chat.name || chat.pushName || jid.split('@')[0],
          phone: jid.split('@')[0],
          lastMessage: chat.lastMessage?.message?.conversation || "Conversa iniciada",
          value: 0,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(chat.name || 'W')}&background=f59e0b&color=fff`,
          columnId: 'ai_processing',
          status: 'online',
          unreadCount: chat.unreadCount || 0
        });
      });

      // Normaliza dados de Contatos (Bypass para quem não tem chat ativo ainda)
      const rawContacts = Array.isArray(contactsData) ? contactsData : (contactsData.contacts || contactsData.data || []);
      rawContacts.forEach((contact: any) => {
        const jid = contact.id || contact.jid || contact.remoteJid;
        if (!jid || jid.includes('@g.us') || leadMap.has(jid)) return;

        leadMap.set(jid, {
          id: jid,
          name: contact.name || contact.pushName || jid.split('@')[0],
          phone: jid.split('@')[0],
          lastMessage: "Novo Contato",
          value: 0,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name || 'W')}&background=1e293b&color=fff`,
          columnId: 'new',
          status: 'online'
        });
      });

      const result = Array.from(leadMap.values());
      setLeads(result);
      localStorage.setItem('wayflow_leads_cache', JSON.stringify(result));
    } catch (error) { 
      console.error("Erro Crítico de Sincronização:", error);
    } finally { setIsSyncing(false); }
  }, [selectedInstanceName, config]);

  useEffect(() => {
    if (selectedInstanceName) {
      handleSync();
      localStorage.setItem('wayflow_last_instance', selectedInstanceName);
    }
  }, [selectedInstanceName, handleSync]);

  const loadChat = async (lead: KanbanLead) => {
    setSelectedLead(lead);
    setMessages([]);
    try {
      let url = config.evoUrl.trim();
      if (!url.startsWith('http')) url = 'https://' + url;
      const baseUrl = url.replace(/\/$/, "");

      const response = await fetch(`${baseUrl}/chat/fetchMessages/${selectedInstanceName}`, {
        method: 'POST',
        headers: { 'apikey': config.evoKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ where: { remoteJid: lead.id }, limit: 30 })
      });
      const data = await response.json();
      const rawMsgs = Array.isArray(data) ? data : (data.messages || data.data || []);

      const formatted: ChatMessage[] = rawMsgs.map((m: any) => ({
        id: m.key?.id || Math.random().toString(),
        sender: m.key?.fromMe ? 'agent' : 'user',
        content: m.message?.conversation || m.message?.extendedTextMessage?.text || "Mídia recebida",
        timestamp: new Date((m.messageTimestamp || Date.now() / 1000) * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      })).reverse();
      
      setMessages(formatted);
    } catch (e) { console.error(e); }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedLead || isSending) return;
    setIsSending(true);
    const text = newMessage;
    setNewMessage('');
    try {
      let url = config.evoUrl.trim();
      if (!url.startsWith('http')) url = 'https://' + url;
      const baseUrl = url.replace(/\/$/, "");

      await fetch(`${baseUrl}/message/sendText/${selectedInstanceName}`, {
        method: 'POST',
        headers: { 'apikey': config.evoKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: selectedLead.id, text: text })
      });
      setMessages(prev => [...prev, { id: Math.random().toString(), sender: 'agent', content: text, timestamp: 'Agora' }]);
    } catch (e) { alert("Erro ao enviar"); } finally { setIsSending(false); }
  };

  const filteredLeads = leads.filter(l => 
    l.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    l.phone.includes(searchTerm)
  );

  return (
    <Layout activeView={AppView.CHAT_MANAGER} onNavigate={onNavigate} onLogout={onLogout}>
      <div className="h-full flex flex-col gap-4 animate-in fade-in duration-500 max-h-[calc(100vh-120px)] overflow-hidden">
        
        {/* Superior: Seletor e Sync */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#03081a] border border-white/10 p-4 rounded-3xl shadow-2xl shrink-0">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-orange-600/20 rounded-2xl flex items-center justify-center text-orange-500 border border-orange-500/20">
                <MessageSquare size={24} />
             </div>
             <div>
                <h1 className="text-xl font-black text-white italic uppercase tracking-tighter leading-none">Central Live.</h1>
                <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-1">Gestão de Atendimento em Tempo Real</p>
             </div>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
             <select 
               value={selectedInstanceName}
               onChange={(e) => setSelectedInstanceName(e.target.value)}
               className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-[10px] text-white font-black uppercase tracking-[0.2em] outline-none cursor-pointer flex-1 md:min-w-[200px]"
             >
               {availableInstances.length === 0 && <option>Nenhum canal ativo</option>}
               {availableInstances.map(inst => (
                 <option key={inst.id} value={inst.instanceName || inst.name}>🟢 {inst.instanceName || inst.name}</option>
               ))}
             </select>

             <button 
              onClick={handleSync} 
              disabled={isSyncing || !selectedInstanceName} 
              className="px-6 py-3 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 transition-all shadow-xl shadow-orange-600/20"
             >
                {isSyncing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} 
                {isSyncing ? 'Buscando...' : 'Sincronizar'}
             </button>
          </div>
        </div>

        <div className="flex-1 flex gap-4 overflow-hidden">
          {/* Coluna de Contatos */}
          <div className="w-full md:w-80 flex flex-col gap-3 bg-[#03081a]/50 border border-white/5 rounded-[2rem] p-4 overflow-hidden h-full">
            <div className="relative mb-2">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
               <input 
                type="text" 
                placeholder="BUSCAR CONTATO..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-[10px] text-white font-black uppercase tracking-widest focus:outline-none focus:border-orange-500/50"
               />
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
              {filteredLeads.length === 0 && !isSyncing && (
                <div className="py-20 text-center opacity-20 flex flex-col items-center border border-dashed border-white/10 rounded-3xl">
                  <Users size={32} className="mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest px-6">Nenhum contato encontrado neste canal.</p>
                </div>
              )}
              {filteredLeads.map(lead => (
                <div 
                  key={lead.id}
                  onClick={() => loadChat(lead)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer group ${selectedLead?.id === lead.id ? 'bg-orange-600/20 border-orange-500/30' : 'bg-white/[0.02] border-white/5 hover:border-white/20'}`}
                >
                  <div className="flex items-center gap-3">
                     <img src={lead.avatar} className="w-10 h-10 rounded-xl border border-white/10" alt="" />
                     <div className="flex-1 min-w-0">
                        <h4 className="text-white font-black text-[11px] truncate uppercase italic">{lead.name}</h4>
                        <p className="text-[9px] text-slate-600 font-bold">+{lead.phone}</p>
                     </div>
                     {lead.unreadCount > 0 && <div className="w-5 h-5 bg-orange-600 rounded-full flex items-center justify-center text-[8px] font-black text-white">{lead.unreadCount}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Área do Chat */}
          {selectedLead ? (
            <div className="flex-1 flex flex-col bg-[#03081a] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl relative z-10">
              <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-4">
                   <img src={selectedLead.avatar} className="w-12 h-12 rounded-2xl border border-white/10 shadow-lg" alt="" />
                   <div>
                      <h3 className="text-sm font-black text-white italic tracking-tighter uppercase leading-none mb-1">{selectedLead.name}</h3>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Sessão: {selectedInstanceName}</span>
                      </div>
                   </div>
                </div>
                <div className="flex gap-2">
                   <button className="p-3 bg-white/5 rounded-xl text-slate-500 hover:text-white transition-all"><Phone size={18} /></button>
                   <button className="p-3 bg-white/5 rounded-xl text-slate-500 hover:text-white transition-all"><MoreHorizontal size={18} /></button>
                </div>
              </div>

              <div ref={scrollRef} className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-6 bg-[radial-gradient(circle_at_bottom_left,_rgba(245,158,11,0.03),_transparent)]">
                 {messages.length === 0 ? (
                   <div className="h-full flex flex-col items-center justify-center opacity-10">
                      <Loader2 size={40} className="animate-spin mb-4" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-center">Buscando histórico do servidor...</p>
                   </div>
                 ) : messages.map(msg => (
                   <div key={msg.id} className={`flex ${msg.sender === 'agent' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                      <div className="max-w-[80%]">
                         <div className={`p-4 rounded-3xl text-[13px] font-medium leading-relaxed shadow-xl ${msg.sender === 'agent' ? 'bg-orange-600 text-white rounded-tr-none' : 'bg-white/5 text-slate-200 border border-white/10 rounded-tl-none'}`}>
                            {msg.content}
                         </div>
                         <p className={`text-[8px] font-black text-slate-700 uppercase mt-2 px-1 ${msg.sender === 'agent' ? 'text-right' : 'text-left'}`}>{msg.timestamp} • {msg.sender === 'agent' ? 'ENVIADO POR VOCÊ' : 'RESPOSTA DO CLIENTE'}</p>
                      </div>
                   </div>
                 ))}
              </div>

              <div className="p-6 bg-white/[0.01] border-t border-white/5">
                 <div className="flex items-center gap-4">
                    <button className="p-4 bg-white/5 rounded-2xl text-slate-500 hover:text-white transition-all"><Paperclip size={20} /></button>
                    <input 
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="ESCREVA SUA MENSAGEM PARA O LEAD..."
                      className="flex-1 bg-slate-950 border border-white/10 rounded-2xl py-5 px-6 text-sm text-white outline-none focus:border-orange-500/50 transition-all placeholder:text-slate-800 font-medium"
                    />
                    <button 
                      onClick={sendMessage} 
                      disabled={!newMessage.trim() || isSending} 
                      className="p-5 bg-orange-600 text-white rounded-2xl shadow-2xl hover:bg-orange-500 disabled:opacity-50 transition-all active:scale-95"
                    >
                       {isSending ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} />}
                    </button>
                 </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[3rem] opacity-30 text-center p-20 bg-white/[0.01]">
               <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-8">
                 <MessageSquare size={48} className="text-orange-500" />
               </div>
               <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-4">Central de Conversas.</h3>
               <p className="text-[11px] font-bold uppercase tracking-[0.2em] max-w-sm leading-relaxed">Selecione um contato na lista lateral para visualizar o histórico neural completo.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ChatManager;
