
import React, { useState, useEffect, useRef } from 'react';
import { Receipt, Plus, Loader2, Check, ShoppingBag, Calendar, X, Trash2, Camera, Upload, FileText, Sparkles, AlertCircle, Wand2, ArrowRight, Image as ImageIcon } from 'lucide-react';
import { supabase, Ticket } from '../services/mockSupabase';
import { parseReceiptWithGemini, ScannedReceipt } from '../services/geminiService';
import { User } from '../types';
import CameraCapture from '../components/CameraCapture';

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

const Tickets = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [scannedData, setScannedData] = useState<ScannedReceipt | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadTickets();
    loadUser();
    const handleUpdate = () => loadTickets();
    window.addEventListener('givd-update', handleUpdate);
    return () => window.removeEventListener('givd-update', handleUpdate);
  }, []);

  const loadTickets = async () => {
    const data = await supabase.getTickets();
    setTickets(data);
  };

  const loadUser = async () => {
      const u = await supabase.getUser();
      setUser(u);
  }

  const handleCapture = async (base64: string) => {
    setIsCameraActive(false);
    setPreviewImage(base64);
    setIsScanModalOpen(true);
    setAnalyzing(true);
    try {
      const result = await parseReceiptWithGemini(base64, user || undefined);
      if (result) {
        setScannedData(result);
      } else {
        alert("L'analyse a échoué. Essayez une photo plus nette.");
        setIsScanModalOpen(false);
      }
    } catch (err) {
      console.error("Erreur Scan:", err);
      alert("Erreur lors de l'analyse.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      handleCapture(reader.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const confirmAndSave = async () => {
      if (!scannedData || !previewImage) return;
      setSaving(true);
      try {
          await supabase.saveTicket(scannedData, previewImage);
          loadTickets();
          closeModal();
          window.dispatchEvent(new Event('givd-update'));
      } catch (err) {
          console.error("Save Error:", err);
      } finally {
          setSaving(false);
      }
  };

  const closeModal = () => {
      setIsScanModalOpen(false);
      setPreviewImage(null);
      setScannedData(null);
      setAnalyzing(false);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-24 relative">
      {isCameraActive && (
        <CameraCapture 
          onCapture={handleCapture} 
          onClose={() => setIsCameraActive(false)} 
          title="Scanner un ticket" 
        />
      )}

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-display font-bold text-gray-900">Mes Tickets</h1>
          <p className="text-gray-500 text-sm mt-1">Numérisation intelligente et historique.</p>
        </div>
        <div className="bg-mint/10 text-mint px-4 py-2 rounded-2xl font-bold text-sm border border-mint/20 flex items-center gap-2">
           <Receipt size={16} /> {tickets.length} enregistrés
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="relative group cursor-pointer" onClick={() => setIsCameraActive(true)}>
              <div className="flex flex-col items-center justify-center p-12 bg-white border-2 border-dashed border-mint/20 rounded-[2.5rem] hover:bg-mint/5 hover:border-mint/40 transition-all shadow-sm active:scale-[0.98]">
                <div className="w-16 h-16 bg-mint/10 text-mint rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 shadow-sm">
                    <Camera size={32} />
                </div>
                <span className="font-bold text-gray-800 text-lg">Prendre une photo</span>
              </div>
          </div>

          <div className="relative group cursor-pointer" onClick={() => imageInputRef.current?.click()}>
              <input type="file" accept="image/*" className="hidden" ref={imageInputRef} onChange={handleFileImport} />
              <div className="flex flex-col items-center justify-center p-12 bg-white border-2 border-dashed border-aqua/20 rounded-[2.5rem] hover:bg-aqua/5 hover:border-aqua/40 transition-all shadow-sm active:scale-[0.98]">
                <div className="w-16 h-16 bg-aqua/10 text-aqua rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 shadow-sm">
                    <ImageIcon size={32} />
                </div>
                <span className="font-bold text-gray-800 text-lg">Importer Image</span>
              </div>
          </div>

          <div className="relative group cursor-pointer" onClick={() => pdfInputRef.current?.click()}>
              <input type="file" accept="application/pdf" className="hidden" ref={pdfInputRef} onChange={handleFileImport} />
              <div className="flex flex-col items-center justify-center p-12 bg-white border-2 border-dashed border-gray-100 rounded-[2.5rem] hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm active:scale-[0.98]">
                <div className="w-16 h-16 bg-gray-900 text-white rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 shadow-sm">
                    <FileText size={32} />
                </div>
                <span className="font-bold text-gray-800 text-lg">Fichier PDF</span>
              </div>
          </div>
      </div>

      {/* History List */}
      <div className="space-y-4 mt-12">
        <h2 className="text-xl font-bold text-gray-800 px-2 font-display">Historique récent</h2>
        {tickets.length > 0 ? (
          tickets.map((ticket) => (
            <div 
              key={ticket.id} 
              onClick={() => setSelectedTicket(ticket)}
              className="bg-white p-6 rounded-[2.5rem] shadow-soft border border-gray-100 flex items-center justify-between group cursor-pointer transition-all hover:border-mint/30 hover:shadow-lg"
            >
                <div className="flex items-center gap-6 pl-2">
                    <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-300 border border-gray-100 group-hover:bg-mint/10 transition-colors overflow-hidden">
                        {ticket.image_url ? (
                            <img src={ticket.image_url} className="w-full h-full object-cover" alt="Ticket" />
                        ) : (
                            <Receipt size={32} />
                        )}
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 text-xl uppercase tracking-tight">{ticket.store}</h3>
                        <div className="flex items-center gap-4 text-xs text-gray-400 font-bold mt-1.5">
                            <span className="flex items-center gap-1.5"><Calendar size={14} /> {ticket.date}</span>
                        </div>
                    </div>
                </div>
                <div className="text-right pr-6">
                    <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">TOTAL</p>
                    <p className="text-4xl font-display font-bold text-gray-900">{ticket.total.toFixed(2)}€</p>
                </div>
            </div>
          ))
        ) : (
          <div className="p-20 text-center bg-white rounded-[3rem] border border-dashed border-gray-200 text-gray-400">
             <Receipt size={48} className="mx-auto mb-4 opacity-10" />
             <p className="font-medium">Aucun ticket pour le moment.</p>
          </div>
        )}
      </div>

      {/* Scan & Preview Modal */}
      {isScanModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal}></div>
              <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl relative z-10 overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
                  
                  <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-white">
                      <div className="flex items-center gap-5">
                          <div className="p-4 bg-mint/10 rounded-2xl text-mint">
                              <Sparkles size={32} />
                          </div>
                          <div>
                              <h2 className="text-2xl font-display font-bold text-gray-900">Analyse IA</h2>
                              <p className="text-sm text-gray-400 mt-1">Extraction des données...</p>
                          </div>
                      </div>
                      <button onClick={closeModal} className="text-gray-300 hover:text-gray-600 transition-colors">
                          <X size={32} />
                      </button>
                  </div>

                  <div className="p-10 bg-white flex-1 overflow-y-auto custom-scrollbar">
                      {analyzing ? (
                          <div className="flex flex-col items-center justify-center py-20">
                              <Loader2 className="animate-spin text-mint w-24 h-24 mb-6" />
                              <h3 className="text-3xl font-display font-bold text-gray-900">Déchiffrement...</h3>
                          </div>
                      ) : scannedData ? (
                          <div className="space-y-6">
                              {previewImage && (
                                  <div className="relative h-48 w-full rounded-[2rem] overflow-hidden mb-6 border border-gray-100 shadow-sm">
                                      <img src={previewImage} alt="Aperçu" className="w-full h-full object-cover" />
                                  </div>
                              )}
                              <div className="flex justify-between items-center p-8 bg-gray-900 text-white rounded-[2.5rem] shadow-xl">
                                  <div>
                                      <p className="text-[10px] text-mint uppercase font-black mb-1">{scannedData.store}</p>
                                      <p className="text-2xl font-bold font-display">{scannedData.date}</p>
                                  </div>
                                  <div className="text-right">
                                      <p className="text-4xl font-display font-bold text-mint">{scannedData.total.toFixed(2)}€</p>
                                  </div>
                              </div>
                              <div className="space-y-3">
                                {scannedData.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-4 bg-gray-50 border border-gray-100 rounded-2xl">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-xl">
                                                {getCategoryIcon(item.category)}
                                            </div>
                                            <p className="font-bold text-gray-800 text-sm">{item.name}</p>
                                        </div>
                                        <span className="font-bold text-gray-900">{item.price.toFixed(2)}€</span>
                                    </div>
                                ))}
                              </div>
                              <div className="flex gap-4 pt-6">
                                <button onClick={closeModal} className="flex-1 py-5 bg-white border border-gray-200 text-gray-600 font-bold rounded-2xl">Annuler</button>
                                <button onClick={confirmAndSave} disabled={saving} className="flex-[2] py-5 bg-mint text-white font-bold rounded-2xl shadow-xl flex items-center justify-center gap-3">
                                    {saving ? <Loader2 className="animate-spin" /> : <Check />} Enregistrer
                                </button>
                              </div>
                          </div>
                      ) : null}
                  </div>
              </div>
          </div>
      )}

      {/* Detail Modal */}
      {selectedTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedTicket(null)}></div>
              <div className="bg-white rounded-[3.5rem] w-full max-w-2xl shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="p-10 border-b border-gray-100 flex justify-between items-center">
                      <h2 className="text-3xl font-display font-bold text-gray-900 uppercase">{selectedTicket.store}</h2>
                      <button onClick={() => setSelectedTicket(null)} className="p-4 text-gray-300 hover:text-gray-600">
                          <X size={32} />
                      </button>
                  </div>
                  <div className="p-10 overflow-y-auto flex-1">
                      {selectedTicket.items?.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between p-5 bg-gray-50 border border-gray-100 rounded-[2rem] mb-4">
                              <div className="flex items-center gap-5">
                                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-2xl">{getCategoryIcon(item.category)}</div>
                                  <div>
                                      <p className="font-bold text-gray-800 text-lg">{item.name}</p>
                                      <p className="text-xs text-gray-400 font-bold uppercase">{item.quantity} {item.unit}</p>
                                  </div>
                              </div>
                              <p className="font-display font-bold text-2xl text-gray-900">{item.price.toFixed(2)}€</p>
                          </div>
                      ))}
                  </div>
                  <div className="p-10 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center">
                      <p className="text-5xl font-display font-bold text-gray-900">{selectedTicket.total.toFixed(2)}€</p>
                      <button onClick={() => { if(window.confirm("Supprimer ?")) { supabase.deleteTicket(selectedTicket.id); setSelectedTicket(null); loadTickets(); } }} className="text-red-500 font-bold hover:bg-red-50 px-8 py-5 rounded-3xl transition-all">
                        <Trash2 size={24} />
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Tickets;
