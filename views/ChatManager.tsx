
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  MessageSquare, Users, Loader2, RefreshCw, Send, Paperclip, Phone, MoreHorizontal, UserCircle, Search, AlertTriangle, ShieldCheck, Database, Terminal, Zap, Globe, WifiOff, Scan, Activity, Cpu, Code, Copy, ChevronDown, ChevronUp, Image as ImageIcon, Clipboard, CheckCircle2, Video, Microscope
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
    const logText = debugLog.join('\n') + '\n\nRAW_DATA:\n' + JSON.stringify(lastRawResponse, null, 2);
    navigator.clipboard.writeText(logText);
    alert("Log completo copiado para o clipboard!");
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
      if (!res.ok) throw new Error(data?.message || `Erro HTTP ${res.status}`);
      return data;
    } catch (e: any) {
      addLog(`Falha Crítica: ${e.message}`);
      throw e;
    }
  };

  // MOTOR DE DESCOBERTA DE DADOS (Resolve o problema de "não aparecer")
  const findDataArray = (obj: any): any[] => {
    if (!obj) return [];
    if (Array.isArray(obj)) return obj;
    
    // Procura por chaves comuns da Evolution API v2
    if (obj.records && Array.isArray(obj.records)) return obj.records;
    if (obj.messages && Array.isArray(obj.messages)) return obj.messages;
    if (obj.messages?.records && Array.isArray(obj.messages.records)) return obj.messages.records;
    if (obj.data && Array.isArray(obj.data)) return obj.data;
    if (obj.chats && Array.isArray(obj.chats)) return obj.chats;
    
    // Busca recursiva profunda em primeiro nível
    for (const key in obj) {
      if (Array.isArray(obj[key])) return obj[key];
      if (obj[key] && typeof obj[key] === 'object') {
        if (obj[key].records && Array.isArray(obj[key].records)) return obj[key].records;
      }
    }
    return [];
  };

  const extractCorrectJid = (m: any): string | null => {
    if (!m) return null;
    const key = m.key || m;
    const remote = key.remoteJid || "";
    
    // Se for grupo, extrai o número real do remetente (participantAlt) dos seus logs
    if (remote.includes('@g.us')) {
      return key.participantAlt || key.participant || null;
    }

    // Se for privado, limpa identidades LID/LID-ALT
    const jid = key.remoteJidAlt || remote;
    if (!jid) return null;
    return jid.includes('@lid') ? (key.remoteJidAlt || jid) : jid;
  };

  const handleSync = useCallback(async () => {
    const baseUrl = getBaseUrl();
    if (!selectedInstanceName || !baseUrl || !config.evoKey) {
      setErrorMsg("Configure os dados da API em 'Integrações'.");
      return;
    }
    
    setIsSyncing(true);
    setErrorMsg(null);
    setLeads([]);
    addLog(`>>> ESCANEAMENTO DE RECUPERAÇÃO INICIADO: ${selectedInstanceName}`);
    
    try {
      // 1. Verifica conexão
      const stateData = await performFetch(`${baseUrl}/instance/connectionState/${selectedInstanceName}`);
      const state = stateData.instance?.state || stateData.state;
      addLog(`Status da Instância: ${state}`);

      if (state !== 'open' && state !== 'CONNECTED') throw new Error("A instância do WhatsApp está desconectada.");

      let leadsMap = new Map<string, KanbanLead>();

      // 2. Busca mensagens recentes (Deep Scan)
      addLog("Lendo banco de dados de mensagens recentes...");
      const msgData = await performFetch(`${baseUrl}/chat/findMessages/${selectedInstanceName}`, {
        method: 'POST',
        body: JSON.stringify({ where: {}, limit: 100 })
      });
      
      const rawMsgs = findDataArray(msgData);
      addLog(`Sistema encontrou ${rawMsgs.length} registros brutos.`);

      rawMsgs.forEach((m: any) => {
        const jid = extractCorrectJid(m);
        // Filtramos para ignorar mensagens enviadas por nós (fromMe) e grupos diretos
        if (jid && !jid.includes('@g.us') && !m.key?.fromMe) {
          if (!leadsMap.has(jid)) {
            const phone = jid.split('@')[0];
            let lastText = "Atividade Recente";
            if (m.message?.conversation) lastText = m.message.conversation;
            else if (m.message?.videoMessage) lastText = "[🎥 Vídeo]";
            else if (m.message?.imageMessage) lastText = "[📷 Imagem]";
            else if (m.message?.audioMessage) lastText = "[🎤 Áudio]";

            leadsMap.set(jid, {
              id: jid,
              name: m.pushName || `Lead ${phone}`,
              phone: phone,
              lastMessage: lastText,
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
        addLog(`SUCESSO: ${finalLeads.length} leads de recuperação detectados.`);
        setLeads(finalLeads);
        localStorage.setItem('wayflow_leads_cache', JSON.stringify(finalLeads));
      } else {
        addLog("NADA ENCONTRADO: O log da API retornou registros, mas nenhum JID de cliente individual foi extraído.");
        setErrorMsg("API Conectada, mas não encontramos conversas privadas recentes. Certifique-se de que há mensagens de clientes (não grupos) no seu WhatsApp.");
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
      if (connected.length > 0 && !selectedInstanceName) {
        const first = connected[0].instanceName || connected[0].name;
        setSelectedInstanceName(first);
        localStorage.setItem('wayflow_last_instance', first);
      }
    } catch (e) { addLog("Falha ao comunicar com o cluster Evolution."); }
  }, [config.evoKey, getBaseUrl, selectedInstanceName]);

  useEffect(() => { fetchInstances(); }, [fetchInstances]);
  useEffect(() => { if (selectedInstanceName) handleSync(); }, [selectedInstanceName, handleSync]);

  const loadChat = async (lead: KanbanLead) => {
    setSelectedLead(lead);
    setMessages([]);
    const baseUrl = getBaseUrl();
    try {
      addLog(`Sincronizando Chat: ${lead.name}`);
      const data = await performFetch(`${baseUrl}/chat/findMessages/${selectedInstanceName}`, {
        method: 'POST',
        body: JSON.stringify({ where: { remoteJid: lead.id }, limit: 40 })
      });
      const raw = findDataArray(data);
      const formatted: ChatMessage[] = raw.map((m: any): ChatMessage => {
        let text = m.message?.conversation || m.message?.extendedTextMessage?.text;
        if (!text && m.message?.imageMessage) text = "[📷 Imagem]";
        if (!text && m.message?.videoMessage) text = "[🎥 Vídeo]";
        return {
          id: m.key?.id || Math.random().toString(),
          sender: (m.key?.fromMe ? 'agent' : 'user'),
          content: text || "Mensagem de Mídia",
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
    } catch (e) { 
      alert("Falha no envio."); 
      setNewMessage(text); 
    } finally { 
      setIsSending(false); 
    }
  };

  return (
    <Layout activeView={AppView.CHAT_MANAGER} onNavigate={onNavigate} onLogout={onLogout}>
      <div className="h-full flex flex-col gap-4 max-h-[calc(100vh-120px)] overflow-hidden">
        
        {/* Controle Superior */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#03081a] border border-white/10 p-5 rounded-[2rem] shadow-2xl shrink-0">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-orange-600/20 rounded-2xl flex items-center justify-center text-orange-500 border border-orange-500/20 shadow-lg animate-pulse">
                <Zap size={24} />
             </div>
             <div>
                <h1 className="text-xl font-black text-white italic uppercase tracking-tighter leading-none">Command Center</h1>
                <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-1">Uplink: <span className="text-orange-500">{selectedInstanceName || 'AGUARDANDO NODE'}</span></p>
             </div>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
             <select 
               value={selectedInstanceName} 
               onChange={(e) => { setSelectedInstanceName(e.target.value); localStorage.setItem('wayflow_last_instance', e.target.value); }}
               className="bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-[10px] text-white font-black uppercase tracking-[0.2em] outline-none cursor-pointer flex-1 md:min-w-[240px]"
             >
               {availableInstances.length === 0 && <option>Nenhum Node Online</option>}
               {availableInstances.map(i => <option key={i.id} value={i.instanceName || i.name}>📡 {i.instanceName || i.name}</option>)}
             </select>
             <button onClick={handleSync} disabled={isSyncing} className="px-10 py-3.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3 shadow-xl shadow-orange-600/20 transition-all active:scale-95">
                {isSyncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />} Sincronizar
             </button>
          </div>
        </div>

        {/* Diagnóstico em Tempo Real */}
        <div className="bg-black/90 border border-white/10 rounded-[1.5rem] p-5 flex flex-col gap-2 overflow-hidden shrink-0 shadow-inner">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-3">
                   <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Neural Engine v2.3.7 Log Feed</span>
                </div>
                <div className="flex gap-2">
                   <button onClick={copyFullLog} className="px-3 py-1.5 bg-white/5 rounded-xl text-[8px] font-black text-orange-500 uppercase border border-white/5 hover:bg-white/10 transition-all"><Clipboard size={10} className="inline mr-1" /> Copiar Tudo</button>
                   {lastRawResponse && <button onClick={() => setShowRawError(!showRawError)} className="px-3 py-1.5 bg-red-500/10 rounded-xl text-[8px] font-black text-red-500 uppercase border border-red-500/10 hover:bg-red-500/20 transition-all"><Microscope size={10} className="inline mr-1" /> Diagnosticar</button>}
                </div>
            </div>
            {showRawError && <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-xl text-[9px] font-mono text-red-400 overflow-auto max-h-40 mb-2 custom-scrollbar"><pre>{JSON.stringify(lastRawResponse, null, 2)}</pre></div>}
            <div className="max-h-24 overflow-y-auto custom-scrollbar font-mono text-[10px] leading-tight space-y-1">
              {debugLog.length === 0 ? <p className="text-slate-700 italic">Aguardando gatilho de sincronização...</p> : debugLog.map((log, i) => <p key={i} className={i === 0 ? 'text-orange-400 font-bold' : 'text-slate-600'}>{log}</p>)}
            </div>
        </div>

        {errorMsg && (
          <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-[1.5rem] flex items-center gap-4 text-orange-500 animate-in slide-in-from-top-2 shadow-lg shrink-0">
             <AlertTriangle size={20} className="shrink-0" />
             <div className="flex-1">
               <p className="text-[11px] font-black uppercase tracking-widest leading-none mb-1">Inconsistência de Dados</p>
               <p className="text-[10px] opacity-80">{errorMsg}</p>
             </div>
             <button onClick={handleSync} className="px-6 py-2.5 bg-orange-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all">Retry Link</button>
          </div>
        )}

        <div className="flex-1 flex gap-4 overflow-hidden">
          {/* Sidebar de Leads */}
          <div className="w-full md:w-80 flex flex-col gap-3 bg-[#03081a]/50 border border-white/5 rounded-[2.5rem] p-4 overflow-hidden h-full shadow-inner">
            <div className="relative mb-2">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700" size={14} />
               <input 
                 type="text" placeholder="FILTRAR LEAD..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} 
                 className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-11 pr-4 text-[10px] text-white font-black uppercase tracking-widest outline-none focus:border-orange-500 transition-all placeholder:text-slate-800"
               />
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
              {leads.filter(l => l.name.toLowerCase().includes(searchTerm.toLowerCase()) || l.phone.includes(searchTerm)).map(lead => (
                <div 
                  key={lead.id} onClick={() => loadChat(lead)} 
                  className={`p-4 rounded-3xl border transition-all cursor-pointer flex items-center gap-4 ${selectedLead?.id === lead.id ? 'bg-orange-600/20 border-orange-500/30 shadow-lg shadow-orange-500/5' : 'bg-white/[0.02] border-white/5 hover:border-white/20'}`}
                >
                  <div className="relative">
                    <img src={lead.avatar} className="w-10 h-10 rounded-xl border border-white/10 shrink-0" alt="" />
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-[#03081a] rounded-full" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-black text-[11px] truncate uppercase italic tracking-tight leading-none mb-1">{lead.name}</h4>
                    <p className="text-[9px] text-slate-600 font-bold">+{lead.phone}</p>
                  </div>
                </div>
              ))}
              {leads.length === 0 && !isSyncing && (
                <div className="py-10 text-center opacity-20 flex flex-col items-center">
                   <WifiOff size={32} className="mb-2" />
                   <p className="text-[9px] font-black uppercase tracking-widest">Lista Vazia</p>
                </div>
              )}
            </div>
          </div>

          {/* Área de Mensagens */}
          {selectedLead ? (
            <div className="flex-1 flex flex-col bg-[#03081a] border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl relative">
              <div className="p-5 border-b border-white/5 flex items-center gap-4 bg-white/[0.02] backdrop-blur-md">
                <img src={selectedLead.avatar} className="w-12 h-12 rounded-2xl border border-white/10" alt="" />
                <div>
                   <h3 className="text-sm font-black text-white italic uppercase tracking-tighter leading-none mb-1">{selectedLead.name}</h3>
                   <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">Status: Canal Ativo • +{selectedLead.phone}</p>
                </div>
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
                 {messages.length === 0 && (
                   <div className="h-full flex flex-col items-center justify-center opacity-20">
                      <MessageSquare size={48} className="mb-4" />
                      <p className="text-xs font-black uppercase tracking-widest">Sem Histórico Visual</p>
                   </div>
                 )}
              </div>
              <div className="p-6 border-t border-white/5 bg-white/[0.01]">
                 <div className="flex items-center gap-4">
                    <input 
                      value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} 
                      placeholder="DISPARAR RESPOSTA..." 
                      className="flex-1 bg-slate-950 border border-white/10 rounded-2xl py-5 px-7 text-sm text-white outline-none focus:border-orange-500 transition-all font-medium shadow-inner"
                    />
                    <button 
                      onClick={sendMessage} disabled={!newMessage.trim() || isSending} 
                      className="p-5 bg-orange-600 text-white rounded-2xl shadow-2xl hover:bg-orange-500 transition-all active:scale-95 shadow-orange-600/30"
                    >
                      {isSending ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} />}
                    </button>
                 </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-[4rem] opacity-30 text-center p-20 bg-white/[0.01]">
               <Globe size={48} className="text-orange-500 animate-pulse mb-4" />
               <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-4">Command Link Offline.</h3>
               <p className="text-[11px] font-bold uppercase tracking-[0.2em] max-w-sm">Use o botão Sincronizar. O motor agora busca por JIDs em todas as camadas de records para garantir a exibição.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ChatManager;
