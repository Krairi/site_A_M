
import React, { useState, useEffect } from 'react';
import { Check, Package, Zap, ShieldCheck, Loader2, CreditCard } from 'lucide-react';
import { supabase } from '../services/mockSupabase';
import { User } from '../types';

const PlanCard = ({ 
    title, 
    price, 
    features, 
    recommended = false, 
    current = false, 
    onSelect,
    color,
    icon: Icon,
    loading = false,
    buttonColor = "bg-gray-900"
}: any) => (
    <div className={`relative flex flex-col p-8 rounded-[3rem] transition-all duration-500 h-full ${
        recommended 
        ? 'bg-white border-2 border-mint shadow-2xl scale-105 z-10' 
        : 'bg-white border border-gray-100 shadow-soft hover:shadow-xl'
    } ${current ? 'bg-white' : ''}`}>
        
        {recommended && (
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-mint text-white px-6 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                Plus Populaire
            </div>
        )}

        <div className="flex flex-col mb-8">
            <h3 className="text-3xl font-display font-bold text-gray-900 mb-1">{title}</h3>
            <div className="flex items-baseline">
                <span className="text-4xl font-display font-bold text-gray-900">{price}</span>
                <span className="text-gray-500 ml-1 text-sm font-medium">/mois</span>
            </div>
        </div>

        <ul className="space-y-6 mb-12 flex-1">
            {features.map((feat: string, idx: number) => (
                <li key={idx} className="flex items-start gap-4 text-sm text-gray-500 font-medium">
                    <div className="mt-0.5 p-0.5 bg-mint/10 rounded-full text-mint flex-shrink-0">
                        <Check size={14} />
                    </div>
                    <span className="leading-snug">{feat}</span>
                </li>
            ))}
        </ul>

        <button 
            onClick={onSelect}
            disabled={current || loading}
            className={`w-full py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-3 ${
                current 
                ? 'bg-[#F2F3F4] text-[#D5D8DC] cursor-default border border-gray-100 shadow-none' 
                : `${buttonColor} text-white hover:opacity-90 shadow-xl active:scale-95 transition-transform`
            }`}
        >
            {loading && !current ? <Loader2 className="animate-spin w-4 h-4" /> : null}
            {current ? 'VOTRE PLAN ACTUEL' : 'SOUSCRIRE'}
        </button>
    </div>
);

const Subscriptions = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<User['plan'] | null>(null);

    useEffect(() => {
        supabase.getUser().then(setUser);
    }, []);

    const startCheckout = (plan: User['plan']) => {
        if (plan === user?.plan) return;
        setSelectedPlan(plan);
        setIsPaymentModalOpen(true);
    };

    const handlePayment = async () => {
        if (!selectedPlan) return;
        setLoadingPlan(selectedPlan);
        const ok = await supabase.processPayment(selectedPlan);
        if (ok) {
            setUser(prev => prev ? { ...prev, plan: selectedPlan } : null);
            setIsPaymentModalOpen(false);
            window.dispatchEvent(new Event('givd-update'));
        }
        setLoadingPlan(null);
    };

    if (!user) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-mint" /></div>;

    return (
        <div className="space-y-16 animate-fade-in pb-20 pt-10">
            <div className="text-center max-w-2xl mx-auto space-y-4">
                <span className="px-4 py-1.5 bg-mint/10 text-mint rounded-full text-[10px] font-black uppercase tracking-widest">Abonnements</span>
                <h1 className="text-5xl font-display font-bold text-gray-900">Le foyer, en mode pilote automatique</h1>
                <p className="text-gray-400 text-lg font-medium">
                    Choisissez le plan qui correspond à vos ambitions domestiques.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto px-4 items-stretch">
                <PlanCard 
                    title="Découverte"
                    price="0€"
                    icon={Package}
                    color="bg-gray-400"
                    current={user.plan === 'free'}
                    buttonColor="bg-gray-200"
                    features={[
                        "Jusqu'à 10 produits en stock",
                        "Scan de tickets manuel",
                        "Recettes basiques (Mock)",
                        "Alertes péremption standards"
                    ]}
                    onSelect={() => startCheckout('free')}
                />

                <PlanCard 
                    title="Premium"
                    price="4.99€"
                    icon={Zap}
                    color="bg-mint"
                    recommended={true}
                    current={user.plan === 'premium'}
                    loading={loadingPlan === 'premium'}
                    buttonColor="bg-mint"
                    features={[
                        "Stock illimité",
                        "Scan IA Gemini Illimité",
                        "Générateur de recettes IA",
                        "Coach Budget intelligent",
                        "Analyses graphiques avancées"
                    ]}
                    onSelect={() => startCheckout('premium')}
                />

                <PlanCard 
                    title="Famille"
                    price="9.99€"
                    icon={ShieldCheck}
                    color="bg-slate-850"
                    current={user.plan === 'family'}
                    loading={loadingPlan === 'family'}
                    buttonColor="bg-[#0F172A]"
                    features={[
                        "Tout le contenu Premium",
                        "Multi-comptes illimités",
                        "Support prioritaire 24/7",
                        "Exports PDF / Excel",
                        "Accès anticipé Bêta"
                    ]}
                    onSelect={() => startCheckout('family')}
                />
            </div>

            {/* MOCK PAYMENT MODAL */}
            {isPaymentModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !loadingPlan && setIsPaymentModalOpen(false)}></div>
                    <div className="bg-white rounded-[3rem] w-full max-w-md shadow-2xl relative z-10 overflow-hidden animate-slide-up">
                        <div className="p-10 text-center space-y-6">
                            <div className="w-20 h-20 bg-mint/10 text-mint rounded-3xl flex items-center justify-center mx-auto">
                                <CreditCard size={40} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-display font-bold text-gray-900 capitalize">Plan {selectedPlan}</h3>
                                <p className="text-gray-500 mt-2">Simulation de paiement sécurisé</p>
                            </div>
                            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 text-left space-y-3 font-medium">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Total</span>
                                    <span className="font-bold text-gray-900">{selectedPlan === 'premium' ? '4.99' : (selectedPlan === 'family' ? '9.99' : '0.00')} €</span>
                                </div>
                                <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
                                    <span className="font-bold text-gray-900">Total à payer</span>
                                    <span className="text-2xl font-display font-bold text-mint">{selectedPlan === 'premium' ? '4.99' : (selectedPlan === 'family' ? '9.99' : '0.00')} €</span>
                                </div>
                            </div>
                            <button 
                                onClick={handlePayment}
                                disabled={loadingPlan !== null}
                                className="w-full py-5 bg-mint text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-mint/30 flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {loadingPlan ? <Loader2 className="animate-spin" /> : <ShieldCheck />}
                                CONFIRMER LE PAIEMENT
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Subscriptions;
