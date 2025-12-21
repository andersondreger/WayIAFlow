
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  TrendingUp, Users, MessageCircle, Activity, Smartphone, Webhook, CheckCircle2, Circle, ArrowRight, Zap
} from 'lucide-react';
import Layout from '../components/Layout.tsx';
import { AppView } from '../types.ts';

const data = [
  { name: 'Seg', v: 4200 }, { name: 'Ter', v: 5100 }, { name: 'Qua', v: 3800 },
  { name: 'Qui', v: 6400 }, { name: 'Sex', v: 7200 }, { name: 'Sáb', v: 4900 }, { name: 'Dom', v: 5500 },
];

const ConnectionModule: React.FC<{ title: string, icon: any, status: 'on' | 'off', type: string, onConfig: () => void }> = ({ title, icon: Icon, status, type, onConfig }) => (
  <div className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl group hover:border-orange-500/30 transition-all">
    <div className="flex items-center justify-between mb-4">
      <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-orange-500 transition-colors">
        <Icon size={20} />
      </div>
      <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${status === 'on' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
        {status === 'on' ? 'Conectado' : 'Configuração Pendente'}
      </div>
    </div>
    <h4 className="text-white font-bold text-sm mb-1">{title}</h4>
    <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest mb-4">{type}</p>
    <button onClick={onConfig} className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-slate-300 transition-all border border-white/5 italic">
      {status === 'on' ? 'Gerenciar' : 'Conectar Agora'}
    </button>
  </div>
);

const Dashboard: React.FC<{ onLogout: () => void, onNavigate: (v: AppView) => void, trialRemaining?: number }> = ({ onLogout, onNavigate, trialRemaining = 15 }) => {
  const setupSteps = [
    { label: 'Configurar Credenciais API', done: true },
    { label: 'Sincronizar WhatsApp (Evolution)', done: false },
    { label: 'Criar Primeiro Agente Neural', done: false },
    { label: 'Ativar Webhook n8n', done: false },
  ];

  const progress = (setupSteps.filter(s => s.done).length / setupSteps.length) * 100;

  return (
    <Layout activeView={AppView.DASHBOARD} onNavigate={onNavigate} onLogout={onLogout}>
      <div className="space-y-10">
        {/* Onboarding Widget */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 to-[#020617] border border-white/10 rounded-[2.5rem] p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform">
              {/* Fix: Added Zap to imports to resolve 'Cannot find name Zap' */}
              <Zap size={180} className="text-orange-500" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <span className="px-3 py-1 bg-orange-600/20 text-orange-500 text-[10px] font-black uppercase tracking-widest rounded-full border border-orange-500/20">Setup Inicial</span>
                <span className="text-slate-500 text-xs font-bold">{Math.round(progress)}% Concluído</span>
              </div>
              <h2 className="text-3xl font-black text-white mb-6 tracking-tighter italic">Bem-vindo à WayFlow iA. <br /> Vamos ativar sua operação?</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {setupSteps.map((step, i) => (
                  <div key={i} className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
                    {step.done ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Circle size={16} className="text-slate-700" />}
                    <span className={`text-xs font-bold ${step.done ? 'text-slate-300' : 'text-slate-600'}`}>{step.label}</span>
                  </div>
                ))}
              </div>
              
              <button onClick={() => onNavigate(AppView.CONNECTIONS)} className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-orange-600/20">
                Continuar Configuração <ArrowRight size={16} />
              </button>
            </div>
          </div>

          <div className="bg-[#020617] border border-white/5 rounded-[2.5rem] p-8 flex flex-col justify-center">
             <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-orange-600/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-orange-500/10">
                  <Activity size={32} className="text-orange-500" />
                </div>
                <h3 className="text-white font-black text-lg">Status Neural</h3>
                <p className="text-slate-500 text-xs font-medium px-4 leading-relaxed">Sua IA está aguardando conexões de API para iniciar o processamento de leads.</p>
                <div className="pt-4">
                   <span className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-full border border-red-500/10 animate-pulse">
                      Aguardando Evolution API
                   </span>
                </div>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-8">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-8 bg-slate-900/40 border border-white/5 rounded-[2.5rem] group hover:border-orange-500/20 transition-all">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Receita Recuperada</p>
                   <h3 className="text-3xl font-black text-white group-hover:text-orange-500 transition-colors">R$ 0,00</h3>
                </div>
                <div className="p-8 bg-slate-900/40 border border-white/5 rounded-[2.5rem]">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Taxa de Conversão</p>
                   <h3 className="text-3xl font-black text-slate-700">0.0%</h3>
                </div>
                <div className="p-8 bg-slate-900/40 border border-white/5 rounded-[2.5rem]">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Leads Ativos</p>
                   <h3 className="text-3xl font-black text-slate-700">0</h3>
                </div>
             </div>

             <div className="bg-[#020617] border border-white/5 rounded-[2.5rem] p-10 h-[400px]">
                <div className="flex items-center justify-between mb-8">
                   <h3 className="text-xl font-black text-white tracking-tight">Atividade em Tempo Real</h3>
                   <TrendingUp size={18} className="text-slate-800" />
                </div>
                <div className="h-full flex items-center justify-center border-2 border-dashed border-white/5 rounded-3xl">
                   <p className="text-slate-700 font-black text-[10px] uppercase tracking-[0.3em]">Nenhum dado para exibir ainda</p>
                </div>
             </div>
          </div>

          <div className="space-y-6">
             <div className="p-8 bg-[#020617] border border-white/5 rounded-[2.5rem]">
                <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] mb-8">Conexões Críticas</h3>
                <div className="space-y-4">
                   <ConnectionModule onConfig={() => onNavigate(AppView.CONNECTIONS)} title="Evolution API" icon={Smartphone} status="off" type="WhatsApp Master" />
                   <ConnectionModule onConfig={() => onNavigate(AppView.CONNECTIONS)} title="n8n Workflows" icon={Webhook} status="off" type="Automação Checkout" />
                   <ConnectionModule onConfig={() => onNavigate(AppView.AGENT_BUILDER)} title="IA Neural Core" icon={Activity} status="off" type="Agente Cognitivo" />
                </div>
             </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
