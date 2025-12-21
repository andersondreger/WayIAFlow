
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Mail, Lock, Loader2, User, 
  ShieldCheck, Chrome, Github 
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

const SocialLogins: React.FC<{ onSocial: (p: 'google' | 'github') => void }> = ({ onSocial }) => (
  <div className="mt-10">
    <div className="relative mb-8">
      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
      <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest"><span className="bg-[#020617] px-4 text-slate-600">Ou continue com</span></div>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <button type="button" onClick={() => onSocial('google')} className="flex items-center justify-center gap-3 bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] py-3.5 rounded-2xl transition-all group">
        <Chrome size={18} className="text-orange-500 group-hover:scale-110 transition-transform" />
        <span className="text-[10px] font-black uppercase tracking-widest text-white">Google</span>
      </button>
      <button type="button" onClick={() => onSocial('github')} className="flex items-center justify-center gap-3 bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] py-3.5 rounded-2xl transition-all group">
        <Github size={18} className="text-slate-300 group-hover:scale-110 transition-transform" />
        <span className="text-[10px] font-black uppercase tracking-widest text-white">GitHub</span>
      </button>
    </div>
  </div>
);

const Login: React.FC<LoginProps> = ({ onLoginSuccess, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'login' | 'register' | 'forgot' | 'update_password'>('login');
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setViewMode('update_password');
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });
      if (error) throw error;
      if (data.session) onLoginSuccess();
    } catch (error: any) {
      alert("Erro no Login: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) return alert("As senhas não coincidem.");
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: { full_name: formData.fullName }
        }
      });
      if (error) throw error;
      alert("Cadastro realizado! Verifique seu e-mail para confirmar.");
      setViewMode('login');
    } catch (error: any) {
      alert("Erro no Cadastro: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'github') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: window.location.origin }
      });
      if (error) throw error;
    } catch (error: any) {
      alert("Erro no Social Login: " + error.message);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email) return alert("Digite seu e-mail.");
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
        redirectTo: window.location.origin,
      });
      if (error) throw error;
      alert("Link de recuperação enviado para seu e-mail!");
      setViewMode('login');
    } catch (error: any) {
      alert("Erro: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) return alert("As senhas não coincidem.");
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: formData.password });
      if (error) throw error;
      alert("Senha atualizada com sucesso!");
      onLoginSuccess();
    } catch (error: any) {
      alert("Erro: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col md:flex-row overflow-hidden">
      {/* Lado Esquerdo - Branding */}
      <div className="hidden md:flex flex-1 bg-gradient-to-br from-orange-600 to-red-700 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[radial-gradient(circle_at_center,_white_0%,transparent_70%)] blur-3xl scale-150" />
        <div className="relative z-10 cursor-pointer" onClick={onBack}><Logo className="h-16 w-auto" /></div>
        <div className="relative z-10">
          <h2 className="text-5xl font-black text-white mb-6 leading-tight tracking-tighter italic">WayFlow iA <br /> Evolution Engine.</h2>
          <p className="text-orange-100 text-lg max-w-md font-medium">Acesse a maior infraestrutura de automação do mercado e escale sua operação hoje.</p>
        </div>
      </div>

      {/* Lado Direito - Formulários */}
      <div className="flex-1 flex flex-col justify-center p-8 md:p-24 relative overflow-y-auto custom-scrollbar">
        <div className="max-w-md mx-auto w-full relative z-10">
          
          {viewMode === 'update_password' ? (
            <div className="animate-in fade-in zoom-in-95 duration-500">
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-3xl mb-8 flex items-center gap-4 text-emerald-500">
                <ShieldCheck size={32} />
                <div>
                  <h4 className="font-black text-sm uppercase tracking-wider">Acesso Validado</h4>
                  <p className="text-xs opacity-80">Crie sua nova senha agora.</p>
                </div>
              </div>
              <h1 className="text-3xl font-black text-white mb-6 tracking-tighter italic">Nova Senha.</h1>
              <form onSubmit={handleUpdatePassword} className="space-y-5">
                <InputGroup icon={Lock} label="Nova Senha" type="password" placeholder="Mínimo 8 caracteres" value={formData.password} onChange={(v) => setFormData({...formData, password: v})} />
                <InputGroup icon={Lock} label="Confirmar Senha" type="password" placeholder="••••••••" value={formData.confirmPassword} onChange={(v) => setFormData({...formData, confirmPassword: v})} />
                <button disabled={loading} className="w-full bg-orange-600 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="animate-spin" /> : 'Salvar e Acessar'}
                </button>
              </form>
            </div>
          ) : viewMode === 'login' ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center mb-10">
                 <button onClick={onBack} className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"><ArrowLeft size={14}/> Site Principal</button>
                 <button onClick={() => setViewMode('register')} className="text-xs font-black text-orange-500 uppercase tracking-widest hover:text-orange-400 transition-colors">Criar Conta</button>
              </div>
              <h1 className="text-4xl font-black text-white mb-2 tracking-tighter italic">Login.</h1>
              <p className="text-slate-500 font-medium mb-10">Acesse seu painel neural.</p>
              
              <form onSubmit={handleLogin} className="space-y-5">
                <InputGroup icon={Mail} label="E-mail" type="email" placeholder="adm@wayflow.ia" value={formData.email} onChange={(v) => setFormData({...formData, email: v})} />
                <div className="space-y-2">
                   <div className="flex justify-between items-center">
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Senha</label>
                     <button type="button" onClick={() => setViewMode('forgot')} className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Esqueceu?</button>
                   </div>
                   <InputGroup icon={Lock} type="password" placeholder="••••••••" value={formData.password} onChange={(v) => setFormData({...formData, password: v})} noLabel />
                </div>
                <button disabled={loading} className="w-full bg-orange-600 py-4 rounded-2xl text-white font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:bg-orange-500 transition-all">
                  {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Entrar na Plataforma'}
                </button>
              </form>

              <SocialLogins onSocial={handleSocialLogin} />
            </div>
          ) : viewMode === 'register' ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center mb-10">
                 <button onClick={() => setViewMode('login')} className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"><ArrowLeft size={14}/> Já tenho conta</button>
              </div>
              <h1 className="text-4xl font-black text-white mb-2 tracking-tighter italic">Cadastrar.</h1>
              <p className="text-slate-500 font-medium mb-10">Inicie seu Trial de 15 dias.</p>
              
              <form onSubmit={handleRegister} className="space-y-5">
                <InputGroup icon={User} label="Nome Completo" placeholder="Ex: João Silva" value={formData.fullName} onChange={(v) => setFormData({...formData, fullName: v})} />
                <InputGroup icon={Mail} label="Melhor E-mail" type="email" placeholder="adm@wayflow.ia" value={formData.email} onChange={(v) => setFormData({...formData, email: v})} />
                <div className="grid grid-cols-2 gap-4">
                  <InputGroup icon={Lock} label="Senha" type="password" placeholder="••••••••" value={formData.password} onChange={(v) => setFormData({...formData, password: v})} />
                  <InputGroup icon={Lock} label="Confirmar" type="password" placeholder="••••••••" value={formData.confirmPassword} onChange={(v) => setFormData({...formData, confirmPassword: v})} />
                </div>
                <button disabled={loading} className="w-full bg-orange-600 py-4 rounded-2xl text-white font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:bg-orange-500 transition-all">
                  {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Ativar Minha Conta'}
                </button>
              </form>

              <SocialLogins onSocial={handleSocialLogin} />
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h1 className="text-4xl font-black text-white mb-2 tracking-tighter italic">Recuperar.</h1>
              <p className="text-slate-500 font-medium mb-10">Enviaremos um link para seu e-mail.</p>
              <form onSubmit={handleForgotPassword} className="space-y-5">
                <InputGroup icon={Mail} label="Seu e-mail" type="email" placeholder="adm@wayflow.ia" value={formData.email} onChange={(v) => setFormData({...formData, email: v})} />
                <button disabled={loading} className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:bg-slate-100 transition-all">
                  {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Enviar Recuperação'}
                </button>
                <button type="button" onClick={() => setViewMode('login')} className="w-full text-center text-xs font-bold text-slate-500 mt-4 uppercase tracking-widest">Cancelar</button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const InputGroup: React.FC<{ icon: any, label?: string, type?: string, placeholder: string, value: string, onChange: (v: string) => void, noLabel?: boolean }> = ({ icon: Icon, label, type = 'text', placeholder, value, onChange, noLabel }) => (
  <div className="space-y-2 group">
    {!noLabel && label && <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</label>}
    <div className="relative">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-orange-500 transition-colors">
        <Icon size={18} />
      </div>
      <input 
        required type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-white text-sm focus:outline-none focus:border-orange-500/50 transition-all placeholder:text-slate-700"
      />
    </div>
  </div>
);

export default Login;
