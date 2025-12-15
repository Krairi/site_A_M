import React, { useEffect, useState } from 'react';
import { ArrowRight, AlertTriangle, Package, ChefHat, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/mockSupabase';
import { Product, User } from '../types';

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

const ProductRow = ({ product }: { product: Product }) => {
  const isLowStock = product.quantity <= product.minThreshold;
  const isExpiring = product.expiryDate ? new Date(product.expiryDate) <= new Date(new Date().setDate(new Date().getDate() + 3)) : false;

  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-xl">
          {product.category === 'Frais' ? '🥛' : product.category === 'Légumes' ? '🥦' : '📦'}
        </div>
        <div>
          <p className="font-semibold text-gray-800">{product.name}</p>
          <div className="flex gap-2 text-xs text-gray-500">
             <span>{product.quantity} {product.unit}</span>
             <span>•</span>
             <span>{product.category}</span>
          </div>
        </div>
      </div>
      <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
        isLowStock || isExpiring ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
      }`}>
        {isExpiring ? (
            <>
             <AlertTriangle size={12} /> Expire bientôt
            </>
        ) : isLowStock ? (
            <>
             <Package size={12} /> Stock bas
            </>
        ) : 'OK'}
      </div>
    </div>
  );
};

const Home = () => {
  const [stock, setStock] = useState<Product[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const [stockData, userData] = await Promise.all([
        supabase.getStock(),
        supabase.getUser()
      ]);
      setStock(stockData);
      setUser(userData);
      
      // Calcul des alertes (Stock faible OU Peremption dans les 3 jours)
      const now = new Date();
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(now.getDate() + 3);

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

  // Trier le stock pour afficher les alertes en premier dans la liste "À surveiller"
  const watchlist = [...stock].sort((a, b) => {
      const scoreA = (a.quantity <= a.minThreshold ? 2 : 0) + (a.expiryDate && new Date(a.expiryDate) <= new Date() ? 3 : 0);
      const scoreB = (b.quantity <= b.minThreshold ? 2 : 0) + (b.expiryDate && new Date(b.expiryDate) <= new Date() ? 3 : 0);
      return scoreB - scoreA;
  }).slice(0, 4);

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-white rounded-3xl p-8 shadow-soft border border-gray-100">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-block px-3 py-1 bg-aqua/10 text-aqua rounded-full text-xs font-semibold mb-4">
            Smart Domestic Living
          </span>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-gray-900 mb-4 leading-tight">
            Bonjour, {user?.name || 'admin'} 👋 <br/>
            <span className="text-gray-400">Votre foyer est à jour.</span>
          </h1>
          <div className="flex gap-4 mt-8">
             <Link to="/tickets" className="px-6 py-3 bg-mint text-white font-medium rounded-xl shadow-glow hover:bg-teal-400 transition-all transform hover:scale-105 flex items-center gap-2 active:scale-95">
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
          <StatCard 
            title="Produits en stock" 
            value={stock.length} 
            icon={Package} 
            colorClass="bg-aqua text-aqua" 
            link="/stock" 
          />
          <StatCard 
            title="Alertes actives" 
            value={alertCount} 
            icon={AlertTriangle} 
            colorClass="bg-honey text-honey" 
            link="/stock"
            alert={true}
          />
          <StatCard 
            title="Recettes ce mois" 
            value="12" 
            icon={ChefHat} 
            colorClass="bg-mint text-mint" 
            link="/recettes" 
          />
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
               watchlist.length > 0 ? (
                 watchlist.map(product => (
                   <ProductRow key={product.id} product={product} />
                 ))
               ) : (
                 <div className="p-8 text-center bg-white rounded-xl border border-dashed border-gray-200 text-gray-400 text-sm">
                    Tout est sous contrôle. Aucun produit à surveiller.
                 </div>
               )
             )}
          </div>
        </div>

        {/* Suggestion Panel */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-800 px-1">Suggestion du soir</h2>
          <Link to="/recettes">
            <div className="bg-white rounded-2xl p-2 shadow-soft border border-gray-100 hover:shadow-lg transition-all cursor-pointer group h-full">
                <div className="relative h-48 rounded-xl overflow-hidden mb-4">
                <img 
                    src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80" 
                    alt="Recipe" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                />
                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-md px-2 py-1 rounded-lg text-xs font-bold text-gray-800 shadow-sm flex items-center gap-1">
                    <ChefHat size={12} /> 15 min
                </div>
                </div>
                <div className="px-2 pb-2">
                <h3 className="font-bold text-gray-900 text-lg mb-1 group-hover:text-mint transition-colors">Salade Healthy</h3>
                <p className="text-gray-500 text-sm line-clamp-2">Une recette simple pour utiliser vos restes de légumes frais.</p>
                </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;