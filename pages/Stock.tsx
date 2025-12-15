import React, { useEffect, useState, useRef } from 'react';
import { Search, Plus, Filter, MoreHorizontal, X, Save, Loader2, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '../services/mockSupabase';
import { Product } from '../types';

const CATEGORIES = ['Frais', 'Epicerie', 'Légumes', 'Hygiène', 'Boissons', 'Autre'];
const UNITS = ['pcs', 'kg', 'g', 'L', 'ml', 'boite'];

const Stock = () => {
  const [stock, setStock] = useState<Product[]>([]);
  const [filter, setFilter] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('Tout');
  const [adding, setAdding] = useState(false);
  
  // Menu State
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    quantity: 1,
    unit: 'pcs',
    category: 'Epicerie',
    minThreshold: 1,
    expiryDate: ''
  });

  // Ref to close menu when clicking outside
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadStock();
    
    // Close menu on click outside
    const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
            setActiveMenuId(null);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadStock = async () => {
    const data = await supabase.getStock();
    setStock(data);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name) return;

    setAdding(true);
    try {
        if (editingId) {
             // Edit Mode
             const updatedProduct = await supabase.updateProduct({
                 id: editingId,
                 name: newProduct.name,
                 quantity: newProduct.quantity,
                 unit: newProduct.unit,
                 category: newProduct.category,
                 minThreshold: newProduct.minThreshold,
                 expiryDate: newProduct.expiryDate
             });

             if (updatedProduct) {
                 setStock(prev => prev.map(p => p.id === editingId ? updatedProduct : p));
             }
        } else {
            // Add Mode
            const addedProduct = await supabase.addProduct({
                name: newProduct.name!,
                quantity: (!newProduct.quantity || isNaN(newProduct.quantity)) ? 1 : newProduct.quantity,
                unit: newProduct.unit || 'pcs',
                category: newProduct.category || 'Autre',
                minThreshold: newProduct.minThreshold ?? 1,
                expiryDate: newProduct.expiryDate
            });

            if (addedProduct) {
                setStock(prev => [addedProduct, ...prev]);
            }
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
      setActiveMenuId(null);
      setIsAddModalOpen(true);
  };

  const handleDeleteClick = async (id: string) => {
      setActiveMenuId(null);
      if (window.confirm("Voulez-vous vraiment supprimer ce produit ?")) {
          await supabase.deleteProduct(id);
          setStock(prev => prev.filter(p => p.id !== id));
      }
  };

  const closeModal = () => {
      setIsAddModalOpen(false);
      setEditingId(null);
      setNewProduct({
        name: '',
        quantity: 1,
        unit: 'pcs',
        category: 'Epicerie',
        minThreshold: 1,
        expiryDate: ''
      });
  };

  const filteredStock = stock.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(filter.toLowerCase());
      const matchesCategory = categoryFilter === 'Tout' || p.category === categoryFilter;
      return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 animate-fade-in relative min-h-[500px]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-display font-bold text-gray-900">Mon Stock</h1>
        <div className="flex gap-2">
            <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`p-3 border rounded-xl transition-colors ${
                    showFilters || categoryFilter !== 'Tout'
                    ? 'bg-mint/10 border-mint text-teal-700' 
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
            >
                <Filter size={20} />
            </button>
            <button 
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 bg-gray-900 text-white px-5 py-3 rounded-xl hover:bg-gray-800 transition-colors shadow-lg"
            >
                <Plus size={20} />
                <span>Ajouter</span>
            </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Rechercher un produit..." 
              className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-mint/50 focus:border-mint transition-all shadow-sm"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>

          {showFilters && (
              <div className="flex flex-wrap gap-2 animate-slide-up">
                  <button
                      onClick={() => setCategoryFilter('Tout')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          categoryFilter === 'Tout' 
                          ? 'bg-gray-800 text-white' 
                          : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
                      }`}
                  >
                      Tout
                  </button>
                  {CATEGORIES.map(cat => (
                      <button
                          key={cat}
                          onClick={() => setCategoryFilter(cat)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                              categoryFilter === cat 
                              ? 'bg-mint text-white shadow-md shadow-mint/20' 
                              : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
                          }`}
                      >
                          {cat}
                      </button>
                  ))}
              </div>
          )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-visible">
        <div className="overflow-x-visible">
            <table className="w-full text-left">
            <thead className="bg-gray-50/50 border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider">
                <tr>
                <th className="px-6 py-4 font-semibold">Produit</th>
                <th className="px-6 py-4 font-semibold">Catégorie</th>
                <th className="px-6 py-4 font-semibold">Quantité</th>
                <th className="px-6 py-4 font-semibold">État</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
                {filteredStock.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50/50 transition-colors group relative">
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-sm">
                                {product.category === 'Frais' ? '🥛' : product.category === 'Légumes' ? '🥦' : '📦'}
                            </div>
                            <span className="font-medium text-gray-900">{product.name}</span>
                        </div>
                    </td>
                    <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {product.category}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-mono text-sm">
                        {product.quantity} <span className="text-gray-400">{product.unit}</span>
                    </td>
                    <td className="px-6 py-4">
                        {product.quantity <= product.minThreshold ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-red-50 text-red-700">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                Critique
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-green-50 text-green-700">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                En stock
                            </span>
                        )}
                    </td>
                    <td className="px-6 py-4 text-right relative">
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(activeMenuId === product.id ? null : product.id);
                            }}
                            className={`p-2 rounded-lg transition-colors ${activeMenuId === product.id ? 'bg-gray-100 text-gray-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                        >
                            <MoreHorizontal size={18} />
                        </button>

                        {/* Dropdown Menu */}
                        {activeMenuId === product.id && (
                            <div 
                                ref={menuRef}
                                className="absolute right-8 top-12 w-40 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-slide-up-sm origin-top-right"
                            >
                                <button 
                                    onClick={() => handleEditClick(product)}
                                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                >
                                    <Edit2 size={14} className="text-gray-500" /> Modifier
                                </button>
                                <button 
                                    onClick={() => handleDeleteClick(product.id)}
                                    className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-gray-50"
                                >
                                    <Trash2 size={14} /> Supprimer
                                </button>
                            </div>
                        )}
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
        {filteredStock.length === 0 && (
            <div className="p-12 text-center text-gray-500">
                Aucun produit trouvé.
            </div>
        )}
      </div>

      {/* Add/Edit Product Modal */}
      {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={closeModal}></div>
              <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl relative z-10 overflow-hidden animate-slide-up">
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                      <h2 className="text-xl font-bold text-gray-900">
                          {editingId ? 'Modifier le produit' : 'Ajouter un produit'}
                      </h2>
                      <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                          <X size={24} />
                      </button>
                  </div>
                  
                  <form onSubmit={handleSaveProduct} className="p-6 space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Nom du produit</label>
                          <input 
                              type="text" 
                              required
                              placeholder="ex: Pommes Gala"
                              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-mint/50"
                              value={newProduct.name}
                              onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                          />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Quantité</label>
                              <input 
                                  type="number" 
                                  required
                                  min="0"
                                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-mint/50"
                                  value={newProduct.quantity}
                                  onChange={e => setNewProduct({...newProduct, quantity: parseFloat(e.target.value)})}
                              />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Unité</label>
                              <select 
                                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-mint/50"
                                  value={newProduct.unit}
                                  onChange={e => setNewProduct({...newProduct, unit: e.target.value})}
                              >
                                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                              </select>
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                            <select 
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-mint/50"
                                value={newProduct.category}
                                onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                            >
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Seuil Alerte</label>
                              <input 
                                  type="number" 
                                  min="0"
                                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-mint/50"
                                  value={newProduct.minThreshold}
                                  onChange={e => setNewProduct({...newProduct, minThreshold: parseFloat(e.target.value)})}
                              />
                        </div>
                      </div>

                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Date d'expiration (Optionnel)</label>
                          <input 
                              type="date" 
                              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-mint/50"
                              value={newProduct.expiryDate || ''}
                              onChange={e => setNewProduct({...newProduct, expiryDate: e.target.value})}
                          />
                      </div>

                      <div className="pt-4 flex gap-3">
                          <button 
                              type="button"
                              onClick={closeModal}
                              className="flex-1 py-3 text-gray-600 bg-gray-100 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                          >
                              Annuler
                          </button>
                          <button 
                              type="submit"
                              disabled={adding}
                              className="flex-1 py-3 bg-mint text-white rounded-xl font-semibold hover:bg-teal-400 transition-colors shadow-lg shadow-mint/20 flex items-center justify-center gap-2"
                          >
                              {adding ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                              Enregistrer
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default Stock;