
import React from 'react';
import { 
  TrendingUp, Users, MessageCircle, Activity, Smartphone, Webhook, 
  CheckCircle2, Circle, ArrowRight, Zap, Database, Shield
} from 'lucide-react';
import Layout from '../components/Layout.tsx';
import { AppView } from '../types.ts';

const Dashboard: React.FC<{ onLogout: () => void, onNavigate: (v: AppView) => void, trialRemaining?: number }> = ({ onLogout, onNavigate, trialRemaining = 15 }) => {
  const setupSteps = [
    { label: 'Configurar Evolution API', done: true },
    { label: 'Sincronizar n8n Workflows', done: false },
    { label: 'Ativar WhatsApp Web', done: false },
    { label: 'Treinar Agente Neural', done: false },
  ];

  return (
    <Layout activeView={AppView.DASHBOARD} onNavigate={onNavigate} onLogout={onLogout}>
      <div className="space-y-10 animate-in fade-in duration-1000">
        
        {/* Onboarding Header */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 to-[#020617] border border-white/10 rounded-[4rem] p-12 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:scale-110 transition-transform">
               <Zap size={240} className="text-orange-500" />
            </div>
            <div className="relative z-10">
               <div className="flex items-center gap-3 mb-10">
                  <span className="font-outfit px-5 py-2 bg-orange-600/20 text-orange-500 text-[10px] font-black uppercase tracking-[0.4em] rounded-full border border-orange-500/20 shadow-[0_0_15px_rgba(234,88,12,0.1)]">Protocolo de Início Alpha</span>
                  <span className="font-outfit text-slate-500 text-[10px] font-black uppercase tracking-widest ml-4">25% Sincronizado</span>
               </div>
               <h1 className="font-outfit text-4xl md:text-6xl font-black text-white tracking-tighter mb-10 leading-[0.9] italic uppercase">Sua Central de <br /> Automação Neural.</h1>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
                  {setupSteps.map((step, i) => (
                    <div key={i} className="flex items-center gap-5 bg-white/[0.02] p-6 rounded-3xl border border-white/5 group hover:border-orange-500/30 transition-all cursor-pointer">
                       {step.done ? <CheckCircle2 size={22} className="text-emerald-500" /> : <div className="w-[22px] h-[22px] border-2 border-slate-800 rounded-full" />}
                       <span className={`font-outfit text-base font-black uppercase tracking-tight ${step.done ? 'text-slate-300 italic' : 'text-slate-600'}`}>{step.label}</span>
                    </div>
                  ))}
               </div>

               <button onClick={() => onNavigate(AppView.CONNECTIONS)} className="font-outfit px-12 py-6 bg-orange-600 hover:bg-orange-500 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-orange-600/30 transition-all flex items-center gap-4 active:scale-95">
                  Acessar Ponte de Conexão <ArrowRight size={20} />
               </button>
            </div>
          </div>

          <div className="bg-[#020617] border border-white/5 rounded-[4rem] p-12 flex flex-col justify-center items-center text-center space-y-8 shadow-2xl">
             <div className="w-28 h-28 bg-white/5 rounded-[2rem] flex items-center justify-center text-slate-800 relative">
                <div className="absolute inset-0 border-2 border-orange-500/10 rounded-[2rem] animate-ping" />
                <Activity size={56} className="text-orange-500/50" />
             </div>
             <div className="font-outfit">
                <h3 className="text-2xl font-black text-white mb-3 italic uppercase tracking-tighter">Aguardando Node.</h3>
                <p className="text-slate-500 text-sm font-medium leading-relaxed px-4">O cluster aguarda a vinculação da Evolution API para iniciar o processamento de checkouts.</p>
             </div>
             <div className="pt-4 flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_#ef4444]" />
                <span className="font-outfit text-[11px] font-black text-red-500 uppercase tracking-[0.3em]">Rede Offline</span>
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
      </div>
    </Layout>
  );
};

const StatCard: React.FC<{ label: string, val: string, icon: any, color: string }> = ({ label, val, icon: Icon, color }) => (
  <div className="bg-[#020617] border border-white/5 p-10 rounded-[3rem] shadow-2xl group hover:border-orange-500/20 transition-all relative overflow-hidden">
     <div className="absolute -top-5 -right-5 opacity-5 group-hover:scale-110 transition-transform"><Icon size={80} /></div>
     <p className="font-outfit text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-6">{label}</p>
     <div className="flex items-end justify-between relative z-10">
        <h3 className="font-outfit text-4xl font-black text-white tracking-tighter leading-none italic">{val}</h3>
        <div className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center ${color} shadow-lg`}>
           <Icon size={24} />
        </div>
     </div>
  </div>
);

export default Dashboard;
