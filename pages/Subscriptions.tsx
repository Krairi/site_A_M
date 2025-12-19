
import React, { useState, useEffect } from 'react';
import { Check, Star, Users, Package, BarChart2, Zap, ShieldCheck, Loader2, CreditCard } from 'lucide-react';
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
    loading = false
}: any) => (
    <div className={`relative flex flex-col p-8 rounded-[2.5rem] transition-all duration-500 ${
        recommended 
        ? 'bg-white border-2 border-mint shadow-2xl scale-105 z-10' 
        : 'bg-white border border-gray-100 shadow-soft hover:shadow-xl'
    } ${current ? 'ring-2 ring-offset-4 ring-mint/20' : ''}`}>
        
        {recommended && (
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-mint text-white px-6 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-lg animate-bounce">
                Plus Populaire
            </div>
        )}

        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-lg ${color}`}>
            <Icon className="text-white w-7 h-7" />
        </div>

        <h3 className="text-2xl font-display font-bold text-gray-900 mb-1">{title}</h3>
        <div className="flex items-baseline mb-8">
            <span className="text-4xl font-display font-bold text-gray-900">{price}</span>
            <span className="text-gray-500 ml-1 text-sm font-medium">/mois</span>
        </div>

        <ul className="space-y-5 mb-10 flex-1">
            {features.map((feat: string, idx: number) => (
                <li key={idx} className="flex items-start gap-4 text-sm text-gray-600">
                    <div className="mt-1 p-0.5 bg-mint/10 rounded-full text-mint">
                        <Check size={14} />
                    </div>
                    <span className="leading-tight">{feat}</span>
                </li>
            ))}
        </ul>

        <button 
            onClick={onSelect}
            disabled={current || loading}
            className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-3 ${
                current 
                ? 'bg-gray-100 text-gray-400 cursor-default' 
                : recommended
                    ? 'bg-mint text-white hover:bg-teal-400 shadow-xl shadow-mint/30 active:scale-95 hover:-translate-y-1'
                    : 'bg-gray-900 text-white hover:bg-gray-800 active:scale-95'
            }`}
        >
            {loading && !current ? <Loader2 className="animate-spin w-4 h-4" /> : null}
            {current ? 'Votre Plan Actuel' : 'Souscrire'}
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
        <div className="space-y-12 animate-fade-in pb-20">
            <div className="text-center max-w-2xl mx-auto space-y-4">
                <span className="px-4 py-1.5 bg-mint/10 text-mint rounded-full text-xs font-black uppercase tracking-widest">Pricing</span>
                <h1 className="text-4xl font-display font-bold text-gray-900">Le foyer, en mode pilote automatique</h1>
                <p className="text-gray-500 text-lg">
                    Choisissez le plan qui correspond à vos ambitions domestiques.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto px-4">
                <PlanCard 
                    title="Découverte"
                    price="0€"
                    icon={Package}
                    color="bg-gray-400"
                    current={user.plan === 'free'}
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
                    color="bg-gray-900"
                    current={user.plan === 'family'}
                    loading={loadingPlan === 'family'}
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

            {/* PAYMENT MODAL (MOCK) */}
            {isPaymentModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !loadingPlan && setIsPaymentModalOpen(false)}></div>
                    <div className="bg-white rounded-[3rem] w-full max-w-md shadow-2xl relative z-10 overflow-hidden animate-slide-up">
                        <div className="p-10 text-center space-y-6">
                            <div className="w-20 h-20 bg-mint/10 text-mint rounded-3xl flex items-center justify-center mx-auto">
                                <CreditCard size={40} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-display font-bold text-gray-900">Activation du Plan {selectedPlan}</h3>
                                <p className="text-gray-500 mt-2">Paiement sécurisé via DomyPay</p>
                            </div>
                            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 text-left space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Sous-total</span>
                                    <span className="font-bold">{selectedPlan === 'premium' ? '4.99' : '9.99'} €</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Taxes (TVA 20%)</span>
                                    <span className="font-bold">Incluses</span>
                                </div>
                                <div className="pt-3 border-t border-gray-200 flex justify-between">
                                    <span className="font-bold">Total à payer</span>
                                    <span className="text-xl font-display font-bold text-mint">{selectedPlan === 'premium' ? '4.99' : '9.99'} €</span>
                                </div>
                            </div>
                            <button 
                                onClick={handlePayment}
                                disabled={loadingPlan !== null}
                                className="w-full py-5 bg-mint text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-mint/30 flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {loadingPlan ? <Loader2 className="animate-spin" /> : <ShieldCheck />}
                                Confirmer le paiement
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Subscriptions;
