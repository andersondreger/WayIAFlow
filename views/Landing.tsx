
import React, { useEffect, useState } from 'react';
import { 
  ArrowRight, 
  Zap, 
  ShieldCheck, 
  BarChart3, 
  Smartphone,
  Cpu,
  Layers,
  CheckCircle2,
  ChevronRight,
  MessageCircle,
  Activity,
  CreditCard,
  Globe,
  Lock,
  Server,
  Code2,
  Sparkles,
  TrendingUp,
  MousePointer2,
  Terminal,
  Waves,
  Network
} from 'lucide-react';
import { AppView } from '../types';

const LOGO_URL = "https://qonrpzlkjhdmswjfxvtu.supabase.co/storage/v1/object/public/WayIAFlow/logo.png";

const Logo: React.FC<{ className?: string }> = ({ className = "h-10" }) => {
  return (
    <div className="flex items-center gap-2 select-none">
      <img src={LOGO_URL} alt="WayFlow iA Logo" className={className} onError={(e) => {
        (e.target as HTMLImageElement).src = 'https://placehold.co/400x120/020617/ffffff?text=WayFlow+iA';
      }} />
    </div>
  );
};

const DashboardMockup = () => {
  return (
    <div className="bg-[#020617] w-full h-full flex flex-col overflow-hidden relative border border-white/5 shadow-inner">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      
      <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-white/[0.02] relative z-10 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-orange-500/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
          </div>
          <div className="ml-4 h-4 w-32 bg-white/5 rounded-full" />
        </div>
        <div className="flex items-center gap-4">
          <div className="h-6 w-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center">
             <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest">Live Sync</span>
          </div>
          <div className="h-8 w-8 rounded-full bg-white/10" />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-16 border-r border-white/5 flex flex-col items-center py-6 gap-6 bg-white/[0.01]">
          {[Zap, BarChart3, MessageCircle, Cpu, Layers, Lock].map((Icon, i) => (
            <div key={i} className={`p-2 rounded-xl transition-all ${i === 0 ? 'bg-orange-500/20 text-orange-500' : 'text-slate-600 hover:text-slate-400'}`}>
              <Icon size={18} />
            </div>
          ))}
        </div>

        <div className="flex-1 p-6 flex flex-col gap-6 relative overflow-hidden">
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Recuperado', val: 'R$ 42.8k', trend: '+12%', color: 'text-orange-500' },
              { label: 'Conversão', val: '24.2%', trend: '+5.4%', color: 'text-emerald-500' },
              { label: 'Leads', val: '1,240', trend: '+210', color: 'text-purple-500' }
            ].map((card, i) => (
              <div key={i} className="bg-white/[0.03] border border-white/5 p-4 rounded-2xl">
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">{card.label}</p>
                <div className="flex items-end justify-between">
                  <span className="text-base font-black text-white">{card.val}</span>
                  <span className={`text-[8px] font-bold ${card.color}`}>{card.trend}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-3xl p-6 relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                   <Waves size={12} className="text-orange-500" /> Fluxo Neural Ativo
                </h4>
              </div>
              <TrendingUp size={14} className="text-orange-500" />
            </div>
            <div className="absolute inset-x-0 bottom-0 h-32 opacity-50">
              <svg className="w-full h-full" viewBox="0 0 1000 200" preserveAspectRatio="none">
                <path d="M0 150 Q 100 120, 200 160 T 400 100 T 600 140 T 800 80 T 1000 120" fill="none" stroke="#f59e0b" strokeWidth="2" className="animate-[dash_10s_linear_infinite]" strokeDasharray="500" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Landing: React.FC<{ onNavigate: (view: AppView) => void }> = ({ onNavigate }) => {
  const [activeSection, setActiveSection] = useState('hero');

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['hero', 'tech', 'whatsapp', 'neural'];
      const scrollPos = window.scrollY + 250;
      
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element && scrollPos >= element.offsetTop && scrollPos < element.offsetTop + element.offsetHeight) {
          setActiveSection(section);
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white selection:bg-orange-500/30 overflow-x-hidden font-sans">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-orange-600/[0.03] blur-[150px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-600/[0.03] blur-[150px] rounded-full" />
      </div>

      {/* Modern Navigation */}
      <nav className="fixed top-0 w-full z-[100] px-6 py-4 flex items-center justify-center">
        <div className="max-w-7xl w-full glass-dark border border-white/5 rounded-3xl px-8 py-4 flex items-center justify-between shadow-2xl">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => scrollTo('hero')}>
            <Logo className="h-8 w-auto transition-transform group-hover:scale-105" />
          </div>
          
          <div className="hidden lg:flex items-center gap-10 text-[9px] font-black uppercase tracking-[0.25em]">
            <button onClick={() => scrollTo('tech')} className={`${activeSection === 'tech' ? 'text-orange-500' : 'text-slate-400'} hover:text-white transition-all`}>Tecnologia</button>
            <button onClick={() => scrollTo('whatsapp')} className={`${activeSection === 'whatsapp' ? 'text-orange-500' : 'text-slate-400'} hover:text-white transition-all`}>WhatsApp</button>
            <button onClick={() => scrollTo('neural')} className={`${activeSection === 'neural' ? 'text-orange-500' : 'text-slate-400'} hover:text-white transition-all`}>WayIA Neural Enterprise</button>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={() => onNavigate(AppView.LOGIN)} className="text-slate-400 hover:text-white font-black text-[9px] uppercase tracking-widest transition-all px-4">Login</button>
            <button onClick={() => onNavigate(AppView.CHECKOUT)} className="btn-primary px-6 py-2.5 text-white rounded-xl font-black text-[9px] uppercase tracking-[0.2em] shadow-lg">
              Começar Agora
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="hero" className="relative pt-48 pb-32 px-10 min-h-screen flex items-center justify-center">
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/5 border border-white/10 mb-10 backdrop-blur-xl">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-orange-400">WayFlow Evolution v3.1 Engine</span>
          </div>
          
          <h1 className="text-5xl md:text-8xl font-black tracking-tighter mb-10 leading-[0.9] max-w-5xl mx-auto">
            Escalabilidade <span className="gradient-text italic">Imparável</span> via Rede Neural.
          </h1>
          
          <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto mb-16 leading-relaxed font-medium">
            Automatize a recuperação de checkouts e o atendimento com a <span className="text-white font-bold">WayIA Flow 2.0</span>. Inteligência que converte leads em lucro líquido em tempo real.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-24">
            <button onClick={() => onNavigate(AppView.CHECKOUT)} className="btn-primary px-12 py-5 text-white rounded-2xl font-black text-lg hover:scale-105 transition-all flex items-center gap-3 shadow-2xl shadow-orange-600/20">
              Ativar Minha Licença <ArrowRight size={20} />
            </button>
            <button onClick={() => onNavigate(AppView.LOGIN)} className="px-10 py-5 glass text-white rounded-2xl font-black text-lg hover:bg-white/10 transition-all border border-white/10">
              Acessar Portal Gratuito
            </button>
          </div>

          <div className="relative w-full max-w-5xl mx-auto">
             <div className="absolute -inset-20 bg-orange-500/10 blur-[120px] opacity-30 animate-pulse" />
             <div className="relative glass p-4 rounded-[3rem] border border-white/10 overflow-hidden shadow-2xl">
                <div className="rounded-[2.5rem] overflow-hidden aspect-video bg-black/40">
                   <DashboardMockup />
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Technology Section - Clean & High Tech */}
      <section id="tech" className="py-40 px-10 relative overflow-hidden">
        {/* Clean Mesh Background */}
        <div className="absolute inset-0 z-0 opacity-40">
           <svg className="w-full h-full text-slate-800" fill="currentColor">
              <pattern id="dotGrid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                 <circle cx="2" cy="2" r="1" opacity="0.1" />
              </pattern>
              <rect width="100%" height="100%" fill="url(#dotGrid)" />
           </svg>
        </div>
        
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-32 items-center relative z-10">
          <div className="space-y-10">
            <div className="inline-flex items-center gap-3 text-orange-500 font-black text-[9px] uppercase tracking-[0.4em]">
              <Network size={16} /> Enterprise Core Architecture
            </div>
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-tight">
              Infraestrutura <br /><span className="gradient-text italic">Professional Grade</span>.
            </h2>
            <p className="text-lg text-slate-400 leading-relaxed font-medium">
              Sua operação merece estabilidade de nível bancário. Nossa arquitetura combina <span className="text-white font-bold">n8n Workflows</span> e <span className="text-white font-bold">Evolution API</span> em um cluster de alta disponibilidade.
            </p>
            <div className="grid grid-cols-2 gap-8">
               <div className="p-8 glass rounded-3xl border border-white/5 group hover:border-orange-500/20 transition-all">
                 <Terminal size={24} className="text-orange-500 mb-6" />
                 <h4 className="text-white font-black text-lg mb-2">Webhooks v3</h4>
                 <p className="text-slate-500 text-xs">Processamento assíncrono com latência abaixo de 50ms.</p>
               </div>
               <div className="p-8 glass rounded-3xl border border-white/5 group hover:border-orange-500/20 transition-all">
                 <Server size={24} className="text-orange-500 mb-6" />
                 <h4 className="text-white font-black text-lg mb-2">99.9% Uptime</h4>
                 <p className="text-slate-500 text-xs">SLA garantido via redundância de nodes no Brasil e EUA.</p>
               </div>
            </div>
            <button onClick={() => onNavigate(AppView.CHECKOUT)} className="group flex items-center gap-4 text-xs font-black uppercase tracking-[0.2em] text-orange-500 hover:text-white transition-all">
              Ver especificações técnicas <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          <div className="relative group">
             <div className="absolute inset-0 bg-orange-600/10 blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
             <div className="glass p-10 rounded-[4rem] border border-white/10 relative z-10 shadow-2xl">
                <div className="flex items-center gap-4 border-b border-white/5 pb-8 mb-8">
                   <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nodes WayFlow Alpha: Active</span>
                </div>
                <div className="space-y-6 font-mono text-[11px] text-slate-500">
                   <p className="flex items-center gap-3"><span className="text-emerald-500 font-bold">$</span> connection.establish("evolution_api_cluster")</p>
                   <p className="flex items-center gap-3"><span className="text-orange-500 font-bold">$</span> inject.neural_flow("v2.4_core")</p>
                   <p className="text-white/80 animate-pulse"># Processing 242 abandoned checkouts...</p>
                   <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-orange-600 to-red-600 w-3/4 animate-[progress_5s_infinite]" />
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* WhatsApp Section */}
      <section id="whatsapp" className="py-40 px-10 relative bg-white/[0.01]">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row-reverse items-center gap-32">
          <div className="lg:w-1/2 space-y-12">
            <div className="inline-flex items-center gap-3 text-emerald-500 font-black text-[9px] uppercase tracking-[0.4em]">
              <Smartphone size={16} /> Messaging Engine
            </div>
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-tight">
              O WhatsApp na <br /><span className="text-emerald-500 italic">Velocidade da IA</span>.
            </h2>
            <p className="text-lg text-slate-400 leading-relaxed font-medium">
              Venda mais sem parecer um bot. Nossa tecnologia simula o comportamento humano com <span className="text-white font-bold">digitação variável</span> e áudios que aparecem como "gravados na hora".
            </p>
            <ul className="space-y-6">
               {[
                 { icon: MessageCircle, title: "Áudios Binários", desc: "Arquivos enviados como voz nativa, não como anexo." },
                 { icon: ShieldCheck, title: "Anti-Ban Engine", desc: "Algoritmo que modula o tempo de resposta para proteção total." },
                 { icon: CheckCircle2, title: "Conversão Assistida", desc: "A IA intervém apenas quando o lead demonstra dúvida real." }
               ].map((item, i) => (
                 <li key={i} className="flex items-center gap-6 group">
                   <div className="w-12 h-12 rounded-2xl bg-emerald-500/5 text-emerald-500 flex items-center justify-center ring-1 ring-emerald-500/10 group-hover:scale-110 transition-transform">
                      <item.icon size={20} />
                   </div>
                   <div>
                     <h4 className="text-white font-black text-lg mb-1">{item.title}</h4>
                     <p className="text-slate-500 text-sm">{item.desc}</p>
                   </div>
                 </li>
               ))}
            </ul>
            <button onClick={() => onNavigate(AppView.CHECKOUT)} className="btn-primary px-10 py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] shadow-xl">
              Escalar Meus Canais
            </button>
          </div>
          <div className="lg:w-1/2 relative">
             <div className="absolute -inset-10 bg-emerald-500/5 rounded-full blur-[100px]" />
             <div className="relative z-10 w-full max-w-[340px] mx-auto border-[10px] border-slate-900 rounded-[3.5rem] bg-slate-950 overflow-hidden shadow-2xl aspect-[9/18]">
                <div className="p-6 space-y-6">
                   <div className="bg-white/5 rounded-2xl p-4 text-[11px] text-slate-300 max-w-[85%] border border-white/5 animate-fade-in">
                      Olá! Vi que o Pix do seu pedido Alpha expirou. Consigo renovar com 15% OFF se fechar agora. Topa?
                   </div>
                   <div className="flex items-center gap-3 animate-pulse bg-white/5 p-3 rounded-2xl border border-white/5 mt-10">
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" />
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce delay-100" />
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce delay-200" />
                      </div>
                      <span className="text-[9px] text-emerald-500 font-black uppercase tracking-widest">IA Gravando Áudio...</span>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* WayIA Neural Section - Enterprise Focus */}
      <section id="neural" className="py-40 px-10 relative border-t border-white/5 bg-[#010411]">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-purple-500/10 border border-purple-500/20 mb-12">
            <Sparkles size={16} className="text-purple-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-400">WayIA Flow 2.0 Neural Engine</span>
          </div>
          
          <h2 className="text-5xl md:text-8xl font-black tracking-tighter mb-10 leading-[0.85]">
            Sincronia <span className="text-purple-500 italic">Cognitiva</span>.
          </h2>
          
          <p className="text-xl md:text-2xl text-slate-400 max-w-4xl mx-auto mb-24 leading-relaxed font-medium">
            O cérebro que orquestra suas vendas. Nossa IA neural processa o sentimento do cliente e decide a melhor estratégia de fechamento em milissegundos.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
             {[
               { icon: Cpu, title: "Neural Builder", desc: "Crie agentes especialistas treinados com seus dados em poucos segundos." },
               { icon: Activity, title: "Análise de Tom", desc: "A IA detecta urgência ou frustração e adapta o discurso automaticamente." },
               { icon: Globe, title: "Global Scale", desc: "Atendimento multilíngue com perfeição gramatical e regional." }
             ].map((item, i) => (
               <div key={i} className="p-12 glass rounded-[3rem] border border-white/5 hover:border-purple-500/30 transition-all duration-700 group text-left shadow-2xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-125 transition-transform"><item.icon size={80} /></div>
                 <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-400 mb-10 border border-purple-500/20">
                   <item.icon size={28} />
                 </div>
                 <h3 className="text-2xl font-black mb-4 text-white tracking-tight">{item.title}</h3>
                 <p className="text-slate-500 text-sm leading-relaxed font-medium">{item.desc}</p>
               </div>
             ))}
          </div>

          <div className="mt-40 p-16 glass rounded-[4rem] border border-white/10 bg-gradient-to-br from-purple-500/5 via-transparent to-orange-500/5 text-left relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-16 opacity-10 group-hover:scale-110 transition-transform">
               <Zap size={200} />
             </div>
             <div className="relative z-10 max-w-3xl">
                <h3 className="text-4xl md:text-6xl font-black mb-8 leading-tight">Mude o patamar da sua <br /> operação hoje.</h3>
                <p className="text-slate-400 text-lg mb-12 font-medium">
                   Junte-se a centenas de empresas que escalaram sua infraestrutura de atendimento via WayFlow iA.
                </p>
                <div className="flex flex-wrap gap-6">
                   <button onClick={() => onNavigate(AppView.CHECKOUT)} className="px-12 py-5 bg-white text-slate-950 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all shadow-2xl">
                      Assinar Plano Enterprise
                   </button>
                   <button onClick={() => onNavigate(AppView.LOGIN)} className="px-10 py-5 glass text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-white/10 transition-all border border-white/10">
                      Entrar no Dashboard
                   </button>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Modern Footer */}
      <footer className="py-32 px-10 border-t border-white/5 bg-[#020617] relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-20 mb-32 text-center md:text-left">
            <div className="md:col-span-2 space-y-8">
               <Logo className="h-12 w-auto mx-auto md:mx-0" />
               <p className="text-slate-500 max-w-sm mx-auto md:mx-0 leading-relaxed font-medium text-sm">
                 A maior infraestrutura de automação neural do Brasil. Recuperação de checkouts e automação de vendas para empresas que não aceitam limites.
               </p>
               <div className="flex justify-center md:justify-start gap-6">
                 <button className="w-10 h-10 glass rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors text-slate-400 hover:text-white"><Globe size={18} /></button>
                 <button className="w-10 h-10 glass rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors text-slate-400 hover:text-white"><MessageCircle size={18} /></button>
                 <button className="w-10 h-10 glass rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors text-slate-400 hover:text-white"><Smartphone size={18} /></button>
               </div>
            </div>
            <div className="space-y-8">
               <h4 className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Plataforma</h4>
               <div className="flex flex-col gap-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">
                  <button onClick={() => scrollTo('tech')} className="hover:text-white transition-colors text-left">Tecnologia</button>
                  <button onClick={() => scrollTo('whatsapp')} className="hover:text-white transition-colors text-left">WhatsApp Engine</button>
                  <button onClick={() => scrollTo('neural')} className="hover:text-white transition-colors text-left">IA Neural</button>
                  <button onClick={() => onNavigate(AppView.CHECKOUT)} className="hover:text-white transition-colors text-left">Planos</button>
               </div>
            </div>
            <div className="space-y-8">
               <h4 className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Corporativo</h4>
               <div className="flex flex-col gap-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">
                  <button onClick={() => onNavigate(AppView.LOGIN)} className="hover:text-white transition-colors text-left">Login Alpha</button>
                  <button className="hover:text-white transition-colors text-left">Suporte 24/7</button>
                  <button className="hover:text-white transition-colors text-left">Docs API</button>
                  <button className="hover:text-white transition-colors text-left">Privacidade</button>
               </div>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-10 pt-20 border-t border-white/5">
            <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">© 2025 WayFlow iA. Pioneirismo Neural.</p>
            <div className="flex items-center gap-10">
               <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Alpha Nodes Active</span>
               </div>
               <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest italic tracking-tighter">Powered by Evolution API</p>
            </div>
          </div>
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes dash { to { stroke-dashoffset: -1000; } }
        @keyframes moveCursor {
          0%, 100% { transform: translate(-50%, -50%) translate(0, 0); }
          50% { transform: translate(-50%, -50%) translate(300px, 150px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.8s ease-out forwards;
        }
        @keyframes progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}} />
    </div>
  );
};

export default Landing;
