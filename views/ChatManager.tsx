
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  MessageSquare, Users, Loader2, RefreshCw, Send, Paperclip, Phone, MoreHorizontal, UserCircle, Search, AlertTriangle, ShieldCheck, Database, Terminal, Zap, Globe, WifiOff, Scan, Activity, Cpu, Code, Copy, ChevronDown, ChevronUp, Image as ImageIcon, Clipboard, CheckCircle2, Video, Microscope, Wifi
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
  const [lastRawResponse, setLastRawResponse] = useState<any>(null);
  const [showRawError, setShowRawError] = useState(false);
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

  const copyFullLog = () => {
    const logText = debugLog.join('\n') + '\n\nRAW_DATA_DUMP:\n' + JSON.stringify(lastRawResponse, null, 2);
    navigator.clipboard.writeText(logText);
    alert("Log de diagnóstico copiado!");
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
      setLastRawResponse(data);

      if (res.status >= 500) {
        // Detectando o erro P2000 do log do usuário
        if (data?.message?.includes('P2000') || JSON.stringify(data).includes('too long')) {
          throw new Error("Erro de Banco de Dados no Servidor (P2000): O Evolution API não consegue processar um contato muito longo. Tente limpar o histórico da instância.");
        }
        throw new Error(`Erro de Servidor (${res.status}). Verifique os logs do seu Evolution.`);
      }

      if (res.status === 401 || res.status === 403) throw new Error("API Key Inválida ou Sem Permissão.");
      if (res.status === 404) throw new Error("Endpoint não encontrado na URL.");
      
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
      setErrorMsg("Configure a API primeiro.");
      return;
    }
    
    setIsSyncing(true);
    setErrorMsg(null);
    setLeads([]);
    addLog(`>>> HANDSHAKE V2.3.7: ${selectedInstanceName}`);
    
    try {
      const stateData = await performFetch(`${baseUrl}/instance/connectionState/${selectedInstanceName}`);
      const state = stateData.instance?.state || stateData.state;
      addLog(`Status: ${state}`);

      if (state !== 'open' && state !== 'CONNECTED') {
        throw new Error("Node Offline. Reconecte o QR Code.");
      }

      addLog("Efetuando Deep Scan no histórico...");
      const msgData = await performFetch(`${baseUrl}/chat/findMessages/${selectedInstanceName}`, {
        method: 'POST',
        body: JSON.stringify({ where: {}, limit: 50 })
      });
      
      const records = findDataArray(msgData);
      addLog(`${records.length} fluxos detectados.`);

      let leadsMap = new Map<string, KanbanLead>();

      records.forEach((m: any) => {
        const key = m.key || m;
        const jid = key.participantAlt || key.remoteJid;
        
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

      const finalLeads = Array.from(leadsMap.values());
      if (finalLeads.length > 0) {
        setLeads(finalLeads);
      } else {
        setErrorMsg("API Conectada, mas o servidor não retornou mensagens privadas para processar.");
      }

    } catch (e: any) {
      setErrorMsg(e.message);
      addLog(`ERRO: ${e.message}`);
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
    } catch (e) { addLog("Servidor de API Inalcançável."); }
  }, [config.evoKey, getCleanUrl, selectedInstanceName]);

  useEffect(() => { fetchInstances(); }, [fetchInstances]);

  const loadChat = async (lead: KanbanLead) => {
    setSelectedLead(lead);
    setMessages([]);
    const baseUrl = getCleanUrl();
    try {
      addLog(`Lendo chat: ${lead.phone}`);
      const data = await performFetch(`${baseUrl}/chat/findMessages/${selectedInstanceName}`, {
        method: 'POST',
        body: JSON.stringify({ where: { remoteJid: lead.id }, limit: 40 })
      });
      const formatted: ChatMessage[] = findDataArray(data).map((m: any): ChatMessage => {
        let text = m.message?.conversation || m.message?.extendedTextMessage?.text;
        return {
          id: m.key?.id || Math.random().toString(),
          sender: (m.key?.fromMe ? 'agent' : 'user'),
          content: text || "[Mídia]",
          timestamp: new Date((m.messageTimestamp || Date.now() / 1000) * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
      }).reverse();
      setMessages(formatted);
    } catch (e) { addLog("Erro ao baixar histórico."); }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedLead || isSending) return;
    setIsSending(true);
    const text = newMessage;
    setNewMessage('');
    try {
      await performFetch(`${getCleanUrl()}/message/sendText/${selectedInstanceName}`, {
        method: 'POST',
        body: JSON.stringify({ number: selectedLead.id, text, delay: 1000 })
      });
      setMessages(prev => [...prev, { id: Math.random().toString(), sender: 'agent', content: text, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    } catch (e) { alert("Falha ao enviar."); setNewMessage(text); } finally { setIsSending(false); }
  };

  return (
    <Layout activeView={AppView.CHAT_MANAGER} onNavigate={onNavigate} onLogout={onLogout}>
      <div className="h-full flex flex-col gap-4 max-h-[calc(100vh-120px)] overflow-hidden">
        
        {/* Top Control */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#03081a] border border-white/10 p-5 rounded-[2rem] shadow-2xl shrink-0">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-orange-600/20 rounded-2xl flex items-center justify-center text-orange-500 border border-orange-500/20 shadow-lg">
                <Zap size={24} />
             </div>
             <div>
                <h1 className="text-xl font-black text-white italic uppercase tracking-tighter leading-none">Command Center</h1>
                <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-1">Uplink: <span className="text-orange-500">{selectedInstanceName || 'NODE_OFF'}</span></p>
             </div>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
             <select 
               value={selectedInstanceName} 
               onChange={(e) => { setSelectedInstanceName(e.target.value); localStorage.setItem('wayflow_last_instance', e.target.value); }}
               className="bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-[10px] text-white font-black uppercase tracking-[0.2em] outline-none cursor-pointer flex-1 md:min-w-[240px]"
             >
               {availableInstances.length === 0 && <option>Nenhuma Instância Ativa</option>}
               {availableInstances.map(i => <option key={i.id} value={i.instanceName || i.name}>📡 {i.instanceName || i.name}</option>)}
             </select>
             <button onClick={handleSync} disabled={isSyncing} className="px-10 py-3.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 shadow-xl transition-all active:scale-95">
                {isSyncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />} Sincronizar
             </button>
          </div>
        </div>

        {/* Diagnostic Monitor */}
        <div className="bg-black/80 border border-white/10 rounded-[1.5rem] p-5 flex flex-col gap-2 overflow-hidden shrink-0 shadow-inner">
            <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-2">
                <div className="flex items-center gap-3">
                   <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Monitoramento Neural Evolution v2.3.7</span>
                </div>
                <div className="flex gap-2">
                   <button onClick={copyFullLog} className="px-3 py-1.5 bg-white/5 rounded-xl text-[8px] font-black text-orange-500 uppercase border border-white/5 hover:bg-white/10 transition-all"><Clipboard size={10} className="inline mr-1" /> Copiar Trace</button>
                </div>
            </div>
            <div className="max-h-24 overflow-y-auto custom-scrollbar font-mono text-[10px] leading-tight space-y-1">
              {debugLog.length === 0 ? <p className="text-slate-700 italic">Aguardando comando de sincronismo...</p> : debugLog.map((log, i) => <p key={i} className={i === 0 ? 'text-orange-400 font-bold' : 'text-slate-600'}>{log}</p>)}
            </div>
        </div>

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-[1.5rem] flex items-center gap-4 text-red-500 animate-in slide-in-from-top-2 shadow-lg shrink-0">
             <AlertTriangle size={20} className="shrink-0" />
             <div className="flex-1">
               <p className="text-[11px] font-black uppercase tracking-widest leading-none mb-1">Erro de Sincronismo Detectado</p>
               <p className="text-[10px] opacity-80 leading-snug">{errorMsg}</p>
             </div>
             <button onClick={handleSync} className="px-5 py-2.5 bg-orange-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all">Tentar Scan</button>
          </div>
        )}

        <div className="flex-1 flex gap-4 overflow-hidden">
          <div className="w-full md:w-80 flex flex-col gap-3 bg-[#03081a]/50 border border-white/5 rounded-[2.5rem] p-4 overflow-hidden h-full">
            <div className="relative mb-2">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700" size={14} />
               <input type="text" placeholder="FILTRAR..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-11 pr-4 text-[10px] text-white font-black uppercase tracking-widest outline-none focus:border-orange-500 transition-all placeholder:text-slate-800"/>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
              {leads.filter(l => l.name.toLowerCase().includes(searchTerm.toLowerCase())).map(lead => (
                <div key={lead.id} onClick={() => loadChat(lead)} className={`p-4 rounded-3xl border transition-all cursor-pointer flex items-center gap-4 ${selectedLead?.id === lead.id ? 'bg-orange-600/20 border-orange-500/30' : 'bg-white/[0.02] border-white/5 hover:border-white/20'}`}>
                  <img src={lead.avatar} className="w-10 h-10 rounded-xl border border-white/10 shrink-0" alt="" />
                  <div className="flex-1 min-w-0"><h4 className="text-white font-black text-[11px] truncate uppercase italic tracking-tight">{lead.name}</h4><p className="text-[9px] text-slate-600 font-bold">+{lead.phone}</p></div>
                </div>
              ))}
            </div>
          </div>

          {selectedLead ? (
            <div className="flex-1 flex flex-col bg-[#03081a] border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl relative">
              <div className="p-5 border-b border-white/5 flex items-center gap-4 bg-white/[0.02]">
                <img src={selectedLead.avatar} className="w-12 h-12 rounded-2xl border border-white/10" alt="" />
                <div><h3 className="text-sm font-black text-white italic uppercase tracking-tighter leading-none mb-1">{selectedLead.name}</h3><p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">+{selectedLead.phone} • Conexão Estável</p></div>
              </div>
              <div ref={scrollRef} className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-6">
                 {messages.map(msg => (
                   <div key={msg.id} className={`flex ${msg.sender === 'agent' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                      <div className="max-w-[80%]">
                         <div className={`p-4 rounded-[2rem] text-[13px] font-medium leading-relaxed shadow-xl ${msg.sender === 'agent' ? 'bg-orange-600 text-white rounded-tr-none' : 'bg-white/5 text-slate-200 border border-white/10 rounded-tl-none'}`}>{msg.content}</div>
                         <p className={`text-[8px] font-black text-slate-700 uppercase mt-2 px-1 ${msg.sender === 'agent' ? 'text-right' : 'text-left'}`}>{msg.timestamp}</p>
                      </div>
                   </div>
                 ))}
              </div>
              <div className="p-6 border-t border-white/5 bg-white/[0.01]">
                 <div className="flex items-center gap-4">
                    <input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} placeholder="RESPOSTA NEURAL..." className="flex-1 bg-slate-950 border border-white/10 rounded-2xl py-5 px-7 text-sm text-white outline-none focus:border-orange-500 transition-all font-medium shadow-inner"/>
                    <button onClick={sendMessage} disabled={!newMessage.trim() || isSending} className="p-5 bg-orange-600 text-white rounded-2xl shadow-2xl hover:bg-orange-500 transition-all active:scale-95 shadow-orange-600/30">{isSending ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} />}</button>
                 </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-[4rem] opacity-30 text-center p-20 bg-white/[0.01]">
               <Globe size={48} className="text-orange-500 animate-pulse mb-4" />
               <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-4">Aguardando Uplink.</h3>
               <p className="text-[11px] font-bold uppercase tracking-[0.2em] max-w-sm">Nota: Seus logs mostram que o servidor Evolution está com erro de banco de dados (P2000). Se a lista não carregar, tente reiniciar sua instância do Evolution API.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ChatManager;
