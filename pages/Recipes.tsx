import React, { useState } from 'react';
import { ChefHat, Clock, Flame, Wand2, Loader2, Sparkles, X, CheckCircle2 } from 'lucide-react';
import { supabase } from '../services/mockSupabase';
import { generateRecipeWithGemini } from '../services/geminiService';
import { Recipe } from '../types';

const RecipeCard = ({ recipe, onClick }: { recipe: Recipe; onClick: () => void }) => (
  <div 
    onClick={onClick}
    className="bg-white rounded-2xl overflow-hidden shadow-soft border border-gray-100 group hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col h-full relative"
  >
    <div className="relative h-48 overflow-hidden shrink-0">
      <img 
        src={recipe.imageUrl || "https://picsum.photos/400/300"} 
        alt={recipe.title} 
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
      />
      {recipe.isAiGenerated && (
        <div className="absolute top-3 left-3 bg-mint/90 backdrop-blur text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
          <Wand2 size={12} /> IA Création
        </div>
      )}
    </div>
    <div className="p-5 flex flex-col flex-1">
      <h3 className="text-xl font-bold font-display text-gray-900 mb-2 group-hover:text-mint transition-colors">{recipe.title}</h3>
      <p className="text-gray-500 text-sm mb-4 line-clamp-2">{recipe.description}</p>
      
      <div className="mt-auto">
        <div className="flex items-center gap-4 text-sm text-gray-400 mb-4 border-t border-gray-50 pt-4">
            <div className="flex items-center gap-1">
            <Clock size={16} />
            <span>{recipe.prepTime}</span>
            </div>
            {recipe.calories && (
            <div className="flex items-center gap-1">
                <Flame size={16} />
                <span>{recipe.calories} kcal</span>
            </div>
            )}
        </div>

        <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Ingrédients clés</p>
            <div className="flex flex-wrap gap-2">
            {recipe.ingredients.slice(0, 3).map((ing, idx) => (
                <span key={idx} className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded-md border border-gray-100 truncate max-w-[150px]">
                {ing}
                </span>
            ))}
            {recipe.ingredients.length > 3 && (
                <span className="px-2 py-1 bg-gray-50 text-gray-400 text-xs rounded-md border border-gray-100">
                +{recipe.ingredients.length - 3}
                </span>
            )}
            </div>
        </div>
      </div>
    </div>
  </div>
);

