import React, { useEffect, useState } from 'react';
import { ArrowRight, AlertTriangle, Package, ChefHat, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/mockSupabase';
import { Product, Alert, Recipe, User } from '../types';
import { MOCK_ALERTS } from '../constants';

const StatCard = ({ title, value, icon: Icon, colorClass, link }: any) => (
  <Link to={link} className="block group">
    <div className="bg-white p-6 rounded-2xl shadow-soft border border-transparent hover:border-gray-200 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${colorClass} bg-opacity-10`}>
          <Icon className={`w-6 h-6 ${colorClass.replace('bg-', 'text-')}`} />
        </div>
        <div className="bg-gray-100 p-1.5 rounded-full group-hover:bg-gray-200 transition-colors">
          <ArrowRight size={14} className="text-gray-500" />
        </div>
      </div>
      <h3 className="text-gray-500 text-sm font-medium mb-1">{title}</h3>
      <p className="text-3xl font-display font-bold text-gray-900">{value}</p>
    </div>
  </Link>
);

const AlertCard = ({ alert }: { alert: Alert }) => (
  <div className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:bg-orange-50/30 transition-colors">
    <div className="w-2 h-2 rounded-full bg-honey flex-shrink-0" />
    <div className="flex-1">
      <p className="text-gray-800 font-medium text-sm">{alert.message}</p>
      <p className="text-gray-400 text-xs mt-0.5">Il y a 2h</p>
    </div>
    <span className="px-2 py-1 bg-orange-100 text-orange-600 text-xs font-semibold rounded-md">Urgent</span>
  </div>
);

const ProductRow = ({ product }: { product: Product }) => (
  <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100">
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-xl">
        {product.category === 'Frais' ? '🥛' : product.category === 'Légumes' ? '🥦' : '📦'}
      </div>
      <div>
        <p className="font-semibold text-gray-800">{product.name}</p>
        <p className="text-xs text-gray-500">{product.quantity} {product.unit} • {product.category}</p>
      </div>
    </div>
    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
      product.quantity <= product.minThreshold ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
    }`}>
      {product.quantity <= product.minThreshold ? 'Faible' : 'OK'}
    </div>
  </div>
);

const Home = () => {
  const [stock, setStock] = useState<Product[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [stockData, userData] = await Promise.all([
        supabase.getStock(),
        supabase.getUser()
      ]);
      setStock(stockData);
      setUser(userData);
      setLoading(false);
    };
    fetchData();
  }, []);

  const lowStockCount = stock.filter(p => p.quantity <= p.minThreshold).length;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-white rounded-3xl p-8 shadow-soft border border-gray-100">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-block px-3 py-1 bg-aqua/10 text-aqua rounded-full text-xs font-semibold mb-4">
            Smart Domestic Living
          </span>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-gray-900 mb-4 leading-tight">
            Bonjour, {user?.name || 'Invité'} 👋 <br/>
            <span className="text-gray-400">Votre foyer est à jour.</span>
          </h1>
          <div className="flex gap-4 mt-8">
             <Link to="/tickets" className="px-6 py-3 bg-mint text-white font-medium rounded-xl shadow-glow hover:bg-teal-400 transition-all transform hover:scale-105 flex items-center gap-2">
               <Plus size={18} /> Scanner un ticket
             </Link>
             <Link to="/recettes" className="px-6 py-3 bg-gray-50 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition-all flex items-center gap-2">
               <ChefHat size={18} /> Idée recette
             </Link>
          </div>
        </div>
        <div className="absolute right-0 top-0 w-1/3 h-full bg-gradient-to-l from-mint/10 to-transparent hidden md:block" />
      </div>

      {/* Overview Stats */}
      <section>
        <h2 className="text-lg font-bold text-gray-800 mb-4 px-1">Vue d'ensemble</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Produits en stock" value={stock.length} icon={Package} colorClass="bg-aqua text-aqua" link="/stock" />
          <StatCard title="Alertes actives" value={MOCK_ALERTS.length + lowStockCount} icon={AlertTriangle} colorClass="bg-honey text-honey" link="/stock" />
          <StatCard title="Recettes ce mois" value="12" icon={ChefHat} colorClass="bg-mint text-mint" link="/recettes" />
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Watchlist */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center px-1">
             <h2 className="text-lg font-bold text-gray-800">À surveiller</h2>
             <Link to="/stock" className="text-aqua text-sm font-medium hover:underline">Voir tout</Link>
          </div>
          <div className="space-y-3">
             {loading ? (
               [1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)
             ) : (
               stock.slice(0, 4).map(product => (
                 <ProductRow key={product.id} product={product} />
               ))
             )}
          </div>
        </div>

        {/* Suggestion Card */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-800 px-1">Suggestion du soir</h2>
          <div className="bg-white rounded-2xl p-2 shadow-soft border border-gray-100 hover:shadow-lg transition-all cursor-pointer group">
            <div className="relative h-40 rounded-xl overflow-hidden mb-4">
              <img 
                src="https://picsum.photos/400/300?random=10" 
                alt="Recipe" 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
              />
              <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-md px-2 py-1 rounded-lg text-xs font-bold text-gray-800 shadow-sm">
                15 min
              </div>
            </div>
            <div className="px-2 pb-2">
              <h3 className="font-bold text-gray-900 text-lg mb-1 group-hover:text-mint transition-colors">Avocado Toast Royal</h3>
              <p className="text-gray-500 text-sm line-clamp-2">Utilisez vos avocats et vos œufs avant qu'ils ne périment. Une recette saine et rapide.</p>
              <div className="mt-4 flex items-center text-xs font-medium text-aqua">
                <ChefHat size={14} className="mr-1" />
                Généré par IA
              </div>
            </div>
          </div>
          
          <div className="bg-orange-50 rounded-2xl p-5 border border-orange-100">
             <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
               <AlertTriangle size={18} className="text-honey" /> Alertes Récentes
             </h3>
             <div className="space-y-3">
               {MOCK_ALERTS.map(alert => (
                 <div key={alert.id} className="text-sm text-gray-600 border-l-2 border-honey pl-3 py-1">
                   {alert.message}
                 </div>
               ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;