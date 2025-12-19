
import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { supabase } from '../services/mockSupabase';
import { Loader2, TrendingUp, TrendingDown, Package, Calendar, AlertCircle, DollarSign, Target, Sparkles } from 'lucide-react';
import { Ticket } from '../services/mockSupabase';
import { getBudgetAdvice } from '../services/geminiService';

const COLORS = ['#76D7C4', '#5DADE2', '#F5B041', '#F1948A', '#D5D8DC', '#BB8FCE', '#82E0AA'];

const Consumption = () => {
  const [chartData, setChartData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalExpense, setTotalExpense] = useState(0);
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  
  // Intelligent Insights State
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
      const [stock, tickets] = await Promise.all([
        supabase.getStock(),
        supabase.getTickets()
      ]);

      const { total, trend, topCat } = processTicketData(tickets, period);
      processStockData(stock);
      
      // Get AI Advice
      const advice = await getBudgetAdvice(total, trend, topCat?.name || "Divers");
      setAiAdvice(advice);

    } catch (error) {
      console.error("Error fetching consumption data:", error);
    } finally {
      setLoading(false);
    }
  };

  const processStockData = (stock: any[]) => {
    const distribution = stock.reduce((acc: any, curr) => {
      const cat = curr.category || 'Autre';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});

    const processed = Object.keys(distribution).map(key => ({
      name: key,
      value: distribution[key]
    })).sort((a, b) => b.value - a.value);

    setCategoryData(processed);
  };

  const processTicketData = (tickets: Ticket[], currentPeriod: 'week' | 'month') => {
    const today = new Date();
    let stats: any[] = [];
    let total = 0;
    let previousTotal = 0;
    let categoryExpenses: {[key: string]: number} = {};

    if (currentPeriod === 'week') {
      const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
      const currentDay = today.getDay(); // 0 = Sunday
      
      const diffToMonday = today.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
      const monday = new Date(today);
      monday.setDate(diffToMonday);
      monday.setHours(0, 0, 0, 0);

      const nextMonday = new Date(monday);
      nextMonday.setDate(monday.getDate() + 7);

      const prevMonday = new Date(monday);
      prevMonday.setDate(prevMonday.getDate() - 7);

      stats = days.map(d => ({ name: d, depenses: 0 }));

      tickets.forEach(ticket => {
        if (!ticket.date) return;
        const parts = ticket.date.split('-').map(Number);
        if (parts.length !== 3) return;
        const tDate = new Date(parts[0], parts[1] - 1, parts[2]);

        if (tDate >= monday && tDate < nextMonday) {
          let dayIndex = tDate.getDay() - 1;
          if (dayIndex === -1) dayIndex = 6;
          
          const amount = Number(ticket.total) || 0;
          if (stats[dayIndex]) {
            stats[dayIndex].depenses += amount;
            total += amount;
          }

          if (ticket.items) {
             ticket.items.forEach(item => {
                 const cat = item.category || 'Autre';
                 const itemPrice = item.price || 0;
                 categoryExpenses[cat] = (categoryExpenses[cat] || 0) + itemPrice;
             });
          }
        } else if (tDate >= prevMonday && tDate < monday) {
            previousTotal += Number(ticket.total) || 0;
        }
      });

      const daysPassed = currentDay === 0 ? 7 : currentDay;
      setProjection(total > 0 ? (total / daysPassed) * 7 : 0);

    } else {
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      
      const lastMonthDate = new Date(today);
      lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
      const lastMonth = lastMonthDate.getMonth();
      const lastMonthYear = lastMonthDate.getFullYear();

      stats = Array.from({ length: 5 }, (_, i) => ({ name: `Sem ${i + 1}`, depenses: 0 }));

      tickets.forEach(ticket => {
        if (!ticket.date) return;
        const parts = ticket.date.split('-').map(Number);
        if (parts.length !== 3) return;
        const tDate = new Date(parts[0], parts[1] - 1, parts[2]);

        if (tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear) {
           const date = tDate.getDate();
           const weekIndex = Math.min(Math.floor((date - 1) / 7), 4);
           const amount = Number(ticket.total) || 0;
           stats[weekIndex].depenses += amount;
           total += amount;

           if (ticket.items) {
             ticket.items.forEach(item => {
                 const cat = item.category || 'Autre';
                 const itemPrice = item.price || 0;
                 categoryExpenses[cat] = (categoryExpenses[cat] || 0) + itemPrice;
             });
          }
        } else if (tDate.getMonth() === lastMonth && tDate.getFullYear() === lastMonthYear) {
            previousTotal += Number(ticket.total) || 0;
        }
      });

      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const currentDayOfMonth = today.getDate();
      setProjection(total > 0 ? (total / currentDayOfMonth) * daysInMonth : 0);
    }

    setChartData(stats);
    setTotalExpense(total);

    let currentTrend = 0;
    if (previousTotal === 0) {
        currentTrend = total > 0 ? 100 : 0;
    } else {
        currentTrend = ((total - previousTotal) / previousTotal) * 100;
    }
    setTrend(currentTrend);

    let maxCat = null;
    let maxVal = 0;
    for (const [cat, val] of Object.entries(categoryExpenses)) {
        if (val > maxVal) {
            maxVal = val;
            maxCat = cat;
        }
    }
    const topCatObj = maxCat ? { name: maxCat, amount: maxVal } : null;
    setTopCategory(topCatObj);

    return { total, trend: currentTrend, topCat: topCatObj };
  };

  if (loading && chartData.length === 0) {
     return (
        <div className="flex h-96 items-center justify-center">
            <Loader2 className="animate-spin text-mint w-10 h-10" />
        </div>
     );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
            <h1 className="text-3xl font-display font-bold text-gray-900">Analyses & Consommation</h1>
            <p className="text-gray-500 mt-1">Vos habitudes d'achat et l'état de votre stock en temps réel.</p>
        </div>
        <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
            <button 
                onClick={() => setPeriod('week')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${period === 'week' ? 'bg-mint text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
            >
                Semaine
            </button>
            <button 
                onClick={() => setPeriod('month')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${period === 'month' ? 'bg-mint text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
            >
                Mois
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-5 rounded-2xl shadow-soft border border-gray-100 flex flex-col justify-between">
              <div>
                  <p className="text-sm text-gray-400 font-medium mb-1">Dépensé {period === 'week' ? 'cette semaine' : 'ce mois'}</p>
                  <h3 className="text-2xl font-bold text-gray-900">{totalExpense.toFixed(2)} €</h3>
                  <div className={`flex items-center gap-1 text-xs font-bold mt-2 ${trend > 0 ? 'text-orange-500' : 'text-green-500'}`}>
                      {trend > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      {Math.abs(trend).toFixed(0)}% vs préc.
                  </div>
              </div>
              <div className="p-3 bg-aqua/10 text-aqua rounded-xl self-end mt-2">
                  <DollarSign size={20} />
              </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-soft border border-gray-100 flex flex-col justify-between">
              <div>
                  <p className="text-sm text-gray-400 font-medium mb-1">Projection</p>
                  <h3 className="text-2xl font-bold text-gray-900">{projection.toFixed(2)} €</h3>
                  <p className="text-xs text-gray-400 mt-2">Estimation fin de période</p>
              </div>
              <div className="p-3 bg-purple-50 text-purple-500 rounded-xl self-end mt-2">
                  <Target size={20} />
              </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-soft border border-gray-100 flex flex-col justify-between">
              <div>
                  <p className="text-sm text-gray-400 font-medium mb-1">Top Catégorie</p>
                  <h3 className="text-xl font-bold text-gray-900 truncate">{topCategory?.name || '-'}</h3>
                  <p className="text-xs text-gray-500 mt-2">
                      {topCategory ? `${topCategory.amount.toFixed(2)} €` : 'Aucune donnée'}
                  </p>
              </div>
              <div className="p-3 bg-honey/10 text-honey rounded-xl self-end mt-2">
                  <Package size={20} />
              </div>
          </div>

          <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-5 rounded-2xl shadow-lg text-white flex flex-col relative overflow-hidden">
              <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={16} className="text-mint animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-widest text-mint">Coach Budget</span>
              </div>
              <p className="text-sm font-medium leading-relaxed z-10">
                  "{aiAdvice}"
              </p>
              <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-mint/10 rounded-full blur-xl"></div>
          </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Spending Chart Container */}
        <div className="bg-white p-6 rounded-2xl shadow-soft border border-gray-100">
          <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-800">Dépenses {period === 'week' ? 'Hebdomadaires' : 'Mensuelles'}</h2>
              <p className="text-sm text-gray-400">
                  {period === 'week' ? 'Semaine en cours (Lun-Dim)' : `Mois de ${new Date().toLocaleString('fr-FR', { month: 'long' })}`}
              </p>
          </div>
          
          <div className="w-full min-h-[350px]">
            {totalExpense > 0 || chartData.some(d => d.depenses > 0) ? (
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
                        <Tooltip 
                            contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)'}}
                            cursor={{fill: '#F3F4F6'}}
                            formatter={(value: number) => [`${value.toFixed(2)} €`, 'Dépenses']}
                        />
                        <Bar dataKey="depenses" fill="#5DADE2" radius={[6, 6, 6, 6]} barSize={period === 'month' ? 40 : 32} />
                    </BarChart>
                </ResponsiveContainer>
            ) : (
                <div className="h-[300px] flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/30">
                    <Calendar className="mb-2 opacity-30" size={32} />
                    <p className="text-sm font-medium opacity-60">Aucune dépense {period === 'week' ? 'cette semaine' : 'ce mois-ci'}</p>
                </div>
            )}
          </div>
        </div>

        {/* Category Breakdown Container */}
        <div className="bg-white p-6 rounded-2xl shadow-soft border border-gray-100">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-lg font-bold text-gray-800">Répartition du Stock</h2>
                    <p className="text-sm text-gray-400">Par catégorie de produit</p>
                </div>
                <div className="bg-mint/10 text-mint px-3 py-1 rounded-lg text-sm font-bold flex items-center gap-1">
                    <Package size={16} />
                    {categoryData.reduce((acc, curr) => acc + curr.value, 0)} produits
                </div>
            </div>

            <div className="w-full min-h-[350px] flex flex-col items-center justify-center">
                {categoryData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                            <Pie
                                data={categoryData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {categoryData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip 
                                contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)'}} 
                                formatter={(value: number) => [value, 'Produits']}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-[260px] w-full flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/30">
                        <Package className="mb-2 opacity-30" size={32} />
                        <p className="text-sm font-medium opacity-60">Votre stock est vide</p>
                    </div>
                )}
                
                {categoryData.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-2 mt-4 max-h-[100px] overflow-y-auto no-scrollbar">
                        {categoryData.map((entry, index) => (
                            <div key={index} className="flex items-center gap-1.5 text-[10px] font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                                <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[index % COLORS.length]}} />
                                {entry.name} <span className="text-gray-400">({entry.value})</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Consumption;
