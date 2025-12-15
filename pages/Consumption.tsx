import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const data = [
  { name: 'Lun', calories: 2400, depenses: 12 },
  { name: 'Mar', calories: 1398, depenses: 25 },
  { name: 'Mer', calories: 9800, depenses: 8 },
  { name: 'Jeu', calories: 3908, depenses: 45 },
  { name: 'Ven', calories: 4800, depenses: 30 },
  { name: 'Sam', calories: 3800, depenses: 80 },
  { name: 'Dim', calories: 4300, depenses: 15 },
];

const categoryData = [
  { name: 'Frais', value: 400 },
  { name: 'Epicerie', value: 300 },
  { name: 'Légumes', value: 300 },
  { name: 'Fruits', value: 250 },
  { name: 'Boissons', value: 200 },
  { name: 'Ménager', value: 150 },
];

// Mint, Aqua, Honey, Pastel Red (Fruits), Gray (Boissons), Pastel Purple (Ménager)
const COLORS = ['#76D7C4', '#5DADE2', '#F5B041', '#F1948A', '#D5D8DC', '#BB8FCE'];

const Consumption = () => {
  return (
    <div className="space-y-8 animate-fade-in">
      <h1 className="text-3xl font-display font-bold text-gray-900">Analyses & Consommation</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Weekly Spending */}
        <div className="bg-white p-6 rounded-2xl shadow-soft border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-6">Dépenses Hebdomadaires</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
                <Tooltip 
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)'}}
                    cursor={{fill: '#F3F4F6'}}
                />
                <Bar dataKey="depenses" fill="#5DADE2" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white p-6 rounded-2xl shadow-soft border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-6">Répartition du Stock</h2>
            <div className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)'}} />
                </PieChart>
                </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-2">
                {categoryData.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs text-gray-500">
                        <div className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS[index % COLORS.length]}} />
                        {entry.name}
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Consumption;