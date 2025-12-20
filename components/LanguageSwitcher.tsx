
import React from 'react';
import { Globe, ChevronDown } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import { Language } from '../types';

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage, t } = useTranslation();
  const [isOpen, setIsOpen] = React.useState(false);

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'en', label: 'English', flag: '🇬🇧' }
  ];

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-full transition-all text-sm font-bold text-gray-700 shadow-sm group"
      >
        <Globe size={18} className="text-aqua group-hover:rotate-12 transition-transform" />
        <span className="uppercase text-xs tracking-wider">{language}</span>
        <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full mt-2 right-0 w-44 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-slide-up">
            <div className="p-2 space-y-1">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-left transition-colors ${
                    language === lang.code 
                      ? 'bg-aqua/10 text-aqua font-bold' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{lang.flag}</span>
                    <span className="text-xs uppercase font-black tracking-tight">{lang.label}</span>
                  </div>
                  {language === lang.code && <div className="w-1.5 h-1.5 rounded-full bg-aqua" />}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSwitcher;
