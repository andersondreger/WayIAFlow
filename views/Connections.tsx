
import React, { useState, useEffect } from 'react';
import { 
  Smartphone, RefreshCw, Loader2, Trash2, QrCode, Monitor, Scan, Settings2, Globe, Server, Link2, Zap, AlertCircle, CheckCircle2
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

  const [isLoading, setIsLoading] = useState(false);
  const [activeInstance, setActiveInstance] = useState<string>(localStorage.getItem('wayflow_last_instance') || '');
  const [diagInfo, setDiagInfo] = useState<{ status: 'idle' | 'testing' | 'success' | 'error', msg: string }>({ status: 'idle', msg: '' });
  
  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem('wayflow_evo_config');
    return saved ? JSON.parse(saved) : { evoUrl: '', evoKey: '' };
  });

  // Salva configurações sempre que mudarem
  useEffect(() => {
    localStorage.setItem('wayflow_evo_config', JSON.stringify(config));
  }, [config]);

  // Salva cache de instâncias sempre que mudarem
  useEffect(() => {
    localStorage.setItem('wayflow_instances_cache', JSON.stringify(instances));
  }, [instances]);

  const testConnection = async () => {
    if (!config.evoUrl || !config.evoKey) {
       setDiagInfo({ status: 'error', msg: 'Preencha a URL e a API Key para prosseguir.' });
       return;
    }

    setDiagInfo({ status: 'testing', msg: 'Conectando ao cluster Evolution...' });
    setIsLoading(true);
    
    let baseUrl = config.evoUrl.trim().replace(/\/+$/, "");
    if (!baseUrl.startsWith('http')) baseUrl = 'https://' + baseUrl;
    
    try {
      const response = await fetch(`${baseUrl}/instance/fetchInstances`, {
        headers: { 'apikey': config.evoKey.trim(), 'Content-Type': 'application/json' }
      });

      if (!response.ok) throw new Error("Acesso negado. Credenciais inválidas.");
      
      const data = await response.json();
      const raw = Array.isArray(data) ? data : (data.instances || data.data || []);
      
      const mapped: Instance[] = raw.map((item: any) => {
        const instData = item.instance || item;
        const rawStatus = item.connectionStatus || item.status || instData.status || item.state;
        return {
          id: item.instanceId || item.id || Math.random().toString(),
          name: item.instanceName || item.name || instData.name,
          status: (rawStatus === 'open' || rawStatus === 'CONNECTED') ? 'connected' : 'disconnected',
          phone: item.ownerJid ? item.ownerJid.split('@')[0] : (instData.ownerJid ? instData.ownerJid.split('@')[0] : 'N/A')
        };
      });

      setInstances(mapped);
      setDiagInfo({ status: 'success', msg: `Link Estabelecido! ${mapped.length} instâncias encontradas.` });
    } catch (err: any) {
      setDiagInfo({ status: 'error', msg: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const selectInstance = (name: string) => {
    setActiveInstance(name);
    localStorage.setItem('wayflow_last_instance', name);
    alert(`Node ${name} ativado com sucesso.`);
  };

  // FUNÇÃO DE EXCLUSÃO CORRIGIDA
  const deleteInstance = async (id: string, name: string) => {
    if (!confirm(`Deseja realmente remover o node "${name}" da lista?`)) return;

    // 1. Remove do estado visual imediatamente (Melhora a performance percebida)
    setInstances(prev => prev.filter(inst => inst.id !== id));

    // 2. Se era a instância ativa, limpa a referência
    if (activeInstance === name) {
      setActiveInstance('');
      localStorage.removeItem('wayflow_last_instance');
    }

    // 3. Tenta remover na API (Opcional, se a API suportar logout/delete via ID)
    try {
      if (config.evoUrl && config.evoKey) {
        const baseUrl = config.evoUrl.trim().replace(/\/+$/, "");
        await fetch(`${baseUrl}/instance/logout/${name}`, {
          method: 'DELETE',
          headers: { 'apikey': config.evoKey.trim() }
        });
      }
    } catch (e) {
      console.warn("Removido apenas localmente. Erro ao comunicar com a API.");
    }
  };

  return (
    <Layout activeView={AppView.CONNECTIONS} onNavigate={onNavigate} onLogout={onLogout}>
      <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500">
        
        {/* Connection Dashboard Branding */}
        <div className="bg-gradient-to-br from-[#03081a] to-[#010411] border border-white/10 p-12 rounded-[3.5rem] relative overflow-hidden shadow-2xl">
           <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12 scale-150"><Link2 size={300} className="text-orange-500" /></div>
           <div className="relative z-10">
              <div className="flex items-center gap-4 mb-8">
                 <div className="px-5 py-2.5 bg-orange-600/10 border border-orange-500/20 rounded-full flex items-center gap-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black text-orange-500 uppercase tracking-[0.4em]">Node Cluster Management</span>
                 </div>
              </div>
              <h1 className="text-6xl font-black text-white tracking-tighter mb-8 italic uppercase leading-[0.85]">Evolution <br /><span className="text-orange-500">API Hub</span>.</h1>
              <p className="text-slate-400 text-lg max-w-xl font-medium leading-relaxed mb-12">Integre seus números de WhatsApp via Evolution API para habilitar o atendimento neural.</p>
              
              <button onClick={testConnection} className="px-10 py-5 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.4em] shadow-2xl flex items-center gap-4 transition-all active:scale-95 group">
                {isLoading ? <Loader2 className="animate-spin" /> : <RefreshCw size={20} />} Sincronizar Nodes
              </button>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
           {/* LEFT: CONFIGURATION */}
           <div className="lg:col-span-5 space-y-8">
              <div className="bg-[#020617] border border-white/5 p-10 rounded-[2.5rem] shadow-2xl space-y-8">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-orange-500 border border-white/5"><Settings2 size={24} /></div>
                    <h3 className="text-lg font-black text-white italic uppercase tracking-tighter">Credenciais API</h3>
                 </div>

                 <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Endpoint URL</label>
                       <input type="text" placeholder="https://api.seuservidor.com" value={config.evoUrl} onChange={(e) => setConfig({...config, evoUrl: e.target.value})} className="w-full bg-white/[0.02] border border-white/10 rounded-2xl py-5 px-6 text-sm text-white focus:outline-none focus:border-orange-500 transition-all"/>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Global Api Key</label>
                       <input type="password" placeholder="••••••••••••••••" value={config.evoKey} onChange={(e) => setConfig({...config, evoKey: e.target.value})} className="w-full bg-white/[0.02] border border-white/10 rounded-2xl py-5 px-6 text-sm text-white focus:outline-none focus:border-orange-500 transition-all"/>
                    </div>

                    {diagInfo.status !== 'idle' && (
                      <div className={`p-6 rounded-[2rem] border flex items-start gap-4 animate-in zoom-in-95 ${diagInfo.status === 'success' ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-500' : 'bg-orange-600/5 border-orange-500/10 text-orange-500'}`}>
                         {diagInfo.status === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                         <p className="text-xs font-medium leading-relaxed">{diagInfo.msg}</p>
                      </div>
                    )}
                 </div>
              </div>
           </div>

           {/* RIGHT: INSTANCE LIST */}
           <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-6">
              {instances.map(inst => (
                <div 
                 key={inst.id} 
                 className={`bg-[#03081a] border p-8 rounded-[3rem] relative transition-all shadow-xl ${activeInstance === inst.name ? 'border-orange-600' : 'border-white/5'}`}
                >
                   <div className="flex justify-between items-start mb-8">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${inst.status === 'connected' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-orange-600/10 text-orange-500'} border border-white/5`}>
                         {inst.status === 'connected' ? <Smartphone size={28} /> : <QrCode size={28} />}
                      </div>
                      <button 
                        onClick={() => deleteInstance(inst.id, inst.name)}
                        className="p-3 bg-white/5 text-slate-800 hover:text-red-500 rounded-xl transition-colors"
                      >
                         <Trash2 size={16} />
                      </button>
                   </div>
                   
                   <h4 className="text-2xl font-black text-white italic uppercase mb-2 tracking-tighter truncate">{inst.name}</h4>
                   <div className="flex items-center gap-3 mb-10">
                      <div className={`w-2 h-2 rounded-full ${inst.status === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                      <span className="text-[10px] font-black uppercase text-slate-700 tracking-widest truncate">
                        {inst.status === 'connected' ? `+${inst.phone} • ONLINE` : 'DESCONECTADO'}
                      </span>
                   </div>

                   <button 
                     onClick={() => selectInstance(inst.name)} 
                     className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeInstance === inst.name ? 'bg-white/5 text-white border border-white/10' : 'bg-orange-600 text-white shadow-lg hover:bg-orange-500'}`}
                   >
                      {activeInstance === inst.name ? 'Node Ativo' : 'Ativar Node'}
                   </button>
                </div>
              ))}

              {instances.length === 0 && (
                <div className="col-span-2 py-20 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[3.5rem] opacity-20 space-y-6">
                   <Server size={64} />
                   <p className="text-sm font-black uppercase tracking-[0.4em]">Aguardando Sincronização</p>
                </div>
              )}
           </div>
        </div>
      </div>
    </Layout>
  );
};

export default Connections;
