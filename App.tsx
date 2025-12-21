
import React, { useState, useEffect } from 'react';
import { AppView } from './types.ts';
import Landing from './views/Landing.tsx';
import Login from './views/Login.tsx';
import Checkout from './views/Checkout.tsx';
import Dashboard from './views/Dashboard.tsx';
import ChatManager from './views/ChatManager.tsx';
import AgentBuilder from './views/AgentBuilder.tsx';
import Connections from './views/Connections.tsx';
import Admin from './views/Admin.tsx';
import { supabase } from './services/supabase.ts';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.LANDING);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [trialDays, setTrialDays] = useState<number>(15);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Monitor de estado de autenticação global
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth Event:", event);
      
      if (session) {
        setIsAuthenticated(true);
        // Se o evento for de recuperação de senha, o Login.tsx cuidará da view interna
        if (event === 'PASSWORD_RECOVERY') {
          setCurrentView(AppView.LOGIN);
        } else if (currentView === AppView.LANDING || currentView === AppView.LOGIN) {
          setCurrentView(AppView.DASHBOARD);
        }
        await fetchTrialInfo(session.user.id);
      } else {
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    });

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setIsAuthenticated(true);
          await fetchTrialInfo(session.user.id);
        }
      } catch (err) {
        console.error("Auth Error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();

    return () => subscription.unsubscribe();
  }, [currentView]);

  const fetchTrialInfo = async (userId: string) => {
    try {
      const { data } = await supabase.from('profiles').select('trial_start_date').eq('id', userId).single();
      if (data) {
        const start = new Date(data.trial_start_date);
        const now = new Date();
        const diffDays = Math.ceil(Math.abs(now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        setTrialDays(Math.max(0, 15 - diffDays));
      }
    } catch (e) {}
  };

  const navigateTo = (view: AppView) => {
    if ([AppView.DASHBOARD, AppView.CHAT_MANAGER, AppView.AGENT_BUILDER, AppView.CONNECTIONS, AppView.ADMIN].includes(view) && !isAuthenticated) {
      setCurrentView(AppView.LOGIN);
      return;
    }
    setCurrentView(view);
    window.scrollTo(0, 0);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setCurrentView(AppView.LANDING);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center gap-6">
        <div className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(234,88,12,0.2)]"></div>
        <p className="text-orange-500 font-black text-xs uppercase tracking-[0.3em] animate-pulse">Sincronizando WayFlow iA...</p>
      </div>
    );
  }

  const renderView = () => {
    switch (currentView) {
      case AppView.LANDING: return <Landing onNavigate={navigateTo} />;
      case AppView.LOGIN: return <Login onLoginSuccess={() => navigateTo(AppView.DASHBOARD)} onBack={() => navigateTo(AppView.LANDING)} />;
      case AppView.CHECKOUT: return <Checkout onComplete={() => navigateTo(AppView.DASHBOARD)} onBack={() => navigateTo(AppView.LANDING)} />;
      case AppView.DASHBOARD: return <Dashboard onLogout={handleLogout} onNavigate={navigateTo} trialRemaining={trialDays} />;
      case AppView.CHAT_MANAGER: return <ChatManager onNavigate={navigateTo} onLogout={handleLogout} />;
      case AppView.AGENT_BUILDER: return <AgentBuilder onNavigate={navigateTo} onLogout={handleLogout} />;
      case AppView.CONNECTIONS: return <Connections onNavigate={navigateTo} onLogout={handleLogout} />;
      case AppView.ADMIN: return <Admin onNavigate={navigateTo} onLogout={handleLogout} />;
      default: return <Landing onNavigate={navigateTo} />;
    }
  };

  return <div className="min-h-screen">{renderView()}</div>;
};

export default App;
