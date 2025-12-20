
import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, ShieldAlert, Users } from 'lucide-react';
import { NAVIGATION_ITEMS } from '../constants';
import { supabase } from '../services/mockSupabase';
import MagicCommand from './MagicCommand';
import Logo from './Logo';
import { User } from '../types';
import { useTranslation } from '../context/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    supabase.getUser().then(setUser);
  }, [location.pathname]);

  const handleLogout = async () => {
    await supabase.logout();
    navigate('/auth');
  };

  const NavContent = () => (
    <div className="flex flex-col h-full bg-white border-r border-gray-100">
      <div className="p-8">
        <Logo size="md" />
        {user?.role === 'admin' && (
          <div className="mt-2 flex items-center gap-2 px-3 py-1 bg-gray-900 text-white rounded-full w-fit">
            <ShieldAlert size={12} className="text-mint" />
            <span className="text-[10px] font-black uppercase tracking-widest">{t('common.admin_mode')}</span>
          </div>
        )}
      </div>

      <nav className="flex-1 px-4 space-y-2 py-4 overflow-y-auto">
        {NAVIGATION_ITEMS.filter(item => !item.admin || user?.role === 'admin').map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 group ${
                isActive 
                  ? 'bg-aqua/10 text-aqua font-bold shadow-sm' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon size={20} className={isActive ? 'text-aqua' : 'text-gray-400 group-hover:text-gray-600'} />
              <span>{t(item.name)}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-6 border-t border-gray-100 space-y-4">
        <LanguageSwitcher />
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-2xl text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors font-semibold"
        >
          <LogOut size={20} />
          <span>{t('nav.logout')}</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-softgray flex font-sans">
      <aside className="hidden lg:block w-72 h-screen sticky top-0 z-20">
        <NavContent />
      </aside>

      <div className="lg:hidden fixed top-0 left-0 right-0 h-20 bg-white z-30 flex items-center justify-between px-6 border-b border-gray-100">
        <Logo size="sm" />
        <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-gray-600 hover:bg-gray-50 rounded-xl transition-colors">
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[40] lg:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="absolute top-20 left-0 w-72 h-[calc(100vh-5rem)] bg-white shadow-2xl animate-slide-in">
            <NavContent />
          </div>
        </div>
      )}

      <main className="flex-1 lg:p-10 p-4 mt-20 lg:mt-0 overflow-x-hidden relative">
        <div className="max-w-6xl mx-auto space-y-8">
          {children}
        </div>
        <MagicCommand />
      </main>
    </div>
  );
};

export default Layout;
