
import React, { useState } from 'react';
import { 
  LayoutDashboard, MessageSquare, Bot, Unplug, Users, LogOut, Bell, 
  Settings, ChevronRight, X, User, Shield, Key, Camera, Sparkles, Zap, Trash2, Save
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
  
  // Mock de usuário - Na vida real viria do Context/App
  const user = {
    name: "Mestre Adm",
    email: "adm@wayflow.ia",
    role: "admin",
    avatar: "https://picsum.photos/seed/wayflow_admin/100/100"
  };

  const menuItems = [
    { view: AppView.DASHBOARD, label: 'Painel Central', icon: LayoutDashboard },
    { view: AppView.CHAT_MANAGER, label: 'Atendimento', icon: MessageSquare },
    { view: AppView.AGENT_BUILDER, label: 'IA Neural Builder', icon: Bot },
    { view: AppView.CONNECTIONS, label: 'Integrações API', icon: Unplug },
  ];

  // Adiciona o item Admin somente se for admin
  if (user.role === 'admin') {
    menuItems.push({ view: AppView.ADMIN, label: 'Gestão de Clientes', icon: Users });
  }

  return (
    <div className="flex h-screen bg-[#020617] overflow-hidden selection:bg-orange-500/20">
      
      {/* Sidebar Ultra-Premium */}
      <aside className="w-72 bg-[#020617] border-r border-white/5 flex flex-col hidden xl:flex shrink-0">
        <div className="p-10">
          <div className="flex items-center gap-3 mb-12 cursor-pointer group" onClick={() => onNavigate(AppView.DASHBOARD)}>
             <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-orange-600/40 group-hover:scale-110 transition-transform">
                <Sparkles size={24} className="text-white" />
             </div>
             <div>
                <h1 className="text-xl font-black text-white italic tracking-tighter leading-none">WayFlow</h1>
                <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Neural Enterprise</p>
             </div>
          </div>

          <nav className="space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.view}
                onClick={() => onNavigate(item.view)}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-500 group relative ${
                  activeView === item.view 
                    ? 'bg-orange-600 text-white shadow-2xl shadow-orange-600/30' 
                    : 'text-slate-500 hover:bg-white/[0.03] hover:text-white'
                }`}
              >
                <item.icon size={20} strokeWidth={activeView === item.view ? 3 : 2} />
                <span className="font-bold text-sm tracking-tight">{item.label}</span>
                {activeView === item.view && <div className="absolute right-4 w-1.5 h-1.5 bg-white rounded-full" />}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-10 space-y-6">
          <div className="p-6 rounded-3xl bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><Zap size={40} className="text-orange-500" /></div>
            <p className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em] mb-4">Plano Atual</p>
            <h4 className="text-white font-black italic mb-1">{user.role === 'admin' ? 'Master Enterprise' : 'Trial Ativo'}</h4>
            <p className="text-[10px] text-slate-500 font-bold uppercase mb-4">Sincronizado via Evolution</p>
            <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
               <div className="h-full bg-orange-600 w-3/4" />
            </div>
          </div>
          
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-slate-600 hover:bg-red-500/10 hover:text-red-500 transition-all font-bold text-sm"
          >
            <LogOut size={20} /> Encerrar Sessão
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top Header Barra */}
        <header className="h-24 bg-slate-950/40 backdrop-blur-3xl border-b border-white/5 px-10 flex items-center justify-between z-40 shrink-0">
          <div className="flex items-center gap-4">
             <div className="xl:hidden w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center"><Sparkles size={20} /></div>
             <div className="flex items-center gap-3">
               <span className="text-[10px] font-black text-slate-700 uppercase tracking-[0.3em] hidden sm:block">WAYFLOW ENGINE</span>
               <ChevronRight size={14} className="text-slate-800" />
               <span className="text-base font-black text-white italic tracking-tight">{menuItems.find(m => m.view === activeView)?.label}</span>
             </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-white/5 rounded-2xl border border-white/5 group hover:border-emerald-500/20 transition-all cursor-pointer">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Evolution Instância: WayMaster</span>
            </div>

            <div className="flex items-center gap-3">
               <HeaderBtn icon={Bell} onClick={() => setShowNotifications(!showNotifications)} badge />
               <HeaderBtn icon={Settings} onClick={() => setShowSettings(!showSettings)} />
            </div>

            <div className="h-10 w-px bg-white/5" />

            <div onClick={() => setShowProfile(true)} className="flex items-center gap-4 cursor-pointer group hover:bg-white/5 p-2 rounded-2xl transition-all">
               <div className="text-right hidden sm:block">
                  <p className="text-sm font-black text-white italic leading-tight group-hover:text-orange-500 transition-colors">{user.name}</p>
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{user.role}</p>
               </div>
               <div className="relative">
                  <div className="absolute inset-0 bg-orange-500/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                  <img src={user.avatar} className="relative w-12 h-12 rounded-2xl border-2 border-white/10 group-hover:border-orange-500/50 transition-all" alt="User" />
               </div>
            </div>
          </div>
        </header>

        {/* Notificações Drawer */}
        {showNotifications && (
          <div className="absolute top-24 right-40 w-80 bg-[#020617] border border-white/10 rounded-3xl shadow-2xl z-50 p-6 animate-in slide-in-from-top-4">
             <div className="flex justify-between items-center mb-6">
                <h4 className="text-sm font-black text-white uppercase tracking-widest">Notificações</h4>
                <button onClick={() => setShowNotifications(false)} className="text-slate-600"><X size={14}/></button>
             </div>
             <div className="space-y-4">
                <div className="p-3 bg-orange-600/10 border border-orange-500/20 rounded-2xl">
                   <p className="text-[11px] text-white font-bold mb-1">Novo Lead Recuperado!</p>
                   <p className="text-[10px] text-slate-500">Ricardo Santos finalizou o checkout via WhatsApp.</p>
                </div>
                <div className="p-3 bg-white/5 border border-white/5 rounded-2xl">
                   <p className="text-[11px] text-slate-400 font-bold mb-1">Evolution API Sincronizada</p>
                   <p className="text-[10px] text-slate-600">Sua conexão está estável e ativa.</p>
                </div>
             </div>
          </div>
        )}

        <section className="flex-1 overflow-y-auto p-10 custom-scrollbar relative">
          {children}
        </section>

        {/* Modal de Perfil Funcional */}
        <Modal show={showProfile} onClose={() => setShowProfile(false)} title="Configurações de Perfil">
           <div className="space-y-8">
              <div className="flex flex-col items-center">
                 <div className="relative group cursor-pointer">
                    <img src={user.avatar} className="w-32 h-32 rounded-[2.5rem] border-4 border-white/5 group-hover:border-orange-500/50 transition-all" alt="" />
                    <div className="absolute inset-0 bg-black/40 rounded-[2.5rem] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                       <Camera className="text-white" size={24} />
                    </div>
                 </div>
                 <button className="mt-4 text-[10px] font-black text-orange-500 uppercase tracking-widest">Alterar Foto de Avatar</button>
              </div>
              <div className="space-y-4">
                 <Input icon={User} label="Nome Completo" value={user.name} />
                 <Input icon={Shield} label="E-mail de Acesso" value={user.email} disabled />
                 <div className="p-4 bg-orange-600/5 border border-orange-500/10 rounded-2xl">
                    <p className="text-[10px] text-orange-500 font-bold uppercase tracking-widest mb-1">Nível de Acesso</p>
                    <p className="text-xs text-white font-black italic">Acesso Master Enterprise & Gestão Admin</p>
                 </div>
              </div>
              <div className="flex gap-4">
                 <button className="flex-1 py-4 bg-orange-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-orange-600/20">Salvar Alterações</button>
                 <button onClick={() => setShowProfile(false)} className="flex-1 py-4 bg-white/5 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest">Cancelar</button>
              </div>
           </div>
        </Modal>

        {/* Modal de Configurações do Sistema */}
        <Modal show={showSettings} onClose={() => setShowSettings(false)} title="Configurações do Ecossistema">
           <div className="space-y-6">
              <div className="space-y-4">
                 <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Segurança de Dados</h4>
                 <div className="p-5 bg-white/[0.02] border border-white/5 rounded-[2rem] flex items-center justify-between group hover:border-orange-500/30 transition-all">
                    <div className="flex items-center gap-4">
                       <Key size={20} className="text-slate-600 group-hover:text-orange-500" />
                       <div>
                          <p className="text-sm font-bold text-white">Chave Mestra WayFlow</p>
                          <p className="text-[10px] text-slate-500">Última atualização: há 12 dias</p>
                       </div>
                    </div>
                    <button className="text-[10px] font-black text-orange-500 uppercase">Regerar</button>
                 </div>
                 <div className="p-5 bg-white/[0.02] border border-white/5 rounded-[2rem] flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                       <Shield size={20} className="text-slate-600" />
                       <div className="flex-1">
                          <p className="text-sm font-bold text-white">Autenticação de Dois Fatores</p>
                          <p className="text-[10px] text-slate-500">Proteção adicional via e-mail</p>
                       </div>
                    </div>
                    <div className="w-12 h-6 bg-emerald-500/20 rounded-full relative p-1 cursor-pointer">
                       <div className="w-4 h-4 bg-emerald-500 rounded-full absolute right-1" />
                    </div>
                 </div>
              </div>
              <div className="pt-6 border-t border-white/5">
                 <button className="w-full py-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                    <Trash2 size={16} /> Limpar Cache do Sistema
                 </button>
              </div>
           </div>
        </Modal>

      </main>
    </div>
  );
};

const HeaderBtn: React.FC<{ icon: any, onClick: () => void, badge?: boolean }> = ({ icon: Icon, onClick, badge }) => (
  <button onClick={onClick} className="p-3.5 rounded-2xl bg-white/5 text-slate-500 hover:text-white hover:bg-white/10 border border-white/5 transition-all relative group">
     <Icon size={20} className="group-hover:scale-110 transition-transform" />
     {badge && <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-orange-600 border-2 border-[#020617] rounded-full shadow-lg" />}
  </button>
);

const Modal: React.FC<{ show: boolean, onClose: () => void, title: string, children: React.ReactNode }> = ({ show, onClose, title, children }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
       <div className="w-full max-w-lg bg-[#020617] border border-white/10 rounded-[3rem] shadow-[0_0_100px_rgba(245,158,11,0.05)] overflow-hidden animate-in zoom-in-95 duration-500">
          <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
             <h3 className="text-xl font-black text-white italic tracking-tighter">{title}</h3>
             <button onClick={onClose} className="p-2 text-slate-500 hover:text-white"><X size={20} /></button>
          </div>
          <div className="p-10">
             {children}
          </div>
       </div>
    </div>
  );
};

const Input: React.FC<{ icon: any, label: string, value: string, disabled?: boolean }> = ({ icon: Icon, label, value, disabled }) => (
  <div className="space-y-2">
     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{label}</label>
     <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-orange-500">
           <Icon size={18} />
        </div>
        <input 
          disabled={disabled}
          defaultValue={value}
          className="w-full bg-white/[0.02] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-white font-bold focus:outline-none focus:border-orange-500/50 transition-all disabled:opacity-50"
        />
     </div>
  </div>
);

export default Layout;
