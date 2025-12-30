
import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Users, MessageCircle, Activity, Smartphone, Webhook, 
  CheckCircle2, Circle, ArrowRight, Zap, Database, Shield, Terminal, Cpu, Sparkles, ShoppingCart, DollarSign
} from 'lucide-react';
import Layout from '../components/Layout.tsx';
import { AppView } from '../types.ts';

const Dashboard: React.FC<{ onLogout: () => void, onNavigate: (v: AppView) => void }> = ({ onLogout, onNavigate }) => {
  const [stats, setStats] = useState({
    leads: 0,
    chats: 0,
    recovered: "R$ 0,00",
    abandonedCount: 12
  });

  const [logs] = useState([
    { t: '21:21:43', m: 'Uplink Evolution v2.3.7 estável via participantAlt', s: 'success' },
    { t: '21:20:10', m: 'Escaneando Checkout Abandonado #Checkout_AF230', s: 'info' },
    { t: '21:18:05', m: 'Agente Neural Forge carregado (Gemini 3 Pro)', s: 'info' },
    { t: '21:15:30', m: 'Sincronização de mensagens privadas concluída', s: 'success' }
  ]);

  useEffect(() => {
    const cachedLeads = localStorage.getItem('wayflow_leads_cache');
    if (cachedLeads) {
      const leads = JSON.parse(cachedLeads);
      setStats({
        leads: leads.length,
        chats: Math.floor(leads.length * 0.7),
        recovered: `R$ ${(leads.length * 420).toLocaleString()}`,
        abandonedCount: leads.length + 5
      });
    }
  }, []);

  return (
    <Layout activeView={AppView.DASHBOARD} onNavigate={onNavigate} onLogout={onLogout}>
      <div className="space-y-8 animate-in fade-in duration-700 h-full overflow-y-auto custom-scrollbar pr-2">
        
        {/* Header Superior - Automação de Checkout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#03081a] border border-white/10 rounded-[3rem] p-10 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none rotate-12">
               <ShoppingCart size={280} className="text-orange-500" />
            </div>
            <div className="relative z-10">
               <div className="flex items-center gap-3 mb-8">
                  <span className="bg-orange-600/20 text-orange-500 text-[10px] font-black uppercase tracking-[0.3em] px-4 py-2 rounded-full border border-orange-500/20 shadow-lg shadow-orange-600/10">Engine v3.1 Neural Active</span>
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
               </div>
               <h1 className="text-5xl font-black text-white tracking-tighter mb-6 italic leading-[0.9] uppercase">Recuperação de <br /><span className="text-orange-500">Checkout Inteligente</span>.</h1>
               <p className="text-slate-500 text-sm max-w-lg font-medium leading-relaxed mb-10 uppercase tracking-widest">Sua automação WayFlow está processando logs de abandono em tempo real. Cada lead é abordado com gatilhos mentais personalizados.</p>
               
               <div className="flex flex-wrap gap-4">
                  <button onClick={() => onNavigate(AppView.CHAT_MANAGER)} className="px-10 py-5 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl shadow-orange-600/30 transition-all flex items-center gap-4 active:scale-95">
                     Gerenciar Recuperações <ArrowRight size={20} />
                  </button>
                  <button onClick={() => onNavigate(AppView.CONNECTIONS)} className="px-8 py-5 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] hover:bg-white/10 transition-all">
                     Ver Nodes API
                  </button>
               </div>
            </div>
          </div>

          <div className="bg-[#020617] border border-white/10 rounded-[3rem] p-8 flex flex-col justify-center space-y-8 shadow-2xl relative overflow-hidden">
             <div className="absolute top-[-20%] right-[-20%] w-40 h-40 bg-orange-600/10 blur-[80px] rounded-full" />
             <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-orange-500 shadow-inner"><Activity size={24} /></div>
                <div>
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Health Status</p>
                   <p className="text-sm font-black text-white italic uppercase tracking-tight">WayFlow Cloud 01</p>
                </div>
             </div>
             
             <div className="space-y-4">
                <div className="flex justify-between items-center">
                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Atividade de Webhooks</span>
                   <span className="text-xs font-black text-white">Alta</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                   <div className="h-full bg-orange-600 w-[85%] shadow-[0_0_10px_#ea580c]" />
                </div>
                <div className="flex justify-between items-center pt-2">
                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sucesso de Disparo</span>
                   <span className="text-xs font-black text-emerald-500 tracking-widest">98.4%</span>
                </div>
             </div>
          </div>
        </div>

        {/* Estatísticas e Logs */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
           <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard label="Valor Recuperado" val={stats.recovered} icon={DollarSign} color="text-orange-500" />
              <StatCard label="Carrinhos Salvos" val={stats.leads.toString()} icon={ShoppingCart} color="text-purple-500" />
              <StatCard label="Leads Ativos" val={stats.abandonedCount.toString()} icon={Users} color="text-blue-500" />
           </div>

           <div className="lg:col-span-4 bg-[#03081a] border border-white/10 rounded-3xl p-8 shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                 <Terminal size={18} className="text-orange-500" />
                 <h4 className="text-[11px] font-black text-white uppercase tracking-widest italic">Live Recovery Feed</h4>
              </div>
              <div className="space-y-4 max-h-[160px] overflow-y-auto custom-scrollbar">
                 {logs.map((log, i) => (
                   <div key={i} className="flex gap-4 group">
                      <span className="text-[9px] font-mono text-slate-700 mt-1">{log.t}</span>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-white transition-colors leading-tight">{log.m}</p>
                   </div>
                 ))}
              </div>
              <div className="mt-8 pt-6 border-t border-white/5">
                 <button onClick={() => onNavigate(AppView.CHAT_MANAGER)} className="w-full py-4 bg-white/5 rounded-2xl text-[9px] font-black text-slate-400 uppercase tracking-widest border border-white/5 hover:text-white hover:bg-white/10 transition-all">Abrir Debug Central</button>
              </div>
           </div>
        </div>

        <div className="bg-white/[0.01] border border-dashed border-white/10 p-10 rounded-[3rem] text-center">
           <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.6em]">WAYFLOW NEURAL CORE • OPTIMIZED FOR CHECKOUT RECOVERY • v3.1</p>
        </div>
      </div>
    </Layout>
  );
};

const StatCard: React.FC<{ label: string, val: string, icon: any, color: string }> = ({ label, val, icon: Icon, color }) => (
  <div className="bg-[#03081a] border border-white/10 p-8 rounded-[2rem] shadow-2xl relative overflow-hidden group hover:border-white/20 transition-all">
     <div className="absolute top-[-20%] right-[-20%] w-20 h-20 bg-white/5 blur-3xl rounded-full group-hover:bg-orange-600/10 transition-all" />
     <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-6">{label}</p>
     <div className="flex items-end justify-between relative z-10">
        <h3 className="text-3xl font-black text-white tracking-tighter italic leading-none">{val}</h3>
        <div className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center ${color} border border-white/5`}>
           <Icon size={24} />
        </div>
     </div>
  </div>
);

export default Dashboard;
