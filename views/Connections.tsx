
import React from 'react';
import { 
  Unplug, 
  ExternalLink, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Plus,
  Webhook,
  Smartphone,
  Database,
  Lock,
  RefreshCw,
  Copy,
  Zap,
  Settings
} from 'lucide-react';
import Layout from '../components/Layout.tsx';
import { AppView } from '../types.ts';

const Connections: React.FC<{ onLogout: () => void, onNavigate: (v: AppView) => void }> = ({ onLogout, onNavigate }) => {
  return (
    <Layout activeView={AppView.CONNECTIONS} onNavigate={onNavigate} onLogout={onLogout}>
      <div className="max-w-7xl mx-auto space-y-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter mb-2">Ecossistema WayFlow</h1>
            <p className="text-slate-400 font-medium">Arquitetura de dados centralizada para sua automação.</p>
          </div>
          <button className="btn-primary px-8 py-4 text-white font-black text-sm uppercase tracking-wider rounded-2xl flex items-center gap-2 shadow-2xl">
            <Plus size={20} strokeWidth={3} /> Nova Integração
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <IntegrationCard 
                name="Evolution API (WhatsApp)" 
                type="Instância Ativa: WAY_MASTER" 
                status="connected" 
                icon={Smartphone}
                lastSync="há 12 min"
                color="orange"
              />
              <IntegrationCard 
                name="n8n Workflows" 
                type="WayFlow Recovery v4" 
                status="connected" 
                icon={Webhook}
                lastSync="Sincronizado"
                color="red"
              />
            </div>

            <div className="bg-[#020617] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
              <div className="p-8 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
                <div>
                   <h3 className="text-2xl font-black text-white tracking-tight">Gestão Evolution API</h3>
                   <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mt-1">Conexão de Alta Performance</p>
                </div>
                <div className="flex items-center gap-3">
                   <button className="p-2.5 rounded-xl bg-white/[0.03] text-slate-400 hover:text-white transition-all"><RefreshCw size={18} /></button>
                   <button className="p-2.5 rounded-xl bg-white/[0.03] text-slate-400 hover:text-white transition-all"><Settings size={18} /></button>
                </div>
              </div>
              <div className="p-10 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Endereço da Instância</label>
                      <div className="relative group">
                         <div className="absolute inset-y-0 left-4 flex items-center text-slate-600 group-focus-within:text-orange-500 transition-colors">
                           <ExternalLink size={16} />
                         </div>
                         <input 
                           readOnly 
                           value="https://api.evolution.wayflow.ia/v3/master" 
                           className="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm text-slate-300 font-bold focus:outline-none focus:border-orange-500 transition-all"
                         />
                         <button className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white transition-colors"><Copy size={16} /></button>
                      </div>
                   </div>
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Global API Key</label>
                      <div className="relative group">
                         <div className="absolute inset-y-0 left-4 flex items-center text-slate-600">
                           <Lock size={16} />
                         </div>
                         <input 
                           type="password" 
                           value="**************************" 
                           className="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm text-slate-300 font-bold focus:outline-none focus:border-orange-500 transition-all"
                         />
                         <button className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white transition-colors">Exibir</button>
                      </div>
                   </div>
                </div>

                <div className="p-8 rounded-[2rem] bg-gradient-to-br from-orange-600/5 to-transparent border border-orange-500/10 flex items-center justify-between">
                   <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-[1.5rem] bg-orange-600/10 text-orange-500 flex items-center justify-center"><Zap size={32} strokeWidth={2.5} /></div>
                      <div>
                        <h4 className="text-lg font-black text-white mb-1">Status do Webhook WayFlow</h4>
                        <p className="text-sm text-slate-400 font-medium">Todos os eventos de checkout estão sendo processados em tempo real.</p>
                      </div>
                   </div>
                   <span className="px-5 py-2 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase rounded-full ring-1 ring-emerald-500/20">Ativo</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-[#020617] border border-white/5 rounded-[2.5rem] p-10 shadow-2xl text-center group">
               <div className="relative inline-block mb-10">
                  <div className="absolute -inset-4 bg-orange-500/10 rounded-3xl blur-2xl group-hover:bg-orange-500/20 transition duration-1000" />
                  <div className="relative bg-white p-6 rounded-[2.5rem] shadow-2xl">
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=WayFlowMasterConnection&color=020617" alt="Evolution QR" className="w-48 h-48 opacity-90" />
                  </div>
               </div>
               <h3 className="text-2xl font-black text-white mb-3">Conectar Aparelho</h3>
               <p className="text-slate-500 text-sm font-medium mb-8">Escaneie o código acima via WhatsApp para vincular sua instância Evolution Master.</p>
               <button className="w-full py-4 bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 rounded-2xl text-white font-black text-sm uppercase tracking-[0.2em] transition-all">
                  Gerar Novo Código
               </button>
            </div>

            <div className="p-8 glass rounded-[2.5rem] border border-white/5">
               <h4 className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-6">Próximos passos</h4>
               <div className="space-y-5">
                  <StepItem num="01" text="Valide sua chave n8n" done />
                  <StepItem num="02" text="Escaneie o QR Evolution" done={false} />
                  <StepItem num="03" text="Teste o webhook Master" done={false} />
               </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

const StepItem: React.FC<{ num: string, text: string, done: boolean }> = ({ num, text, done }) => (
  <div className="flex items-center gap-4 group">
    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${done ? 'bg-emerald-500/20 text-emerald-500' : 'bg-white/5 text-slate-500'}`}>
      {done ? <CheckCircle2 size={16} /> : num}
    </div>
    <span className={`text-sm font-bold tracking-tight ${done ? 'text-slate-300' : 'text-slate-500'}`}>{text}</span>
  </div>
);

interface IntCardProps {
  name: string;
  type: string;
  status: 'connected' | 'disconnected' | 'pending';
  icon: React.ElementType;
  lastSync: string;
  color: string;
}

const IntegrationCard: React.FC<IntCardProps> = ({ name, type, status, icon: Icon, lastSync, color }) => {
  const statusConfig = {
    connected: { icon: CheckCircle2, text: 'Conectado', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    disconnected: { icon: XCircle, text: 'Falha', color: 'text-rose-500', bg: 'bg-rose-500/10' },
    pending: { icon: AlertCircle, text: 'Inativo', color: 'text-slate-500', bg: 'bg-slate-500/10' },
  };

  const { icon: StatusIcon, text: statusText, color: statusColor, bg: statusBg } = statusConfig[status];

  return (
    <div className="bg-[#020617] border border-white/5 p-8 rounded-[2.5rem] hover:border-orange-500/30 transition-all duration-500 shadow-2xl group">
      <div className="flex items-start justify-between mb-8">
        <div className={`p-5 bg-${color}-600/10 text-${color}-500 rounded-3xl ring-1 ring-white/10 group-hover:scale-105 transition-transform duration-500`}>
          <Icon size={28} strokeWidth={2.5} />
        </div>
        <div className={`flex items-center gap-2 px-3 py-1 ${statusBg} ${statusColor} text-[10px] font-black uppercase rounded-full ring-1 ring-white/5`}>
          <StatusIcon size={12} strokeWidth={3} /> {statusText}
        </div>
      </div>
      <h3 className="text-white font-black text-xl mb-1 tracking-tight">{name}</h3>
      <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-8">{type}</p>
      
      <div className="pt-8 border-t border-white/5 flex items-center justify-between">
        <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest">Sinc: {lastSync}</span>
        <button className="text-orange-500 hover:text-orange-400 text-xs font-black uppercase tracking-widest">Gerenciar</button>
      </div>
    </div>
  );
};

export default Connections;
