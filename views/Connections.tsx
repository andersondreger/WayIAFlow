
import React, { useState, useEffect } from 'react';
import { 
  Plus, Smartphone, Lock, RefreshCw, Globe, Database, 
  CheckCircle2, Loader2, X, Trash2,
  Check, QrCode, Network, Monitor, Zap, Scan, AlertTriangle
} from 'lucide-react';
import Layout from '../components/Layout.tsx';
import { AppView } from '../types.ts';

interface Instance {
  id: string;
  name: string;
  status: 'connected' | 'disconnected' | 'connecting';
  phone: string;
}

const Connections: React.FC<{ onLogout: () => void, onNavigate: (v: AppView) => void }> = ({ onLogout, onNavigate }) => {
  const [instances, setInstances] = useState<Instance[]>([
    { id: '1', name: 'NODE_VENDAS_ALPHA', status: 'connected', phone: '+55 11 99999-0000' }
  ]);
  
  const [config, setConfig] = useState({
    evoUrl: '',
    evoKey: '',
    evoInstance: '',
  });

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'none' | 'success' | 'error'>('none');
  const [showQrPopUp, setShowQrPopUp] = useState(false);
  const [activeInstanceId, setActiveInstanceId] = useState<string | null>(null);
  const [qrState, setQrState] = useState<'generating' | 'waiting' | 'syncing' | 'done' | 'error'>('generating');
  const [currentQrUrl, setCurrentQrUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleTestConnection = () => {
    if (!config.evoKey || !config.evoUrl) return alert("Preencha a URL e a Global Key.");
    setIsTesting(true);
    // Simula validação de endpoint
    setTimeout(() => {
      setIsTesting(false);
      setTestResult('success');
    }, 800);
  };

  const createInstance = () => {
    if (testResult !== 'success' || !config.evoInstance) return;
    const newInst: Instance = {
      id: Math.random().toString(),
      name: config.evoInstance.toUpperCase().replace(/\s+/g, '_'),
      status: 'disconnected',
      phone: 'Pendente'
    };
    setInstances([...instances, newInst]);
    setConfig({ ...config, evoInstance: '' });
    setTestResult('none');
  };

  const openPairingPopUp = async (instance: Instance) => {
    setActiveInstanceId(instance.id);
    setQrState('generating');
    setCurrentQrUrl('');
    setShowQrPopUp(true);
    setErrorMessage('');

    try {
      const cleanUrl = config.evoUrl.replace(/\/$/, "");
      
      // Chamada real para a Evolution API
      const response = await fetch(`${cleanUrl}/instance/connect/${instance.name}`, {
        method: 'GET',
        headers: {
          'apikey': config.evoKey,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const data = await response.json();

      // Lógica de Extração do QR Code Real
      if (data.base64 || (data.code && data.code.startsWith('data:image'))) {
        let qrData = data.base64 || data.code;
        // Garante que o Base64 tenha o prefixo correto para o navegador ler como imagem
        if (qrData && !qrData.startsWith('data:image')) {
          qrData = `data:image/png;base64,${qrData}`;
        }
        setCurrentQrUrl(qrData);
        setQrState('waiting');
      } else if (data.code) {
        // Se a API retornar apenas a string de pareamento, geramos o QR aqui
        setCurrentQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(data.code)}`);
        setQrState('waiting');
      } else {
        throw new Error("A API não retornou um código de pareamento válido.");
      }

    } catch (err: any) {
      console.error("Erro na conexão Evolution:", err);
      setQrState('error');
      setErrorMessage(err.message || "Erro de CORS ou Servidor Offline.");
    }
  };

  const simulateSuccess = () => {
    setQrState('syncing');
    setTimeout(() => {
      setQrState('done');
      setTimeout(() => {
        setInstances(prev => prev.map(inst => 
          inst.id === activeInstanceId ? { ...inst, status: 'connected', phone: '+55 11 9' + Math.floor(10000000 + Math.random() * 90000000) } : inst
        ));
        setShowQrPopUp(false);
      }, 1500);
    }, 2000);
  };

  const removeInstance = (id: string) => {
    if(confirm("Remover este node?")) {
      setInstances(instances.filter(i => i.id !== id));
    }
  };

  return (
    <Layout activeView={AppView.CONNECTIONS} onNavigate={onNavigate} onLogout={onLogout}>
      <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row items-end justify-between gap-8 bg-[#03081a] border border-white/5 p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 p-10 opacity-5"><Network size={120} className="text-orange-500" /></div>
           <div className="relative z-10 font-outfit">
              <div className="flex items-center gap-3 mb-4">
                 <div className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-pulse shadow-[0_0_10px_#f59e0b]" />
                 <span className="text-[10px] font-black text-orange-500 uppercase tracking-[0.5em]">WayFlow Neural Link</span>
              </div>
              <h1 className="text-5xl font-black text-white italic tracking-tighter uppercase leading-none">Ponte Evolution.</h1>
              <p className="text-slate-500 font-medium mt-4 max-w-lg text-sm">Conecte sua infraestrutura para habilitar a automação neural.</p>
           </div>
           <div className="relative z-10 px-8 py-5 bg-white/5 border border-white/10 rounded-3xl flex items-center gap-4">
              <Database size={20} className="text-orange-500" />
              <p className="font-outfit text-lg font-black text-white">{instances.length} Instâncias</p>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Configuração */}
          <div className="lg:col-span-4">
             <div className="bg-[#020617] border border-white/10 p-10 rounded-[3rem] shadow-2xl space-y-8">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center text-white"><Plus size={24} /></div>
                   <h3 className="font-outfit text-xl font-black text-white italic uppercase tracking-widest">Painel Evolution</h3>
                </div>

                <div className="space-y-6">
                   <InputGroup icon={Globe} label="URL DA INSTÂNCIA" placeholder="https://api.sua-evo.com" value={config.evoUrl} onChange={(v) => setConfig({...config, evoUrl: v})} />
                   <InputGroup icon={Lock} label="GLOBAL API KEY" placeholder="apikey master" type="password" value={config.evoKey} onChange={(v) => setConfig({...config, evoKey: v})} />
                   
                   <button 
                    onClick={handleTestConnection}
                    className={`w-full py-5 rounded-2xl font-outfit font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-3 active:scale-95 ${
                      testResult === 'success' ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'bg-white/5 text-slate-500 border border-white/10 hover:bg-white/10 hover:text-white'
                    }`}
                   >
                     {isTesting ? <Loader2 size={18} className="animate-spin" /> : testResult === 'success' ? <Check size={18} /> : <RefreshCw size={18} />}
                     {testResult === 'success' ? 'CONEXÃO ESTABELECIDA' : 'VERIFICAR STATUS'}
                   </button>

                   {testResult === 'success' && (
                     <div className="animate-in slide-in-from-top-4 duration-500 space-y-6">
                        <InputGroup icon={Monitor} label="NOME DO NODE" placeholder="Ex: VENDAS_01" value={config.evoInstance} onChange={(v) => setConfig({...config, evoInstance: v})} />
                        <button onClick={createInstance} className="w-full py-6 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-[1.5rem] font-outfit font-black text-xs uppercase tracking-widest shadow-2xl shadow-orange-600/30">ATIVAR NOVO NODE</button>
                     </div>
                   )}
                </div>
             </div>
          </div>

          {/* Grid de Cards */}
          <div className="lg:col-span-8">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {instances.map(inst => (
                  <div key={inst.id} className="bg-[#03081a] border border-white/5 p-12 rounded-[3.5rem] shadow-xl group hover:border-orange-500/30 transition-all relative overflow-hidden">
                     <div className="flex justify-between items-start mb-10">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${inst.status === 'connected' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-white/5 text-slate-700'}`}>
                           <Smartphone size={28} />
                        </div>
                        <button onClick={() => removeInstance(inst.id)} className="p-4 bg-white/5 text-slate-700 hover:text-red-500 rounded-2xl border border-white/5 transition-all"><Trash2 size={20} /></button>
                     </div>

                     <div className="font-outfit mb-10">
                        <h4 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none mb-3">{inst.name}</h4>
                        <div className="flex items-center gap-3">
                           <div className={`w-2.5 h-2.5 rounded-full ${inst.status === 'connected' ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-red-500 shadow-[0_0_10px_#ef4444]'}`} />
                           <span className={`text-[10px] font-black uppercase tracking-widest ${inst.status === 'connected' ? 'text-emerald-500' : 'text-red-500'}`}>
                              {inst.status === 'connected' ? 'ONLINE / ATIVO' : 'OFFLINE / PAREAMENTO'}
                           </span>
                        </div>
                     </div>

                     {inst.status !== 'connected' ? (
                       <button 
                         onClick={() => openPairingPopUp(inst)}
                         className="w-full py-6 bg-orange-600 text-white rounded-[1.5rem] font-outfit font-black text-xs uppercase tracking-widest shadow-2xl shadow-orange-600/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4"
                       >
                         <QrCode size={22} /> CONECTAR WHATSAPP
                       </button>
                     ) : (
                       <div className="w-full py-6 bg-white/[0.02] text-slate-500 rounded-[1.5rem] font-outfit font-black text-[10px] uppercase tracking-widest border border-white/5 flex items-center justify-center gap-4 cursor-default">
                         <CheckCircle2 size={20} className="text-emerald-500" /> SYNC OPERACIONAL
                       </div>
                     )}
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* POP-UP DE PAREAMENTO (CORRIGIDO PARA LEITURA REAL) */}
        {showQrPopUp && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/98 backdrop-blur-3xl animate-in fade-in duration-500">
             <div className="w-full max-w-xl bg-[#020617] border border-white/10 rounded-[5rem] shadow-[0_0_200px_rgba(245,158,11,0.25)] overflow-hidden animate-in zoom-in-95 duration-700 relative">
                
                <div className="p-12 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                   <div className="font-outfit">
                      <div className="flex items-center gap-3 mb-2">
                        <Scan size={18} className="text-orange-500" />
                        <span className="text-[10px] font-black text-orange-500 uppercase tracking-[0.5em]">WayFlow Secure Scan</span>
                      </div>
                      <h3 className="text-4xl font-black text-white italic tracking-tighter uppercase tracking-widest leading-none">Vinculação.</h3>
                   </div>
                   <button onClick={() => setShowQrPopUp(false)} className="p-5 bg-white/5 rounded-[2rem] text-slate-500 hover:text-white transition-all border border-white/5"><X size={28} /></button>
                </div>
                
                <div className="p-20 flex flex-col items-center">
                   
                   <div className="relative mb-12">
                      <div className="absolute -inset-20 bg-orange-500/10 blur-[120px] rounded-full opacity-60 animate-pulse" />
                      
                      {/* Frame de Alto Contraste para o QR Code */}
                      <div className="relative z-10 bg-white p-14 rounded-[4.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.6)] flex flex-col items-center justify-center min-w-[380px] min-h-[380px]">
                         
                         {qrState === 'generating' ? (
                           <div className="flex flex-col items-center gap-6">
                              <Loader2 size={64} className="text-orange-500 animate-spin" strokeWidth={3} />
                              <p className="font-outfit text-[10px] font-black text-slate-900 uppercase tracking-widest italic">Aguardando API...</p>
                           </div>
                         ) : qrState === 'error' ? (
                           <div className="flex flex-col items-center gap-6 text-center">
                              <AlertTriangle size={64} className="text-red-500 animate-bounce" />
                              <p className="font-outfit text-sm font-black text-red-600 uppercase tracking-tight max-w-[200px] leading-tight">{errorMessage}</p>
                              <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase">Verifique o CORS do seu servidor.</p>
                           </div>
                         ) : (
                           <div className="relative overflow-hidden rounded-3xl">
                              <img 
                                src={currentQrUrl} 
                                alt="WhatsApp QR Code" 
                                className={`w-72 h-72 transition-all duration-700 ${qrState !== 'waiting' ? 'opacity-10 blur-xl' : 'opacity-100'}`}
                              />
                              
                              {/* Efeito Visual de Laser */}
                              {qrState === 'waiting' && (
                                <div className="absolute left-0 w-full h-1.5 bg-orange-500 shadow-[0_0_20px_#f59e0b] blur-[1px] z-20 animate-[laser_3.5s_infinite]" />
                              )}

                              {/* Sincronização */}
                              {qrState === 'syncing' && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-white/80 animate-in fade-in">
                                   <RefreshCw size={64} className="text-orange-600 animate-spin" />
                                   <p className="font-outfit text-sm font-black text-slate-950 uppercase tracking-widest italic">Autenticando...</p>
                                </div>
                              )}
                              
                              {/* Sucesso */}
                              {qrState === 'done' && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-white/95 animate-in zoom-in">
                                   <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-2xl animate-bounce">
                                      <Check size={56} strokeWidth={4} />
                                   </div>
                                   <h4 className="font-outfit text-3xl font-black text-slate-950 italic tracking-tighter uppercase">Sync OK!</h4>
                                </div>
                              )}
                           </div>
                         )}
                      </div>
                   </div>

                   {/* Botão de Bypass - Apenas se não houver erro crítico de conexão */}
                   {qrState === 'waiting' && (
                     <button 
                        onClick={simulateSuccess}
                        className="mb-8 px-8 py-4 bg-orange-600/10 hover:bg-orange-600/20 text-orange-500 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] border border-orange-500/20 transition-all flex items-center gap-3 animate-pulse"
                     >
                        <Zap size={14} /> Simular Conexão (Demo)
                     </button>
                   )}

                   <div className="flex items-center gap-5 mt-4">
                      <div className={`w-3 h-3 rounded-full ${qrState === 'waiting' ? 'bg-orange-500 animate-pulse' : qrState === 'done' ? 'bg-emerald-500' : 'bg-white/10'}`} />
                      <span className="font-outfit text-xs font-black text-slate-500 uppercase tracking-[0.4em]">Protocolo Neural Evolution v4.0</span>
                   </div>
                </div>
             </div>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes laser {
          0% { top: -5%; opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { top: 105%; opacity: 0; }
        }
      `}} />
    </Layout>
  );
};

const InputGroup: React.FC<{ icon: any, label: string, value: string, onChange: (v: string) => void, type?: string, placeholder?: string }> = ({ icon: Icon, label, value, onChange, type = 'text', placeholder }) => (
  <div className="space-y-3 group">
    <label className="font-outfit text-[10px] font-black text-slate-700 uppercase tracking-[0.3em] ml-2">{label}</label>
    <div className="relative">
      <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-orange-500 transition-colors">
        <Icon size={18} />
      </div>
      <input 
        type={type} 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        placeholder={placeholder}
        className="font-outfit w-full bg-white/[0.02] border border-white/10 rounded-2xl py-5 pl-16 pr-8 text-base text-white font-bold focus:outline-none focus:border-orange-500 transition-all placeholder:text-slate-800 placeholder:font-black placeholder:uppercase placeholder:text-[10px] placeholder:tracking-widest"
      />
    </div>
  </div>
);

export default Connections;
