
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Smartphone, RefreshCw, Loader2, X, Trash2, QrCode, Monitor, Scan, Settings2, Info, Hash, AlertCircle, ShieldAlert, CheckCircle2, Globe
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
  const [diagInfo, setDiagInfo] = useState<{ status: 'idle' | 'testing' | 'success' | 'error', msg: string }>({ status: 'idle', msg: '' });
  
  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem('wayflow_evo_config');
    return saved ? JSON.parse(saved) : { evoUrl: '', evoKey: '', evoInstance: '' };
  });

  const [showQrModal, setShowQrModal] = useState(false);
  const [qrCodeImage, setQrCodeImage] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [activeInstanceName, setActiveInstanceName] = useState<string | null>(null);
  const [isFetchingQr, setIsFetchingQr] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('wayflow_evo_config', JSON.stringify(config));
  }, [config]);

  const testConnection = async () => {
    if (!config.evoUrl || !config.evoKey) {
       setDiagInfo({ status: 'error', msg: 'Preencha URL e API Key primeiro.' });
       return;
    }

    setDiagInfo({ status: 'testing', msg: 'Validando credenciais...' });
    setIsLoadingInstances(true);
    
    // Normalização Radical da URL
    let baseUrl = config.evoUrl.trim();
    if (!baseUrl.startsWith('http')) baseUrl = 'https://' + baseUrl;
    baseUrl = baseUrl.replace(/\/+$/, ""); // Remove barras no final
    
    try {
      const response = await fetch(`${baseUrl}/instance/fetchInstances`, {
        method: 'GET',
        headers: { 
          'apikey': config.evoKey.trim(),
          'api-key': config.evoKey.trim(), // Suporte Dual-Header
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401 || response.status === 403) throw new Error("API Key Inválida (Acesso Negado)");
      if (response.status === 404) throw new Error("URL Inválida (404 Not Found)");
      
      const data = await response.json();
      const raw = Array.isArray(data) ? data : (data.instances || data.data || []);
      
      const mapped: Instance[] = raw.map((item: any) => {
        const instData = item.instance || item;
        const rawStatus = item.connectionStatus || item.status || instData.status || item.state;
        return {
          id: item.instanceId || item.id || Math.random().toString(),
          name: item.instanceName || item.name || instData.name,
          status: (rawStatus === 'open' || rawStatus === 'CONNECTED') ? 'connected' : 'disconnected',
          phone: item.ownerJid ? item.ownerJid.split('@')[0] : (instData.ownerJid ? instData.ownerJid.split('@')[0] : 'NODE_OFF')
        };
      });

      setInstances(mapped);
      setDiagInfo({ status: 'success', msg: `Link Estabelecido! ${mapped.length} nodes ativos.` });
      localStorage.setItem('wayflow_instances_cache', JSON.stringify(mapped));
    } catch (err: any) {
      setDiagInfo({ status: 'error', msg: err.message });
    } finally {
      setIsLoadingInstances(false);
    }
  };

  const createInstanceInApp = async () => {
    if (!config.evoInstance) return;
    setIsLoadingInstances(true);
    let baseUrl = config.evoUrl.trim().replace(/\/+$/, "");
    if (!baseUrl.startsWith('http')) baseUrl = 'https://' + baseUrl;

    try {
      const response = await fetch(`${baseUrl}/instance/create`, {
        method: 'POST',
        headers: { 
          'apikey': config.evoKey.trim(), 
          'api-key': config.evoKey.trim(),
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ 
          instanceName: config.evoInstance.trim(), 
          qrcode: true, 
          integration: "WHATSAPP-BAILEYS" 
        })
      });
      if (!response.ok) throw new Error("Falha ao provisionar node.");
      setConfig({ ...config, evoInstance: '' });
      await testConnection();
    } catch (err: any) { alert(err.message); } finally { setIsLoadingInstances(false); }
  };

  const handleFetchQrCode = async (instanceName: string) => {
    setShowQrModal(true);
    setIsFetchingQr(true);
    setQrError(null);
    setActiveInstanceName(instanceName);
    
    let baseUrl = config.evoUrl.trim().replace(/\/+$/, "");
    if (!baseUrl.startsWith('http')) baseUrl = 'https://' + baseUrl;

    try {
      const response = await fetch(`${baseUrl}/instance/connect/${instanceName}`, {
        headers: { 
          'apikey': config.evoKey.trim(),
          'api-key': config.evoKey.trim()
        }
      });
      const data = await response.json();
      
      const qr = data.base64 || data.qrcode?.base64 || (data.data && data.data.base64);
      const code = data.code || data.pairingCode || (data.data && data.data.code);
      
      if (qr) setQrCodeImage(qr.startsWith('data:') ? qr : `data:image/png;base64,${qr}`);
      if (code) setPairingCode(code);

      if (!qr && !code) throw new Error("A API não retornou dados de pareamento. Verifique o status no servidor.");
    } catch (e: any) { setQrError(e.message); } finally { setIsFetchingQr(false); }
  };

  const deleteInstance = async (name: string) => {
    if (!confirm(`Desinstalar node ${name}?`)) return;
    let baseUrl = config.evoUrl.trim().replace(/\/+$/, "");
    if (!baseUrl.startsWith('http')) baseUrl = 'https://' + baseUrl;
    try {
      await fetch(`${baseUrl}/instance/delete/${name}`, { 
        method: 'DELETE', 
        headers: { 
          'apikey': config.evoKey.trim(),
          'api-key': config.evoKey.trim()
        } 
      });
      testConnection();
    } catch (e) { alert("Erro na deleção."); }
  };

  return (
    <Layout activeView={AppView.CONNECTIONS} onNavigate={onNavigate} onLogout={onLogout}>
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in">
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#03081a] border border-white/5 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
           <div className="relative z-10">
              <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">Rede WayFlow.</h1>
              <p className="text-slate-500 font-bold mt-2 text-[10px] uppercase tracking-[0.3em]">Gerenciamento de Nodes (Evolution API v2)</p>
           </div>
           <button 
             onClick={testConnection}
             disabled={isLoadingInstances}
             className="px-8 py-4 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl flex items-center gap-3 transition-all shadow-xl shadow-orange-600/20 text-[10px] font-black uppercase tracking-widest"
           >
              {isLoadingInstances ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              Atualizar Rede
           </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-6">
             <div className="bg-[#020617] border border-white/10 p-8 rounded-[2.5rem] space-y-6 shadow-2xl">
                <div className="flex items-center gap-3 mb-2">
                   <Settings2 size={18} className="text-orange-500" />
                   <h3 className="text-[11px] font-black text-white uppercase tracking-widest italic">Configurações de Acesso</h3>
                </div>

                <div className="space-y-4">
                   <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Endpoint da API</label>
                      <input type="text" placeholder="https://api.seusite.com/v2" value={config.evoUrl} onChange={(e) => setConfig({...config, evoUrl: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-xs text-white focus:outline-none focus:border-orange-500/50 transition-all"/>
                   </div>

                   <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Global API Key</label>
                      <input type="password" placeholder="Chave mestra do servidor" value={config.evoKey} onChange={(e) => setConfig({...config, evoKey: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-xs text-white focus:outline-none focus:border-orange-500/50 transition-all"/>
                   </div>

                   {diagInfo.status !== 'idle' && (
                     <div className={`p-4 rounded-2xl border flex items-start gap-3 ${diagInfo.status === 'success' ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500' : 'bg-orange-500/5 border-orange-500/20 text-orange-500'}`}>
                        {diagInfo.status === 'success' ? <CheckCircle2 size={16} className="mt-0.5" /> : <AlertCircle size={16} className="mt-0.5" />}
                        <div>
                           <p className="text-[9px] font-black uppercase tracking-widest">{diagInfo.status === 'success' ? 'Conexão Ativa' : 'Log de Status'}</p>
                           <p className="text-[10px] font-medium leading-tight">{diagInfo.msg}</p>
                        </div>
                     </div>
                   )}

                   <button onClick={testConnection} className="w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest border border-white/10 transition-all">Verificar Link</button>
                </div>
             </div>
          </div>

          <div className="lg:col-span-8">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {instances.map(inst => (
                  <div key={inst.id} className="bg-[#03081a] border border-white/5 p-8 rounded-[2.5rem] relative hover:border-white/20 transition-all shadow-xl">
                     <div className="flex justify-between items-start mb-6">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${inst.status === 'connected' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-orange-600/10 text-orange-500'}`}>
                           {inst.status === 'connected' ? <Smartphone size={24} /> : <Scan size={24} />}
                        </div>
                        <button onClick={() => deleteInstance(inst.name)} className="text-slate-800 hover:text-red-500 transition-colors p-3 bg-white/5 rounded-xl"><Trash2 size={16} /></button>
                     </div>
                     <h4 className="text-xl font-black text-white italic uppercase mb-2 truncate tracking-tight">{inst.name}</h4>
                     <div className="flex items-center gap-2 mb-8">
                        <div className={`w-2 h-2 rounded-full ${inst.status === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                        <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                          {inst.status === 'connected' ? `ONLINE • +${inst.phone}` : 'AGUARDANDO QR'}
                        </span>
                     </div>
                     
                     {inst.status === 'connected' ? (
                       <button onClick={() => onNavigate(AppView.CHAT_MANAGER)} className="w-full py-4 bg-white/5 text-white border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all">Gerenciar Chat</button>
                     ) : (
                       <button onClick={() => handleFetchQrCode(inst.name)} className="w-full py-4 bg-orange-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-500 flex items-center justify-center gap-3 transition-all">
                         <QrCode size={16} /> Parear WhatsApp
                       </button>
                     )}
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Connections;
