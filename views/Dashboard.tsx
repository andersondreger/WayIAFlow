
import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Users, MessageCircle, Activity, Smartphone, Webhook, 
  CheckCircle2, Circle, ArrowRight, Zap, Database, Shield
} from 'lucide-react';
import Layout from '../components/Layout.tsx';
import { AppView } from '../types.ts';

const Dashboard: React.FC<{ onLogout: () => void, onNavigate: (v: AppView) => void, trialRemaining?: number }> = ({ onLogout, onNavigate, trialRemaining = 15 }) => {
  const [stats, setStats] = useState({
    leads: 0,
    chats: 0,
    conversion: "0.0%"
  });

  useEffect(() => {
    // Tenta carregar dados reais do cache do ChatManager
    const cachedLeads = localStorage.getItem('wayflow_leads_cache');
    if (cachedLeads) {
      const leads = JSON.parse(cachedLeads);
      setStats({
        leads: leads.length,
        chats: leads.filter((l: any) => l.unreadCount > 0).length,
        conversion: "12.4%" // Simulação de conversão para exemplo
      });
    }
  }, []);

  const setupSteps = [
    { label: 'Conectar Evolution API', done: !!localStorage.getItem('wayflow_evo_config') },
    { label: 'Sincronizar n8n Workflows', done: false },
    { label: 'Vincular WhatsApp Web', done: stats.leads > 0 },
    { label: 'Treinar Agente Neural', done: false },
  ];

  const completionPercent = Math.round((setupSteps.filter(s => s.done).length / setupSteps.length) * 100);

  return (
    <Layout activeView={AppView.DASHBOARD} onNavigate={onNavigate} onLogout={onLogout}>
      <div className="space-y-8 animate-in fade-in duration-700 h-full overflow-y-auto custom-scrollbar">
        
        {/* Onboarding Header */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#03081a] border border-white/10 rounded-[2.5rem] p-10 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
               <Zap size={220} className="text-orange-500" />
            </div>
            <div className="relative z-10">
               <div className="flex items-center gap-4 mb-8">
                  <span className="font-outfit px-4 py-1.5 bg-orange-600/20 text-orange-500 text-[9px] font-black uppercase tracking-[0.3em] rounded-full border border-orange-500/20 shadow-lg">Status do Setup</span>
                  <span className="font-outfit text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] ml-2">{completionPercent}% Concluído</span>
               </div>
               <h1 className="font-outfit text-4xl font-black text-white tracking-tighter mb-10 leading-none italic uppercase">O Futuro das Vendas.</h1>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                  {setupSteps.map((step, i) => (
                    <div 
                      key={i} 
                      onClick={() => !step.done && onNavigate(AppView.CONNECTIONS)}
                      className={`flex items-center gap-5 p-5 rounded-3xl border transition-all cursor-pointer ${step.done ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-white/5 border-white/10 hover:border-orange-500/30'}`}
                    >
                       <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step.done ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-white/10 text-slate-600'}`}>
                          {step.done ? <CheckCircle2 size={16} /> : <div className="w-2 h-2 rounded-full bg-slate-800" />}
                       </div>
                       <span className={`font-outfit text-xs font-black uppercase tracking-tight ${step.done ? 'text-emerald-500' : 'text-slate-500'}`}>{step.label}</span>
                    </div>
                  ))}
               </div>

               <button onClick={() => onNavigate(AppView.CONNECTIONS)} className="font-outfit px-10 py-5 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-orange-600/30 transition-all flex items-center gap-4 active:scale-95">
                  Expandir Operação <ArrowRight size={20} />
               </button>
            </div>
          </div>

          <div className="bg-[#020617] border border-white/10 rounded-[2.5rem] p-10 flex flex-col justify-center items-center text-center space-y-8 shadow-2xl">
             <div className="w-24 h-24 bg-white/5 rounded-3xl flex items-center justify-center text-slate-800 relative group">
                <div className="absolute inset-0 bg-orange-600/10 blur-2xl group-hover:bg-orange-500/20 transition-all duration-700" />
                <Activity size={40} className="text-orange-500/60 relative z-10" />
             </div>
             <div className="font-outfit">
                <h3 className="text-xl font-black text-white mb-3 italic uppercase tracking-tighter">Sincronia Global.</h3>
                <p className="text-slate-500 text-[11px] leading-relaxed px-4 font-medium uppercase tracking-widest">Aguardando gatilhos de recuperação de checkout.</p>
             </div>
             <div className="flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full ${stats.leads > 0 ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'}`} />
                <span className="font-outfit text-[10px] font-black uppercase tracking-widest">
                  {stats.leads > 0 ? 'Conexão Ativa' : 'Offline'}
                </span>
             </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
           <StatCard label="Recuperado (Estimado)" val="R$ 14.2k" icon={TrendingUp} color="text-orange-500" />
           <StatCard label="Total de Leads" val={stats.leads.toString()} icon={Users} color="text-purple-500" />
           <StatCard label="Taxa Conversão" val={stats.conversion} icon={Zap} color="text-emerald-500" />
           <StatCard label="Novos Chats" val={stats.chats.toString()} icon={MessageCircle} color="text-blue-500" />
        </div>

        <div className="bg-[#03081a]/50 border border-white/5 p-10 rounded-[3rem] text-center opacity-40">
           <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em]">Logs do Sistema • Evolution Engine v2.4 Active • Gemini 3 Fast Active</p>
        </div>
      </div>
    </Layout>
  );
};

const StatCard: React.FC<{ label: string, val: string, icon: any, color: string }> = ({ label, val, icon: Icon, color }) => (
  <div className="bg-[#03081a] border border-white/10 p-8 rounded-[2rem] shadow-2xl relative overflow-hidden group hover:border-white/20 transition-all">
     <p className="font-outfit text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-6">{label}</p>
     <div className="flex items-end justify-between relative z-10">
        <h3 className="font-outfit text-3xl font-black text-white tracking-tighter italic leading-none">{val}</h3>
        <div className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center ${color} border border-white/5`}>
           <Icon size={24} />
        </div>
     </div>
  </div>
);

export default Dashboard;
