
import React, { useState } from 'react';
import { ShieldCheck, ArrowLeft, Loader2, CreditCard, Smartphone, Check } from 'lucide-react';

interface CheckoutProps {
  onComplete: () => void;
  onBack: () => void;
}

const Logo: React.FC<{ className?: string }> = ({ className = "h-8" }) => {
  return (
    <div className="flex items-center gap-2 select-none">
      <img src="https://qonrpzlkjhdmswjfxvtu.supabase.co/storage/v1/object/public/WayIAFlow/logo.png" alt="WayFlow iA Logo" className={className} onError={(e) => {
        (e.target as HTMLImageElement).src = 'https://placehold.co/200x80/ffffff/000000?text=WayFlow+iA';
      }} />
    </div>
  );
};

const Checkout: React.FC<CheckoutProps> = ({ onComplete, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState<'card' | 'pix'>('card');

  const handlePay = () => {
    setLoading(true);
    setTimeout(() => {
      onComplete();
      setLoading(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-12 px-6">
      <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-12">
        {/* Left Side: Product Info & Form */}
        <div className="flex-1 space-y-8">
          <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors">
            <ArrowLeft size={18} /> Voltar para o site
          </button>

          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-2">
              <Logo className="h-12 w-auto" />
              <h1 className="text-3xl font-extrabold tracking-tight italic">Assinatura Premium</h1>
            </div>
            
            {/* Payment Methods */}
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setMethod('card')}
                className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all ${method === 'card' ? 'border-orange-600 bg-orange-50/50' : 'border-slate-200 hover:border-slate-300'}`}
              >
                <CreditCard className={method === 'card' ? 'text-orange-600' : 'text-slate-400'} />
                <span className={`text-sm font-bold ${method === 'card' ? 'text-orange-900' : 'text-slate-500'}`}>Cartão de Crédito</span>
              </button>
              <button 
                onClick={() => setMethod('pix')}
                className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all ${method === 'pix' ? 'border-orange-600 bg-orange-50/50' : 'border-slate-200 hover:border-slate-300'}`}
              >
                <Smartphone className={method === 'pix' ? 'text-orange-600' : 'text-slate-400'} />
                <span className={`text-sm font-bold ${method === 'pix' ? 'text-orange-900' : 'text-slate-500'}`}>Pix Instantâneo</span>
              </button>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 space-y-6">
              {method === 'card' ? (
                <>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Número do Cartão</label>
                      <input type="text" placeholder="0000 0000 0000 0000" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-600" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Validade</label>
                        <input type="text" placeholder="MM/AA" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-600" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">CVC</label>
                        <input type="text" placeholder="123" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-600" />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm text-slate-600 mb-4">Você receberá um código copia e cola após clicar no botão.</p>
                  <div className="w-32 h-32 bg-slate-100 mx-auto rounded-2xl flex items-center justify-center text-slate-300">
                    <Smartphone size={48} />
                  </div>
                </div>
              )}

              <button 
                onClick={handlePay}
                disabled={loading}
                className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 disabled:from-orange-400 disabled:to-red-400 py-4 rounded-2xl text-white font-black text-lg shadow-xl shadow-orange-600/30 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" /> : 'CONCLUIR PAGAMENTO'}
              </button>
              
              <div className="flex items-center justify-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest">
                <ShieldCheck size={16} /> Pagamento 100% Seguro
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Order Summary */}
        <div className="w-full lg:w-96 space-y-6">
          <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
             <div className="mb-6">
                <Logo className="h-10 w-auto" />
             </div>
             
             <h3 className="text-xl font-bold mb-6">WayFlow iA Enterprise</h3>
             <ul className="space-y-4 mb-8">
               {[
                 'Acesso ilimitado ao n8n',
                 'Conexão Evolution API (5 instâncias)',
                 'Criador de Agentes IA Neural',
                 'Dashboards em Tempo Real',
                 'Suporte Priority iA 24/7'
               ].map((item, i) => (
                 <li key={i} className="flex items-center gap-3 text-sm text-orange-100">
                   <div className="w-5 h-5 bg-orange-500/30 rounded-full flex items-center justify-center"><Check size={12} className="text-orange-400" /></div>
                   {item}
                 </li>
               ))}
             </ul>

             <div className="pt-6 border-t border-white/10 space-y-3">
               <div className="flex justify-between text-sm">
                 <span className="text-slate-400">Subtotal:</span>
                 <span>R$ 497,00</span>
               </div>
               <div className="flex justify-between text-sm">
                 <span className="text-slate-400">Desconto Especial:</span>
                 <span className="text-emerald-400">- R$ 100,00</span>
               </div>
               <div className="flex justify-between text-xl font-bold pt-2">
                 <span>Total:</span>
                 <span className="text-orange-400">R$ 397,00/mês</span>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
