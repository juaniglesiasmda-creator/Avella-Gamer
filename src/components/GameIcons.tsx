import React from 'react';
import { 
  Gamepad2, 
  Crown, 
  ShieldAlert, 
  Flame, 
  Swords, 
  Zap, 
  Award,
  CircleDot,
  Compass
} from 'lucide-react';

interface GameLogoProps {
  logoId: string;
  className?: string;
}

export const GameLogo: React.FC<GameLogoProps> = ({ logoId, className = "w-12 h-12" }) => {
  // If the logoId is a URL or data URI (base64), render it directly
  if (logoId.startsWith('data:') || logoId.startsWith('http://') || logoId.startsWith('https://')) {
    return (
      <img 
        src={logoId} 
        alt="Estilo personalizado o cargado" 
        className={`${className} object-contain rounded bg-neutral-900/50 p-1 border border-neutral-700/30`}
        referrerPolicy="no-referrer"
      />
    );
  }

  // Stylish SVG game assets for specific gaming titles
  switch (logoId.toLowerCase()) {
    case 'lol':
      return (
        <div className={`${className} bg-gradient-to-br from-amber-950 to-yellow-700 rounded-lg flex items-center justify-center border border-amber-400/40 text-amber-300 shadow-lg shadow-amber-950/40`}>
          <Crown className="w-2/3 h-2/3" />
        </div>
      );
    case 'valorant':
      return (
        <div className={`${className} bg-gradient-to-br from-red-950 to-rose-700 rounded-lg flex items-center justify-center border border-rose-500/40 text-rose-200 shadow-lg shadow-red-950/40`}>
          <Flame className="w-2/3 h-2/3" />
        </div>
      );
    case 'fifa':
      return (
        <div className={`${className} bg-gradient-to-br from-blue-950 to-cyan-700 rounded-lg flex items-center justify-center border border-cyan-400/40 text-cyan-200 shadow-lg shadow-blue-950/40`}>
          <Award className="w-2/3 h-2/3" />
        </div>
      );
    case 'cs2':
      return (
        <div className={`${className} bg-gradient-to-br from-orange-950 to-yellow-600 rounded-lg flex items-center justify-center border border-orange-500/40 text-orange-200 shadow-lg shadow-orange-950/40`}>
          <Zap className="w-2/3 h-2/3" />
        </div>
      );
    case 'fortnite':
      return (
        <div className={`${className} bg-gradient-to-br from-indigo-950 to-violet-600 rounded-lg flex items-center justify-center border border-violet-400/40 text-violet-200 shadow-lg shadow-indigo-950/40`}>
          <Swords className="w-2/3 h-2/3" />
        </div>
      );
    case 'clash':
      return (
        <div className={`${className} bg-gradient-to-br from-purple-950 to-pink-600 rounded-lg flex items-center justify-center border border-pink-400/40 text-pink-200 shadow-lg shadow-purple-950/40`}>
          <CircleDot className="w-2/3 h-2/3" />
        </div>
      );
    case 'smash':
      return (
        <div className={`${className} bg-gradient-to-br from-amber-900 to-red-600 rounded-lg flex items-center justify-center border border-amber-500/40 text-amber-100 shadow-lg shadow-amber-950/40`}>
          <Gamepad2 className="w-2/3 h-2/3" />
        </div>
      );
    case 'rocket':
      return (
        <div className={`${className} bg-gradient-to-br from-teal-950 to-teal-600 rounded-lg flex items-center justify-center border border-teal-400/40 text-teal-200 shadow-lg shadow-teal-950/40`}>
          <Compass className="w-2/3 h-2/3" />
        </div>
      );
    default:
      return (
        <div className={`${className} bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-lg flex items-center justify-center border border-zinc-700/60 text-zinc-300 shadow-lg`}>
          <Gamepad2 className="w-2/3 h-2/3" />
        </div>
      );
  }
};
