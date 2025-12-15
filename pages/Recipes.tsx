import React, { useState } from 'react';
import { ChefHat, Clock, Flame, Wand2, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '../services/mockSupabase';
import { generateRecipeWithGemini } from '../services/geminiService';
import { Recipe } from '../types';

const RecipeCard = ({ recipe }: { recipe: Recipe }) => (
  <div className="bg-white rounded-2xl overflow-hidden shadow-soft border border-gray-100 group hover:-translate-y-1 transition-all duration-300">
    <div className="relative h-48 overflow-hidden">
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
    <div className="p-5">
      <h3 className="text-xl font-bold font-display text-gray-900 mb-2">{recipe.title}</h3>
      <p className="text-gray-500 text-sm mb-4 line-clamp-2">{recipe.description}</p>
      
      <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
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
            <span key={idx} className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded-md border border-gray-100">
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
);

const Recipes = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [userDiet, setUserDiet] = useState<string>('');

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
    <div className="space-y-8 animate-fade-in">
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
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))
        )}
      </div>
    </div>
  );
};

export default Recipes;