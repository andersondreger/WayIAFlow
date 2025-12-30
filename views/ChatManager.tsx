
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  MessageSquare, Users, Loader2, RefreshCw, Send, Paperclip, Phone, MoreHorizontal, UserCircle, Search, AlertTriangle, ShieldCheck, Database, Terminal, Zap, Globe, WifiOff, Scan, Activity, Cpu, Code, Copy, ChevronDown, ChevronUp, Image as ImageIcon, Clipboard, CheckCircle2
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
    setDebugLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 40));
  };

  const copyFullLog = () => {
    const logText = debugLog.join('\n') + '\n\nRAW_DATA:\n' + JSON.stringify(lastRawResponse, null, 2);
    navigator.clipboard.writeText(logText);
    alert("Log copiado! Cole para análise.");
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const getBaseUrl = useCallback(() => {
    if (!config.evoUrl) return '';
    let url = config.evoUrl.trim();
    if (!url.startsWith('http')) url = 'https://' + url;
    return url.replace(/\/$/, "");
  }, [config.evoUrl]);

  const performFetch = async (endpoint: string, options: RequestInit = {}) => {
    try {
      const res = await fetch(endpoint, {
        ...options,
        headers: { 
          'apikey': config.evoKey, 
          'Content-Type': 'application/json',
          ...(options.headers || {})
        },
        mode: 'cors'
      });
      const data = await res.json().catch(() => null);
      setLastRawResponse(data);
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
    const paths = [obj.records, obj.data, obj.chats, obj.contacts, obj.messages, obj.instance?.chats];
    for (const path of paths) if (Array.isArray(path)) return path;
    for (const key in obj) if (Array.isArray(obj[key])) return obj[key];
    return [];
  };

  // LÓGICA MESTRE DE EXTRAÇÃO DE JID (Resolve o erro do log do usuário)
  const extractRealJid = (m: any): string | null => {
    if (!m) return null;
    const key = m.key || m;
    const remote = key.remoteJid || "";
    
    // 1. Se for um grupo, precisamos "pescar" quem enviou a mensagem lá dentro
    if (remote.includes('@g.us')) {
      // Prioriza participantAlt que apareceu no seu log
      return key.participantAlt || key.participant || null;
    }

    // 2. Se for privado, limpa identidades LID
    const jid = key.remoteJidAlt || remote;
    return (jid && !jid.includes('@lid')) ? jid : (key.remoteJidAlt || null);
  };

  const handleSync = useCallback(async () => {
    const baseUrl = getBaseUrl();
    if (!selectedInstanceName || !baseUrl || !config.evoKey) {
      setErrorMsg("Configure a API primeiro.");
      return;
    }
    
    setIsSyncing(true);
    setErrorMsg(null);
    setLeads([]);
    addLog(`>>> INICIANDO DEEP SCAN: ${selectedInstanceName}`);
    
    try {
      const stateData = await performFetch(`${baseUrl}/instance/connectionState/${selectedInstanceName}`);
      const state = stateData.instance?.state || stateData.state;
      addLog(`Status da Instância: ${state}`);

      if (state !== 'open' && state !== 'CONNECTED') throw new Error("Instância desconectada.");

      let leadsMap = new Map<string, KanbanLead>();

      // TENTATIVA 1: CHATS FORMAIS
      addLog("Lendo banco de dados de chats...");
      try {
        const chatsData = await performFetch(`${baseUrl}/chat/findMany/${selectedInstanceName}`);
        const chats = findDataArray(chatsData);
        addLog(`Banco retornou ${chats.length} chats.`);
        chats.forEach(c => {
          const jid = extractRealJid(c);
          if (jid && !jid.includes('@g.us')) {
            const phone = jid.split('@')[0];
            leadsMap.set(jid, {
              id: jid, name: c.name || c.pushName || phone, phone,
              lastMessage: c.lastMessage || "Conversa Ativa",
              value: 0, avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name || phone)}&background=f59e0b&color=fff`,
              columnId: 'ai_processing', status: 'online', unreadCount: c.unreadCount || 0
            });
          }
        });
      } catch (e) { addLog("Aviso: Falha ao ler chats formais."); }

      // TENTATIVA 2: SCANNER NEURAL (Lê mensagens para achar contatos que a API 'esqueceu')
      addLog("Iniciando Scanner de Emergência em mensagens recentes...");
      const msgData = await performFetch(`${baseUrl}/chat/findMessages/${selectedInstanceName}`, {
        method: 'POST',
        body: JSON.stringify({ where: {}, limit: 150 })
      });
      const msgs = findDataArray(msgData);
      addLog(`Scanner encontrou ${msgs.length} eventos no log.`);

      msgs.forEach((m: any) => {
        const jid = extractRealJid(m);
        if (jid && !jid.includes('@g.us') && !m.key?.fromMe) {
          if (!leadsMap.has(jid)) {
            const phone = jid.split('@')[0];
            const content = m.message?.conversation || (m.message?.imageMessage ? "[📷 Imagem]" : "Mensagem Recebida");
            leadsMap.set(jid, {
              id: jid, name: m.pushName || phone, phone,
              lastMessage: content, value: 0,
              avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(m.pushName || phone)}&background=f59e0b&color=fff`,
              columnId: 'ai_processing', status: 'online', unreadCount: 0
            });
          }
        }
      });

      const finalLeads = Array.from(leadsMap.values());
      if (finalLeads.length > 0) {
        addLog(`SUCESSO: ${finalLeads.length} leads recuperados via Deep Scan.`);
        setLeads(finalLeads);
        localStorage.setItem('wayflow_leads_cache', JSON.stringify(finalLeads));
      } else {
        addLog("CRÍTICO: Nada encontrado em chats ou mensagens.");
        setErrorMsg("API Conectada, mas seu WhatsApp não possui mensagens individuais recentes (apenas grupos). Mande um 'OI' de outro celular para este número agora.");
      }

    } catch (e: any) {
      addLog(`ERRO: ${e.message}`);
      setErrorMsg(e.message);
    } finally {
      setIsSyncing(false);
    }
  }, [selectedInstanceName, config.evoKey, getBaseUrl]);

  const fetchInstances = useCallback(async () => {
    const baseUrl = getBaseUrl();
    if (!baseUrl || !config.evoKey) return;
    try {
      const response = await fetch(`${baseUrl}/instance/fetchInstances`, { headers: { 'apikey': config.evoKey } });
      const data = await response.json();
      const connected = findDataArray(data).filter((i: any) => {
        const s = i.connectionStatus || i.status || i.instance?.status || i.state;
        return s === 'open' || s === 'CONNECTED';
      });
      setAvailableInstances(connected);
      if (connected.length > 0 && !selectedInstanceName) setSelectedInstanceName(connected[0].instanceName || connected[0].name);
    } catch (e) { addLog("Erro ao buscar nodes."); }
  }, [config.evoKey, getBaseUrl, selectedInstanceName]);

  useEffect(() => { fetchInstances(); }, [fetchInstances]);
  useEffect(() => { if (selectedInstanceName) handleSync(); }, [selectedInstanceName, handleSync]);

  const loadChat = async (lead: KanbanLead) => {
    setSelectedLead(lead);
    setMessages([]);
    const baseUrl = getBaseUrl();
    try {
      addLog(`Carregando: ${lead.phone}`);
      const data = await performFetch(`${baseUrl}/chat/findMessages/${selectedInstanceName}`, {
        method: 'POST',
        body: JSON.stringify({ where: { remoteJid: lead.id }, limit: 50 })
      });
      const formatted: ChatMessage[] = findDataArray(data).map((m: any): ChatMessage => {
        let text = m.message?.conversation || m.message?.extendedTextMessage?.text;
        if (!text && m.message?.imageMessage) text = "[📷 Imagem]";
        if (!text && m.message?.audioMessage) text = "[🎤 Áudio]";
        return {
          id: m.key?.id || Math.random().toString(),
          sender: (m.key?.fromMe ? 'agent' : 'user'),
          content: text || "Interação Registrada",
          timestamp: new Date((m.messageTimestamp || Date.now() / 1000) * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
      }).reverse();
      setMessages(formatted);
    } catch (e) { addLog("Erro ao carregar histórico."); }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedLead || isSending) return;
    setIsSending(true);
    const text = newMessage;
    setNewMessage('');
    try {
      await performFetch(`${getBaseUrl()}/message/sendText/${selectedInstanceName}`, {
        method: 'POST',
        body: JSON.stringify({ number: selectedLead.id, text, delay: 1000 })
      });
      setMessages(prev => [...prev, { id: Math.random().toString(), sender: 'agent', content: text, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    } catch (e) { alert("Erro ao enviar."); setNewMessage(text); } finally { setIsSending(false); }
  };

  return (
    <Layout activeView={AppView.CHAT_MANAGER} onNavigate={onNavigate} onLogout={onLogout}>
      <div className="h-full flex flex-col gap-4 max-h-[calc(100vh-120px)] overflow-hidden">
        
        {/* Header Superior */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#03081a] border border-white/10 p-5 rounded-3xl shadow-2xl shrink-0">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-orange-600/20 rounded-2xl flex items-center justify-center text-orange-500 border border-orange-500/20">
                <Zap size={24} />
             </div>
             <div>
                <h1 className="text-xl font-black text-white italic uppercase tracking-tighter leading-none">Painel Atendimento</h1>
                <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-1">Node: <span className="text-orange-500">{selectedInstanceName || 'OFFLINE'}</span></p>
             </div>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
             <select 
               value={selectedInstanceName}
               onChange={(e) => setSelectedInstanceName(e.target.value)}
               className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-[10px] text-white font-black uppercase tracking-[0.2em] outline-none cursor-pointer flex-1 md:min-w-[220px]"
             >
               {availableInstances.length === 0 && <option>Nenhum Node Online</option>}
               {availableInstances.map(i => <option key={i.id} value={i.instanceName || i.name}>📡 {i.instanceName || i.name}</option>)}
             </select>
             <button onClick={handleSync} disabled={isSyncing} className="px-8 py-3 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 shadow-xl shadow-orange-600/20">
                {isSyncing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} Sincronizar
             </button>
          </div>
        </div>

        {/* TERMINAL DE DIAGNÓSTICO (Obrigatório olhar aqui se der erro) */}
        <div className="bg-black border border-white/10 rounded-2xl p-4 flex flex-col gap-1 overflow-hidden shrink-0 shadow-inner">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                   <Terminal size={14} className="text-orange-500" />
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">WayFlow Debug Console (v2.3.7)</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={copyFullLog} className="px-2 py-1 bg-white/5 rounded text-[8px] font-black text-orange-500 uppercase border border-white/5 hover:bg-white/10"><Clipboard size={10} className="inline mr-1"/> Copiar Log</button>
                  {lastRawResponse && <button onClick={() => setShowRawError(!showRawError)} className="px-2 py-1 bg-red-500/10 rounded text-[8px] font-black text-red-500 uppercase border border-red-500/10 hover:bg-red-500/20"><Code size={10} className="inline mr-1"/> Ver JSON</button>}
                </div>
            </div>
            {showRawError && <div className="mb-2 p-2 bg-red-950/20 border border-red-500/20 rounded text-[9px] font-mono text-red-400 overflow-auto max-h-32"><pre>{JSON.stringify(lastRawResponse, null, 2)}</pre></div>}
            <div className="max-h-24 overflow-y-auto custom-scrollbar font-mono text-[10px] leading-tight">
              {debugLog.length === 0 ? <p className="text-slate-700 italic">Aguardando início do scan...</p> : debugLog.map((log, i) => <p key={i} className={i === 0 ? 'text-orange-400 font-bold' : 'text-slate-600'}>{log}</p>)}
            </div>
        </div>

        {errorMsg && (
          <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-3xl flex items-center gap-4 text-orange-500 animate-in slide-in-from-top-2 shadow-lg shrink-0">
             <AlertTriangle size={20} className="shrink-0" />
             <div className="flex-1"><p className="text-[11px] font-black uppercase tracking-widest leading-none mb-1">Aviso</p><p className="text-[10px] opacity-80">{errorMsg}</p></div>
             <button onClick={handleSync} className="px-4 py-2 bg-orange-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest">Tentar de Novo</button>
          </div>
        )}

        <div className="flex-1 flex gap-4 overflow-hidden">
          {/* Sidebar */}
          <div className="w-full md:w-80 flex flex-col gap-3 bg-[#03081a]/50 border border-white/5 rounded-[2.5rem] p-4 overflow-hidden h-full">
            <div className="relative mb-2">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
               <input type="text" placeholder="PROCURAR..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-11 pr-4 text-[10px] text-white font-black uppercase tracking-widest outline-none focus:border-orange-500 transition-all"/>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
              {leads.filter(l => l.name.toLowerCase().includes(searchTerm.toLowerCase())).map(lead => (
                <div key={lead.id} onClick={() => loadChat(lead)} className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-4 ${selectedLead?.id === lead.id ? 'bg-orange-600/20 border-orange-500/30' : 'bg-white/[0.02] border-white/5 hover:border-white/20'}`}>
                  <img src={lead.avatar} className="w-10 h-10 rounded-xl border border-white/10 shrink-0" alt="" />
                  <div className="flex-1 min-w-0"><h4 className="text-white font-black text-[11px] truncate uppercase italic">{lead.name}</h4><p className="text-[9px] text-slate-600 font-bold">+{lead.phone}</p></div>
                  {lead.unreadCount > 0 && <div className="w-5 h-5 bg-orange-600 rounded-full flex items-center justify-center text-[8px] font-black text-white">{lead.unreadCount}</div>}
                </div>
              ))}
            </div>
          </div>

          {/* Chat */}
          {selectedLead ? (
            <div className="flex-1 flex flex-col bg-[#03081a] border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl">
              <div className="p-5 border-b border-white/5 flex items-center gap-4 bg-white/[0.02]">
                <img src={selectedLead.avatar} className="w-12 h-12 rounded-2xl border border-white/10" alt="" />
                <div><h3 className="text-sm font-black text-white italic uppercase tracking-tighter leading-none mb-1">{selectedLead.name}</h3><p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">+{selectedLead.phone}</p></div>
              </div>
              <div ref={scrollRef} className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-6">
                 {messages.map(msg => (
                   <div key={msg.id} className={`flex ${msg.sender === 'agent' ? 'justify-end' : 'justify-start'}`}>
                      <div className="max-w-[80%]">
                         <div className={`p-4 rounded-3xl text-[13px] font-medium leading-relaxed shadow-xl ${msg.sender === 'agent' ? 'bg-orange-600 text-white rounded-tr-none' : 'bg-white/5 text-slate-200 border border-white/10 rounded-tl-none'}`}>{msg.content}</div>
                         <p className={`text-[8px] font-black text-slate-700 uppercase mt-2 px-1 ${msg.sender === 'agent' ? 'text-right' : 'text-left'}`}>{msg.timestamp}</p>
                      </div>
                   </div>
                 ))}
              </div>
              <div className="p-6 border-t border-white/5 bg-white/[0.01]">
                 <div className="flex items-center gap-4">
                    <input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} placeholder="ESCREVER MENSAGEM..." className="flex-1 bg-slate-950 border border-white/10 rounded-2xl py-5 px-7 text-sm text-white outline-none focus:border-orange-500 transition-all font-medium"/>
                    <button onClick={sendMessage} disabled={!newMessage.trim() || isSending} className="p-5 bg-orange-600 text-white rounded-2xl shadow-2xl hover:bg-orange-500 transition-all active:scale-95 shadow-orange-600/30">{isSending ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} />}</button>
                 </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-[4rem] opacity-30 text-center p-20">
               <Globe size={48} className="text-orange-500 animate-pulse mb-4" />
               <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-4">Uplink Offline.</h3>
               <p className="text-[11px] font-bold uppercase tracking-[0.2em] max-w-sm">Use o botão Sincronizar. O Deep Scan extrairá contatos diretamente das mensagens recentes.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ChatManager;
