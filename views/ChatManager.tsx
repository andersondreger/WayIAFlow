
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  MessageSquare, Users, Loader2, RefreshCw, Send, Paperclip, Phone, MoreHorizontal, UserCircle, Search, AlertTriangle, ShieldCheck, Database, Terminal, Zap, Globe, WifiOff, Scan, Activity, Cpu, Code, Copy, ChevronDown, ChevronUp, Image as ImageIcon, Clipboard
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
    console.log(`[WayFlow Debug] ${msg}`);
    setDebugLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 30));
  };

  const copyFullLog = () => {
    const logText = debugLog.join('\n') + '\n\nRAW_RESPONSE:\n' + JSON.stringify(lastRawResponse, null, 2);
    navigator.clipboard.writeText(logText);
    alert("Log copiado! Cole no chat para análise.");
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
      
      if (!res.ok) {
         throw new Error(data?.message || `Erro HTTP ${res.status}`);
      }
      return data;
    } catch (e: any) {
      addLog(`Falha Fetch: ${e.message}`);
      throw e;
    }
  };

  const findDataArray = (obj: any): any[] => {
    if (!obj) return [];
    if (Array.isArray(obj)) return obj;
    // Padrões de retorno da Evolution API v2
    const paths = [
      obj.records, obj.data, obj.chats, obj.contacts,
      obj.instance?.chats, obj.instance?.contacts,
      obj.messages, obj.data?.records
    ];
    for (const path of paths) {
      if (Array.isArray(path)) return path;
    }
    // Deep search por qualquer array
    for (const key in obj) {
      if (Array.isArray(obj[key])) return obj[key];
    }
    return [];
  };

  const extractCorrectJid = (data: any): string => {
    if (!data) return '';
    const key = data.key || data;
    
    // Se for de grupo, precisamos do participantAlt (conforme seu log)
    if (key.remoteJid?.includes('@g.us')) {
      return key.participantAlt || key.participant || '';
    }

    // Prioridade para Alt JID (evita o @lid)
    return key.remoteJidAlt || key.remoteJid || data.id || data.jid || '';
  };

  const handleSync = useCallback(async () => {
    const baseUrl = getBaseUrl();
    if (!selectedInstanceName || !baseUrl || !config.evoKey) {
      setErrorMsg("Configurações não encontradas.");
      return;
    }
    
    setIsSyncing(true);
    setErrorMsg(null);
    setLeads([]);
    addLog(`>>> INICIANDO ESCANEAMENTO DA INSTÂNCIA: ${selectedInstanceName}`);
    
    try {
      // 1. Estado da Conexão
      addLog("Checando canal Baileys...");
      const stateData = await performFetch(`${baseUrl}/instance/connectionState/${selectedInstanceName}`);
      const state = stateData.instance?.state || stateData.state;
      addLog(`Estado: ${state}`);

      if (state !== 'open' && state !== 'CONNECTED') {
        throw new Error(`A instância '${selectedInstanceName}' está desconectada ou em standby.`);
      }

      // 2. Tentar Sincronização Forçada
      addLog("Solicitando re-sync ao Postgres...");
      await fetch(`${baseUrl}/chat/fetchChats/${selectedInstanceName}`, { method: 'POST', headers: { 'apikey': config.evoKey } }).catch(() => {});
      await new Promise(r => setTimeout(r, 3000));

      let foundLeadsMap = new Map<string, KanbanLead>();

      // 3. Estratégia A: chat/findMany
      addLog("Tentando via 'chat/findMany'...");
      try {
        const chatsData = await performFetch(`${baseUrl}/chat/findMany/${selectedInstanceName}`);
        const chats = findDataArray(chatsData);
        addLog(`'chat/findMany' retornou ${chats.length} registros.`);
        chats.forEach(c => {
          const jid = extractCorrectJid(c);
          if (jid && !jid.includes('@g.us')) {
            const phone = jid.split('@')[0];
            foundLeadsMap.set(jid, {
              id: jid,
              name: c.name || c.pushName || phone,
              phone: phone,
              lastMessage: c.lastMessage || "Conversa Ativa",
              value: 0,
              avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name || phone)}&background=f59e0b&color=fff`,
              columnId: 'ai_processing',
              status: 'online',
              unreadCount: c.unreadCount || 0
            });
          }
        });
      } catch (e) { addLog("Erro em findMany, pulando..."); }

      // 4. Estratégia B (Emergency): chat/findMessages
      // Essencial se o findMany retornar vazio por erro de split da API
      if (foundLeadsMap.size === 0) {
        addLog("MODO EMERGÊNCIA: Escaneando logs de mensagens recentes...");
        const msgData = await performFetch(`${baseUrl}/chat/findMessages/${selectedInstanceName}`, {
          method: 'POST',
          body: JSON.stringify({ where: {}, limit: 150 })
        });
        const msgs = findDataArray(msgData);
        addLog(`Encontradas ${msgs.length} mensagens no log de eventos.`);

        msgs.forEach((m: any) => {
          const jid = extractCorrectJid(m);
          // Ignora mensagens enviadas por mim e grupos
          if (jid && !jid.includes('@g.us') && !m.key?.fromMe) {
            const phone = jid.split('@')[0];
            if (!foundLeadsMap.has(jid)) {
              foundLeadsMap.set(jid, {
                id: jid,
                name: m.pushName || phone,
                phone: phone,
                lastMessage: m.message?.conversation || "[Mensagem de Mídia]",
                value: 0,
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(m.pushName || phone)}&background=f59e0b&color=fff`,
                columnId: 'ai_processing',
                status: 'online',
                unreadCount: 0
              });
            }
          }
        });
      }

      const finalLeads = Array.from(foundLeadsMap.values());

      if (finalLeads.length > 0) {
        addLog(`SUCESSO: ${finalLeads.length} leads recuperados.`);
        setLeads(finalLeads);
        localStorage.setItem('wayflow_leads_cache', JSON.stringify(finalLeads));
      } else {
        addLog("FALHA CRÍTICA: Nenhum lead individual encontrado nas 3 camadas de busca.");
        setErrorMsg("A API respondeu, mas não retornou conversas individuais. Verifique os logs no console abaixo para detalhes.");
      }

    } catch (e: any) {
      addLog(`ERRO NO PROCESSO: ${e.message}`);
      setErrorMsg(e.message);
    } finally {
      setIsSyncing(false);
    }
  }, [selectedInstanceName, config.evoKey, getBaseUrl]);

  const fetchInstances = useCallback(async () => {
    const baseUrl = getBaseUrl();
    if (!baseUrl || !config.evoKey) return;
    try {
      const response = await fetch(`${baseUrl}/instance/fetchInstances`, {
        headers: { 'apikey': config.evoKey }
      });
      const data = await response.json();
      const raw = findDataArray(data);
      const connected = raw.filter((i: any) => {
        const status = i.connectionStatus || i.status || i.instance?.status || i.state;
        return status === 'open' || status === 'CONNECTED';
      });
      setAvailableInstances(connected);
      if (connected.length > 0 && !selectedInstanceName) {
        setSelectedInstanceName(connected[0].instanceName || connected[0].name);
      }
    } catch (e) {
      addLog("Node Evolution inalcançável.");
    }
  }, [config.evoKey, getBaseUrl, selectedInstanceName]);

  useEffect(() => {
    fetchInstances();
  }, [fetchInstances]);

  useEffect(() => {
    if (selectedInstanceName) {
      handleSync();
      localStorage.setItem('wayflow_last_instance', selectedInstanceName);
    }
  }, [selectedInstanceName, handleSync]);

  const loadChat = async (lead: KanbanLead) => {
    setSelectedLead(lead);
    setMessages([]);
    const baseUrl = getBaseUrl();
    try {
      addLog(`Lendo mensagens de: ${lead.id}`);
      const data = await performFetch(`${baseUrl}/chat/findMessages/${selectedInstanceName}`, {
        method: 'POST',
        body: JSON.stringify({ where: { remoteJid: lead.id }, limit: 50 })
      });
      const rawMsgs = findDataArray(data);
      const formatted: ChatMessage[] = rawMsgs.map((m: any): ChatMessage => {
        let content = m.message?.conversation || m.message?.extendedTextMessage?.text;
        if (!content && m.message?.imageMessage) content = "[📷 Imagem]";
        if (!content && m.message?.audioMessage) content = "[🎤 Áudio]";
        if (!content) content = "Interação Registrada";

        return {
          id: m.key?.id || Math.random().toString(),
          sender: (m.key?.fromMe ? 'agent' : 'user') as 'agent' | 'user',
          content: content,
          timestamp: new Date((m.messageTimestamp || Date.now() / 1000) * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
      }).reverse();
      setMessages(formatted);
    } catch (e: any) {
      addLog(`Falha ao carregar histórico.`);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedLead || isSending) return;
    setIsSending(true);
    const text = newMessage;
    setNewMessage('');
    const baseUrl = getBaseUrl();
    try {
      await performFetch(`${baseUrl}/message/sendText/${selectedInstanceName}`, {
        method: 'POST',
        body: JSON.stringify({ number: selectedLead.id, text: text, delay: 1200 })
      });
      setMessages(prev => [...prev, { 
        id: Math.random().toString(), sender: 'agent', content: text, 
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      }]);
    } catch (e: any) {
      alert("Erro ao disparar mensagem.");
      setNewMessage(text);
    } finally {
      setIsSending(false);
    }
  };

  const filteredLeads = leads.filter(l => 
    l.name.toLowerCase().includes(searchTerm.toLowerCase()) || l.phone.includes(searchTerm)
  );

  return (
    <Layout activeView={AppView.CHAT_MANAGER} onNavigate={onNavigate} onLogout={onLogout}>
      <div className="h-full flex flex-col gap-4 animate-in fade-in duration-500 max-h-[calc(100vh-120px)] overflow-hidden">
        
        {/* Painel Superior */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#03081a] border border-white/10 p-5 rounded-3xl shadow-2xl shrink-0">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-orange-600/20 rounded-2xl flex items-center justify-center text-orange-500 border border-orange-500/20 shadow-lg">
                <Zap size={24} />
             </div>
             <div>
                <h1 className="text-xl font-black text-white italic uppercase tracking-tighter leading-none">Central Neural</h1>
                <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-1">
                  Instância: <span className="text-orange-500">{selectedInstanceName || 'OFFLINE'}</span>
                </p>
             </div>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
             <select 
               value={selectedInstanceName}
               onChange={(e) => setSelectedInstanceName(e.target.value)}
               className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-[10px] text-white font-black uppercase tracking-[0.2em] outline-none cursor-pointer flex-1 md:min-w-[220px] focus:border-orange-500 transition-all appearance-none"
             >
               {availableInstances.length === 0 && <option>Nenhum Node Ativo</option>}
               {availableInstances.map(inst => (
                 <option key={inst.id} value={inst.instanceName || inst.name}>📡 {inst.instanceName || inst.name}</option>
               ))}
             </select>

             <button 
              onClick={handleSync} 
              disabled={isSyncing || !selectedInstanceName} 
              className="px-8 py-3 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 transition-all shadow-xl shadow-orange-600/20 active:scale-95"
             >
                {isSyncing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} 
                {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
             </button>
          </div>
        </div>

        {/* CONSOLE DE DEPURAÇÃO (AQUI QUE VOCÊ VÊ O LOG) */}
        <div className="bg-black/95 border border-white/10 rounded-2xl p-5 flex flex-col gap-1 overflow-hidden shrink-0 shadow-inner">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                   <Terminal size={14} className="text-orange-500" />
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Diagnóstico de Uplink (v2.3.7)</span>
                </div>
                <div className="flex items-center gap-3">
                   <button 
                    onClick={copyFullLog}
                    className="flex items-center gap-2 text-[9px] font-black text-orange-500 uppercase tracking-widest bg-orange-500/10 px-3 py-1.5 rounded-lg border border-orange-500/20 hover:bg-orange-500/20 transition-all"
                   >
                     <Clipboard size={12} /> Copiar Trace Completo
                   </button>
                   {lastRawResponse && (
                     <button 
                      onClick={() => setShowRawError(!showRawError)}
                      className="flex items-center gap-2 text-[9px] font-black text-red-500 uppercase tracking-widest bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20 hover:bg-red-500/20 transition-all"
                     >
                       <Code size={12} /> {showRawError ? 'Fechar JSON' : 'Ver Última Resposta'}
                     </button>
                   )}
                </div>
            </div>
            
            {showRawError && lastRawResponse && (
              <div className="mb-4 p-4 bg-red-950/20 border border-red-500/20 rounded-xl overflow-hidden animate-in slide-in-from-top-2">
                <pre className="text-[10px] font-mono text-red-200/60 overflow-x-auto max-h-40 custom-scrollbar">
                  {JSON.stringify(lastRawResponse, null, 2)}
                </pre>
              </div>
            )}

            <div className="max-h-32 overflow-y-auto custom-scrollbar font-mono text-[11px] leading-relaxed">
              {debugLog.length === 0 ? (
                 <p className="text-slate-700 italic">Aguardando gatilho de sincronização para iniciar log...</p>
              ) : debugLog.map((log, i) => (
                <p key={i} className={`${i === 0 ? 'text-orange-400 font-bold' : 'text-slate-500'}`}>
                  {i === 0 ? '>> ' : ''}{log}
                </p>
              ))}
            </div>
        </div>

        {errorMsg && (
          <div className="bg-orange-500/10 border border-orange-500/20 p-5 rounded-3xl flex items-center gap-5 text-orange-500 animate-in slide-in-from-top-2 shadow-lg">
             <AlertTriangle size={28} className="shrink-0" />
             <div className="flex-1">
                <p className="text-[11px] font-black uppercase tracking-widest leading-tight mb-1">Diagnóstico Necessário</p>
                <p className="text-[10px] opacity-80 font-medium leading-snug">{errorMsg}</p>
             </div>
             <button onClick={handleSync} className="px-5 py-2.5 bg-orange-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl shadow-orange-500/20 active:scale-95 transition-all">Forçar Scan Neural</button>
          </div>
        )}

        <div className="flex-1 flex gap-4 overflow-hidden">
          {/* Sidebar */}
          <div className="w-full md:w-80 flex flex-col gap-3 bg-[#03081a]/50 border border-white/5 rounded-[2.5rem] p-4 overflow-hidden h-full shadow-inner">
            <div className="relative mb-2">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
               <input 
                type="text" 
                placeholder="PROCURAR NO BANCO..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-11 pr-4 text-[10px] text-white font-black uppercase tracking-widest focus:outline-none focus:border-orange-500 transition-all"
               />
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
              {filteredLeads.length === 0 && !isSyncing && (
                <div className="py-20 text-center opacity-20 flex flex-col items-center border border-dashed border-white/10 rounded-[2.5rem] p-8">
                  <Database size={40} className="mb-4 text-slate-500" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] leading-relaxed">Cluster Vazio.</p>
                </div>
              )}
              {filteredLeads.map(lead => (
                <div 
                  key={lead.id}
                  onClick={() => loadChat(lead)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer group flex items-center gap-4 ${selectedLead?.id === lead.id ? 'bg-orange-600/20 border-orange-500/30 shadow-lg shadow-orange-500/5' : 'bg-white/[0.02] border-white/5 hover:border-white/20'}`}
                >
                  <img src={lead.avatar} className="w-10 h-10 rounded-xl border border-white/10 shrink-0" alt="" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-black text-[11px] truncate uppercase italic tracking-tight">{lead.name}</h4>
                    <p className="text-[9px] text-slate-600 font-bold">+{lead.phone}</p>
                  </div>
                  {lead.unreadCount > 0 && <div className="w-5 h-5 bg-orange-600 rounded-full flex items-center justify-center text-[8px] font-black text-white">{lead.unreadCount}</div>}
                </div>
              ))}
            </div>
          </div>

          {/* Área de Chat */}
          {selectedLead ? (
            <div className="flex-1 flex flex-col bg-[#03081a] border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl relative z-10">
              <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02] backdrop-blur-md">
                <div className="flex items-center gap-4">
                   <img src={selectedLead.avatar} className="w-12 h-12 rounded-2xl border border-white/10" alt="" />
                   <div>
                      <h3 className="text-sm font-black text-white italic uppercase tracking-tighter leading-none mb-1">{selectedLead.name}</h3>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Canal: {selectedLead.id}</p>
                   </div>
                </div>
                <div className="flex gap-3">
                   <button className="p-3 bg-white/5 rounded-xl text-slate-500 hover:text-white transition-all"><Phone size={18} /></button>
                   <button className="p-3 bg-white/5 rounded-xl text-slate-500 hover:text-white transition-all"><MoreHorizontal size={18} /></button>
                </div>
              </div>

              <div ref={scrollRef} className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-6">
                 {messages.length === 0 ? (
                   <div className="h-full flex flex-col items-center justify-center opacity-10">
                      <Activity size={40} className="animate-pulse mb-4" />
                      <p className="text-[11px] font-black uppercase tracking-[0.3em] text-center italic">Escaneando Pacotes...</p>
                   </div>
                 ) : messages.map(msg => (
                   <div key={msg.id} className={`flex ${msg.sender === 'agent' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                      <div className="max-w-[80%]">
                         <div className={`p-4 rounded-3xl text-[13px] font-medium leading-relaxed shadow-xl ${msg.sender === 'agent' ? 'bg-orange-600 text-white rounded-tr-none' : 'bg-white/5 text-slate-200 border border-white/10 rounded-tl-none'}`}>
                            {msg.content}
                         </div>
                         <p className={`text-[8px] font-black text-slate-700 uppercase mt-2 px-1 ${msg.sender === 'agent' ? 'text-right' : 'text-left'}`}>{msg.timestamp} • {msg.sender === 'agent' ? 'SISTEMA' : 'CLIENTE'}</p>
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
                      placeholder="INJETAR TEXTO NO CANAL..."
                      className="flex-1 bg-slate-950 border border-white/10 rounded-2xl py-5 px-7 text-sm text-white outline-none focus:border-orange-500 transition-all placeholder:text-slate-800 font-medium shadow-inner"
                    />
                    <button 
                      onClick={sendMessage} 
                      disabled={!newMessage.trim() || isSending} 
                      className="p-5 bg-orange-600 text-white rounded-2xl shadow-2xl hover:bg-orange-500 disabled:opacity-50 transition-all active:scale-95 shadow-orange-600/30"
                    >
                       {isSending ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} />}
                    </button>
                 </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-[4rem] opacity-30 text-center p-20 bg-white/[0.01]">
               <Globe size={48} className="text-orange-500 animate-pulse mb-4" />
               <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-4">Uplink Offline.</h3>
               <p className="text-[11px] font-bold uppercase tracking-[0.2em] max-w-sm">Selecione um contato. Se a lista estiver vazia, verifique o console de diagnóstico acima.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ChatManager;
