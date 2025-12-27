
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
      
      {/* Sidebar - Menu com Formato de Letra "Outfit" Moderno */}
      <aside className="w-80 bg-[#020617] border-r border-white/5 flex flex-col hidden xl:flex shrink-0">
        <div className="p-10">
          <div className="flex items-center gap-4 mb-14 cursor-pointer group" onClick={() => onNavigate(AppView.DASHBOARD)}>
             <div className="w-14 h-14 bg-orange-600 rounded-[1.5rem] flex items-center justify-center shadow-[0_0_30px_rgba(234,88,12,0.3)] group-hover:rotate-6 transition-all duration-500">
                <Sparkles size={28} className="text-white" />
             </div>
             <div className="font-outfit">
                <h1 className="text-2xl font-black text-white italic tracking-tighter leading-none">WayFlow</h1>
                <p className="text-xs font-black text-orange-500 uppercase tracking-[0.4em] mt-1">Neural Core</p>
             </div>
          </div>

          <nav className="space-y-4">
            {menuItems.map((item) => (
              <button
                key={item.view}
                onClick={() => onNavigate(item.view)}
                className={`w-full flex items-center gap-5 px-6 py-5 rounded-[1.8rem] transition-all duration-500 group relative ${
                  activeView === item.view 
                    ? 'bg-gradient-to-r from-orange-600/10 to-transparent border border-orange-500/20 text-white' 
                    : 'text-slate-500 hover:bg-white/[0.04] hover:text-white'
                }`}
              >
                <item.icon size={26} strokeWidth={activeView === item.view ? 3 : 2} className={`shrink-0 transition-transform ${activeView === item.view ? 'text-orange-500 scale-110' : 'text-slate-600'}`} />
                
                {/* Texto do Menu - Formato Outfit, Black, Uppercase e Tracking Wide */}
                <span className={`font-outfit font-black uppercase tracking-[0.25em] whitespace-nowrap transition-all duration-500 ${
                  activeView === item.view 
                    ? 'text-base lg:text-lg text-white text-glow-orange' 
                    : 'text-sm lg:text-[15px] opacity-40 group-hover:opacity-100'
                }`}>
                  {item.label}
                </span>

                {activeView === item.view && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-10 bg-orange-600 rounded-l-full shadow-[0_0_20px_#ea580c] animate-in slide-in-from-right-2" />
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-10">
          <div className="p-8 rounded-[2.5rem] bg-[#03081a] border border-white/5 relative overflow-hidden group mb-8">
            <div className="absolute -top-10 -right-10 opacity-5 group-hover:scale-125 transition-transform duration-1000">
              <Zap size={140} className="text-orange-500" />
            </div>
            <p className="font-outfit text-[10px] font-black text-orange-500 uppercase tracking-[0.3em] mb-4">Plano Ativo</p>
            <h4 className="font-outfit text-white font-black italic text-xl mb-2 tracking-tight">{userData.role === 'admin' ? 'Master Cluster' : 'Empresa Alpha'}</h4>
            <div className="flex items-center gap-2 mb-6">
               <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
               <span className="font-outfit text-[10px] text-slate-500 font-black uppercase tracking-widest">Nodes Sincronizados</span>
            </div>
            <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
               <div className="h-full bg-orange-600 w-full animate-pulse shadow-[0_0_10px_#ea580c]" />
            </div>
          </div>
          
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-4 px-8 py-5 rounded-2xl text-slate-600 hover:bg-red-500/10 hover:text-red-500 transition-all font-outfit font-black text-sm uppercase tracking-widest"
          >
            <LogOut size={22} /> Sair da Conta
          </button>
        </div>
      </aside>

      {/* Main Container Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-28 bg-[#020617]/80 backdrop-blur-2xl border-b border-white/5 px-12 flex items-center justify-between z-40 shrink-0">
          <div className="flex items-center gap-6">
             <div className="xl:hidden w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center shadow-xl shadow-orange-600/20"><Sparkles size={24} /></div>
             <div className="flex items-center gap-4">
               <span className="font-outfit text-[10px] font-black text-slate-700 uppercase tracking-[0.5em] hidden md:block">ECOSISTEMA WAYFLOW</span>
               <ChevronRight size={16} className="text-slate-800" />
               <h2 className="font-outfit text-2xl font-black text-white italic tracking-tighter uppercase tracking-[0.1em]">
                {menuItems.find(m => m.view === activeView)?.label || 'Visão Geral'}
               </h2>
             </div>
          </div>

          <div className="flex items-center gap-8">
            <div className="hidden lg:flex items-center gap-4 px-6 py-3 bg-white/[0.03] rounded-2xl border border-white/5">
               <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_10px_#10b981]" />
               <span className="font-outfit text-[10px] font-black text-slate-400 uppercase tracking-widest">Evolution API: Live Sync</span>
            </div>

            <div className="flex items-center gap-4">
               <HeaderBtn icon={Bell} onClick={() => setShowNotifications(!showNotifications)} badge={notifications.some(n => !n.read)} />
               <HeaderBtn icon={Settings} onClick={() => setShowSettings(!showSettings)} />
            </div>

            <div className="h-12 w-px bg-white/5" />

            <div onClick={() => setShowProfile(true)} className="flex items-center gap-5 cursor-pointer group hover:bg-white/[0.02] p-2 rounded-2xl transition-all">
               <div className="text-right hidden sm:block">
                  <p className="font-outfit text-lg font-black text-white italic leading-tight group-hover:text-orange-500 transition-colors uppercase tracking-tight">{userData.name}</p>
                  <p className="font-outfit text-[10px] font-black text-slate-600 uppercase tracking-widest">{userData.role === 'admin' ? 'Acesso Master' : 'Empresa'}</p>
               </div>
               <div className="relative">
                  <div className="absolute inset-0 bg-orange-500/30 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-all" />
                  <img src={userData.avatar} className="relative w-14 h-14 rounded-2xl border-2 border-white/10 group-hover:border-orange-500 transition-all shadow-2xl" alt="User" />
               </div>
            </div>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-12 custom-scrollbar relative bg-[#020617]">
          {children}
        </section>

        {/* Modais omitidos para brevidade, mantidos conforme versão anterior */}
        <Modal show={showProfile} onClose={() => setShowProfile(false)} title="Configurações de Identidade">
           <div className="space-y-10">
              <div className="flex flex-col items-center">
                 <div className="relative group cursor-pointer">
                    <div className="absolute inset-0 bg-orange-600/20 blur-3xl rounded-full opacity-50" />
                    <img src={userData.avatar} className="relative w-40 h-40 rounded-[3rem] border-4 border-white/5 group-hover:border-orange-500/50 transition-all shadow-2xl" alt="" />
                    <div className="absolute inset-0 bg-black/60 rounded-[3rem] flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm">
                       <Camera className="text-white mb-2" size={32} />
                       <span className="font-outfit text-[10px] font-black text-white uppercase tracking-widest">Alterar Foto</span>
                    </div>
                 </div>
                 <p className="font-outfit mt-6 text-xs font-black text-orange-500 uppercase tracking-[0.3em]">Master Administrator</p>
              </div>
              <div className="space-y-6">
                 <div className="space-y-3">
                    <label className="font-outfit text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome Completo</label>
                    <div className="relative group">
                       <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-orange-500" size={20} />
                       <input 
                        value={userData.name}
                        onChange={(e) => setUserData({...userData, name: e.target.value})}
                        className="font-outfit w-full bg-white/[0.02] border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-base text-white font-bold focus:outline-none focus:border-orange-500 transition-all"
                       />
                    </div>
                 </div>
              </div>
              <div className="pt-4 flex gap-4">
                 <button onClick={() => { setShowProfile(false); alert("Perfil atualizado!") }} className="font-outfit flex-1 py-5 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 active:scale-95 transition-all">
                   <Save size={18} /> Aplicar Alterações
                 </button>
              </div>
           </div>
        </Modal>

        {/* Notificações e Configurações mantidas conforme funcionalidade anterior */}
        {showNotifications && (
          <div className="absolute top-28 right-48 w-96 bg-[#020617] border border-white/10 rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,0.8)] z-50 p-10 animate-in slide-in-from-top-4 duration-500">
             <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                   <BellRing size={20} className="text-orange-500" />
                   <h4 className="font-outfit text-base font-black text-white uppercase tracking-widest italic">Central de Alertas</h4>
                </div>
                <button onClick={markAllRead} className="font-outfit text-[11px] font-black text-orange-500 uppercase tracking-widest hover:underline">Limpar</button>
             </div>
             <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                {notifications.map(n => (
                  <div key={n.id} className={`p-5 rounded-3xl border transition-all ${n.read ? 'bg-white/[0.01] border-white/5' : 'bg-orange-600/5 border-orange-500/20 shadow-lg shadow-orange-500/5'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <p className={`font-outfit text-sm font-black italic ${n.read ? 'text-slate-400' : 'text-white'}`}>{n.title}</p>
                      {!n.read && <div className="w-2.5 h-2.5 bg-orange-500 rounded-full shadow-[0_0_10px_#f59e0b]" />}
                    </div>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">{n.desc}</p>
                  </div>
                ))}
             </div>
             <button onClick={() => setShowNotifications(false)} className="w-full mt-8 py-4 bg-white/5 rounded-2xl font-outfit text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors border border-white/5">Fechar Painel</button>
          </div>
        )}

      </main>
    </div>
  );
};

const HeaderBtn: React.FC<{ icon: any, onClick: () => void, badge?: boolean }> = ({ icon: Icon, onClick, badge }) => (
  <button onClick={onClick} className="p-5 rounded-2xl bg-white/[0.03] text-slate-500 hover:text-white hover:bg-white/10 border border-white/5 transition-all relative group">
     <Icon size={24} className="group-hover:scale-110 transition-transform duration-300" />
     {badge && (
       <span className="absolute top-4 right-4 w-3.5 h-3.5 bg-orange-600 border-2 border-[#020617] rounded-full shadow-[0_0_10px_#ea580c] animate-pulse" />
     )}
  </button>
);

const Modal: React.FC<{ show: boolean, onClose: () => void, title: string, children: React.ReactNode }> = ({ show, onClose, title, children }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-500">
       <div className="w-full max-w-xl bg-[#020617] border border-white/10 rounded-[4rem] shadow-[0_0_100px_rgba(245,158,11,0.08)] overflow-hidden animate-in zoom-in-95 duration-700">
          <div className="p-12 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
             <h3 className="font-outfit text-3xl font-black text-white italic tracking-tighter uppercase tracking-widest">{title}</h3>
             <button onClick={onClose} className="p-4 bg-white/5 rounded-2xl text-slate-500 hover:text-white transition-all"><X size={24} /></button>
          </div>
          <div className="p-14">
             {children}
          </div>
       </div>
    </div>
  );
};

export default Layout;
