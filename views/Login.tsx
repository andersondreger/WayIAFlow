
import React, { useState } from 'react';
import { 
  ArrowLeft, Mail, Lock, Loader2, Github, User, Phone, 
  ChevronRight, CheckCircle2 
} from 'lucide-react';
import { supabase } from '../services/supabase.ts';

interface LoginProps {
  onLoginSuccess: () => void;
  onBack: () => void;
}

const Logo: React.FC<{ className?: string }> = ({ className = "h-12" }) => {
  return (
    <div className="flex items-center gap-2 select-none">
      <img src="https://qonrpzlkjhdmswjfxvtu.supabase.co/storage/v1/object/public/WayIAFlow/logo.png" alt="WayFlow iA Logo" className={className} onError={(e) => {
        (e.target as HTMLImageElement).src = 'https://placehold.co/200x80/0f172a/ffffff?text=WayFlow+iA';
      }} />
    </div>
  );
};

const Login: React.FC<LoginProps> = ({ onLoginSuccess, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [regStep, setRegStep] = useState(1);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    q1: '',
    q2: '',
    q3: ''
  });

  const handleSocialLogin = async (provider: 'google' | 'github') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: window.location.origin }
      });
      if (error) throw error;
    } catch (error: any) {
      console.error("Erro social login:", error);
      alert("Erro ao conectar via Social: " + (error.message || "Verifique sua conexão"));
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });
      if (error) throw error;
      onLoginSuccess();
    } catch (error: any) {
      console.error("Erro login:", error);
      alert("Falha na autenticação: " + (error.message || "E-mail ou senha incorretos"));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.name,
            phone: formData.phone,
            business_volume: formData.q1,
            business_objective: formData.q2,
            business_source: formData.q3
          }
        }
      });
      if (error) throw error;
      alert("Cadastro realizado! Verifique seu e-mail ou prossiga com o login.");
      setViewMode('login');
    } catch (error: any) {
      console.error("Erro cadastro:", error);
      alert("Erro ao criar conta: " + (error.message || "Erro inesperado de rede"));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email);
      if (error) throw error;
      alert("As instruções de recuperação foram enviadas para seu e-mail.");
      setViewMode('login');
    } catch (error: any) {
      alert("Erro: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const questions = [
    {
      id: 'q1',
      title: 'Qual seu volume mensal de vendas?',
      options: ['Iniciante (Até R$ 10k)', 'Escalando (R$ 10k - 50k)', 'High Ticket (+ R$ 50k)']
    },
    {
      id: 'q2',
      title: 'Qual seu objetivo principal?',
      options: ['Recuperar Checkouts', 'Automatizar Atendimento', 'Escalar Infraestrutura']
    },
    {
      id: 'q3',
      title: 'Como você conheceu a WayFlow?',
      options: ['Anúncio / Redes Sociais', 'Indicação de Parceiro', 'Pesquisa no Google']
    }
  ];

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col md:flex-row overflow-hidden">
      <div className="hidden md:flex flex-1 bg-gradient-to-br from-orange-600 to-red-700 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-20">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent blur-3xl scale-150" />
        </div>
        <div className="relative z-10 cursor-pointer" onClick={onBack}><Logo className="h-16 w-auto" /></div>
        <div className="relative z-10">
          <h2 className="text-5xl font-black text-white mb-6 leading-tight tracking-tighter italic">WayFlow iA <br /> Evolution Engine.</h2>
          <p className="text-orange-100 text-lg max-w-md font-medium">Acesse a infraestrutura neural de maior conversão do mercado.</p>
        </div>
        <div className="relative z-10 flex gap-12 text-white/40 text-[10px] font-black uppercase tracking-widest">
          <p>© 2025 WayFlow iA</p>
          <a href="#" className="hover:text-white transition-colors">Enterprise Support</a>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center p-8 md:p-24 relative overflow-y-auto custom-scrollbar">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-600/5 blur-[120px] pointer-events-none" />
        
        <div className="max-w-md mx-auto w-full relative z-10">
          <div className="flex items-center justify-between mb-10">
            <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest">
              <ArrowLeft size={16} /> Voltar
            </button>
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
              <button 
                onClick={() => { setViewMode('login'); setRegStep(1); }}
                className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'login' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >Entrar</button>
              <button 
                onClick={() => setViewMode('register')}
                className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'register' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >Cadastrar</button>
            </div>
          </div>

          {viewMode === 'login' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-10">
                <h1 className="text-4xl font-black text-white mb-2 tracking-tighter italic">Acesso Restrito.</h1>
                <p className="text-slate-500 font-medium">Conecte-se ao seu dashboard neural.</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <InputGroup icon={Mail} label="E-mail" type="email" placeholder="adm@wayflow.ia" value={formData.email} onChange={(v) => setFormData({...formData, email: v})} />
                <div className="space-y-2">
                   <div className="flex justify-between items-center">
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Senha</label>
                     <button type="button" onClick={() => setViewMode('forgot')} className="text-[10px] font-black text-orange-500 hover:text-orange-400 uppercase tracking-widest">Esqueceu?</button>
                   </div>
                   <InputGroup icon={Lock} type="password" placeholder="••••••••" value={formData.password} onChange={(v) => setFormData({...formData, password: v})} noLabel />
                </div>
                <button disabled={loading} className="w-full bg-gradient-to-r from-orange-600 to-red-600 py-4 rounded-2xl text-white font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-orange-600/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50">
                  {loading ? <Loader2 className="animate-spin" /> : 'Entrar no Sistema'}
                </button>
                <SocialAuth onGoogle={() => handleSocialLogin('google')} onGithub={() => handleSocialLogin('github')} />
              </form>
            </div>
          )}

          {viewMode === 'register' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              {regStep === 1 ? (
                <div>
                  <div className="mb-8">
                    <h1 className="text-4xl font-black text-white mb-2 tracking-tighter italic">Inicie seu Trial.</h1>
                    <p className="text-slate-500 font-medium">15 dias de automação ilimitada gratuita.</p>
                  </div>
                  <div className="space-y-4">
                    <InputGroup icon={User} label="Nome Completo" placeholder="Ex: João Silva" value={formData.name} onChange={(v) => setFormData({...formData, name: v})} />
                    <InputGroup icon={Phone} label="WhatsApp" placeholder="(00) 00000-0000" value={formData.phone} onChange={(v) => setFormData({...formData, phone: v})} />
                    <InputGroup icon={Mail} label="E-mail Corporativo" type="email" placeholder="voce@empresa.com" value={formData.email} onChange={(v) => setFormData({...formData, email: v})} />
                    <InputGroup icon={Lock} label="Senha Segura" type="password" placeholder="Mínimo 8 caracteres" value={formData.password} onChange={(v) => setFormData({...formData, password: v})} />
                    <button 
                      onClick={() => setRegStep(2)}
                      disabled={!formData.name || !formData.email || formData.password.length < 8}
                      className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-30"
                    >
                      Próximo Passo <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="mb-8">
                    <h1 className="text-3xl font-black text-white mb-2 tracking-tighter italic">Perfil de Negócio.</h1>
                    <p className="text-slate-500 font-medium text-sm">Personalize sua experiência neural.</p>
                  </div>
                  <div className="space-y-8">
                    {questions.map((q) => (
                      <div key={q.id} className="space-y-3">
                         <p className="text-xs font-black text-white uppercase tracking-widest">{q.title}</p>
                         <div className="grid grid-cols-1 gap-2">
                           {q.options.map((opt) => (
                             <button 
                              key={opt}
                              onClick={() => setFormData({...formData, [q.id]: opt})}
                              className={`p-4 rounded-xl border text-left text-xs font-bold transition-all ${formData[q.id as keyof typeof formData] === opt ? 'bg-orange-600/10 border-orange-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.1)]' : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/20'}`}
                             >
                               {opt}
                             </button>
                           ))}
                         </div>
                      </div>
                    ))}
                    <button 
                      onClick={handleRegister}
                      disabled={loading || !formData.q1 || !formData.q2 || !formData.q3}
                      className="w-full bg-gradient-to-r from-orange-600 to-red-600 py-4 rounded-2xl text-white font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-orange-600/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="animate-spin" /> : <><CheckCircle2 size={16} /> Criar Minha Conta</>}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const InputGroup: React.FC<{ icon: any, label?: string, type?: string, placeholder: string, value: string, onChange: (v: string) => void, noLabel?: boolean }> = ({ icon: Icon, label, type = 'text', placeholder, value, onChange, noLabel }) => (
  <div className="space-y-2 group">
    {!noLabel && label && <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-focus-within:text-orange-500 transition-colors">{label}</label>}
    <div className="relative">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-orange-500 transition-colors">
        <Icon size={18} />
      </div>
      <input 
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-white text-sm focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 transition-all placeholder:text-slate-700"
      />
    </div>
  </div>
);

const SocialAuth: React.FC<{ onGoogle: () => void, onGithub: () => void }> = ({ onGoogle, onGithub }) => (
  <div className="space-y-5 pt-6">
    <div className="relative flex items-center">
      <div className="flex-grow border-t border-white/5"></div>
      <span className="flex-shrink mx-4 text-[9px] font-black text-slate-700 uppercase tracking-[0.3em]">Ou autentique com</span>
      <div className="flex-grow border-t border-white/5"></div>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <button type="button" onClick={onGoogle} className="flex items-center justify-center gap-2 py-3.5 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.06] transition-all text-xs font-bold text-slate-300">
        <img src="https://www.google.com/favicon.ico" className="w-4 h-4 grayscale" alt="Google" /> Google
      </button>
      <button type="button" onClick={onGithub} className="flex items-center justify-center gap-2 py-3.5 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.06] transition-all text-xs font-bold text-slate-300">
        <Github size={18} className="text-slate-500" /> GitHub
      </button>
    </div>
  </div>
);

export default Login;
