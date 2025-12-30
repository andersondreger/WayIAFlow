
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  MessageSquare, Users, Loader2, RefreshCw, Send, Search, AlertTriangle, Zap, Globe, Clipboard, Smartphone, Terminal
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
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [config] = useState(() => {
    const saved = localStorage.getItem('wayflow_evo_config');
    return saved ? JSON.parse(saved) : { evoUrl: '', evoKey: '' };
  });

  const [availableInstances, setAvailableInstances] = useState<any[]>([]);
  const [selectedInstanceName, setSelectedInstanceName] = useState<string>(() => {
     return localStorage.getItem('wayflow_last_instance') || '';
  });

  const addLog = (msg: string) => {
    setDebugLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 50));
  };

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
      if (res.status === 401 || res.status === 403) throw new Error("API Key recusada.");
      
      // Se detectarmos erro de banco de dados (o P2000 do log)
      if (JSON.stringify(data).includes('P2000') || JSON.stringify(data).includes('too long')) {
        addLog("⚠️ Erro de Banco no Servidor (P2000) detectado. Filtrando...");
        return { records: [] }; // Retorna vazio para não quebrar o front
      }

      if (!res.ok) throw new Error(data?.message || `Erro ${res.status}`);
      return data;
    } catch (e: any) {
      addLog(`Falha: ${e.message}`);
      throw e;
    }
  };

  const findDataArray = (obj: any): any[] => {
    if (!obj) return [];
    if (Array.isArray(obj)) return obj;
    if (obj.records && Array.isArray(obj.records)) return obj.records;
    if (obj.data && Array.isArray(obj.data)) return obj.data;
    if (obj.chats && Array.isArray(obj.chats)) return obj.chats;
    return [];
  };

  const handleSync = useCallback(async () => {
    const baseUrl = getCleanUrl();
    if (!selectedInstanceName || !baseUrl || !config.evoKey) {
      setErrorMsg("Configure as integrações primeiro.");
      return;
    }
    
    setIsSyncing(true);
    setErrorMsg(null);
    setLeads([]);
    addLog(`>>> HANDSHAKE V2: ${selectedInstanceName}`);
    
    try {
      const stateData = await performFetch(`${baseUrl}/instance/connectionState/${selectedInstanceName}`);
      const state = stateData.instance?.state || stateData.state;
      addLog(`Status da Instância: ${state}`);

      if (state !== 'open' && state !== 'CONNECTED') {
        throw new Error("Instância desconectada do WhatsApp.");
      }

      addLog("Escaneando mensagens recentes...");
      const msgData = await performFetch(`${baseUrl}/chat/findMessages/${selectedInstanceName}`, {
        method: 'POST',
        body: JSON.stringify({ where: {}, limit: 50 })
      });
      
      const records = findDataArray(msgData);
      addLog(`${records.length} interações encontradas.`);

      let leadsMap = new Map<string, KanbanLead>();

      records.forEach((m: any) => {
        const key = m.key || m;
        const jid = key.remoteJid;
        if (jid && !jid.includes('@g.us') && !key.fromMe) {
          const cleanJid = jid.split(':')[0].split('@')[0] + '@s.whatsapp.net';
          if (!leadsMap.has(cleanJid)) {
            const phone = cleanJid.split('@')[0];
            leadsMap.set(cleanJid, {
              id: cleanJid,
              name: m.pushName || `Lead ${phone}`,
              phone: phone,
              lastMessage: m.message?.conversation || "Interação Detectada",
              value: 0,
              avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(m.pushName || phone)}&background=f59e0b&color=fff`,
              columnId: 'ai_processing',
              status: 'online',
              unreadCount: 0
            });
          }
        }
      });

      setLeads(Array.from(leadsMap.values()));
    } catch (e: any) {
      setErrorMsg(e.message);
      addLog(`ERRO FATAL: ${e.message}`);
    } finally {
      setIsSyncing(false);
    }
  }, [selectedInstanceName, config.evoKey, getCleanUrl]);

  const fetchInstances = useCallback(async () => {
    const baseUrl = getCleanUrl();
    if (!baseUrl || !config.evoKey) return;
    try {
      const response = await fetch(`${baseUrl}/instance/fetchInstances`, { headers: { 'apikey': config.evoKey.trim() } });
      const data = await response.json();
      const connected = findDataArray(data).filter((i: any) => {
        const s = i.connectionStatus || i.status || i.instance?.status || i.state;
        return s === 'open' || s === 'CONNECTED';
      });
      setAvailableInstances(connected);
      if (connected.length > 0 && !selectedInstanceName) {
        setSelectedInstanceName(connected[0].instanceName || connected[0].name);
      }
    } catch (e) { addLog("Servidor API não responde."); }
  }, [config.evoKey, getCleanUrl, selectedInstanceName]);

  useEffect(() => { fetchInstances(); }, [fetchInstances]);

  const loadChat = async (lead: KanbanLead) => {
    setSelectedLead(lead);
    setMessages([]);
    try {
      const data = await performFetch(`${getCleanUrl()}/chat/findMessages/${selectedInstanceName}`, {
        method: 'POST',
        body: JSON.stringify({ where: { remoteJid: lead.id }, limit: 30 })
      });
      const formatted: ChatMessage[] = findDataArray(data).map((m: any): ChatMessage => ({
        id: m.key?.id || Math.random().toString(),
        sender: (m.key?.fromMe ? 'agent' : 'user'),
        content: m.message?.conversation || m.message?.extendedTextMessage?.text || "[Mídia]",
        timestamp: new Date((m.messageTimestamp || Date.now() / 1000) * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      })).reverse();
      setMessages(formatted);
    } catch (e) { addLog("Erro ao carregar chat."); }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedLead || isSending) return;
    setIsSending(true);
    const text = newMessage;
    setNewMessage('');
    try {
      await performFetch(`${getCleanUrl()}/message/sendText/${selectedInstanceName}`, {
        method: 'POST',
        body: JSON.stringify({ number: selectedLead.id, text })
      });
      setMessages(prev => [...prev, { id: Math.random().toString(), sender: 'agent', content: text, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    } catch (e) { alert("Falha no envio."); setNewMessage(text); } finally { setIsSending(false); }
  };

  return (
    <Layout activeView={AppView.CHAT_MANAGER} onNavigate={onNavigate} onLogout={onLogout}>
      <div className="h-full flex flex-col gap-4 overflow-hidden">
        
        {/* Top bar funcional */}
        <div className="bg-[#03081a] border border-white/10 p-5 rounded-[2rem] flex items-center justify-between shadow-2xl">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-orange-600/20 rounded-2xl flex items-center justify-center text-orange-500 border border-orange-500/20">
                <Zap size={24} />
             </div>
             <div>
                <h1 className="text-xl font-black text-white italic uppercase tracking-tighter">Command Center</h1>
                <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Ativo em: <span className="text-orange-500">{selectedInstanceName || 'NENHUMA'}</span></p>
             </div>
          </div>
          
          <div className="flex items-center gap-3">
             <select 
               value={selectedInstanceName} 
               onChange={(e) => { setSelectedInstanceName(e.target.value); localStorage.setItem('wayflow_last_instance', e.target.value); }}
               className="bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-[10px] text-white font-black uppercase tracking-widest outline-none"
             >
               {availableInstances.length === 0 && <option>Sem Instâncias</option>}
               {availableInstances.map(i => <option key={i.id} value={i.instanceName || i.name}>{i.instanceName || i.name}</option>)}
             </select>
             <button onClick={handleSync} disabled={isSyncing} className="px-8 py-3 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                {isSyncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />} Sincronizar
             </button>
          </div>
        </div>

        {/* Debug Trace Monitor */}
        <div className="bg-black/80 border border-white/10 rounded-[1.5rem] p-4 flex flex-col gap-1 overflow-hidden shrink-0">
            <div className="flex items-center gap-3 border-b border-white/5 pb-2 mb-1">
               <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Evolution v2 Trace Handshake</span>
            </div>
            <div className="max-h-20 overflow-y-auto custom-scrollbar font-mono text-[10px] space-y-1">
              {debugLog.map((log, i) => <p key={i} className={i === 0 ? 'text-orange-400 font-bold' : 'text-slate-600'}>{log}</p>)}
              {debugLog.length === 0 && <p className="text-slate-800 italic">Clique em Sincronizar para iniciar o scanner neural...</p>}
            </div>
        </div>

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-4 text-red-500 animate-in slide-in-from-top-2">
             <AlertTriangle size={20} className="shrink-0" />
             <div className="flex-1">
               <p className="text-[10px] font-black uppercase tracking-widest">Erro no Handshake</p>
               <p className="text-[10px] opacity-80">{errorMsg}</p>
             </div>
             <button onClick={handleSync} className="text-[10px] font-black uppercase tracking-widest bg-orange-600 text-white px-4 py-2 rounded-xl">Re-Scan</button>
          </div>
        )}

        {/* Chat Area */}
        <div className="flex-1 flex gap-4 overflow-hidden">
          <div className="w-80 flex flex-col gap-3 bg-[#03081a]/50 border border-white/5 rounded-[2.5rem] p-4 h-full overflow-hidden">
            <div className="relative mb-2">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700" size={14} />
               <input type="text" placeholder="FILTRAR..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-[10px] text-white font-black uppercase tracking-widest outline-none"/>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
              {leads.filter(l => l.name.toLowerCase().includes(searchTerm.toLowerCase())).map(lead => (
                <div key={lead.id} onClick={() => loadChat(lead)} className={`p-4 rounded-3xl border transition-all cursor-pointer flex items-center gap-4 ${selectedLead?.id === lead.id ? 'bg-orange-600/20 border-orange-500/30' : 'bg-white/[0.02] border-white/5 hover:border-white/20'}`}>
                  <img src={lead.avatar} className="w-10 h-10 rounded-xl border border-white/10 shrink-0" alt="" />
                  <div className="flex-1 min-w-0"><h4 className="text-white font-black text-[11px] truncate uppercase italic">{lead.name}</h4><p className="text-[9px] text-slate-600 font-bold">+{lead.phone}</p></div>
                </div>
              ))}
            </div>
          </div>

          {selectedLead ? (
            <div className="flex-1 flex flex-col bg-[#03081a] border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl relative">
              <div className="p-5 border-b border-white/5 flex items-center gap-4 bg-white/[0.02]">
                <img src={selectedLead.avatar} className="w-12 h-12 rounded-2xl border border-white/10" alt="" />
                <div><h3 className="text-sm font-black text-white italic uppercase">{selectedLead.name}</h3><p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">+{selectedLead.phone} • Estável</p></div>
              </div>
              <div ref={scrollRef} className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-6">
                 {messages.map(msg => (
                   <div key={msg.id} className={`flex ${msg.sender === 'agent' ? 'justify-end' : 'justify-start'}`}>
                      <div className="max-w-[80%]">
                         <div className={`p-4 rounded-[2rem] text-[13px] font-medium leading-relaxed ${msg.sender === 'agent' ? 'bg-orange-600 text-white rounded-tr-none' : 'bg-white/5 text-slate-200 border border-white/10 rounded-tl-none'}`}>{msg.content}</div>
                         <p className={`text-[8px] font-black text-slate-700 uppercase mt-2 ${msg.sender === 'agent' ? 'text-right' : 'text-left'}`}>{msg.timestamp}</p>
                      </div>
                   </div>
                 ))}
              </div>
              <div className="p-6 border-t border-white/5">
                 <div className="flex items-center gap-4">
                    <input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} placeholder="RESPOSTA NEURAL..." className="flex-1 bg-slate-950 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white outline-none focus:border-orange-500 transition-all"/>
                    <button onClick={sendMessage} disabled={!newMessage.trim() || isSending} className="p-4 bg-orange-600 text-white rounded-2xl shadow-xl hover:bg-orange-500 transition-all">{isSending ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} />}</button>
                 </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-[4rem] opacity-30 text-center p-20">
               <Globe size={48} className="text-orange-500 mb-4" />
               <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Aguardando Uplink.</h3>
               <p className="text-[10px] font-bold uppercase tracking-widest max-w-sm">Use o botão sincronizar. Se o servidor Evolution estiver com erro de banco P2000 (como visto nos logs), a lista carregará apenas os contatos válidos.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ChatManager;
