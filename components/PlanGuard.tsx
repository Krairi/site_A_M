
import React from 'react';
import { Link } from 'react-router-dom';
import { Lock, Zap, ShieldCheck } from 'lucide-react';
import { User, PlanType } from '../types';

interface PlanGuardProps {
  user: User | null;
  requiredPlan: 'premium' | 'family';
  children: React.ReactNode;
  fallback?: React.ReactNode;
  variant?: 'page' | 'inline' | 'overlay';
}

const PlanGuard: React.FC<PlanGuardProps> = ({ user, requiredPlan, children, fallback, variant = 'page' }) => {
  const hasAccess = () => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (requiredPlan === 'premium') return user.plan === 'premium' || user.plan === 'family';
    if (requiredPlan === 'family') return user.plan === 'family';
    return true;
  };

  if (hasAccess()) return <>{children}</>;

  if (fallback) return <>{fallback}</>;

  if (variant === 'overlay') {
    return (
      <div className="relative group overflow-hidden">
        <div className="filter blur-sm pointer-events-none opacity-40">
          {children}
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-white/20 backdrop-blur-[2px] z-10">
          <div className="p-3 bg-white rounded-2xl shadow-xl border border-gray-100 mb-2">
            <Lock size={20} className="text-gray-400" />
          </div>
          <p className="text-[10px] font-black uppercase text-gray-900 mb-3 tracking-widest">Contenu {requiredPlan}</p>
          <Link to="/abonnements" className="px-4 py-2 bg-mint text-white text-[10px] font-bold rounded-xl shadow-lg hover:scale-105 transition-all">
            Débloquer
          </Link>
        </div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className="p-4 bg-gray-50 border border-dashed border-gray-200 rounded-2xl text-center">
        <div className="flex items-center justify-center gap-2 mb-2 text-gray-400">
           <Lock size={16} />
           <span className="text-xs font-bold uppercase tracking-widest">Réservé {requiredPlan}</span>
        </div>
        <Link to="/abonnements" className="text-[10px] font-black text-mint uppercase hover:underline">Voir les offres</Link>
      </div>
    );
  }

  return (
    <div className="bg-white/50 backdrop-blur-sm border-2 border-dashed border-gray-200 rounded-[2.5rem] p-12 text-center flex flex-col items-center justify-center space-y-6">
      <div className={`p-6 rounded-3xl ${requiredPlan === 'premium' ? 'bg-mint/10 text-mint' : 'bg-honey/10 text-honey'}`}>
        <Lock size={48} />
      </div>
      <div className="max-w-md">
        <h3 className="text-2xl font-display font-bold text-gray-900 mb-2">
            Fonctionnalité {requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1)}
        </h3>
        <p className="text-gray-500 mb-8 leading-relaxed">
            Passez au niveau supérieur pour activer cet outil et automatiser la gestion de votre foyer.
        </p>
        <Link 
            to="/abonnements" 
            className={`px-8 py-4 rounded-2xl font-bold text-white shadow-xl transition-all hover:scale-105 flex items-center gap-2 ${
                requiredPlan === 'premium' ? 'bg-mint shadow-mint/30' : 'bg-gray-900 shadow-gray-200'
            }`}
        >
            {requiredPlan === 'premium' ? <Zap size={20} /> : <ShieldCheck size={20} />}
            Passer au niveau supérieur
        </Link>
      </div>
    </div>
  );
};

export default PlanGuard;
