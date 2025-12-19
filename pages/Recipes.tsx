
import React, { useState, useEffect } from 'react';
import { ChefHat, Clock, Flame, Wand2, Loader2, Sparkles, X, CircleCheck, PlayCircle, ArrowRight, Coffee, UtensilsCrossed, Cookie, Moon } from 'lucide-react';
import { supabase } from '../services/mockSupabase';
import { generateRecipeWithGemini } from '../services/geminiService';
import { Recipe, User } from '../types';

const MOMENTS = [
    { id: 'breakfast', label: 'Petit-déjeuner', icon: Coffee, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', theme: 'Énergie Ambrée' },
    { id: 'lunch', label: 'Déjeuner', icon: UtensilsCrossed, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', theme: 'Clarté Bleutée' },
    { id: 'snack', label: 'Goûter', icon: Cookie, color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-100', theme: 'Douceur Miel' },
    { id: 'dinner', label: 'Dîner', icon: Moon, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', theme: 'Calme Indigo' }
];

const RecipeCard: React.FC<{ recipe: Recipe; onClick: () => void }> = ({ recipe, onClick }) => {
    // On essaie de deviner le moment si c'est une recette IA
    const moment = MOMENTS.find(m => recipe.description.toLowerCase().includes(m.id) || recipe.title.toLowerCase().includes(m.id)) || MOMENTS[1];

    return (
        <div 
            onClick={onClick}
            className="bg-white rounded-3xl overflow-hidden shadow-soft border border-gray-100 group hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col h-full relative"
        >
            <div className="relative h-52 overflow-hidden shrink-0">
                <img 
                    src={recipe.imageUrl || `https://picsum.photos/seed/${recipe.id}/600/400`} 
                    alt={recipe.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                    {recipe.isAiGenerated && (
                        <div className="bg-white/90 backdrop-blur text-gray-800 text-[10px] font-black uppercase px-3 py-1 rounded-full flex items-center gap-1 shadow-sm border border-gray-100">
                            <Wand2 size={12} className="text-mint" /> IA Générée
                        </div>
                    )}
                    <div className={`${moment.bg} ${moment.color} ${moment.border} border text-[10px] font-black uppercase px-3 py-1 rounded-full flex items-center gap-1 shadow-sm`}>
                        <moment.icon size={12} /> {moment.theme}
                    </div>
                </div>
            </div>
            <div className="p-6 flex flex-col flex-1">
                <h3 className="text-xl font-bold font-display text-gray-900 mb-2 group-hover:text-mint transition-colors">{recipe.title}</h3>
                <p className="text-gray-500 text-sm mb-6 line-clamp-3 leading-relaxed">{recipe.description}</p>
                
                <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs font-bold text-gray-400">
                        <div className="flex items-center gap-1">
                            <Clock size={14} /> <span>{recipe.prepTime}</span>
                        </div>
                        {recipe.calories && (
                            <div className="flex items-center gap-1">
                                <Flame size={14} className="text-orange-400" /> <span>{recipe.calories} kcal</span>
                            </div>
                        )}
                    </div>
                    <div className="p-2 bg-gray-50 rounded-xl group-hover:bg-mint group-hover:text-white transition-all">
                        <ArrowRight size={16} />
                    </div>
                </div>
            </div>
        </div>
    );
};

const RecipeModal = ({ recipe, onClose }: { recipe: Recipe; onClose: () => void }) => {
    if (!recipe) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose}></div>
            <div className="bg-white rounded-[2.5rem] w-full max-w-3xl shadow-2xl relative z-10 overflow-hidden animate-slide-up max-h-[90vh] flex flex-col">
                <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-white/80 backdrop-blur rounded-full hover:bg-white text-gray-500 hover:text-gray-800 z-20 transition-colors shadow-sm">
                    <X size={24} />
                </button>

                <div className="relative h-72 shrink-0">
                    <img src={recipe.imageUrl || "https://picsum.photos/800/600"} className="w-full h-full object-cover" alt={recipe.title} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                    <div className="absolute bottom-8 left-8 right-8">
                         <h2 className="text-3xl font-display font-bold text-white mb-2 leading-tight">{recipe.title}</h2>
                         <div className="flex gap-4">
                             <span className="bg-white/20 backdrop-blur text-white px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-2">
                                <Clock size={14} /> {recipe.prepTime}
                             </span>
                             {recipe.calories && (
                                 <span className="bg-white/20 backdrop-blur text-white px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-2">
                                    <Flame size={14} /> {recipe.calories} kcal
                                 </span>
                             )}
                         </div>
                    </div>
                </div>

                <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
                    <div className="grid md:grid-cols-5 gap-10">
                        <div className="md:col-span-2 space-y-8">
                            <div>
                                <h3 className="text-xs font-black uppercase text-mint tracking-[0.2em] mb-4">Ingrédients</h3>
                                <ul className="space-y-4">
                                    {recipe.ingredients.map((ing, i) => (
                                        <li key={i} className="flex items-start gap-3 text-sm text-gray-700 font-medium">
                                            <div className="w-1.5 h-1.5 bg-mint rounded-full mt-1.5 shrink-0" />
                                            {ing}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                        <div className="md:col-span-3 space-y-8">
                            <div>
                                <h3 className="text-xs font-black uppercase text-aqua tracking-[0.2em] mb-4">Préparation</h3>
                                <div className="space-y-6">
                                    {recipe.steps.map((step, i) => (
                                        <div key={i} className="flex gap-4">
                                            <span className="text-2xl font-display font-bold text-gray-100 leading-none">{String(i+1).padStart(2, '0')}</span>
                                            <p className="text-sm text-gray-600 leading-relaxed pt-1">{step}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-12 p-6 bg-gray-50 rounded-3xl border border-gray-100">
                        <p className="text-sm text-gray-500 italic leading-relaxed">
                            <Sparkles className="inline-block mr-2 text-mint" size={16} />
                            {recipe.description}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Recipes = () => {
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedMoment, setSelectedMoment] = useState('lunch');
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const u = await supabase.getUser();
        setUser(u);
        const initialRecipes = await supabase.generateRecipesFromStock(u?.diet || 'Standard');
        setRecipes(initialRecipes);
    };

    const handleGenerate = async () => {
        setLoading(true);
        const stock = await supabase.getStock();
        const res = await generateRecipeWithGemini(stock, user || {}, selectedMoment);
        if (res) {
            setRecipes(prev => [res, ...prev]);
            setSelectedRecipe(res);
        }
        setLoading(false);
    };

    return (
        <div className="space-y-10 animate-fade-in pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                <div>
                    <h1 className="text-4xl font-display font-bold text-gray-900">Cuisine Bien-être</h1>
                    <p className="text-gray-500 mt-2">Générez des recettes intelligentes basées sur vos cycles biologiques et votre stock.</p>
                </div>
                <div className="bg-white p-2 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap gap-2">
                    {MOMENTS.map(m => (
                        <button
                            key={m.id}
                            onClick={() => setSelectedMoment(m.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${
                                selectedMoment === m.id 
                                ? `${m.bg} ${m.color} shadow-sm border ${m.border}` 
                                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            <m.icon size={16} /> {m.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* AI Generator CTA */}
            <div className={`relative overflow-hidden rounded-[2.5rem] p-10 text-white shadow-2xl transition-all duration-500 ${MOMENTS.find(m => m.id === selectedMoment)?.bg.replace('bg-', 'bg-').replace('-50', '-500') || 'bg-gray-900'}`}>
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                    <div className="flex-1 text-center md:text-left">
                        <h2 className="text-3xl font-display font-bold mb-3">Besoin d'inspiration pour votre {MOMENTS.find(m => m.id === selectedMoment)?.label} ?</h2>
                        <p className="text-white/80 max-w-lg leading-relaxed">
                            L'IA va composer une recette {MOMENTS.find(m => m.id === selectedMoment)?.theme.toLowerCase()} en utilisant prioritairement vos produits qui périment bientôt.
                        </p>
                    </div>
                    <button 
                        onClick={handleGenerate}
                        disabled={loading}
                        className="bg-white text-gray-900 px-8 py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : <Wand2 size={20} />}
                        Générer la recette
                    </button>
                </div>
                {/* Background Decor */}
                <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute -left-10 -top-10 w-48 h-48 bg-black/10 rounded-full blur-2xl" />
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {recipes.map(recipe => (
                    <RecipeCard key={recipe.id} recipe={recipe} onClick={() => setSelectedRecipe(recipe)} />
                ))}
            </div>

            {selectedRecipe && <RecipeModal recipe={selectedRecipe} onClose={() => setSelectedRecipe(null)} />}
        </div>
    );
};

export default Recipes;
