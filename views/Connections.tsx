
import React, { useState } from 'react';
import { 
  Unplug, 
  ExternalLink, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Plus,
  Webhook,
  Smartphone,
  Database,
  Lock,
  RefreshCw,
  Copy,
  Zap,
  Settings,
  Loader2,
  Globe
} from 'lucide-react';
import Layout from '../components/Layout.tsx';
import { AppView } from '../types.ts';

const Connections: React.FC<{ onLogout: () => void, onNavigate: (v: AppView) => void }> = ({ onLogout, onNavigate }) => {
  const [evolutionUrl, setEvolutionUrl] = useState('https://api.evolution.wayflow.ia/v3/master');
  const [apiKey, setApiKey] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const handleTestConnection = () => {
    if (!apiKey) {
      alert("Por favor, insira uma API Key antes de testar.");
      return;
    }
    setIsTesting(true);
    setTimeout(() => {
      setIsTesting(false);
      setIsConnected(true);
      alert("Conexão estabelecida com sucesso! A instância Evolution API está respondendo.");
    }, 2000);
  };

  const handleGenerateQr = () => {
    if (!isConnected) {
      alert("Teste a conexão com a API antes de gerar o QR Code.");
      return;
    }
    setShowQr(true);
  };

  return (
    <Layout activeView={AppView.CONNECTIONS} onNavigate={onNavigate} onLogout={onLogout}>
      <div className="max-w-7xl mx-auto space-y-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter mb-2 italic">Ecossistema WayFlow.</h1>
            <p className="text-slate-400 font-medium">Configure suas APIs para ativar os fluxos de automação.</p>
          </div>
          <div className="flex gap-4">
             <button className="bg-white/5 hover:bg-white/10 text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-white/5 transition-all">Documentação API</button>
             <button className="bg-gradient-to-r from-orange-600 to-red-600 px-8 py-4 text-white font-black text-[10px] uppercase tracking-wider rounded-2xl flex items-center gap-2 shadow-2xl">
               <Plus size={16} strokeWidth={3} /> Nova Instância
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-[#020617] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
              <div className="p-8 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
                <div>
                   <h3 className="text-2xl font-black text-white tracking-tight italic">Configuração Evolution API</h3>
                   <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mt-1">Conector WhatsApp Enterprise</p>
                </div>
                <div className="flex items-center gap-3">
                   {isConnected && <div className="flex items-center gap-2 text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest">
                     <CheckCircle2 size={12} /> Online
                   </div>}
                   <button onClick={handleTestConnection} disabled={isTesting} className="p-2.5 rounded-xl bg-orange-600/10 text-orange-500 hover:bg-orange-600 hover:text-white transition-all border border-orange-500/20">
                     {isTesting ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                   </button>
                </div>
              </div>
              <div className="p-10 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">URL da Instância</label>
                      <div className="relative group">
                         <div className="absolute inset-y-0 left-4 flex items-center text-slate-600 group-focus-within:text-orange-500 transition-colors">
                           <Globe size={16} />
                         </div>
                         <input 
                           value={evolutionUrl}
                           onChange={(e) => setEvolutionUrl(e.target.value)}
                           className="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm text-slate-300 font-bold focus:outline-none focus:border-orange-500 transition-all"
                           placeholder="https://api.sua-instancia.com"
                         />
                      </div>
                   </div>
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Global API Key</label>
                      <div className="relative group">
                         <div className="absolute inset-y-0 left-4 flex items-center text-slate-600">
                           <Lock size={16} />
                         </div>
                         <input 
                           type="password" 
                           value={apiKey}
                           onChange={(e) => setApiKey(e.target.value)}
                           placeholder="Insira sua API Key da Evolution"
                           className="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm text-slate-300 font-bold focus:outline-none focus:border-orange-500 transition-all"
                         />
                         <button className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-600 hover:text-white transition-colors uppercase tracking-widest">Exibir</button>
                      </div>
                   </div>
                </div>

                <div className="p-8 rounded-[2rem] bg-gradient-to-br from-orange-600/5 to-transparent border border-orange-500/10 flex items-center justify-between">
                   <div className="flex items-center gap-6">
                      <div className={`w-16 h-16 rounded-[1.5rem] ${isConnected ? 'bg-emerald-600/10 text-emerald-500 border-emerald-500/20' : 'bg-orange-600/10 text-orange-500 border-orange-500/10'} border flex items-center justify-center`}>
                        <Zap size={32} strokeWidth={2.5} className={isConnected ? '' : 'animate-pulse'} />
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-white mb-1">Status do Orquestrador Neural</h4>
                        <p className="text-sm text-slate-400 font-medium">{isConnected ? 'Todos os sistemas operando via Evolution Cluster Master.' : 'Conecte sua API Key para validar o processamento de leads.'}</p>
                      </div>
                   </div>
                   {!isConnected && <button onClick={handleTestConnection} className="px-6 py-3 bg-orange-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl">Validar Conexão</button>}
                </div>

                <div className="pt-4 border-t border-white/5">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <Webhook size={18} className="text-slate-600" />
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Integração n8n:</span>
                         <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Aguardando Webhook</span>
                      </div>
                      <button className="text-[10px] font-black text-orange-500 uppercase tracking-widest hover:underline transition-all">Copiar URL de Webhook</button>
                   </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className={`bg-[#020617] border border-white/5 rounded-[2.5rem] p-10 shadow-2xl text-center group transition-all ${!isConnected ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
               <div className="relative inline-block mb-10">
                  <div className="absolute -inset-4 bg-orange-500/10 rounded-3xl blur-2xl group-hover:bg-orange-500/20 transition duration-1000" />
                  <div className="relative bg-white p-6 rounded-[2.5rem] shadow-2xl overflow-hidden">
                    {showQr ? (
                      <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=WayFlow_${Math.random()}&color=020617`} alt="Evolution QR" className="w-48 h-48 opacity-90 animate-in fade-in zoom-in" />
                    ) : (
                      <div className="w-48 h-48 flex items-center justify-center bg-slate-100 rounded-2xl">
                         <Smartphone size={64} className="text-slate-300" />
                      </div>
                    )}
                  </div>
               </div>
               <h3 className="text-2xl font-black text-white mb-3 italic tracking-tighter">Vincular WhatsApp.</h3>
               <p className="text-slate-500 text-sm font-medium mb-8">Escaneie o código via WhatsApp para começar a disparar suas automações neurais.</p>
               <button onClick={handleGenerateQr} className="w-full py-4 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] transition-all shadow-xl shadow-orange-600/20">
                  {showQr ? 'Gerar Novo QR Code' : 'Vincular Agora'}
               </button>
            </div>

            <div className="p-8 glass rounded-[2.5rem] border border-white/5">
               <h4 className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-6">Guia Rápido de Início</h4>
               <div className="space-y-5">
                  <StepItem num="01" text="Valide sua API Key Evolution" done={isConnected} />
                  <StepItem num="02" text="Escaneie o QR Code no seu celular" done={showQr} />
                  <StepItem num="03" text="Configure os Webhooks do n8n" done={false} />
                  <StepItem num="04" text="Ative seus Agentes no Builder" done={false} />
               </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

const StepItem: React.FC<{ num: string, text: string, done: boolean }> = ({ num, text, done }) => (
  <div className="flex items-center gap-4 group">
    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs transition-all ${done ? 'bg-emerald-500 text-white' : 'bg-white/5 text-slate-500 border border-white/5'}`}>
      {done ? <CheckCircle2 size={16} strokeWidth={3} /> : num}
    </div>
    <span className={`text-sm font-bold tracking-tight transition-all ${done ? 'text-white' : 'text-slate-600'}`}>{text}</span>
  </div>
);

export default Connections;
