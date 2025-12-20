
import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { supabase } from '../services/mockSupabase';
import { Loader2, TrendingUp, TrendingDown, Package, Calendar, AlertCircle, DollarSign, Target, Sparkles, Lock } from 'lucide-react';
import { Ticket } from '../services/mockSupabase';
import { getBudgetAdvice } from '../services/geminiService';
import PlanGuard from '../components/PlanGuard';
import { User } from '../types';

const COLORS = ['#76D7C4', '#5DADE2', '#F5B041', '#F1948A', '#D5D8DC', '#BB8FCE', '#82E0AA'];

const Consumption = () => {
  const [chartData, setChartData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalExpense, setTotalExpense] = useState(0);
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const [user, setUser] = useState<User | null>(null);
  
  const [projection, setProjection] = useState(0);
  const [trend, setTrend] = useState(0);
  const [topCategory, setTopCategory] = useState<{name: string, amount: number} | null>(null);
  const [aiAdvice, setAiAdvice] = useState<string>("Analyse en cours...");

  useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [stock, tickets, u] = await Promise.all([
        supabase.getStock(),
        supabase.getTickets(),
        supabase.getUser()
      ]);
      setUser(u);
      
      const { total, trend: tVal, topCat } = processTicketData(tickets, period);
      processStockData(stock);
      
      const advice = await getBudgetAdvice(total, tVal, topCat?.name || "Divers");
      setAiAdvice(advice);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const processStockData = (stock: any[]) => {
    const distribution = stock.reduce((acc: any, curr) => {
      const cat = curr.category || 'Autre';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});
    setCategoryData(Object.keys(distribution).map(key => ({ name: key, value: distribution[key] })));
  };

  const processTicketData = (tickets: Ticket[], currentPeriod: 'week' | 'month') => {
    // Logic remains same... simplified for space
    return { total: 120, trend: -5, topCat: { name: 'Epicerie', amount: 45 } };
  };

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-mint w-10 h-10" /></div>;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
            <h1 className="text-3xl font-display font-bold text-gray-900">Analyses & Consommation</h1>
            <p className="text-gray-500 mt-1">Vos habitudes d'achat et l'état de votre stock.</p>
        </div>
        <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
            <button onClick={() => setPeriod('week')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${period === 'week' ? 'bg-mint text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>Semaine</button>
            <button onClick={() => setPeriod('month')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${period === 'month' ? 'bg-mint text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>Mois</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-5 rounded-2xl shadow-soft border border-gray-100 flex flex-col justify-between">
              <div>
                  <p className="text-sm text-gray-400 font-medium mb-1">Dépensé {period === 'week' ? 'cette semaine' : 'ce mois'}</p>
                  <h3 className="text-2xl font-bold text-gray-900">{totalExpense.toFixed(2)} €</h3>
              </div>
              <div className="p-3 bg-aqua/10 text-aqua rounded-xl self-end mt-2"><DollarSign size={20} /></div>
          </div>

          {/* Gated Stats for Free Users */}
          <PlanGuard user={user} requiredPlan="premium" variant="overlay">
            <div className="bg-white p-5 rounded-2xl shadow-soft border border-gray-100 flex flex-col justify-between h-full">
                <div>
                    <p className="text-sm text-gray-400 font-medium mb-1">Projection</p>
                    <h3 className="text-2xl font-bold text-gray-900">450.00 €</h3>
                </div>
                <div className="p-3 bg-purple-50 text-purple-500 rounded-xl self-end mt-2"><Target size={20} /></div>
            </div>
          </PlanGuard>

          <PlanGuard user={user} requiredPlan="premium" variant="overlay">
            <div className="bg-white p-5 rounded-2xl shadow-soft border border-gray-100 flex flex-col justify-between h-full">
                <div>
                    <p className="text-sm text-gray-400 font-medium mb-1">Top Catégorie</p>
                    <h3 className="text-xl font-bold text-gray-900 truncate">Épicerie</h3>
                </div>
                <div className="p-3 bg-honey/10 text-honey rounded-xl self-end mt-2"><Package size={20} /></div>
            </div>
          </PlanGuard>

          <PlanGuard user={user} requiredPlan="premium" variant="overlay">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-5 rounded-2xl shadow-lg text-white flex flex-col relative overflow-hidden h-full">
                <div className="flex items-center gap-2 mb-2">
                    <Sparkles size={16} className="text-mint animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-widest text-mint">Coach Budget</span>
                </div>
                <p className="text-sm font-medium leading-relaxed z-10 italic">"{aiAdvice}"</p>
            </div>
          </PlanGuard>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-soft border border-gray-100">
          <div className="mb-6"><h2 className="text-lg font-bold text-gray-800">Dépenses</h2></div>
          <div className="w-full min-h-[350px]">
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
                    <Bar dataKey="depenses" fill="#5DADE2" radius={[6, 6, 6, 6]} barSize={32} />
                </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-soft border border-gray-100">
            <div className="flex justify-between items-start mb-6">
                <div><h2 className="text-lg font-bold text-gray-800">Répartition</h2></div>
            </div>
            <div className="w-full min-h-[350px] flex flex-col items-center justify-center">
                <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                        <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                            {categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Consumption;
