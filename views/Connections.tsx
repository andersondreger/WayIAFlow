
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
  const [instances, setInstances] = useState<Instance[]>(() => {
    const cached = localStorage.getItem('wayflow_instances_cache');
    return cached ? JSON.parse(cached) : [];
  });

  const [isLoadingInstances, setIsLoadingInstances] = useState(false);
  
  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem('wayflow_evo_config');
    return saved ? JSON.parse(saved) : { evoUrl: '', evoKey: '', evoInstance: '' };
  });

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'none' | 'success' | 'error'>('none');

  useEffect(() => {
    localStorage.setItem('wayflow_evo_config', JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem('wayflow_instances_cache', JSON.stringify(instances));
  }, [instances]);

  const refreshInstancesFromServer = useCallback(async (isAuto = false) => {
    if (!config.evoUrl || !config.evoKey) return;
    
    // Validar se a URL começa com http
    if (!config.evoUrl.startsWith('http')) {
      if (!isAuto) alert("A URL da API deve começar com http:// ou https://");
      return;
    }

    if (!isAuto) setIsLoadingInstances(true);
    let baseUrl = config.evoUrl.trim().replace(/\/$/, "");
    
    try {
      const response = await fetch(`${baseUrl}/instance/fetchInstances`, {
        method: 'GET',
        headers: { 
          'apikey': config.evoKey,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `Erro HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      // A Evolution API pode retornar um array direto ou um objeto { instances: [] }
      const instancesRaw = Array.isArray(data) ? data : (data.instances || []);
      
      if (!Array.isArray(instancesRaw)) {
        console.error("Formato de resposta inesperado:", data);
        throw new Error("Formato de resposta da API inválido.");
      }

      const mapped: Instance[] = instancesRaw.map((item: any) => ({
        id: item.instanceId || item.id || Math.random().toString(),
        name: item.instanceName || item.name,
        status: (item.connectionStatus === 'open' || item.status === 'open' || item.instance?.status === 'open') ? 'connected' : 'disconnected',
        phone: item.ownerJid ? item.ownerJid.split('@')[0] : (item.instance?.ownerJid ? item.instance.ownerJid.split('@')[0] : 'Não Pareado')
      }));

      setInstances(mapped);
      setTestResult('success');
    } catch (err: any) {
      console.error("Erro na Sincronização:", err);
      if (!isAuto) {
        setTestResult('error');
        alert(`Falha na conexão: ${err.message}. Verifique a URL e a Global Key.`);
      }
    } finally {
      setIsLoadingInstances(false);
    }
  }, [config.evoUrl, config.evoKey]);

  useEffect(() => {
    if (config.evoUrl && config.evoKey) {
      const timeout = setTimeout(() => refreshInstancesFromServer(true), 500);
      return () => clearTimeout(timeout);
    }
  }, [config.evoUrl, config.evoKey, refreshInstancesFromServer]);

  const handleTestConnection = async () => {
    if (!config.evoKey || !config.evoUrl) return alert("Preencha a URL e a Global Key.");
    setIsTesting(true);
    setTestResult('none');
    try {
      await refreshInstancesFromServer();
    } catch (e) {
      setTestResult('error');
    } finally {
      setIsTesting(false);
    }
  };

  const createInstanceInApp = async () => {
    if (!config.evoInstance) return;
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
          instanceName: config.evoInstance.trim().toUpperCase(), 
          qrcode: true, 
          integration: "WHATSAPP-BAILEYS" 
        })
      });
      
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Erro ao criar instância.");
      }

      setConfig({ ...config, evoInstance: '' });
      await refreshInstancesFromServer();
      alert("Instância criada com sucesso! Agora clique em Gerenciar para parear.");
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
      const response = await fetch(`${baseUrl}/instance/delete/${name}`, { 
        method: 'DELETE', 
        headers: { 'apikey': config.evoKey } 
      });
      if (response.ok) {
        setInstances(prev => prev.filter(i => i.name !== name));
        refreshInstancesFromServer(true);
      } else {
        throw new Error("Erro ao deletar no servidor.");
      }
    } catch (e) { alert("Erro ao deletar instância."); }
  };

  return (
    <Layout activeView={AppView.CONNECTIONS} onNavigate={onNavigate} onLogout={onLogout}>
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
        
        {/* Header Compacto */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#03081a] border border-white/5 p-8 rounded-3xl relative overflow-hidden">
           <div className="relative z-10 font-outfit">
              <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">Canais.</h1>
              <p className="text-slate-500 font-medium mt-2 text-xs">Clusters de conexão Evolution API.</p>
           </div>
           <button 
             onClick={() => refreshInstancesFromServer()}
             disabled={isLoadingInstances}
             className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3 hover:bg-white/10 transition-all text-xs font-black text-white uppercase tracking-widest disabled:opacity-50"
           >
              <RefreshCw size={16} className={isLoadingInstances ? 'animate-spin' : ''} />
              {instances.length} Instâncias Ativas
           </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Configuração Compacta */}
          <div className="lg:col-span-4">
             <div className="bg-[#020617] border border-white/10 p-8 rounded-3xl space-y-6 shadow-2xl">
                <div className="flex items-center gap-3">
                   <Settings2 size={18} className="text-orange-500" />
                   <h3 className="font-outfit text-sm font-black text-white uppercase tracking-widest">Configuração API</h3>
                </div>

                <div className="space-y-4">
                   <InputGroup label="URL EVOLUTION" placeholder="https://api.seusite.com" value={config.evoUrl} onChange={(v) => setConfig({...config, evoUrl: v})} />
                   <InputGroup label="GLOBAL KEY" placeholder="Sua apikey mestre" type="password" value={config.evoKey} onChange={(v) => setConfig({...config, evoKey: v})} />
                   
                   <button 
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    className={`w-full py-4 rounded-xl font-outfit font-black text-[9px] uppercase tracking-widest transition-all border ${
                      testResult === 'success' 
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                        : testResult === 'error'
                        ? 'bg-red-500/10 border-red-500/20 text-red-500'
                        : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                    }`}
                   >
                     {isTesting ? <Loader2 size={14} className="animate-spin mx-auto" /> : testResult === 'success' ? 'API CONECTADA' : 'Sincronizar API'}
                   </button>

                   {testResult === 'success' && (
                     <div className="pt-6 border-t border-white/5 space-y-4 animate-in slide-in-from-top-2">
                        <InputGroup label="NOME DA NOVA INSTÂNCIA" placeholder="Ex: VENDAS_01" value={config.evoInstance} onChange={(v) => setConfig({...config, evoInstance: v})} />
                        <button onClick={createInstanceInApp} className="w-full py-4 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg shadow-orange-600/20 transition-all">Criar Instância</button>
                     </div>
                   )}
                </div>
             </div>
          </div>

          {/* Cards Compactos */}
          <div className="lg:col-span-8">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {instances.length === 0 ? (
                  <div className="col-span-full py-20 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-3xl opacity-30">
                     <Monitor size={48} className="mb-4" />
                     <p className="font-outfit text-xs font-black uppercase tracking-widest">Nenhum canal pareado neste cluster</p>
                  </div>
                ) : instances.map(inst => (
                  <div key={inst.id} className="bg-[#03081a] border border-white/5 p-8 rounded-3xl relative group hover:border-orange-500/20 transition-all">
                     <div className="flex justify-between items-start mb-6">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${inst.status === 'connected' ? 'bg-emerald-500/10 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'bg-white/5 text-slate-700'}`}>
                           <Smartphone size={20} />
                        </div>
                        <button onClick={() => deleteInstance(inst.name)} className="text-slate-800 hover:text-red-500 transition-colors p-2"><Trash2 size={16} /></button>
                     </div>
                     <h4 className="text-xl font-black text-white italic uppercase mb-2 truncate">{inst.name}</h4>
                     <div className="flex items-center gap-2 mb-6">
                        <div className={`w-1.5 h-1.5 rounded-full ${inst.status === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                        <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">
                          {inst.status === 'connected' ? `ONLINE • ${inst.phone}` : 'OFFLINE / DESCONECTADO'}
                        </span>
                     </div>
                     <button 
                        onClick={() => onNavigate(AppView.CHAT_MANAGER)}
                        className="w-full py-3 bg-white/5 text-white border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-orange-600 hover:border-orange-600 transition-all"
                     >
                       Gerenciar Atendimento
                     </button>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

const InputGroup: React.FC<{ label: string, value: string, onChange: (v: string) => void, type?: string, placeholder?: string }> = ({ label, value, onChange, type = 'text', placeholder }) => (
  <div className="space-y-1.5">
    <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest ml-1">{label}</label>
    <input 
      type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className="w-full bg-white/[0.02] border border-white/10 rounded-xl py-3 px-4 text-xs text-white focus:outline-none focus:border-orange-500 transition-all placeholder:text-slate-800 font-medium"
    />
  </div>
);

export default Connections;
