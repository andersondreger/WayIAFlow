
import React, { useState } from 'react';
import { 
  LayoutDashboard, MessageSquare, Bot, Unplug, Users, LogOut, Bell, 
  Settings, ChevronRight, X, User, Shield, Key, Camera, Sparkles, Zap, Trash2, Save,
  CheckCircle2, BellRing, Smartphone, Webhook, Monitor, Database
} from 'lucide-react';
import { AppView } from '../types.ts';

interface LayoutProps {
  children: React.ReactNode;
  activeView: AppView;
  onNavigate: (view: AppView) => void;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeView, onNavigate, onLogout }) => {
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const [userData, setUserData] = useState({
    name: "Mestre Adm",
    email: "adm@wayflow.ia",
    role: "admin",
    avatar: "https://picsum.photos/seed/wayflow_admin/200/200"
  });

  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Recuperação Ativa', desc: 'A IA recuperou um carrinho de R$ 890,00 agora.', type: 'success', read: false },
    { id: 2, title: 'Atualização n8n', desc: 'Workflow de contingência atualizado para v4.1.', type: 'info', read: true },
  ]);

  const menuItems = [
    { view: AppView.DASHBOARD, label: 'Painel Central', icon: LayoutDashboard },
    { view: AppView.CHAT_MANAGER, label: 'Atendimento', icon: MessageSquare },
    { view: AppView.AGENT_BUILDER, label: 'WayIA Builder', icon: Bot },
    { view: AppView.CONNECTIONS, label: 'Integrações', icon: Unplug },
  ];

  if (userData.role === 'admin') {
    menuItems.push({ view: AppView.ADMIN, label: 'Gestão Admin', icon: Users });
  }

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  return (
    <div className="flex h-screen bg-[#020617] overflow-hidden selection:bg-orange-500/20">
      
      {/* Sidebar Compacta */}
      <aside className="w-64 bg-[#020617] border-r border-white/5 flex flex-col hidden xl:flex shrink-0">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-10 cursor-pointer group" onClick={() => onNavigate(AppView.DASHBOARD)}>
             <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg group-hover:rotate-6 transition-all">
                <Sparkles size={20} className="text-white" />
             </div>
             <div className="font-outfit">
                <h1 className="text-lg font-black text-white italic tracking-tighter leading-none">WayFlow</h1>
                <p className="text-[8px] font-black text-orange-500 uppercase tracking-[0.3em] mt-0.5">Neural Core</p>
             </div>
          </div>

          <nav className="space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.view}
                onClick={() => onNavigate(item.view)}
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group relative ${
                  activeView === item.view 
                    ? 'bg-orange-600/10 border border-orange-500/10 text-white' 
                    : 'text-slate-500 hover:bg-white/[0.04] hover:text-white'
                }`}
              >
                <item.icon size={20} strokeWidth={activeView === item.view ? 3 : 2} className={activeView === item.view ? 'text-orange-500' : 'text-slate-600'} />
                <span className={`font-outfit font-black uppercase tracking-[0.15em] text-[11px] whitespace-nowrap ${
                  activeView === item.view ? 'text-glow-orange' : 'opacity-60'
                }`}>
                  {item.label}
                </span>
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-6">
          <div className="p-5 rounded-3xl bg-[#03081a] border border-white/5 relative overflow-hidden mb-4">
            <p className="font-outfit text-[8px] font-black text-orange-500 uppercase tracking-[0.2em] mb-2">Plano Ativo</p>
            <h4 className="font-outfit text-white font-black italic text-sm mb-3 tracking-tight">{userData.role === 'admin' ? 'Master Cluster' : 'Empresa Alpha'}</h4>
            <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
               <div className="h-full bg-orange-600 w-full shadow-[0_0_10px_#ea580c]" />
            </div>
          </div>
          
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-red-500/10 hover:text-red-500 transition-all font-outfit font-black text-[10px] uppercase tracking-widest"
          >
            <LogOut size={16} /> Sair da Conta
          </button>
        </div>
      </aside>

      {/* Main Container Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-20 bg-[#020617]/80 backdrop-blur-2xl border-b border-white/5 px-8 flex items-center justify-between z-40 shrink-0">
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-3">
               <span className="font-outfit text-[9px] font-black text-slate-700 uppercase tracking-[0.3em] hidden md:block">WAYFLOW SYSTEM</span>
               <ChevronRight size={14} className="text-slate-800" />
               <h2 className="font-outfit text-lg font-black text-white italic tracking-tighter uppercase">
                {menuItems.find(m => m.view === activeView)?.label || 'Visão Geral'}
               </h2>
             </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-white/[0.03] rounded-xl border border-white/5">
               <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_#10b981]" />
               <span className="font-outfit text-[9px] font-black text-slate-400 uppercase tracking-widest">LIVE SYNC ACTIVE</span>
            </div>

            <div className="flex items-center gap-3">
               <HeaderBtn icon={Bell} onClick={() => setShowNotifications(!showNotifications)} badge={notifications.some(n => !n.read)} />
               <HeaderBtn icon={Settings} onClick={() => setShowSettings(!showSettings)} />
            </div>

            <div className="h-10 w-px bg-white/5" />

            <div onClick={() => setShowProfile(true)} className="flex items-center gap-3 cursor-pointer group hover:bg-white/[0.02] p-1.5 rounded-xl transition-all">
               <div className="text-right hidden sm:block">
                  <p className="font-outfit text-sm font-black text-white italic leading-tight uppercase">{userData.name}</p>
                  <p className="font-outfit text-[8px] font-black text-slate-600 uppercase tracking-widest">Admin</p>
               </div>
               <img src={userData.avatar} className="w-10 h-10 rounded-xl border border-white/10 group-hover:border-orange-500 transition-all" alt="User" />
            </div>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-8 custom-scrollbar relative bg-[#020617]">
          {children}
        </section>

        {showNotifications && (
          <div className="absolute top-20 right-20 w-80 bg-[#020617] border border-white/10 rounded-3xl shadow-2xl z-50 p-6 animate-in slide-in-from-top-2 duration-300">
             <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                   <BellRing size={16} className="text-orange-500" />
                   <h4 className="font-outfit text-xs font-black text-white uppercase tracking-widest italic">Alertas</h4>
                </div>
                <button onClick={markAllRead} className="font-outfit text-[9px] font-black text-orange-500 uppercase tracking-widest">Limpar</button>
             </div>
             <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
                {notifications.map(n => (
                  <div key={n.id} className={`p-4 rounded-2xl border transition-all ${n.read ? 'bg-white/[0.01] border-white/5' : 'bg-orange-600/5 border-orange-500/10'}`}>
                    <p className={`font-outfit text-xs font-black italic mb-1 ${n.read ? 'text-slate-400' : 'text-white'}`}>{n.title}</p>
                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed">{n.desc}</p>
                  </div>
                ))}
             </div>
          </div>
        )}
      </main>
    </div>
  );
};

const HeaderBtn: React.FC<{ icon: any, onClick: () => void, badge?: boolean }> = ({ icon: Icon, onClick, badge }) => (
  <button onClick={onClick} className="p-3.5 rounded-xl bg-white/[0.03] text-slate-500 hover:text-white hover:bg-white/10 border border-white/5 transition-all relative">
     <Icon size={18} />
     {badge && (
       <span className="absolute top-3 right-3 w-2 h-2 bg-orange-600 border border-[#020617] rounded-full animate-pulse" />
     )}
  </button>
);

export default Layout;
