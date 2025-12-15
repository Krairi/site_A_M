import React, { useState, useEffect, useRef } from 'react';
import { Receipt, Upload, Plus, Loader2, Check, ShoppingBag, Calendar, ScanLine, X, Edit2, Trash2, Save, FileText } from 'lucide-react';
import { supabase, Ticket } from '../services/mockSupabase';
import { parseReceiptWithGemini, ScannedReceipt } from '../services/geminiService';

const Tickets = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [selectedFile, setSelectedFile] = useState<{data: string, type: string, name: string} | null>(null);
  const [scannedData, setScannedData] = useState<ScannedReceipt | null>(null);
  
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Ticket | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    const data = await supabase.getTickets();
    setTickets(data);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedFile({
            data: reader.result as string,
            type: file.type,
            name: file.name
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setAnalyzing(true);
    
    const result = await parseReceiptWithGemini(selectedFile.data);
    
    if (!result) {
        setTimeout(() => {
            setScannedData({
                store: "Magasin Détecté (Fallback)",
                date: new Date().toISOString().split('T')[0],
                total: 24.50,
                items: [
                    { name: "Produit A", quantity: 2, unit: "pcs", category: "Epicerie", price: 10.00 },
                    { name: "Produit B", quantity: 1, unit: "kg", category: "Frais", price: 14.50 }
                ]
            });
            setAnalyzing(false);
        }, 2000);
    } else {
        setScannedData(result);
        setAnalyzing(false);
    }
  };

  const handleSaveScan = async () => {
    if (scannedData) {
        setSaving(true);
        try {
            await supabase.saveTicket(scannedData);
            setScannedData(null);
            setSelectedFile(null);
            setIsScanning(false);
            loadTickets();
        } catch (error) {
            console.error("Error saving ticket", error);
            alert("Erreur lors de l'enregistrement du ticket.");
        } finally {
            setSaving(false);
        }
    }
  };

  // --- CRUD Operations ---

  const handleOpenTicket = (ticket: Ticket) => {
      setSelectedTicket(ticket);
      setEditForm(JSON.parse(JSON.stringify(ticket)));
      setIsEditing(false);
  };

  const handleUpdateTicket = async () => {
      if (!editForm) return;
      const success = await supabase.updateTicket(editForm);
      if (success) {
          setTickets(prev => prev.map(t => t.id === editForm.id ? editForm : t));
          setSelectedTicket(editForm);
          setIsEditing(false);
      } else {
          alert("Erreur lors de la mise à jour du ticket.");
      }
  };

  const handleDeleteTicket = async () => {
      if (!selectedTicket) return;
      if (window.confirm("Voulez-vous vraiment supprimer ce ticket ? Cette action est irréversible.")) {
          const success = await supabase.deleteTicket(selectedTicket.id);
          if (success) {
              setTickets(prev => prev.filter(t => t.id !== selectedTicket.id));
              setSelectedTicket(null);
              setIsEditing(false);
          } else {
              alert("Erreur lors de la suppression du ticket.");
          }
      }
  };

  const updateEditItem = (index: number, field: string, value: any) => {
      if (!editForm) return;
      const newItems = [...editForm.items];
      newItems[index] = { ...newItems[index], [field]: value };
      setEditForm({ ...editForm, items: newItems });
  };

  const deleteEditItem = (index: number) => {
      if (!editForm) return;
      const newItems = editForm.items.filter((_, i) => i !== index);
      setEditForm({ ...editForm, items: newItems });
  };

  const addEditItem = () => {
      if (!editForm) return;
      setEditForm({
          ...editForm,
          items: [...editForm.items, { name: 'Nouveau', quantity: 1, unit: 'pcs', category: 'Autre', price: 0 }]
      });
  };

  const resetScan = () => {
      setIsScanning(false);
      setSelectedFile(null);
      setScannedData(null);
      setAnalyzing(false);
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-display font-bold text-gray-900">Mes Tickets</h1>
          <p className="text-gray-500">Historique et numérisation intelligente.</p>
      </div>

      {!isScanning && (
        <button 
            onClick={() => setIsScanning(true)}
            className="w-full py-4 bg-mint hover:bg-teal-400 text-white rounded-2xl font-bold shadow-lg shadow-mint/30 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
            <Plus size={24} />
            <span className="text-lg">Scanner un ticket</span>
        </button>
      )}

      {/* Mode Scanner */}
      {isScanning && (
        <div className="bg-white rounded-3xl p-6 shadow-soft border border-gray-100 animate-slide-up">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <ScanLine className="text-aqua" /> Nouveau Scan
                </h2>
                <button onClick={resetScan} className="text-gray-400 hover:text-gray-600 font-medium">Annuler</button>
            </div>

            {!scannedData ? (
                <div className="flex flex-col items-center justify-center space-y-6">
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full h-64 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-mint hover:bg-mint/5 transition-all relative overflow-hidden group bg-gray-50/50"
                    >
                        {selectedFile ? (
                            selectedFile.type === 'application/pdf' ? (
                                <div className="flex flex-col items-center text-gray-500 animate-fade-in">
                                     <FileText size={48} className="text-red-400 mb-3 shadow-sm" />
                                     <p className="font-medium text-gray-800 bg-white px-3 py-1 rounded-lg border border-gray-100 shadow-sm">{selectedFile.name}</p>
                                     <p className="text-xs mt-2 text-gray-400">Document PDF</p>
                                </div>
                            ) : (
                                <img src={selectedFile.data} alt="Preview" className="w-full h-full object-contain p-2" />
                            )
                        ) : (
                            <div className="flex flex-col items-center gap-3">
                                <Upload className="text-gray-400 w-8 h-8 group-hover:scale-110 transition-transform duration-300" />
                                <p className="text-gray-500 font-medium">Cliquez pour ajouter une photo ou un PDF</p>
                            </div>
                        )}
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,application/pdf" />
                    </div>

                    {selectedFile && (
                        <button 
                            onClick={handleAnalyze}
                            disabled={analyzing}
                            className="w-full max-w-md py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                        >
                            {analyzing ? <Loader2 className="animate-spin" /> : <ScanLine size={18} />}
                            {analyzing ? "Analyse IA en cours..." : "Lancer l'analyse"}
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-6 animate-fade-in">
                    <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex items-start gap-3">
                        <Check className="text-green-600 w-5 h-5 mt-0.5" />
                        <div>
                            <p className="text-green-800 font-bold">Analyse terminée !</p>
                            <p className="text-green-600 text-sm">Vérifiez les informations ci-dessous.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-3 bg-gray-50 rounded-xl">
                            <span className="text-xs text-gray-500">Magasin</span>
                            <p className="font-bold text-gray-800 truncate" title={scannedData.store}>{scannedData.store}</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-xl">
                            <span className="text-xs text-gray-500">Date</span>
                            <p className="font-bold text-gray-800">{scannedData.date}</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-xl">
                            <span className="text-xs text-gray-500">Total</span>
                            <p className="font-bold text-aqua">{scannedData.total} €</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-xl">
                            <span className="text-xs text-gray-500">Articles</span>
                            <p className="font-bold text-gray-800">{scannedData.items.length}</p>
                        </div>
                    </div>
                    <div className="flex gap-3 justify-end">
                        <button 
                            onClick={() => { setScannedData(null); setSelectedFile(null); }}
                            disabled={saving}
                            className="px-6 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 font-medium transition-colors"
                        >
                            Recommencer
                        </button>
                        <button 
                            onClick={handleSaveScan}
                            disabled={saving}
                            className="px-6 py-3 bg-mint text-white rounded-xl hover:bg-teal-400 font-medium shadow-lg shadow-mint/20 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transition-all active:scale-95"
                        >
                            {saving && <Loader2 className="animate-spin w-4 h-4" />}
                            Confirmer & Ajouter
                        </button>
                    </div>
                </div>
            )}
        </div>
      )}

      {/* Liste Historique */}
      <div className="grid gap-4">
        {tickets.map((ticket) => (
            <div key={ticket.id} className="bg-white p-5 rounded-2xl shadow-soft border border-gray-100 hover:border-gray-200 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 border border-gray-100 group-hover:bg-mint/10 group-hover:text-mint transition-colors">
                        <Receipt size={28} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">{ticket.store}</h3>
                        <div className="flex items-center gap-3 text-sm text-gray-500 mt-0.5">
                            <span className="flex items-center gap-1"><Calendar size={14} /> {ticket.date}</span>
                            <span className="flex items-center gap-1"><ShoppingBag size={14} /> {ticket.items.length} articles</span>
                        </div>
                    </div>
                </div>
                
                <div className="flex items-end md:items-center justify-between md:justify-end gap-6 w-full md:w-auto mt-2 md:mt-0">
                    <div className="md:text-right">
                         <p className="text-xs text-gray-400 mb-0.5 font-medium uppercase tracking-wider">Total</p>
                         <p className="text-2xl font-bold text-gray-900 leading-none">
                            {ticket.total} <span className="text-lg">€</span>
                         </p>
                    </div>
                    <button 
                        onClick={() => handleOpenTicket(ticket)}
                        className="px-5 py-2.5 text-sm font-bold text-aqua bg-aqua/10 rounded-xl hover:bg-aqua hover:text-white transition-all shadow-sm"
                    >
                        Détails
                    </button>
                </div>
            </div>
        ))}

        {!isScanning && tickets.length === 0 && (
            <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-gray-200">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Receipt className="text-gray-300 w-8 h-8" />
                </div>
                <h3 className="text-gray-900 font-medium mb-1">Aucun ticket</h3>
                <p className="text-gray-500 text-sm">Scannez votre premier ticket pour commencer.</p>
            </div>
        )}
      </div>

      {/* Ticket Details & Edit Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setSelectedTicket(null)}></div>
            <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl relative z-10 overflow-hidden animate-slide-up max-h-[90vh] flex flex-col">
                {/* Modal Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
                    <div className="flex-1 pr-4">
                        {isEditing ? (
                             <div className="space-y-2">
                                 <input 
                                    type="text" 
                                    value={editForm?.store}
                                    onChange={e => setEditForm(prev => prev ? {...prev, store: e.target.value} : null)}
                                    className="w-full text-xl font-bold text-gray-900 bg-white border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-mint focus:border-transparent outline-none transition-all"
                                    placeholder="Nom du magasin"
                                 />
                                 <input 
                                    type="date" 
                                    value={editForm?.date}
                                    onChange={e => setEditForm(prev => prev ? {...prev, date: e.target.value} : null)}
                                    className="bg-white border border-gray-300 rounded-lg px-2 py-1 text-sm text-gray-600 focus:ring-2 focus:ring-mint outline-none"
                                 />
                             </div>
                        ) : (
                             <>
                                <h2 className="text-xl font-bold text-gray-900 leading-tight">{selectedTicket.store}</h2>
                                <p className="text-sm text-gray-500 mt-1 font-medium">{selectedTicket.date}</p>
                             </>
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                        {!isEditing && (
                            <>
                                <button 
                                    onClick={() => setIsEditing(true)} 
                                    className="p-2 text-gray-500 hover:bg-white hover:text-mint hover:shadow-sm rounded-xl transition-all" 
                                    title="Modifier"
                                >
                                    <Edit2 size={20} />
                                </button>
                                <button 
                                    onClick={handleDeleteTicket} 
                                    className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all" 
                                    title="Supprimer"
                                >
                                    <Trash2 size={20} />
                                </button>
                                <div className="w-px h-6 bg-gray-200 mx-1"></div>
                            </>
                        )}
                        <button 
                            onClick={() => setSelectedTicket(null)} 
                            className="p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-xl transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>
                
                {/* Modal Body */}
                <div className="p-6 overflow-y-auto flex-1">
                    <div className="space-y-6">
                        {/* Summary Box */}
                        <div className="flex justify-between items-center p-4 bg-mint/5 rounded-xl border border-mint/10">
                            <span className="font-medium text-gray-700">Total payé</span>
                            {isEditing ? (
                                <div className="flex items-center gap-1">
                                    <input 
                                        type="number" 
                                        value={editForm?.total}
                                        onChange={e => setEditForm(prev => prev ? {...prev, total: parseFloat(e.target.value)} : null)}
                                        className="text-2xl font-bold text-aqua bg-white border border-gray-300 rounded-lg px-2 py-1 w-32 text-right"
                                    />
                                    <span className="text-aqua font-bold">€</span>
                                </div>
                            ) : (
                                <span className="text-3xl font-bold text-aqua">{selectedTicket.total} €</span>
                            )}
                        </div>

                        {/* Items List */}
                        <div>
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                                    Articles ({isEditing ? editForm?.items.length : selectedTicket.items.length})
                                </h3>
                                {isEditing && (
                                    <button onClick={addEditItem} className="text-xs font-bold text-mint hover:underline flex items-center gap-1">
                                        <Plus size={14} /> Ajouter
                                    </button>
                                )}
                            </div>
                            
                            <div className="space-y-2">
                                {(isEditing ? editForm?.items : selectedTicket.items)?.map((item, idx) => (
                                    <div key={idx} className="flex flex-col md:flex-row md:justify-between md:items-center p-3 bg-gray-50 rounded-xl gap-2">
                                        <div className="flex items-center gap-3 flex-1">
                                            <div className="w-8 h-8 rounded bg-white flex items-center justify-center text-xs shadow-sm shrink-0">
                                                {item.category === 'Frais' ? '🥛' : item.category === 'Légumes' ? '🥦' : '📦'}
                                            </div>
                                            <div className="flex-1 w-full">
                                                {isEditing ? (
                                                    <div className="flex flex-col gap-1 w-full">
                                                        <input 
                                                            className="font-medium text-gray-900 text-sm bg-white border border-gray-200 rounded px-1 w-full" 
                                                            value={item.name}
                                                            onChange={(e) => updateEditItem(idx, 'name', e.target.value)}
                                                            placeholder="Nom"
                                                        />
                                                        <div className="flex gap-2">
                                                            <input 
                                                                className="text-xs text-gray-500 bg-white border border-gray-200 rounded px-1 w-16" 
                                                                value={item.quantity}
                                                                type="number"
                                                                onChange={(e) => updateEditItem(idx, 'quantity', parseFloat(e.target.value))}
                                                            />
                                                            <input 
                                                                className="text-xs text-gray-500 bg-white border border-gray-200 rounded px-1 w-16" 
                                                                value={item.unit}
                                                                onChange={(e) => updateEditItem(idx, 'unit', e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                                                        <p className="text-xs text-gray-500">{item.quantity} {item.unit} • {item.category}</p>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center justify-between md:justify-end gap-3 min-w-[100px]">
                                            {isEditing ? (
                                                <>
                                                    <div className="flex items-center gap-1">
                                                        <input 
                                                            type="number"
                                                            className="font-medium text-gray-600 text-sm bg-white border border-gray-200 rounded px-1 w-16 text-right"
                                                            value={item.price}
                                                            onChange={(e) => updateEditItem(idx, 'price', parseFloat(e.target.value))}
                                                        />
                                                        <span className="text-xs">€</span>
                                                    </div>
                                                    <button onClick={() => deleteEditItem(idx)} className="text-red-400 hover:text-red-600 p-1">
                                                        <X size={16} />
                                                    </button>
                                                </>
                                            ) : (
                                                <span className="font-bold text-gray-700 text-sm">{item.price ? `${item.price} €` : '-'}</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Modal Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex gap-3">
                    {isEditing ? (
                        <>
                            <button 
                                onClick={() => setIsEditing(false)}
                                className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
                            >
                                Annuler
                            </button>
                            <button 
                                onClick={handleUpdateTicket}
                                className="flex-1 py-3 bg-mint text-white font-bold rounded-xl hover:bg-teal-400 transition-colors shadow-lg shadow-mint/20 flex items-center justify-center gap-2"
                            >
                                <Save size={18} /> Enregistrer
                            </button>
                        </>
                    ) : (
                        <button 
                            onClick={() => setSelectedTicket(null)}
                            className="w-full py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            Fermer
                        </button>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Tickets;