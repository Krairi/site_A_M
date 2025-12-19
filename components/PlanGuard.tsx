
import React from 'react';
import { Link } from 'react-router-dom';
import { Lock, Zap, ShieldCheck } from 'lucide-react';
import { User } from '../types';

interface PlanGuardProps {
  user: User | null;
  requiredPlan: 'premium' | 'family';
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const PlanGuard: React.FC<PlanGuardProps> = ({ user, requiredPlan, children, fallback }) => {
  const hasAccess = () => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (requiredPlan === 'premium') return user.plan === 'premium' || user.plan === 'family';
    if (requiredPlan === 'family') return user.plan === 'family';
    return true;
  };

  if (hasAccess()) return <>{children}</>;

  if (fallback) return <>{fallback}</>;

  return (
    <div className="bg-white/50 backdrop-blur-sm border-2 border-dashed border-gray-200 rounded-[2.5rem] p-12 text-center flex flex-col items-center justify-center space-y-6">
      <div className={`p-6 rounded-3xl ${requiredPlan === 'premium' ? 'bg-mint/10 text-mint' : 'bg-honey/10 text-honey'}`}>
        <Lock size={48} />
      </div>
      <div className="max-w-md">
        <h3 className="text-2xl font-display font-bold text-gray-900 mb-2">
            Fonctionnalité {requiredPlan === 'premium' ? 'Premium' : 'Famille'}
        </h3>
        <p className="text-gray-500 mb-8">
            Cette option nécessite un abonnement **{requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1)}** pour être activée.
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
