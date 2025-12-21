
import React, { useState } from 'react';
import { 
  Bot, 
  Sparkles, 
  Terminal, 
  Save, 
  Zap,
  RefreshCw,
  Copy,
  Plus
} from 'lucide-react';
import Layout from '../components/Layout.tsx';
import { AppView } from '../types.ts';
import { generateAgentContext } from '../services/geminiService.ts';

const AgentBuilder: React.FC<{ onLogout: () => void, onNavigate: (v: AppView) => void }> = ({ onLogout, onNavigate }) => {
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [agentName, setAgentName] = useState('WayFlow iA Core');
  const [systemPrompt, setSystemPrompt] = useState('Você é um assistente inteligente mestre da WayFlow iA.');
  const [temp, setTemp] = useState(0.7);

  const handleGenerate = async () => {
    if (!description) return;
    setIsGenerating(true);
    try {
      const result = await generateAgentContext(description);
      setAgentName(result.name);
      setSystemPrompt(result.systemPrompt);
      setTemp(result.suggestedTemperature || 0.7);
    } catch (error) {
      console.error(error);
      alert('Erro ao gerar contexto. Verifique sua chave API.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Layout activeView={AppView.AGENT_BUILDER} onNavigate={onNavigate} onLogout={onLogout}>
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-gradient-to-r from-orange-600 to-red-600 p-8 rounded-[2rem] shadow-2xl shadow-orange-600/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] -translate-y-1/2 translate-x-1/2 rounded-full" />
          <div className="relative z-10">
            <h1 className="text-3xl font-black text-white mb-2 flex items-center gap-3">
              <Sparkles size={32} /> Criar Agente Neural WayFlow
            </h1>
            <p className="text-orange-100 max-w-xl">
              Descreva seu negócio e deixe nossa IA mestre construir o contexto perfeito para seu assistente de vendas.
            </p>
          </div>
          <button className="relative z-10 px-6 py-3 bg-white text-orange-600 font-bold rounded-2xl shadow-xl hover:bg-slate-100 transition-all flex items-center gap-2 active:scale-95">
            <Save size={20} /> Salvar Agente
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel: Instructions */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Terminal size={18} className="text-orange-400" /> Input do Negócio
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Descrição da Empresa</label>
                  <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ex: Loja de eletrônicos premium... WayFlow irá cuidar do tom de voz."
                    className="w-full h-40 bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-orange-500 transition-all resize-none"
                  />
                </div>
                <button 
                  onClick={handleGenerate}
                  disabled={isGenerating || !description}
                  className="w-full bg-orange-600 hover:bg-orange-500 disabled:opacity-50 py-4 rounded-xl text-white font-bold shadow-lg shadow-orange-600/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  {isGenerating ? <RefreshCw className="animate-spin" size={20} /> : <><Zap size={20} /> Gerar com IA Core</>}
                </button>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
              <h3 className="text-lg font-bold text-white mb-4">Configurações Base</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Criatividade (Temperature)</label>
                    <span className="text-xs font-bold text-orange-400">{temp}</span>
                  </div>
                  <input 
                    type="range" min="0" max="1" step="0.1" 
                    value={temp} 
                    onChange={(e) => setTemp(parseFloat(e.target.value))}
                    className="w-full accent-orange-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer" 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: Agent Configuration */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center text-white">
                    <Bot size={28} />
                  </div>
                  <div>
                    <input 
                      type="text" 
                      value={agentName}
                      onChange={(e) => setAgentName(e.target.value)}
                      className="bg-transparent border-none text-xl font-bold text-white p-0 focus:ring-0 w-full"
                    />
                    <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Neural Engine Preview</p>
                  </div>
                </div>
              </div>

              <div className="p-8 space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">System Instructions (Contexto Neural)</label>
                    <span className="px-2 py-0.5 bg-orange-500/10 text-orange-400 text-[10px] font-bold rounded">WayFlow Optimized</span>
                  </div>
                  <textarea 
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    className="w-full h-80 bg-slate-950 border border-slate-800 rounded-2xl p-6 text-sm text-slate-300 font-mono leading-relaxed focus:outline-none focus:border-orange-500 transition-all custom-scrollbar"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <button className="px-8 py-4 bg-white text-slate-950 font-black rounded-2xl hover:bg-slate-200 transition-all shadow-xl active:scale-95">
                    TESTAR AGENTE
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AgentBuilder;
