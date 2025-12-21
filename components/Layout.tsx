
import React from 'react';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Bot, 
  Unplug, 
  Users, 
  LogOut, 
  Bell, 
  Settings,
  ChevronRight
} from 'lucide-react';
import { AppView } from '../types.ts';

interface LayoutProps {
  children: React.ReactNode;
  activeView: AppView;
  onNavigate: (view: AppView) => void;
  onLogout: () => void;
}

const LOGO_URL = "https://qonrpzlkjhdmswjfxvtu.supabase.co/storage/v1/object/public/WayIAFlow/logo.png";

const Logo: React.FC<{ className?: string }> = ({ className = "h-8" }) => {
  return (
    <div className="flex items-center gap-2 select-none group">
      <img 
        src={LOGO_URL} 
        alt="WayFlow iA Logo" 
        className={`${className} transition-transform duration-500 group-hover:scale-105`} 
        onError={(e) => {
          (e.target as HTMLImageElement).src = 'https://placehold.co/400x120/020617/ffffff?text=WayFlow+iA';
        }} 
      />
    </div>
  );
};

const Layout: React.FC<LayoutProps> = ({ children, activeView, onNavigate, onLogout }) => {
  const menuItems = [
    { view: AppView.DASHBOARD, label: 'Painel Central', icon: LayoutDashboard },
    { view: AppView.CHAT_MANAGER, label: 'Atendimento', icon: MessageSquare },
    { view: AppView.AGENT_BUILDER, label: 'IA Neural Builder', icon: Bot },
    { view: AppView.CONNECTIONS, label: 'Integrações API', icon: Unplug },
    { view: AppView.ADMIN, label: 'Gestão de Clientes', icon: Users },
  ];

  return (
    <div className="flex h-screen bg-slate-950/50 overflow-hidden">
      <aside className="w-64 bg-[#020617] border-r border-white/5 flex flex-col hidden md:flex shrink-0">
        <div className="p-8">
          <div className="flex items-center gap-2 mb-10 cursor-pointer" onClick={() => onNavigate(AppView.DASHBOARD)}>
            <Logo className="h-14 w-auto object-contain" />
          </div>

          <nav className="space-y-1.5">
            {menuItems.map((item) => (
              <button
                key={item.view}
                onClick={() => onNavigate(item.view)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group ${
                  activeView === item.view 
                    ? 'bg-gradient-to-r from-orange-500/10 to-transparent text-orange-400 border border-orange-500/20 shadow-[0_0_20px_rgba(245,158,11,0.05)]' 
                    : 'text-slate-500 hover:bg-white/[0.03] hover:text-white'
                }`}
              >
                <div className={`${activeView === item.view ? 'text-orange-400' : 'text-slate-600 group-hover:text-slate-300'} transition-colors`}>
                  <item.icon size={20} strokeWidth={2} />
                </div>
                <span className="font-semibold text-sm tracking-tight">{item.label}</span>
                {activeView === item.view && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,1)]" />}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-8 space-y-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-600/10 to-red-600/10 border border-orange-500/10">
            <p className="text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-1">Espaço em Nuvem</p>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden mb-2">
              <div className="h-full bg-orange-500 w-[64%]" />
            </div>
            <p className="text-[10px] text-slate-500 font-medium">6.4GB / 10GB Utilizado</p>
          </div>
          
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-all duration-300"
          >
            <LogOut size={20} strokeWidth={2} />
            <span className="font-bold text-sm">Encerrar Sessão</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-600/5 blur-[120px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/2" />
        
        <header className="h-20 bg-slate-950/20 backdrop-blur-2xl border-b border-white/5 px-10 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-3 text-slate-500">
            <span className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-600">WAYFLOW iA</span>
            <ChevronRight size={14} className="opacity-30" />
            <span className="text-sm font-bold text-white tracking-tight">
              {menuItems.find(m => m.view === activeView)?.label}
            </span>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden lg:flex items-center gap-2 bg-white/[0.03] border border-white/5 rounded-full px-4 py-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Evolution API Online</span>
            </div>
            
            <div className="flex items-center gap-2">
              <button className="p-2.5 rounded-xl bg-white/[0.03] text-slate-400 hover:text-white hover:bg-white/[0.08] transition-all relative">
                <Bell size={20} strokeWidth={2} />
                <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-slate-950 shadow-sm" />
              </button>
              <button className="p-2.5 rounded-xl bg-white/[0.03] text-slate-400 hover:text-white hover:bg-white/[0.08] transition-all">
                <Settings size={20} strokeWidth={2} />
              </button>
            </div>
            
            <div className="h-8 w-px bg-white/5" />
            
            <div className="flex items-center gap-4 group cursor-pointer">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black text-white leading-tight">Mestre Adm</p>
                <p className="text-[10px] text-orange-500 font-black uppercase tracking-widest">Enterprise</p>
              </div>
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-br from-orange-500 to-red-600 rounded-full blur opacity-20 group-hover:opacity-40 transition duration-500" />
                <img src="https://picsum.photos/seed/wayflow_admin/100/100" alt="Avatar" className="relative w-11 h-11 rounded-full border-2 border-white/10" />
              </div>
            </div>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-10 custom-scrollbar relative z-0">
          {children}
        </section>
      </main>
    </div>
  );
};

export default Layout;
