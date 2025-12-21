
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
    const checkUser = async () => {
      try {
        console.log("Checking session...");
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (session) {
          setIsAuthenticated(true);
          await fetchTrialInfo(session.user.id);
        }
      } catch (err) {
        console.error("Auth init error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();

    // Fail-safe: Se em 6 segundos ainda estiver carregando, libera a tela
    const timer = setTimeout(() => {
      setIsLoading(prev => {
        if (prev) console.warn("Loading state forced to false by timeout");
        return false;
      });
    }, 6000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth event:", event);
      setIsAuthenticated(!!session);
      if (session) {
        await fetchTrialInfo(session.user.id);
      } else {
        setTrialDays(15);
        if (![AppView.LANDING, AppView.LOGIN, AppView.CHECKOUT].includes(currentView)) {
          setCurrentView(AppView.LANDING);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const fetchTrialInfo = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('trial_start_date, status')
        .eq('id', userId)
        .single();

      if (data && !error) {
        const start = new Date(data.trial_start_date);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const remaining = Math.max(0, 15 - diffDays);
        setTrialDays(remaining);
      }
    } catch (e) {
      // Se a tabela não existir ainda ou der erro, mantemos o padrão de 15 dias
      console.warn("Could not fetch trial info, using default.");
    }
  };

  const navigateTo = (view: AppView) => {
    if ([AppView.DASHBOARD, AppView.CHAT_MANAGER, AppView.AGENT_BUILDER, AppView.CONNECTIONS, AppView.ADMIN].includes(view) && !isAuthenticated) {
      setCurrentView(AppView.LOGIN);
      return;
    }
    
    if (trialDays <= 0 && view === AppView.DASHBOARD && isAuthenticated) {
      setCurrentView(AppView.CHECKOUT);
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
        <p className="text-orange-500 font-black text-xs uppercase tracking-[0.3em] animate-pulse">Iniciando Rede Neural...</p>
      </div>
    );
  }

  const renderView = () => {
    switch (currentView) {
      case AppView.LANDING:
        return <Landing onNavigate={navigateTo} />;
      case AppView.LOGIN:
        return <Login onLoginSuccess={() => navigateTo(AppView.DASHBOARD)} onBack={() => navigateTo(AppView.LANDING)} />;
      case AppView.CHECKOUT:
        return <Checkout onComplete={() => navigateTo(AppView.DASHBOARD)} onBack={() => navigateTo(AppView.LANDING)} />;
      case AppView.DASHBOARD:
        return <Dashboard onLogout={handleLogout} onNavigate={navigateTo} trialRemaining={trialDays} />;
      case AppView.CHAT_MANAGER:
        return <ChatManager onNavigate={navigateTo} onLogout={handleLogout} />;
      case AppView.AGENT_BUILDER:
        return <AgentBuilder onNavigate={navigateTo} onLogout={handleLogout} />;
      case AppView.CONNECTIONS:
        return <Connections onNavigate={navigateTo} onLogout={handleLogout} />;
      case AppView.ADMIN:
        return <Admin onNavigate={navigateTo} onLogout={handleLogout} />;
      default:
        return <Landing onNavigate={navigateTo} />;
    }
  };

  return <div className="min-h-screen">{renderView()}</div>;
};

export default App;
