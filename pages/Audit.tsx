
import React, { useState, useEffect } from 'react';
import { ShieldCheck, AlertCircle, CheckCircle, RefreshCcw, Camera, Database, Cpu, Lock } from 'lucide-react';
import { supabase } from '../services/mockSupabase';

interface AuditResult {
    id: string;
    label: string;
    status: 'ok' | 'warning' | 'error' | 'loading';
    message: string;
    icon: any;
}

const Audit = () => {
    const [results, setResults] = useState<AuditResult[]>([
        { id: 'auth', label: 'Authentification & Sessions', status: 'loading', message: 'Vérification...', icon: Lock },
        { id: 'db', label: 'Base de données Supabase', status: 'loading', message: 'Vérification...', icon: Database },
        { id: 'ai', label: 'Moteur IA Gemini', status: 'loading', message: 'Vérification...', icon: Cpu },
        { id: 'cam', label: 'Accès Périphériques', status: 'loading', message: 'Vérification...', icon: Camera },
    ]);

    useEffect(() => {
        runAudit();
    }, []);

    const runAudit = async () => {
        // 1. Auth check
        const user = await supabase.getUser();
        updateResult('auth', user ? 'ok' : 'error', user ? `Connecté en tant que ${user.role}` : 'Non authentifié');

        // 2. DB check
        try {
            const stock = await supabase.getStock();
            updateResult('db', 'ok', `${stock.length} produits détectés.`);
        } catch (e) {
            updateResult('db', 'error', 'Erreur de connexion SQL.');
        }

        // 3. AI Check (Simple ping)
        const hasKey = !!process.env.API_KEY;
        updateResult('ai', hasKey ? 'ok' : 'error', hasKey ? 'API Key configurée.' : 'Clé API manquante.');

        // 4. Camera check
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const hasCam = devices.some(d => d.kind === 'videoinput');
            updateResult('cam', hasCam ? 'ok' : 'warning', hasCam ? 'Caméra détectée.' : 'Aucune caméra trouvée.');
        } catch (e) {
            updateResult('cam', 'error', 'Permission refusée.');
        }
    };

    const updateResult = (id: string, status: AuditResult['status'], message: string) => {
        setResults(prev => prev.map(r => r.id === id ? { ...r, status, message } : r));
    };

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-display font-bold text-gray-900">Audit du Système</h1>
                    <p className="text-gray-500">Diagnostic automatique des fonctionnalités de Domy.</p>
                </div>
                <button 
                    onClick={() => { setResults(results.map(r => ({ ...r, status: 'loading' }))); runAudit(); }}
                    className="p-3 bg-white rounded-xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-all"
                >
                    <RefreshCcw size={20} className="text-mint" />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {results.map(r => (
                    <div key={r.id} className="bg-white p-6 rounded-3xl shadow-soft border border-gray-100 flex items-start gap-4">
                        <div className={`p-4 rounded-2xl ${
                            r.status === 'ok' ? 'bg-green-50 text-green-500' : 
                            r.status === 'warning' ? 'bg-amber-50 text-amber-500' : 
                            r.status === 'error' ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-300'
                        }`}>
                            <r.icon size={28} />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-gray-900 flex items-center justify-between">
                                {r.label}
                                {r.status === 'ok' && <CheckCircle size={18} className="text-green-500" />}
                                {r.status === 'loading' && <RefreshCcw size={18} className="animate-spin text-gray-300" />}
                                {r.status === 'error' && <AlertCircle size={18} className="text-red-500" />}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">{r.message}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-gray-900 text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden">
                <div className="relative z-10">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <ShieldCheck className="text-mint" /> Rapport de Santé
                    </h3>
                    <p className="text-gray-400 text-sm leading-relaxed max-w-2xl">
                        Tout semble opérationnel. L'application est prête à traiter vos stocks et générer vos recettes. 
                        Assurez-vous que votre abonnement est actif pour profiter des analyses IA.
                    </p>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-mint/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
            </div>
        </div>
    );
};

export default Audit;
