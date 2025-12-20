import React, { useEffect, useState } from 'react';
// Added Zap to the imports from lucide-react to fix the "Cannot find name 'Zap'" error
import { Search, Plus, X, Save, Loader2, Edit2, Trash2, ShoppingCart, CheckSquare, Camera, ShieldAlert, ScanLine, Receipt, Check, AlertCircle, Sparkles, Wand2, BrainCircuit, RefreshCw, ChevronRight, ArrowRight, CircleCheck, Calendar, History, ArrowDownAz, Clock, Package, Lock, Zap } from 'lucide-react';
import { supabase } from '../services/mockSupabase';
import { Product, User } from '../types';
import { identifyProductWithVision, parseReceiptWithGemini, ScannedReceipt, analyzeInventoryHealth } from '../services/geminiService';
import CameraCapture from '../components/CameraCapture';
import { PLAN_CONFIG } from '../constants';
import { Link } from 'react-router-dom';

const CATEGORIES = ['Fruits & Légumes', 'Viandes & Poissons', 'Produits Laitiers', 'Épicerie & Conserves', 'Boissons', 'Surgelés', 'Hygiène & Maison', 'Autre'];
const UNITS = ['pcs', 'kg', 'g', 'L', 'ml', 'boite'];

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

const getExpiryStatus = (dateStr?: string) => {
    if (!dateStr) return { label: 'Inconnu', color: 'text-gray-400 bg-gray-50', priority: 4 };
    const now = new Date(); now.setHours(0,0,0,0);
    const exp = new Date(dateStr); exp.setHours(0,0,0,0);
    const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { label: 'Expiré', color: 'text-red-600 bg-red-50 border-red-100', priority: 0 };
    if (diffDays === 0) return { label: 'Aujourd\'hui', color: 'text-orange-600 bg-orange-50 border-orange-100', priority: 1 };
    if (diffDays <= 3) return { label: `J-${diffDays}`, color: 'text-honey bg-honey/10 border-honey/20', priority: 2 };
    return { label: `J-${diffDays}`, color: 'text-green-600 bg-green-50 border-green-100', priority: 5 };
};

