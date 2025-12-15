import React, { useState, useEffect, useRef } from 'react';
import { Receipt, Upload, Plus, Loader2, Check, ShoppingBag, Calendar, Euro, ScanLine, X } from 'lucide-react';
import { supabase, Ticket } from '../services/mockSupabase';
import { parseReceiptWithGemini, ScannedReceipt } from '../services/geminiService';

const Tickets = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [scannedData, setScannedData] = useState<ScannedReceipt | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
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
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;
    setAnalyzing(true);
    
    // Simulate AI analysis or call real service
    const result = await parseReceiptWithGemini(selectedImage);
    
    // Fallback Mock if AI fails or no Key
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

  const handleSave = async () => {
    if (scannedData) {
        await supabase.saveTicket(scannedData);
        setScannedData(null);
        setSelectedImage(null);
        setIsScanning(false);
        loadTickets();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900">Mes Tickets</h1>
          <p className="text-gray-500 mt-1">Historique et numérisation intelligente.</p>
        </div>
        <button 
          onClick={() => setIsScanning(true)}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-mint to-teal-400 text-white px-6 py-3 rounded-xl font-semibold shadow-glow hover:shadow-lg transition-all transform hover:scale-105"
        >
          <Plus size={20} />
          <span>Scanner un ticket</span>
        </button>
      </div>

      {/* Mode Scanner */}
      {isScanning && (
        <div className="bg-white rounded-3xl p-6 shadow-soft border border-gray-100 animate-slide-up">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <ScanLine className="text-aqua" /> Nouveau Scan
                </h2>
                <button onClick={() => setIsScanning(false)} className="text-gray-400 hover:text-gray-600">Annuler</button>
            </div>

            {!scannedData ? (
                <div className="flex flex-col items-center justify-center space-y-6">
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full max-w-md h-64 border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-mint hover:bg-mint/5 transition-colors relative overflow-hidden"
                    >
                        {selectedImage ? (
                            <img src={selectedImage} alt="Preview" className="w-full h-full object-contain" />
                        ) : (
                            <>
                                <Upload className="text-gray-400 w-12 h-12 mb-2" />
                                <p className="text-gray-500 font-medium">Cliquez pour ajouter une photo</p>
                                <p className="text-gray-400 text-xs">JPG, PNG supportés</p>
                            </>
                        )}
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                    </div>

                    {selectedImage && (
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
                <div className="space-y-6">
                    <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex items-start gap-3">
                        <Check className="text-green-600 w-5 h-5 mt-0.5" />
                        <div>
                            <p className="text-green-800 font-medium">Analyse terminée !</p>
                            <p className="text-green-600 text-sm">Les produits suivants seront ajoutés à votre stock.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-3 bg-gray-50 rounded-xl">
                            <span className="text-xs text-gray-500">Magasin</span>
                            <p className="font-bold text-gray-800">{scannedData.store}</p>
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
                            <span className="text-xs text-gray-500">Produits</span>
                            <p className="font-bold text-gray-800">{scannedData.items.length}</p>
                        </div>
                    </div>

                    <div className="border border-gray-100 rounded-xl overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                                <tr>
                                    <th className="px-4 py-3">Produit</th>
                                    <th className="px-4 py-3">Qté</th>
                                    <th className="px-4 py-3 text-right">Prix</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {scannedData.items.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50/50">
                                        <td className="px-4 py-3 text-sm font-medium text-gray-800">{item.name}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{item.quantity} {item.unit}</td>
                                        <td className="px-4 py-3 text-sm text-gray-800 text-right">{item.price} €</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex gap-3 justify-end">
                        <button 
                            onClick={() => setScannedData(null)}
                            className="px-6 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 font-medium"
                        >
                            Recommencer
                        </button>
                        <button 
                            onClick={handleSave}
                            className="px-6 py-3 bg-mint text-white rounded-xl hover:bg-teal-400 font-medium shadow-lg shadow-mint/20"
                        >
                            Valider et Ajouter au Stock
                        </button>
                    </div>
                </div>
            )}
        </div>
      )}

      {/* Liste Historique */}
      <div className="grid gap-4">
        {tickets.map((ticket) => (
            <div key={ticket.id} className="bg-white p-5 rounded-2xl shadow-soft border border-gray-100 hover:border-gray-200 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                        <Receipt size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900">{ticket.store}</h3>
                        <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                            <span className="flex items-center gap-1"><Calendar size={14} /> {ticket.date}</span>
                            <span className="flex items-center gap-1"><ShoppingBag size={14} /> {ticket.items.length} articles</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto">
                    <div className="text-right">
                         <p className="text-xs text-gray-400 mb-0.5">Total</p>
                         <p className="text-lg font-bold text-gray-900 flex items-center gap-1">
                            {ticket.total} <Euro size={14} />
                         </p>
                    </div>
                    <button 
                        onClick={() => setSelectedTicket(ticket)}
                        className="px-4 py-2 text-sm font-medium text-aqua bg-aqua/10 rounded-lg hover:bg-aqua/20 transition-colors"
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

      {/* Ticket Details Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setSelectedTicket(null)}></div>
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl relative z-10 overflow-hidden animate-slide-up max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{selectedTicket.store}</h2>
                        <p className="text-sm text-gray-500">{selectedTicket.date}</p>
                    </div>
                    <button onClick={() => setSelectedTicket(null)} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 bg-mint/5 rounded-xl border border-mint/10">
                            <span className="font-medium text-gray-700">Total payé</span>
                            <span className="text-2xl font-bold text-aqua">{selectedTicket.total} €</span>
                        </div>

                        <div>
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Articles ({selectedTicket.items.length})</h3>
                            <div className="space-y-2">
                                {selectedTicket.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded bg-white flex items-center justify-center text-xs shadow-sm">
                                                {item.category === 'Frais' ? '🥛' : item.category === 'Légumes' ? '🥦' : '📦'}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                                                <p className="text-xs text-gray-500">{item.quantity} {item.unit} • {item.category}</p>
                                            </div>
                                        </div>
                                        <span className="font-medium text-gray-600 text-sm">{item.price ? `${item.price} €` : '-'}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                     <button 
                        onClick={() => setSelectedTicket(null)}
                        className="w-full py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
                    >
                        Fermer
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Tickets;