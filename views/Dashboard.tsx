
import React from 'react';
import { 
  TrendingUp, Users, MessageCircle, Activity, Smartphone, Webhook, 
  CheckCircle2, Circle, ArrowRight, Zap, Database, Shield
} from 'lucide-react';
import Layout from '../components/Layout.tsx';
import { AppView } from '../types.ts';

const Dashboard: React.FC<{ onLogout: () => void, onNavigate: (v: AppView) => void, trialRemaining?: number }> = ({ onLogout, onNavigate, trialRemaining = 15 }) => {
  const setupSteps = [
    { label: 'Configurar Evolution API', done: false },
    { label: 'Sincronizar n8n Workflows', done: false },
    { label: 'Ativar WhatsApp Web', done: false },
    { label: 'Treinar Agente Neural', done: false },
  ];

  return (
    <Layout activeView={AppView.DASHBOARD} onNavigate={onNavigate} onLogout={onLogout}>
      <div className="space-y-10 animate-in fade-in duration-1000">
        
        {/* Onboarding Header */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 to-[#020617] border border-white/10 rounded-[3rem] p-10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:scale-110 transition-transform">
               <Zap size={200} className="text-orange-500" />
            </div>
            <div className="relative z-10">
               <div className="flex items-center gap-3 mb-8">
                  <span className="px-4 py-1.5 bg-orange-600/20 text-orange-500 text-[10px] font-black uppercase tracking-[0.3em] rounded-full border border-orange-500/20">Protocolo de Início Alpha</span>
                  <span className="text-slate-500 text-xs font-bold">15% Ativado</span>
               </div>
               <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-8 leading-[0.9] italic">Sua Central de <br /> Automação Neural.</h1>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                  {setupSteps.map((step, i) => (
                    <div key={i} className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5 group hover:border-orange-500/20 transition-all cursor-pointer">
                       {step.done ? <CheckCircle2 size={18} className="text-emerald-500" /> : <div className="w-[18px] h-[18px] border-2 border-slate-800 rounded-full" />}
                       <span className={`text-sm font-bold ${step.done ? 'text-slate-300' : 'text-slate-600'}`}>{step.label}</span>
                    </div>
                  ))}
               </div>

               <button onClick={() => onNavigate(AppView.CONNECTIONS)} className="px-10 py-5 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-orange-600/20 transition-all flex items-center gap-3">
                  Configurar Credenciais Master <ArrowRight size={18} />
               </button>
            </div>
          </div>

          <div className="bg-[#020617] border border-white/5 rounded-[3rem] p-10 flex flex-col justify-center items-center text-center space-y-6">
             <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center text-slate-800 relative">
                <div className="absolute inset-0 border-2 border-orange-500/20 rounded-full animate-ping" />
                <Activity size={48} />
             </div>
             <div>
                <h3 className="text-xl font-black text-white mb-2 italic">Aguardando Sincronia.</h3>
                <p className="text-slate-500 text-sm font-medium leading-relaxed px-4">Conecte sua Evolution API para começar a processar mensagens.</p>
             </div>
             <div className="pt-4 flex gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Offline Nodes</span>
             </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
           <StatCard label="Receita Recuperada" val="R$ 0,00" icon={TrendingUp} color="text-orange-500" />
           <StatCard label="Fluxos Ativos" val="0" icon={Webhook} color="text-purple-500" />
           <StatCard label="Conversões IA" val="0.0%" icon={Zap} color="text-emerald-500" />
           <StatCard label="Leads Sincronizados" val="0" icon={Users} color="text-blue-500" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 bg-[#020617] border border-white/5 rounded-[3rem] p-10 h-[450px] relative overflow-hidden group">
              <div className="flex items-center justify-between mb-10">
                 <h3 className="text-xl font-black text-white italic tracking-tight flex items-center gap-3">
                    <Activity size={20} className="text-orange-500" /> Performance em Tempo Real
                 </h3>
                 <div className="flex gap-2">
                    <div className="px-3 py-1 bg-white/5 rounded-lg text-[10px] font-black text-slate-500 uppercase">7 dias</div>
                 </div>
              </div>
              <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[2.5rem] p-10">
                 <Database size={48} className="text-slate-800 mb-6" />
                 <p className="text-slate-600 font-black text-xs uppercase tracking-[0.3em]">Integrando Evolution Data Layer...</p>
              </div>
           </div>

           <div className="bg-[#020617] border border-white/5 rounded-[3rem] p-10 space-y-8 shadow-xl">
              <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] mb-4">Status de Segurança</h3>
              <div className="space-y-6">
                 <SecurityItem label="Encaminhamento TLS" status="secure" />
                 <SecurityItem label="Evolution API Cluster" status="pending" />
                 <SecurityItem label="n8n Webhook Auth" status="pending" />
                 <SecurityItem label="Neural Token Sync" status="secure" />
              </div>
              <div className="pt-6 border-t border-white/5">
                 <button onClick={() => onNavigate(AppView.CONNECTIONS)} className="w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/10 transition-all">
                    Verificar Todas Integrações
                 </button>
              </div>
           </div>
        </div>
      </div>
    </Layout>
  );
};

const StatCard: React.FC<{ label: string, val: string, icon: any, color: string }> = ({ label, val, icon: Icon, color }) => (
  <div className="bg-[#020617] border border-white/5 p-8 rounded-[2.5rem] shadow-xl group hover:border-orange-500/20 transition-all">
     <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">{label}</p>
     <div className="flex items-end justify-between">
        <h3 className="text-3xl font-black text-white tracking-tighter">{val}</h3>
        <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${color}`}>
           <Icon size={20} />
        </div>
     </div>
  </div>
);

const SecurityItem: React.FC<{ label: string, status: 'secure' | 'pending' | 'warning' }> = ({ label, status }) => (
  <div className="flex items-center justify-between">
     <span className="text-xs font-bold text-slate-500">{label}</span>
     <div className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${
        status === 'secure' ? 'bg-emerald-500/10 text-emerald-500' : 
        status === 'pending' ? 'bg-orange-500/10 text-orange-500' : 'bg-red-500/10 text-red-500'
     }`}>
        {status}
     </div>
  </div>
);

export default Dashboard;