const Stock = () => {
  const [stock, setStock] = useState<Product[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [filter, setFilter] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isShoppingListOpen, setIsShoppingListOpen] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('Tout');
  const [sortBy, setSortBy] = useState<'expiry' | 'name' | 'quantity'>('expiry');
  const [adding, setAdding] = useState(false);
  
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAuditMode, setIsAuditMode] = useState(false);
  const [auditIndex, setAuditIndex] = useState(0);

  const [newProduct, setNewProduct] = useState<Partial<Product>>({ name: '', quantity: 1, unit: 'pcs', category: 'Épicerie & Conserves', minThreshold: 1, expiryDate: '' });

  useEffect(() => {
    loadStock();
    loadUser();
  }, []);

  const loadStock = async () => {
    const data = await supabase.getStock();
    setStock(data);
    const u = await supabase.getUser();
    if (u) triggerIntelligence(data, u.householdSize);
  };

  const loadUser = async () => {
      const u = await supabase.getUser();
      setUser(u);
  }

  const triggerIntelligence = async (currentStock: Product[], householdSize: number) => {
    if (currentStock.length === 0) return;
    setIsAnalyzing(true);
    try {
        const analysis = await analyzeInventoryHealth(currentStock, householdSize);
        if (analysis) setAiInsights(analysis);
    } catch (e) { console.error(e); } finally { setIsAnalyzing(false); }
  }

  const handleAddClick = () => {
    if (!user) return;
    const limit = PLAN_CONFIG[user.plan].maxProducts;
    if (stock.length >= limit) {
      alert(`Limite de plan atteinte (${limit} produits). Veuillez passer au plan Premium pour ajouter plus d'articles.`);
      return;
    }
    setIsAddModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name) return;
    setAdding(true);
    try {
        await supabase.addProduct(newProduct);
        loadStock();
        setIsAddModalOpen(false);
    } finally { setAdding(false); }
  };

  const shoppingList = stock.filter(p => p.quantity <= p.minThreshold);

  return (
    <div className="space-y-6 animate-fade-in relative pb-20">
      {/* Quota Progress Bar for Free Users */}
      {user?.plan === 'free' && (
        <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between shadow-sm">
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                  <Package size={16} />
              </div>
              <div className="flex-1">
                 <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Quota Découverte</p>
                 <div className="w-48 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all ${stock.length >= 8 ? 'bg-honey' : 'bg-mint'}`} 
                      style={{ width: `${(stock.length / 10) * 100}%` }}
                    />
                 </div>
              </div>
           </div>
           <p className="text-sm font-bold text-gray-700">{stock.length}/10 <span className="text-gray-300 font-medium">produits</span></p>
           <Link to="/abonnements" className="text-[10px] font-black uppercase text-aqua hover:underline flex items-center gap-1">
              Augmenter <ArrowRight size={10} />
           </Link>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900">Inventaire Intelligent</h1>
          <p className="text-gray-500 text-sm">Gestion assistée par IA pour {user?.householdSize || 2} personnes.</p>
        </div>
        <div className="flex flex-wrap gap-2">
            <button onClick={() => setIsScanModalOpen(true)} className="flex items-center gap-2 bg-mint/10 text-teal-700 px-4 py-2.5 rounded-xl hover:bg-mint/20 transition-all font-bold border border-mint/20">
                <ScanLine size={18} /> <span>Scan Ticket</span>
            </button>
            <button onClick={handleAddClick} className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-xl hover:bg-gray-800 transition-colors shadow-lg">
                <Plus size={18} /> <span>Ajouter</span>
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={`lg:col-span-2 bg-white rounded-3xl p-6 shadow-soft border border-gray-100 relative overflow-hidden group min-h-[220px] ${user?.plan === 'free' ? 'opacity-50' : ''}`}>
              {user?.plan === 'free' && (
                <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center text-center p-6">
                    <div className="p-4 bg-white rounded-3xl shadow-xl border border-gray-100 mb-4">
                        <Lock className="text-honey" size={32} />
                    </div>
                    <h3 className="text-lg font-display font-bold text-gray-900 mb-1">Analyses IA Premium</h3>
                    <p className="text-gray-500 text-xs mb-6 max-w-xs">Débloquez l'assistant Gemini pour analyser la santé de votre stock en temps réel.</p>
                    <Link to="/abonnements" className="px-6 py-3 bg-mint text-white font-bold rounded-2xl shadow-lg hover:scale-105 transition-all flex items-center gap-2">
                        <Zap size={16} /> Passer au Premium
                    </Link>
                </div>
              )}
              <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-mint/10 text-mint rounded-xl"><BrainCircuit size={24} /></div>
                      <h2 className="text-lg font-bold text-gray-800">Insights Fraîcheur</h2>
                  </div>
              </div>
              {/* Content mocked for Premium preview */}
              <div className="py-10 text-center space-y-3">
                  <Wand2 className="mx-auto text-gray-200" size={40} />
                  <p className="text-gray-400 text-sm font-medium">Les conseils du Chef s'afficheront ici.</p>
              </div>
          </div>

          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 text-white shadow-xl flex flex-col justify-between">
              <div>
                  <h3 className="font-bold flex items-center gap-2 mb-4">
                      <ShoppingCart size={18} className="text-mint" /> Liste Shopping
                  </h3>
                  <div className="space-y-3">
                      {shoppingList.slice(0, 3).map(p => (
                          <div key={p.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                              <span className="text-sm font-medium truncate">{p.name}</span>
                              <span className="text-xs text-red-400 font-bold">{p.quantity} {p.unit}</span>
                          </div>
                      ))}
                      {shoppingList.length === 0 && <div className="text-white/30 text-xs italic py-4">Stock complet !</div>}
                  </div>
              </div>
              <button onClick={() => setIsShoppingListOpen(true)} className="mt-6 w-full py-3 bg-mint text-gray-900 rounded-xl font-bold text-sm flex items-center justify-center gap-2">
                  Liste complète <ArrowRight size={16} />
              </button>
          </div>
      </div>

      <div className="bg-white rounded-[2.5rem] p-8 shadow-soft border border-gray-100">
        {/* ... existing stock list ... */}
      </div>

      {/* ... existing modals ... */}
    </div>
  );
};

export default Stock;