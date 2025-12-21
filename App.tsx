
import React, { useState, useEffect } from 'react';
import { AppView, UserProfile } from './types.ts';
import Landing from './views/Landing.tsx';
import Login from './views/Login.tsx';
import Checkout from './views/Checkout.tsx';
import Dashboard from './views/Dashboard.tsx';
import ChatManager from './views/ChatManager.tsx';
import AgentBuilder from './views/AgentBuilder.tsx';
import Connections from './views/Connections.tsx';
import Admin from './views/Admin.tsx';
import { supabase } from './services/supabase.ts';
import { X, ChevronRight, Zap, CheckCircle2 } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.LANDING);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showGuide, setShowGuide] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        setIsAuthenticated(true);
        const role = session.user.email === 'adm@wayflow.ia' ? 'admin' : 'user';
        setUserProfile({
          id: session.user.id,
          name: session.user.user_metadata.full_name || 'Usuário Alpha',
          email: session.user.email || '',
          avatar: `https://picsum.photos/seed/${session.user.id}/100/100`,
          role: role as 'admin' | 'user',
          plan: role === 'admin' ? 'Enterprise' : 'Trial'
        });
        if (currentView === AppView.LOGIN || currentView === AppView.LANDING) {
          setCurrentView(AppView.DASHBOARD);
        }
      } else {
        setIsAuthenticated(false);
        setUserProfile(null);
        if (event === 'SIGNED_OUT') setCurrentView(AppView.LANDING);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [currentView]);

  const navigateTo = (view: AppView) => {
    if (view === AppView.ADMIN && userProfile?.role !== 'admin') {
      alert("Acesso restrito ao Administrador Master.");
      return;
    }
    setCurrentView(view);
    window.scrollTo(0, 0);
  };

  if (isLoading) return <div className="min-h-screen bg-[#020617] flex items-center justify-center"><Zap className="text-orange-500 animate-pulse" size={48} /></div>;

  return (
    <div className="min-h-screen relative">
      {/* Guia Interativo WayFlow */}
      {isAuthenticated && showGuide && currentView === AppView.DASHBOARD && (
        <div className="fixed bottom-10 right-10 w-80 bg-[#020617] border border-white/10 rounded-[2.5rem] shadow-2xl z-[100] p-6 animate-in slide-in-from-bottom-10">
          <button onClick={() => setShowGuide(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X size={16} /></button>
          <div className="flex items-center gap-3 mb-6">
             <div className="w-10 h-10 bg-orange-600/20 rounded-xl flex items-center justify-center text-orange-500"><Zap size={20} /></div>
             <div>
                <h4 className="text-sm font-black text-white italic">Guia WayFlow</h4>
                <p className="text-[10px] text-slate-500 uppercase font-black">4 Passos para o Sucesso</p>
             </div>
          </div>
          <div className="space-y-3 mb-6">
             <GuideItem step={1} label="Conectar Evolution API" done={false} />
             <GuideItem step={2} label="Vincular WhatsApp Web" done={false} />
             <GuideItem step={3} label="Criar Agente Neural" done={false} />
             <GuideItem step={4} label="Ativar n8n Portainer" done={false} />
          </div>
          <button onClick={() => navigateTo(AppView.CONNECTIONS)} className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all">Começar Configuração</button>
        </div>
      )}

      {currentView === AppView.LANDING && <Landing onNavigate={navigateTo} />}
      {currentView === AppView.LOGIN && <Login onLoginSuccess={() => navigateTo(AppView.DASHBOARD)} onBack={() => navigateTo(AppView.LANDING)} />}
      {currentView === AppView.CHECKOUT && <Checkout onComplete={() => navigateTo(AppView.DASHBOARD)} onBack={() => navigateTo(AppView.LANDING)} />}
      
      {isAuthenticated && userProfile && (
        <>
          {currentView === AppView.DASHBOARD && <Dashboard onLogout={() => supabase.auth.signOut()} onNavigate={navigateTo} />}
          {currentView === AppView.CHAT_MANAGER && <ChatManager onNavigate={navigateTo} onLogout={() => supabase.auth.signOut()} />}
          {currentView === AppView.AGENT_BUILDER && <AgentBuilder onNavigate={navigateTo} onLogout={() => supabase.auth.signOut()} />}
          {currentView === AppView.CONNECTIONS && <Connections onNavigate={navigateTo} onLogout={() => supabase.auth.signOut()} />}
          {currentView === AppView.ADMIN && <Admin onNavigate={navigateTo} onLogout={() => supabase.auth.signOut()} />}
        </>
      )}
    </div>
  );
};

const GuideItem: React.FC<{ step: number, label: string, done: boolean }> = ({ step, label, done }) => (
  <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${done ? 'bg-emerald-500 text-white' : 'bg-white/5 text-slate-500 border border-white/10'}`}>
      {done ? <CheckCircle2 size={12} /> : step}
    </div>
    <span className={`text-[11px] font-bold ${done ? 'text-slate-400' : 'text-slate-200'} group-hover:text-orange-500 transition-colors`}>{label}</span>
  </div>
);

export default App;
