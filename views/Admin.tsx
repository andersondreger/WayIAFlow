
import React, { useState } from 'react';
import { 
  Users, Search, Filter, MoreVertical, Shield, UserPlus, 
  ArrowUpRight, Trash2, Edit2, Clock, CreditCard, Activity, 
  TrendingUp, Download, CheckCircle2, AlertCircle
} from 'lucide-react';
import Layout from '../components/Layout.tsx';
import { AppView, Client } from '../types.ts';

const Admin: React.FC<{ onLogout: () => void, onNavigate: (v: AppView) => void }> = ({ onLogout, onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const clients: Client[] = [
    { id: '1', name: 'Empresa Alpha Tech', email: 'contato@alpha.com', plan: 'Enterprise Master', status: 'active', lastActive: 'há 2m', remainingDays: 0, totalSpent: 2400 },
    { id: '2', name: 'Loja Vendas Rápidas', email: 'adm@vendas.com', plan: 'Trial 15 Dias', status: 'trial', lastActive: 'há 10m', remainingDays: 8, totalSpent: 0 },
    { id: '3', name: 'Consultoria Prime', email: 'prime@contato.io', plan: 'Professional Monthly', status: 'active', lastActive: 'há 1h', remainingDays: 0, totalSpent: 1200 },
    { id: '4', name: 'StartUp Beta', email: 'beta@startup.com', plan: 'Trial Expirado', status: 'expired', lastActive: 'há 4d', remainingDays: 0, totalSpent: 0 },
  ];

  return (
    <Layout activeView={AppView.ADMIN} onNavigate={onNavigate} onLogout={onLogout}>
      <div className="space-y-10 animate-in fade-in duration-700">
        
        {/* Admin Header Section */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
             <div className="flex items-center gap-2 px-3 py-1 bg-orange-600/10 border border-orange-500/20 rounded-full w-fit">
                <Shield size={12} className="text-orange-500" />
                <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest">Protocolo Master Root Ativo</span>
             </div>
             <h1 className="text-4xl font-black text-white tracking-tighter italic leading-none">Gestão do Ecossistema.</h1>
             <p className="text-slate-500 font-medium">Controle total de licenças, faturamento e saúde dos clusters.</p>
          </div>
          <div className="flex gap-4">
             <button className="px-6 py-4 bg-white/5 text-slate-300 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-white/5 flex items-center gap-2 hover:bg-white/10 transition-all">
                <Download size={16} /> Relatórios Financeiros
             </button>
             <button className="px-8 py-4 bg-orange-600 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl flex items-center gap-2 shadow-2xl shadow-orange-600/30 hover:bg-orange-500 transition-all">
               <UserPlus size={18} /> Nova Licença Master
             </button>
          </div>
        </div>

        {/* Financial Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           <AdminStat label="MRR (Receita Recorrente)" val="R$ 142.8k" icon={TrendingUp} color="text-emerald-500" trend="+12.4%" />
           <AdminStat label="Taxa de Churn" val="2.4%" icon={AlertCircle} color="text-red-500" trend="-0.8%" />
           <AdminStat label="Novos Trials (7d)" val="482" icon={Activity} color="text-orange-500" trend="+24%" />
           <AdminStat label="Usuários Ativos" val="2.8k" icon={Users} color="text-purple-500" trend="+142" />
        </div>

        {/* Client Management Table */}
        <div className="bg-[#020617] border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl relative">
          <div className="p-8 border-b border-white/5 bg-white/[0.01] flex flex-col sm:flex-row items-center justify-between gap-6">
             <div className="relative w-full sm:w-[450px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700" size={18} />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por cliente, e-mail ou tipo de licença..." 
                  className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-orange-500 transition-all placeholder:text-slate-800" 
                />
             </div>
             <div className="flex gap-3">
                <button className="p-4 bg-white/5 text-slate-500 rounded-2xl hover:text-white transition-all border border-white/5"><Filter size={20} /></button>
                <div className="p-4 bg-white/5 text-slate-500 rounded-2xl flex items-center gap-3 px-6">
                   <span className="text-[10px] font-black uppercase tracking-widest">Filtros Ativos: </span>
                   <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Todos os Planos</span>
                </div>
             </div>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full">
              <thead>
                <tr className="text-[10px] font-black text-slate-700 uppercase tracking-[0.3em] border-b border-white/5 bg-white/[0.01]">
                  <th className="px-10 py-8 text-left">Estrutura / Cliente</th>
                  <th className="px-6 py-8 text-left">Licença WayFlow</th>
                  <th className="px-6 py-8 text-left">Status Financeiro</th>
                  <th className="px-6 py-8 text-left">Retenção Tempo</th>
                  <th className="px-6 py-8 text-left">LTV (Valor Total)</th>
                  <th className="px-10 py-8 text-right">Ações de Controle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-10 py-6">
                       <div className="flex items-center gap-5">
                          <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-orange-500 font-black border border-white/10 group-hover:scale-110 transition-transform">
                             {client.name.charAt(0)}
                          </div>
                          <div>
                             <p className="text-sm font-black text-white italic">{client.name}</p>
                             <p className="text-[10px] text-slate-500 font-bold">{client.email}</p>
                          </div>
                       </div>
                    </td>
                    <td className="px-6 py-6">
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-white/5 px-3 py-1 rounded-lg border border-white/5">{client.plan}</span>
                    </td>
                    <td className="px-6 py-6">
                       <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full shadow-[0_0_8px] ${
                             client.status === 'active' ? 'bg-emerald-500 shadow-emerald-500/50' : 
                             client.status === 'trial' ? 'bg-orange-500 shadow-orange-500/50' : 'bg-red-500 shadow-red-500/50'
                          }`} />
                          <span className="text-[10px] font-black uppercase tracking-widest text-white">
                             {client.status === 'active' ? 'Assinatura Ativa' : client.status === 'trial' ? 'Acesso Trial' : 'Bloqueado'}
                          </span>
                       </div>
                    </td>
                    <td className="px-6 py-6">
                       <div className="flex items-center gap-3 text-slate-500 text-[11px] font-black uppercase tracking-widest">
                          <Clock size={16} className="text-slate-700" />
                          {client.status === 'trial' ? `${client.remainingDays} Dias Rest.` : client.status === 'active' ? 'Enterprise UNL.' : 'Expirado'}
                       </div>
                    </td>
                    <td className="px-6 py-6">
                       <p className="text-sm font-black text-emerald-500">R$ {client.totalSpent.toLocaleString()}</p>
                       <p className="text-[9px] text-slate-600 font-black uppercase">Faturamento Direto</p>
                    </td>
                    <td className="px-10 py-6 text-right">
                       <div className="flex items-center justify-end gap-3 opacity-30 group-hover:opacity-100 transition-opacity">
                          <button className="p-3 bg-white/5 text-slate-400 hover:text-white rounded-xl border border-white/5 transition-all"><Edit2 size={16} /></button>
                          <button className="p-3 bg-red-500/10 text-red-500/50 hover:text-red-500 rounded-xl border border-red-500/10 transition-all"><Trash2 size={16} /></button>
                          <button className="p-3 bg-orange-600/10 text-orange-500 rounded-xl border border-orange-500/10 hover:bg-orange-600 hover:text-white transition-all"><ArrowUpRight size={16} /></button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

const AdminStat: React.FC<{ label: string, val: string, icon: any, color: string, trend: string }> = ({ label, val, icon: Icon, color, trend }) => (
  <div className="bg-[#020617] border border-white/5 p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden group">
     <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform"><Icon size={60} /></div>
     <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 leading-none">{label}</p>
     <div className="flex items-end justify-between relative z-10">
        <h3 className="text-4xl font-black text-white tracking-tighter leading-none italic">{val}</h3>
        <div className="text-right">
           <span className={`text-[10px] font-black uppercase tracking-widest ${trend.startsWith('+') ? 'text-emerald-500' : 'text-red-500'}`}>
              {trend}
           </span>
           <p className="text-[8px] text-slate-700 font-black uppercase">Cresc. Mensal</p>
        </div>
     </div>
  </div>
);

export default Admin;
