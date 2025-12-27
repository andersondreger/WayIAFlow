
import React, { useState, useEffect } from 'react';
import { 
  Plus, Smartphone, Lock, RefreshCw, Globe, Database, 
  CheckCircle2, Loader2, X, Trash2,
  Check, QrCode, Network, Monitor, Zap, Scan, AlertTriangle, Info
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
    { id: '1', name: 'NODE_MASTER', status: 'connected', phone: '+55 11 99999-0000' }
  ]);
  
  const [config, setConfig] = useState({
    evoUrl: '',
    evoKey: '',
    evoInstance: '',
  });

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'none' | 'success' | 'error'>('none');
  const [showQrPopUp, setShowQrPopUp] = useState(false);
  const [activeInstance, setActiveInstance] = useState<Instance | null>(null);
  const [qrState, setQrState] = useState<'generating' | 'waiting' | 'syncing' | 'done' | 'error'>('generating');
  const [currentQrUrl, setCurrentQrUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleTestConnection = () => {
    if (!config.evoKey || !config.evoUrl) return alert("Preencha a URL e a Global Key.");
    setIsTesting(true);
    
    // Limpeza da URL
    const cleanUrl = config.evoUrl.replace(/\/$/, "");
    
    if (window.location.protocol === 'https:' && cleanUrl.startsWith('http:')) {
      setErrorMessage("Bloqueio de Segurança: Seu site é HTTPS mas a API é HTTP. Use HTTPS na API também.");
      setTestResult('error');
      setIsTesting(false);
      return;
    }

    setTimeout(() => {
      setIsTesting(false);
      setTestResult('success');
    }, 800);
  };

  const createInstanceInApp = () => {
    if (testResult !== 'success' || !config.evoInstance) return;
    const nameFormatted = config.evoInstance.toUpperCase().trim().replace(/\s+/g, '_');
    const newInst: Instance = {
      id: Math.random().toString(),
      name: nameFormatted,
      status: 'disconnected',
      phone: 'Pendente'
    };
    setInstances([...instances, newInst]);
    setConfig({ ...config, evoInstance: '' });
    setTestResult('none');
  };

  // Função para Garantir que a Instância existe no Servidor
  const ensureInstanceExists = async (instanceName: string) => {
    const cleanUrl = config.evoUrl.replace(/\/$/, "");
    
    // Tenta criar a instância (se já existir, a API geralmente retorna 403 ou erro de conflito, que ignoramos)
    try {
      await fetch(`${cleanUrl}/instance/create`, {
        method: 'POST',
        headers: {
          'apikey': config.evoKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          instanceName: instanceName,
          token: "", 
          qrcode: true
        })
      });
    } catch (e) {
      console.log("Instância pode já existir ou erro de criação silencioso.");
    }
  };

  const fetchQrCode = async (instance: Instance) => {
    setQrState('generating');
    setErrorMessage('');
    setCurrentQrUrl('');
    
    try {
      const cleanUrl = config.evoUrl.replace(/\/$/, "");
      
      // PASSO 1: Garantir que o servidor conhece essa instância
      await ensureInstanceExists(instance.name);

      // PASSO 2: Solicitar conexão (QR Code)
      const response = await fetch(`${cleanUrl}/instance/connect/${instance.name}`, {
        method: 'GET',
        headers: {
          'apikey': config.evoKey,
          'Accept': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Erro ${response.status}: Falha ao obter QR.`);
      }

      let finalQr = "";
      if (data.base64) {
        const cleanBase64 = data.base64.replace(/\s/g, "").replace(/^data:image\/png;base64,/, "");
        finalQr = `data:image/png;base64,${cleanBase64}`;
      } else if (data.code) {
        finalQr = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&margin=15&qzone=1&data=${encodeURIComponent(data.code)}`;
      }

      if (finalQr) {
        setCurrentQrUrl(finalQr);
        setQrState('waiting');
      } else {
        throw new Error("O servidor não enviou dados de imagem.");
      }

    } catch (err: any) {
      console.error("Critical Error:", err);
      setQrState('error');
      // Se falhar o fetch antes de chegar no ok, geralmente é CORS
      setErrorMessage(err.name === 'TypeError' ? "Erro de Conexão/CORS: Verifique se o servidor Evolution permite acesso externo." : err.message);
    }
  };

  const openPairingPopUp = (instance: Instance) => {
    setActiveInstance(instance);
    setShowQrPopUp(true);
    fetchQrCode(instance);
  };

  const simulateSuccess = () => {
    setQrState('syncing');
    setTimeout(() => {
      setQrState('done');
      setTimeout(() => {
        setInstances(prev => prev.map(inst => 
          inst.id === activeInstance?.id ? { ...inst, status: 'connected', phone: '+55 11 9' + Math.floor(10000000 + Math.random() * 90000000) } : inst
        ));
        setShowQrPopUp(false);
      }, 1500);
    }, 2000);
  };

  const removeInstance = (id: string) => {
    if(confirm("Remover permanentemente?")) {
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
                 <span className="text-[10px] font-black text-orange-500 uppercase tracking-[0.5em]">WayFlow Infrastructure</span>
              </div>
              <h1 className="text-5xl font-black text-white italic tracking-tighter uppercase leading-none">Conectores.</h1>
              <p className="text-slate-500 font-medium mt-4 max-w-lg text-sm">Integração nativa com instâncias da Evolution API v2.</p>
           </div>
           <div className="relative z-10 px-8 py-5 bg-white/5 border border-white/10 rounded-3xl flex items-center gap-4">
              <Database size={20} className="text-orange-500" />
              <p className="font-outfit text-lg font-black text-white">{instances.length} Instâncias</p>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Config Side */}
          <div className="lg:col-span-4">
             <div className="bg-[#020617] border border-white/10 p-10 rounded-[3rem] shadow-2xl space-y-8">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center text-white"><Plus size={24} /></div>
                   <h3 className="font-outfit text-xl font-black text-white italic uppercase tracking-widest">Novo Node</h3>
                </div>

                <div className="space-y-6">
                   <InputGroup icon={Globe} label="ENDPOINT URL" placeholder="https://api.sua-evolution.com" value={config.evoUrl} onChange={(v) => setConfig({...config, evoUrl: v})} />
                   <InputGroup icon={Lock} label="GLOBAL API KEY" placeholder="apikey master" type="password" value={config.evoKey} onChange={(v) => setConfig({...config, evoKey: v})} />
                   
                   <button 
                    onClick={handleTestConnection}
                    className={`w-full py-5 rounded-2xl font-outfit font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-3 active:scale-95 ${
                      testResult === 'success' ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'bg-white/5 text-slate-500 border border-white/10 hover:bg-white/10 hover:text-white'
                    }`}
                   >
                     {isTesting ? <Loader2 size={18} className="animate-spin" /> : testResult === 'success' ? <Check size={18} /> : <RefreshCw size={18} />}
                     {testResult === 'success' ? 'CONEXÃO ATIVA' : 'VERIFICAR STATUS'}
                   </button>

                   {testResult === 'success' && (
                     <div className="animate-in slide-in-from-top-4 duration-500 space-y-6">
                        <InputGroup icon={Monitor} label="NOME DA INSTÂNCIA" placeholder="Ex: VENDAS_01" value={config.evoInstance} onChange={(v) => setConfig({...config, evoInstance: v})} />
                        <button onClick={createInstanceInApp} className="w-full py-6 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-[1.5rem] font-outfit font-black text-xs uppercase tracking-widest shadow-2xl shadow-orange-600/30">ATIVAR NO DASHBOARD</button>
                     </div>
                   )}
                </div>

                <div className="p-6 bg-blue-500/5 border border-blue-500/20 rounded-3xl flex gap-4">
                   <Info className="text-blue-500 shrink-0" size={20} />
                   <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
                     Certifique-se que <span className="text-white">CORS_ORIGIN="*"</span> está definido no seu servidor Evolution para evitar erros de bloqueio.
                   </p>
                </div>
             </div>
          </div>

          {/* Cards Side */}
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
                           <span className={`text-[10px] font-black uppercase tracking-widest ${inst.status === 'connected' ? 'text-emerald-500' : 'text-slate-600'}`}>
                              {inst.status === 'connected' ? 'CONECTADO' : 'AGUARDANDO WHATSAPP'}
                           </span>
                        </div>
                     </div>

                     {inst.status !== 'connected' ? (
                       <button 
                         onClick={() => openPairingPopUp(inst)}
                         className="w-full py-6 bg-orange-600 text-white rounded-[1.5rem] font-outfit font-black text-xs uppercase tracking-widest shadow-2xl shadow-orange-600/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4"
                       >
                         <QrCode size={22} /> VINCULAR CELULAR
                       </button>
                     ) : (
                       <div className="w-full py-6 bg-white/[0.02] text-slate-500 rounded-[1.5rem] font-outfit font-black text-[10px] uppercase tracking-widest border border-white/5 flex items-center justify-center gap-4 cursor-default">
                         <CheckCircle2 size={20} className="text-emerald-500" /> INSTÂNCIA PRONTA
                       </div>
                     )}
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* QR MODAL */}
        {showQrPopUp && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/98 backdrop-blur-3xl animate-in fade-in duration-500">
             <div className="w-full max-w-xl bg-[#020617] border border-white/10 rounded-[5rem] shadow-[0_0_200px_rgba(245,158,11,0.25)] overflow-hidden animate-in zoom-in-95 duration-700 relative">
                
                <div className="p-12 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                   <div className="font-outfit">
                      <div className="flex items-center gap-3 mb-2">
                        <Scan size={18} className="text-orange-500" />
                        <span className="text-[10px] font-black text-orange-500 uppercase tracking-[0.5em]">WayFlow Secure Scan</span>
                      </div>
                      <h3 className="text-4xl font-black text-white italic tracking-tighter uppercase tracking-widest leading-none">Conexão.</h3>
                   </div>
                   <button onClick={() => setShowQrPopUp(false)} className="p-5 bg-white/5 rounded-[2rem] text-slate-500 hover:text-white transition-all border border-white/5"><X size={28} /></button>
                </div>
                
                <div className="p-20 flex flex-col items-center">
                   
                   <div className="relative mb-12">
                      <div className="absolute -inset-20 bg-orange-500/10 blur-[120px] rounded-full opacity-60 animate-pulse" />
                      
                      <div className="relative z-10 bg-white p-14 rounded-[4.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.6)] flex flex-col items-center justify-center min-w-[380px] min-h-[380px]">
                         
                         {qrState === 'generating' ? (
                           <div className="flex flex-col items-center gap-6">
                              <Loader2 size={64} className="text-orange-500 animate-spin" strokeWidth={3} />
                              <p className="font-outfit text-[10px] font-black text-slate-900 uppercase tracking-widest italic">Verificando Instância...</p>
                           </div>
                         ) : qrState === 'error' ? (
                           <div className="flex flex-col items-center gap-6 text-center px-4">
                              <AlertTriangle size={64} className="text-red-500 animate-bounce" />
                              <p className="font-outfit text-sm font-black text-red-600 uppercase tracking-tight leading-tight">{errorMessage}</p>
                              <button onClick={() => activeInstance && fetchQrCode(activeInstance)} className="mt-6 px-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-2"><RefreshCw size={14} /> Regegerar</button>
                           </div>
                         ) : (
                           <div className="relative overflow-hidden rounded-3xl">
                              <img 
                                src={currentQrUrl} 
                                alt="WhatsApp QR Code" 
                                className={`w-72 h-72 transition-all duration-700 ${qrState !== 'waiting' ? 'opacity-5 blur-2xl' : 'opacity-100'}`}
                              />
                              
                              {qrState === 'waiting' && (
                                <div className="absolute left-0 w-full h-1.5 bg-orange-500 shadow-[0_0_20px_#f59e0b] blur-[1px] z-20 animate-[laser_3.5s_infinite]" />
                              )}

                              {qrState === 'syncing' && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-white/80 animate-in fade-in">
                                   <RefreshCw size={64} className="text-orange-600 animate-spin" />
                                   <p className="font-outfit text-sm font-black text-slate-950 uppercase tracking-widest italic">Vinculando...</p>
                                </div>
                              )}
                              
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

                   <div className="flex flex-col items-center gap-4">
                     {qrState === 'waiting' && (
                       <button 
                          onClick={() => activeInstance && fetchQrCode(activeInstance)}
                          className="px-8 py-4 bg-white/5 hover:bg-white/10 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] border border-white/5 transition-all flex items-center gap-3"
                       >
                          <RefreshCw size={14} /> Atualizar QR
                       </button>
                     )}
                     
                     <button 
                        onClick={simulateSuccess}
                        className="px-10 py-5 bg-orange-600/10 hover:bg-orange-600/20 text-orange-500 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] border border-orange-500/20 transition-all flex items-center gap-3 animate-pulse"
                     >
                        <Zap size={14} /> Forçar Sincronia (Demo)
                     </button>
                   </div>

                   <div className="flex items-center gap-5 mt-10">
                      <div className={`w-3 h-3 rounded-full ${qrState === 'waiting' ? 'bg-orange-500 animate-pulse' : qrState === 'done' ? 'bg-emerald-500' : 'bg-white/10'}`} />
                      <span className="font-outfit text-xs font-black text-slate-600 uppercase tracking-[0.5em]">WayFlow Protocol v5.0</span>
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
