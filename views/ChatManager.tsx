
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  MessageSquare, Users, Loader2, RefreshCw, Send, Paperclip, Phone, MoreHorizontal, UserCircle, Search, AlertTriangle, ShieldCheck, Database, Terminal, Zap
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
    console.log(`[WayFlow Engine] ${msg}`);
    setDebugLog(prev => [msg, ...prev].slice(0, 5));
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

  const fetchInstances = useCallback(async () => {
    const baseUrl = getBaseUrl();
    if (!baseUrl || !config.evoKey) return;
    try {
      const response = await fetch(`${baseUrl}/instance/fetchInstances`, {
        headers: { 'apikey': config.evoKey }
      });
      const data = await response.json();
      const raw = Array.isArray(data) ? data : (data.data || data.instances || []);
      const connected = raw.filter((i: any) => {
        const inst = i.instance || i;
        const status = i.connectionStatus || i.status || inst.status || i.state;
        return status === 'open' || status === 'CONNECTED';
      });
      setAvailableInstances(connected);
      if (connected.length > 0 && !selectedInstanceName) {
        setSelectedInstanceName(connected[0].instanceName || connected[0].name);
      }
    } catch (e) { addLog("Erro ao buscar instâncias."); }
  }, [config.evoKey, getBaseUrl, selectedInstanceName]);

  useEffect(() => {
    fetchInstances();
  }, [fetchInstances]);

  // Extrator de Dados Ultra-Resiliente
  const findDataArray = (obj: any): any[] => {
    if (!obj) return [];
    if (Array.isArray(obj)) return obj;
    
    // Caminhos comuns Evolution v2
    const paths = [
      obj.records,
      obj.data,
      obj.chats,
      obj.contacts,
      obj.instance?.chats,
      obj.instance?.contacts,
      obj.data?.records,
      obj.data?.chats
    ];

    for (const path of paths) {
      if (Array.isArray(path)) return path;
    }

    // Busca recursiva profunda em 1 nível
    for (const key in obj) {
      if (Array.isArray(obj[key])) return obj[key];
      if (obj[key] && typeof obj[key] === 'object') {
         for (const subKey in obj[key]) {
            if (Array.isArray(obj[key][subKey])) return obj[key][subKey];
         }
      }
    }
    return [];
  };

  const handleSync = useCallback(async () => {
    const baseUrl = getBaseUrl();
    if (!selectedInstanceName || !baseUrl || !config.evoKey) return;
    
    setIsSyncing(true);
    setErrorMsg(null);
    addLog(`Scanning Node: ${selectedInstanceName}...`);
    
    try {
      // 0. Verificar se a instância ainda está conectada
      const stateResp = await fetch(`${baseUrl}/instance/connectionState/${selectedInstanceName}`, {
        headers: { 'apikey': config.evoKey }
      });
      const stateData = await stateResp.json();
      const isConnected = stateData.instance?.state === 'open' || stateData.state === 'open' || stateData.instance?.connectionStatus === 'CONNECTED';

      if (!isConnected) {
        throw new Error("Instância desconectada. Re-escaneie o QR Code nas Configurações.");
      }

      // 1. Tentar múltiplos endpoints de Chat
      const chatEndpoints = [
        `${baseUrl}/chat/findMany/${selectedInstanceName}`,
        `${baseUrl}/chat/findMany/${selectedInstanceName}?limit=100`
      ];

      let allChats: any[] = [];
      for (const endpoint of chatEndpoints) {
        const res = await fetch(endpoint, { headers: { 'apikey': config.evoKey } });
        const json = await res.json();
        const found = findDataArray(json);
        if (found.length > 0) {
          allChats = found;
          break;
        }
      }

      // 2. Tentar múltiplos endpoints de Contatos
      const contactEndpoints = [
        `${baseUrl}/contact/findMany/${selectedInstanceName}`,
        `${baseUrl}/contact/findMany/${selectedInstanceName}?limit=100`
      ];

      let allContacts: any[] = [];
      for (const endpoint of contactEndpoints) {
        const res = await fetch(endpoint, { headers: { 'apikey': config.evoKey } });
        const json = await res.json();
        const found = findDataArray(json);
        if (found.length > 0) {
          allContacts = found;
          break;
        }
      }

      // 3. FALLBACK: Se tudo falhar, forçar o fetch do celular
      if (allChats.length === 0 && allContacts.length === 0) {
        addLog("Nenhum dado no banco. Solicitando sincronização forçada via WhatsApp Web...");
        await fetch(`${baseUrl}/chat/fetchChats/${selectedInstanceName}`, { headers: { 'apikey': config.evoKey } });
        await fetch(`${baseUrl}/contact/fetchContacts/${selectedInstanceName}`, { headers: { 'apikey': config.evoKey } });
        
        addLog("Aguardando resposta do rádio (6s)...");
        await new Promise(r => setTimeout(r, 6000));
        
        // Re-tentativa final após o fetch
        const finalResp = await fetch(`${baseUrl}/chat/findMany/${selectedInstanceName}`, { headers: { 'apikey': config.evoKey } });
        allChats = findDataArray(await finalResp.json());
      }

      const leadMap = new Map<string, KanbanLead>();

      // Unificar Chats e Contatos
      allChats.forEach((chat: any) => {
        const jid = chat.id || chat.remoteJid || chat.jid || (chat.key && chat.key.remoteJid);
        if (!jid || jid.includes('@g.us')) return;
        leadMap.set(jid, {
          id: jid,
          name: chat.name || chat.pushName || jid.split('@')[0],
          phone: jid.split('@')[0].replace(/\D/g, ""),
          lastMessage: chat.lastMessage?.message?.conversation || chat.lastMessage?.content || "Conversa Ativa",
          value: 0,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(chat.name || 'W')}&background=f59e0b&color=fff`,
          columnId: 'ai_processing',
          status: 'online',
          unreadCount: chat.unreadCount || 0
        });
      });

      allContacts.forEach((contact: any) => {
        const jid = contact.id || contact.jid || contact.remoteJid;
        if (!jid || jid.includes('@g.us') || leadMap.has(jid)) return;
        leadMap.set(jid, {
          id: jid,
          name: contact.name || contact.pushName || jid.split('@')[0],
          phone: jid.split('@')[0].replace(/\D/g, ""),
          lastMessage: "Novo Lead",
          value: 0,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name || 'W')}&background=1e293b&color=fff`,
          columnId: 'new',
          status: 'online'
        });
      });

      const finalLeads = Array.from(leadMap.values());
      setLeads(finalLeads);
      
      if (finalLeads.length === 0) {
        addLog("Status: Conectado, mas banco de dados vazio.");
        setErrorMsg("A instância está 'OPEN', mas não há conversas no banco de dados da API. Como você enviou mensagens recentemente, aguarde 30 segundos para que a API sincronize e tente novamente. Se persistir, reinicie a instância no servidor.");
      } else {
        addLog(`Transmissão OK: ${finalLeads.length} contatos mapeados.`);
        localStorage.setItem('wayflow_leads_cache', JSON.stringify(finalLeads));
      }
    } catch (error: any) { 
      setErrorMsg(`Falha Neural: ${error.message}`);
      addLog(`Erro: ${error.message}`);
    } finally { setIsSyncing(false); }
  }, [selectedInstanceName, config.evoKey, getBaseUrl]);

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
    if (!baseUrl) return;

    try {
      const response = await fetch(`${baseUrl}/chat/findMessages/${selectedInstanceName}`, {
        method: 'POST',
        headers: { 'apikey': config.evoKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ where: { remoteJid: lead.id }, limit: 50 })
      });
      
      const data = await response.json();
      const rawMsgs = findDataArray(data);

      const formatted: ChatMessage[] = rawMsgs.map((m: any): ChatMessage => ({
        id: m.key?.id || Math.random().toString(),
        sender: (m.key?.fromMe ? 'agent' : 'user') as 'agent' | 'user',
        content: m.message?.conversation || m.message?.extendedTextMessage?.text || m.content || "Mídia/Anexo",
        timestamp: new Date((m.messageTimestamp || Date.now() / 1000) * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      })).reverse();
      
      setMessages(formatted);
    } catch (e) { addLog("Erro ao ler histórico."); }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedLead || isSending) return;
    setIsSending(true);
    const text = newMessage;
    setNewMessage('');
    const baseUrl = getBaseUrl();
    try {
      const response = await fetch(`${baseUrl}/message/sendText/${selectedInstanceName}`, {
        method: 'POST',
        headers: { 'apikey': config.evoKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: selectedLead.id, text: text, delay: 1000 })
      });
      if (response.ok) {
        setMessages(prev => [...prev, { 
          id: Math.random().toString(), sender: 'agent', content: text, 
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        }]);
      }
    } catch (e) { 
      alert("Erro no uplink."); 
      setNewMessage(text); 
    } finally { setIsSending(false); }
  };

  const filteredLeads = leads.filter(l => 
    l.name.toLowerCase().includes(searchTerm.toLowerCase()) || l.phone.includes(searchTerm)
  );

  return (
    <Layout activeView={AppView.CHAT_MANAGER} onNavigate={onNavigate} onLogout={onLogout}>
      <div className="h-full flex flex-col gap-4 animate-in fade-in duration-500 max-h-[calc(100vh-120px)] overflow-hidden">
        
        {/* Painel de Comando Refinado */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#03081a] border border-white/10 p-4 rounded-3xl shadow-2xl shrink-0">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-orange-600/20 rounded-2xl flex items-center justify-center text-orange-500 border border-orange-500/20 shadow-lg">
                <Zap size={24} />
             </div>
             <div>
                <h1 className="text-xl font-black text-white italic uppercase tracking-tighter leading-none">Fluxo de Dados.</h1>
                <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-1">
                  Cluster: <span className="text-orange-500">{selectedInstanceName || 'Offline'}</span>
                </p>
             </div>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
             <select 
               value={selectedInstanceName}
               onChange={(e) => setSelectedInstanceName(e.target.value)}
               className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-[10px] text-white font-black uppercase tracking-[0.2em] outline-none cursor-pointer flex-1 md:min-w-[220px] focus:border-orange-500/50 transition-all appearance-none"
             >
               {availableInstances.length === 0 && <option>Nenhuma Instância Detectada</option>}
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
                {isSyncing ? 'Varrendo...' : 'Sincronizar'}
             </button>
          </div>
        </div>

        {/* Terminal de Diagnóstico em Tempo Real */}
        <div className="bg-slate-950 border border-white/5 rounded-2xl p-3 flex flex-col gap-1 overflow-hidden shrink-0">
            <div className="flex items-center gap-2 mb-1">
                <Terminal size={10} className="text-orange-500" />
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Protocolo WayFlow Diagnostic</span>
            </div>
            {debugLog.length === 0 ? (
               <p className="text-[9px] font-mono text-slate-800 italic">Aguardando comando de sincronia...</p>
            ) : debugLog.map((log, i) => (
              <p key={i} className={`text-[9px] font-mono ${i === 0 ? 'text-orange-400' : 'text-slate-600'} truncate`}>
                {i === 0 ? '>> ' : ''}{log}
              </p>
            ))}
        </div>

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/20 p-5 rounded-3xl flex items-center gap-4 text-red-500 animate-in slide-in-from-top-2">
             <AlertTriangle size={24} className="shrink-0" />
             <div className="flex-1">
                <p className="text-[10px] font-black uppercase tracking-widest leading-tight">{errorMsg}</p>
             </div>
             <button onClick={handleSync} className="px-4 py-2 bg-red-500 text-white rounded-xl text-[8px] font-black uppercase tracking-widest">Forçar Re-Uplink</button>
          </div>
        )}

        <div className="flex-1 flex gap-4 overflow-hidden">
          {/* Listagem Neural de Leads */}
          <div className="w-full md:w-80 flex flex-col gap-3 bg-[#03081a]/50 border border-white/5 rounded-[2.5rem] p-4 overflow-hidden h-full shadow-inner">
            <div className="relative mb-2">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
               <input 
                type="text" 
                placeholder="PROCURAR NO BANCO..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-10 pr-4 text-[10px] text-white font-black uppercase tracking-widest focus:outline-none focus:border-orange-500/50 transition-all"
               />
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
              {filteredLeads.length === 0 && !isSyncing && (
                <div className="py-20 text-center opacity-20 flex flex-col items-center border border-dashed border-white/10 rounded-3xl p-6">
                  <Database size={32} className="mb-4 text-slate-500" />
                  <p className="text-[9px] font-black uppercase tracking-widest leading-relaxed">Cluster Vazio.<br/>Verifique se a instância<br/>possui conversas ativas.</p>
                </div>
              )}
              {filteredLeads.map(lead => (
                <div 
                  key={lead.id}
                  onClick={() => loadChat(lead)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer group flex items-center gap-4 ${selectedLead?.id === lead.id ? 'bg-orange-600/20 border-orange-500/30 shadow-[0_10px_30px_rgba(234,88,12,0.1)]' : 'bg-white/[0.02] border-white/5 hover:border-white/20'}`}
                >
                  <img src={lead.avatar} className="w-10 h-10 rounded-xl border border-white/10 shrink-0" alt="" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-black text-[11px] truncate uppercase italic">{lead.name}</h4>
                    <p className="text-[9px] text-slate-600 font-bold">+{lead.phone}</p>
                  </div>
                  {lead.unreadCount > 0 && <div className="w-5 h-5 bg-orange-600 rounded-full flex items-center justify-center text-[8px] font-black text-white">{lead.unreadCount}</div>}
                </div>
              ))}
            </div>
          </div>

          {/* Interface de Diálogo Neural */}
          {selectedLead ? (
            <div className="flex-1 flex flex-col bg-[#03081a] border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl relative z-10">
              <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-4">
                   <div className="relative">
                      <img src={selectedLead.avatar} className="w-12 h-12 rounded-2xl border border-white/10 shadow-lg" alt="" />
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#03081a] shadow-[0_0_8px_#10b981]" />
                   </div>
                   <div>
                      <h3 className="text-sm font-black text-white italic tracking-tighter uppercase leading-none mb-1">{selectedLead.name}</h3>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Node ID: +{selectedLead.phone}</p>
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
                      <p className="text-[10px] font-black uppercase tracking-widest text-center italic">Escaneando Transmissão...</p>
                   </div>
                 ) : messages.map(msg => (
                   <div key={msg.id} className={`flex ${msg.sender === 'agent' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                      <div className="max-w-[80%]">
                         <div className={`p-4 rounded-3xl text-[13px] font-medium leading-relaxed shadow-xl ${msg.sender === 'agent' ? 'bg-orange-600 text-white rounded-tr-none' : 'bg-white/5 text-slate-200 border border-white/10 rounded-tl-none'}`}>
                            {msg.content}
                         </div>
                         <p className={`text-[8px] font-black text-slate-700 uppercase mt-2 px-1 ${msg.sender === 'agent' ? 'text-right' : 'text-left'}`}>{msg.timestamp} • {msg.sender === 'agent' ? 'WAYFLOW AGENT' : 'LEAD DATA'}</p>
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
                      placeholder="INJETAR RESPOSTA..."
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
            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-[4rem] opacity-30 text-center p-20 bg-white/[0.01]">
               <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-8 shadow-inner border border-white/5">
                 <MessageSquare size={48} className="text-orange-500" />
               </div>
               <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-4">Aguardando Conexão.</h3>
               <p className="text-[11px] font-bold uppercase tracking-[0.2em] max-w-sm leading-relaxed">Sincronize o cluster e selecione um canal para iniciar a monitoração neural.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ChatManager;
