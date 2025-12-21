
import React, { useState } from 'react';
import { 
  Search, MessageCircle, MoreVertical, Smartphone, Users, Zap, CheckCircle2, Clock
} from 'lucide-react';
import Layout from '../components/Layout';
import { AppView, KanbanLead } from '../types';

const ChatManager: React.FC<{ onLogout: () => void, onNavigate: (v: AppView) => void }> = ({ onLogout, onNavigate }) => {
  const [leads, setLeads] = useState<KanbanLead[]>([
    { id: '1', name: 'Marcos Silva', lastMessage: 'Como funciona o Pix?', value: 297, avatar: 'https://picsum.photos/seed/1/40/40', columnId: 'new' },
    { id: '2', name: 'Julia Paes', lastMessage: 'Link expirado.', value: 497, avatar: 'https://picsum.photos/seed/2/40/40', columnId: 'new' },
    { id: '3', name: 'Sérgio Lopez', lastMessage: 'Vou pagar amanhã.', value: 997, avatar: 'https://picsum.photos/seed/3/40/40', columnId: 'chatting' },
    { id: '4', name: 'Ana Bia', lastMessage: 'Obrigado!', value: 127, avatar: 'https://picsum.photos/seed/4/40/40', columnId: 'won' },
  ]);

  const onDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('leadId', id);
  };

  const onDrop = (e: React.DragEvent, colId: KanbanLead['columnId']) => {
    const id = e.dataTransfer.getData('leadId');
    setLeads(leads.map(l => l.id === id ? { ...l, columnId: colId } : l));
  };

  const columns = [
    { id: 'new', label: 'Novos Leads', color: 'bg-orange-500', icon: Smartphone },
    { id: 'chatting', label: 'Em Atendimento', color: 'bg-purple-500', icon: MessageCircle },
    { id: 'followup', label: 'Aguardando Follow-up', color: 'bg-blue-500', icon: Clock },
    { id: 'won', label: 'Convertidos', color: 'bg-emerald-500', icon: CheckCircle2 },
  ];

  return (
    <Layout activeView={AppView.CHAT_MANAGER} onNavigate={onNavigate} onLogout={onLogout}>
      <div className="flex flex-col h-full space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tighter">Fluxo de Atendimento</h1>
            <p className="text-slate-500 text-sm font-medium">Gerencie suas conversas da Evolution API arrastando os cards.</p>
          </div>
          <div className="flex gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
              <input type="text" placeholder="Buscar lead..." className="bg-white/5 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-orange-500 transition-all" />
            </div>
            <button className="px-5 py-2 bg-orange-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-orange-600/10">Sincronizar API</button>
          </div>
        </div>

        <div className="flex-1 flex gap-6 overflow-x-auto pb-6 custom-scrollbar">
          {columns.map((col) => (
            <div 
              key={col.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => onDrop(e, col.id as any)}
              className="flex-none w-80 bg-white/[0.01] border border-white/5 rounded-3xl flex flex-col overflow-hidden"
            >
              <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${col.color}`} />
                  <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">{col.label}</span>
                </div>
                <span className="text-[10px] font-black text-slate-600">{leads.filter(l => l.columnId === col.id).length}</span>
              </div>
              
              <div className="flex-1 p-4 space-y-4 overflow-y-auto custom-scrollbar">
                {leads.filter(l => l.columnId === col.id).map((lead) => (
                  <div 
                    key={lead.id}
                    draggable
                    onDragStart={(e) => onDragStart(e, lead.id)}
                    className="bg-slate-900 border border-white/5 p-4 rounded-2xl cursor-grab active:cursor-grabbing hover:border-orange-500/50 transition-all group"
                  >
                    <div className="flex items-center justify-between mb-4">
                       <img src={lead.avatar} className="w-8 h-8 rounded-full border border-white/10" alt={lead.name} />
                       <button className="text-slate-600 hover:text-white transition-colors"><MoreVertical size={14} /></button>
                    </div>
                    <h4 className="text-white font-bold text-sm mb-1">{lead.name}</h4>
                    <p className="text-slate-500 text-[11px] line-clamp-2 mb-4 leading-relaxed font-medium">"{lead.lastMessage}"</p>
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                       <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">R$ {lead.value}</span>
                       <div className="flex gap-1">
                          <div className="w-4 h-4 rounded bg-orange-500/20 text-orange-500 flex items-center justify-center text-[8px]"><Smartphone size={8} /></div>
                          <div className="w-4 h-4 rounded bg-purple-500/20 text-purple-500 flex items-center justify-center text-[8px]"><Zap size={8} /></div>
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default ChatManager;
