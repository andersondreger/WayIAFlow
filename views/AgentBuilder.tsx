import React, { useState } from 'react';
import { 
  Bot, Sparkles, Terminal, Save, Zap, RefreshCw, Layers, Cpu, 
  MessageSquareCode, Settings2, ShieldCheck, ChevronRight, Activity, BrainCircuit,
  Loader2
} from 'lucide-react';
import Layout from '../components/Layout.tsx';
import { AppView, LLMModel } from '../types.ts';
import { generateAgentContext } from '../services/geminiService.ts';

const AgentBuilder: React.FC<{ onLogout: () => void, onNavigate: (v: AppView) => void }> = ({ onLogout, onNavigate }) => {
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [agentName, setAgentName] = useState('WayFlow iA Alpha');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState<LLMModel>('gemini-3-pro-preview');
  const [temp, setTemp] = useState(0.8);

  const models = [
    { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro', desc: 'Melhor para raciocínio complexo e vendas consultivas.', icon: BrainCircuit, color: 'text-purple-500' },
    { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash', desc: 'Latência ultra-baixa, ideal para atendimento rápido.', icon: Zap, color: 'text-orange-500' },
    { id: 'gemini-2.5-flash-native-audio-preview-09-2025', name: 'Gemini 2.5 Audio', desc: 'Processamento nativo de mensagens de voz.', icon: MessageSquareCode, color: 'text-emerald-500' },
  ];

  const handleGenerate = async () => {
    if (!description) return;
    setIsGenerating(true);
    try {
      const result = await generateAgentContext(description);
      setAgentName(result.name);
      setSystemPrompt(result.systemPrompt);
      setTemp(result.suggestedTemperature || 0.8);
    } catch (error) {
      console.error(error);
      alert('Erro ao gerar contexto.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Layout activeView={AppView.AGENT_BUILDER} onNavigate={onNavigate} onLogout={onLogout}>
      <div className="max-w-7xl mx-auto space-y-8 animate-in slide-in-from-bottom-6 duration-700">
        
        {/* Top Branding Section */}
        <div className="bg-gradient-to-br from-slate-900 to-[#020617] border border-white/5 p-10 rounded-[3rem] relative overflow-hidden shadow-2xl">
           <div className="absolute top-0 right-0 p-12 opacity-10 animate-pulse"><Sparkles size={180} className="text-orange-500" /></div>
           <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="max-w-2xl text-center md:text-left">
                 <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-orange-600/10 border border-orange-500/20 rounded-full mb-6">
                    <Activity size={14} className="text-orange-500" />
                    <span className="text-[10px] font-black text-orange-500 uppercase tracking-[0.3em]">WayIA Neural Engine v2.4</span>
                 </div>
                 <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter italic leading-none mb-6">Forge do Agente Neural.</h1>
                 <p className="text-slate-400 text-lg font-medium leading-relaxed">Descreva seu negócio e deixe nossa IA mestre construir o cérebro do seu atendimento automatizado.</p>
              </div>
              <button className="px-10 py-5 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl shadow-orange-600/20 transition-all flex items-center gap-3 active:scale-95">
                 <Save size={18} /> Publicar Agente na API
              </button>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Config Panel */}
          <div className="space-y-8">
             <div className="bg-[#020617] border border-white/5 p-8 rounded-[2.5rem] shadow-xl space-y-8">
                <div className="flex items-center gap-3 mb-2">
                   <Terminal size={18} className="text-orange-500" />
                   <h3 className="text-sm font-black text-white uppercase tracking-widest">Base de Conhecimento</h3>
                </div>
                <div className="space-y-4">
                   <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ex: Minha empresa vende cursos de marketing digital com foco em ROI. O tom deve ser profissional e persuasivo..."
                    className="w-full h-48 bg-white/[0.02] border border-white/10 rounded-2xl p-6 text-sm text-slate-300 font-medium focus:outline-none focus:border-orange-500 transition-all resize-none placeholder:text-slate-700"
                   />
                   <button 
                    onClick={handleGenerate}
                    disabled={isGenerating || !description}
                    className="w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest border border-white/10 flex items-center justify-center gap-3 transition-all"
                   >
                     {/* Added Loader2 to lucide-react imports to fix missing component error */}
                     {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />} 
                     Construir Arquitetura Cognitiva
                   </button>
                </div>
             </div>

             <div className="bg-[#020617] border border-white/5 p-8 rounded-[2.5rem] shadow-xl space-y-8">
                <div className="flex items-center gap-3">
                   <Cpu size={18} className="text-orange-500" />
                   <h3 className="text-sm font-black text-white uppercase tracking-widest">Parâmetros Neurais</h3>
                </div>
                <div className="space-y-6">
                   <div>
                      <div className="flex justify-between mb-4">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Temperatura</span>
                        <span className="text-xs font-black text-orange-500">{temp}</span>
                      </div>
                      <input 
                        type="range" min="0" max="1" step="0.1" 
                        value={temp} 
                        onChange={(e) => setTemp(parseFloat(e.target.value))}
                        className="w-full accent-orange-600 h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer" 
                      />
                   </div>
                   <div className="p-4 bg-orange-600/5 border border-orange-500/10 rounded-2xl">
                      <p className="text-[10px] text-orange-500 font-bold leading-relaxed">Nota: Temperaturas mais altas (0.8+) tornam a IA mais criativa em vendas.</p>
                   </div>
                </div>
             </div>
          </div>

          {/* Right Main Content */}
          <div className="lg:col-span-2 space-y-8">
             {/* Model Selection */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {models.map(m => (
                  <div 
                    key={m.id}
                    onClick={() => setSelectedModel(m.id as LLMModel)}
                    className={`p-6 rounded-3xl border cursor-pointer transition-all flex flex-col items-center text-center gap-4 ${selectedModel === m.id ? 'bg-white/[0.03] border-orange-500 shadow-xl shadow-orange-500/5' : 'bg-[#020617] border-white/5 hover:border-white/20'}`}
                  >
                     <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-white/5 ${m.color}`}>
                        <m.icon size={24} />
                     </div>
                     <div>
                        <h4 className="text-sm font-black text-white mb-1">{m.name}</h4>
                        <p className="text-[10px] text-slate-500 font-medium leading-tight">{m.desc}</p>
                     </div>
                  </div>
                ))}
             </div>

             {/* System Prompt Area */}
             <div className="bg-[#020617] border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-orange-600/10 text-orange-500 rounded-2xl flex items-center justify-center">
                         <Bot size={24} />
                      </div>
                      <div>
                         <input 
                          value={agentName}
                          onChange={(e) => setAgentName(e.target.value)}
                          className="bg-transparent border-none text-xl font-black text-white p-0 focus:ring-0 w-full italic tracking-tight"
                         />
                         <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Status: Configurando Contexto</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/5">
                      <ShieldCheck size={14} className="text-emerald-500" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocolo Seguro</span>
                   </div>
                </div>

                <div className="p-10 space-y-6">
                   <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Instruções Mestre de Atendimento</h4>
                      <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest bg-orange-500/10 px-2 py-1 rounded">WayFlow Optimized Prompt</span>
                   </div>
                   <textarea 
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    placeholder="O prompt estruturado aparecerá aqui após a construção..."
                    className="w-full h-[400px] bg-slate-950 border border-white/5 rounded-3xl p-8 text-sm text-slate-300 font-mono leading-relaxed focus:outline-none focus:border-orange-500/50 transition-all custom-scrollbar"
                   />
                </div>
             </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AgentBuilder;