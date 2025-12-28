
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Search, MessageCircle, Smartphone, Users, Zap, CheckCircle2, 
  Clock, Loader2, RefreshCw, Send, Paperclip, Phone, MoreHorizontal, AlertCircle
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
  const scrollRef = useRef<HTMLDivElement>(null);

  const [config] = useState(() => {
    const saved = localStorage.getItem('wayflow_evo_config');
    return saved ? JSON.parse(saved) : { evoUrl: '', evoKey: '' };
  });

  const [availableInstances, setAvailableInstances] = useState<any[]>([]);
  const [selectedInstanceName, setSelectedInstanceName] = useState<string>(() => {
     return localStorage.getItem('wayflow_last_instance') || '';
  });

  // Rola o chat para o final ao carregar mensagens
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Carregar instâncias disponíveis e conectar automaticamente
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
        
        if (connected.length > 0) {
          if (!selectedInstanceName || !connected.find(c => (c.instanceName || c.name) === selectedInstanceName)) {
            const firstInstance = connected[0].instanceName || connected[0].name;
            setSelectedInstanceName(firstInstance);
            localStorage.setItem('wayflow_last_instance', firstInstance);
          }
        }
      } catch (e) { console.error("Erro ao buscar instâncias:", e); }
    };
    fetchInstances();
  }, [config, selectedInstanceName]);

  const handleSync = useCallback(async () => {
    if (!selectedInstanceName || !config.evoUrl || !config.evoKey) {
       console.warn("Configuração incompleta para sincronização.");
       return;
    }
    
    setIsSyncing(true);
    console.log(`Iniciando sincronização para: ${selectedInstanceName}`);
    
    try {
      const baseUrl = config.evoUrl.trim().replace(/\/$/, "");
      
      // Busca em múltiplas fontes para garantir que nenhum contato se perca
      const [chatsRes, contactsRes] = await Promise.all([
        fetch(`${baseUrl}/chat/fetchChats/${selectedInstanceName}`, { headers: { 'apikey': config.evoKey } }).catch(() => null),
        fetch(`${baseUrl}/contact/fetchContacts/${selectedInstanceName}`, { headers: { 'apikey': config.evoKey } }).catch(() => null)
      ]);

      const chatsData = chatsRes ? await chatsRes.json() : [];
      const contactsData = contactsRes ? await contactsRes.json() : [];

      console.log("Resposta Chats:", chatsData);
      console.log("Resposta Contatos:", contactsData);

      const rawChats = Array.isArray(chatsData) ? chatsData : (chatsData.chats || chatsData.data || []);
      const rawContacts = Array.isArray(contactsData) ? contactsData : (contactsData.contacts || contactsData.data || []);

      const leadMap = new Map<string, KanbanLead>();

      // 1. Processar quem já tem conversa ativa
      rawChats.forEach((chat: any) => {
        const jid = chat.id || chat.remoteJid || chat.jid;
        if (!jid || jid.includes('@g.us')) return; 

        leadMap.set(jid, {
          id: jid,
          name: chat.name || chat.pushName || jid.split('@')[0],
          phone: jid.split('@')[0],
          lastMessage: chat.lastMessage?.message?.conversation || 
                       chat.lastMessage?.message?.extendedTextMessage?.text || 
                       "Nova Conversa",
          value: 0,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(chat.name || 'W')}&background=f59e0b&color=fff`,
          columnId: (chat.unreadCount > 0) ? 'new' : 'ai_processing',
          status: 'online',
          unreadCount: chat.unreadCount || 0
        });
      });

      // 2. Mesclar com a lista de contatos salvos
      rawContacts.forEach((contact: any) => {
        const jid = contact.id || contact.jid || contact.remoteJid;
        if (!jid || jid.includes('@g.us') || leadMap.has(jid)) return;

        leadMap.set(jid, {
          id: jid,
          name: contact.name || contact.pushName || jid.split('@')[0],
          phone: jid.split('@')[0],
          lastMessage: "Sem histórico recente",
          value: 0,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name || 'W')}&background=334155&color=fff`,
          columnId: 'new',
          status: 'online',
          unreadCount: 0
        });
      });

      const finalLeads = Array.from(leadMap.values());
      setLeads(finalLeads);
      console.log(`Total de leads carregados: ${finalLeads.length}`);
      
    } catch (error) { 
      console.error("Erro fatal na sincronização:", error);
      alert("Erro ao conectar com a Evolution API. Verifique sua URL e Key.");
    } finally { 
      setIsSyncing(false); 
    }
  }, [selectedInstanceName, config]);

  // Sincroniza automaticamente ao trocar de canal
  useEffect(() => {
    if (selectedInstanceName) {
      handleSync();
    }
  }, [selectedInstanceName, handleSync]);

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

      const formatted: ChatMessage[] = rawMsgs.map((m: any) => {
        const content = m.message?.conversation || 
                        m.message?.extendedTextMessage?.text || 
                        m.message?.imageMessage?.caption ||
                        m.message?.videoMessage?.caption ||
                        (m.key?.fromMe ? "Arquivo enviado" : "Arquivo recebido");

        return {
          id: m.key?.id || Math.random().toString(),
          sender: (m.key?.fromMe ? 'agent' : 'user') as any,
          content: content,
          timestamp: new Date((m.messageTimestamp || Date.now() / 1000) * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
      }).reverse();
      
      setMessages(formatted);
    } catch (e) { console.error("Erro ao carregar mensagens:", e); }
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
    } catch (e) { 
      setNewMessage(text);
      alert("Falha ao enviar. Verifique o status do canal.");
    } finally { setIsSending(false); }
  };

  return (
    <Layout activeView={AppView.CHAT_MANAGER} onNavigate={onNavigate} onLogout={onLogout}>
      <div className="h-full flex flex-col gap-4 animate-in fade-in max-h-[calc(100vh-140px)]">
        
        {/* Toolbar de Controle */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#03081a] border border-white/5 p-4 rounded-2xl shadow-xl shrink-0">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-orange-600/10 rounded-xl flex items-center justify-center text-orange-500 border border-orange-500/20">
                <MessageCircle size={20} />
             </div>
             <h1 className="text-xl font-black text-white italic uppercase tracking-tighter">Atendimento Live.</h1>
          </div>
          
          <div className="flex items-center gap-3 flex-1 justify-end w-full md:max-w-2xl">
             <select 
               value={selectedInstanceName}
               onChange={(e) => {
                 setSelectedInstanceName(e.target.value);
                 localStorage.setItem('wayflow_last_instance', e.target.value);
               }}
               className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-[10px] text-white font-black uppercase tracking-widest outline-none cursor-pointer flex-1 md:flex-none"
             >
               {availableInstances.length === 0 && <option>Selecione um Canal</option>}
               {availableInstances.map(inst => (
                 <option key={inst.id} value={inst.instanceName || inst.name}>🟢 {inst.instanceName || inst.name}</option>
               ))}
             </select>

             <button 
              onClick={handleSync} 
              disabled={isSyncing || !selectedInstanceName} 
              className="px-6 py-2.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg"
             >
                {isSyncing ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />} 
                {isSyncing ? 'Sincronizando...' : 'Atualizar Conversas'}
             </button>
          </div>
        </div>

        <div className="flex-1 flex gap-4 overflow-hidden min-h-0">
          {/* Listagem de Leads */}
          <div className="w-full md:w-80 flex flex-col gap-3 overflow-y-auto custom-scrollbar pr-2 shrink-0 h-full">
            {leads.length === 0 && !isSyncing && (
              <div className="py-20 text-center opacity-30 flex flex-col items-center border border-dashed border-white/5 rounded-3xl">
                <Users size={32} className="mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">Nenhum contato <br/> encontrado neste canal.</p>
              </div>
            )}
            {leads.map(lead => (
              <div 
                key={lead.id}
                onClick={() => loadChat(lead)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer relative group ${selectedLead?.id === lead.id ? 'bg-orange-600/10 border-orange-500/30' : 'bg-[#03081a] border-white/5 hover:border-white/20'}`}
              >
                <div className="flex items-center gap-3 mb-2">
                   <img src={lead.avatar} className="w-10 h-10 rounded-xl border border-white/5 bg-slate-900" alt="" />
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

          {/* Chat / Histórico */}
          {selectedLead ? (
            <div className="hidden md:flex flex-1 flex flex-col bg-[#03081a] border border-white/5 rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-right-4">
              <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                <div className="flex items-center gap-4">
                   <img src={selectedLead.avatar} className="w-10 h-10 rounded-xl border border-white/5 bg-slate-900" alt="" />
                   <div>
                      <h3 className="text-sm font-black text-white italic tracking-tight uppercase leading-none mb-1">{selectedLead.name}</h3>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Ativo em {selectedInstanceName}</span>
                      </div>
                   </div>
                </div>
                <div className="flex gap-2">
                   <button className="p-3 bg-white/5 rounded-xl text-slate-600 hover:text-white transition-all"><Phone size={16} /></button>
                   <button className="p-3 bg-white/5 rounded-xl text-slate-600 hover:text-white transition-all"><MoreHorizontal size={16} /></button>
                </div>
              </div>

              <div ref={scrollRef} className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-6 bg-[radial-gradient(circle_at_top_right,_rgba(245,158,11,0.03),_transparent)]">
                 {messages.length === 0 ? (
                   <div className="h-full flex flex-col items-center justify-center opacity-10">
                      <Loader2 size={32} className="animate-spin mb-2" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-center">Carregando histórico de <br/>mensagens do servidor...</p>
                   </div>
                 ) : messages.map(msg => (
                   <div key={msg.id} className={`flex ${msg.sender === 'agent' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                      <div className="max-w-[75%]">
                         <div className={`p-4 rounded-2xl text-[13px] font-medium leading-relaxed shadow-lg ${msg.sender === 'agent' ? 'bg-orange-600 text-white rounded-tr-none' : 'bg-white/5 text-slate-200 border border-white/10 rounded-tl-none'}`}>
                            {msg.content}
                         </div>
                         <p className={`text-[8px] font-black text-slate-700 uppercase mt-1.5 px-1 ${msg.sender === 'agent' ? 'text-right' : 'text-left'}`}>{msg.timestamp} • {msg.sender === 'agent' ? 'ENVIADO POR VOCÊ' : 'RESPOSTA DO CLIENTE'}</p>
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
                      placeholder="Escreva sua resposta para o lead..."
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
            <div className="hidden md:flex flex-1 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-3xl opacity-20 text-center p-10 bg-white/[0.01]">
               <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                 <MessageCircle size={40} />
               </div>
               <h3 className="text-xl font-black text-white italic uppercase tracking-tight mb-2">Selecione uma Conversa.</h3>
               <p className="text-[10px] font-bold uppercase tracking-widest max-w-xs">Clique em um contato ao lado para visualizar o histórico neural de mensagens.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ChatManager;
