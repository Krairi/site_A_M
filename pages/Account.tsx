
import React, { useState, useEffect } from 'react';
import { User, Mail, Save, CreditCard, Shield, Bell, Loader2, AlertCircle, Check, X, Plus, Utensils, Sparkles, ArrowRight, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/mockSupabase';
import { User as UserType } from '../types';

const COMMON_ALLERGENS = [
    'Gluten', 'Lactose', 'Arachides', 'Fruits à coque', 'Oeufs', 'Soja', 'Crustacés', 'Poisson', 'Céleri', 'Moutarde'
];

const DIET_OPTIONS = [
    { id: 'Standard', label: 'Omnivore' },
    { id: 'Végétarien', label: 'Végétarien' },
    { id: 'Vegan', label: 'Vegan' },
    { id: 'Pesco-végétarien', label: 'Pesco' },
    { id: 'Keto', label: 'Keto' },
    { id: 'Sans Gluten', label: 'Sans Gluten (Régime)' }
];

const Account = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<UserType | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    
    // Form states
    const [name, setName] = useState('');
    const [emailAlerts, setEmailAlerts] = useState(true);
    const [householdSize, setHouseholdSize] = useState(2);
    
    // Detailed Preferences
    const [diet, setDiet] = useState('Standard');
    const [allergens, setAllergens] = useState<string[]>([]);
    const [dislikes, setDislikes] = useState<string[]>([]);
    const [dislikeInput, setDislikeInput] = useState('');

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            const u = await supabase.getUser();
            if (u) {
                setUser(u);
                setName(u.name || '');
                setDiet(u.diet || 'Standard');
                setAllergens(u.allergens || []);
                setDislikes(u.dislikes || []);
                setEmailAlerts(u.emailAlerts !== false);
                setHouseholdSize(u.householdSize || 2);
            }
        } catch (err) {
            console.error("Error loading profile", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        setSuccess(false);
        setErrorMsg(null);
        
        try {
            const ok = await supabase.updateUser({ 
                name: name.trim(), 
                diet, 
                allergens, 
                dislikes,
                emailAlerts,
                householdSize
            });
            
            if (ok) {
                setUser(prev => prev ? { ...prev, name: name.trim(), diet, allergens, dislikes, emailAlerts, householdSize } : null);
                setSuccess(true);
                window.dispatchEvent(new Event('givd-update'));
                setTimeout(() => setSuccess(false), 3000);
            } else {
                setErrorMsg("Erreur lors de la communication avec le serveur.");
            }
        } catch (err) {
            console.error("HandleSave error:", err);
            setErrorMsg("Une erreur inattendue est survenue.");
        } finally {
            setSaving(false);
        }
    };

    const toggleAllergen = (allergen: string) => {
        setAllergens(prev => prev.includes(allergen) ? prev.filter(a => a !== allergen) : [...prev, allergen]);
    };

    const addDislike = (e?: React.FormEvent) => {
        e?.preventDefault();
        const val = dislikeInput.trim();
        if (val && !dislikes.includes(val)) {
            setDislikes([...dislikes, val]);
            setDislikeInput('');
        }
    };

    const removeDislike = (item: string) => {
        setDislikes(prev => prev.filter(i => i !== item));
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="animate-spin text-mint w-10 h-10" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in max-w-4xl mx-auto pb-32 lg:pb-10">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-display font-bold text-gray-900">Mon Compte</h1>
                {success && (
                    <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100 text-sm font-bold animate-bounce">
                        <Check size={16} /> Profil mis à jour
                    </div>
                )}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Household & Basic Info */}
                    <div className="bg-white p-6 rounded-2xl shadow-soft border border-gray-100 space-y-6">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="w-16 h-16 bg-gradient-to-br from-mint to-aqua rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-mint/30 relative">
                                {name ? name.charAt(0).toUpperCase() : (user?.email?.charAt(0).toUpperCase() || 'U')}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">{user?.email}</h2>
                                <p className="text-gray-500 text-sm">Paramètres personnalisés</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nom d'affichage</label>
                                <div className="relative group">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-mint transition-colors" size={18} />
                                    <input 
                                        type="text" 
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-mint/50 focus:border-mint transition-all"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de personnes</label>
                                <div className="flex items-center gap-4">
                                    <button 
                                        onClick={() => setHouseholdSize(Math.max(1, householdSize - 1))}
                                        className="w-10 h-10 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors"
                                    >
                                        -
                                    </button>
                                    <div className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-mint/5 border border-mint/20 rounded-xl">
                                        <Users size={18} className="text-mint" />
                                        <span className="text-xl font-bold text-gray-800">{householdSize}</span>
                                    </div>
                                    <button 
                                        onClick={() => setHouseholdSize(Math.min(10, householdSize + 1))}
                                        className="w-10 h-10 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Advanced Preferences Card */}
                    <div className="bg-white p-6 rounded-2xl shadow-soft border border-gray-100 space-y-8">
                        <div>
                            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <Utensils size={20} className="text-aqua" /> Régime Alimentaire
                            </h3>
                            <div className="flex flex-wrap gap-3">
                                {DIET_OPTIONS.map((opt) => (
                                    <button
                                        key={opt.id}
                                        onClick={() => setDiet(opt.id)}
                                        className={`py-2.5 px-5 rounded-xl text-sm font-bold transition-all border ${
                                            diet === opt.id 
                                            ? 'bg-mint text-white border-mint shadow-md shadow-mint/20' 
                                            : 'bg-white text-gray-600 border-gray-200 hover:border-mint/50 hover:bg-gray-50'
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                                <Shield size={20} className="text-red-500" /> Allergies & Intolérances
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {COMMON_ALLERGENS.map((allergen) => (
                                    <button
                                        key={allergen}
                                        onClick={() => toggleAllergen(allergen)}
                                        className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all border ${
                                            allergens.includes(allergen)
                                            ? 'bg-red-50 text-red-600 border-red-200' 
                                            : 'bg-white text-gray-500 border-gray-100'
                                        }`}
                                    >
                                        {allergen}
                                        {allergens.includes(allergen) && <Check size={14} />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="pt-4">
                            <button 
                                onClick={handleSave}
                                disabled={saving}
                                className={`w-full py-5 rounded-2xl font-bold text-white shadow-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                                    success ? 'bg-green-500 shadow-green-200' : 'bg-mint shadow-mint/30 hover:bg-teal-400'
                                }`}
                            >
                                {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                                <span className="text-lg">Sauvegarder mon profil</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-soft border border-gray-100">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <CreditCard size={20} className="text-gray-400" /> Mon Offre
                        </h3>
                        <div className="p-5 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100 mb-4 shadow-inner">
                            <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Plan Actuel</p>
                            <p className="text-2xl font-display font-bold text-gray-900 capitalize">{user?.plan}</p>
                        </div>
                        <button 
                            onClick={() => navigate('/abonnements')}
                            className="w-full py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-200 transition-all text-sm"
                        >
                            Gérer l'abonnement
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Account;
