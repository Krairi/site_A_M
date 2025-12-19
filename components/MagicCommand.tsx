
import React, { useState, useEffect } from 'react';
import { Send, Mic, X, Loader2, MessageSquare, MicOff } from 'lucide-react';
import { processNaturalLanguageCommand } from '../services/geminiService';
import { supabase } from '../services/mockSupabase';
import Logo from './Logo';

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

const MagicCommand = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [responseMsg, setResponseMsg] = useState<{type: 'success' | 'error', text: string} | null>(null);
  
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognitionInstance = new SpeechRecognition();
            recognitionInstance.continuous = false;
            recognitionInstance.lang = 'fr-FR';
            recognitionInstance.interimResults = false;
            
            recognitionInstance.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setInput(transcript);
                setIsListening(false);
            };
            
            recognitionInstance.onerror = (event: any) => {
                console.error("Speech error", event.error);
                setIsListening(false);
            };

            recognitionInstance.onend = () => {
                setIsListening(false);
            };

            setRecognition(recognitionInstance);
        }
    }
  }, []);

  const toggleListening = () => {
      if (!recognition) {
          setResponseMsg({ type: 'error', text: "Reconnaissance vocale non supportée." });
          return;
      }

      if (isListening) {
          recognition.stop();
          setIsListening(false);
      } else {
          setResponseMsg(null);
          recognition.start();
          setIsListening(true);
      }
  };

  const handleCommand = async (e: React.FormEvent, overrideInput?: string) => {
    e.preventDefault();
    const commandText = overrideInput || input;
    if (!commandText.trim()) return;

    setLoading(true);
    setResponseMsg(null);

    try {
        const actions = await processNaturalLanguageCommand(commandText);
        
        if (actions && actions.length > 0) {
            let successCount = 0;
            const currentStock = await supabase.getStock();

            for (const action of actions) {
                const existing = currentStock.find(p => p.name.toLowerCase().includes(action.item.toLowerCase()));
                
                if (existing) {
                    let newQty = existing.quantity;
                    if (action.action === 'add') newQty += action.quantity;
                    if (action.action === 'remove') newQty = Math.max(0, newQty - action.quantity);
                    if (action.action === 'update') newQty = action.quantity;

                    await supabase.updateProduct({ id: existing.id, quantity: newQty });
                    successCount++;
                } else if (action.action === 'add') {
                    await supabase.addProduct({
                        name: action.item.charAt(0).toUpperCase() + action.item.slice(1),
                        quantity: action.quantity,
                        unit: action.unit || 'pcs',
                        category: 'Autre',
                        minThreshold: 1
                    });
                    successCount++;
                }
            }

            setResponseMsg({ type: 'success', text: `J'ai traité ${successCount} action(s) !` });
            setInput('');
            window.dispatchEvent(new Event('givd-update'));
            
            setTimeout(() => {
                setResponseMsg(null);
                setIsOpen(false);
            }, 2500);
        } else {
            setResponseMsg({ type: 'error', text: "Commande non comprise." });
        }
    } catch (error) {
        setResponseMsg({ type: 'error', text: "Une erreur est survenue." });
    } finally {
        setLoading(false);
    }
  };

  return (
    <>
        <button 
            onClick={() => setIsOpen(true)}
            className={`fixed bottom-6 right-6 z-50 p-2.5 rounded-full shadow-glow transition-all duration-300 hover:scale-110 active:scale-95 bg-white border border-gray-100 ${isOpen ? 'rotate-90 scale-0 opacity-0' : 'scale-100 opacity-100'}`}
            title="Assistant Domy"
        >
            <Logo showText={false} size="md" />
        </button>

        {isOpen && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6">
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setIsOpen(false)} />
                
                <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-slide-up flex flex-col">
                    <div className="p-6 bg-gradient-to-r from-mint/10 to-aqua/10 border-b border-gray-100 flex justify-between items-center">
                        <Logo size="sm" />
                        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-white/50 transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-6 space-y-4">
                        {responseMsg && (
                            <div className={`p-4 rounded-2xl text-sm font-bold flex items-center gap-3 animate-fade-in ${responseMsg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                                <Logo showText={false} size="xs" />
                                {responseMsg.text}
                            </div>
                        )}

                        {!responseMsg && (
                            <div className="space-y-2">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 mt-1">
                                        <MessageSquare size={14} className="text-gray-400" />
                                    </div>
                                    <div className="bg-gray-50 rounded-2xl rounded-tl-none p-4 text-sm text-gray-600 border border-gray-100/50">
                                        Bonjour ! Je suis <Logo inline size="xs" className="mx-1" />. <br/>
                                        Dites-moi : <span className="font-medium text-gray-800 italic mt-1 block">"Ajoute 1kg de riz et enlève 2 œufs."</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleCommand} className="relative mt-2">
                            <input 
                                type="text" 
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={isListening ? "Écoute en cours..." : "Votre commande..."}
                                className={`w-full pl-6 pr-14 py-5 bg-white border rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint transition-all text-gray-800 placeholder-gray-400 font-medium ${isListening ? 'border-mint ring-2 ring-mint/10' : 'border-gray-200'}`}
                                autoFocus
                            />
                            <button 
                                type="submit" 
                                disabled={loading || !input.trim()}
                                className="absolute right-3 top-3 bottom-3 aspect-square bg-gray-900 text-white rounded-xl flex items-center justify-center hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
                            >
                                {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                            </button>
                        </form>
                        
                        <div className="flex justify-center">
                            <button 
                                type="button" 
                                onClick={toggleListening}
                                className={`text-xs flex items-center gap-2 transition-all px-4 py-2 rounded-full border ${isListening ? 'bg-red-50 text-red-500 border-red-100 animate-pulse font-bold' : 'text-gray-400 hover:text-mint hover:bg-mint/5 border-transparent'}`}
                            >
                                {isListening ? <MicOff size={14} /> : <Mic size={14} />} 
                                {isListening ? "Arrêter" : "Utiliser la voix"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </>
  );
};

export default MagicCommand;
