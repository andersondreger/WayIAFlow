
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
    // 1. Configurar o Listener de Auth APENAS UMA VEZ no mount
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Supabase Auth Event:", event);
      
      if (session) {
        setIsAuthenticated(true);
        // Se for recuperação de senha, forçamos a view de login/update
        if (event === 'PASSWORD_RECOVERY') {
          setCurrentView(AppView.LOGIN);
        } else if (event === 'SIGNED_IN') {
          // Só muda para Dashboard se estiver na Landing ou Login para evitar pulos indesejados
          setCurrentView(prev => (prev === AppView.LANDING || prev === AppView.LOGIN) ? AppView.DASHBOARD : prev);
        }
        await fetchTrialInfo(session.user.id);
      } else {
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    });

    // 2. Checagem inicial de sessão
    const checkInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (session) {
          setIsAuthenticated(true);
          await fetchTrialInfo(session.user.id);
          // Se houver sessão inicial, vamos para o dashboard (a menos que seja recovery)
          if (!window.location.hash.includes('type=recovery')) {
            setCurrentView(AppView.DASHBOARD);
          }
        }
      } catch (err) {
        console.error("Erro na checagem de sessão:", err);
      } finally {
        // Garante que o loading saia da tela após 1.5s no máximo ou erro
        setTimeout(() => setIsLoading(false), 500);
      }
    };

    checkInitialSession();

    // Fallback: Se após 5 segundos ainda estiver carregando, forçamos a saída
    const timeoutFallback = setTimeout(() => setIsLoading(false), 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeoutFallback);
    };
  }, []); // Array vazio para rodar apenas uma vez!

  const fetchTrialInfo = async (userId: string) => {
    try {
      const { data, error } = await supabase.from('profiles').select('trial_start_date').eq('id', userId).single();
      if (data) {
        const start = new Date(data.trial_start_date);
        const now = new Date();
        const diffDays = Math.ceil(Math.abs(now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        setTrialDays(Math.max(0, 15 - diffDays));
      }
    } catch (e) {
      // Perfil pode não existir ainda
    }
  };

  const navigateTo = (view: AppView) => {
    // Proteção de rotas autenticadas
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
    setIsAuthenticated(false);
    setCurrentView(AppView.LANDING);
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
          <p className="text-slate-600 text-[9px] font-bold uppercase tracking-widest">Aguardando resposta neural...</p>
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
