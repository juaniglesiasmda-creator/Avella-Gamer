import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  QrCode, 
  Gamepad2, 
  MapPin, 
  Layers, 
  X,
  Sliders,
  Clock,
  Bell,
  Volume2,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  Copy,
  Check,
  ExternalLink
} from 'lucide-react';
import { EventState, Tournament } from '../types';
import { GameLogo } from './GameIcons';

interface GiantScreenViewProps {
  state: EventState;
  onToggleQr: () => void;
  onGoToAdmin?: () => void;
  onUpdateState?: (updates: Partial<EventState>) => void;
}

export const GiantScreenView: React.FC<GiantScreenViewProps> = ({ state, onToggleQr, onGoToAdmin, onUpdateState }) => {
  const [footerExpanded, setFooterExpanded] = useState<boolean>(true);
  const [localTime, setLocalTime] = useState<string>('');
  const [localDate, setLocalDate] = useState<string>('');

  // YouTube Helpers
  const getYouTubeVideoId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const getYouTubeEmbedUrl = (url: string) => {
    const id = getYouTubeVideoId(url);
    return id ? `https://www.youtube.com/embed/${id}` : url;
  };

  const handleVideoEnded = () => {
    if (onUpdateState) {
      onUpdateState({ isVideoPlaying: false });
    }
  };

  const handleStopVideo = () => {
    if (onUpdateState) {
      onUpdateState({ isVideoPlaying: false });
    }
  };

  // Live time updater
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLocalTime(now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
      setLocalDate(now.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Derive target controller URL with custom overrides, local address tip, and double redundant APIs
  const [customOrigin, setCustomOrigin] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [qrError, setQrError] = useState(false);

  const getSystemOrigin = () => {
    if (typeof window === 'undefined') return '';
    return window.location.origin;
  };

  const currentOrigin = customOrigin || getSystemOrigin();
  const controllerUrl = `${currentOrigin}?mode=admin`;
  
  // Use a second QR API if the primary fails
  const qrCodeUrl = qrError 
    ? `https://quickchart.io/qr?text=${encodeURIComponent(controllerUrl)}&size=180&margin=1`
    : `https://api.qrserver.com/v1/create-qr-code/?size=180x180&bgcolor=09090b&color=ffffff&data=${encodeURIComponent(controllerUrl)}`;

  // Reset qrError if URL changes
  useEffect(() => {
    setQrError(false);
  }, [controllerUrl]);

  const handleCopyLink = () => {
    try {
      navigator.clipboard.writeText(controllerUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn("Clipboard copy failed, using fallback alert context:", err);
    }
  };

  const isLocalhost = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  // TTS & Sound effect logic
  const [lastAnnouncedId, setLastAnnouncedId] = useState<string>('');

  useEffect(() => {
    if (state.activeAnnouncement && state.activeAnnouncement.isActive) {
      const ann = state.activeAnnouncement;
      if (ann.id !== lastAnnouncedId) {
        setLastAnnouncedId(ann.id);
        
        // Play chiming audio tone using Web Audio API synthesis
        if (ann.playSound) {
          try {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContextClass) {
              const audioCtx = new AudioContextClass();
              
              // Define play note helper
              const playNote = (frequency: number, startTime: number, duration: number) => {
                const osc = audioCtx.createOscillator();
                const gainNode = audioCtx.createGain();
                
                osc.type = 'sine';
                osc.frequency.setValueAtTime(frequency, startTime);
                
                gainNode.gain.setValueAtTime(0.12, startTime);
                gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
                
                osc.connect(gainNode);
                gainNode.connect(audioCtx.destination);
                
                osc.start(startTime);
                osc.stop(startTime + duration);
              };

              // Standard pleasant triple-note chime
              playNote(523.25, audioCtx.currentTime, 0.35); // C5
              playNote(659.25, audioCtx.currentTime + 0.12, 0.35); // E5
              playNote(783.99, audioCtx.currentTime + 0.24, 0.5); // G5
            }
          } catch (e) {
            console.warn("Audio Context block or unsupported in this frame browser:", e);
          }

          // Trigger Speech Synthesis (TTS) after a tiny delay so the chime finishes playing
          setTimeout(() => {
            if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
              window.speechSynthesis.cancel(); // cancel any ongoing voice
              const utterance = new SpeechSynthesisUtterance(ann.message);
              utterance.lang = 'es-AR'; // Argentine/Spanish sound standard language
              utterance.rate = 1.0;
              window.speechSynthesis.speak(utterance);
            }
          }, 500);
        }
      }
    }
  }, [state.activeAnnouncement, lastAnnouncedId]);

  // Auto-close full-screen video when duration expires or manual close trigger.
  useEffect(() => {
    if (state.videoUrl?.toLowerCase().includes('.gif')) {
      return; // Do not auto-close GIFs
    }
    if (state.isVideoPlaying && state.videoDuration && state.videoDuration > 0) {
      const timer = setTimeout(() => {
        if (onUpdateState) {
          onUpdateState({ isVideoPlaying: false });
        }
      }, state.videoDuration * 1000);
      return () => clearTimeout(timer);
    }
  }, [state.isVideoPlaying, state.videoDuration, state.videoUrl]);

  // Periodic automatic video trigger loop (checks every 2 seconds for high responsiveness)
  useEffect(() => {
    if (!state.videoUrl || !state.videoInterval || state.videoInterval <= 0) return;

    const checkInterval = setInterval(() => {
      const now = Date.now();
      const intervalMs = state.videoInterval! * 60 * 1000;
      const lastPlayed = state.videoLastPlayed || (now - intervalMs);
      
      if (now - lastPlayed >= intervalMs && !state.isVideoPlaying) {
        if (onUpdateState) {
          onUpdateState({ 
            isVideoPlaying: true, 
            videoLastPlayed: now 
          });
        }
      }
    }, 2000);

    return () => clearInterval(checkInterval);
  }, [state.videoUrl, state.videoInterval, state.videoLastPlayed, state.isVideoPlaying]);

  // Determine styles depending on the active theme
  const getThemeStyles = () => {
    switch (state.backgroundTheme) {
      case 'winter-avellaneda':
        return {
          bg: "bg-[#180e3c] text-white", // Deep vibrant violet base
          cardBg: "bg-[#25185d]/85 backdrop-blur-md border-2 border-[#ff3b93] shadow-[0_0_20px_rgba(255,59,147,0.25)] hover:shadow-[0_0_30px_rgba(255,59,147,0.5)] transition-all",
          accentColor: "text-pink-400"
        };
      case 'cyberpunk':
        return {
          bg: "bg-zinc-950 text-stone-100",
          cardBg: "bg-black/40 border border-red-500/30 hover:border-red-500/60 transition-all",
          accentColor: "text-red-500"
        };
      case 'synthwave':
        return {
          bg: "bg-zinc-950 text-pink-100",
          cardBg: "bg-purple-950/20 border border-pink-500/30 hover:border-pink-500/60 transition-all",
          accentColor: "text-pink-500"
        };
      case 'neon-dark':
        return {
          bg: "bg-zinc-950 text-emerald-100",
          cardBg: "bg-neutral-900/40 border border-emerald-500/20 hover:border-emerald-500/50 transition-all",
          accentColor: "text-emerald-400"
        };
      case 'minimal-dark':
      default:
        return {
          bg: "bg-zinc-950 text-zinc-100",
          cardBg: "bg-zinc-400/5 hover:bg-zinc-400/10 border border-zinc-800 transition-all",
          accentColor: "text-zinc-400"
        };
    }
  };

  const theme = getThemeStyles();

  // Status mapping to color/pills styling
  const getStatusStyle = (status: Tournament['status']) => {
    switch (status) {
      case 'active':
        return 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse';
      case 'semis':
        return 'bg-orange-500/20 text-orange-400 border border-orange-500/30';
      case 'finals':
        return 'bg-yellow-500/20 text-yellow-400 font-semibold border border-yellow-500/30';
      case 'registering':
        return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
      case 'upcoming':
        return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
      case 'completed':
        return 'bg-zinc-800 text-zinc-400 border border-zinc-700';
    }
  };

  const totalItems = state.schedules?.length || 0;

  // Dynamically calculate grid layout classes - Stretch list elements to fill full width & height
  const getGridLayout = () => {
    if (totalItems === 1) {
      return "flex flex-col justify-center items-stretch w-full flex-grow py-1 h-full min-h-0";
    }
    if (totalItems === 2) {
      return "grid grid-cols-1 md:grid-cols-2 gap-[2vh] w-full flex-grow items-stretch py-1 min-h-0";
    }
    if (totalItems === 3) {
      return "grid grid-cols-1 md:grid-cols-3 gap-[1.5vh] w-full flex-grow items-stretch py-1 min-h-0";
    }
    if (totalItems === 4) {
      return "grid grid-cols-1 md:grid-cols-2 gap-[1.5vh] w-full flex-grow items-stretch py-1 min-h-0";
    }
    return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[1.5vh] w-full flex-grow items-stretch auto-rows-fr py-1 min-h-0";
  };

  // Dynamically calculate class size presets per card depending on total count
  const getCardSizeProps = () => {
    if (totalItems === 1) {
      return {
        cardPadding: "p-[3vh] md:p-[4vh] rounded-3xl w-full flex-grow flex flex-col justify-center min-h-[30vh]",
        indexSize: "text-4xl md:text-6xl lg:text-7xl",
        logoSize: "w-20 h-20 md:w-32 md:h-32 p-4 border-2 rounded-2xl bg-zinc-900 border-zinc-800",
        gameNameSize: "text-3xl md:text-[6vh] tracking-tighter leading-none font-extrabold",
        statusLabelSize: "text-xs md:text-sm px-3 py-1.5 mt-2 rounded-md font-extrabold uppercase",
        timeSize: "text-5xl md:text-[8vh] leading-none font-black italic",
        timeLabelSize: "text-[10px] md:text-xs tracking-[0.2em] font-bold mt-1",
        metaTextSize: "text-xs md:text-lg gap-4 mt-[3vh] pt-[3vh] border-t border-zinc-800/60",
        metaLabelSize: "text-[9px] md:text-[10px] tracking-wider",
        iconSize: "w-4 h-4 md:w-5 md:h-5"
      };
    }
    if (totalItems === 2) {
      return {
        cardPadding: "p-[2.5vh] md:p-[3.5vh] rounded-2xl w-full flex-grow flex flex-col justify-center min-h-[20vh]",
        indexSize: "text-3xl md:text-5xl",
        logoSize: "w-14 h-14 md:w-20 md:h-20 p-2.5 border rounded-xl bg-zinc-900 border-zinc-800",
        gameNameSize: "text-2xl md:text-[4vh] tracking-tight leading-none font-extrabold",
        statusLabelSize: "text-xs px-2.5 py-1 mt-1.5 rounded font-black uppercase",
        timeSize: "text-3xl md:text-[5vh] leading-none font-black italic",
        timeLabelSize: "text-[9px] tracking-widest font-bold mt-1",
        metaTextSize: "text-xs md:text-sm gap-3 mt-[2vh] pt-[2vh] border-t border-zinc-800/50",
        metaLabelSize: "text-[8px] md:text-[9px] tracking-wider",
        iconSize: "w-3.5 h-3.5 md:w-4 md:h-4"
      };
    }
    if (totalItems === 3) {
      return {
        cardPadding: "p-[2vh] md:p-[2.5vh] rounded-xl w-full flex-grow flex flex-col justify-center min-h-[16vh]",
        indexSize: "text-2xl md:text-4xl",
        logoSize: "w-12 h-12 md:w-16 md:h-16 p-2 border rounded-xl bg-zinc-900 border-zinc-800",
        gameNameSize: "text-xl md:text-[3vh] tracking-tight leading-none font-bold",
        statusLabelSize: "text-[10px] px-2 py-0.5 mt-1 rounded font-bold uppercase",
        timeSize: "text-2xl md:text-[4vh] leading-none font-black italic",
        timeLabelSize: "text-[8px] tracking-widest font-bold mt-1",
        metaTextSize: "text-xs gap-2 mt-[1.2vh] pt-[1.2vh] border-t border-zinc-800/45",
        metaLabelSize: "text-[8px] tracking-wider",
        iconSize: "w-3 h-3"
      };
    }
    if (totalItems === 4) {
      return {
        cardPadding: "p-[2vh] md:p-[2.8vh] rounded-2xl w-full flex-grow flex flex-col justify-center min-h-[16vh]",
        indexSize: "text-2xl md:text-3xl",
        logoSize: "w-12 h-12 md:w-16 md:h-16 p-2 border rounded-xl bg-zinc-900 border-zinc-800",
        gameNameSize: "text-xl md:text-[3vh] tracking-tight leading-none font-extrabold",
        statusLabelSize: "text-[10px] px-2 py-1 mt-1 rounded font-black uppercase",
        timeSize: "text-2xl md:text-[4vh] leading-none font-black italic",
        timeLabelSize: "text-[8px] tracking-widest font-bold mt-1",
        metaTextSize: "text-[11px] gap-3 mt-[1.5vh] pt-[1.5vh] border-t border-zinc-800/45",
        metaLabelSize: "text-[8px] tracking-wider",
        iconSize: "w-3.5 h-3.5"
      };
    }
    return {
      cardPadding: "p-[1.5vh] rounded-xl flex-grow flex flex-col justify-center min-h-[12vh]",
      indexSize: "text-xl",
      logoSize: "w-10 h-10 p-1 bg-zinc-900 border border-zinc-800 rounded",
      gameNameSize: "text-base md:text-lg leading-tight",
      statusLabelSize: "text-[9px] px-1.5 py-0.5 rounded font-bold uppercase",
      timeSize: "text-xl font-bold",
      timeLabelSize: "text-[8px]",
      metaTextSize: "text-[10px] gap-2 mt-2 pt-1.5 border-t border-zinc-800/40",
      metaLabelSize: "text-[8px]",
      iconSize: "w-3 h-3"
    };
  };

  const sizes = getCardSizeProps();
  const isWinterTheme = state.backgroundTheme === 'winter-avellaneda';

  return (
    <div className={`h-screen max-h-screen xl:h-full xl:max-h-full w-full flex flex-col p-4 md:p-[2.5vh] select-none transition-all duration-1000 relative overflow-hidden bg-zinc-950 text-white ${theme.bg}`}>
      
      {/* FULL SCREEN VIDEO OVERLAY BROADCASTER */}
      <AnimatePresence>
        {state.isVideoPlaying && state.videoUrl && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black z-50 flex items-center justify-center pointer-events-auto"
          >
            {state.videoUrl.includes('youtube.com') || state.videoUrl.includes('youtu.be') ? (
              <div className="w-full h-full overflow-hidden relative flex items-center justify-center pointer-events-none">
                <iframe
                  className="absolute w-[130%] h-[130%] border-0 pointer-events-none scale-[1.3]"
                  src={`${getYouTubeEmbedUrl(state.videoUrl)}?autoplay=1&mute=0&controls=0&loop=1&playlist=${getYouTubeVideoId(state.videoUrl) || ''}&modestbranding=1&rel=0&iv_load_policy=3&showinfo=0&disablekb=1&fs=0`}
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                  title="Transmisión Especial"
                />
              </div>
            ) : state.videoUrl.toLowerCase().includes('.gif') ? (
              <div className="w-full h-full flex items-center justify-center bg-black">
                <img
                  className="max-w-full max-h-full object-contain pointer-events-none"
                  src={state.videoUrl}
                  alt="Transmisión Especial GIF"
                />
              </div>
            ) : (
              <video
                className="w-full h-full object-cover pointer-events-auto"
                src={state.videoUrl}
                autoPlay
                loop
                controls={false}
                muted={false}
                onError={() => {
                  console.warn("No se pudo reproducir el loop de video HTML5.");
                }}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Decorative ambient blobs */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-indigo-900/5 to-transparent pointer-events-none z-0"></div>
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-zinc-900/10 rounded-full blur-[100px] pointer-events-none z-0"></div>

      {/* EXQUISITE AVELLANEDA DECORATIVE CUSTOM BACKGROUND */}
      {isWinterTheme && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 select-none opacity-40">
          
          {/* Top Left Neon Outline Decor */}
          <div className="absolute top-0 left-0 w-[300px] h-[150px] border-b-2 border-r-2 border-[#00d2ff] rounded-br-[40px] opacity-60">
            <div className="absolute bottom-4 right-6 flex gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00d2ff]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#00d2ff]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#00d2ff]" />
            </div>
          </div>

          {/* Bottom Right Neon Outline Decor */}
          <div className="absolute bottom-0 right-0 w-[300px] h-[150px] border-t-2 border-l-2 border-[#00d2ff] rounded-tl-[40px] opacity-60">
            <div className="absolute top-4 left-6 flex gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00d2ff]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#00d2ff]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#00d2ff]" />
            </div>
          </div>

          {/* Dots Grids precisely positioned like in flyer */}
          <div className="absolute top-16 left-8 opacity-35 grid grid-cols-4 gap-1.5">
            {Array.from({ length: 16 }).map((_, i) => <div key={i} className="w-1.5 h-1.5 bg-[#00d2ff] rounded-full" />)}
          </div>
          <div className="absolute bottom-24 right-8 opacity-35 grid grid-cols-4 gap-1.5">
            {Array.from({ length: 16 }).map((_, i) => <div key={i} className="w-1.5 h-1.5 bg-[#00d2ff] rounded-full" />)}
          </div>

          {/* Lightning Bolts (Vibrant Pink, rotating) */}
          <svg className="absolute top-[18%] left-[10%] w-12 h-12 text-[#ff3b93] filter drop-shadow-[0_0_8px_rgba(255,59,147,0.6)]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 9h-6l2.3-9H5L3 15h6l-2 9L19 9z" />
          </svg>
          <svg className="absolute bottom-[35%] right-[10%] w-12 h-12 text-[#ff3b93] filter drop-shadow-[0_0_8px_rgba(255,59,147,0.6)]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 9h-6l2.3-9H5L3 15h6l-2 9L19 9z" />
          </svg>
          <svg className="absolute bottom-[20%] left-[15%] w-10 h-10 text-pink-400 opacity-60" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 9h-6l2.3-9H5L3 15h6l-2 9L19 9z" />
          </svg>
          <svg className="absolute top-[28%] right-[22%] w-8 h-8 text-pink-400 opacity-60" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 9h-6l2.3-9H5L3 15h6l-2 9L19 9z" />
          </svg>

          {/* Floating Game Console Controllers (Transparent Purple) */}
          <div className="absolute bottom-[10%] left-[45%] text-purple-500/10 transform -rotate-12">
            <svg className="w-48 h-48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 14c-.01 0-2 0-3-.5M6.5 14h.01M17.5 14h.01" />
            </svg>
          </div>
          <div className="absolute top-[40%] right-[3%] text-purple-500/10 transform rotate-45 select-none pointer-events-none">
            <svg className="w-56 h-56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8">
              <rect x="2" y="6" width="20" height="12" rx="4" />
              <circle cx="7" cy="12" r="2" />
              <circle cx="17" cy="11" r="1" />
              <circle cx="15" cy="13" r="1" />
            </svg>
          </div>
        </div>
      )}

      {/* HEADER SECTION: Clean with optional custom Logo, Title and subtitle, Clock & Date */}
      {isWinterTheme ? (
        <div className="relative z-10 w-full flex flex-col justify-center items-center py-1 mb-2 select-none">
          {/* Main Logo Lockup */}
          <div className="relative p-3.5 px-6 md:px-8 rounded-2xl border-4 border-[#00d2ff] bg-[#1a0f44]/95 shadow-[0_0_20px_rgba(0,180,255,0.35)] overflow-visible text-center mb-3 max-w-3xl w-full">
            
            {/* Concentric double line outline inside the box */}
            <div className="absolute inset-0.5 border border-[#00d2ff]/30 rounded-xl pointer-events-none" />

            {/* Dynamic Custom Title & Subtitle in normal white typography */}
            <div className="relative z-10">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white uppercase break-words leading-tight">
                {state.eventTitle || "VACACIONES DE INVIERNO"}
              </h1>
              {state.eventSubtitle ? (
                <div className="mt-1 text-[#00d2ff] font-mono text-[10px] sm:text-xs md:text-sm font-bold tracking-[0.15em] uppercase break-words">
                  {state.eventSubtitle}
                </div>
              ) : (
                <div className="mt-1 text-[#00d2ff]/60 font-mono text-[10px] sm:text-xs font-semibold tracking-[0.15em] uppercase">
                  Estadio Playstation & Zona Fichines - Avellaneda
                </div>
              )}
            </div>
          </div>

          {/* Date / Badges tray - Highly compact and streamlined */}
          <div className="flex flex-wrap items-center justify-center gap-2 w-full text-center mt-1 mb-3 relative max-w-4xl">
            <div className="px-3 py-1 bg-gradient-to-r from-pink-500 to-rose-500 rounded-lg border border-white/20 text-xs md:text-sm font-extrabold tracking-tight shadow-sm text-white">
              20/07 AL 02/08
            </div>
            <div className="px-3 py-1 bg-indigo-950/90 border border-[#00d2ff]/30 text-xs md:text-sm font-black text-[#00d2ff] tracking-tight shadow-sm font-mono">
              12:00 A 20:00HS
            </div>
            
            {/* Discrete clock nested inside the winter header */}
            <div className="px-3 py-1 bg-[#ff3b93]/10 border border-[#ff3b93]/35 text-rose-300 font-mono text-xs md:text-sm font-black rounded-lg tracking-wider shadow-inner flex items-center">
              {localTime ? localTime.substring(0, 5) : "14:35"} hs
            </div>
            
            <span className="px-3 py-1 bg-indigo-950/60 text-indigo-200 rounded-lg text-xs font-semibold border border-indigo-500/25 backdrop-blur-md">
              Parque La Estación
            </span>
            <span className="px-3 py-1 bg-[#ff3b93]/15 text-[#ff3b93] rounded-lg text-xs font-extrabold border border-[#ff3b93]/30 backdrop-blur-md">
              Entrada libre y gratuita
            </span>
          </div>
        </div>
      ) : (
        <header className="flex flex-col md:flex-row md:items-center md:justify-between pb-8 mb-8 relative z-10 border-b border-zinc-800/80 gap-6">
          <div className="flex items-center gap-6">
            {state.eventLogoUrl ? (
              <div className="w-16 h-16 bg-zinc-900 rounded-lg flex items-center justify-center border border-zinc-805 shadow-[0_4px_20px_rgba(0,0,0,0.5)] overflow-hidden">
                <img 
                  src={state.eventLogoUrl} 
                  alt="Logo Evento" 
                  className="w-full h-full object-contain p-1"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-lg flex items-center justify-center font-black text-3xl shadow-[0_4px_20px_rgba(99,102,241,0.2)]">
                EX
              </div>
            )}
            <div className="text-left">
              <h1 className="text-4xl font-extrabold tracking-tight uppercase leading-none text-white">
                {state.eventTitle || "MI EXPO"}
              </h1>
              <p className="text-zinc-[500] font-mono text-xs mt-2 uppercase tracking-[0.2em]">{state.eventSubtitle || "Panel del Escenario"}</p>
            </div>
          </div>

          {/* CLOCK & DATE - VERY CLEAN AND GRAPHICAL */}
          <div className="flex flex-col md:items-end text-left md:text-right gap-1 select-none">
            <div className="text-5xl font-black font-mono tracking-tight text-indigo-400">
              {localTime ? localTime.substring(0, 5) : "14:35"}
            </div>
            <div className="text-xs text-zinc-505 uppercase font-mono tracking-widest leading-none mt-1">
              {localDate ? localDate.toUpperCase() : "13 DE JUNIO"}
            </div>
          </div>
        </header>
      )}

      {/* MAIN SCREEN CONTENT */}
      <main className="flex-grow flex flex-col relative z-10 min-h-0 overflow-hidden">
        
        {/* LIST OF UPCOMING EVENTS */}
        <h2 className="text-xs font-bold text-zinc-550 uppercase tracking-[0.25em] mb-3 md:mb-[1.5vh] flex items-center select-none">
          <span>PROGRAMACIÓN DE ACTIVIDADES</span>
        </h2>

        {state.schedules && state.schedules.length > 0 ? (
          <div className="flex-grow min-h-0 overflow-hidden flex flex-col justify-start">
            <div className={getGridLayout()}>
              <AnimatePresence mode="popLayout">
                {state.schedules.map((tournament, idx) => (
                  <motion.div
                    key={tournament.id}
                    layoutId={`tourney-card-${tournament.id}`}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className={`relative ${sizes.cardPadding} flex flex-col justify-between ${theme.cardBg} group text-left shadow-lg min-h-0`}
                  >
                    <div className="flex items-start justify-between gap-3 w-full animate-fade-in min-h-0">
                      <div className="min-h-0">
                        <h4 className={`font-black text-white uppercase italic tracking-tight ${sizes.gameNameSize} truncate`}>
                          {tournament.gameName}
                        </h4>
                        <span className={`inline-block mt-1.5 font-bold uppercase tracking-wider ${sizes.statusLabelSize} ${getStatusStyle(tournament.status)}`}>
                          {tournament.statusLabel}
                        </span>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <span className={`block font-black ${isWinterTheme ? 'text-[#00d2ff]' : 'text-indigo-400'} italic font-mono ${sizes.timeSize}`}>{tournament.time}</span>
                        <span className={`${isWinterTheme ? 'text-pink-400' : 'text-zinc-500'} uppercase tracking-widest font-bold block ${sizes.timeLabelSize}`}>HORARIO</span>
                      </div>
                    </div>

                    {/* SPECIFICATION METADATA (ONLY UBICACIÓN NOW) */}
                    <div className={`border-t ${isWinterTheme ? 'border-pink-500/30' : 'border-zinc-800/40'} text-zinc-400 ${sizes.metaTextSize}`}>
                      <div>
                        <span className={`${isWinterTheme ? 'text-[#00d2ff]/80' : 'text-zinc-500'} uppercase block ${sizes.metaLabelSize}`}>Ubicación</span>
                        <span className={`font-bold block truncate mt-0.5 ${isWinterTheme ? 'text-[#ff3b93] font-black text-sm md:text-lg' : 'text-indigo-300 text-sm md:text-lg'}`}>
                          {tournament.room}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          /* POLISHED EMPTY STATE REMINDER */
          <div className="flex-grow flex flex-col items-center justify-center min-h-[300px] border border-dashed border-zinc-805 rounded-2xl p-10 text-center bg-zinc-900/5">
            <div className="w-16 h-16 rounded-full bg-zinc-950 flex items-center justify-center border border-zinc-800 mb-4 text-zinc-500">
              <Gamepad2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-zinc-300 font-sans">No hay torneos o juegos todavía</h3>
            <p className="text-sm text-zinc-500 mt-2 max-w-sm leading-relaxed font-sans">
              Escaneá el código QR o ingresá al Panel Móvil para configurar el logo de tu marca y cargar los juegos de tu evento.
            </p>
            <button 
              onClick={onToggleQr}
              className="mt-5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all text-xs font-bold text-white rounded-lg flex items-center gap-1.5 shadow-lg"
            >
              <QrCode className="w-4 h-4" />
              Ver Código QR de Carga
            </button>
          </div>
        )}

        {/* FLOATING QR CODE & MANAGEMENT AREA */}
        <AnimatePresence>
          {state.qrVisible && (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: "spring", stiffness: 120, damping: 18 }}
              className="mt-8 mx-auto w-full max-w-xl bg-white p-5 rounded-2xl flex flex-col sm:flex-row items-start gap-6 shadow-2xl border border-zinc-200 text-left text-zinc-950 relative z-30"
              id="qr-modal-and-drawer"
            >
              <div className="w-28 h-28 bg-zinc-100 flex flex-shrink-0 items-center justify-center p-2 rounded-xl border border-zinc-200 relative shadow-inner mx-auto sm:mx-0">
                <img 
                  src={qrCodeUrl} 
                  alt="QR Code Link" 
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                  onError={() => {
                    console.warn("Primary QR API failed, falling back to backup...");
                    setQrError(true);
                  }}
                />
              </div>

              <div className="text-zinc-900 flex-grow w-full">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">PANEL MÓVIL DE ADMINISTRACIÓN</p>
                  <button 
                    onClick={onToggleQr}
                    className="p-1 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-900 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="text-lg font-bold leading-tight mt-1 text-zinc-950 font-sans">
                  Escaneá el código QR con tu celular
                </h3>
                <p className="text-xs text-zinc-500 mt-1 leading-relaxed font-sans">
                  Podés subir logos, editar juegos y cronogramas en tiempo real directamente desde tu teléfono o tablet.
                </p>

                {/* Copiar enlace directo */}
                <div className="mt-3 flex items-center gap-1.5 bg-zinc-55 border border-zinc-200 rounded-lg p-1.5">
                  <span className="text-[10px] font-mono text-zinc-650 truncate flex-grow px-1 select-all" title={controllerUrl}>
                    {controllerUrl}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="flex items-center gap-1 px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-white rounded text-[10px] font-bold transition-colors cursor-pointer shrink-0"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copied ? "¡Copiado!" : "Copiar"}
                  </button>
                </div>

                {/* Localhost troubleshooting option */}
                <div className="mt-3 border-t border-zinc-100 pt-3">
                  <p className="text-[10px] text-zinc-900 font-bold leading-normal mb-2 flex items-center gap-1">
                    <span>💡 Seleccioná tu servidor público para el celular:</span>
                  </p>
                  
                  <div className="grid grid-cols-1 gap-1.5 mb-3">
                    <button
                      type="button"
                      onClick={() => setCustomOrigin('https://ais-pre-vw3xtm4q4bt4vefxaro4sz-802682207745.us-east1.run.app')}
                      className={`text-left p-2 rounded-lg border text-xs font-sans transition-all flex items-center justify-between ${
                        currentOrigin === 'https://ais-pre-vw3xtm4q4bt4vefxaro4sz-802682207745.us-east1.run.app'
                          ? 'border-indigo-650 bg-indigo-50 text-indigo-950 font-semibold'
                          : 'border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700'
                      }`}
                    >
                      <span>🌐 Enlace Público (Recomendado para Celular)</span>
                      <ExternalLink className="w-3 h-3 opacity-60" />
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setCustomOrigin('https://ais-dev-vw3xtm4q4bt4vefxaro4sz-802682207745.us-east1.run.app')}
                      className={`text-left p-2 rounded-lg border text-xs font-sans transition-all flex items-center justify-between ${
                        currentOrigin === 'https://ais-dev-vw3xtm4q4bt4vefxaro4sz-802682207745.us-east1.run.app'
                          ? 'border-indigo-650 bg-indigo-50 text-indigo-950 font-semibold'
                          : 'border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700'
                      }`}
                    >
                      <span>🛠️ Enlace de Desarrollo</span>
                      <ExternalLink className="w-3 h-3 opacity-60" />
                    </button>
                  </div>

                  <p className="text-[9px] text-zinc-500 leading-normal">
                    ⚠️ <b>¿Por qué dice Page Not Found?</b> Si estás previsualizando la app dentro de un Iframe seguro en tu computadora, la URL por defecto apunta a un sandbox protegido. Para abrirlo desde tu celular, tocá el botón <b>🌐 Enlace Público (Recomendado para Celular)</b> para generar un código QR universal.
                  </p>
                  
                  <div className="flex gap-1.5 mt-2.5">
                    <input
                      type="text"
                      value={customOrigin}
                      onChange={(e) => setCustomOrigin(e.target.value)}
                      placeholder="IP local o dominio de la app..."
                      className="flex-grow text-[10px] font-mono border border-zinc-200 rounded-lg px-2.5 py-1.5 text-zinc-900 focus:outline-none focus:border-indigo-500 bg-zinc-50"
                    />
                    {customOrigin && (
                      <button
                        type="button"
                        onClick={() => setCustomOrigin('')}
                        className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 rounded-lg text-[10px] font-bold text-zinc-600 transition-all cursor-pointer"
                      >
                        Restablecer
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 mt-4 border-t border-zinc-100 pt-3">
                  {onGoToAdmin && (
                    <button 
                      onClick={onGoToAdmin}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-755 active:scale-95 text-xs text-white font-bold rounded-lg transition-all flex items-center gap-1 shadow"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      Abrir Panel Organizador
                    </button>
                  )}
                  <button 
                    onClick={onToggleQr}
                    className="text-xs font-semibold text-zinc-500 hover:text-zinc-800 underline"
                  >
                    Ocultar QR
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* DISCREET MINIMAL FOOTER FOR ADMIN AND BRAND */}
      {!footerExpanded ? (
        /* COLLAPSED FOOTER TRIGGER */
        isWinterTheme ? (
          <div className="mt-4 flex justify-end relative z-30 select-none">
            <button
              onClick={() => setFooterExpanded(true)}
              className="p-2.5 rounded-full border border-[#00d2ff]/40 bg-[#1a0f44]/95 text-[#00d2ff] hover:text-white shadow-[0_0_15px_rgba(0,210,255,0.15)] flex items-center justify-center transition-all hover:scale-110 active:scale-90"
              id="screen-expand-footer-btn"
              title="Mostrar pie de pantalla"
            >
              <ChevronUp className="w-4 h-4 text-[#00d2ff]" />
            </button>
          </div>
        ) : (
          <div className="mt-4 flex justify-end relative z-30 select-none">
            <button
              onClick={() => setFooterExpanded(true)}
              className="p-2 rounded-full border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-200 flex items-center justify-center transition-colors hover:bg-zinc-900 active:scale-90 shadow-lg"
              id="screen-expand-footer-btn"
              title="Mostrar pie"
            >
              <ChevronUp className="w-4 h-4 text-indigo-500" />
            </button>
          </div>
        )
      ) : isWinterTheme ? (
        <footer className="mt-8 pt-6 border-t border-indigo-500/30 flex flex-col sm:flex-row items-center justify-between relative z-10 w-full gap-4 text-xs font-semibold">
          
          {/* Logo "LA ESTACIÓN" */}
          <div className="flex items-center gap-2 select-none">
            <span className="text-cyan-400 font-sans tracking-wide font-extrabold uppercase">• LA</span>
            <div className="bg-cyan-500 text-[#1a0f44] px-2 py-0.5 rounded font-black text-xs font-sans tracking-widest leading-none">
              ESTACIÓN
            </div>
            <span className="text-indigo-200 text-[10px] font-mono tracking-tight shrink-0 uppercase">
              PARQUE MUNICIPAL MULTIPROPÓSITO •
            </span>
          </div>

          {/* Control Triggers for giant-screen settings */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button 
              onClick={onToggleQr} 
              className="px-3.5 md:px-4 py-1.5 rounded-full bg-[#ff3b93]/20 hover:bg-[#ff3b93]/35 border border-[#ff3b93]/40 text-rose-300 hover:text-white transition-all text-[11px] font-bold font-sans flex items-center gap-1.5"
              id="screen-toggle-qr-btn"
            >
              <QrCode className="w-3.5 h-3.5" />
              {state.qrVisible ? "OCULTAR QR" : "MOSTRAR QR"}
            </button>
            
            {onGoToAdmin && (
              <button 
                onClick={onGoToAdmin}
                className="px-3.5 md:px-4 py-1.5 rounded-full bg-[#180e3c] hover:bg-indigo-900/50 border border-indigo-500/50 text-[#00d2ff] hover:text-white transition-all text-[11px] font-bold font-sans flex items-center gap-1.5"
                id="screen-goto-admin-btn"
              >
                <Sliders className="w-3.5 h-3.5" />
                PANEL CELULAR
              </button>
            )}

            <div className="text-[9px] font-mono text-cyan-400 px-2 py-1 rounded bg-[#00d2ff]/10 border border-[#00d2ff]/20 uppercase tracking-widest animate-pulse shrink-0">
              ● VIVO
            </div>

            {/* Collapse action button */}
            <button
              onClick={() => setFooterExpanded(false)}
              className="px-3 py-1.5 rounded-full bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-rose-200 transition-all text-[11px] font-black font-sans flex items-center gap-1"
              id="screen-collapse-footer-btn"
            >
              <ChevronDown className="w-3.5 h-3.5" />
              <span>OCULTAR PIE</span>
            </button>
          </div>

          {/* Logo "a avellaneda" */}
          <div className="flex items-center gap-2 text-cyan-400 font-black text-lg select-none">
            <div className="w-7 h-7 rounded-full border-2 border-cyan-400 flex items-center justify-center font-mono text-sm leading-none font-bold bg-cyan-400/10 shadow-[0_0_8px_rgba(34,211,238,0.3)]">
              a
            </div>
            <span className="font-sans font-black lowercase tracking-tight">avellaneda</span>
          </div>

        </footer>
      ) : (
        <footer className="mt-8 pt-4 border-t border-zinc-850 flex flex-col sm:flex-row items-center justify-between text-zinc-650 text-[10px] font-mono relative z-10 w-full">
          <div>
            <span>MARCA DEL EVENTO: </span>
            <span className="text-zinc-400 font-bold uppercase">{state.eventTitle || "SIN CARGAR"}</span>
          </div>

          <div className="flex items-center gap-4 mt-2 sm:mt-0">
            <button 
              onClick={onToggleQr} 
              className="px-3 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5"
              id="screen-toggle-qr-btn"
            >
              <QrCode className="w-3.5 h-3.5" />
              {state.qrVisible ? "OCULTAR Código QR" : "MOSTRAR Código QR"}
            </button>
            
            {onGoToAdmin && (
              <button 
                onClick={onGoToAdmin}
                className="px-3 py-1 rounded bg-zinc-900 hover:bg-zinc-80 border border-zinc-800 text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5"
                id="screen-goto-admin-btn"
              >
                <Sliders className="w-3.5 h-3.5" />
                PANEL ADMIN
              </button>
            )}

            <div>
              SINCRONIZACIÓN EN VIVO
            </div>

            {/* Collapse action button */}
            <button
              onClick={() => setFooterExpanded(false)}
              className="px-3 py-1 rounded bg-zinc-900 hover:bg-zinc-805 border border-zinc-800 text-zinc-450 hover:text-white transition-colors flex items-center gap-1 font-sans font-semibold uppercase text-[9px]"
              id="screen-collapse-footer-btn"
            >
              <ChevronDown className="w-3.5 h-3.5" />
              <span>Ocultar Pie</span>
            </button>
          </div>
        </footer>
      )}

      {/* GLOBAL IMPORTANT ALERT OVERLAY BANNER WITH SPRING ANIMATIONS & GLOW */}
      <AnimatePresence>
        {state.activeAnnouncement && state.activeAnnouncement.isActive && (
          <motion.div
            initial={{ opacity: 0, y: -100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -100, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 140, damping: 16 }}
            className="fixed inset-x-4 md:inset-x-12 top-6 z-50 rounded-2xl overflow-hidden shadow-[0_25px_60px_rgba(239,68,68,0.45)] border-2 border-red-500 bg-zinc-950 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6"
            id="global-alert-screen-block"
          >
            <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left flex-grow">
              {/* Pulsing beacon indicator */}
              <div className="relative shrink-0">
                <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-60 animate-ping"></span>
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-red-600 to-red-650 flex items-center justify-center border-2 border-red-400 shadow-[0_1px_15px_rgba(239,68,68,0.5)] relative">
                  <Bell className="w-8 h-8 text-white animate-bounce" />
                </div>
              </div>

              <div>
                <span className="text-xs md:text-sm font-mono font-black text-red-400 tracking-[0.25em] uppercase block">
                  📢 ANUNCIO IMPORTANTE EN VIVO
                </span>
                <h2 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight uppercase leading-snug mt-1">
                  {state.activeAnnouncement.message}
                </h2>
              </div>
            </div>

            {state.activeAnnouncement.playSound && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/15 border border-red-500/25 text-red-400 font-mono text-xs shrink-0 uppercase font-black tracking-widest shadow-inner animate-pulse">
                <Volume2 className="w-4 h-4" />
                <span>Audio Activo</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
