
import React, { useState, useEffect } from 'react';
import { AppView } from './types';
import Landing from './views/Landing';
import Login from './views/Login';
import Checkout from './views/Checkout';
import Dashboard from './views/Dashboard';
import ChatManager from './views/ChatManager';
import AgentBuilder from './views/AgentBuilder';
import Connections from './views/Connections';
import Admin from './views/Admin';
import { supabase } from './services/supabase';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.LANDING);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [trialDays, setTrialDays] = useState<number>(15);
  const [isLoading, setIsLoading] = useState(true);

  // Listener de Autenticação e Busca de Perfil
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setIsAuthenticated(true);
        await fetchTrialInfo(session.user.id);
      } else {
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setIsAuthenticated(!!session);
      if (session) {
        await fetchTrialInfo(session.user.id);
        if (currentView === AppView.LOGIN) {
          setCurrentView(AppView.DASHBOARD);
        }
      } else {
        setTrialDays(15); // Reset default
      }
    });

    return () => subscription.unsubscribe();
  }, [currentView]);

  const fetchTrialInfo = async (userId: string) => {
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

      // Se o plano for trial e expirou, bloqueia
      if (remaining <= 0 && data.status === 'trial' && [AppView.DASHBOARD, AppView.CHAT_MANAGER, AppView.AGENT_BUILDER].includes(currentView)) {
        setCurrentView(AppView.CHECKOUT);
      }
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
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
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
