
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
      <div className="space-y-6 animate-in fade-in duration-700">
        
        {/* Onboarding Header Compacto */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#03081a] border border-white/5 rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
               <Zap size={180} className="text-orange-500" />
            </div>
            <div className="relative z-10">
               <div className="flex items-center gap-3 mb-6">
                  <span className="font-outfit px-3 py-1 bg-orange-600/20 text-orange-500 text-[8px] font-black uppercase tracking-[0.3em] rounded-full border border-orange-500/10">Início Alpha</span>
                  <span className="font-outfit text-slate-500 text-[8px] font-black uppercase tracking-widest ml-2">25% Concluído</span>
               </div>
               <h1 className="font-outfit text-3xl font-black text-white tracking-tighter mb-8 leading-none italic uppercase">Sua Central Neural.</h1>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
                  {setupSteps.map((step, i) => (
                    <div key={i} className="flex items-center gap-4 bg-white/[0.02] p-4 rounded-2xl border border-white/5 hover:border-orange-500/20 transition-all cursor-pointer">
                       {step.done ? <CheckCircle2 size={18} className="text-emerald-500" /> : <div className="w-[18px] h-[18px] border-2 border-slate-800 rounded-full" />}
                       <span className={`font-outfit text-xs font-black uppercase tracking-tight ${step.done ? 'text-slate-300 italic' : 'text-slate-600'}`}>{step.label}</span>
                    </div>
                  ))}
               </div>

               <button onClick={() => onNavigate(AppView.CONNECTIONS)} className="font-outfit px-8 py-4 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl transition-all flex items-center gap-3">
                  Configurar Conexões <ArrowRight size={16} />
               </button>
            </div>
          </div>

          <div className="bg-[#020617] border border-white/5 rounded-3xl p-8 flex flex-col justify-center items-center text-center space-y-6">
             <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center text-slate-800 relative">
                <Activity size={32} className="text-orange-500/40" />
             </div>
             <div className="font-outfit">
                <h3 className="text-lg font-black text-white mb-2 italic uppercase">Aguardando Node.</h3>
                <p className="text-slate-500 text-[11px] leading-relaxed px-2">Cluster aguarda vinculação da Evolution API.</p>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="font-outfit text-[9px] font-black text-red-500 uppercase tracking-widest">Offline</span>
             </div>
          </div>
        </div>

        {/* Stats Grid Compacto */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
           <StatCard label="Recuperado" val="R$ 0,00" icon={TrendingUp} color="text-orange-500" />
           <StatCard label="Fluxos" val="0" icon={Webhook} color="text-purple-500" />
           <StatCard label="IA Conversão" val="0.0%" icon={Zap} color="text-emerald-500" />
           <StatCard label="Leads" val="0" icon={Users} color="text-blue-500" />
        </div>
      </div>
    </Layout>
  );
};

const StatCard: React.FC<{ label: string, val: string, icon: any, color: string }> = ({ label, val, icon: Icon, color }) => (
  <div className="bg-[#020617] border border-white/5 p-6 rounded-3xl shadow-lg relative overflow-hidden group">
     <p className="font-outfit text-[9px] font-black text-slate-600 uppercase tracking-widest mb-4">{label}</p>
     <div className="flex items-end justify-between relative z-10">
        <h3 className="font-outfit text-2xl font-black text-white tracking-tighter italic">{val}</h3>
        <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${color}`}>
           <Icon size={20} />
        </div>
     </div>
  </div>
);

export default Dashboard;
