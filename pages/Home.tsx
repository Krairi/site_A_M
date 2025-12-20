
import React, { useEffect, useState } from 'react';
import { ArrowRight, AlertTriangle, Package, ChefHat, Plus, Clock, Zap, Target, Sparkles, Star, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/mockSupabase';
import { getAiCoachData } from '../services/geminiService';
import { Product, User } from '../types';
import { useTranslation } from '../context/LanguageContext';

const Home = () => {
  const [stock, setStock] = useState<Product[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [coachData, setCoachData] = useState<any>(null);
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [stockData, userData] = await Promise.all([
        supabase.getStock(),
        supabase.getUser()
      ]);
      setStock(stockData);
      setUser(userData);
      
      const coach = await getAiCoachData(stockData, userData || {});
      setCoachData(coach);
      setLoading(false);
    };
    fetchData();
  }, []);

  const isPremium = user?.plan === 'premium' || user?.plan === 'family';

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-white rounded-[2.5rem] p-8 md:p-12 shadow-soft border border-gray-100">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-block px-4 py-1.5 bg-aqua/10 text-aqua rounded-full text-[10px] font-black uppercase tracking-widest mb-6">
            Tableau de Bord Intelligent
          </span>
          <h1 className="text-4xl md:text-6xl font-display font-bold text-gray-900 mb-4 leading-tight">
            {t('home.greeting')}, {user?.name || 'Ami'} 👋 <br/>
            <span className="text-gray-400">Prêt à optimiser votre foyer ?</span>
          </h1>
          <div className="flex gap-4 mt-10">
             <Link to="/tickets" className="px-8 py-4 bg-mint text-white font-bold rounded-2xl shadow-glow hover:bg-teal-400 transition-all flex items-center gap-2 text-sm">
               <Plus size={20} /> {t('home.scan_ticket')}
             </Link>
             <Link to="/recettes" className="px-8 py-4 bg-gray-50 text-gray-700 font-bold rounded-2xl hover:bg-gray-100 transition-all flex items-center gap-2 text-sm border border-gray-100">
               <ChefHat size={20} /> {t('home.recipe_idea')}
             </Link>
          </div>
        </div>
        <div className="absolute right-0 top-0 w-1/3 h-full bg-gradient-to-l from-mint/5 to-transparent hidden md:block" />
      </div>

      {/* NEW SECTION: DOMY COACH */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gradient-to-br from-gray-900 to-slate-800 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                <Target size={120} />
            </div>
            
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-mint/20 rounded-2xl text-mint">
                        <Sparkles size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-display font-bold">Domy Coach <span className="text-mint">IA</span></h2>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Analyse de performance du foyer</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="flex flex-col items-center justify-center p-6 bg-white/5 rounded-[2rem] border border-white/10">
                        <div className="relative w-32 h-32 flex items-center justify-center mb-4">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/10" />
                                <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={364} strokeDashoffset={364 - (364 * (coachData?.score || 0) / 100)} className="text-mint transition-all duration-1000 ease-out" />
                            </svg>
                            <span className="absolute text-3xl font-display font-bold">{coachData?.score || '--'}</span>
                        </div>
                        <p className="text-sm font-bold text-gray-300 uppercase tracking-widest">Score Domyli</p>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-sm font-black uppercase text-mint tracking-widest">Missions du jour</h3>
                        <div className="space-y-3">
                            {coachData?.missions?.slice(0, isPremium ? 3 : 1).map((m: any, i: number) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors cursor-pointer group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-mint/20 text-mint flex items-center justify-center text-xs font-bold">+{m.reward}</div>
                                        <span className="text-sm font-medium">{m.title}</span>
                                    </div>
                                    <ArrowRight size={16} className="text-gray-500 group-hover:translate-x-1 transition-transform" />
                                </div>
                            ))}
                            {!isPremium && (
                                <Link to="/abonnements" className="flex items-center justify-center gap-2 p-4 bg-honey/10 border border-honey/20 rounded-2xl text-honey text-xs font-bold uppercase tracking-widest hover:bg-honey/20 transition-all">
                                    <Lock size={14} /> Débloquer 2 missions de plus
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div className="bg-white rounded-[2.5rem] p-8 shadow-soft border border-gray-100 flex flex-col">
            <div className="flex items-center gap-2 mb-6">
                <Star className="text-honey fill-honey" size={20} />
                <h3 className="font-display font-bold text-gray-900">Potentiel Premium</h3>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed mb-6 italic">
                "{coachData?.summary || "Analysez votre stock pour recevoir vos conseils personnalisés."}"
            </p>
            <div className="mt-auto p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Économie Estimée</p>
                <p className="text-2xl font-display font-bold text-gray-900">{isPremium ? "42.50 € / mois" : "??. ?? €"}</p>
                {!isPremium && (
                    <Link to="/abonnements" className="mt-4 w-full py-3 bg-gray-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors">
                        Voir mon analyse <ArrowRight size={14} />
                    </Link>
                )}
            </div>
        </div>
      </section>

      {/* Overview Stats (Rest of existing UI) */}
      <section>
        <h2 className="text-xl font-display font-bold text-gray-800 mb-6 px-1">En un coup d'œil</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Produits" value={stock.length} icon={Package} colorClass="bg-aqua text-aqua" link="/stock" />
          <StatCard title="Alertes" value={stock.filter(p => p.quantity <= p.minThreshold).length} icon={AlertTriangle} colorClass="bg-honey text-honey" link="/stock" alert={true} />
          <StatCard title="Recettes" value="12" icon={ChefHat} colorClass="bg-mint text-mint" link="/recettes" />
        </div>
      </section>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, colorClass, link, alert = false }: any) => (
  <Link to={link} className="block group">
    <div className={`bg-white p-6 rounded-2xl shadow-soft border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${alert && value > 0 ? 'border-honey/50 bg-orange-50/30' : 'border-transparent hover:border-gray-200'}`}>
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${colorClass} bg-opacity-10`}>
          <Icon className={`w-6 h-6 ${colorClass.replace('bg-', 'text-')}`} />
        </div>
        <div className="bg-gray-100 p-1.5 rounded-full group-hover:bg-gray-200 transition-colors">
          <ArrowRight size={14} className="text-gray-500" />
        </div>
      </div>
      <h3 className="text-gray-500 text-sm font-medium mb-1">{title}</h3>
      <p className={`text-3xl font-display font-bold ${alert && value > 0 ? 'text-honey' : 'text-gray-900'}`}>{value}</p>
    </div>
  </Link>
);

export default Home;
