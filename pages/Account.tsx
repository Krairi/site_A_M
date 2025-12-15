import React, { useState, useEffect } from 'react';
import { User, Mail, Save, CreditCard, Shield, Bell, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/mockSupabase';
import { User as UserType } from '../types';

const Account = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<UserType | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    
    // Form states
    const [name, setName] = useState('');
    const [diet, setDiet] = useState('Aucun');
    const [emailAlerts, setEmailAlerts] = useState(true);

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        const u = await supabase.getUser();
        if (u) {
            setUser(u);
            setName(u.name);
            setDiet(u.diet || 'Aucun');
            setEmailAlerts(u.emailAlerts !== false); // Default true
        }
        setLoading(false);
    };

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        setSuccess(false);
        setErrorMsg(null);
        
        // Clean input
        const cleanName = name.trim();
        
        // Update user profile including all preferences
        const ok = await supabase.updateUser({ name: cleanName, diet, emailAlerts });
        
        if (ok) {
            // Update local user state immediately for UI responsiveness
            setUser(prev => prev ? { ...prev, name: cleanName, diet, emailAlerts } : null);
            setName(cleanName);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } else {
            setErrorMsg("Impossible d'enregistrer. Vérifiez la connexion ou la base de données.");
        }

        setSaving(false);
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="animate-spin text-mint w-8 h-8" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in max-w-4xl mx-auto pb-10">
            <h1 className="text-3xl font-display font-bold text-gray-900">Mon Compte</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Profile Card */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-soft border border-gray-100">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 bg-gradient-to-br from-mint to-aqua rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-mint/30">
                                {name ? name.charAt(0).toUpperCase() : (user?.email?.charAt(0).toUpperCase() || 'U')}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">{user?.email}</h2>
                                <p className="text-gray-500 text-sm">Membre depuis 2023</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nom d'affichage</label>
                                <div className="relative group">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-mint transition-colors" size={18} />
                                    <input 
                                        type="text" 
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Votre nom d'affichage"
                                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-mint/50 focus:border-mint transition-all shadow-sm"
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email (Non modifiable)</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input 
                                        type="email" 
                                        value={user?.email || ''}
                                        disabled
                                        className="w-full pl-10 pr-4 py-3 bg-gray-100 border border-gray-100 rounded-xl text-gray-500 cursor-not-allowed select-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-soft border border-gray-100">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Shield size={20} className="text-aqua" /> Préférences & Régime
                        </h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {['Aucun', 'Végétarien', 'Vegan', 'Sans Gluten'].map((opt) => (
                                    <button
                                        key={opt}
                                        onClick={() => setDiet(opt)}
                                        className={`py-2 px-3 rounded-xl text-sm font-medium transition-all border ${
                                            diet === opt 
                                            ? 'bg-mint text-white border-mint shadow-md shadow-mint/20' 
                                            : 'bg-white text-gray-600 border-gray-200 hover:border-mint/50'
                                        }`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-gray-400">
                                Ce réglage influence les recettes générées par l'IA.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Sidebar Stats & Settings */}
                <div className="space-y-6">
                    {/* Subscription */}
                    <div className="bg-white p-6 rounded-2xl shadow-soft border border-gray-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-honey/10 rounded-bl-full -mr-4 -mt-4"></div>
                        <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                            <CreditCard size={20} className="text-honey" /> Abonnement
                        </h3>
                        <div className="mt-4 mb-6">
                            <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wide ${
                                user?.plan === 'family' ? 'bg-honey text-white' : 
                                user?.plan === 'premium' ? 'bg-mint text-white' : 
                                'bg-gray-100 text-gray-600'
                            }`}>
                                {user?.plan === 'family' ? 'FAMILLE' : 
                                 user?.plan === 'premium' ? 'PREMIUM' : 'GRATUIT'}
                            </span>
                            <p className="text-xs text-gray-500 mt-2">
                                {user?.plan === 'free' ? 'Limité à 50 produits.' : 
                                 user?.plan === 'family' ? 'Produits illimités & Multi-comptes.' :
                                 'Produits illimités.'}
                            </p>
                        </div>
                        <button 
                            onClick={() => navigate('/abonnements')}
                            className="w-full py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
                        >
                            Gérer l'abonnement
                        </button>
                    </div>

                    {/* Notifications */}
                    <div className="bg-white p-6 rounded-2xl shadow-soft border border-gray-100">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Bell size={20} className="text-gray-400" /> Notifications
                        </h3>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Alertes par email</span>
                            <button 
                                onClick={() => setEmailAlerts(!emailAlerts)}
                                className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${
                                    emailAlerts ? 'bg-mint' : 'bg-gray-200'
                                }`}
                            >
                                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-300 ${
                                    emailAlerts ? 'translate-x-6' : 'translate-x-0'
                                }`} />
                            </button>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                            Recevez un récapitulatif des produits périmés chaque lundi.
                        </p>
                    </div>

                    {errorMsg && (
                        <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm flex items-center gap-2 animate-pulse border border-red-100">
                            <AlertCircle size={16} />
                            {errorMsg}
                        </div>
                    )}

                    {/* Save Button */}
                    <button 
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full py-4 bg-mint hover:bg-teal-400 text-white font-bold rounded-xl shadow-lg shadow-mint/30 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                        {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                        {success ? 'Sauvegardé !' : 'Enregistrer les modifications'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Account;