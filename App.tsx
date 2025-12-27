
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
      {/* Guia Interativo WayFlow v3.5 - Flutuante e Minimizável */}
      {isAuthenticated && showGuide && currentView !== AppView.ADMIN && (
        <div className={`fixed bottom-10 right-10 z-[100] transition-all duration-700 ease-out ${
          isGuideMinimized ? 'w-20 h-20' : 'w-[420px]'
        }`}>
          {isGuideMinimized ? (
            <button 
              onClick={() => setIsGuideMinimized(false)}
              className="w-full h-full bg-orange-600 rounded-full flex items-center justify-center shadow-2xl shadow-orange-600/40 hover:scale-110 transition-transform group"
            >
              <Zap className="text-white group-hover:animate-pulse" size={32} />
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 border-2 border-[#020617] rounded-full flex items-center justify-center text-[10px] font-black text-white">1</div>
            </button>
          ) : (
            <div className="w-full bg-[#020617] border border-white/10 rounded-[3.5rem] shadow-[0_40px_120px_rgba(0,0,0,0.9)] p-10 animate-in zoom-in-95 duration-500 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-6 flex gap-3">
                  <button onClick={() => setIsGuideMinimized(true)} className="p-3 bg-white/5 rounded-2xl text-slate-500 hover:text-white hover:bg-white/10 transition-all"><Minimize2 size={16} /></button>
                  <button onClick={() => setShowGuide(false)} className="p-3 bg-white/5 rounded-2xl text-slate-500 hover:text-red-500 hover:bg-red-500/10 transition-all"><X size={16} /></button>
               </div>
               
               <div className="flex items-center gap-5 mb-10">
                  <div className="w-16 h-16 bg-orange-600/10 rounded-[1.5rem] flex items-center justify-center text-orange-500 border border-orange-500/20 shadow-xl shadow-orange-500/5"><Zap size={32} /></div>
                  <div>
                     <h4 className="text-2xl font-black text-white italic tracking-tighter">Onboarding Neural</h4>
                     <p className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em]">Guia de Aceleração WayFlow</p>
                  </div>
               </div>

               <div className="space-y-4 mb-10">
                  <GuideItem step={1} label="Conectar Evolution API" done={false} onClick={() => navigateTo(AppView.CONNECTIONS)} />
                  <GuideItem step={2} label="Vincular WhatsApp Web" done={false} onClick={() => navigateTo(AppView.CONNECTIONS)} />
                  <GuideItem step={3} label="Treinar Agente Neural" done={false} onClick={() => navigateTo(AppView.AGENT_BUILDER)} />
                  <GuideItem step={4} label="Validar Recuperação" done={false} onClick={() => navigateTo(AppView.CHAT_MANAGER)} />
               </div>

               <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[2rem] mb-10">
                  <div className="flex items-center gap-3 mb-3">
                     <Info size={16} className="text-orange-500" />
                     <span className="text-[11px] font-black text-orange-500 uppercase tracking-widest">Dica Master Sênior</span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">Seu primeiro passo é a <span className="text-white font-bold">Evolution API</span>. Sem ela, a IA não consegue ler as intenções dos seus leads.</p>
               </div>

               <button 
                 onClick={() => navigateTo(AppView.CONNECTIONS)} 
                 className="w-full py-5 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white rounded-[1.8rem] font-black text-sm uppercase tracking-widest transition-all shadow-2xl shadow-orange-600/30 active:scale-95"
               >
                 Iniciar Configuração Agora
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
    className="flex items-center gap-5 p-5 rounded-[1.8rem] hover:bg-white/[0.04] border border-transparent hover:border-white/10 transition-all duration-300 cursor-pointer group"
  >
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black transition-all ${
      done ? 'bg-emerald-500 text-white' : 'bg-white/5 text-slate-500 border border-white/10 group-hover:border-orange-500 group-hover:text-orange-500'
    }`}>
      {done ? <CheckCircle2 size={24} /> : step}
    </div>
    <div className="flex-1">
       <span className={`text-base font-black italic tracking-tight transition-colors ${
         done ? 'text-slate-600 line-through' : 'text-slate-200 group-hover:text-white'
       }`}>{label}</span>
    </div>
    <ChevronRight size={18} className="text-slate-800 group-hover:text-orange-500 group-hover:translate-x-2 transition-all" />
  </div>
);

export default App;
