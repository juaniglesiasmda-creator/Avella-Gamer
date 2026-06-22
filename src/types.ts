export interface Tournament {
  id: string;
  gameName: string;
  gameLogo: string; // "fifa" | "lol" | "valorant" | "cs2" | "fortnite" | "clash" | "smash" | "rocket" | "custom" (or custom base64 string)
  time: string; // e.g., "16:30"
  date: string; // e.g., "Sábado 13"
  status: 'upcoming' | 'registering' | 'active' | 'semis' | 'finals' | 'completed';
  statusLabel: string; // e.g., "¡EN JUEGO!", "Inscripciones Abiertas", "Siguiente Torneo"
  platform: 'PC' | 'PS5' | 'Xbox Series' | 'Switch' | 'Móvil' | 'Multiplataforma';
  players: string; // e.g., "1v1", "5v5", "32 Jugadores"
  prize: string; // e.g., "Hardware + $100"
  room: string; // e.g., "Arena Principal", "Zona Consolas"
  color: 'red' | 'blue' | 'cyan' | 'purple' | 'amber' | 'emerald' | 'rose' | 'slate';
}

export interface Announcement {
  id: string;
  message: string;
  isActive: boolean;
  type: 'info' | 'warning' | 'alert' | 'success';
  playSound: boolean; // Triggers sound + client-side TTS (Text-to-Speech)
  timestamp: number;
}

export interface EventState {
  eventTitle: string;
  eventSubtitle: string;
  eventLogoUrl: string; // Optional custom base64 or URL logo
  qrVisible: boolean;
  backgroundTheme: 'cyberpunk' | 'neon-dark' | 'synthwave' | 'minimal-dark' | 'winter-avellaneda';
  activeAnnouncement: Announcement | null;
  schedules: Tournament[];
  // Full-screen Video Broadcasting
  videoUrl?: string; // Standard video URL (MP4, YouTube Embed, etc.)
  videoInterval?: number; // Minutes between playback (e.g. 5, 10, 15)
  videoDuration?: number; // Optional closing timeout in seconds (e.g. 15, 30, 45)
  isVideoPlaying?: boolean; // Is it actively overriding the screen right now
  videoLastPlayed?: number; // Timestamp of last automation cycle
}

export const DEFAULT_THEMES = [
  { id: 'winter-avellaneda', name: 'Avellaneda Vacaciones de Invierno (Oficial)' },
  { id: 'synthwave', name: 'Synthwave Purple/Cyan' },
  { id: 'cyberpunk', name: 'Cyberpunk Red/Yellow' },
  { id: 'neon-dark', name: 'Esports Green/Dark' },
  { id: 'minimal-dark', name: 'Steel Minimalist' }
];

export const GAME_PRESETS = [
  { id: 'lol', name: 'League of Legends' },
  { id: 'valorant', name: 'Valorant' },
  { id: 'fifa', name: 'EA Sports FC 26' },
  { id: 'cs2', name: 'Counter-Strike 2' },
  { id: 'fortnite', name: 'Fortnite' },
  { id: 'clash', name: 'Clash Royale' },
  { id: 'smash', name: 'Super Smash Bros Ultimate' },
  { id: 'rocket', name: 'Rocket League' },
  { id: 'minecraft', name: 'Minecraft' },
  { id: 'streetfighter', name: 'Street Fighter 6' },
];
