
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

    setDiagInfo({ status: 'testing', msg: 'Conectando ao cluster...' });
    setIsLoadingInstances(true);
    
    let baseUrl = config.evoUrl.trim();
    if (!baseUrl.startsWith('http')) baseUrl = 'https://' + baseUrl;
    baseUrl = baseUrl.replace(/\/$/, "");
    
    try {
      // Teste de Handshake
      const response = await fetch(`${baseUrl}/instance/fetchInstances`, {
        method: 'GET',
        headers: { 
          'apikey': config.evoKey.trim(),
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) throw new Error("API Key Inválida (Não autorizada)");
      if (response.status === 404) throw new Error("URL da API Inválida (Página não encontrada)");
      
      const data = await response.json();
      const raw = Array.isArray(data) ? data : (data.instances || data.data || []);
      
      const mapped: Instance[] = raw.map((item: any) => {
        const instData = item.instance || item;
        const rawStatus = item.connectionStatus || item.status || instData.status || item.state;
        return {
          id: item.instanceId || item.id || Math.random().toString(),
          name: item.instanceName || item.name || instData.name,
          status: (rawStatus === 'open' || rawStatus === 'CONNECTED') ? 'connected' : 'disconnected',
          phone: item.ownerJid ? item.ownerJid.split('@')[0] : (instData.ownerJid ? instData.ownerJid.split('@')[0] : 'OFFLINE')
        };
      });

      setInstances(mapped);
      setDiagInfo({ status: 'success', msg: `Sucesso! ${mapped.length} nodes encontrados.` });
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
    let baseUrl = config.evoUrl.trim().replace(/\/$/, "");
    if (!baseUrl.startsWith('http')) baseUrl = 'https://' + baseUrl;

    try {
      const response = await fetch(`${baseUrl}/instance/create`, {
        method: 'POST',
        headers: { 'apikey': config.evoKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          instanceName: config.evoInstance.trim(), 
          qrcode: true, 
          integration: "WHATSAPP-BAILEYS" 
        })
      });
      if (!response.ok) throw new Error("Falha ao criar instância.");
      setConfig({ ...config, evoInstance: '' });
      await testConnection();
    } catch (err: any) { alert(err.message); } finally { setIsLoadingInstances(false); }
  };

  const handleFetchQrCode = async (instanceName: string) => {
    setShowQrModal(true);
    setIsFetchingQr(true);
    setQrError(null);
    setActiveInstanceName(instanceName);
    
    let baseUrl = config.evoUrl.trim().replace(/\/$/, "");
    if (!baseUrl.startsWith('http')) baseUrl = 'https://' + baseUrl;

    try {
      const response = await fetch(`${baseUrl}/instance/connect/${instanceName}`, {
        headers: { 'apikey': config.evoKey }
      });
      const data = await response.json();
      
      const qr = data.base64 || data.qrcode?.base64 || (data.data && data.data.base64);
      const code = data.code || data.pairingCode || (data.data && data.data.code);
      
      if (qr) setQrCodeImage(qr.startsWith('data:') ? qr : `data:image/png;base64,${qr}`);
      if (code) setPairingCode(code);

      if (!qr && !code) throw new Error("A API não retornou dados de pareamento. Verifique se a instância já está conectada.");
    } catch (e: any) { setQrError(e.message); } finally { setIsFetchingQr(false); }
  };

  const deleteInstance = async (name: string) => {
    if (!confirm(`Remover instância ${name}?`)) return;
    let baseUrl = config.evoUrl.trim().replace(/\/$/, "");
    if (!baseUrl.startsWith('http')) baseUrl = 'https://' + baseUrl;
    try {
      await fetch(`${baseUrl}/instance/delete/${name}`, { method: 'DELETE', headers: { 'apikey': config.evoKey } });
      testConnection();
    } catch (e) { alert("Erro ao deletar."); }
  };

  return (
    <Layout activeView={AppView.CONNECTIONS} onNavigate={onNavigate} onLogout={onLogout}>
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in">
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#03081a] border border-white/5 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
           <div className="relative z-10">
              <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">Nodes de Rede.</h1>
              <p className="text-slate-500 font-bold mt-2 text-[10px] uppercase tracking-[0.3em]">Gestão de Instâncias Evolution API</p>
           </div>
           <button 
             onClick={testConnection}
             disabled={isLoadingInstances}
             className="px-8 py-4 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl flex items-center gap-3 transition-all shadow-xl shadow-orange-600/20 text-[10px] font-black uppercase tracking-widest"
           >
              {isLoadingInstances ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              Atualizar Status
           </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Configurações */}
          <div className="lg:col-span-4 space-y-6">
             <div className="bg-[#020617] border border-white/10 p-8 rounded-[2.5rem] space-y-6 shadow-2xl relative overflow-hidden">
                <div className="flex items-center gap-3 mb-2">
                   <Settings2 size={18} className="text-orange-500" />
                   <h3 className="text-[11px] font-black text-white uppercase tracking-widest italic">Terminal de Configuração</h3>
                </div>

                <div className="space-y-4">
                   <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">URL da Evolution API</label>
                      <div className="relative group">
                        <Globe size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700" />
                        <input type="text" placeholder="https://api.seusite.com" value={config.evoUrl} onChange={(e) => setConfig({...config, evoUrl: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-11 pr-4 text-xs text-white focus:outline-none focus:border-orange-500/50 transition-all"/>
                      </div>
                   </div>

                   <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Global API Key</label>
                      <div className="relative group">
                        <Hash size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700" />
                        <input type="password" placeholder="Insira a apikey global" value={config.evoKey} onChange={(e) => setConfig({...config, evoKey: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-11 pr-4 text-xs text-white focus:outline-none focus:border-orange-500/50 transition-all"/>
                      </div>
                   </div>

                   {diagInfo.status !== 'idle' && (
                     <div className={`p-4 rounded-2xl border flex items-start gap-3 animate-in zoom-in-95 ${diagInfo.status === 'success' ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500' : diagInfo.status === 'testing' ? 'bg-orange-500/5 border-orange-500/20 text-orange-500' : 'bg-red-500/5 border-red-500/20 text-red-500'}`}>
                        {diagInfo.status === 'success' ? <CheckCircle2 size={16} className="shrink-0 mt-0.5" /> : diagInfo.status === 'testing' ? <Loader2 size={16} className="shrink-0 mt-0.5 animate-spin" /> : <ShieldAlert size={16} className="shrink-0 mt-0.5" />}
                        <div>
                           <p className="text-[9px] font-black uppercase tracking-widest mb-1">{diagInfo.status === 'success' ? 'Uplink OK' : diagInfo.status === 'testing' ? 'Handshaking...' : 'Erro Detectado'}</p>
                           <p className="text-[10px] font-medium leading-tight">{diagInfo.msg}</p>
                        </div>
                     </div>
                   )}

                   <button onClick={testConnection} disabled={isLoadingInstances} className="w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest border border-white/10 transition-all active:scale-95">Testar Comunicação</button>

                   {diagInfo.status === 'success' && (
                     <div className="pt-6 border-t border-white/5 space-y-4">
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome da Instância</label>
                          <input type="text" placeholder="EX: VENDAS_RECUPERACAO" value={config.evoInstance} onChange={(e) => setConfig({...config, evoInstance: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-xs text-white focus:outline-none focus:border-orange-500 transition-all"/>
                        </div>
                        <button onClick={createInstanceInApp} className="w-full py-4 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-orange-600/20">Provisionar Node</button>
                     </div>
                   )}
                </div>
             </div>
          </div>

          {/* Listagem de Instâncias */}
          <div className="lg:col-span-8">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {instances.length === 0 && !isLoadingInstances && (
                  <div className="md:col-span-2 py-24 bg-white/[0.01] border-2 border-dashed border-white/5 rounded-[3rem] flex flex-col items-center justify-center opacity-30">
                    <Smartphone size={48} className="mb-4 text-orange-500" />
                    <p className="font-black uppercase tracking-[0.3em] text-[10px]">Aguardando conexão com o servidor...</p>
                  </div>
                )}
                {instances.map(inst => (
                  <div key={inst.id} className="bg-[#03081a] border border-white/5 p-8 rounded-[2.5rem] relative group hover:border-white/20 transition-all shadow-xl">
                     <div className="flex justify-between items-start mb-6">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${inst.status === 'connected' ? 'bg-emerald-500/10 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'bg-orange-600/10 text-orange-500 shadow-[0_0_20px_rgba(234,88,12,0.1)]'}`}>
                           {inst.status === 'connected' ? <Smartphone size={24} /> : <Scan size={24} />}
                        </div>
                        <button onClick={() => deleteInstance(inst.name)} className="text-slate-800 hover:text-red-500 transition-colors p-3 bg-white/5 rounded-xl"><Trash2 size={16} /></button>
                     </div>
                     <h4 className="text-xl font-black text-white italic uppercase mb-2 truncate tracking-tight">{inst.name}</h4>
                     <div className="flex items-center gap-2 mb-8">
                        <div className={`w-2 h-2 rounded-full ${inst.status === 'connected' ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'}`} />
                        <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                          {inst.status === 'connected' ? `LINK ATIVO • +${inst.phone}` : 'AGUARDANDO UPLINK'}
                        </span>
                     </div>
                     
                     {inst.status === 'connected' ? (
                       <button onClick={() => onNavigate(AppView.CHAT_MANAGER)} className="w-full py-4 bg-white/5 text-white border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 hover:border-orange-500 transition-all">Abrir Canal de Chat</button>
                     ) : (
                       <button onClick={() => handleFetchQrCode(inst.name)} className="w-full py-4 bg-orange-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-orange-500 flex items-center justify-center gap-3 shadow-xl shadow-orange-600/20 transition-all active:scale-95">
                         <QrCode size={16} /> Vincular WhatsApp
                       </button>
                     )}
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>

      {/* Modal QR Code */}
      {showQrModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-[#020617]/98 backdrop-blur-3xl animate-in fade-in duration-500">
          <div className="bg-[#03081a] border border-white/10 rounded-[4rem] p-12 max-w-md w-full text-center relative shadow-[0_0_100px_rgba(0,0,0,1)]">
            <button onClick={() => { setShowQrModal(false); testConnection(); }} className="absolute top-10 right-10 p-4 text-slate-500 hover:text-white transition-all bg-white/5 rounded-2xl"><X size={24} /></button>
            
            <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-2 leading-none">Vincular Canal.</h3>
            <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest mb-12">Instância em espera: <span className="text-orange-500">{activeInstanceName}</span></p>
            
            <div className="bg-white p-8 rounded-[3rem] mb-10 flex flex-col items-center justify-center shadow-2xl min-h-[340px] relative overflow-hidden">
               {isFetchingQr ? (
                 <div className="flex flex-col items-center justify-center">
                    <Loader2 size={64} className="animate-spin text-orange-600 mb-6" />
                    <span className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em] animate-pulse">Gerando Link...</span>
                 </div>
               ) : qrError ? (
                 <div className="flex flex-col items-center justify-center p-6 text-center">
                    <ShieldAlert size={56} className="text-red-500 mb-6" />
                    <p className="text-xs font-bold text-slate-900 uppercase mb-6 leading-relaxed">{qrError}</p>
                    <button onClick={() => handleFetchQrCode(activeInstanceName!)} className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">Reiniciar Protocolo</button>
                 </div>
               ) : (
                 <>
                   {qrCodeImage && <img src={qrCodeImage} alt="QR Code" className="w-full h-auto animate-in zoom-in-90 duration-500 shadow-xl" />}
                   {pairingCode && (
                     <div className="mt-6 pt-6 border-t border-slate-100 w-full text-center">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3">Código de Pareamento</p>
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 flex items-center justify-center gap-3">
                           <Hash size={18} className="text-orange-600" />
                           <span className="text-2xl font-black text-slate-900 tracking-[0.4em] italic">{pairingCode}</span>
                        </div>
                     </div>
                   )}
                 </>
               )}
            </div>

            <div className="space-y-4">
               <div className="flex items-center gap-5 p-5 bg-white/5 border border-white/10 rounded-[2rem] text-left">
                  <div className="w-12 h-12 bg-orange-600/20 rounded-2xl flex items-center justify-center text-orange-500 shrink-0"><Scan size={24}/></div>
                  <div>
                     <p className="text-[11px] text-white font-black uppercase mb-1 tracking-tight">Instruções:</p>
                     <p className="text-[10px] text-slate-500 leading-tight">Abra o WhatsApp no seu smartphone > Aparelhos Conectados > Escaneie o código acima.</p>
                  </div>
               </div>
               <button onClick={() => { setShowQrModal(false); testConnection(); }} className="w-full py-5 bg-white/5 text-white font-black text-[11px] uppercase tracking-[0.3em] rounded-2xl hover:bg-orange-600 transition-all border border-white/5 shadow-2xl">Confirmar Conexão</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Connections;
