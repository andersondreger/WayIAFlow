
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  MessageSquare, Users, Loader2, RefreshCw, Send, Search, AlertTriangle, Zap, Globe, 
  ShieldCheck, LayoutGrid, List, X, Clock, DollarSign, CheckCircle, ArrowRight, Sparkles, CreditCard, Ban
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import Layout from '../components/Layout.tsx';
import { AppView, KanbanLead, ChatMessage, KanbanColumnId } from '../types.ts';
import { GoogleGenAI } from "@google/genai";

const COLUMNS: { id: KanbanColumnId; label: string; color: string, icon: any }[] = [
  { id: 'awaiting', label: 'Incidentes Críticos', color: 'border-red-500/30 bg-red-500/5', icon: Ban },
  { id: 'processing', label: 'Recuperação Ativa', color: 'border-orange-500/30 bg-orange-500/5', icon: Zap },
  { id: 'pending_payment', label: 'Fechamento Pendente', color: 'border-purple-500/30 bg-purple-500/5', icon: DollarSign },
  { id: 'completed', label: 'Venda Recuperada', color: 'border-emerald-500/30 bg-emerald-500/5', icon: CheckCircle },
];

const INCIDENT_LABELS = {
  cartao_negado: { label: 'Cartão Negado', color: 'text-red-500 bg-red-500/10' },
  pix_expirado: { label: 'Pix Expirado', color: 'text-orange-500 bg-orange-500/10' },
  boleto_vencido: { label: 'Boleto Vencido', color: 'text-yellow-500 bg-yellow-500/10' },
  abandono: { label: 'Carrinho Abandonado', color: 'text-slate-500 bg-slate-500/10' }
};

