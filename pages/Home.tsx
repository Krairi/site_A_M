
import React, { useEffect, useState } from 'react';
import { ArrowRight, AlertTriangle, Package, ChefHat, Plus, Clock, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/mockSupabase';
import { Product, User } from '../types';
import { useTranslation } from '../context/LanguageContext';

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

const getCategoryIcon = (category: string) => {
    switch (category) {
        case 'Fruits & Légumes': return '🥦';
        case 'Viandes & Poissons': return '🥩';
        case 'Produits Laitiers': return '🥛';
        case 'Épicerie & Conserves': return '🍝';
        case 'Boissons': return '🧃';
        case 'Surgelés': return '❄️';
        case 'Hygiène & Maison': return '🧼';
        default: return '📦';
    }
};

const Home = () => {
  const [stock, setStock] = useState<Product[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [alertCount, setAlertCount] = useState(0);
  const [urgentItems, setUrgentItems] = useState<Product[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [stockData, userData] = await Promise.all([
        supabase.getStock(),
        supabase.getUser()
      ]);
      setStock(stockData);
      setUser(userData);
      
      const now = new Date();
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(now.getDate() + 3);

      const expiringSoon = stockData.filter(p => {
        if (!p.expiryDate) return false;
        const exp = new Date(p.expiryDate);
        return exp <= threeDaysFromNow;
      }).sort((a, b) => new Date(a.expiryDate!).getTime() - new Date(b.expiryDate!).getTime());

      setUrgentItems(expiringSoon.slice(0, 3));
      
      const count = stockData.filter(p => {
        const isLow = p.quantity <= p.minThreshold;
        const isExpiring = p.expiryDate ? new Date(p.expiryDate) <= threeDaysFromNow : false;
        return isLow || isExpiring;
      }).length;

      setAlertCount(count);
      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-white rounded-[2.5rem] p-8 md:p-12 shadow-soft border border-gray-100">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-block px-4 py-1.5 bg-aqua/10 text-aqua rounded-full text-[10px] font-black uppercase tracking-widest mb-6">
            Smart Domestic Living
          </span>
          <h1 className="text-4xl md:text-6xl font-display font-bold text-gray-900 mb-4 leading-tight">
            {t('home.greeting')}, {user?.name || 'admin3'} 👋 <br/>
            <span className="text-gray-400">{t('home.subtitle')}</span>
          </h1>
          <div className="flex gap-4 mt-10">
             <Link to="/tickets" className="px-8 py-4 bg-mint text-white font-bold rounded-2xl shadow-glow hover:bg-teal-400 transition-all transform hover:scale-105 flex items-center gap-2 active:scale-95 text-sm">
               <Plus size={20} /> {t('home.scan_ticket')}
             </Link>
             <Link to="/recettes" className="px-8 py-4 bg-gray-50 text-gray-700 font-bold rounded-2xl hover:bg-gray-100 transition-all flex items-center gap-2 text-sm border border-gray-100">
               <ChefHat size={20} /> {t('home.recipe_idea')}
             </Link>
          </div>
        </div>
        <div className="absolute right-0 top-0 w-1/3 h-full bg-gradient-to-l from-mint/5 to-transparent hidden md:block" />
      </div>

      {/* Urgent Freshness Section (Matched to Screenshot) */}
      <section className="animate-slide-up">
          <div className="flex items-center gap-2 mb-6 px-1">
              <Zap className="text-honey fill-honey" size={20} />
              <h2 className="text-xl font-display font-bold text-gray-800">{t('home.freshness_priority')}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {urgentItems.length > 0 ? urgentItems.map(item => {
                  const diff = Math.ceil((new Date(item.expiryDate!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                  return (
                      <div key={item.id} className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-soft flex items-center justify-between group hover:border-aqua/30 transition-all relative overflow-hidden">
                          <div className="flex items-center gap-5">
                              <div className="w-14 h-14 bg-aqua/5 rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-aqua/10">
                                  {getCategoryIcon(item.category)}
                              </div>
                              <div className="space-y-1">
                                  <p className="font-bold text-gray-900 text-lg leading-tight">{item.name}</p>
                                  <p className={`text-[10px] font-black tracking-widest uppercase ${diff <= 0 ? 'text-red-500' : 'text-honey'}`}>
                                      {diff < 0 ? t('home.expired') : diff === 0 ? t('home.today') : `${t('home.expires_in')} ${diff}${t('home.days_short')}`}
                                  </p>
                              </div>
                          </div>
                          <Link to="/recettes" className="p-3 bg-white border border-gray-100 rounded-xl text-gray-400 group-hover:bg-mint group-hover:text-white group-hover:border-mint transition-all shadow-sm">
                              <ChefHat size={18} />
                          </Link>
                      </div>
                  )
              }) : (
                <div className="col-span-full py-8 text-center bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
                   <p className="text-gray-400 font-medium italic">Tout est frais ! Aucun produit en alerte.</p>
                </div>
              )}
          </div>
      </section>

      {/* Overview Stats */}
      <section>
        <h2 className="text-xl font-display font-bold text-gray-800 mb-6 px-1">{t('home.overview')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            title={t('home.stock_count')}
            value={stock.length} 
            icon={Package} 
            colorClass="bg-aqua text-aqua" 
            link="/stock" 
          />
          <StatCard 
            title={t('home.active_alerts')}
            value={alertCount} 
            icon={AlertTriangle} 
            colorClass="bg-honey text-honey" 
            link="/stock"
            alert={true}
          />
          <StatCard 
            title={t('home.recipes_this_month')}
            value="12" 
            icon={ChefHat} 
            colorClass="bg-mint text-mint" 
            link="/recettes" 
          />
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Watchlist */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center px-1">
             <h2 className="text-xl font-display font-bold text-gray-800">{t('home.to_watch')}</h2>
             <Link to="/stock" className="text-aqua text-sm font-black uppercase tracking-widest hover:underline">{t('home.see_all')}</Link>
          </div>
          <div className="grid grid-cols-1 gap-4">
             {loading ? (
               [1,2,3,4].map(i => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)
             ) : (
               stock.slice(0, 4).map(product => {
                  const isLow = product.quantity <= product.minThreshold;
                  return (
                    <div key={product.id} className="flex items-center justify-between p-5 bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-5">
                            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-2xl border border-gray-100">{getCategoryIcon(product.category)}</div>
                            <div>
                                <p className="font-bold text-gray-900 text-lg">{product.name}</p>
                                <p className="text-xs text-gray-400 font-bold">{product.quantity} {product.unit}</p>
                            </div>
                        </div>
                        {isLow && <span className="text-[10px] font-black uppercase text-red-500 bg-red-50 px-4 py-1.5 rounded-full border border-red-100">Stock Bas</span>}
                    </div>
                  )
               })
             )}
          </div>
        </div>

        {/* Suggestion Panel */}
        <div className="space-y-6">
          <h2 className="text-xl font-display font-bold text-gray-800 px-1">{t('home.suggestion')}</h2>
          <Link to="/recettes">
            <div className="bg-white rounded-[2.5rem] p-3 shadow-soft border border-gray-100 hover:shadow-xl transition-all cursor-pointer group h-full">
                <div className="relative h-60 rounded-[2rem] overflow-hidden mb-6">
                <img 
                    src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80" 
                    alt="Recipe" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-800 shadow-xl flex items-center gap-2">
                    <Clock size={12} className="text-mint" /> 15 MIN
                </div>
                </div>
                <div className="px-4 pb-4">
                <h3 className="font-display font-bold text-gray-900 text-2xl mb-2 group-hover:text-mint transition-colors">Salade Healthy</h3>
                <p className="text-gray-500 text-sm line-clamp-2 leading-relaxed italic">Une recette simple et équilibrée pour sublimer vos restes de légumes frais.</p>
                </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
