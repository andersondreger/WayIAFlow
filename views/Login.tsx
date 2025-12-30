
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Mail, Lock, Loader2, User, 
  ShieldCheck, Chrome, Github, Zap, Sparkles, Cpu
} from 'lucide-react';
import { supabase } from '../services/supabase.ts';

interface LoginProps {
  onLoginSuccess: () => void;
  onBack: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'login' | 'register' | 'forgot'>('login');
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  });

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

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Efeitos de Fundo */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-orange-600 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600 blur-[120px] rounded-full animate-pulse delay-700" />
      </div>

      <div className="max-w-[1000px] w-full grid grid-cols-1 lg:grid-cols-2 bg-[#03081a]/80 backdrop-blur-2xl border border-white/10 rounded-[3rem] overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.8)] relative z-10">
        
        {/* Lado Esquerdo - Info Automação */}
        <div className="hidden lg:flex flex-col p-12 bg-gradient-to-br from-orange-600/20 to-transparent border-r border-white/5">
          <div className="mb-auto">
             <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg"><Zap className="text-white" size={20} /></div>
                <h2 className="text-xl font-black text-white italic tracking-tighter uppercase">WayFlow iA</h2>
             </div>
             <h1 className="text-4xl font-black text-white leading-none tracking-tighter italic mb-6 uppercase">Recuperação de <br /><span className="text-orange-500">Checkout Automática</span>.</h1>
             <p className="text-slate-400 text-sm leading-relaxed font-medium mb-8">Nossa rede neural identifica abandonos e inicia conversas persuasivas no WhatsApp em milissegundos.</p>
             
             <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-white/5 border border-white/5 rounded-2xl">
                   <div className="text-orange-500"><Cpu size={20}/></div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Integração Nativa Evolution API</p>
                </div>
                <div className="flex items-center gap-4 p-4 bg-white/5 border border-white/5 rounded-2xl">
                   <div className="text-emerald-500"><Sparkles size={20}/></div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">IA com Sentimento Humano</p>
                </div>
             </div>
          </div>
          <div className="mt-10 pt-10 border-t border-white/5 text-[10px] text-slate-600 font-black uppercase tracking-widest italic">
             © 2025 WayFlow System • v3.1 Neural Core
          </div>
        </div>

        {/* Lado Direito - Form */}
        <div className="p-12 md:p-16 flex flex-col justify-center">
           <div className="mb-10 text-center lg:text-left">
              <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-2">Acesse o Portal.</h3>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Painel de Automação de Vendas</p>
           </div>

           <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Credencial de Acesso (E-mail)</label>
                 <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-orange-500 transition-colors" size={18} />
                    <input 
                      type="email" required placeholder="adm@wayflow.ia" 
                      value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-sm focus:outline-none focus:border-orange-500 transition-all placeholder:text-slate-800"
                    />
                 </div>
              </div>

              <div className="space-y-2">
                 <div className="flex justify-between px-1">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Senha Neural</label>
                   <button type="button" className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Esqueci a Senha</button>
                 </div>
                 <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-orange-500 transition-colors" size={18} />
                    <input 
                      type="password" required placeholder="••••••••" 
                      value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-sm focus:outline-none focus:border-orange-500 transition-all placeholder:text-slate-800"
                    />
                 </div>
              </div>

              <button 
                disabled={loading}
                className="w-full bg-orange-600 hover:bg-orange-500 py-5 rounded-2xl text-white font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-orange-600/20 transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                 {loading ? <Loader2 className="animate-spin" size={20} /> : <Zap size={18} />}
                 {loading ? 'Autenticando...' : 'Entrar no Sistema'}
              </button>
           </form>

           <div className="mt-10 flex flex-col items-center gap-6">
              <div className="w-full flex items-center gap-4 opacity-20">
                 <div className="flex-1 h-px bg-white" />
                 <span className="text-[9px] font-black text-white uppercase tracking-widest">Secure Cloud</span>
                 <div className="flex-1 h-px bg-white" />
              </div>
              <button onClick={onBack} className="text-[10px] font-black text-slate-600 hover:text-white uppercase tracking-widest transition-colors flex items-center gap-2">
                 <ArrowLeft size={14} /> Voltar para o Site
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
