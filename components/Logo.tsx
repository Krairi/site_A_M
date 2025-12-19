
import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  inline?: boolean;
}

const Logo: React.FC<LogoProps> = ({ className = "", showText = true, size = 'md', inline = false }) => {
  const iconSizes = {
    xs: 'w-5 h-5',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16'
  };

  const textSizes = {
    xs: 'text-base',
    sm: 'text-2xl',
    md: 'text-3xl',
    lg: 'text-5xl'
  };

  return (
    <div className={`${inline ? 'inline-flex' : 'flex'} items-center gap-2.5 select-none ${className} align-middle`}>
      {/* Maison Souriante Icon */}
      <svg 
        viewBox="0 0 100 100" 
        className={`${iconSizes[size]} drop-shadow-glow transition-transform hover:scale-110 duration-300 flex-shrink-0`} 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="domyGradientIcon" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#76D7C4" />
            <stop offset="50%" stopColor="#5DADE2" />
            <stop offset="100%" stopColor="#F5B041" />
          </linearGradient>
        </defs>
        <path d="M10 45L50 10L90 45V85C90 87.7614 87.7614 90 85 90H15C12.2386 90 10 87.7614 10 85V45Z" fill="url(#domyGradientIcon)" />
        <circle cx="35" cy="50" r="4" fill="white" />
        <circle cx="65" cy="50" r="4" fill="white" />
        <path d="M35 65C40 70 60 70 65 65" stroke="white" strokeWidth="5" strokeLinecap="round" />
      </svg>

      {/* Texte Domy stylisé avec dégradé - retrait du filtre pour corriger le bug de clip */}
      {showText && (
        <span className={`${textSizes[size]} font-display font-bold tracking-tighter bg-gradient-to-r from-mint via-aqua to-honey bg-clip-text text-transparent`}>
          Domy
        </span>
      )}
    </div>
  );
};

export default Logo;
