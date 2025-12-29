
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  MessageSquare, Users, Loader2, RefreshCw, Send, Paperclip, Phone, MoreHorizontal, UserCircle, Search, AlertTriangle, ShieldCheck, Database, Terminal, Zap, Globe, WifiOff, Scan, Activity, Cpu, Code, Copy, ChevronDown, ChevronUp
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
  const [lastRawError, setLastRawError] = useState<any>(null);
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
    setDebugLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 15));
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
      if (!res.ok) {
         setLastRawError(data || { error: `Status ${res.status}` });
         throw new Error(data?.message || `Erro do Servidor (${res.status})`);
      }
      return data;
    } catch (e: any) {
      addLog(`Falha: ${e.message}`);
      throw e;
    }
  };

  const findDataArray = (obj: any): any[] => {
    if (!obj) return [];
    if (Array.isArray(obj)) return obj;
    // Padrões comuns da Evolution v2
    const paths = [
      obj.records, obj.data, obj.chats, obj.contacts,
      obj.instance?.chats, obj.instance?.contacts,
      obj.data?.records, obj.data?.chats,
      obj.messages // Adicionado para findMessages
    ];
    for (const path of paths) {
      if (Array.isArray(path)) return path;
    }
    // Se não achou em nenhum caminho conhecido, mas o objeto tem chaves, tenta retornar o valor da primeira chave que for array
    for (const key in obj) {
      if (Array.isArray(obj[key])) return obj[key];
    }
    return [];
  };

  // Função ultra-refinada para extrair o JID real (contornando o LID)
  const extractCorrectJid = (data: any): string => {
    if (!data) return '';
    
    // 1. Tenta buscar no objeto raiz
    let jid = data.remoteJidAlt || data.remoteJid || data.id || data.jid;
    
    // 2. Tenta buscar dentro do objeto 'key' (comum em mensagens)
    if (!jid && data.key) {
      jid = data.key.remoteJidAlt || data.key.remoteJid;
    }

    // 3. Tenta buscar dentro do objeto 'instance' (comum em instâncias)
    if (!jid && data.instance) {
      jid = data.instance.ownerJid;
    }

    // Se o JID for @lid, mas houver uma versão alt, priorizamos a alt
    if (jid?.includes('@lid') && (data.remoteJidAlt || data.key?.remoteJidAlt)) {
      jid = data.remoteJidAlt || data.key.remoteJidAlt;
    }

    return jid || '';
  };

  const handleSync = useCallback(async () => {
    const baseUrl = getBaseUrl();
    if (!selectedInstanceName || !baseUrl || !config.evoKey) {
      setErrorMsg("Configurações incompletas.");
      return;
    }
    
    setIsSyncing(true);
    setErrorMsg(null);
    setLastRawError(null);
    setLeads([]);
    addLog(`Iniciando Escaneamento em: ${selectedInstanceName}`);
    
    try {
      // 1. Verificação de Saúde
      const stateData = await performFetch(`${baseUrl}/instance/connectionState/${selectedInstanceName}`);
      const state = stateData.instance?.state || stateData.state;
      addLog(`Status: ${state}`);

      if (state !== 'open' && state !== 'CONNECTED') {
        throw new Error(`Instância ${selectedInstanceName} desconectada.`);
      }

      // 2. Forçar Gatilhos de Sync
      addLog("Solicitando cache ao WhatsApp...");
      await fetch(`${baseUrl}/chat/fetchChats/${selectedInstanceName}`, { method: 'POST', headers: { 'apikey': config.evoKey } }).catch(() => {});
      await fetch(`${baseUrl}/contact/fetchContacts/${selectedInstanceName}`, { method: 'POST', headers: { 'apikey': config.evoKey } }).catch(() => {});

      addLog("Aguardando processamento (5s)...");
      await new Promise(r => setTimeout(r, 5000));

      // 3. Estratégia de Busca em 3 Camadas
      let allFoundChats: any[] = [];

      // Camada A: Chats Salvos
      addLog("Buscando via 'chat/findMany'...");
      const chatsData = await performFetch(`${baseUrl}/chat/findMany/${selectedInstanceName}`);
      allFoundChats = [...findDataArray(chatsData)];
      addLog(`Encontrados ${allFoundChats.length} chats.`);

      // Camada B: Contatos (Se chats estiver vazio)
      if (allFoundChats.length === 0) {
        addLog("Buscando via 'contact/findAll'...");
        const contactsData = await performFetch(`${baseUrl}/contact/findAll/${selectedInstanceName}`);
        allFoundChats = [...findDataArray(contactsData)];
        addLog(`Encontrados ${allFoundChats.length} contatos.`);
      }

      // Camada C: Histórico de Mensagens (Onde o LID costuma aparecer nos logs)
      if (allFoundChats.length === 0) {
        addLog("Buscando via Histórico de Mensagens...");
        const msgData = await performFetch(`${baseUrl}/chat/findMessages/${selectedInstanceName}`, {
          method: 'POST',
          body: JSON.stringify({ where: {}, limit: 100 })
        });
        const msgs = findDataArray(msgData);
        addLog(`Analisando ${msgs.length} mensagens do log...`);
        
        msgs.forEach((m: any) => {
          const jid = extractCorrectJid(m);
          if (jid && !jid.includes('@g.us')) {
            if (!allFoundChats.some(c => extractCorrectJid(c) === jid)) {
              allFoundChats.push({ 
                id: jid, 
                name: m.pushName || jid.split('@')[0], 
                lastMessage: m.message?.conversation || "Mensagem Detectada" 
              });
            }
          }
        });
      }

      // 4. Mapeamento Final
      const mappedLeads: KanbanLead[] = allFoundChats.map((chat: any) => {
        const jid = extractCorrectJid(chat);
        const cleanPhone = jid.split('@')[0];
        
        return {
          id: jid,
          name: chat.name || chat.pushName || cleanPhone,
          phone: cleanPhone,
          lastMessage: chat.lastMessage || (chat.message?.conversation) || "Conversa Ativa",
          value: 0,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(chat.name || cleanPhone)}&background=f59e0b&color=fff`,
          columnId: 'ai_processing',
          status: 'online',
          unreadCount: chat.unreadCount || 0
        };
      });

      if (mappedLeads.length > 0) {
        addLog(`Sucesso: ${mappedLeads.length} leads mapeados.`);
        setLeads(mappedLeads);
        localStorage.setItem('wayflow_leads_cache', JSON.stringify(mappedLeads));
      } else {
        addLog("ERRO: Nenhuma das 3 camadas retornou dados.");
        setErrorMsg("A API respondeu OK, mas o seu banco de dados (Postgres) parece estar vazio. Tente mandar um 'OI' de um celular para esse número agora e clique em Sincronizar em 10 segundos.");
      }

    } catch (e: any) {
      addLog(`ERRO CRÍTICO: ${e.message}`);
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
      addLog("Node fora de linha.");
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
      addLog(`Lendo: ${lead.id}`);
      const data = await performFetch(`${baseUrl}/chat/findMessages/${selectedInstanceName}`, {
        method: 'POST',
        body: JSON.stringify({ where: { remoteJid: lead.id }, limit: 50 })
      });
      const rawMsgs = findDataArray(data);
      const formatted: ChatMessage[] = rawMsgs.map((m: any): ChatMessage => ({
        id: m.key?.id || Math.random().toString(),
        sender: (m.key?.fromMe ? 'agent' : 'user') as 'agent' | 'user',
        content: m.message?.conversation || m.message?.extendedTextMessage?.text || "Mídia ou Documento",
        timestamp: new Date((m.messageTimestamp || Date.now() / 1000) * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      })).reverse();
      setMessages(formatted);
    } catch (e: any) {
      addLog(`Erro ao carregar histórico.`);
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
      alert("Erro ao disparar.");
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
        
        {/* Top Control Panel */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#03081a] border border-white/10 p-5 rounded-3xl shadow-2xl shrink-0">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-orange-600/20 rounded-2xl flex items-center justify-center text-orange-500 border border-orange-500/20 shadow-lg">
                <Zap size={24} />
             </div>
             <div>
                <h1 className="text-xl font-black text-white italic uppercase tracking-tighter leading-none">Central Atendimento.</h1>
                <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-1">
                  Node: <span className="text-orange-500">{selectedInstanceName || 'NÃO CONFIGURADO'}</span>
                </p>
             </div>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
             <select 
               value={selectedInstanceName}
               onChange={(e) => setSelectedInstanceName(e.target.value)}
               className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-[10px] text-white font-black uppercase tracking-[0.2em] outline-none cursor-pointer flex-1 md:min-w-[220px] focus:border-orange-500 transition-all appearance-none"
             >
               {availableInstances.length === 0 && <option>Sem Nodes Online</option>}
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

        {/* Terminal de Trace Refinado */}
        <div className="bg-black/95 border border-white/10 rounded-2xl p-4 flex flex-col gap-1 overflow-hidden shrink-0 shadow-inner">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                   <Terminal size={12} className="text-orange-500" />
                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Protocolo de Diagnóstico WayFlow (v2.3.7)</span>
                </div>
                <div className="flex items-center gap-3">
                   {lastRawError && (
                     <button 
                      onClick={() => setShowRawError(!showRawError)}
                      className="flex items-center gap-2 text-[8px] font-black text-red-500 uppercase tracking-widest bg-red-500/10 px-2 py-1 rounded border border-red-500/20 hover:bg-red-500/20 transition-all"
                     >
                       <Code size={10} /> {showRawError ? 'Esconder JSON' : 'Ver Erro Bruto'}
                     </button>
                   )}
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                   <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Postgres Uplink</span>
                </div>
            </div>
            
            {showRawError && lastRawError && (
              <div className="mb-4 p-4 bg-red-950/30 border border-red-500/20 rounded-xl overflow-hidden animate-in slide-in-from-top-2">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[9px] font-black text-red-400 uppercase tracking-widest">Raw Response Payload</span>
                  <button onClick={() => { navigator.clipboard.writeText(JSON.stringify(lastRawError, null, 2)); alert("JSON Copiado!"); }} className="p-1.5 bg-white/5 rounded text-slate-400 hover:text-white transition-all"><Copy size={10} /></button>
                </div>
                <pre className="text-[10px] font-mono text-red-200/60 overflow-x-auto max-h-32 custom-scrollbar">
                  {JSON.stringify(lastRawError, null, 2)}
                </pre>
              </div>
            )}

            <div className="max-h-24 overflow-y-auto custom-scrollbar">
              {debugLog.length === 0 ? (
                 <p className="text-[10px] font-mono text-slate-700 italic">Aguardando início do escaneamento...</p>
              ) : debugLog.map((log, i) => (
                <p key={i} className={`text-[10px] font-mono ${i === 0 ? 'text-orange-400' : 'text-slate-600'} truncate`}>
                  {i === 0 ? '>> ' : ''}{log}
                </p>
              ))}
            </div>
        </div>

        {errorMsg && (
          <div className="bg-orange-500/10 border border-orange-500/20 p-5 rounded-3xl flex items-center gap-5 text-orange-500 animate-in slide-in-from-top-2 shadow-lg">
             <AlertTriangle size={28} className="shrink-0" />
             <div className="flex-1">
                <p className="text-[11px] font-black uppercase tracking-widest leading-tight mb-1">Atenção Necessária</p>
                <p className="text-[10px] opacity-80 font-medium leading-snug">{errorMsg}</p>
             </div>
             <div className="flex flex-col gap-2">
                <button onClick={handleSync} className="px-5 py-2.5 bg-orange-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl shadow-orange-500/20 active:scale-95 transition-all">Forçar Sincronia</button>
             </div>
          </div>
        )}

        <div className="flex-1 flex gap-4 overflow-hidden">
          {/* Sidebar Leads */}
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
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] leading-relaxed">Banco Sem Dados.<br/>Force o Sync ou mande um Oi no celular.</p>
                </div>
              )}
              {filteredLeads.map(lead => (
                <div 
                  key={lead.id}
                  onClick={() => loadChat(lead)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer group flex items-center gap-4 ${selectedLead?.id === lead.id ? 'bg-orange-600/20 border-orange-500/30 shadow-[0_10px_30px_rgba(234,88,12,0.1)]' : 'bg-white/[0.02] border-white/5 hover:border-white/20'}`}
                >
                  <img src={lead.avatar} className="w-10 h-10 rounded-xl border border-white/10 shrink-0 shadow-lg" alt="" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-black text-[11px] truncate uppercase italic tracking-tight">{lead.name}</h4>
                    <p className="text-[9px] text-slate-600 font-bold">+{lead.phone}</p>
                  </div>
                  {lead.unreadCount > 0 && <div className="w-5 h-5 bg-orange-600 rounded-full flex items-center justify-center text-[8px] font-black text-white shadow-lg shadow-orange-600/30">{lead.unreadCount}</div>}
                </div>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          {selectedLead ? (
            <div className="flex-1 flex flex-col bg-[#03081a] border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl relative z-10">
              <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02] backdrop-blur-md">
                <div className="flex items-center gap-4">
                   <div className="relative">
                      <img src={selectedLead.avatar} className="w-12 h-12 rounded-2xl border border-white/10 shadow-xl" alt="" />
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#03081a] shadow-[0_0_10px_#10b981]" />
                   </div>
                   <div>
                      <h3 className="text-sm font-black text-white italic tracking-tighter uppercase leading-none mb-1">{selectedLead.name}</h3>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Canal: {selectedLead.id}</p>
                   </div>
                </div>
                <div className="flex gap-3">
                   <button className="p-3 bg-white/5 rounded-xl text-slate-500 hover:text-white transition-all"><Phone size={18} /></button>
                   <button className="p-3 bg-white/5 rounded-xl text-slate-500 hover:text-white transition-all"><MoreHorizontal size={18} /></button>
                </div>
              </div>

              <div ref={scrollRef} className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-6 bg-[radial-gradient(circle_at_bottom_left,_rgba(245,158,11,0.03),_transparent)]">
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

              <div className="p-6 bg-white/[0.01] border-t border-white/5 backdrop-blur-md">
                 <div className="flex items-center gap-4">
                    <button className="p-4 bg-white/5 rounded-2xl text-slate-500 hover:text-white transition-all"><Paperclip size={20} /></button>
                    <input 
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="ESCREVER MENSAGEM..."
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
               <div className="w-24 h-24 bg-white/5 rounded-[2rem] flex items-center justify-center mb-8 shadow-inner border border-white/5">
                 <Globe size={48} className="text-orange-500 animate-pulse" />
               </div>
               <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-4">Uplink Offline.</h3>
               <p className="text-[11px] font-bold uppercase tracking-[0.2em] max-w-sm leading-relaxed">Selecione um contato ou force a sincronização para carregar dados do Postgres.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ChatManager;
