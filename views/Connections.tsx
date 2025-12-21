
import React, { useState } from 'react';
import { 
  Plus, Webhook, Smartphone, Lock, RefreshCw, Zap, Globe, Database, 
  Terminal, ShieldCheck, CheckCircle2, Loader2, Info
} from 'lucide-react';
import Layout from '../components/Layout.tsx';
import { AppView } from '../types.ts';

const Connections: React.FC<{ onLogout: () => void, onNavigate: (v: AppView) => void }> = ({ onLogout, onNavigate }) => {
  const [config, setConfig] = useState({
    evoUrl: 'https://evo.wayflow.ia',
    evoKey: '',
    evoInstance: 'wayflow_master',
    n8nUrl: '',
    n8nKey: ''
  });

  const [status, setStatus] = useState<{ evolution: boolean, n8n: boolean }>({
    evolution: false,
    n8n: false
  });

  const [isTesting, setIsTesting] = useState(false);
  const [qrGenerated, setQrGenerated] = useState(false);

  const handleTest = (type: 'evolution' | 'n8n') => {
    setIsTesting(true);
    setTimeout(() => {
      setStatus(prev => ({ ...prev, [type]: true }));
      setIsTesting(false);
    }, 1500);
  };

  return (
    <Layout activeView={AppView.CONNECTIONS} onNavigate={onNavigate} onLogout={onLogout}>
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter mb-2 italic">Central de Integrações.</h1>
            <p className="text-slate-500 font-medium">Conecte seu WhatsApp e orquestradores para ativar a rede neural.</p>
          </div>
          <div className="flex gap-4">
             <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-xl border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest">
                <ShieldCheck size={14} /> TLS 1.3 Active
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Evolution API Card */}
          <div className="bg-[#020617] border border-white/5 rounded-[2.5rem] p-10 space-y-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
               <Smartphone size={120} />
            </div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div className="w-14 h-14 bg-orange-600/10 text-orange-500 rounded-2xl flex items-center justify-center border border-orange-500/20">
                  <Smartphone size={28} />
                </div>
                {status.evolution && (
                  <span className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest rounded-full">
                    <CheckCircle2 size={12} /> API Ativa
                  </span>
                )}
              </div>
              <h3 className="text-2xl font-black text-white mb-6 italic tracking-tight">Evolution API (WhatsApp)</h3>
              
              <div className="space-y-4">
                <Input icon={Globe} label="URL da Instância" value={config.evoUrl} onChange={(v) => setConfig({...config, evoUrl: v})} />
                <Input icon={Lock} label="API Key (Global/Instance)" type="password" value={config.evoKey} onChange={(v) => setConfig({...config, evoKey: v})} />
                <Input icon={Terminal} label="Nome da Instância" value={config.evoInstance} onChange={(v) => setConfig({...config, evoInstance: v})} />
              </div>

              <div className="pt-6 flex gap-4">
                <button 
                  onClick={() => handleTest('evolution')}
                  className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest border border-white/10 transition-all flex items-center justify-center gap-2"
                >
                  {isTesting ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />} Testar Conexão
                </button>
                <button 
                  disabled={!status.evolution}
                  onClick={() => setQrGenerated(true)}
                  className="flex-1 py-4 bg-orange-600 hover:bg-orange-500 disabled:opacity-30 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-orange-600/20 transition-all"
                >
                  Gerar QR Code
                </button>
              </div>
            </div>
          </div>

          {/* n8n Integration Card */}
          <div className="bg-[#020617] border border-white/5 rounded-[2.5rem] p-10 space-y-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
               <Webhook size={120} />
            </div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div className="w-14 h-14 bg-purple-600/10 text-purple-500 rounded-2xl flex items-center justify-center border border-purple-500/20">
                  <Webhook size={28} />
                </div>
                {status.n8n && (
                   <span className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest rounded-full">
                     <CheckCircle2 size={12} /> n8n Linked
                   </span>
                )}
              </div>
              <h3 className="text-2xl font-black text-white mb-6 italic tracking-tight">Portainer / n8n Workflow</h3>
              
              <div className="space-y-4">
                <Input icon={Globe} label="URL do n8n (Webhook Host)" placeholder="https://n8n.seudominio.com" value={config.n8nUrl} onChange={(v) => setConfig({...config, n8nUrl: v})} />
                <Input icon={Lock} label="Webhook API Key" type="password" value={config.n8nKey} onChange={(v) => setConfig({...config, n8nKey: v})} />
                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center gap-4">
                   <Info size={20} className="text-slate-500" />
                   <p className="text-[10px] text-slate-500 leading-relaxed font-medium">Aponte as notificações da Evolution para este orquestrador para processar abandonos em tempo real.</p>
                </div>
              </div>

              <div className="pt-6">
                <button 
                  onClick={() => handleTest('n8n')}
                  className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-purple-600/20 transition-all flex items-center justify-center gap-2"
                >
                  {isTesting ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />} Sincronizar Orquestrador
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* QR Code Section */}
        {qrGenerated && (
          <div className="bg-[#020617] border border-white/5 rounded-[2.5rem] p-12 flex flex-col items-center text-center animate-in zoom-in-95 duration-500">
             <div className="bg-white p-6 rounded-[3rem] shadow-2xl mb-8 relative">
                <div className="absolute inset-0 bg-orange-500/10 blur-2xl rounded-full" />
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=WAYFLOW_AUTH_${Date.now()}`} 
                  alt="QR Code" 
                  className="relative z-10 w-48 h-48 opacity-90"
                />
             </div>
             <h3 className="text-3xl font-black text-white mb-4 italic">Conectar WhatsApp Web</h3>
             <p className="text-slate-500 max-w-md mx-auto mb-8 font-medium">Abra o WhatsApp no seu celular {'>'} Configurações {'>'} Aparelhos Conectados e escaneie o código acima.</p>
             <div className="flex gap-4">
                <div className="flex items-center gap-2 px-6 py-2 bg-white/5 rounded-full border border-white/10 text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">
                  Aguardando Scan...
                </div>
             </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

const Input: React.FC<{ icon: any, label: string, value: string, onChange: (v: string) => void, type?: string, placeholder?: string }> = ({ icon: Icon, label, value, onChange, type = 'text', placeholder }) => (
  <div className="space-y-2 group">
    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{label}</label>
    <div className="relative">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-orange-500 transition-colors">
        <Icon size={18} />
      </div>
      <input 
        type={type} 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        placeholder={placeholder}
        className="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm text-slate-200 font-bold focus:outline-none focus:border-orange-500/50 transition-all placeholder:text-slate-700"
      />
    </div>
  </div>
);

export default Connections;
