
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
import { X, ChevronRight, Zap, CheckCircle2, Info, Minimize2, Maximize2, Sparkles } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.LANDING);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showGuide, setShowGuide] = useState(true);
  const [isGuideMinimized, setIsGuideMinimized] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        setIsAuthenticated(true);
        const role = session.user.email === 'adm@wayflow.ia' ? 'admin' : 'user';
        setUserProfile({
          id: session.user.id,
          name: session.user.user_metadata.full_name || 'Usuário WayFlow',
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
      alert("Acesso restrito ao Painel Master Admin.");
      return;
    }
    setCurrentView(view);
    window.scrollTo(0, 0);
  };

  if (isLoading) return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center gap-6">
      <div className="relative">
        <div className="absolute inset-0 bg-orange-600/30 blur-3xl animate-pulse" />
        <Sparkles className="text-orange-500 relative z-10 animate-spin-slow" size={64} />
      </div>
      <p className="text-xs font-black text-slate-500 uppercase tracking-[0.5em] animate-pulse">Sincronizando Rede Neural...</p>
    </div>
  );

  return (
    <div className="min-h-screen relative bg-[#020617]">
      {/* Guia Interativo WayFlow Compacto */}
      {isAuthenticated && showGuide && currentView !== AppView.ADMIN && (
        <div className={`fixed bottom-6 right-6 z-[100] transition-all duration-500 ease-out ${
          isGuideMinimized ? 'w-14 h-14' : 'w-80'
        }`}>
          {isGuideMinimized ? (
            <button 
              onClick={() => setIsGuideMinimized(false)}
              className="w-full h-full bg-orange-600 rounded-2xl flex items-center justify-center shadow-xl shadow-orange-600/30 hover:scale-110 transition-transform group"
            >
              <Zap className="text-white group-hover:animate-pulse" size={24} />
            </button>
          ) : (
            <div className="w-full bg-[#020617] border border-white/10 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] p-6 animate-in zoom-in-95 duration-500 relative overflow-hidden group">
               <div className="absolute top-4 right-4 flex gap-2">
                  <button onClick={() => setIsGuideMinimized(true)} className="p-1.5 bg-white/5 rounded-lg text-slate-500 hover:text-white transition-all"><Minimize2 size={12} /></button>
                  <button onClick={() => setShowGuide(false)} className="p-1.5 bg-white/5 rounded-lg text-slate-500 hover:text-red-500 transition-all"><X size={12} /></button>
               </div>
               
               <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-orange-600/10 rounded-xl flex items-center justify-center text-orange-500 border border-orange-500/20 shadow-lg"><Zap size={20} /></div>
                  <div>
                     <h4 className="text-sm font-black text-white italic tracking-tighter uppercase leading-none">Onboarding Neural</h4>
                     <p className="text-[8px] text-slate-600 uppercase font-black tracking-widest">Aceleração WayFlow</p>
                  </div>
               </div>

               <div className="space-y-2 mb-6">
                  <GuideItem step={1} label="Conectar Evolution API" done={false} onClick={() => navigateTo(AppView.CONNECTIONS)} />
                  <GuideItem step={2} label="Vincular WhatsApp Web" done={false} onClick={() => navigateTo(AppView.CONNECTIONS)} />
                  <GuideItem step={3} label="Treinar Agente Neural" done={false} onClick={() => navigateTo(AppView.AGENT_BUILDER)} />
                  <GuideItem step={4} label="Validar Recuperação" done={false} onClick={() => navigateTo(AppView.CHAT_MANAGER)} />
               </div>

               <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl mb-6">
                  <div className="flex items-center gap-2 mb-1.5">
                     <Info size={12} className="text-orange-500" />
                     <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest">Dica Master</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium leading-tight">Vincule a <span className="text-white font-bold">Evolution API</span> primeiro para ativar a leitura neural.</p>
               </div>

               <button 
                 onClick={() => navigateTo(AppView.CONNECTIONS)} 
                 className="w-full py-3.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-orange-600/20 active:scale-95"
               >
                 Iniciar Configuração
               </button>
            </div>
          )}
        </div>
      )}

      {currentView === AppView.LANDING && <Landing onNavigate={navigateTo} />}
      {currentView === AppView.LOGIN && <Login onLoginSuccess={() => navigateTo(AppView.DASHBOARD)} onBack={() => navigateTo(AppView.LANDING)} />}
      {currentView === AppView.CHECKOUT && <Checkout onComplete={() => navigateTo(AppView.DASHBOARD)} onBack={() => navigateTo(AppView.LANDING)} />}
      
      {isAuthenticated && userProfile && (
        <div className="animate-in fade-in duration-700">
          {currentView === AppView.DASHBOARD && <Dashboard onLogout={() => supabase.auth.signOut()} onNavigate={navigateTo} />}
          {currentView === AppView.CHAT_MANAGER && <ChatManager onNavigate={navigateTo} onLogout={() => supabase.auth.signOut()} />}
          {currentView === AppView.AGENT_BUILDER && <AgentBuilder onNavigate={navigateTo} onLogout={() => supabase.auth.signOut()} />}
          {currentView === AppView.CONNECTIONS && <Connections onNavigate={navigateTo} onLogout={() => supabase.auth.signOut()} />}
          {currentView === AppView.ADMIN && <Admin onNavigate={navigateTo} onLogout={() => supabase.auth.signOut()} />}
        </div>
      )}
    </div>
  );
};

const GuideItem: React.FC<{ step: number, label: string, done: boolean, onClick: () => void }> = ({ step, label, done, onClick }) => (
  <div 
    onClick={onClick}
    className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.04] border border-transparent hover:border-white/5 transition-all duration-300 cursor-pointer group"
  >
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black transition-all ${
      done ? 'bg-emerald-500 text-white' : 'bg-white/5 text-slate-600 border border-white/10 group-hover:border-orange-500/50 group-hover:text-orange-500'
    }`}>
      {done ? <CheckCircle2 size={16} /> : step}
    </div>
    <div className="flex-1">
       <span className={`text-[11px] font-black italic tracking-tight transition-colors ${
         done ? 'text-slate-700 line-through' : 'text-slate-300 group-hover:text-white'
       }`}>{label}</span>
    </div>
    <ChevronRight size={12} className="text-slate-800 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
  </div>
);

export default App;
