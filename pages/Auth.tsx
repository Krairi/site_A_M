
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { supabase } from '../services/mockSupabase';
import Logo from '../components/Logo';

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
            setSuccessMsg("Compte créé ! Veuillez vérifier vos emails avant de vous connecter.");
            setIsLogin(true);
        }
      }
    } catch (err: any) {
      console.error(err);
      let message = err.message || "Une erreur est survenue.";
      if (message.includes("Invalid login credentials")) {
        message = "Identifiants incorrects.";
      }
      setError(message);
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
      <div className="bg-white w-full max-w-md p-10 rounded-[3rem] shadow-soft border border-gray-100 text-center">
        <div className="flex justify-center mb-10">
          <Logo size="lg" />
        </div>
        
        <h1 className="text-2xl font-display font-bold text-gray-900 mb-2">
            {isLogin ? `Ravi de vous revoir` : 'Créer un foyer'}
        </h1>
        <p className="text-gray-500 mb-8 text-sm">
            Simplifiez votre quotidien dès maintenant.
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-2xl flex items-center gap-2 text-left border border-red-100 animate-shake">
            <AlertCircle size={18} className="shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 bg-green-50 text-green-600 text-sm rounded-2xl text-left border border-green-100">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 text-left">
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Email</label>
            <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                required
                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-mint/30 focus:bg-white transition-all font-medium"
            />
          </div>
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Mot de passe</label>
            <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-mint/30 focus:bg-white transition-all font-medium"
            />
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-mint hover:bg-teal-400 text-white font-bold rounded-2xl shadow-xl shadow-mint/30 transition-all active:scale-95 mt-4 flex items-center justify-center gap-3 disabled:opacity-70 text-lg"
          >
            {loading ? <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" /> : (isLogin ? 'Se connecter' : 'C\'est parti !')}
          </button>
        </form>
        
        <p className="mt-8 text-sm text-gray-400 font-medium">
          {isLogin ? 'Pas encore de compte ?' : 'Déjà membre ?'} <span onClick={toggleMode} className="text-aqua font-bold cursor-pointer hover:underline select-none ml-1">
            {isLogin ? 'Rejoindre l\'aventure' : 'Se connecter'}
          </span>
        </p>
      </div>
    </div>
  );
};

export default Auth;
