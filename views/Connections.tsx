
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Smartphone, RefreshCw, Loader2, X, Trash2, QrCode, Monitor, Scan, Settings2, Info, Hash, AlertCircle
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
  const [instances, setInstances] = useState<Instance[]>(() => {
    const cached = localStorage.getItem('wayflow_instances_cache');
    return cached ? JSON.parse(cached) : [];
  });

  const [isLoadingInstances, setIsLoadingInstances] = useState(false);
  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem('wayflow_evo_config');
    return saved ? JSON.parse(saved) : { evoUrl: '', evoKey: '', evoInstance: '' };
  });

  const [testResult, setTestResult] = useState<'none' | 'success' | 'error'>('none');
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrCodeImage, setQrCodeImage] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [activeInstanceName, setActiveInstanceName] = useState<string | null>(null);
  const [isFetchingQr, setIsFetchingQr] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('wayflow_evo_config', JSON.stringify(config));
  }, [config]);

  const refreshInstancesFromServer = useCallback(async (isAuto = false) => {
    if (!config.evoUrl || !config.evoKey) return;
    if (!config.evoUrl.startsWith('http')) return;

    if (!isAuto) setIsLoadingInstances(true);
    let baseUrl = config.evoUrl.trim().replace(/\/$/, "");
    
    try {
      const response = await fetch(`${baseUrl}/instance/fetchInstances`, {
        headers: { 'apikey': config.evoKey, 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      
      const raw = Array.isArray(data) ? data : (data.instances || data.data || []);
      const mapped: Instance[] = raw.map((item: any) => {
        const instData = item.instance || item;
        const rawStatus = item.connectionStatus || item.status || instData.status || item.state;
        const status = (rawStatus === 'open' || rawStatus === 'CONNECTED') ? 'connected' : 'disconnected';
        
        return {
          id: item.instanceId || item.id || Math.random().toString(),
          name: item.instanceName || item.name || instData.name,
          status: status as any,
          phone: item.ownerJid ? item.ownerJid.split('@')[0] : (instData.ownerJid ? instData.ownerJid.split('@')[0] : 'OFFLINE')
        };
      });

      setInstances(mapped);
      setTestResult('success');
      localStorage.setItem('wayflow_instances_cache', JSON.stringify(mapped));
    } catch (err: any) {
      if (!isAuto) setTestResult('error');
    } finally {
      setIsLoadingInstances(false);
    }
  }, [config.evoUrl, config.evoKey]);

  useEffect(() => {
    if (config.evoUrl && config.evoKey) {
      refreshInstancesFromServer(true);
    }
  }, [config.evoUrl, config.evoKey, refreshInstancesFromServer]);

  const handleFetchQrCode = async (instanceName: string) => {
    setShowQrModal(true);
    setIsFetchingQr(true);
    setQrError(null);
    setActiveInstanceName(instanceName);
    setQrCodeImage(null);
    setPairingCode(null);
    
    let baseUrl = config.evoUrl.trim().replace(/\/$/, "");
    try {
      // Evolution V2: Usamos ?force=true para garantir que um novo QR seja gerado se o anterior expirou
      const response = await fetch(`${baseUrl}/instance/connect/${instanceName}?force=true`, {
        headers: { 'apikey': config.evoKey }
      });
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "O servidor negou a geração do QR Code. Tente reiniciar a instância.");
      }
      
      // Mapeamento exaustivo para V2
      const qr = data.base64 || 
                 data.qrcode?.base64 || 
                 data.instance?.qrcode?.base64 ||
                 (data.data && data.data.base64);

      const code = data.code || data.pairingCode || (data.data && data.data.code);
      
      if (qr) {
        setQrCodeImage(qr.startsWith('data:') ? qr : `data:image/png;base64,${qr}`);
      }
      
      if (code) {
        setPairingCode(code);
      }

      if (!qr && !code) {
        throw new Error("A API não retornou dados de conexão. Verifique se a instância está aberta.");
      }

    } catch (e: any) {
      console.error("[WayFlow QR Error]", e);
      setQrError(e.message);
    } finally {
      setIsFetchingQr(false);
    }
  };

  const createInstanceInApp = async () => {
    if (!config.evoInstance) return;
    setIsLoadingInstances(true);
    let baseUrl = config.evoUrl.trim().replace(/\/$/, "");
    try {
      const response = await fetch(`${baseUrl}/instance/create`, {
        method: 'POST',
        headers: { 'apikey': config.evoKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          instanceName: config.evoInstance.trim().toUpperCase(), 
          qrcode: true, 
          integration: "WHATSAPP-BAILEYS" 
        })
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Erro ao criar instância.");
      }
      setConfig({ ...config, evoInstance: '' });
      await refreshInstancesFromServer();
    } catch (err: any) { alert(err.message); } finally { setIsLoadingInstances(false); }
  };

  const deleteInstance = async (name: string) => {
    if (!confirm(`Remover instância ${name}?`)) return;
    let baseUrl = config.evoUrl.trim().replace(/\/$/, "");
    try {
      await fetch(`${baseUrl}/instance/delete/${name}`, { 
        method: 'DELETE', 
        headers: { 'apikey': config.evoKey } 
      });
      refreshInstancesFromServer(true);
    } catch (e) { alert("Erro ao deletar."); }
  };

  return (
    <Layout activeView={AppView.CONNECTIONS} onNavigate={onNavigate} onLogout={onLogout}>
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in">
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#03081a] border border-white/5 p-8 rounded-3xl relative overflow-hidden">
           <div className="relative z-10 font-outfit">
              <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">Conexões.</h1>
              <p className="text-slate-500 font-medium mt-2 text-xs uppercase tracking-widest">Clusters Evolution API Engine</p>
           </div>
           <button 
             onClick={() => refreshInstancesFromServer()}
             disabled={isLoadingInstances}
             className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3 hover:bg-white/10 transition-all text-xs font-black text-white uppercase tracking-widest"
           >
              <RefreshCw size={16} className={isLoadingInstances ? 'animate-spin' : ''} />
              Sincronizar Nodes
           </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Configurações */}
          <div className="lg:col-span-4">
             <div className="bg-[#020617] border border-white/10 p-8 rounded-3xl space-y-6 shadow-2xl">
                <div className="flex items-center gap-3">
                   <Settings2 size={18} className="text-orange-500" />
                   <h3 className="font-outfit text-sm font-black text-white uppercase tracking-widest">Configuração Mestre</h3>
                </div>
                <div className="space-y-4">
                   <InputGroup label="URL DA API" placeholder="https://api.seusite.com" value={config.evoUrl} onChange={(v) => setConfig({...config, evoUrl: v})} />
                   <InputGroup label="CHAVE GLOBAL (APIKEY)" placeholder="Insira sua apikey" type="password" value={config.evoKey} onChange={(v) => setConfig({...config, evoKey: v})} />
                   
                   <button 
                    onClick={() => refreshInstancesFromServer()}
                    disabled={isLoadingInstances}
                    className={`w-full py-4 rounded-xl font-outfit font-black text-[9px] uppercase tracking-widest transition-all border ${
                      testResult === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                    }`}
                   >
                     {isLoadingInstances ? <Loader2 size={14} className="animate-spin mx-auto" /> : testResult === 'success' ? 'SISTEMA CONECTADO' : 'Autenticar com Servidor'}
                   </button>

                   {testResult === 'success' && (
                     <div className="pt-6 border-t border-white/5 space-y-4">
                        <InputGroup label="NOME DA NOVA INSTÂNCIA" placeholder="EX: VENDAS_01" value={config.evoInstance} onChange={(v) => setConfig({...config, evoInstance: v})} />
                        <button onClick={createInstanceInApp} className="w-full py-4 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-black text-[9px] uppercase tracking-widest transition-all shadow-lg shadow-orange-600/20">Criar Nova Instância</button>
                     </div>
                   )}
                </div>
             </div>
          </div>

          {/* Listagem de Instâncias */}
          <div className="lg:col-span-8">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {instances.length === 0 && !isLoadingInstances && (
                  <div className="md:col-span-2 py-20 bg-white/[0.01] border-2 border-dashed border-white/5 rounded-[3rem] flex flex-col items-center justify-center opacity-30">
                    <Smartphone size={48} className="mb-4" />
                    <p className="font-black uppercase tracking-widest text-[10px]">Nenhuma instância detectada no servidor.</p>
                  </div>
                )}
                {instances.map(inst => (
                  <div key={inst.id} className="bg-[#03081a] border border-white/5 p-8 rounded-3xl relative group hover:border-white/20 transition-all">
                     <div className="flex justify-between items-start mb-6">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${inst.status === 'connected' ? 'bg-emerald-500/10 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'bg-orange-600/10 text-orange-500'}`}>
                           {inst.status === 'connected' ? <Smartphone size={20} /> : <Scan size={20} />}
                        </div>
                        <button onClick={() => deleteInstance(inst.name)} className="text-slate-800 hover:text-red-500 transition-colors p-2"><Trash2 size={16} /></button>
                     </div>
                     <h4 className="text-xl font-black text-white italic uppercase mb-2 truncate tracking-tight">{inst.name}</h4>
                     <div className="flex items-center gap-2 mb-6">
                        <div className={`w-2 h-2 rounded-full ${inst.status === 'connected' ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]' : 'bg-red-500'}`} />
                        <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">
                          {inst.status === 'connected' ? `ATIVO • +${inst.phone}` : 'AGUARDANDO CONEXÃO'}
                        </span>
                     </div>
                     
                     {inst.status === 'connected' ? (
                       <button 
                        onClick={() => onNavigate(AppView.CHAT_MANAGER)}
                        className="w-full py-3 bg-white/5 text-white border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-orange-600 hover:border-orange-500 transition-all"
                       >
                         Gerenciar Atendimento
                       </button>
                     ) : (
                       <button 
                        onClick={() => handleFetchQrCode(inst.name)}
                        className="w-full py-3 bg-orange-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-orange-500 flex items-center justify-center gap-2 shadow-xl shadow-orange-600/20 transition-all active:scale-95"
                       >
                         <QrCode size={12} />
                         Vincular WhatsApp
                       </button>
                     )}
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>

      {/* Modal de QR Code e Pairing Code */}
      {showQrModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-[#020617]/95 backdrop-blur-3xl animate-in fade-in duration-300">
          <div className="bg-[#03081a] border border-white/10 rounded-[3rem] p-10 max-w-md w-full text-center relative shadow-2xl">
            <button 
              onClick={() => { setShowQrModal(false); refreshInstancesFromServer(true); }} 
              className="absolute top-8 right-8 p-3 text-slate-500 hover:text-white transition-all bg-white/5 rounded-2xl"
            >
              <X size={20} />
            </button>
            
            <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-2">Sincronizar Canal.</h3>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-10">Instância: <span className="text-orange-500">{activeInstanceName}</span></p>
            
            <div className="bg-white p-6 rounded-[2rem] mb-8 flex flex-col items-center justify-center shadow-2xl overflow-hidden min-h-[300px] relative">
               {isFetchingQr ? (
                 <div className="flex flex-col items-center justify-center py-10">
                    <Loader2 size={48} className="animate-spin text-orange-600 mb-4" />
                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Iniciando Protocolo...</span>
                 </div>
               ) : qrError ? (
                 <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
                    <AlertCircle size={48} className="text-red-500 mb-4" />
                    <span className="text-[11px] font-bold text-slate-900 uppercase mb-4 leading-tight">{qrError}</span>
                    <button onClick={() => handleFetchQrCode(activeInstanceName!)} className="px-6 py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest">Tentar Novamente</button>
                 </div>
               ) : (
                 <>
                   {qrCodeImage && <img src={qrCodeImage} alt="QR Code" className="w-full h-auto animate-in zoom-in-90 duration-500" />}
                   
                   {pairingCode && (
                     <div className="mt-4 pt-4 border-t border-slate-100 w-full">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Ou use o Código de Pareamento</p>
                        <div className="bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 flex items-center justify-center gap-2">
                           <Hash size={14} className="text-orange-600" />
                           <span className="text-lg font-black text-slate-900 tracking-[0.3em]">{pairingCode}</span>
                        </div>
                     </div>
                   )}
                 </>
               )}
            </div>

            <div className="space-y-4">
               <div className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl text-left">
                  <div className="w-10 h-10 bg-orange-600/20 rounded-xl flex items-center justify-center text-orange-500 shrink-0"><Scan size={20}/></div>
                  <div className="font-medium">
                     <p className="text-[10px] text-white leading-tight font-black uppercase mb-1">Passo a Passo:</p>
                     <p className="text-[9px] text-slate-400 leading-tight">Abra o WhatsApp > Aparelhos Conectados > Escaneie o código acima.</p>
                  </div>
               </div>
               
               <button 
                onClick={() => { setShowQrModal(false); refreshInstancesFromServer(true); }} 
                className="w-full py-4 bg-white/5 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-orange-600 transition-all border border-white/5"
               >
                 Verificar Conexão Agora
               </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

const InputGroup: React.FC<{ label: string, value: string, onChange: (v: string) => void, type?: string, placeholder?: string }> = ({ label, value, onChange, type = 'text', placeholder }) => (
  <div className="space-y-2">
    <label className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] ml-1">{label}</label>
    <input 
      type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-5 text-xs text-white focus:outline-none focus:border-orange-500/50 transition-all placeholder:text-slate-800"
    />
  </div>
);

export default Connections;
