import React, { useState, useEffect } from 'react';
import { Check, Star, Users, Package, BarChart2, Zap, ShieldCheck } from 'lucide-react';
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
    icon: Icon
}: any) => (
    <div className={`relative flex flex-col p-6 rounded-3xl transition-all duration-300 ${
        recommended 
        ? 'bg-white border-2 border-mint shadow-xl scale-105 z-10' 
        : 'bg-white border border-gray-100 shadow-soft hover:shadow-lg'
    } ${current ? 'ring-2 ring-offset-2 ring-gray-200' : ''}`}>
        
        {recommended && (
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-mint text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-sm">
                Populaire
            </div>
        )}

        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${color}`}>
            <Icon className="text-white w-6 h-6" />
        </div>

        <h3 className="text-xl font-bold text-gray-900 mb-1">{title}</h3>
        <div className="flex items-baseline mb-6">
            <span className="text-3xl font-display font-bold text-gray-900">{price}</span>
            <span className="text-gray-500 ml-1 text-sm">/mois</span>
        </div>

        <ul className="space-y-4 mb-8 flex-1">
            {features.map((feat: string, idx: number) => (
                <li key={idx} className="flex items-start gap-3 text-sm text-gray-600">
                    <Check className="text-mint w-5 h-5 shrink-0" />
                    <span>{feat}</span>
                </li>
            ))}
        </ul>

        <button 
            onClick={onSelect}
            disabled={current}
            className={`w-full py-3 rounded-xl font-bold transition-all ${
                current 
                ? 'bg-gray-100 text-gray-400 cursor-default' 
                : recommended
                    ? 'bg-mint text-white hover:bg-teal-400 shadow-lg shadow-mint/30'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
            }`}
        >
            {current ? 'Plan Actuel' : 'Choisir ce plan'}
        </button>
    </div>
);

const Subscriptions = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        supabase.getUser().then(setUser);
    }, []);

    const handleSelectPlan = async (plan: 'free' | 'premium' | 'family') => {
        setLoading(true);
        // Simulate API call
        await supabase.updateUser({ plan });
        const updatedUser = await supabase.getUser();
        setUser(updatedUser);
        setLoading(false);
    };

    if (!user) return <div className="p-12 text-center"><div className="animate-spin w-8 h-8 border-2 border-mint rounded-full border-t-transparent mx-auto"></div></div>;

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            <div className="text-center max-w-2xl mx-auto">
                <h1 className="text-3xl font-display font-bold text-gray-900 mb-3">Nos Offres</h1>
                <p className="text-gray-500">
                    Gérez votre foyer en toute sérénité avec nos plans adaptés à vos besoins.
                    Changez d'offre à tout moment.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto px-4 mt-8">
                {/* Free Plan */}
                <PlanCard 
                    title="Découverte"
                    price="0€"
                    icon={Package}
                    color="bg-gray-400"
                    current={user.plan === 'free'}
                    features={[
                        "1 Utilisateur",
                        "Jusqu'à 50 produits",
                        "Recettes basiques",
                        "Alertes de péremption"
                    ]}
                    onSelect={() => handleSelectPlan('free')}
                />

                {/* Premium Plan */}
                <PlanCard 
                    title="Premium"
                    price="4.99€"
                    icon={Zap}
                    color="bg-mint"
                    recommended={true}
                    current={user.plan === 'premium'}
                    features={[
                        "3 Utilisateurs",
                        "Jusqu'à 500 produits",
                        "Recettes IA Illimitées",
                        "Statistiques de consommation",
                        "Export CSV",
                        "Scan de tickets illimité"
                    ]}
                    onSelect={() => handleSelectPlan('premium')}
                />

                {/* Family Plan */}
                <PlanCard 
                    title="Famille"
                    price="9.99€"
                    icon={ShieldCheck}
                    color="bg-honey"
                    current={user.plan === 'family'}
                    features={[
                        "6 Utilisateurs",
                        "Produits illimités",
                        "Toutes les fonctions Premium",
                        "Support prioritaire",
                        "Gestion multi-foyers (bientôt)",
                        "Accès anticipé aux nouveautés"
                    ]}
                    onSelect={() => handleSelectPlan('family')}
                />
            </div>

            {loading && (
                <div className="fixed inset-0 bg-white/50 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-2xl shadow-xl flex items-center gap-4">
                        <div className="animate-spin w-6 h-6 border-2 border-mint rounded-full border-t-transparent"></div>
                        <span className="font-medium text-gray-800">Mise à jour de votre abonnement...</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Subscriptions;