const ChatManager: React.FC<{ onLogout: () => void, onNavigate: (v: AppView) => void }> = ({ onLogout, onNavigate }) => {
  const [selectedLead, setSelectedLead] = useState<KanbanLead | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [leads, setLeads] = useState<KanbanLead[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [config] = useState(() => {
    const saved = localStorage.getItem('wayflow_evo_config');
    return saved ? JSON.parse(saved) : { evoUrl: '', evoKey: '' };
  });

  const [selectedInstanceName] = useState(() => localStorage.getItem('wayflow_last_instance') || '');

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isChatOpen]);

  const getCleanUrl = useCallback(() => {
    if (!config.evoUrl) return '';
    let url = config.evoUrl.trim();
    if (!url.startsWith('http')) url = 'https://' + url;
    return url.replace(/\/+$/, "");
  }, [config.evoUrl]);

  const performFetch = async (endpoint: string, options: RequestInit = {}) => {
    try {
      const res = await fetch(endpoint, {
        ...options,
        headers: { 'apikey': config.evoKey.trim(), 'Content-Type': 'application/json', ...(options.headers || {}) },
        mode: 'cors'
      });
      const data = await res.json().catch(() => null);
      if (!res.ok && res.status !== 500) throw new Error(data?.message || `Erro ${res.status}`);
      return data;
    } catch (e: any) {
      console.error(e);
      return null;
    }
  };

  const handleSync = useCallback(async () => {
    const baseUrl = getCleanUrl();
    if (!selectedInstanceName || !baseUrl || !config.evoKey) return;
    setIsSyncing(true);
    try {
      const msgData = await performFetch(`${baseUrl}/chat/findMessages/${selectedInstanceName}`, {
        method: 'POST',
        body: JSON.stringify({ where: {}, limit: 100 })
      });
      const records = Array.isArray(msgData) ? msgData : (msgData?.records || msgData?.data || []);
      let leadsMap = new Map<string, KanbanLead>();

      // Simulando tipos de incidentes para visualização profissional
      const incidentTypes: any[] = ['cartao_negado', 'pix_expirado', 'boleto_vencido', 'abandono'];

      records.forEach((m: any, index: number) => {
        const jid = m.key?.remoteJid || "";
        if (jid && !jid.includes('@g.us') && jid !== 'status@broadcast') {
          const cleanJid = jid.split(':')[0].split('@')[0] + '@s.whatsapp.net';
          if (!leadsMap.has(cleanJid)) {
            leadsMap.set(cleanJid, {
              id: cleanJid,
              name: m.pushName || `Lead ${cleanJid.split('@')[0]}`,
              phone: cleanJid.split('@')[0],
              lastMessage: m.message?.conversation || m.message?.extendedTextMessage?.text || "Mídia do Checkout",
              lastMessageTimestamp: m.messageTimestamp || Date.now() / 1000,
              value: Math.floor(Math.random() * (1200 - 150) + 150),
              avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(m.pushName || "C")}&background=f59e0b&color=fff`,
              columnId: index % 4 === 0 ? 'awaiting' : (index % 4 === 1 ? 'processing' : 'pending_payment'),
              status: 'online',
              incidentType: incidentTypes[index % 4]
            });
          }
        }
      });
      setLeads(Array.from(leadsMap.values()));
    } catch (e) { console.error(e); } finally { setIsSyncing(false); }
  }, [selectedInstanceName, config.evoKey, getCleanUrl]);

  useEffect(() => { handleSync(); }, [handleSync]);

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination || destination.droppableId === source.droppableId) return;

    const newLeads = [...leads];
    const leadIndex = newLeads.findIndex(l => l.id === draggableId);
    if (leadIndex === -1) return;

    const updatedLead = { ...newLeads[leadIndex], columnId: destination.droppableId as KanbanColumnId };
    newLeads[leadIndex] = updatedLead;
    setLeads(newLeads);

    // Sincronização com Evolution API via Labels
    const baseUrl = getCleanUrl();
    await performFetch(`${baseUrl}/chat/setLabels/${selectedInstanceName}`, {
      method: 'POST',
      body: JSON.stringify({ 
        number: updatedLead.id, 
        labels: [destination.droppableId] 
      })
    });
  };

  const generateNeuralScript = async () => {
    if (!selectedLead || isAiGenerating) return;
    setIsAiGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Gere um script curto e altamente persuasivo de recuperação de vendas no WhatsApp para o cliente ${selectedLead.name}. Motivo da falha: ${selectedLead.incidentType}. Valor do produto: R$ ${selectedLead.value}. O tom deve ser prestativo, sem parecer um robô, oferecendo ajuda imediata. Use emojis de forma moderada.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { temperature: 0.9 }
      });
      
      setNewMessage(response.text || "");
    } catch (e) {
      console.error(e);
      alert("Erro ao acessar núcleo Gemini.");
    } finally {
      setIsAiGenerating(false);
    }
  };

  const openChat = async (lead: KanbanLead) => {
    setSelectedLead(lead);
    setIsChatOpen(true);
    setMessages([]);
    const data = await performFetch(`${getCleanUrl()}/chat/findMessages/${selectedInstanceName}`, {
      method: 'POST',
      body: JSON.stringify({ where: { remoteJid: lead.id }, limit: 20 })
    });
    if (!data) return;
    const records = Array.isArray(data) ? data : (data.records || data.data || []);
    setMessages(records.map((m: any) => ({
      id: m.key?.id || Math.random().toString(),
      sender: m.key?.fromMe ? 'agent' : 'user',
      content: m.message?.conversation || m.message?.extendedTextMessage?.text || "[Arquivo de Mídia]",
      timestamp: new Date((m.messageTimestamp || Date.now() / 1000) * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    })).reverse());
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedLead || isSending) return;
    setIsSending(true);
    const text = newMessage;
    setNewMessage('');
    const res = await performFetch(`${getCleanUrl()}/message/sendText/${selectedInstanceName}`, {
      method: 'POST',
      body: JSON.stringify({ number: selectedLead.id, text, delay: 1000 })
    });
    if (res) {
      setMessages(prev => [...prev, { id: Math.random().toString(), sender: 'agent', content: text, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    }
    setIsSending(false);
  };

  const getWaitTime = (timestamp: number) => {
    const diff = Math.floor(Date.now() / 1000 - timestamp);
    if (diff < 60) return "Agora";
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    return `${Math.floor(diff / 3600)}h`;
  };

  return (
    <Layout activeView={AppView.CHAT_MANAGER} onNavigate={onNavigate} onLogout={onLogout}>
      <div className="h-full flex flex-col gap-6 overflow-hidden">
        
        {/* Commander Header */}
        <div className="bg-[#03081a] border border-white/10 p-6 rounded-[2.5rem] flex items-center justify-between shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none"><Sparkles size={120} className="text-orange-500" /></div>
          <div className="flex items-center gap-5 relative z-10">
             <div className="w-14 h-14 bg-orange-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-600/20">
                <LayoutGrid size={28} />
             </div>
             <div>
                <h1 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none">Recuperação Neural</h1>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1.5 flex items-center gap-2">
                   <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> Monitor de Vendas em Tempo Real
                </p>
             </div>
          </div>
          
          <div className="flex items-center gap-4 relative z-10">
             <div className="bg-white/5 px-6 py-3 rounded-2xl border border-white/10">
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Taxa de Resgate</p>
                <p className="text-sm font-black text-emerald-500 italic tracking-tighter uppercase">32.4% Conversão</p>
             </div>
             <button onClick={handleSync} disabled={isSyncing} className="px-8 py-4 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 shadow-xl transition-all">
                {isSyncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />} Sincronizar Rede
             </button>
          </div>
        </div>

        {/* Kanban Board Neural */}
        <div className="flex-1 overflow-x-auto custom-scrollbar pb-6 px-1">
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="flex gap-6 h-full min-w-[1400px]">
              {COLUMNS.map(col => (
                <Droppable droppableId={col.id} key={col.id}>
                  {(provided, snapshot) => (
                    <div 
                      {...provided.droppableProps} 
                      ref={provided.innerRef}
                      className={`flex-1 flex flex-col rounded-[3.5rem] border transition-all duration-500 ${col.color} ${snapshot.isDraggingOver ? 'ring-2 ring-orange-500/30 scale-[1.01]' : ''}`}
                    >
                      <div className="p-8 border-b border-white/5 flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <col.icon size={16} className="text-white/40" />
                            <h3 className="text-[11px] font-black text-white uppercase tracking-[0.25em] italic">{col.label}</h3>
                         </div>
                         <span className="bg-white/5 px-4 py-1 rounded-full text-[10px] font-black text-slate-500 border border-white/5">{leads.filter(l => l.columnId === col.id).length}</span>
                      </div>
                      
                      <div className="flex-1 p-5 overflow-y-auto custom-scrollbar space-y-5">
                        {leads.filter(l => l.columnId === col.id).map((lead, index) => (
                          <Draggable key={lead.id} draggableId={lead.id} index={index}>
                            {(provided, snapshot) => {
                              // Alerta de SLA: Se na coluna de Aguardando há mais de 5 min (300s)
                              const isAwaiting = col.id === 'awaiting';
                              const diffSeconds = Math.floor(Date.now() / 1000 - lead.lastMessageTimestamp);
                              const isSlaCritical = isAwaiting && diffSeconds > 300;

                              return (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  onClick={() => openChat(lead)}
                                  className={`bg-[#03081a] border border-white/5 p-5 rounded-[2.5rem] shadow-2xl cursor-pointer hover:border-orange-500/40 transition-all group relative ${snapshot.isDragging ? 'rotate-2 scale-105 z-50' : ''} ${isSlaCritical ? 'sla-alert border-red-500/50 shadow-red-500/10' : ''}`}
                                >
                                  {isSlaCritical && (
                                    <div className="absolute -top-2 -right-2 bg-red-600 text-white text-[8px] font-black px-3 py-1 rounded-full shadow-lg z-10 animate-bounce">PRIORIDADE CRÍTICA</div>
                                  )}

                                  <div className="flex items-center gap-4 mb-4">
                                     <div className="relative">
                                        <img src={lead.avatar} className="w-12 h-12 rounded-2xl border border-white/10 group-hover:scale-110 transition-transform" />
                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-[#03081a] rounded-full" />
                                     </div>
                                     <div className="min-w-0 flex-1">
                                        <h4 className="text-[13px] font-black text-white italic truncate uppercase tracking-tight">{lead.name}</h4>
                                        <div className="flex items-center gap-3 mt-1.5">
                                           <div className="flex items-center gap-1.5">
                                              <Clock size={11} className="text-slate-700" />
                                              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{getWaitTime(lead.lastMessageTimestamp)}</span>
                                           </div>
                                           <div className="flex items-center gap-1.5 text-emerald-500 font-black text-[10px]">
                                              <DollarSign size={10} />
                                              {lead.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                           </div>
                                        </div>
                                     </div>
                                  </div>

                                  {lead.incidentType && (
                                    <div className={`mb-4 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest text-center ${INCIDENT_LABELS[lead.incidentType].color}`}>
                                       {INCIDENT_LABELS[lead.incidentType].label}
                                    </div>
                                  )}

                                  <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/5 italic">
                                     <p className="text-[10px] text-slate-500 font-medium line-clamp-2 leading-relaxed">
                                       "{lead.lastMessage}"
                                     </p>
                                  </div>

                                  <div className="mt-5 flex items-center justify-between pt-4 border-t border-white/5">
                                     <div className="flex items-center gap-2">
                                        <ShieldCheck size={12} className="text-orange-500" />
                                        <span className="text-[8px] font-black text-slate-700 uppercase tracking-widest leading-none">Canal Protegido</span>
                                     </div>
                                     <ArrowRight size={16} className="text-slate-800 group-hover:translate-x-1 group-hover:text-orange-500 transition-all" />
                                  </div>
                                </div>
                              );
                            }}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    </div>
                  )}
                </Droppable>
              ))}
            </div>
          </DragDropContext>
        </div>

        {/* Chat Sidebar Overlay */}
        {isChatOpen && selectedLead && (
          <div className="fixed inset-0 z-[100] flex justify-end animate-in fade-in duration-300">
             <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setIsChatOpen(false)} />
             <div className="relative w-full max-w-2xl bg-[#020617] border-l border-white/10 shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
                <div className="p-10 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                   <div className="flex items-center gap-6">
                      <img src={selectedLead.avatar} className="w-16 h-16 rounded-[2rem] border border-white/10 shadow-2xl" />
                      <div>
                         <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none mb-3">{selectedLead.name}</h3>
                         <div className="flex items-center gap-4">
                            <span className="px-4 py-1.5 bg-orange-600/10 border border-orange-500/20 rounded-full text-[10px] font-black text-orange-500 uppercase tracking-widest italic leading-none">{COLUMNS.find(c => c.id === selectedLead.columnId)?.label}</span>
                            <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest italic leading-none">+{selectedLead.phone}</span>
                         </div>
                      </div>
                   </div>
                   <button onClick={() => setIsChatOpen(false)} className="p-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl transition-all border border-white/10 active:scale-95">
                      <X size={24} />
                   </button>
                </div>

                <div ref={scrollRef} className="flex-1 p-10 overflow-y-auto custom-scrollbar space-y-8 bg-[linear-gradient(rgba(245,158,11,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(245,158,11,0.01)_1px,transparent_1px)] bg-[size:50px_50px]">
                   {messages.map(msg => (
                     <div key={msg.id} className={`flex ${msg.sender === 'agent' ? 'justify-end' : 'justify-start'}`}>
                        <div className="max-w-[85%]">
                           <div className={`p-7 rounded-[3rem] text-[15px] font-medium leading-relaxed shadow-2xl border ${msg.sender === 'agent' ? 'bg-orange-600 text-white border-orange-500 rounded-tr-none' : 'bg-white/5 text-slate-200 border-white/10 rounded-tl-none'}`}>
                             {msg.content}
                           </div>
                           <p className={`text-[10px] font-black text-slate-700 uppercase mt-3 px-4 ${msg.sender === 'agent' ? 'text-right' : 'text-left'}`}>{msg.timestamp}</p>
                        </div>
                     </div>
                   ))}
                </div>

                <div className="p-10 border-t border-white/5 bg-white/[0.01] space-y-6">
                   {/* Botão Gemini Script */}
                   <button 
                    onClick={generateNeuralScript}
                    disabled={isAiGenerating}
                    className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center gap-3 text-[11px] font-black text-white uppercase tracking-[0.2em] transition-all group"
                   >
                     {isAiGenerating ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} className="text-orange-500 group-hover:animate-pulse" />}
                     Gerar Script de Recuperação Neural
                   </button>

                   <div className="flex items-center gap-5 bg-slate-950 p-3 rounded-[3.5rem] border border-white/10 shadow-inner">
                      <input 
                        value={newMessage} 
                        onChange={(e) => setNewMessage(e.target.value)} 
                        onKeyDown={(e) => e.key === 'Enter' && sendMessage()} 
                        placeholder="DISPARAR RESPOSTA PERSUASIVA..." 
                        className="flex-1 bg-transparent border-none py-5 px-8 text-base text-white outline-none focus:ring-0 placeholder:text-slate-800 font-medium"
                      />
                      <button 
                        onClick={sendMessage} 
                        disabled={!newMessage.trim() || isSending} 
                        className="p-6 bg-orange-600 text-white rounded-full shadow-2xl hover:bg-orange-500 transition-all active:scale-90 shadow-orange-600/40"
                      >
                        {isSending ? <Loader2 size={28} className="animate-spin" /> : <Send size={28} />}
                      </button>
                   </div>
                </div>
             </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ChatManager;