const RecipeModal = ({ recipe, onClose }: { recipe: Recipe; onClose: () => void }) => {
  if (!recipe) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-fade-in" onClick={onClose}></div>
      <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl relative z-10 overflow-hidden animate-slide-up max-h-[90vh] flex flex-col">
         {/* Close Button */}
         <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur rounded-full hover:bg-white text-gray-500 hover:text-gray-800 z-20 transition-colors shadow-sm">
            <X size={20} />
         </button>

         {/* Header Image */}
         <div className="relative h-64 sm:h-80 shrink-0">
            <img src={recipe.imageUrl || "https://picsum.photos/800/600"} className="w-full h-full object-cover" alt={recipe.title} />
             {recipe.isAiGenerated && (
                <div className="absolute top-4 left-4 bg-mint/90 backdrop-blur text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                  <Wand2 size={12} /> IA Création
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/60 to-transparent"></div>
              <h2 className="absolute bottom-6 left-6 right-6 text-3xl font-display font-bold text-white leading-tight drop-shadow-sm">{recipe.title}</h2>
         </div>

         {/* Content Scrollable */}
         <div className="p-6 sm:p-8 overflow-y-auto flex-1 custom-scrollbar">
            <p className="text-gray-600 mb-8 text-lg leading-relaxed">{recipe.description}</p>

            <div className="flex flex-wrap gap-6 mb-8 pb-8 border-b border-gray-100">
                <div className="flex items-center gap-2 text-gray-700 font-medium bg-gray-50 px-4 py-2 rounded-xl">
                    <Clock className="text-aqua" size={20} /> 
                    <span className="text-sm">Préparation : {recipe.prepTime}</span>
                </div>
                {recipe.calories && (
                    <div className="flex items-center gap-2 text-gray-700 font-medium bg-gray-50 px-4 py-2 rounded-xl">
                        <Flame className="text-honey" size={20} /> 
                        <span className="text-sm">{recipe.calories} calories</span>
                    </div>
                )}
            </div>

            <div className="grid md:grid-cols-2 gap-8 md:gap-12">
                <div>
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-lg">
                        <span className="w-8 h-8 rounded-lg bg-mint/10 text-mint flex items-center justify-center">
                            <ChefHat size={18} />
                        </span>
                        Ingrédients
                    </h3>
                    <ul className="space-y-3">
                        {recipe.ingredients.map((ing, i) => (
                            <li key={i} className="flex items-start gap-3 text-gray-600 text-sm group">
                                <span className="w-1.5 h-1.5 bg-mint rounded-full mt-2 shrink-0 group-hover:scale-125 transition-transform"></span>
                                <span className="leading-relaxed">{ing}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <div>
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-lg">
                        <span className="w-8 h-8 rounded-lg bg-aqua/10 text-aqua flex items-center justify-center">
                            <CheckCircle2 size={18} />
                        </span>
                        Préparation
                    </h3>
                     <div className="space-y-6">
                        {recipe.steps.map((step, i) => (
                            <div key={i} className="relative pl-8 border-l-2 border-gray-100 pb-1 last:border-0 last:pb-0">
                                <span className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-aqua text-[10px] font-bold text-aqua flex items-center justify-center">
                                    {i + 1}
                                </span>
                                <p className="text-sm text-gray-600 leading-relaxed">{step}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
         </div>
      </div>
    </div>
  );
}

const Recipes = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [userDiet, setUserDiet] = useState<string>('');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  // Initial load
  React.useEffect(() => {
    const init = async () => {
        const user = await supabase.getUser();
        const diet = user?.diet || '';
        setUserDiet(diet);
        
        // Load initial recipes using user preference
        const data = await supabase.generateRecipesFromStock(diet);
        setRecipes(data);
    };
    init();
  }, []);

  const handleGenerateAI = async () => {
    setLoading(true);
    const stock = await supabase.getStock();
    
    // Use user's diet preference
    const preferences = userDiet && userDiet !== 'Aucun' ? userDiet : "Equilibré";
    
    // Simulate real AI call or Mock
    const newRecipe = await generateRecipeWithGemini(stock, preferences);
    
    if (newRecipe) {
        setRecipes(prev => [newRecipe, ...prev]);
    } else {
        // Fallback if no API Key provided in env
        const mockRecipes = await supabase.generateRecipesFromStock(preferences);
        setRecipes(prev => [...mockRecipes, ...prev]);
    }
    
    setLoading(false);
    setGenerated(true);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900">Cuisine & Recettes</h1>
          <p className="text-gray-500 mt-1">
            {userDiet && userDiet !== 'Aucun' 
              ? `Suggestions adaptées à votre régime : ${userDiet}`
              : "Des idées basées sur votre stock actuel."}
          </p>
        </div>
        <button 
          onClick={handleGenerateAI}
          disabled={loading}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-mint to-teal-400 text-white px-6 py-3 rounded-xl font-semibold shadow-glow hover:shadow-lg transition-all transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : <Wand2 size={20} />}
          <span>Générer avec l'IA</span>
        </button>
      </div>

      {generated && (
        <div className="p-4 bg-mint/10 border border-mint/20 rounded-xl text-teal-700 text-sm flex items-center gap-2 animate-pulse">
          <Sparkles className="w-4 h-4" /> Recettes générées basées sur votre stock {userDiet && userDiet !== 'Aucun' && `et votre régime ${userDiet}`}.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && recipes.length === 0 ? (
           [1,2,3].map(i => (
             <div key={i} className="h-96 bg-gray-100 rounded-2xl animate-pulse" />
           ))
        ) : (
          recipes.map(recipe => (
            <RecipeCard key={recipe.id} recipe={recipe} onClick={() => setSelectedRecipe(recipe)} />
          ))
        )}
      </div>

      {/* Recipe Modal */}
      {selectedRecipe && (
        <RecipeModal recipe={selectedRecipe} onClose={() => setSelectedRecipe(null)} />
      )}
    </div>
  );
};

export default Recipes;