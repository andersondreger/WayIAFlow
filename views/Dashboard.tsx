
import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Users, MessageCircle, Activity, Smartphone, Webhook, 
  CheckCircle2, Circle, ArrowRight, Zap, Database, Shield, Terminal, Cpu, Sparkles, DollarSign, Ban
} from 'lucide-react';
import Layout from '../components/Layout.tsx';
import { AppView } from '../types.ts';

const Dashboard: React.FC<{ onLogout: () => void, onNavigate: (v: AppView) => void }> = ({ onLogout, onNavigate }) => {
  const [stats, setStats] = useState({
    leads: 142,
    chats: 48,
    recovered: "R$ 4.280,00",
    loss_risk: "R$ 1.890,00"
  });

  const [logs] = useState([
    { t: '14:21:05', m: 'Lead Lucas M. arrastado para FECHAMENTO PENDENTE', s: 'success' },
    { t: '14:18:22', m: 'IA Gemini gerou script de recuperação para PIX EXPIRADO', s: 'info' },
    { t: '14:15:10', m: 'Incidente crítico detectado: Cartão Negado (R$ 890,00)', s: 'error' },
    { t: '14:10:05', m: 'Uplink WayFlow v3.1 estável via Evolution API', s: 'success' }
  ]);

  return (
    <Layout activeView={AppView.DASHBOARD} onNavigate={onNavigate} onLogout={onLogout}>
      <div className="space-y-8 animate-in fade-in duration-700 h-full overflow-y-auto custom-scrollbar pr-2">
        
        {/* Painel de Controle de Faturamento */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-gradient-to-br from-[#03081a] to-[#010411] border border-white/10 rounded-[4rem] p-12 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none rotate-12 scale-150">
               <DollarSign size={320} className="text-orange-500" />
            </div>
            <div className="relative z-10">
               <div className="flex items-center gap-4 mb-10">
                  <div className="px-5 py-2.5 bg-orange-600/10 border border-orange-500/20 rounded-full">
                     <span className="text-[11px] font-black text-orange-500 uppercase tracking-[0.4em]">WayFlow Revenue Engine v3.1</span>
                  </div>
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_12px_#10b981]" />
               </div>
               <h1 className="text-6xl font-black text-white tracking-tighter mb-8 italic leading-[0.85] uppercase">Recuperação de <br /><span className="text-orange-500 italic">Checkout Neural</span>.</h1>
               <p className="text-slate-400 text-lg max-w-xl font-medium leading-relaxed mb-12">O núcleo WayFlow está monitorando <span className="text-white font-bold">142 incidentes</span> ativos. Sua taxa de resgate atual está <span className="text-emerald-500 font-bold">12% acima</span> da média do mercado.</p>
               
               <div className="flex flex-wrap gap-6">
                  <button onClick={() => onNavigate(AppView.CHAT_MANAGER)} className="px-12 py-6 bg-orange-600 hover:bg-orange-500 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.4em] shadow-2xl shadow-orange-600/40 transition-all flex items-center gap-5 active:scale-95 group">
                     Abrir Kanban de Vendas <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button onClick={() => onNavigate(AppView.CONNECTIONS)} className="px-10 py-6 bg-white/5 border border-white/10 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.4em] hover:bg-white/10 transition-all">
                     Configurar Webhooks
                  </button>
               </div>
            </div>
          </div>

          <div className="bg-[#020617] border border-white/10 rounded-[4rem] p-10 flex flex-col justify-center space-y-10 shadow-2xl relative overflow-hidden">
             <div className="absolute -top-10 -right-10 w-48 h-48 bg-orange-600/10 blur-[100px] rounded-full" />
             <div className="flex items-center gap-5 border-b border-white/5 pb-8">
                <div className="w-14 h-14 bg-white/5 rounded-3xl flex items-center justify-center text-orange-500 shadow-inner border border-white/5"><Ban size={28} /></div>
                <div>
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-2">Vendas em Risco</p>
                   <p className="text-2xl font-black text-red-500 italic uppercase tracking-tighter leading-none">{stats.loss_risk}</p>
                </div>
             </div>
             
             <div className="space-y-6">
                <div className="flex justify-between items-center">
                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Aproveitamento</span>
                   <span className="text-xs font-black text-emerald-500 tracking-widest">74.2% DE SUCESSO</span>
                </div>
                <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
                   <div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 w-[74%] shadow-[0_0_15px_#10b981]" />
                </div>
                <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest leading-relaxed">Nota: Arraste leads para "Em Recuperação" para disparar automações de script.</p>
             </div>
          </div>
        </div>

        {/* Blocos de Dados em Tempo Real */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard label="Receita Recuperada" val={stats.recovered} icon={TrendingUp} color="text-emerald-500" />
              <StatCard label="Leads Impactados" val={stats.leads.toString()} icon={Users} color="text-purple-500" />
              <StatCard label="Recuperações iA" val={stats.chats.toString()} icon={Sparkles} color="text-orange-500" />
           </div>

           <div className="lg:col-span-4 bg-[#03081a] border border-white/10 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
              <div className="flex items-center gap-4 mb-8">
                 <Terminal size={20} className="text-orange-500" />
                 <h4 className="text-[11px] font-black text-white uppercase tracking-[0.2em] italic">Fluxo de Recuperação</h4>
              </div>
              <div className="space-y-5 max-h-[220px] overflow-y-auto custom-scrollbar">
                 {logs.map((log, i) => (
                   <div key={i} className="flex gap-5 group items-start border-l-2 border-white/5 pl-4 hover:border-orange-500 transition-colors">
                      <span className="text-[9px] font-mono text-slate-700 mt-0.5">{log.t}</span>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-white transition-colors leading-relaxed">{log.m}</p>
                   </div>
                 ))}
              </div>
              <div className="mt-10 pt-8 border-t border-white/5">
                 <button onClick={() => onNavigate(AppView.CHAT_MANAGER)} className="w-full py-5 bg-white/5 rounded-3xl text-[10px] font-black text-slate-400 uppercase tracking-widest border border-white/5 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center gap-3">
                    Monitorar War-Room <Zap size={14} />
                 </button>
              </div>
           </div>
        </div>

        <div className="bg-white/[0.01] border border-dashed border-white/10 p-12 rounded-[4rem] text-center">
           <p className="text-[11px] font-black text-slate-700 uppercase tracking-[0.8em]">WAYFLOW REVENUE CORE • ENGINE V3.1.2025 • GEMINI PRO POWERED</p>
        </div>
      </div>
    </Layout>
  );
};

const StatCard: React.FC<{ label: string, val: string, icon: any, color: string }> = ({ label, val, icon: Icon, color }) => (
  <div className="bg-[#03081a] border border-white/10 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group hover:border-white/20 transition-all">
     <div className="absolute top-[-20%] right-[-20%] w-24 h-24 bg-white/5 blur-3xl rounded-full group-hover:bg-orange-600/10 transition-all" />
     <p className="text-[11px] font-black text-slate-600 uppercase tracking-[0.3em] mb-8 leading-none">{label}</p>
     <div className="flex items-end justify-between relative z-10">
        <h3 className="text-4xl font-black text-white tracking-tighter italic leading-none">{val}</h3>
        <div className={`w-14 h-14 rounded-3xl bg-white/5 flex items-center justify-center ${color} border border-white/10 shadow-inner group-hover:scale-110 transition-transform`}>
           <Icon size={28} />
        </div>
     </div>
  </div>
);

export default Dashboard;
