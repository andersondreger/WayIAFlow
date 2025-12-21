
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  TrendingUp, Users, MessageCircle, Activity, Smartphone, Webhook
} from 'lucide-react';
import Layout from '../components/Layout.tsx';
import { AppView } from '../types.ts';

const data = [
  { name: 'Seg', v: 4200 }, { name: 'Ter', v: 5100 }, { name: 'Qua', v: 3800 },
  { name: 'Qui', v: 6400 }, { name: 'Sex', v: 7200 }, { name: 'Sáb', v: 4900 }, { name: 'Dom', v: 5500 },
];

const ConnectionModule: React.FC<{ title: string, icon: any, status: 'on' | 'off', type: string }> = ({ title, icon: Icon, status, type }) => (
  <div className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl group hover:border-orange-500/30 transition-all">
    <div className="flex items-center justify-between mb-4">
      <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-orange-500 transition-colors">
        <Icon size={20} />
      </div>
      <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${status === 'on' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
        {status === 'on' ? 'Conectado' : 'Offline'}
      </div>
    </div>
    <h4 className="text-white font-bold text-sm mb-1">{title}</h4>
    <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest mb-4">{type}</p>
    <button className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-slate-300 transition-all border border-white/5">Configurar API</button>
  </div>
);

const Dashboard: React.FC<{ onLogout: () => void, onNavigate: (v: AppView) => void, trialRemaining?: number }> = ({ onLogout, onNavigate, trialRemaining = 15 }) => {
  return (
    <Layout activeView={AppView.DASHBOARD} onNavigate={onNavigate} onLogout={onLogout}>
      <div className="space-y-10">
        {trialRemaining > 0 && (
          <div className="bg-gradient-to-r from-orange-600 to-red-600 p-4 rounded-2xl flex items-center justify-between shadow-xl shadow-orange-600/10">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white"><Activity size={20} /></div>
              <div>
                <p className="text-white font-black text-sm">Você está em período de demonstração Alpha</p>
                <p className="text-orange-100 text-xs font-medium">Restam <span className="font-black underline">{trialRemaining} dias</span> de acesso gratuito ilimitado.</p>
              </div>
            </div>
            <button onClick={() => onNavigate(AppView.CHECKOUT)} className="px-6 py-2 bg-white text-orange-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all">Assinar Agora</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-8">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-8 bg-slate-900/40 border border-white/5 rounded-[2.5rem]">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Receita Recuperada</p>
                   <h3 className="text-3xl font-black text-white">R$ 12.420</h3>
                </div>
                <div className="p-8 bg-slate-900/40 border border-white/5 rounded-[2.5rem]">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Taxa de Conversão</p>
                   <h3 className="text-3xl font-black text-emerald-500">24.2%</h3>
                </div>
                <div className="p-8 bg-slate-900/40 border border-white/5 rounded-[2.5rem]">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Leads Ativos</p>
                   <h3 className="text-3xl font-black text-purple-500">842</h3>
                </div>
             </div>

             <div className="bg-[#020617] border border-white/5 rounded-[2.5rem] p-10 h-[400px]">
                <div className="flex items-center justify-between mb-8">
                   <h3 className="text-xl font-black text-white tracking-tight">Fluxo Neural de Atendimento</h3>
                   <TrendingUp size={18} className="text-orange-500" />
                </div>
                <ResponsiveContainer width="100%" height="85%">
                  <AreaChart data={data}>
                    <defs>
                      <linearGradient id="colorV" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="v" stroke="#f59e0b" strokeWidth={4} fill="url(#colorV)" />
                  </AreaChart>
                </ResponsiveContainer>
             </div>
          </div>

          <div className="space-y-6">
             <div className="p-8 bg-[#020617] border border-white/5 rounded-[2.5rem]">
                <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] mb-8">Conexões Críticas</h3>
                <div className="space-y-4">
                   <ConnectionModule title="Evolution API" icon={Smartphone} status="on" type="WhatsApp Master" />
                   <ConnectionModule title="n8n Workflows" icon={Webhook} status="on" type="Automação Checkout" />
                   <ConnectionModule title="IA Neural Core" icon={Activity} status="off" type="Agente Cognitivo" />
                </div>
             </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
