
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  MessageSquare, Users, Loader2, RefreshCw, Send, Search, AlertTriangle, Zap, Globe, ShieldCheck, Video, Image, Mic
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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
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

  const getCleanUrl = useCallback(() => {
    if (!config.evoUrl) return '';
    let url = config.evoUrl.trim();
    if (!url.startsWith('http')) url = 'https://' + url;
    return url.replace(/\/+$/, "");
  }, [config.evoUrl]);

  const performFetch = async (endpoint: string, options: RequestInit = {}) => {
    const cleanKey = config.evoKey.trim();
    try {
      const res = await fetch(endpoint, {
        ...options,
        headers: { 
          'apikey': cleanKey,
          'Content-Type': 'application/json',
          ...(options.headers || {})
        },
        mode: 'cors'
      });
      
      const data = await res.json().catch(() => null);

      // Tratamento para erro P2000 (Database) ou 500
      if (data?.message?.includes('P2000') || JSON.stringify(data).includes('too long') || res.status === 500) {
        console.warn("Detectado erro de integridade na API Evolution. Filtrando resultados...");
        return data?.records || data?.data || (Array.isArray(data) ? data : null); 
      }

      if (!res.ok) throw new Error(data?.message || `Erro ${res.status}`);
      return data;
    } catch (e: any) {
      console.error("Fetch Error:", e);
      return null;
    }
  };

  const extractMessageText = (m: any) => {
    if (!m || !m.message) return "Mensagem s/ conteúdo";
    const msg = m.message;
    if (msg.conversation) return msg.conversation;
    if (msg.extendedTextMessage?.text) return msg.extendedTextMessage.text;
    if (msg.videoMessage) return "📹 Vídeo";
    if (msg.imageMessage) return "🖼️ Imagem";
    if (msg.audioMessage) return "🎵 Áudio";
    if (msg.documentMessage) return "📄 Documento";
    return "Mídia/Interação";
  };

  const handleSync = useCallback(async () => {
    const baseUrl = getCleanUrl();
    if (!selectedInstanceName || !baseUrl || !config.evoKey) {
      setErrorMsg("Verifique as configurações da Evolution API.");
      return;
    }
    
    setIsSyncing(true);
    setErrorMsg(null);
    setLeads([]);
    
    try {
      const stateData = await performFetch(`${baseUrl}/instance/connectionState/${selectedInstanceName}`);
      const state = stateData?.instance?.state || stateData?.state;

      if (state !== 'open' && state !== 'CONNECTED') {
        throw new Error("WhatsApp Desconectado. Verifique o celular.");
      }

      // Busca mensagens recentes - Ajustado para o formato do log enviado
      const msgData = await performFetch(`${baseUrl}/chat/findMessages/${selectedInstanceName}`, {
        method: 'POST',
        body: JSON.stringify({ where: {}, limit: 100 })
      });
      
      const records = Array.isArray(msgData) ? msgData : (msgData?.records || msgData?.data || []);
      
      if (!records || records.length === 0) {
        // Fallback para findChats se mensagens falhar
        const chatData = await performFetch(`${baseUrl}/chat/findChats/${selectedInstanceName}`, {
          method: 'POST',
          body: JSON.stringify({ where: {}, limit: 50 })
        });
        const chatRecords = Array.isArray(chatData) ? chatData : (chatData?.records || chatData?.data || []);
        if (chatRecords.length === 0) {
           setErrorMsg("Nenhum lead encontrado. Certifique-se de que há conversas ativas.");
           return;
        }
      }

      let leadsMap = new Map<string, KanbanLead>();

      records.forEach((m: any) => {
        // Lógica de extração de JID baseada nos logs (Suporte a LID e participantAlt)
        const key = m.key || {};
        const remoteJid = key.remoteJid || "";
        const participantAlt = key.participantAlt || "";
        const participant = key.participant || "";

        // Prioriza o JID da pessoa física, mesmo se a mensagem for em grupo
        let actualJid = remoteJid;
        if (remoteJid.includes('@g.us')) {
           actualJid = participantAlt || participant || remoteJid;
        }
        
        if (actualJid && !actualJid.includes('@g.us') && actualJid !== 'status@broadcast') {
          const cleanJid = actualJid.split(':')[0].split('@')[0] + '@s.whatsapp.net';
          const phone = cleanJid.split('@')[0];
          
          if (!leadsMap.has(cleanJid)) {
            leadsMap.set(cleanJid, {
              id: cleanJid,
              name: m.pushName || `Cliente ${phone}`,
              phone: phone,
              lastMessage: extractMessageText(m),
              value: 0,
              avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(m.pushName || phone)}&background=f59e0b&color=fff`,
              columnId: 'ai_processing',
              status: 'online'
            });
          }
        }
      });

      setLeads(Array.from(leadsMap.values()));
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setIsSyncing(false);
    }
  }, [selectedInstanceName, config.evoKey, getCleanUrl]);

  useEffect(() => {
    const fetchInstances = async () => {
      const baseUrl = getCleanUrl();
      if (!baseUrl || !config.evoKey) return;
      try {
        const response = await fetch(`${baseUrl}/instance/fetchInstances`, { headers: { 'apikey': config.evoKey.trim() } });
        const data = await response.json();
        const instances = Array.isArray(data) ? data : (data.instances || data.data || []);
        const connected = instances.filter((i: any) => {
          const s = i.connectionStatus || i.status || i.instance?.status || i.state;
          return s === 'open' || s === 'CONNECTED';
        });
        setAvailableInstances(connected);
        if (connected.length > 0 && !selectedInstanceName) {
          const firstInst = connected[0].instanceName || connected[0].name;
          setSelectedInstanceName(firstInst);
          localStorage.setItem('wayflow_last_instance', firstInst);
        }
      } catch (e) { console.error("Erro instâncias"); }
    };
    fetchInstances();
  }, [config.evoKey, getCleanUrl, selectedInstanceName]);

  const loadChat = async (lead: KanbanLead) => {
    setSelectedLead(lead);
    setMessages([]);
    try {
      const data = await performFetch(`${getCleanUrl()}/chat/findMessages/${selectedInstanceName}`, {
        method: 'POST',
        body: JSON.stringify({ where: { remoteJid: lead.id }, limit: 40 })
      });
      if (!data) return;
      
      const records = Array.isArray(data) ? data : (data.records || data.data || []);
      const formatted: ChatMessage[] = records.map((m: any): ChatMessage => ({
        id: m.key?.id || Math.random().toString(),
        sender: (m.key?.fromMe ? 'agent' : 'user'),
        content: extractMessageText(m),
        timestamp: new Date((m.messageTimestamp || Date.now() / 1000) * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      })).reverse();
      setMessages(formatted);
    } catch (e) { console.error("Erro mensagens"); }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedLead || isSending) return;
    setIsSending(true);
    const text = newMessage;
    setNewMessage('');
    try {
      const res = await performFetch(`${getCleanUrl()}/message/sendText/${selectedInstanceName}`, {
        method: 'POST',
        body: JSON.stringify({ number: selectedLead.id, text, delay: 1000 })
      });
      if (res) {
        setMessages(prev => [...prev, { id: Math.random().toString(), sender: 'agent', content: text, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
      }
    } catch (e) { 
      alert("Falha no envio."); 
      setNewMessage(text); 
    } finally { 
      setIsSending(false); 
    }
  };

  return (
    <Layout activeView={AppView.CHAT_MANAGER} onNavigate={onNavigate} onLogout={onLogout}>
      <div className="h-full flex flex-col gap-6 overflow-hidden">
        
        {/* Commander Bar */}
        <div className="bg-[#03081a] border border-white/10 p-6 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-4 shadow-2xl">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                <Zap size={24} />
             </div>
             <div>
                <h1 className="text-xl font-black text-white italic uppercase tracking-tighter leading-none">Commander Center</h1>
                <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1">Status: <span className={selectedInstanceName ? 'text-emerald-500' : 'text-red-500'}>{selectedInstanceName ? 'Uplink Ativo' : 'Offline'}</span></p>
             </div>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
             <select 
               value={selectedInstanceName} 
               onChange={(e) => { setSelectedInstanceName(e.target.value); localStorage.setItem('wayflow_last_instance', e.target.value); }}
               className="bg-white/5 border border-white/10 rounded-2xl px-6 py-3.5 text-[10px] text-white font-black uppercase tracking-widest outline-none cursor-pointer flex-1 md:min-w-[200px]"
             >
               {availableInstances.length === 0 && <option>Sem Instâncias Conectadas</option>}
               {availableInstances.map(i => <option key={i.id} value={i.instanceName || i.name}>📡 {i.instanceName || i.name}</option>)}
             </select>
             <button onClick={handleSync} disabled={isSyncing} className="px-10 py-3.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 shadow-xl transition-all active:scale-95">
                {isSyncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />} Sincronizar Leads
             </button>
          </div>
        </div>

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/20 p-5 rounded-[2rem] flex items-center gap-4 text-red-500 animate-in slide-in-from-top-2">
             <AlertTriangle size={20} className="shrink-0" />
             <div className="flex-1">
               <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">Handshake Fail</p>
               <p className="text-[11px] opacity-80 leading-snug">{errorMsg}</p>
             </div>
             <button onClick={handleSync} className="px-5 py-2 bg-orange-600 text-white rounded-xl text-[9px] font-black uppercase">Re-Scan</button>
          </div>
        )}

        <div className="flex-1 flex gap-6 overflow-hidden">
          {/* Sidebar */}
          <div className="w-full md:w-85 flex flex-col gap-4 bg-[#03081a]/50 border border-white/5 rounded-[3rem] p-5 h-full overflow-hidden">
            <div className="relative">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700" size={16} />
               <input 
                 type="text" 
                 placeholder="FILTRAR LEADS..." 
                 value={searchTerm} 
                 onChange={(e) => setSearchTerm(e.target.value)} 
                 className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-[10px] text-white font-black uppercase tracking-widest outline-none focus:border-orange-500/50 transition-all placeholder:text-slate-800"
               />
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1">
              {leads.filter(l => l.name.toLowerCase().includes(searchTerm.toLowerCase())).map(lead => (
                <div 
                  key={lead.id} 
                  onClick={() => loadChat(lead)} 
                  className={`p-4 rounded-[2rem] border transition-all cursor-pointer flex items-center gap-4 group ${selectedLead?.id === lead.id ? 'bg-orange-600/20 border-orange-500/30 shadow-lg shadow-orange-600/10' : 'bg-white/[0.02] border-white/5 hover:border-white/20'}`}
                >
                  <img src={lead.avatar} className="w-12 h-12 rounded-2xl border border-white/10 group-hover:scale-105 transition-transform shrink-0" alt="" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-black text-[12px] truncate uppercase italic tracking-tight">{lead.name}</h4>
                    <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">{lead.lastMessage}</p>
                  </div>
                </div>
              ))}
              {leads.length === 0 && !isSyncing && (
                <div className="h-full flex flex-col items-center justify-center opacity-20 text-center p-10">
                   <Users size={48} className="mb-4" />
                   <p className="text-[10px] font-black uppercase tracking-widest">Nenhum lead detectado.<br/>Use o botão sincronizar.</p>
                </div>
              )}
            </div>
          </div>

          {/* Chat */}
          {selectedLead ? (
            <div className="flex-1 flex flex-col bg-[#03081a] border border-white/10 rounded-[4rem] overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-4">
                  <img src={selectedLead.avatar} className="w-12 h-12 rounded-2xl border border-white/10" alt="" />
                  <div>
                    <h3 className="text-sm font-black text-white italic uppercase tracking-tighter leading-none mb-1">{selectedLead.name}</h3>
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2 leading-none">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> +{selectedLead.phone}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                   <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/5 flex items-center gap-2">
                      <ShieldCheck size={14} className="text-orange-500" />
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Atendimento Seguro</span>
                   </div>
                </div>
              </div>

              <div ref={scrollRef} className="flex-1 p-8 overflow-y-auto custom-scrollbar space-y-6">
                 {messages.map(msg => (
                   <div key={msg.id} className={`flex ${msg.sender === 'agent' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                      <div className="max-w-[75%]">
                         <div className={`p-5 rounded-[2.5rem] text-[13px] font-medium leading-relaxed shadow-xl ${msg.sender === 'agent' ? 'bg-orange-600 text-white rounded-tr-none' : 'bg-white/5 text-slate-200 border border-white/10 rounded-tl-none'}`}>
                           {msg.content}
                         </div>
                         <p className={`text-[8px] font-black text-slate-700 uppercase mt-2 px-2 ${msg.sender === 'agent' ? 'text-right' : 'text-left'}`}>{msg.timestamp}</p>
                      </div>
                   </div>
                 ))}
              </div>

              <div className="p-8 border-t border-white/5 bg-white/[0.01]">
                 <div className="flex items-center gap-4 bg-slate-950 p-2 rounded-[2.5rem] border border-white/10 shadow-inner">
                    <input 
                      value={newMessage} 
                      onChange={(e) => setNewMessage(e.target.value)} 
                      onKeyDown={(e) => e.key === 'Enter' && sendMessage()} 
                      placeholder="ESCREVER RESPOSTA..." 
                      className="flex-1 bg-transparent border-none py-4 px-6 text-sm text-white outline-none focus:ring-0 placeholder:text-slate-800"
                    />
                    <button 
                      onClick={sendMessage} 
                      disabled={!newMessage.trim() || isSending} 
                      className="p-4 bg-orange-600 text-white rounded-full shadow-2xl hover:bg-orange-500 transition-all active:scale-90 shadow-orange-600/40 disabled:opacity-50"
                    >
                      {isSending ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} />}
                    </button>
                 </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-[5rem] opacity-30 text-center p-20 bg-white/[0.01]">
               <div className="w-24 h-24 bg-orange-600/10 rounded-full flex items-center justify-center text-orange-500 mb-6">
                  <Globe size={48} className="animate-pulse" />
               </div>
               <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-4">Uplink Estabelecido.</h3>
               <p className="text-[11px] font-bold uppercase tracking-[0.3em] max-w-sm leading-relaxed">
                 Aguardando seleção de lead para monitoramento de canal.
               </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ChatManager;
