
import React from 'react';
import { 
  Users, Search, Filter, MoreVertical, Plus, Shield, UserPlus, 
  ArrowUpRight, Trash2, Edit2, Clock, CreditCard, Activity 
} from 'lucide-react';
import Layout from '../components/Layout.tsx';
import { AppView, Client } from '../types.ts';

const Admin: React.FC<{ onLogout: () => void, onNavigate: (v: AppView) => void }> = ({ onLogout, onNavigate }) => {
  const clients: Client[] = [
    { id: '1', name: 'Empresa Alpha Tech', email: 'contato@alpha.com', plan: 'Enterprise', status: 'active', lastActive: 'há 2m', trialStartDate: '2024-05-10', remainingDays: 0, totalSpent: 2400 },
    { id: '2', name: 'Loja Vendas Rápidas', email: 'adm@vendas.com', plan: 'Free Trial', status: 'trial', lastActive: 'há 10m', trialStartDate: '2024-05-20', remainingDays: 8, totalSpent: 0 },
    { id: '3', name: 'Consultoria Prime', email: 'prime@contato.io', plan: 'Pro', status: 'active', lastActive: 'há 1h', trialStartDate: '2024-04-01', remainingDays: 0, totalSpent: 1200 },
    { id: '4', name: 'StartUp Beta', email: 'beta@startup.com', plan: 'Free Trial', status: 'expired', lastActive: 'há 4d', trialStartDate: '2024-05-01', remainingDays: 0, totalSpent: 0 },
  ];

  return (
    <Layout activeView={AppView.ADMIN} onNavigate={onNavigate} onLogout={onLogout}>
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
             <h1 className="text-4xl font-black text-white tracking-tighter mb-2">Painel de Controle Alpha</h1>
             <p className="text-slate-400 font-medium">Gestão financeira e temporal de todo o ecossistema.</p>
          </div>
          <button className="px-8 py-4 bg-orange-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl flex items-center gap-2 shadow-2xl">
            <UserPlus size={18} /> Cadastrar Licença
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           <div className="p-8 bg-[#020617] border border-white/5 rounded-[2.5rem] flex items-center gap-6">
              <div className="w-14 h-14 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center"><CreditCard size={28} /></div>
              <div>
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Faturamento Mensal</p>
                 <h3 className="text-2xl font-black text-white">R$ 42.800</h3>
              </div>
           </div>
           <div className="p-8 bg-[#020617] border border-white/5 rounded-[2.5rem] flex items-center gap-6">
              <div className="w-14 h-14 bg-orange-500/10 text-orange-500 rounded-2xl flex items-center justify-center"><Activity size={28} /></div>
              <div>
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Trials Ativos</p>
                 <h3 className="text-2xl font-black text-white">124</h3>
              </div>
           </div>
           <div className="p-8 bg-[#020617] border border-white/5 rounded-[2.5rem] flex items-center gap-6">
              <div className="w-14 h-14 bg-purple-500/10 text-purple-500 rounded-2xl flex items-center justify-center"><Users size={28} /></div>
              <div>
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total de Clientes</p>
                 <h3 className="text-2xl font-black text-white">1.242</h3>
              </div>
           </div>
        </div>

        <div className="bg-[#020617] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
          <div className="p-8 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
             <div className="relative w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                <input type="text" placeholder="Buscar cliente ou plano..." className="w-full bg-slate-950 border border-white/5 rounded-xl py-3 pl-12 pr-4 text-xs text-white focus:outline-none focus:border-orange-500 transition-all" />
             </div>
             <button className="p-3 bg-white/5 text-slate-400 rounded-xl hover:text-white transition-all"><Filter size={20} /></button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] border-b border-white/5">
                  <th className="px-10 py-6 text-left">Empresa / Cliente</th>
                  <th className="px-6 py-6 text-left">Plano Atual</th>
                  <th className="px-6 py-6 text-left">Status Fin.</th>
                  <th className="px-6 py-6 text-left">Tempo Restante</th>
                  <th className="px-6 py-6 text-left">Total Pago</th>
                  <th className="px-10 py-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-10 py-5">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-orange-500 font-black">
                             {client.name.charAt(0)}
                          </div>
                          <div>
                             <p className="text-sm font-bold text-white">{client.name}</p>
                             <p className="text-[10px] text-slate-500">{client.email}</p>
                          </div>
                       </div>
                    </td>
                    <td className="px-6 py-5">
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">{client.plan}</span>
                    </td>
                    <td className="px-6 py-5">
                       <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                             client.status === 'active' ? 'bg-emerald-500' : 
                             client.status === 'trial' ? 'bg-orange-500' : 'bg-red-500'
                          }`} />
                          <span className="text-[10px] font-black uppercase tracking-widest text-white">
                             {client.status === 'active' ? 'Assinante' : client.status === 'trial' ? 'Período Trial' : 'Expirado'}
                          </span>
                       </div>
                    </td>
                    <td className="px-6 py-5">
                       <div className="flex items-center gap-2 text-slate-400 text-xs font-bold">
                          <Clock size={14} className="text-orange-500" />
                          {client.status === 'trial' ? `${client.remainingDays} dias` : client.status === 'active' ? 'Permanente' : '0 dias'}
                       </div>
                    </td>
                    <td className="px-6 py-5 text-sm font-black text-white">
                       R$ {client.totalSpent}
                    </td>
                    <td className="px-10 py-5 text-right">
                       <div className="flex items-center justify-end gap-3">
                          <button className="p-2 bg-white/5 text-slate-500 hover:text-white rounded-lg transition-all"><Edit2 size={16} /></button>
                          <button className="p-2 bg-red-500/10 text-red-500/50 hover:text-red-500 rounded-lg transition-all"><Trash2 size={16} /></button>
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

export default Admin;
