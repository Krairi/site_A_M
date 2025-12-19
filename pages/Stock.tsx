
import React, { useEffect, useState } from 'react';
// Fix: Added missing 'Package' import from lucide-react
import { Search, Plus, X, Save, Loader2, Edit2, Trash2, ShoppingCart, CheckSquare, Camera, ShieldAlert, ScanLine, Receipt, Check, AlertCircle, Sparkles, Wand2, BrainCircuit, RefreshCw, ChevronRight, ArrowRight, CircleCheck, Calendar, History, ArrowDownAz, Clock, Package } from 'lucide-react';
import { supabase } from '../services/mockSupabase';
import { Product, User } from '../types';
import { identifyProductWithVision, parseReceiptWithGemini, ScannedReceipt, analyzeInventoryHealth } from '../services/geminiService';
import CameraCapture from '../components/CameraCapture';

const CATEGORIES = [
  'Fruits & Légumes', 
  'Viandes & Poissons', 
  'Produits Laitiers', 
  'Épicerie & Conserves', 
  'Boissons', 
  'Surgelés', 
  'Hygiène & Maison', 
  'Autre'
];
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
    const now = new Date();
    now.setHours(0,0,0,0);
    const exp = new Date(dateStr);
    exp.setHours(0,0,0,0);
    
    const diffTime = exp.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { label: 'Expiré', color: 'text-red-600 bg-red-50 border-red-100', priority: 0 };
    if (diffDays === 0) return { label: 'Aujourd\'hui', color: 'text-orange-600 bg-orange-50 border-orange-100', priority: 1 };
    if (diffDays <= 3) return { label: `J-${diffDays}`, color: 'text-honey bg-honey/10 border-honey/20', priority: 2 };
    if (diffDays <= 7) return { label: `J-${diffDays}`, color: 'text-yellow-600 bg-yellow-50 border-yellow-100', priority: 3 };
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
  
  const [aiInsights, setAiInsights] = useState<{
    wasteScore: number;
    insights: string[];
    missingEssentials: string[];
    restockSuggestions: string[];
    urgentToConsume: string[];
  } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAuditMode, setIsAuditMode] = useState(false);
  const [auditIndex, setAuditIndex] = useState(0);

  const [analyzingScan, setAnalyzingScan] = useState(false);
  const [scannedReceipt, setScannedReceipt] = useState<ScannedReceipt | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [analyzingPhoto, setAnalyzingPhoto] = useState(false);
  const [productWarning, setProductWarning] = useState<string | null>(null);
  
  const [editingId, setEditingId] = useState<string | null>(null);

  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    quantity: 1,
    unit: 'pcs',
    category: 'Épicerie & Conserves',
    minThreshold: 1,
    expiryDate: ''
  });

  useEffect(() => {
    loadStock();
    loadUser();
    
    const handleUpdate = () => {
        loadStock();
        loadUser();
    };
    window.addEventListener('givd-update', handleUpdate);
    return () => window.removeEventListener('givd-update', handleUpdate);
  }, []);

  const loadStock = async () => {
    const data = await supabase.getStock();
    setStock(data);
    const u = await supabase.getUser();
    if (u) triggerIntelligence(data, u.householdSize);
  };

  const triggerIntelligence = async (currentStock: Product[], householdSize: number) => {
    if (currentStock.length === 0) return;
    setIsAnalyzing(true);
    try {
        const analysis = await analyzeInventoryHealth(currentStock, householdSize);
        if (analysis) setAiInsights(analysis);
    } catch (e) {
        console.error("Analysis error", e);
    } finally {
        setIsAnalyzing(false);
    }
  }

  const loadUser = async () => {
      const u = await supabase.getUser();
      setUser(u);
  }

  const handleCapture = async (base64: string) => {
    setIsCameraActive(false);
    
    if (isScanModalOpen) {
        setPreviewImage(base64);
        setAnalyzingScan(true);
        try {
            const res = await parseReceiptWithGemini(base64, user || undefined);
            if (res) setScannedReceipt(res);
        } catch (e) {
            console.error(e);
        } finally {
            setAnalyzingScan(false);
        }
    } else {
        setAnalyzingPhoto(true);
        setProductWarning(null);
        try {
          const detected = await identifyProductWithVision(base64, user || undefined);
          if (detected) {
            setNewProduct(prev => ({
              ...prev,
              name: detected.name || prev.name,
              category: detected.category || prev.category,
              quantity: detected.quantity || 1,
              unit: detected.unit || 'pcs'
            }));
            if (detected.warning) setProductWarning(detected.warning);
          }
        } catch (e) {
          console.error("Erreur vision", e);
        } finally {
          setAnalyzingPhoto(false);
        }
    }
  };

  const confirmScanAdd = async () => {
      if (!scannedReceipt) return;
      setAdding(true);
      try {
          await supabase.saveTicket(scannedReceipt, previewImage || undefined);
          loadStock();
          closeScanModal();
          window.dispatchEvent(new Event('givd-update'));
      } catch (err) {
          console.error(err);
      } finally {
          setAdding(false);
      }
  };

  const closeScanModal = () => {
      setIsScanModalOpen(false);
      setScannedReceipt(null);
      setPreviewImage(null);
      setAnalyzingScan(false);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name) return;
    setAdding(true);
    try {
        const payload = {
            name: newProduct.name!,
            quantity: (!newProduct.quantity || isNaN(newProduct.quantity)) ? 1 : newProduct.quantity,
            unit: newProduct.unit || 'pcs',
            category: newProduct.category || 'Autre',
            minThreshold: newProduct.minThreshold ?? 1,
            expiryDate: newProduct.expiryDate || undefined
        };

        if (editingId) {
             const updatedProduct = await supabase.updateProduct({ id: editingId, ...payload });
             if (updatedProduct) setStock(prev => prev.map(p => p.id === editingId ? updatedProduct : p));
        } else {
            const addedProduct = await supabase.addProduct(payload);
            if (addedProduct) setStock(prev => [addedProduct, ...prev]);
        }
        closeModal();
        loadStock();
    } catch (error) {
        console.error("Error saving product", error);
    } finally {
        setAdding(false);
    }
  };

  const handleEditClick = (product: Product) => {
      setNewProduct({ ...product });
      setEditingId(product.id);
      setIsAddModalOpen(true);
  };

  const handleDeleteClick = async (id: string) => {
      if (window.confirm("Voulez-vous vraiment supprimer ce produit ?")) {
          await supabase.deleteProduct(id);
          setStock(prev => prev.filter(p => p.id !== id));
      }
  };

  const closeModal = () => {
      setIsAddModalOpen(false);
      setEditingId(null);
      setProductWarning(null);
      setNewProduct({
        name: '',
        quantity: 1,
        unit: 'pcs',
        category: 'Épicerie & Conserves',
        minThreshold: 1,
        expiryDate: ''
      });
  };

  const sortedStock = [...stock].sort((a, b) => {
      if (sortBy === 'expiry') {
          const statusA = getExpiryStatus(a.expiryDate).priority;
          const statusB = getExpiryStatus(b.expiryDate).priority;
          return statusA - statusB;
      }
      if (sortBy === 'quantity') return b.quantity - a.quantity;
      return a.name.localeCompare(b.name);
  });

  const filteredStock = sortedStock.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(filter.toLowerCase());
      const matchesCategory = categoryFilter === 'Tout' || p.category === categoryFilter;
      return matchesSearch && matchesCategory;
  });

  const shoppingList = stock.filter(p => p.quantity <= p.minThreshold);

  const startAudit = () => {
      if (stock.length === 0) return;
      setAuditIndex(0);
      setIsAuditMode(true);
  };

  const updateAuditQty = async (id: string, newQty: number) => {
      await supabase.updateProduct({ id, quantity: newQty });
      if (auditIndex < stock.length - 1) {
          setAuditIndex(auditIndex + 1);
      } else {
          setIsAuditMode(false);
          loadStock();
      }
  };

  return (
    <div className="space-y-6 animate-fade-in relative pb-20">
      {isCameraActive && (
        <CameraCapture 
          onCapture={handleCapture} 
          onClose={() => setIsCameraActive(false)} 
          title={isScanModalOpen ? "Scanner un ticket" : "Scanner un article"} 
        />
      )}

      {/* Header (Matching Screenshot) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900">Inventaire Intelligent</h1>
          <p className="text-gray-500 text-sm">Gestion assistée par IA pour {user?.householdSize || 2} personnes.</p>
        </div>
        <div className="flex flex-wrap gap-2">
            <button 
                onClick={startAudit}
                className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2.5 rounded-xl hover:bg-indigo-100 transition-all font-bold border border-indigo-100"
            >
                <RefreshCw size={18} />
                <span>Mode Audit</span>
            </button>
            <button 
                onClick={() => setIsScanModalOpen(true)}
                className="flex items-center gap-2 bg-mint/10 text-teal-700 px-4 py-2.5 rounded-xl hover:bg-mint/20 transition-all font-bold border border-mint/20 shadow-sm"
            >
                <ScanLine size={18} />
                <span>Scan Ticket</span>
            </button>
            <button 
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-xl hover:bg-gray-800 transition-colors shadow-lg"
            >
                <Plus size={18} />
                <span>Ajouter</span>
            </button>
        </div>
      </div>

      {/* INTELLIGENCE DASHBOARD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-soft border border-gray-100 relative overflow-hidden group min-h-[220px]">
              <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-mint/10 text-mint rounded-xl">
                          <BrainCircuit size={24} />
                      </div>
                      <h2 className="text-lg font-bold text-gray-800">Insights Fraîcheur</h2>
                  </div>
                  {isAnalyzing && <Loader2 className="animate-spin text-mint" size={20} />}
              </div>

              {aiInsights ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                <div>
                                    <p className="text-xs text-gray-400 font-bold uppercase mb-1">Score Santé</p>
                                    <p className="text-2xl font-black text-gray-900">{aiInsights.wasteScore}%</p>
                                </div>
                                <div className={`w-12 h-12 rounded-full border-4 ${aiInsights.wasteScore > 80 ? 'border-mint text-mint' : 'border-honey text-honey'} flex items-center justify-center text-[10px] font-bold`}>
                                    {aiInsights.wasteScore > 80 ? 'TOP' : 'URGENT'}
                                </div>
                          </div>
                      </div>
                      <div className="space-y-2">
                          <p className="text-xs text-gray-400 font-bold uppercase px-1">Analyse pour {user?.householdSize || 2} pers.</p>
                          {aiInsights.insights.map((insight, i) => (
                              <div key={i} className="flex gap-3 items-start p-2 hover:bg-gray-50 rounded-xl transition-colors">
                                  <Sparkles className="text-mint shrink-0 mt-1" size={14} />
                                  <p className="text-sm text-gray-600 leading-snug">{insight}</p>
                              </div>
                          ))}
                      </div>
                  </div>
              ) : (
                  <div className="py-10 text-center space-y-3">
                      <Wand2 className="mx-auto text-gray-200 animate-pulse" size={40} />
                      <p className="text-gray-400 text-sm font-medium">Analyse intelligente en cours...</p>
                  </div>
              )}
          </div>

          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden group">
              <div className="relative z-10 flex flex-col h-full">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold flex items-center gap-2">
                        <ShoppingCart size={18} className="text-mint" /> Liste Shopping IA
                    </h3>
                  </div>
                  <div className="flex-1 space-y-3">
                      {shoppingList.length > 0 ? (
                        shoppingList.slice(0, 3).map(p => (
                            <div key={p.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 group-hover:bg-white/10 transition-colors">
                                <span className="text-sm font-medium truncate pr-2">{p.name}</span>
                                <span className="text-xs text-red-400 font-bold shrink-0">{p.quantity} {p.unit}</span>
                            </div>
                        ))
                      ) : (
                        <div className="text-white/30 text-xs italic py-4">Votre stock est complet !</div>
                      )}
                  </div>
                  <button 
                      onClick={() => setIsShoppingListOpen(true)}
                      className="mt-6 w-full py-3 bg-mint text-gray-900 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-teal-400 transition-all"
                  >
                      Générer liste complète <ArrowRight size={16} />
                  </button>
              </div>
          </div>
      </div>

      {/* Main Stock List Container */}
      <div className="bg-white rounded-[2.5rem] p-8 shadow-soft border border-gray-100 space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input 
                        type="text" 
                        placeholder="Rechercher un aliment..."
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-mint transition-all focus:outline-none font-medium"
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto overflow-x-auto no-scrollbar pb-1 md:pb-0">
                    {['Tout', ...CATEGORIES].map(cat => (
                        <button 
                            key={cat}
                            onClick={() => setCategoryFilter(cat)}
                            className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap border transition-all ${
                                categoryFilter === cat ? 'bg-aqua text-white border-aqua shadow-md' : 'bg-white text-gray-500 border-gray-100 hover:border-gray-300'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredStock.map(product => {
                    const status = getExpiryStatus(product.expiryDate);
                    const isLow = product.quantity <= product.minThreshold;
                    return (
                        <div key={product.id} className="group p-5 bg-white border border-gray-100 rounded-[2rem] hover:shadow-lg transition-all flex flex-col justify-between">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                        {getCategoryIcon(product.category)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 group-hover:text-mint transition-colors">{product.name}</h3>
                                        <p className="text-xs text-gray-400 uppercase font-black">{product.category}</p>
                                    </div>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEditClick(product)} className="p-2 text-gray-400 hover:text-aqua hover:bg-aqua/10 rounded-lg"><Edit2 size={16} /></button>
                                    <button onClick={() => handleDeleteClick(product.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-gray-400 font-black uppercase mb-1">Quantité</span>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-lg font-bold ${isLow ? 'text-red-500' : 'text-gray-900'}`}>{product.quantity} {product.unit}</span>
                                        {isLow && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] text-gray-400 font-black uppercase mb-1">Expiration</span>
                                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${status.color}`}>
                                        {status.label}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {filteredStock.length === 0 && (
                <div className="py-20 text-center space-y-4">
                    <Package className="mx-auto text-gray-100" size={64} />
                    <p className="text-gray-400 font-medium italic">Aucun aliment trouvé dans cette catégorie.</p>
                </div>
            )}
      </div>

      {/* AUDIT MODE MODAL */}
      {isAuditMode && stock.length > 0 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsAuditMode(false)}></div>
              <div className="bg-white rounded-[3rem] w-full max-w-lg shadow-2xl relative z-10 overflow-hidden animate-slide-up">
                  <div className="p-8 border-b border-gray-100 bg-indigo-50/50 flex justify-between items-center">
                      <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-500 shadow-sm">
                              <RefreshCw size={24} />
                          </div>
                          <div>
                              <h2 className="text-xl font-display font-bold text-gray-900">Audit du Stock</h2>
                              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Étape {auditIndex + 1} / {stock.length}</p>
                          </div>
                      </div>
                      <button onClick={() => setIsAuditMode(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                  </div>
                  
                  <div className="p-10 space-y-10 text-center">
                      <div className="space-y-4">
                          <div className="w-32 h-32 bg-gray-50 rounded-[2.5rem] mx-auto flex items-center justify-center text-6xl shadow-inner border border-gray-100">
                              {getCategoryIcon(stock[auditIndex].category)}
                          </div>
                          <div>
                              <h3 className="text-3xl font-display font-bold text-gray-900">{stock[auditIndex].name}</h3>
                              <p className="text-gray-400 font-medium">Quantité actuelle : {stock[auditIndex].quantity} {stock[auditIndex].unit}</p>
                          </div>
                      </div>

                      <div className="flex items-center justify-center gap-6">
                           <button 
                                onClick={() => updateAuditQty(stock[auditIndex].id, Math.max(0, stock[auditIndex].quantity - 1))}
                                className="w-16 h-16 bg-gray-50 text-gray-900 rounded-2xl flex items-center justify-center text-2xl font-bold hover:bg-gray-100 transition-all active:scale-95"
                           >
                               -
                           </button>
                           <div className="w-24 text-4xl font-display font-bold text-indigo-600">{stock[auditIndex].quantity}</div>
                           <button 
                                onClick={() => updateAuditQty(stock[auditIndex].id, stock[auditIndex].quantity + 1)}
                                className="w-16 h-16 bg-indigo-500 text-white rounded-2xl flex items-center justify-center text-2xl font-bold hover:bg-indigo-600 transition-all active:scale-95 shadow-lg shadow-indigo-200"
                           >
                               +
                           </button>
                      </div>

                      <div className="flex gap-4">
                          <button 
                            onClick={() => auditIndex < stock.length - 1 ? setAuditIndex(auditIndex + 1) : setIsAuditMode(false)}
                            className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                          >
                            Passer
                          </button>
                          <button 
                            onClick={() => updateAuditQty(stock[auditIndex].id, stock[auditIndex].quantity)}
                            className="flex-1 py-4 bg-gray-900 text-white rounded-2xl font-bold shadow-xl hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
                          >
                            <CircleCheck size={20} />
                            Confirmer
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* SCAN TICKET MODAL */}
      {isScanModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeScanModal}></div>
              <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl relative z-10 overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
                  <div className="p-8 border-b border-gray-50 flex justify-between items-center">
                      <div className="flex items-center gap-4">
                          <div className="p-3 bg-mint/10 text-mint rounded-xl"><ScanLine size={24} /></div>
                          <h2 className="text-xl font-display font-bold text-gray-900">Scanner mon ticket</h2>
                      </div>
                      <button onClick={closeScanModal} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                  </div>

                  <div className="p-10 flex-1 overflow-y-auto custom-scrollbar">
                      {!previewImage ? (
                          <div className="space-y-6">
                              <div 
                                onClick={() => setIsCameraActive(true)}
                                className="p-12 border-2 border-dashed border-mint/20 rounded-[2.5rem] bg-mint/5 hover:bg-mint/10 hover:border-mint/40 transition-all cursor-pointer flex flex-col items-center justify-center group"
                              >
                                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-mint shadow-sm mb-4 group-hover:scale-110 transition-transform">
                                      <Camera size={32} />
                                  </div>
                                  <p className="text-lg font-bold text-gray-800">Prendre une photo</p>
                                  <p className="text-sm text-gray-400 mt-1">L'IA détectera automatiquement les articles</p>
                              </div>
                          </div>
                      ) : analyzingScan ? (
                          <div className="py-20 text-center space-y-6">
                              <Loader2 className="animate-spin text-mint mx-auto w-16 h-16" />
                              <div>
                                <h3 className="text-2xl font-display font-bold text-gray-900">Analyse du ticket...</h3>
                                <p className="text-gray-400 font-medium">Nos algorithmes extraient vos articles</p>
                              </div>
                          </div>
                      ) : scannedReceipt ? (
                          <div className="space-y-6">
                              <div className="p-6 bg-gray-900 text-white rounded-[2rem] flex justify-between items-center shadow-xl">
                                  <div>
                                      <p className="text-xs text-mint font-black uppercase tracking-widest">{scannedReceipt.store}</p>
                                      <p className="text-2xl font-display font-bold">{scannedReceipt.total.toFixed(2)}€</p>
                                  </div>
                                  <div className="text-right">
                                      <p className="text-xs text-gray-400 uppercase font-black">Date</p>
                                      <p className="font-bold">{scannedReceipt.date}</p>
                                  </div>
                              </div>
                              <div className="space-y-3">
                                  {scannedReceipt.items.map((item, idx) => (
                                      <div key={idx} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                          <div className="flex items-center gap-3">
                                              <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-xl">
                                                  {getCategoryIcon(item.category)}
                                              </div>
                                              <div>
                                                  <p className="font-bold text-gray-800 text-sm">{item.name}</p>
                                                  <p className="text-[10px] text-gray-400 uppercase font-black">{item.quantity} {item.unit}</p>
                                              </div>
                                          </div>
                                          <span className="font-bold text-gray-900">{item.price.toFixed(2)}€</span>
                                      </div>
                                  ))}
                              </div>
                              <div className="flex gap-4 pt-6">
                                  <button onClick={() => setPreviewImage(null)} className="flex-1 py-4 bg-white border border-gray-200 text-gray-600 font-bold rounded-2xl">Recommencer</button>
                                  <button onClick={confirmScanAdd} disabled={adding} className="flex-[2] py-4 bg-mint text-white font-bold rounded-2xl shadow-xl flex items-center justify-center gap-2">
                                      {adding ? <Loader2 className="animate-spin" /> : <Check />} Enregistrer tout le stock
                                  </button>
                              </div>
                          </div>
                      ) : null}
                  </div>
              </div>
          </div>
      )}

      {/* ADD/EDIT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal}></div>
          <div className="bg-white rounded-[3rem] w-full max-w-lg shadow-2xl relative z-10 overflow-hidden animate-slide-up">
            <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-white">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-gray-900 text-white rounded-2xl"><Plus size={20} /></div>
                    <h2 className="text-xl font-display font-bold text-gray-900">{editingId ? 'Modifier un article' : 'Ajouter un aliment'}</h2>
                </div>
                <button onClick={closeModal} className="text-gray-300 hover:text-gray-600 transition-colors"><X size={24} /></button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-10 space-y-6">
                <div className="grid grid-cols-1 gap-6">
                    <div className="flex items-end gap-3">
                        <div className="flex-1">
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Désignation</label>
                            <input 
                                type="text" 
                                required
                                value={newProduct.name}
                                onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                                placeholder="ex: Fraises bio"
                                className="w-full px-5 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-mint transition-all focus:outline-none font-medium"
                            />
                        </div>
                        <button 
                            type="button" 
                            onClick={() => setIsCameraActive(true)}
                            className="p-4 bg-gray-900 text-white rounded-2xl shadow-lg hover:bg-gray-800 active:scale-95 transition-all"
                            title="Identifier avec l'IA"
                        >
                            {analyzingPhoto ? <Loader2 className="animate-spin" size={20} /> : <Camera size={20} />}
                        </button>
                    </div>

                    {productWarning && (
                        <div className="p-4 bg-orange-50 text-orange-700 rounded-2xl border border-orange-100 flex items-start gap-3 text-xs animate-shake">
                            <AlertCircle className="shrink-0" size={16} />
                            <p className="font-medium">{productWarning}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Quantité</label>
                            <input 
                                type="number" 
                                step="any"
                                value={newProduct.quantity}
                                onChange={(e) => setNewProduct({...newProduct, quantity: parseFloat(e.target.value) || 0})}
                                className="w-full px-5 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-mint transition-all focus:outline-none font-bold"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Unité</label>
                            <select 
                                value={newProduct.unit}
                                onChange={(e) => setNewProduct({...newProduct, unit: e.target.value})}
                                className="w-full px-5 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-mint transition-all focus:outline-none font-bold appearance-none"
                            >
                                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Catégorie</label>
                        <div className="grid grid-cols-2 gap-2">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setNewProduct({...newProduct, category: cat})}
                                    className={`px-4 py-3 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${
                                        newProduct.category === cat ? 'bg-mint text-white border-mint shadow-md' : 'bg-white text-gray-500 border-gray-100 hover:border-gray-300'
                                    }`}
                                >
                                    <span>{getCategoryIcon(cat)}</span>
                                    <span className="truncate">{cat}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Date d'expiration</label>
                            <input 
                                type="date" 
                                value={newProduct.expiryDate}
                                onChange={(e) => setNewProduct({...newProduct, expiryDate: e.target.value})}
                                className="w-full px-5 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-mint transition-all focus:outline-none font-medium"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Seuil Alerte</label>
                            <input 
                                type="number" 
                                value={newProduct.minThreshold}
                                onChange={(e) => setNewProduct({...newProduct, minThreshold: parseInt(e.target.value) || 0})}
                                className="w-full px-5 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-mint transition-all focus:outline-none font-medium"
                            />
                        </div>
                    </div>
                </div>

                <div className="pt-6 flex gap-4">
                    <button type="button" onClick={closeModal} className="flex-1 py-5 bg-white border border-gray-100 text-gray-500 font-bold rounded-2xl hover:bg-gray-50 transition-all">Annuler</button>
                    <button type="submit" disabled={adding} className="flex-[2] py-5 bg-mint text-white font-bold rounded-2xl shadow-xl shadow-mint/20 hover:bg-teal-400 transition-all flex items-center justify-center gap-3 active:scale-95">
                        {adding ? <Loader2 className="animate-spin" /> : <Save />} {editingId ? 'Mettre à jour' : 'Ajouter au stock'}
                    </button>
                </div>
            </form>
          </div>
        </div>
      )}

      {/* SHOPPING LIST MODAL */}
      {isShoppingListOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsShoppingListOpen(false)}></div>
              <div className="bg-white rounded-[3rem] w-full max-w-lg shadow-2xl relative z-10 overflow-hidden animate-slide-up flex flex-col max-h-[85vh]">
                  <div className="p-8 border-b border-gray-50 bg-gray-900 text-white flex justify-between items-center">
                      <div className="flex items-center gap-4">
                          <ShoppingCart className="text-mint" />
                          <h2 className="text-xl font-display font-bold">Liste de courses</h2>
                      </div>
                      <button onClick={() => setIsShoppingListOpen(false)} className="text-gray-400 hover:text-white"><X size={24} /></button>
                  </div>
                  <div className="p-8 overflow-y-auto flex-1 custom-scrollbar space-y-4">
                      {shoppingList.length > 0 ? (
                          shoppingList.map(item => (
                              <div key={item.id} className="flex items-center justify-between p-5 bg-gray-50 rounded-2xl border border-gray-100">
                                  <div className="flex items-center gap-4">
                                      <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-2xl">{getCategoryIcon(item.category)}</div>
                                      <div>
                                          <p className="font-bold text-gray-900">{item.name}</p>
                                          <p className="text-xs text-red-500 font-bold uppercase">Il reste {item.quantity} {item.unit}</p>
                                      </div>
                                  </div>
                                  <button className="p-3 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-mint transition-all">
                                      <CheckSquare size={20} />
                                  </button>
                              </div>
                          ))
                      ) : (
                          <div className="py-20 text-center space-y-4">
                              <CircleCheck size={64} className="mx-auto text-mint opacity-20" />
                              <p className="text-gray-400 font-medium">Tout est en ordre, pas de courses nécessaires !</p>
                          </div>
                      )}
                  </div>
                  <div className="p-8 bg-gray-50 border-t border-gray-100">
                      <button className="w-full py-5 bg-gray-900 text-white rounded-2xl font-bold shadow-xl flex items-center justify-center gap-3">
                          <Receipt size={20} /> Exporter la liste (PDF)
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Stock;
