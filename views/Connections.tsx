
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, Smartphone, Lock, RefreshCw, Globe, Database, 
  CheckCircle2, Loader2, X, Trash2,
  Check, QrCode, Network, Monitor, Zap, Scan, AlertTriangle, Info,
  RotateCcw, Search, Settings2
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
  const [instances, setInstances] = useState<Instance[]>([]);
  const [isLoadingInstances, setIsLoadingInstances] = useState(false);
  
  // Carrega configurações salvas ou inicia vazio
  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem('wayflow_evo_config');
    return saved ? JSON.parse(saved) : { evoUrl: '', evoKey: '', evoInstance: '' };
  });

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'none' | 'success' | 'error'>('none');
  const [showQrPopUp, setShowQrPopUp] = useState(false);
  const [activeInstance, setActiveInstance] = useState<Instance | null>(null);
  const [qrState, setQrState] = useState<'generating' | 'waiting' | 'syncing' | 'done' | 'error'>('generating');
  const [currentQrUrl, setCurrentQrUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Salva configurações sempre que mudarem
  useEffect(() => {
    localStorage.setItem('wayflow_evo_config', JSON.stringify(config));
  }, [config]);

  // Função para buscar instâncias REAIS do servidor
  const refreshInstancesFromServer = useCallback(async () => {
    if (!config.evoUrl || !config.evoKey) return;
    
    setIsLoadingInstances(true);
    let baseUrl = config.evoUrl.trim().replace(/\/$/, "");
    
    try {
      const response = await fetch(`${baseUrl}/instance/fetchInstances`, {
        headers: { 'apikey': config.evoKey }
      });
      
      if (!response.ok) throw new Error("Não foi possível listar as instâncias.");
      
      const data = await response.json();
      
      // Mapeia o retorno da Evolution para o nosso formato de interface
      const mapped: Instance[] = data.map((item: any) => ({
        id: item.instanceId || Math.random().toString(),
        name: item.instanceName,
        status: item.connectionStatus === 'open' ? 'connected' : 'disconnected',
        phone: item.ownerJid ? item.ownerJid.split('@')[0] : 'Não Pareado'
      }));
      
      setInstances(mapped);
      setTestResult('success');
    } catch (err) {
      console.error("Erro ao sincronizar:", err);
    } finally {
      setIsLoadingInstances(false);
    }
  }, [config.evoUrl, config.evoKey]);

  // Busca automática ao montar o componente
  useEffect(() => {
    if (config.evoUrl && config.evoKey) {
      refreshInstancesFromServer();
    }
  }, []);

  const handleTestConnection = async () => {
    if (!config.evoKey || !config.evoUrl) return alert("Preencha a URL e a Global Key.");
    setIsTesting(true);
    setErrorMessage('');
    
    try {
      await refreshInstancesFromServer();
      setTestResult('success');
    } catch (e) {
      setTestResult('error');
      setErrorMessage("Falha na conexão com o servidor.");
    } finally {
      setIsTesting(false);
    }
  };

  const createInstanceInApp = async () => {
    if (testResult !== 'success' || !config.evoInstance) return;
    const nameFormatted = config.evoInstance.toUpperCase().trim().replace(/\s+/g, '_');
    
    setIsLoadingInstances(true);
    let baseUrl = config.evoUrl.trim().replace(/\/$/, "");

    try {
      const response = await fetch(`${baseUrl}/instance/create`, {
        method: 'POST',
        headers: {
          'apikey': config.evoKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          instanceName: nameFormatted,
          qrcode: true,
          integration: "WHATSAPP-BAILEYS"
        })
      });

      if (!response.ok) throw new Error("Erro ao criar instância no servidor.");
      
      // Após criar com sucesso, atualiza a lista vindo do servidor
      await refreshInstancesFromServer();
      setConfig({ ...config, evoInstance: '' });
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLoadingInstances(false);
    }
  };

  const deleteInstance = async (name: string) => {
    if (!confirm(`Deseja realmente remover a instância ${name}?`)) return;
    
    let baseUrl = config.evoUrl.trim().replace(/\/$/, "");
    try {
      await fetch(`${baseUrl}/instance/delete/${name}`, {
        method: 'DELETE',
        headers: { 'apikey': config.evoKey }
      });
      refreshInstancesFromServer();
    } catch (e) {
      alert("Erro ao deletar.");
    }
  };

  const fetchQrCode = async (instance: Instance) => {
    setQrState('generating');
    setErrorMessage('');
    setCurrentQrUrl('');
    
    let baseUrl = config.evoUrl.trim().replace(/\/$/, "");
    const headers = {
      'apikey': config.evoKey,
      'Content-Type': 'application/json'
    };

    try {
      const connectRes = await fetch(`${baseUrl}/instance/connect/${instance.name}`, { headers });
      const connectData = await connectRes.json();
      
      let qr = connectData.base64 || connectData.qrcode?.base64 || connectData.code;

      if (!qr) {
        await new Promise(r => setTimeout(r, 1000));
        const qrRes = await fetch(`${baseUrl}/instance/qrcode/${instance.name}`, { headers });
        const qrData = await qrRes.json();
        qr = qrData.base64 || qrData.qrcode?.base64 || qrData.code || qrData.qrcode?.code;
      }

      if (qr) {
        processQrData(qr);
      } else {
        throw new Error("A API não gerou o código. Tente o Hard Reset.");
      }

    } catch (err: any) {
      setQrState('error');
      setErrorMessage(err.message || "Falha ao gerar QR Code.");
    }
  };

  const hardResetInstance = async (instance: Instance) => {
    setQrState('generating');
    let baseUrl = config.evoUrl.trim().replace(/\/$/, "");
    try {
      await fetch(`${baseUrl}/instance/logout/${instance.name}`, { method: 'DELETE', headers: { 'apikey': config.evoKey } }).catch(() => {});
      await new Promise(r => setTimeout(r, 1000));
      fetchQrCode(instance);
    } catch (e) {
      setQrState('error');
    }
  };

  const processQrData = (qr: string) => {
    let finalUrl = "";
    if (qr.length > 100) {
      const cleanBase64 = qr.replace(/\s/g, "").replace(/^data:image\/png;base64,/, "");
      finalUrl = `data:image/png;base64,${cleanBase64}`;
    } else {
      finalUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&margin=10&data=${encodeURIComponent(qr)}`;
    }
    setCurrentQrUrl(finalUrl);
    setQrState('waiting');
  };

  const openPairingPopUp = (instance: Instance) => {
    setActiveInstance(instance);
    setShowQrPopUp(true);
    fetchQrCode(instance);
  };

  const simulateSuccess = () => {
    if (!activeInstance) return;
    setQrState('syncing');
    setTimeout(() => {
      setQrState('done');
      setTimeout(() => {
        refreshInstancesFromServer();
        setShowQrPopUp(false);
      }, 1500);
    }, 2000);
  };

  return (
    <Layout activeView={AppView.CONNECTIONS} onNavigate={onNavigate} onLogout={onLogout}>
      <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700">
        
        {/* Header UI */}
        <div className="flex flex-col md:flex-row items-end justify-between gap-8 bg-[#03081a] border border-white/5 p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 p-10 opacity-5"><Network size={120} className="text-orange-500" /></div>
           <div className="relative z-10 font-outfit">
              <div className="flex items-center gap-3 mb-4">
                 <div className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-pulse shadow-[0_0_10px_#f59e0b]" />
                 <span className="text-[10px] font-black text-orange-500 uppercase tracking-[0.5em]">WayFlow Infrastructure</span>
              </div>
              <h1 className="text-5xl font-black text-white italic tracking-tighter uppercase leading-none">Canais.</h1>
              <p className="text-slate-500 font-medium mt-4 max-w-lg text-sm">Cluster de conexão sincronizado with sua Evolution API.</p>
           </div>
           <button 
             onClick={refreshInstancesFromServer}
             className="relative z-10 px-8 py-5 bg-white/5 border border-white/10 rounded-3xl flex items-center gap-4 hover:bg-white/10 transition-all group"
           >
              <RefreshCw size={20} className={`text-orange-500 ${isLoadingInstances ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
              <p className="font-outfit text-lg font-black text-white">{instances.length} Instâncias</p>
           </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Configuração */}
          <div className="lg:col-span-4">
             <div className="bg-[#020617] border border-white/10 p-10 rounded-[3rem] shadow-2xl space-y-8">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center text-white"><Settings2 size={24} /></div>
                   <h3 className="font-outfit text-xl font-black text-white italic uppercase tracking-widest">Configurar API</h3>
                </div>

                <div className="space-y-6">
                   <InputGroup icon={Globe} label="URL DA EVOLUTION" placeholder="https://dominio.com.br/v2" value={config.evoUrl} onChange={(v) => setConfig({...config, evoUrl: v})} />
                   <InputGroup icon={Lock} label="GLOBAL API KEY" placeholder="apikey de segurança" type="password" value={config.evoKey} onChange={(v) => setConfig({...config, evoKey: v})} />
                   
                   <button 
                    onClick={handleTestConnection}
                    className={`w-full py-5 rounded-2xl font-outfit font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-3 active:scale-95 ${
                      testResult === 'success' ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'bg-white/5 text-slate-500 border border-white/10 hover:bg-white/10 hover:text-white'
                    }`}
                   >
                     {isTesting ? <Loader2 size={18} className="animate-spin" /> : testResult === 'success' ? <Check size={18} /> : <RefreshCw size={18} />}
                     {testResult === 'success' ? 'API CONECTADA' : 'SINCRONIZAR AGORA'}
                   </button>

                   {testResult === 'success' && (
                     <div className="animate-in slide-in-from-top-4 duration-500 space-y-6 pt-6 border-t border-white/5">
                        <InputGroup icon={Monitor} label="NOME PARA NOVA INSTÂNCIA" placeholder="Ex: WHATS_VENDA" value={config.evoInstance} onChange={(v) => setConfig({...config, evoInstance: v})} />
                        <button 
                          onClick={createInstanceInApp} 
                          disabled={isLoadingInstances}
                          className="w-full py-6 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-[1.5rem] font-outfit font-black text-xs uppercase tracking-widest shadow-2xl shadow-orange-600/30 flex items-center justify-center gap-3"
                        >
                          {isLoadingInstances ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                          CRIAR NO SERVIDOR
                        </button>
                     </div>
                   )}
                </div>

                {errorMessage && (
                  <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-3xl flex gap-4 animate-in fade-in">
                     <AlertTriangle className="text-red-500 shrink-0" size={20} />
                     <div>
                        <p className="text-[11px] text-red-400 font-black uppercase tracking-widest mb-1">Status da API</p>
                        <p className="text-[10px] text-slate-400 font-bold leading-relaxed">{errorMessage}</p>
                     </div>
                  </div>
                )}
             </div>
          </div>

          {/* Cards das Instâncias Reais */}
          <div className="lg:col-span-8">
             {isLoadingInstances && instances.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center gap-6 bg-white/[0.01] border border-dashed border-white/10 rounded-[4rem] p-20">
                  <Loader2 size={48} className="text-orange-500 animate-spin" strokeWidth={3} />
                  <p className="font-outfit text-xs font-black text-slate-500 uppercase tracking-widest italic">Lendo cluster da Evolution...</p>
               </div>
             ) : instances.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center gap-6 bg-white/[0.01] border border-dashed border-white/10 rounded-[4rem] p-20 text-center">
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center text-slate-800"><Smartphone size={32} /></div>
                  <h3 className="font-outfit text-xl font-black text-white italic uppercase">Nenhuma Instância.</h3>
                  <p className="text-slate-500 text-sm max-w-xs mx-auto">Use o painel ao lado para conectar sua primeira conta do WhatsApp.</p>
               </div>
             ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {instances.map(inst => (
                    <div key={inst.id} className="bg-[#03081a] border border-white/5 p-12 rounded-[3.5rem] shadow-xl group hover:border-orange-500/30 transition-all relative overflow-hidden">
                       <div className="flex justify-between items-start mb-10">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${inst.status === 'connected' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-white/5 text-slate-700'}`}>
                             <Smartphone size={28} />
                          </div>
                          <button 
                            onClick={() => deleteInstance(inst.name)} 
                            className="p-4 bg-white/5 text-slate-700 hover:text-red-500 rounded-2xl border border-white/5 transition-all"
                          >
                            <Trash2 size={20} />
                          </button>
                       </div>

                       <div className="font-outfit mb-10">
                          <h4 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none mb-3">{inst.name}</h4>
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-3">
                               <div className={`w-2.5 h-2.5 rounded-full ${inst.status === 'connected' ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-red-500 shadow-[0_0_10px_#ef4444]'}`} />
                               <span className={`text-[10px] font-black uppercase tracking-widest ${inst.status === 'connected' ? 'text-emerald-500' : 'text-slate-600'}`}>
                                  {inst.status === 'connected' ? 'SESSÃO ATIVA' : 'DESCONECTADO'}
                               </span>
                            </div>
                            <p className="text-[10px] text-slate-500 font-bold tracking-widest">{inst.phone}</p>
                          </div>
                       </div>

                       {inst.status !== 'connected' ? (
                         <button 
                           onClick={() => openPairingPopUp(inst)}
                           className="w-full py-6 bg-orange-600 text-white rounded-[1.5rem] font-outfit font-black text-xs uppercase tracking-widest shadow-2xl shadow-orange-600/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4"
                         >
                           <QrCode size={22} /> GERAR QR CODE
                         </button>
                       ) : (
                         <div className="w-full py-6 bg-emerald-500/5 text-emerald-500 rounded-[1.5rem] font-outfit font-black text-[10px] uppercase tracking-widest border border-emerald-500/20 flex items-center justify-center gap-4 cursor-default">
                           <CheckCircle2 size={20} /> INSTÂNCIA PRONTA
                         </div>
                       )}
                    </div>
                  ))}
               </div>
             )}
          </div>
        </div>

        {/* MODAL QR CODE */}
        {showQrPopUp && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/98 backdrop-blur-3xl animate-in fade-in duration-500">
             <div className="w-full max-w-xl bg-[#020617] border border-white/10 rounded-[5rem] shadow-[0_0_200px_rgba(245,158,11,0.25)] overflow-hidden animate-in zoom-in-95 duration-700 relative">
                
                <div className="p-12 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                   <div className="font-outfit">
                      <div className="flex items-center gap-3 mb-2">
                        <Scan size={18} className="text-orange-500" />
                        <span className="text-[10px] font-black text-orange-500 uppercase tracking-[0.5em]">WayFlow Secure Auth</span>
                      </div>
                      <h3 className="text-4xl font-black text-white italic tracking-tighter uppercase tracking-widest leading-none">Vincular.</h3>
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
                              <p className="font-outfit text-[10px] font-black text-slate-900 uppercase tracking-widest italic">Capturando dados da API...</p>
                           </div>
                         ) : qrState === 'error' ? (
                           <div className="flex flex-col items-center gap-6 text-center px-4">
                              <AlertTriangle size={64} className="text-red-500 animate-bounce" />
                              <p className="font-outfit text-xs font-black text-red-600 uppercase tracking-tight leading-tight">{errorMessage}</p>
                              <div className="flex flex-col gap-3 mt-8 w-full">
                                <button onClick={() => activeInstance && fetchQrCode(activeInstance)} className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all active:scale-95 border border-white/5"><RefreshCw size={14} /> Tentar Novamente</button>
                                <button onClick={() => activeInstance && hardResetInstance(activeInstance)} className="w-full py-4 bg-orange-600 text-white rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-orange-600/20"><RotateCcw size={14} /> Hard Reset</button>
                              </div>
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
                                   <p className="font-outfit text-sm font-black text-slate-950 uppercase tracking-widest italic">Sincronizando...</p>
                                </div>
                              )}
                              
                              {qrState === 'done' && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-white/95 animate-in zoom-in">
                                   <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-2xl animate-bounce">
                                      <Check size={56} strokeWidth={4} />
                                   </div>
                                   <h4 className="font-outfit text-3xl font-black text-slate-950 italic tracking-tighter uppercase">Conectado!</h4>
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
                          <RefreshCw size={14} /> Novo QR Code
                       </button>
                     )}
                     
                     <button 
                        onClick={simulateSuccess}
                        className="px-10 py-5 bg-orange-600/10 hover:bg-orange-600/20 text-orange-500 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] border border-orange-500/20 transition-all flex items-center gap-3 animate-pulse"
                     >
                        <Zap size={14} /> Validar Conexão
                     </button>
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
