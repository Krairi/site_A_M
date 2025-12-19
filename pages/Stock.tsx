
import React, { useEffect, useState } from 'react';
import { Search, Plus, X, Save, Loader2, Edit2, Trash2, ShoppingCart, CheckSquare, Camera, ShieldAlert, ScanLine, Receipt, Check, AlertCircle, Sparkles, Wand2, BrainCircuit, RefreshCw, ChevronRight, ArrowRight, CircleCheck, Calendar, History, ArrowDownAz, Clock } from 'lucide-react';
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
  const [selectedScanFile, setSelectedScanFile] = useState<string | null>(null);

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
  };

  const confirmScanAdd = async () => {
      if (!scannedReceipt) return;
      setAdding(true);
      try {
          await supabase.saveTicket(scannedReceipt);
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
      setSelectedScanFile(null);
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
      setAuditIndex(0);
      setIsAuditMode(true);
  };

  const updateAuditQty = async (id: string, newQty: number) => {
      await supabase.updateProduct({ id, quantity: newQty });
      loadStock();
      if (auditIndex < stock.length - 1) {
          setAuditIndex(auditIndex + 1);
      } else {
          setIsAuditMode(false);
      }
  };

  return (
    <div className="space-y-6 animate-fade-in relative pb-20">
      {isCameraActive && (
        <CameraCapture 
          onCapture={handleCapture} 
          onClose={() => setIsCameraActive(false)} 
          title="Scanner un article" 
        />
      )}

      {/* Header */}
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
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-soft border border-gray-100 relative overflow-hidden group">
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
                      {shoppingList.slice(0, 3).map(p => (
                          <div key={p.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 group-hover:bg-white/10 transition-colors">
                              <span className="text-sm font-medium truncate pr-2">{p.name}</span>
                              <span className="text-xs text-red-400 font-bold shrink-0">{p.quantity} {p.unit}</span>
                          </div>
                      ))}
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
    </div>
  );
};

export default Stock;
