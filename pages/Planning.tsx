
import React, { useEffect, useState } from 'react';
import { CalendarRange, Plus, Trash2, ChefHat, ArrowLeft, ArrowRight, Coffee, UtensilsCrossed, Cookie, Moon, Loader2, Sparkles, Wand2, X } from 'lucide-react';
import { supabase } from '../services/mockSupabase';
import { Recipe, MealPlan, User } from '../types';
import { generateRecipeWithGemini } from '../services/geminiService';

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

const MEAL_TYPES = [
    { id: 'breakfast', label: 'Petit-déjeuner', icon: Coffee, color: 'bg-amber-50 text-amber-600 border-amber-100' },
    { id: 'lunch', label: 'Déjeuner', icon: UtensilsCrossed, color: 'bg-blue-50 text-blue-600 border-blue-100' },
    { id: 'snack', label: 'Goûter', icon: Cookie, color: 'bg-honey/10 text-honey border-honey/20' },
    { id: 'dinner', label: 'Dîner', icon: Moon, color: 'bg-indigo-50 text-indigo-600 border-indigo-100' }
] as const;

const Planning = () => {
    const [currentWeekStart, setCurrentWeekStart] = useState(new Date());
    const [plans, setPlans] = useState<MealPlan[]>([]);
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [user, setUser] = useState<User | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<{date: string, type: MealPlan['type']} | null>(null);

    const getMonday = (d: Date) => {
        d = new Date(d);
        const day = d.getDay(),
        diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d.setDate(diff));
        monday.setHours(0,0,0,0);
        return monday;
    }

    const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    const weekStart = getMonday(currentWeekStart);

    useEffect(() => {
        loadData();
    }, [currentWeekStart]);

    const loadData = async () => {
        const u = await supabase.getUser();
        setUser(u);
        
        const recs = await supabase.generateRecipesFromStock(u?.diet || 'Tous');
        setRecipes(recs);

        const startStr = formatDate(weekStart);
        const end = new Date(weekStart); end.setDate(end.getDate() + 6);
        const endStr = formatDate(end);
        
        const existingPlans = await supabase.getPlanning(startStr, endStr);
        setPlans(existingPlans);
    };

    const handleAddMeal = (dayIndex: number, type: MealPlan['type']) => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + dayIndex);
        setSelectedSlot({ date: formatDate(d), type });
        setIsModalOpen(true);
    };

    const handleSelectRecipe = async (recipe: Recipe) => {
        if (!selectedSlot) return;

        const newPlan = await supabase.savePlanning({
            date: selectedSlot.date,
            type: selectedSlot.type,
            recipeId: recipe.id,
            recipeTitle: recipe.title
        });

        setPlans(prev => {
            const filtered = prev.filter(p => !(p.date === selectedSlot.date && p.type === selectedSlot.type));
            return [...filtered, newPlan];
        });
        
        setIsModalOpen(false);
        setSelectedSlot(null);
    };

    const handleGenerateForSlot = async () => {
        if (!selectedSlot || !user) return;
        setIsGenerating(true);
        try {
            const stock = await supabase.getStock();
            const mealTypeLabel = MEAL_TYPES.find(m => m.id === selectedSlot.type)?.label;
            const recipe = await generateRecipeWithGemini(stock, user, mealTypeLabel);
            if (recipe) {
                setRecipes(prev => [recipe, ...prev]);
                await handleSelectRecipe(recipe);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsGenerating(false);
        }
    }

    const handleRemoveMeal = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if(window.confirm("Supprimer ce repas du planning ?")) {
            await supabase.removePlanning(id);
            setPlans(prev => prev.filter(p => p.id !== id));
        }
    };

    const changeWeek = (offset: number) => {
        const newDate = new Date(currentWeekStart);
        newDate.setDate(newDate.getDate() + (offset * 7));
        setCurrentWeekStart(newDate);
    };

    const renderSlot = (dayIndex: number, typeId: MealPlan['type']) => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + dayIndex);
        const dateStr = formatDate(d);
        const mealInfo = MEAL_TYPES.find(m => m.id === typeId)!;
        const Icon = mealInfo.icon;
        
        const plan = plans.find(p => p.date === dateStr && p.type === typeId);

        return (
            <div 
                className={`min-h-[80px] rounded-2xl border-2 border-dashed transition-all flex flex-col p-3 cursor-pointer relative group ${
                    plan 
                    ? 'bg-white border-solid border-gray-100 shadow-sm' 
                    : `border-gray-100 hover:border-gray-300 hover:bg-gray-50`
                }`}
                onClick={() => handleAddMeal(dayIndex, typeId)}
            >
                {plan ? (
                    <div className="w-full flex flex-col h-full">
                        <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase mb-2 w-fit ${mealInfo.color}`}>
                            <Icon size={12} /> {mealInfo.label}
                        </div>
                        <p className="text-sm font-bold text-gray-800 line-clamp-2 leading-tight pr-4">{plan.recipeTitle}</p>
                        <button 
                            onClick={(e) => handleRemoveMeal(e, plan.id)}
                            className="absolute top-2 right-2 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-300 group-hover:text-gray-400">
                        <Icon size={18} className="mb-1" />
                        <span className="text-[9px] font-black uppercase tracking-wider">{mealInfo.label}</span>
                    </div>
                )}
            </div>
        )
    };

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <h1 className="text-3xl font-display font-bold text-gray-900">Planning Nutritionnel</h1>
                    <p className="text-gray-500 text-sm">Organisez vos 4 repas quotidiens avec l'IA.</p>
                </div>
                <div className="flex items-center gap-4 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm">
                    <button onClick={() => changeWeek(-1)} className="p-3 hover:bg-gray-50 rounded-xl text-gray-400 hover:text-gray-900 transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <div className="px-4 text-center">
                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-0.5">Semaine du</p>
                        <span className="font-bold text-gray-900">
                            {weekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                        </span>
                    </div>
                    <button onClick={() => changeWeek(1)} className="p-3 hover:bg-gray-50 rounded-xl text-gray-400 hover:text-gray-900 transition-colors">
                        <ArrowRight size={20} />
                    </button>
                </div>
            </div>

            {/* Grid Planning Desktop */}
            <div className="hidden lg:block bg-white rounded-[2.5rem] p-8 shadow-soft border border-gray-100">
                <div className="grid grid-cols-7 gap-6">
                    {DAYS.map((day, i) => {
                        const d = new Date(weekStart);
                        d.setDate(d.getDate() + i);
                        const isToday = formatDate(new Date()) === formatDate(d);
                        return (
                            <div key={day} className="space-y-4">
                                <div className={`text-center pb-2 border-b ${isToday ? 'border-mint' : 'border-gray-50'}`}>
                                    <p className={`text-xs font-black uppercase tracking-widest ${isToday ? 'text-mint' : 'text-gray-400'}`}>{day}</p>
                                    <p className={`text-xl font-display font-bold ${isToday ? 'text-gray-900' : 'text-gray-300'}`}>{d.getDate()}</p>
                                </div>
                                <div className="space-y-3">
                                    {MEAL_TYPES.map(meal => (
                                        <React.Fragment key={meal.id}>
                                            {renderSlot(i, meal.id)}
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Mobile / Tablet List View */}
            <div className="lg:hidden space-y-6">
                {DAYS.map((day, i) => {
                    const d = new Date(weekStart);
                    d.setDate(d.getDate() + i);
                    const isToday = formatDate(new Date()) === formatDate(d);
                    return (
                        <div key={i} className={`bg-white p-6 rounded-[2rem] shadow-sm border transition-all ${isToday ? 'border-mint ring-1 ring-mint/20' : 'border-gray-100'}`}>
                            <div className="flex justify-between items-end mb-6">
                                <div>
                                    <p className={`text-xs font-black uppercase tracking-widest ${isToday ? 'text-mint' : 'text-gray-400'}`}>{day}</p>
                                    <h3 className="text-2xl font-display font-bold text-gray-900">{d.getDate()} {d.toLocaleDateString('fr-FR', { month: 'long' })}</h3>
                                </div>
                                {isToday && <span className="bg-mint text-white text-[10px] font-black px-3 py-1 rounded-full uppercase">Aujourd'hui</span>}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {MEAL_TYPES.map(meal => (
                                    <React.Fragment key={meal.id}>
                                        {renderSlot(i, meal.id)}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Selection Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => setIsModalOpen(false)}></div>
                    <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl relative z-10 overflow-hidden animate-slide-up flex flex-col max-h-[85vh]">
                        <div className="p-8 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-display font-bold text-gray-900">Planifier un repas</h2>
                                <p className="text-sm text-gray-500 font-medium">Pour le {selectedSlot && MEAL_TYPES.find(m => m.id === selectedSlot.type)?.label}</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-2">
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="p-8 space-y-4">
                             <button 
                                onClick={handleGenerateForSlot}
                                disabled={isGenerating}
                                className="w-full py-5 bg-mint text-white rounded-2xl font-bold shadow-xl shadow-mint/20 hover:bg-teal-400 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-70 group"
                             >
                                {isGenerating ? <Loader2 className="animate-spin" /> : <Wand2 className="group-hover:rotate-12 transition-transform" size={20} />}
                                {isGenerating ? "L'IA réfléchit..." : "Générer une recette adaptée"}
                             </button>

                             <div className="relative py-4">
                                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
                                <div className="relative flex justify-center text-[10px] font-black uppercase text-gray-300 bg-white px-4">Ou choisir parmi vos favorites</div>
                             </div>

                             <div className="overflow-y-auto space-y-3 flex-1 custom-scrollbar pr-1 max-h-[40vh]">
                                {recipes.map(recipe => (
                                    <button
                                        key={recipe.id}
                                        onClick={() => handleSelectRecipe(recipe)}
                                        className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all text-left group"
                                    >
                                        <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden shrink-0 shadow-sm">
                                            <img src={recipe.imageUrl || "https://picsum.photos/100"} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-gray-800 truncate mb-0.5">{recipe.title}</h4>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase flex items-center gap-1">
                                                <ChefHat size={12} className="text-aqua" /> {recipe.prepTime}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                             </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Planning;
