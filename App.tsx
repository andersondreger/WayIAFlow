
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
    // Garantia absoluta de que a tela de loading vai sair após 3 segundos
    const fallbackTimeout = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    // Configura o listener de mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Supabase Auth Event:", event);
      
      if (session) {
        setIsAuthenticated(true);
        // Se o usuário estiver logado e não estiver recuperando senha, vai para dashboard
        if (currentView === AppView.LANDING || currentView === AppView.LOGIN) {
          if (!window.location.hash.includes('type=recovery')) {
            setCurrentView(AppView.DASHBOARD);
          }
        }
        // Chamada não-bloqueante (sem await) para não travar o carregamento
        fetchTrialInfo(session.user.id);
      } else {
        setIsAuthenticated(false);
        if (event === 'SIGNED_OUT') {
          setCurrentView(AppView.LANDING);
        }
      }
      setIsLoading(false);
    });

    // Checagem imediata de sessão
    const checkInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setIsAuthenticated(true);
          fetchTrialInfo(session.user.id);
          if (!window.location.hash.includes('type=recovery')) {
            setCurrentView(AppView.DASHBOARD);
          }
        }
      } catch (err) {
        console.error("Erro na checagem de sessão:", err);
      } finally {
        setIsLoading(false);
        clearTimeout(fallbackTimeout);
      }
    };

    checkInitialSession();

    return () => {
      subscription.unsubscribe();
      clearTimeout(fallbackTimeout);
    };
  }, [currentView]);

  const fetchTrialInfo = async (userId: string) => {
    try {
      // Usamos uma consulta simples que falha silenciosamente se a tabela não existir
      const { data, error } = await supabase
        .from('profiles')
        .select('trial_start_date')
        .eq('id', userId)
        .single();
      
      if (data && !error) {
        const start = new Date(data.trial_start_date);
        const now = new Date();
        const diffDays = Math.ceil(Math.abs(now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        setTrialDays(Math.max(0, 15 - diffDays));
      }
    } catch (e) {
      // Ignora erros de banco de dados para não quebrar a UI
    }
  };

  const navigateTo = (view: AppView) => {
    const privateViews = [AppView.DASHBOARD, AppView.CHAT_MANAGER, AppView.AGENT_BUILDER, AppView.CONNECTIONS, AppView.ADMIN];
    if (privateViews.includes(view) && !isAuthenticated) {
      setCurrentView(AppView.LOGIN);
      return;
    }
    setCurrentView(view);
    window.scrollTo(0, 0);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center gap-6 p-10">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-orange-600/20 border-t-orange-600 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-10 h-10 border-4 border-red-600/20 border-b-red-600 rounded-full animate-spin [animation-duration:1.5s]" />
          </div>
        </div>
        <div className="text-center space-y-2">
          <p className="text-orange-500 font-black text-[10px] uppercase tracking-[0.4em] animate-pulse">Sincronizando WayFlow iA</p>
          <p className="text-slate-600 text-[9px] font-bold uppercase tracking-widest">Iniciando Protocolo Seguro...</p>
        </div>
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
