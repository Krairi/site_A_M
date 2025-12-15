import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, AlertCircle } from 'lucide-react';
import { supabase } from '../services/mockSupabase';
import { APP_NAME } from '../constants';

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);
  const [isLogin, setIsLogin] = React.useState(true);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    
    try {
      if (isLogin) {
        await supabase.login(email, password);
        navigate('/');
      } else {
        const { session } = await supabase.signup(email, password);
        if (session) {
            navigate('/');
        } else {
            // No session means email confirmation is likely required
            setSuccessMsg("Compte créé ! Veuillez vérifier vos emails pour confirmer votre inscription avant de vous connecter.");
            setIsLogin(true); // Switch back to login view
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
      setIsLogin(!isLogin);
      setError(null);
      setSuccessMsg(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-softgray p-4">
      <div className="bg-white w-full max-w-md p-8 rounded-3xl shadow-soft border border-gray-100 text-center">
        <div className="w-16 h-16 bg-mint rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-glow">
          <Sparkles className="text-white w-8 h-8" />
        </div>
        <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">
            {isLogin ? `Bienvenue sur ${APP_NAME}` : 'Créer un foyer'}
        </h1>
        <p className="text-gray-500 mb-8">
            {isLogin ? 'Votre gestionnaire de vie domestique intelligent.' : 'Commencez à gérer votre maison simplement.'}
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl flex items-center gap-2 text-left animate-pulse">
            <AlertCircle size={16} className="shrink-0" />
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-green-50 text-green-600 text-sm rounded-xl text-left">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-mint/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
            <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-mint/50"
            />
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-mint hover:bg-teal-400 text-white font-bold rounded-xl shadow-lg shadow-mint/30 transition-all active:scale-95 mt-4 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : (isLogin ? 'Se connecter' : 'S\'inscrire')}
          </button>
        </form>
        
        <p className="mt-6 text-sm text-gray-400">
          {isLogin ? 'Pas encore de compte ?' : 'Déjà un compte ?'} <span onClick={toggleMode} className="text-aqua font-medium cursor-pointer hover:underline select-none">
            {isLogin ? 'Créer un foyer' : 'Se connecter'}
          </span>
        </p>
      </div>
    </div>
  );
};

export default Auth;