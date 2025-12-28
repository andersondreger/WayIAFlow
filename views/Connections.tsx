
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Smartphone, RefreshCw, Loader2, X, Trash2, QrCode, Monitor, Scan, Settings2, Info
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
  const [activeInstanceName, setActiveInstanceName] = useState<string | null>(null);
  const [isFetchingQr, setIsFetchingQr] = useState(false);

  // Sincroniza configuração no localStorage sempre que mudar
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
        const status = (item.connectionStatus === 'open' || item.status === 'open' || instData.status === 'open' || item.state === 'open' || item.instance?.status === 'open') ? 'connected' : 'disconnected';
        return {
          id: item.instanceId || item.id || Math.random().toString(),
          name: item.instanceName || item.name || instData.name,
          status: status as any,
          phone: item.ownerJid ? item.ownerJid.split('@')[0] : (instData.ownerJid ? instData.ownerJid.split('@')[0] : 'Desconectado')
        };
      });

      setInstances(mapped);
      setTestResult('success');
      localStorage.setItem('wayflow_instances_cache', JSON.stringify(mapped));
    } catch (err: any) {
      console.error("Erro refresh:", err);
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
    setActiveInstanceName(instanceName);
    setQrCodeImage(null);
    
    let baseUrl = config.evoUrl.trim().replace(/\/$/, "");
    try {
      const response = await fetch(`${baseUrl}/instance/connect/${instanceName}`, {
        headers: { 'apikey': config.evoKey }
      });
      const data = await response.json();
      
      const qr = data.base64 || 
                 data.qrcode?.base64 || 
                 data.instance?.qrcode?.base64 ||
                 (data.data && data.data.base64);
      
      if (qr) {
        setQrCodeImage(qr.startsWith('data:') ? qr : `data:image/png;base64,${qr}`);
      } else if (data.code) {
        alert("Pareamento via Código: " + data.code);
      } else {
        throw new Error("QR Code não gerado automaticamente.");
      }
    } catch (e: any) {
      alert(e.message);
      setShowQrModal(false);
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
      if (!response.ok) throw new Error("Erro ao criar.");
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
              <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">Canais.</h1>
              <p className="text-slate-500 font-medium mt-2 text-xs">Gestão de Canais Evolution API</p>
           </div>
           <button 
             onClick={() => refreshInstancesFromServer()}
             disabled={isLoadingInstances}
             className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3 hover:bg-white/10 transition-all text-xs font-black text-white uppercase tracking-widest"
           >
              <RefreshCw size={16} className={isLoadingInstances ? 'animate-spin' : ''} />
              Sincronizar Lista
           </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4">
             <div className="bg-[#020617] border border-white/10 p-8 rounded-3xl space-y-6 shadow-2xl">
                <div className="flex items-center gap-3">
                   <Settings2 size={18} className="text-orange-500" />
                   <h3 className="font-outfit text-sm font-black text-white uppercase tracking-widest">Configuração API</h3>
                </div>
                <div className="space-y-4">
                   <InputGroup label="URL EVOLUTION" placeholder="https://api.seusite.com" value={config.evoUrl} onChange={(v) => setConfig({...config, evoUrl: v})} />
                   <InputGroup label="GLOBAL KEY" placeholder="apikey" type="password" value={config.evoKey} onChange={(v) => setConfig({...config, evoKey: v})} />
                   
                   <button 
                    onClick={() => refreshInstancesFromServer()}
                    disabled={isLoadingInstances}
                    className={`w-full py-4 rounded-xl font-outfit font-black text-[9px] uppercase tracking-widest transition-all border ${
                      testResult === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                    }`}
                   >
                     {isLoadingInstances ? <Loader2 size={14} className="animate-spin mx-auto" /> : testResult === 'success' ? 'API CONECTADA' : 'Testar Conexão API'}
                   </button>

                   {testResult === 'success' && (
                     <div className="pt-6 border-t border-white/5 space-y-4">
                        <InputGroup label="NOVA INSTÂNCIA" placeholder="Ex: WHATSAPP_01" value={config.evoInstance} onChange={(v) => setConfig({...config, evoInstance: v})} />
                        <button onClick={createInstanceInApp} className="w-full py-4 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-black text-[9px] uppercase tracking-widest">Criar Canal</button>
                     </div>
                   )}
                </div>
             </div>
          </div>

          <div className="lg:col-span-8">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {instances.map(inst => (
                  <div key={inst.id} className="bg-[#03081a] border border-white/5 p-8 rounded-3xl relative group">
                     <div className="flex justify-between items-start mb-6">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${inst.status === 'connected' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-orange-600/10 text-orange-500'}`}>
                           {inst.status === 'connected' ? <Smartphone size={20} /> : <Scan size={20} />}
                        </div>
                        <button onClick={() => deleteInstance(inst.name)} className="text-slate-800 hover:text-red-500 transition-colors p-2"><Trash2 size={16} /></button>
                     </div>
                     <h4 className="text-xl font-black text-white italic uppercase mb-2 truncate">{inst.name}</h4>
                     <div className="flex items-center gap-2 mb-6">
                        <div className={`w-2 h-2 rounded-full ${inst.status === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                        <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">
                          {inst.status === 'connected' ? `ONLINE • ${inst.phone}` : 'DESCONECTADO'}
                        </span>
                     </div>
                     
                     {inst.status === 'connected' ? (
                       <button 
                        onClick={() => onNavigate(AppView.CHAT_MANAGER)}
                        className="w-full py-3 bg-white/5 text-white border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all"
                       >
                         Gerenciar Chats
                       </button>
                     ) : (
                       <button 
                        onClick={() => handleFetchQrCode(inst.name)}
                        className="w-full py-3 bg-orange-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-orange-500 flex items-center justify-center gap-2"
                       >
                         <QrCode size={12} />
                         Parear WhatsApp
                       </button>
                     )}
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>

      {showQrModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-[#020617]/98 backdrop-blur-2xl animate-in fade-in duration-300">
          <div className="bg-[#03081a] border border-white/10 rounded-[3rem] p-10 max-w-sm w-full text-center relative shadow-2xl">
            <button onClick={() => { setShowQrModal(false); refreshInstancesFromServer(true); }} className="absolute top-8 right-8 p-2 text-slate-500 hover:text-white transition-all"><X size={24} /></button>
            <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-2">Conectar Zap.</h3>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-10">Canal: {activeInstanceName}</p>
            
            <div className="bg-white p-6 rounded-3xl mb-10 flex items-center justify-center shadow-inner overflow-hidden min-h-[280px] relative">
               {qrCodeImage ? (
                 <img src={qrCodeImage} alt="QR Code" className="w-full h-auto animate-in zoom-in-90 duration-500" />
               ) : (
                 <div className="flex flex-col items-center justify-center py-10">
                    <Loader2 size={48} className="animate-spin text-orange-600 mb-4" />
                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Gerando Código...</span>
                 </div>
               )}
            </div>

            <div className="space-y-4">
               <div className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl text-left">
                  <div className="w-10 h-10 bg-orange-600/20 rounded-xl flex items-center justify-center text-orange-500 shrink-0"><Info size={20}/></div>
                  <p className="text-[10px] text-slate-400 leading-tight font-medium">Escaneie pelo WhatsApp em: <br/><span className="text-white font-bold">Aparelhos Conectados</span>.</p>
               </div>
               <button onClick={() => { setShowQrModal(false); refreshInstancesFromServer(true); }} className="w-full py-4 bg-white/5 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-white/10">Já Escaneei o Código</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

const InputGroup: React.FC<{ label: string, value: string, onChange: (v: string) => void, type?: string, placeholder?: string }> = ({ label, value, onChange, type = 'text', placeholder }) => (
  <div className="space-y-1.5">
    <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest ml-1">{label}</label>
    <input 
      type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className="w-full bg-white/[0.02] border border-white/10 rounded-xl py-3.5 px-4 text-xs text-white focus:outline-none focus:border-orange-500 transition-all"
    />
  </div>
);

export default Connections;
