
import React, { useState } from 'react';
import { 
  TrendingUp, Users, Zap, DollarSign, Ban, Activity, Sparkles, ArrowRight, ShieldCheck, Terminal
} from 'lucide-react';
import Layout from '../components/Layout.tsx';
import { AppView } from '../types.ts';

const Dashboard: React.FC<{ onLogout: () => void, onNavigate: (v: AppView) => void }> = ({ onLogout, onNavigate }) => {
  const [stats] = useState({
    recovered: "R$ 12.450,00",
    risk: "R$ 4.890,00",
    leads: 84,
    conversion: "34%"
  });

  return (
    <Layout activeView={AppView.DASHBOARD} onNavigate={onNavigate} onLogout={onLogout}>
      <div className="space-y-10 animate-in fade-in duration-700 h-full overflow-y-auto custom-scrollbar pr-2">
        
        {/* Top War-Room Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-gradient-to-br from-[#03081a] to-[#010411] border border-white/10 rounded-[4rem] p-12 relative overflow-hidden shadow-2xl">
             <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none rotate-12 scale-150"><DollarSign size={300} className="text-orange-500" /></div>
             <div className="relative z-10">
                <div className="flex items-center gap-4 mb-8">
                   <div className="px-5 py-2.5 bg-red-600/10 border border-red-500/20 rounded-full flex items-center gap-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      <span className="text-[10px] font-black text-red-500 uppercase tracking-[0.4em]">WayFlow War-Room Active</span>
                   </div>
                </div>
                <h1 className="text-6xl font-black text-white tracking-tighter mb-8 italic uppercase leading-[0.85]">Recuperação de <br /><span className="text-orange-500">Capital Crítico</span>.</h1>
                <p className="text-slate-400 text-lg max-w-xl font-medium leading-relaxed mb-12">O núcleo WayFlow está monitorando <span className="text-white font-bold">{stats.leads} acidentes de checkout</span>. Sua taxa de resgate atual está protegendo <span className="text-emerald-500 font-bold">{stats.recovered}</span> do seu faturamento.</p>
                
                <div className="flex flex-wrap gap-6">
                   <button onClick={() => onNavigate(AppView.CHAT_MANAGER)} className="px-12 py-6 bg-orange-600 hover:bg-orange-500 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.4em] shadow-2xl flex items-center gap-4 transition-all active:scale-95 group">
                      Abrir Central de Resgate <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                   </button>
                </div>
             </div>
          </div>

          <div className="bg-[#020617] border border-white/10 rounded-[4rem] p-10 flex flex-col justify-center space-y-10 shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-5"><Ban size={100} className="text-red-500" /></div>
             <div className="space-y-2">
                <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest italic">Capital sob Ameaça</p>
                <p className="text-5xl font-black text-red-500 italic tracking-tighter">{stats.risk}</p>
             </div>
             
             <div className="space-y-6">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest italic">
                   <span className="text-slate-500">Resgate Neural</span>
                   <span className="text-emerald-500">{stats.conversion} EFICIÊNCIA</span>
                </div>
                <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
                   <div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 w-[34%] shadow-[0_0_15px_#10b981]" />
                </div>
                <div className="flex items-center gap-3 p-4 bg-orange-600/5 border border-orange-500/10 rounded-2xl">
                   <ShieldCheck size={16} className="text-orange-500" />
                   <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest leading-relaxed">Nota: Arraste falhas de cartão para "Recuperação Ativa" para IA disparar o script.</p>
                </div>
             </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           <StatCard label="Total Resgatado" val={stats.recovered} icon={TrendingUp} color="text-emerald-500" />
           <StatCard label="Incidentes Ativos" val={stats.leads.toString()} icon={Activity} color="text-red-500" />
           <StatCard label="Taxa de Resgate" val={stats.conversion} icon={Zap} color="text-orange-500" />
           <StatCard label="Scripts Gerados" val="342" icon={Sparkles} color="text-purple-500" />
        </div>

        {/* Neural Log */}
        <div className="bg-[#03081a] border border-white/10 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
           <div className="flex items-center gap-4 mb-10">
              <Terminal size={20} className="text-orange-500" />
              <h4 className="text-[11px] font-black text-white uppercase tracking-[0.3em] italic">Logs de Recuperação Neural</h4>
           </div>
           <div className="space-y-6">
              <LogItem time="14:55:02" msg="IA Gemini gerou script de conversão para Ana (Saldo Insuficiente)" type="success" />
              <LogItem time="14:52:10" msg="Novo Incidente: Marcos O. - Cartão Negado (R$ 497,00)" type="error" />
              <LogItem time="14:50:05" msg="Venda Recuperada: R$ 297,00 de Carlos S." type="success" />
           </div>
        </div>
      </div>
    </Layout>
  );
};

const StatCard: React.FC<{ label: string, val: string, icon: any, color: string }> = ({ label, val, icon: Icon, color }) => (
  <div className="bg-[#03081a] border border-white/10 p-10 rounded-[3rem] shadow-2xl group hover:border-white/20 transition-all">
     <p className="text-[11px] font-black text-slate-600 uppercase tracking-[0.3em] mb-10">{label}</p>
     <div className="flex items-end justify-between">
        <h3 className="text-4xl font-black text-white italic tracking-tighter">{val}</h3>
        <div className={`w-14 h-14 rounded-3xl bg-white/5 flex items-center justify-center ${color} border border-white/10 group-hover:scale-110 transition-transform`}>
           <Icon size={28} />
        </div>
     </div>
  </div>
);

const LogItem: React.FC<{ time: string, msg: string, type: 'success' | 'error' | 'info' }> = ({ time, msg, type }) => (
  <div className="flex items-start gap-6 border-l-2 border-white/5 pl-6 hover:border-orange-500 transition-all group">
     <span className="text-[9px] font-mono text-slate-700 mt-1">{time}</span>
     <p className={`text-[10px] font-black uppercase tracking-widest ${type === 'success' ? 'text-emerald-500' : (type === 'error' ? 'text-red-500' : 'text-slate-400')} group-hover:text-white transition-colors`}>{msg}</p>
  </div>
);

export default Dashboard;
