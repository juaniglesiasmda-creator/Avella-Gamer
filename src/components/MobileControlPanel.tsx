import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Gamepad2, 
  Megaphone, 
  Sliders, 
  Plus, 
  Trash2, 
  Check, 
  Volume2, 
  VolumeX, 
  Image, 
  Upload, 
  Clock, 
  MapPin, 
  Award, 
  Layers, 
  Smartphone, 
  Tv, 
  Eye, 
  EyeOff,
  AlertOctagon,
  Bell,
  RefreshCw,
  Power,
  Sparkles,
  X
} from 'lucide-react';
import { EventState, Tournament, Announcement, GAME_PRESETS, DEFAULT_THEMES } from '../types';
import { GameLogo } from './GameIcons';

interface MobileControlPanelProps {
  state: EventState;
  onUpdateState: (updates: Partial<EventState>) => void;
  onResetState: () => void;
}

export const MobileControlPanel: React.FC<MobileControlPanelProps> = ({ state, onUpdateState, onResetState }) => {
  const [activeTab, setActiveTab] = useState<'tournaments' | 'announcements' | 'settings'>('tournaments');
  
  // Announcement states
  const [announcementText, setAnnouncementText] = useState('');
  const [announcementType, setAnnouncementType] = useState<Announcement['type']>('warning');
  const [announcementPlaySound, setAnnouncementPlaySound] = useState(true);

  // Tournament creation form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [gameName, setGameName] = useState('');
  const [gameLogo, setGameLogo] = useState('lol');
  const [customGameLogoBase64, setCustomGameLogoBase64] = useState('');
  const [tourneyTime, setTourneyTime] = useState('16:00');
  const [tourneyDate, setTourneyDate] = useState('Hoy');
  const [tourneyStatus, setTourneyStatus] = useState<Tournament['status']>('registering');
  const [tourneyStatusLabel, setTourneyStatusLabel] = useState('Inscripciones Abiertas');
  const [tourneyPlatform, setTourneyPlatform] = useState<Tournament['platform']>('PC');
  const [tourneyPlayers, setTourneyPlayers] = useState('1v1');
  const [tourneyPrize, setTourneyPrize] = useState('$100 USD Cuentas Premium');
  const [tourneyRoom, setTourneyRoom] = useState('Arena General 1');
  const [tourneyColor, setTourneyColor] = useState<Tournament['color']>('red');

  // Editing tournament id holder
  const [editingId, setEditingId] = useState<string | null>(null);

  // GIF uploading states
  const [isUploadingGif, setIsUploadingGif] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const gifInputRef = useRef<HTMLInputElement>(null);

  const handleGifFileChange = async (file: File | undefined) => {
    if (!file) return;
    if (file.type !== 'image/gif' && !file.name.toLowerCase().endsWith('.gif')) {
      alert("Por favor, subí un archivo GIF animado válido (.gif)");
      return;
    }
    // Limit to 150MB
    if (file.size > 150 * 1024 * 1024) {
      alert("El archivo GIF es demasiado pesado. El límite máximo es de 150MB.");
      return;
    }

    setIsUploadingGif(true);
    try {
      const formData = new FormData();
      formData.append("video", file);

      const response = await fetch("/api/upload-video", {
        method: "POST",
        body: formData
      });
      
      const data = await response.json();
      if (data.success) {
        onUpdateState({ 
          videoUrl: data.videoUrl,
          isVideoPlaying: true 
        });
      } else {
        alert("Error de subida: " + (data.error || "No se pudo guardar el archivo"));
      }
    } catch (err: any) {
      console.error("Error al subir GIF:", err);
      alert("Error de conexión al servidor de GIFs.");
    } finally {
      setIsUploadingGif(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleGifFileChange(e.dataTransfer.files[0]);
    }
  };

  // Event logo input reference
  const uploadLogoInputRef = useRef<HTMLInputElement>(null);
  const uploadGameLogoInputRef = useRef<HTMLInputElement>(null);

  // Convert files to base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, target: 'event' | 'tournament') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      if (target === 'event') {
        onUpdateState({ eventLogoUrl: base64String });
      } else {
        setCustomGameLogoBase64(base64String);
        setGameLogo(base64String); // Direct use
      }
    };
    reader.readAsDataURL(file);
  };

  // Preset announcement triggers
  const announcementPresets = [
    { text: "¡El torneo de Valorant está por comenzar! Por favor presentarse en el Escenario Principal.", type: "alert" as const },
    { text: "Inscripciones de EA Sports FC 26 cerrando en 5 minutos. ¡Últimos cupos!", type: "warning" as const },
    { text: "Atención: Receso técnico de 10 minutos. Los servidores volverán pronto.", type: "info" as const },
    { text: "¡Felicitaciones al campeón del torneo de League of Legends! Entrega de premios en consolas.", type: "success" as const }
  ];

  const handleLaunchAnnouncement = (textOverride?: string, typeOverride?: Announcement['type']) => {
    const textToUse = textOverride || announcementText;
    if (!textToUse.trim()) return;

    const newAnnouncement: Announcement = {
      id: "announcement-" + Date.now(),
      message: textToUse,
      isActive: true,
      type: typeOverride || announcementType,
      playSound: announcementPlaySound,
      timestamp: Date.now()
    };

    onUpdateState({ activeAnnouncement: newAnnouncement });
    if (!textOverride) setAnnouncementText(''); // reset if typed
  };

  const handleClearAnnouncement = () => {
    onUpdateState({ activeAnnouncement: null });
  };

  const handleAddTournament = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gameName.trim()) return;

    const newTourney: Tournament = {
      id: "tourney-" + Date.now(),
      gameName,
      gameLogo: customGameLogoBase64 || gameLogo,
      time: tourneyTime,
      date: tourneyDate,
      status: tourneyStatus,
      statusLabel: tourneyStatusLabel,
      platform: tourneyPlatform,
      players: tourneyPlayers,
      prize: tourneyPrize,
      room: tourneyRoom,
      color: tourneyColor
    };

    onUpdateState({ schedules: [...state.schedules, newTourney] });
    
    // Reset Form
    setGameName('');
    setCustomGameLogoBase64('');
    setShowAddForm(false);
  };

  const handleDeleteTournament = (id: string) => {
    if (window.confirm("¿Estás seguro de eliminar este torneo?")) {
      const filtered = state.schedules.filter(t => t.id !== id);
      onUpdateState({ schedules: filtered });
    }
  };

  const handleQuickStatusChange = (id: string, newStatus: Tournament['status'], defaultLabel: string) => {
    const updatedSchedules = state.schedules.map(t => {
      if (t.id === id) {
        return { ...t, status: newStatus, statusLabel: defaultLabel };
      }
      return t;
    });
    onUpdateState({ schedules: updatedSchedules });
  };

  // Color map representing selection styles
  const colorBgs: Record<Tournament['color'], string> = {
    red: 'bg-red-500',
    blue: 'bg-blue-500',
    cyan: 'bg-cyan-400',
    purple: 'bg-purple-600',
    amber: 'bg-amber-500',
    emerald: 'bg-emerald-500',
    rose: 'bg-rose-500',
    slate: 'bg-slate-600'
  };

  return (
    <div className="max-w-md mx-auto bg-stone-900 min-h-screen text-stone-100 flex flex-col font-sans relative shadow-2xl">
      
      {/* MOBILE ADMIN TOP BANNER */}
      <header className="bg-stone-950 p-4 border-b border-zinc-800 flex items-center justify-between sticky top-0 z-40 shadow-md">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-1.5 rounded text-white flex items-center justify-center">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-black uppercase tracking-wider text-indigo-400 leading-tight">Esports Central</h1>
            <p className="text-[10px] text-zinc-400 font-mono">PANEL MÓVIL DE LOGÍSTICA</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button 
            onClick={() => onUpdateState({ qrVisible: !state.qrVisible })}
            className={`p-1.5 rounded text-xs gap-1 font-mono flex items-center border ${state.qrVisible ? 'bg-indigo-950 border-indigo-700 text-indigo-300' : 'bg-zinc-800 border-zinc-700 text-zinc-400'}`}
            title="Activar QR administrativo en la Pantalla Gigante"
          >
            {state.qrVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            QR
          </button>
          
          <button 
            onClick={onResetState}
            className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 border border-zinc-750 text-stone-300"
            title="Reiniciar a datos demo por defecto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* DIRECT SCREEN LINK ACCELERATOR BANNER */}
      <div className="bg-gradient-to-r from-cyan-950/45 to-indigo-950/45 px-4 py-2.5 border-b border-zinc-800 flex items-center justify-between gap-2.5 select-none">
        <div className="flex items-center gap-2">
          <Tv className="w-4 h-4 text-cyan-400 shrink-0 animate-pulse" />
          <div className="text-left">
            <div className="text-[11px] font-extrabold text-stone-200">Pantalla en Vivo (Estadio)</div>
            <div className="text-[9px] text-[#00d2ff] font-mono tracking-tighter">Link para proyectores o TV</div>
          </div>
        </div>
        <button 
          onClick={() => {
            const screenUrl = window.location.origin + '?mode=screen';
            window.open(screenUrl, '_blank');
          }}
          className="px-3 py-1.5 bg-[#00d2ff] hover:bg-[#20e0ff] text-indigo-950 rounded-lg text-[11px] font-black shadow-[0_0_15px_rgba(0,210,255,0.25)] flex items-center gap-1 active:scale-95 transition-all outline-none"
        >
          <span>Entrar Directo</span>
          <Tv className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* TABS NAVIGATION BAR (Large touch targets, 44px minimum) */}
      <nav className="bg-stone-950/80 backdrop-blur border-b border-zinc-850 grid grid-cols-3">
        <button 
          onClick={() => setActiveTab('tournaments')}
          className={`py-3 text-center flex flex-col items-center justify-center gap-1 border-b-2 text-xs font-bold transition-colors ${activeTab === 'tournaments' ? 'border-indigo-500 text-indigo-400 bg-zinc-900/40' : 'border-transparent text-zinc-400 hover:text-stone-200'}`}
        >
          <Gamepad2 className="w-4 h-4" />
          <span>Torneos</span>
        </button>
        <button 
          onClick={() => setActiveTab('announcements')}
          className={`py-3 text-center flex flex-col items-center justify-center gap-1 border-b-2 text-xs font-bold transition-colors ${activeTab === 'announcements' ? 'border-indigo-500 text-indigo-400 bg-zinc-900/40' : 'border-transparent text-zinc-400 hover:text-stone-200'}`}
        >
          <Megaphone className="w-4 h-4" />
          <span>Lanzar Avisos</span>
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          className={`py-3 text-center flex flex-col items-center justify-center gap-1 border-b-2 text-xs font-bold transition-colors ${activeTab === 'settings' ? 'border-indigo-500 text-indigo-400 bg-zinc-900/40' : 'border-transparent text-zinc-400 hover:text-stone-200'}`}
        >
          <Sliders className="w-4 h-4" />
          <span>Ajustes Escena</span>
        </button>
      </nav>

      {/* MAIN ADMIN WORKSPACE */}
      <main className="flex-grow p-4 overflow-y-auto pb-24">
        
        {/* TAB 1: TOURNAMENTS MANAGER */}
        {activeTab === 'tournaments' && (
          <div className="space-y-4">
            
            {/* Action launcher */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-mono tracking-wider text-zinc-400 uppercase">
                CRONOGRAMA ({state.schedules.length})
              </span>
              <button 
                onClick={() => {
                  setCustomGameLogoBase64('');
                  setShowAddForm(!showAddForm);
                }}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-bold rounded-lg flex items-center gap-1 shadow-md transition-all"
              >
                <Plus className="w-4 h-4" />
                Cargar Torneo
              </button>
            </div>

            {/* QUICK FORM: CREATE TOURNAMENT */}
            <AnimatePresence>
              {showAddForm && (
                <motion.form 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleAddTournament}
                  className="bg-stone-950 p-4 rounded-xl border border-indigo-500/20 space-y-3.5 text-left"
                >
                  <h3 className="text-xs font-mono font-black text-indigo-400 uppercase tracking-widest flex items-center justify-between">
                    <span>NUEVO TORNEO DE JUEGO</span>
                    <button type="button" onClick={() => setShowAddForm(false)} className="text-zinc-500 text-xs">Cerrar</button>
                  </h3>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">Nombre del Juego</label>
                      <input 
                        type="text" 
                        required
                        value={gameName}
                        onChange={(e) => setGameName(e.target.value)}
                        placeholder="Ej. Valorant Cup"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                        id="tourney-gamename-input"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">Logo / Preset</label>
                      <select 
                        value={gameLogo}
                        onChange={(e) => {
                          setGameLogo(e.target.value);
                          setCustomGameLogoBase64(''); // Clear uploaded
                        }}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-xs text-white"
                      >
                        {GAME_PRESETS.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">O subí logo (.png/.jpg)</label>
                      <button 
                        type="button"
                        onClick={() => uploadGameLogoInputRef.current?.click()}
                        className={`w-full text-xs font-bold py-1.5 rounded flex items-center justify-center gap-1 border border-dashed ${customGameLogoBase64 ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60' : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border-zinc-700'}`}
                      >
                        <Upload className="w-3.5 h-3.5" />
                        {customGameLogoBase64 ? "Cargado" : "Examinar"}
                      </button>
                      <input 
                        type="file"
                        accept="image/*"
                        ref={uploadGameLogoInputRef}
                        onChange={(e) => handleFileChange(e, 'tournament')}
                        className="hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">Horario De Inicio</label>
                      <input 
                        type="text" 
                        required
                        value={tourneyTime}
                        onChange={(e) => setTourneyTime(e.target.value)}
                        placeholder="Ej. 16:30 o 19:15"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-sm text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">Día / Fecha</label>
                      <input 
                        type="text" 
                        value={tourneyDate}
                        onChange={(e) => setTourneyDate(e.target.value)}
                        placeholder="Ej. Hoy o Sábado"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-sm text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">Estado Inicial</label>
                      <select 
                        value={tourneyStatus}
                        onChange={(e) => {
                          const s = e.target.value as Tournament['status'];
                          setTourneyStatus(s);
                          // Auto match label suggestions
                          if (s === 'active') setTourneyStatusLabel('¡EN CURSO!');
                          if (s === 'registering') setTourneyStatusLabel('Inscripciones Abiertas');
                          if (s === 'upcoming') setTourneyStatusLabel('Chequeo Equipos');
                          if (s === 'completed') setTourneyStatusLabel('Finalizado');
                          if (s === 'semis') setTourneyStatusLabel('Semifinal Directo');
                          if (s === 'finals') setTourneyStatusLabel('Gran Final');
                        }}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-xs text-white"
                      >
                        <option value="upcoming">Upcoming</option>
                        <option value="registering">Registering</option>
                        <option value="active">Active/Live</option>
                        <option value="semis">Semifinals</option>
                        <option value="finals">Finals</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">Etiqueta de Estado</label>
                      <input 
                        type="text" 
                        required
                        value={tourneyStatusLabel}
                        onChange={(e) => setTourneyStatusLabel(e.target.value)}
                        placeholder="Ej. ¡EN VIVO - CUARTOS!"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-sm text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">Plataforma</label>
                      <select 
                        value={tourneyPlatform}
                        onChange={(e) => setTourneyPlatform(e.target.value as Tournament['platform'])}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-xs text-white"
                      >
                        <option value="PC">PC Gamer</option>
                        <option value="PS5">Playstation 5</option>
                        <option value="Xbox Series">Xbox Series</option>
                        <option value="Switch">Nintendo Switch</option>
                        <option value="Móvil">Dispositivos Móviles</option>
                        <option value="Multiplataforma">Multiplataforma</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">Jugadores / Formas</label>
                      <input 
                        type="text" 
                        required
                        value={tourneyPlayers}
                        onChange={(e) => setTourneyPlayers(e.target.value)}
                        placeholder="Ej. 1v1 o 5v5"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-xs text-white"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">Ubicación / Sala</label>
                      <input 
                        type="text" 
                        required
                        value={tourneyRoom}
                        onChange={(e) => setTourneyRoom(e.target.value)}
                        placeholder="Ej. Arena PC o Zona Consolas"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1.5">Color del Indicador Visual</label>
                      <div className="flex flex-wrap gap-2">
                        {(Object.keys(colorBgs) as Tournament['color'][]).map((col) => (
                          <button 
                            key={col}
                            type="button"
                            onClick={() => setTourneyColor(col)}
                            className={`w-7 h-7 rounded-full ${colorBgs[col]} flex items-center justify-center border-2 ${tourneyColor === col ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-80'}`}
                          >
                            {tourneyColor === col && <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 active:scale-98 font-bold text-xs uppercase text-white rounded-lg transition-transform mt-2 flex items-center justify-center gap-1 shadow"
                  >
                    <Sparkles className="w-4 h-4" />
                    AGREGAR A CRONOGRAMA DIRECTO
                  </button>
                </motion.form>
              )}
            </AnimatePresence>

            {/* LIST OF CURRENT CONFIGURED TOURNAMENTS */}
            <div className="space-y-3">
              {state.schedules.map((tournament) => (
                <div 
                  key={tournament.id}
                  className="bg-stone-950 p-3 rounded-xl border border-zinc-805 flex flex-col gap-3 text-left shadow"
                >
                  {/* Top line with metadata */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="relative">
                        <GameLogo logoId={tournament.gameLogo} className="w-10 h-10 rounded-lg" />
                        <span className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ${colorBgs[tournament.color]} border border-stone-950`}></span>
                      </div>
                      <div>
                        <h4 className="font-extrabold text-white text-sm uppercase leading-tight">
                          {tournament.gameName}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[9px] font-mono text-zinc-400">
                          <span className="text-indigo-400">{tournament.time}</span>
                          <span>•</span>
                          <span>{tournament.platform}</span>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => handleDeleteTournament(tournament.id)}
                      className="p-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-red-400 hover:border-red-900 active:scale-90 transition-colors"
                      title="Eliminar Torneo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Status pills selector (Instant click trigger!) */}
                  <div>
                    <span className="block text-[9px] font-mono text-zinc-500 uppercase mb-1">Estado de la transmisión / Etapa</span>
                    <div className="grid grid-cols-3 gap-1">
                      
                      <button 
                        onClick={() => handleQuickStatusChange(tournament.id, 'registering', 'Inscripciones Abiertas')}
                        className={`px-1.5 py-1 rounded text-[10px] font-bold border transition-colors ${tournament.status === 'registering' ? 'bg-emerald-950 border-emerald-800 text-emerald-400' : 'bg-zinc-900 border-zinc-800/80 text-zinc-400'}`}
                      >
                        Registro
                      </button>

                      <button 
                        onClick={() => handleQuickStatusChange(tournament.id, 'active', '¡EN VIVO!')}
                        className={`px-1.5 py-1 rounded text-[10px] font-bold border transition-colors ${tournament.status === 'active' ? 'bg-red-950 border-red-800 text-red-400 font-black animate-pulse' : 'bg-zinc-900 border-zinc-800/80 text-zinc-400'}`}
                      >
                        ● EN CURSO
                      </button>

                      <button 
                        onClick={() => handleQuickStatusChange(tournament.id, 'semis', 'Semifinales')}
                        className={`px-1.5 py-1 rounded text-[10px] font-bold border transition-colors ${tournament.status === 'semis' ? 'bg-orange-950 border-orange-850 text-orange-400' : 'bg-zinc-900 border-zinc-800/80 text-zinc-400'}`}
                      >
                        Semis
                      </button>

                      <button 
                        onClick={() => handleQuickStatusChange(tournament.id, 'finals', 'Gran Final')}
                        className={`px-1.5 py-1 rounded text-[10px] font-bold border transition-colors ${tournament.status === 'finals' ? 'bg-yellow-950 border-yellow-850 text-yellow-400' : 'bg-zinc-900 border-zinc-800/80 text-zinc-400'}`}
                      >
                        Final
                      </button>

                      <button 
                        onClick={() => handleQuickStatusChange(tournament.id, 'upcoming', 'Chequeando')}
                        className={`px-1.5 py-1 rounded text-[10px] font-bold border transition-colors ${tournament.status === 'upcoming' ? 'bg-blue-950 border-blue-800 text-blue-400' : 'bg-zinc-900 border-zinc-800/80 text-zinc-400'}`}
                      >
                        Próx.
                      </button>

                      <button 
                        onClick={() => handleQuickStatusChange(tournament.id, 'completed', 'Finalizado')}
                        className={`px-1.5 py-1 rounded text-[10px] font-bold border transition-colors ${tournament.status === 'completed' ? 'bg-zinc-800 border-zinc-700 text-zinc-300' : 'bg-zinc-900 border-zinc-800/80 text-zinc-400'}`}
                      >
                        Completado
                      </button>

                    </div>
                  </div>

                  {/* Detail specs inline preview */}
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-zinc-400 bg-zinc-900/40 p-2 rounded border border-zinc-800/50">
                    <div className="flex items-center gap-1">
                      <Gamepad2 className="w-3 h-3 text-zinc-500" />
                      <span>Formato:</span>
                      <strong className="text-zinc-200 truncate">{tournament.players}</strong>
                    </div>

                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-zinc-500" />
                      <span>Sala:</span>
                      <strong className="text-zinc-200 truncate">{tournament.room}</strong>
                    </div>
                  </div>

                </div>
              ))}
            </div>

          </div>
        )}

        {/* TAB 2: ANNOUNCEMENTS CONTROLLER */}
        {activeTab === 'announcements' && (
          <div className="space-y-4 text-left">
            <div>
              <h3 className="text-xs font-bold font-mono tracking-wider text-zinc-400 uppercase mb-2">
                MENSAJE EN PANTALLA GIGANTE
              </h3>
              
              <div className="space-y-4 bg-stone-950 p-4 rounded-xl border border-zinc-800 shadow">
                
                {/* Active alert flag */}
                {state.activeAnnouncement?.isActive ? (
                  <div className="bg-red-950/40 border border-red-800 p-3 rounded-lg flex items-start gap-2.5">
                    <AlertOctagon className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5 animate-bounce" />
                    <div className="flex-grow">
                      <span className="text-[10px] font-mono font-bold text-red-400 block uppercase">AVISO ACTIVO AHORA:</span>
                      <p className="text-sm font-bold text-white leading-snug mt-1 text-left">
                        "{state.activeAnnouncement.message}"
                      </p>
                      
                      <div className="flex items-center gap-3 mt-3">
                        <button 
                          onClick={handleClearAnnouncement}
                          className="px-2.5 py-1 rounded bg-red-650 hover:bg-red-600 font-bold text-xs text-white uppercase active:scale-95 transition-all shadow"
                        >
                          Quitar Aviso De Pantalla
                        </button>
                        
                        <span className="text-[9px] font-mono text-zinc-500">
                          {state.activeAnnouncement.playSound ? "📢 Audio habilitado" : "🔇 Sin audio"}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-zinc-900/50 border border-dashed border-zinc-850 text-center py-4 rounded-lg text-zinc-500 text-xs font-mono">
                    Ningún aviso o alerta activo en este instante.
                  </div>
                )}

                {/* Form fields */}
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">Escribir Mensaje Personalizado</label>
                    <textarea 
                      value={announcementText}
                      onChange={(e) => setAnnouncementText(e.target.value)}
                      placeholder="Ej. Sorteo de hardware en el stand de patrocinador a las 18:00hs..."
                      rows={3}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50"
                      id="announcement-textarea"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">Color / Prioridad</label>
                      <select 
                        value={announcementType}
                        onChange={(e) => setAnnouncementType(e.target.value as Announcement['type'])}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none"
                      >
                        <option value="warning">Advertencia (Rojo/Nara)</option>
                        <option value="alert">Alerta Emergencia (Flashing)</option>
                        <option value="info">Info General (Gris/Azul)</option>
                        <option value="success">Éxito (Verde)</option>
                      </select>
                    </div>

                    <div className="flex flex-col justify-end">
                      <button 
                        type="button"
                        onClick={() => setAnnouncementPlaySound(!announcementPlaySound)}
                        className={`w-full py-1.5 px-2 rounded text-xs font-bold border flex items-center justify-center gap-1.5 select-none transition-colors ${announcementPlaySound ? 'bg-indigo-950 border-indigo-800 text-indigo-300' : 'bg-neutral-900 border-neutral-800 text-neutral-500'}`}
                      >
                        {announcementPlaySound ? <Volume2 className="w-4 h-4 animate-pulse" /> : <VolumeX className="w-4 h-4" />}
                        {announcementPlaySound ? "Hablar Aviso (TTS)" : "Mensaje Silencioso"}
                      </button>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleLaunchAnnouncement()}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 font-bold text-xs uppercase text-white rounded-lg transition-transform mt-1.5 flex items-center justify-center gap-1 shadow-md"
                  >
                    <Bell className="w-4 h-4" />
                    Enviar Aviso Directo
                  </button>
                </div>

              </div>
            </div>

            {/* PRESET LAUNCHERS */}
            <div>
              <h4 className="text-xs font-bold font-mono tracking-wider text-zinc-400 uppercase mb-2">
                PLANTILLAS RÁPIDAS (Tocar para lanzar)
              </h4>

              <div className="space-y-2">
                {announcementPresets.map((preset, index) => (
                  <button
                    key={index}
                    onClick={() => handleLaunchAnnouncement(preset.text, preset.type)}
                    className="w-full bg-neutral-950 text-left border border-zinc-805 hover:border-indigo-500/40 p-3 rounded-lg text-xs leading-normal active:scale-99 transition-all flex items-start gap-2 group block"
                  >
                    <span className="p-1 rounded bg-indigo-600/10 text-indigo-400 group-hover:bg-indigo-600/20">
                      <Check className="w-3 h-3" />
                    </span>
                    <div>
                      <p className="text-stone-300 font-medium">{preset.text}</p>
                      <span className="text-[8px] font-mono text-zinc-500 uppercase mt-1 block">TIPO: {preset.type} • REPRODUCTOR TTS</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: CUSTOM SYSTEM SETTINGS */}
        {activeTab === 'settings' && (
          <div className="space-y-4 text-left">
            
            <div className="space-y-4 bg-stone-950 p-4 rounded-xl border border-zinc-805 shadow">
              <h3 className="text-xs font-mono font-black text-indigo-400 uppercase tracking-widest pb-2 border-b border-zinc-850">
                CONFIGURACIÓN VISUAL DEL EVENTO
              </h3>

              {/* Event title */}
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">Título de la Pantalla Principal</label>
                  <input 
                    type="text" 
                    value={state.eventTitle}
                    onChange={(e) => onUpdateState({ eventTitle: e.target.value })}
                    placeholder="Ej. ARENA PRO GAMING 2026"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-sm font-bold text-white focus:outline-none focus:border-indigo-500"
                    id="setting-event-title"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">Subtítulo Descriptivo</label>
                  <input 
                    type="text" 
                    value={state.eventSubtitle}
                    onChange={(e) => onUpdateState({ eventSubtitle: e.target.value })}
                    placeholder="Ej. CRONOGRAMA DE ESCENARIOS Y STREAM"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none"
                    id="setting-event-subtitle"
                  />
                </div>

                {/* Event logo picker */}
                <div>
                  <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">Logo del Evento (.png / .jpg)</label>
                  <div className="flex items-center gap-3">
                    {state.eventLogoUrl ? (
                      <div className="relative group">
                        <img 
                          src={state.eventLogoUrl} 
                          alt="Logo cargado" 
                          className="w-12 h-12 rounded object-contain border border-zinc-800 bg-black"
                          referrerPolicy="no-referrer"
                        />
                        <button 
                          onClick={() => onUpdateState({ eventLogoUrl: '' })}
                          className="absolute -top-1 -right-1 p-0.5 rounded-full bg-red-650 text-white"
                          title="Volver a logo por defecto"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded bg-indigo-950 flex items-center justify-center text-indigo-400 border border-indigo-900/50">
                        <Image className="w-5 h-5" />
                      </div>
                    )}
                    
                    <button 
                      type="button"
                      onClick={() => uploadLogoInputRef.current?.click()}
                      className="px-3 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-750 text-xs font-bold text-zinc-200 flex items-center gap-1.5 shadow"
                    >
                      <Upload className="w-3.5 h-3.5 text-zinc-400" />
                      Subir Imagen
                    </button>
                    <input 
                      type="file"
                      accept="image/*"
                      ref={uploadLogoInputRef}
                      onChange={(e) => handleFileChange(e, 'event')}
                      className="hidden"
                    />
                    
                    <span className="text-[9px] text-zinc-500 font-mono leading-none">Auto-ajustable</span>
                  </div>
                </div>
              </div>
            </div>

            {/* THEME SELECTOR */}
            <div className="bg-stone-950 p-4 rounded-xl border border-zinc-805 shadow">
              <h3 className="text-xs font-mono font-black text-indigo-400 uppercase tracking-widest pb-2 border-b border-zinc-850 mb-3">
                PALETA DE COLORES DE PANTALLA
              </h3>

              <div className="space-y-2">
                {DEFAULT_THEMES.map((theme) => (
                  <button 
                    key={theme.id}
                    onClick={() => onUpdateState({ backgroundTheme: theme.id as any })}
                    className={`w-full p-3 rounded-lg border text-left text-xs font-bold flex items-center justify-between transition-all active:scale-99 ${state.backgroundTheme === theme.id ? 'bg-indigo-950/40 border-indigo-500 text-indigo-300' : 'bg-neutral-900 border-zinc-850 hover:bg-zinc-850/40 text-stone-300'}`}
                  >
                    <span>{theme.name}</span>
                    {state.backgroundTheme === theme.id && <Check className="w-4 h-4 text-indigo-400" />}
                  </button>
                ))}
              </div>
            </div>

            {/* TRANSMISIONES DE VIDEO / GIF Y ANUNCIOS */}
            <div className="bg-stone-950 p-4 rounded-xl border border-zinc-805 shadow space-y-3.5">
              <h3 className="text-xs font-mono font-black text-indigo-400 uppercase tracking-widest pb-2 border-b border-zinc-850 flex items-center justify-between">
                <span>REPRODUCTOR DE GIF / VIDEO EN PANTALLA GIGANTE</span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-900 text-[8px] font-bold text-indigo-300 uppercase animate-pulse">FONDO ACTIVO</span>
              </h3>

              {state.isVideoPlaying ? (
                <div className="bg-emerald-950/40 border border-emerald-805 p-3 rounded-lg flex flex-col gap-2">
                  <span className="text-[10px] font-mono font-bold text-emerald-400 block uppercase">⚡ ARCHIVO REPRODUCIÉNDOSE:</span>
                  <p className="text-xs text-stone-200 truncate font-mono">
                    {state.videoUrl}
                  </p>
                  <button
                    type="button"
                    onClick={() => onUpdateState({ isVideoPlaying: false })}
                    className="w-full py-2 bg-red-650 hover:bg-red-750 text-white font-extrabold text-xs uppercase rounded transition-colors active:scale-98"
                  >
                    Ocultar GIF / Video de la Pantalla
                  </button>
                </div>
              ) : (
                <div className="bg-zinc-900/40 border border-dashed border-zinc-800 text-center py-2.5 rounded-lg text-zinc-500 text-xs font-mono">
                  Mostrando Cronogramas y Torneos Activos
                </div>
              )}

              {/* LOCAL GIF FILE UPLOAD ENGINE WITH DRAG & DROP */}
              <div className="space-y-2">
                <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Cargar Archivo GIF Local</label>
                <div 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => !isUploadingGif && gifInputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-xl p-5 text-center transition-all duration-300 flex flex-col items-center justify-center gap-2 select-none ${
                    isUploadingGif 
                      ? 'border-indigo-650 bg-indigo-950/20 cursor-not-allowed'
                      : dragActive 
                      ? 'border-indigo-500 bg-indigo-950/45 cursor-pointer' 
                      : 'border-zinc-800 bg-zinc-900/35 hover:bg-zinc-900/60 hover:border-zinc-700 cursor-pointer'
                  }`}
                >
                  <input 
                    type="file" 
                    ref={gifInputRef}
                    onChange={(e) => handleGifFileChange(e.target.files?.[0])}
                    accept="image/gif"
                    className="hidden"
                    disabled={isUploadingGif}
                  />

                  {isUploadingGif ? (
                    <div className="flex flex-col items-center gap-2.5 py-1">
                      <RefreshCw className="w-7 h-7 text-indigo-400 animate-spin" />
                      <div>
                        <span className="text-xs text-indigo-300 font-mono font-black tracking-wide block animate-pulse">SUBIENDO GIF...</span>
                        <span className="text-[9px] text-zinc-500 block mt-0.5">Guardando archivo en el servidor</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="p-2.5 bg-zinc-950/60 rounded-full border border-zinc-850">
                        <Upload className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div>
                        <span className="text-xs font-black text-stone-200 block">Subí un archivo local (.gif)</span>
                        <span className="text-[9px] text-zinc-500 block mt-1 leading-relaxed">Arrastrá tu archivo aquí o hacé clic para buscar (Máx 150MB)</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Decorative separator */}
              <div className="flex items-center gap-3 py-1">
                <span className="h-px flex-glow bg-zinc-850"></span>
                <span className="text-[8px] font-mono font-black text-zinc-500 tracking-widest uppercase shrink-0">O ingresar enlace externo</span>
                <span className="h-px flex-glow bg-zinc-850"></span>
              </div>

              {/* Custom URL Field */}
              <div>
                <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">Enlace del GIF o Video (Enlace de YouTube o URL directa)</label>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={state.videoUrl || ''}
                    onChange={(e) => onUpdateState({ videoUrl: e.target.value })}
                    placeholder="E.g. enlace de YouTube, URL de .gif o .mp4 público..."
                    className="flex-grow bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (state.videoUrl && state.videoUrl.trim()) {
                        onUpdateState({ isVideoPlaying: true });
                      } else {
                        alert("Por favor, ingresá un enlace primero.");
                      }
                    }}
                    className="px-3 bg-indigo-600 hover:bg-indigo-500 rounded text-xs font-bold text-white transition-all active:scale-95 shrink-0"
                  >
                    Mostrar
                  </button>
                </div>
              </div>

              {/* Fast Presets Loops Selector */}
              <div>
                <span className="block text-[9px] font-mono text-zinc-500 uppercase mb-1.5">Loops Rápidos de Muestra (Un Clic):</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onUpdateState({ 
                      videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-gamers-playing-in-a-cyberpunk-room-41981-large.mp4",
                      isVideoPlaying: true 
                    })}
                    className="px-2 py-1.5 bg-zinc-900 hover:bg-zinc-850 rounded border border-zinc-800 text-[10px] text-zinc-300 font-semibold text-left truncate block active:scale-95 transition-all text-ellipsis"
                  >
                    🕹️ Gamer Cyberpunk Loop
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateState({ 
                      videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-flying-over-a-retro-futuristic-grid-43183-large.mp4",
                      isVideoPlaying: true 
                    })}
                    className="px-2 py-1.5 bg-zinc-900 hover:bg-zinc-850 rounded border border-zinc-800 text-[10px] text-zinc-300 font-semibold text-left truncate block active:scale-95 transition-all text-ellipsis"
                  >
                    🪐 Retro Synthwave Grid
                  </button>
                </div>
              </div>

              {/* Intervals Configurations */}
              <div className="grid grid-cols-2 gap-3 border-t border-zinc-850 pt-3">
                <div>
                  <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">Repetir Video Cada</label>
                  <select
                    value={state.videoInterval || 0}
                    onChange={(e) => onUpdateState({ videoInterval: Number(e.target.value) })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-xs text-white outline-none font-bold"
                  >
                    <option value={0}>Manual (Sólo al tocar)</option>
                    <option value={1}>Cada 1 Minuto (Prueba)</option>
                    <option value={3}>Cada 3 Minutos</option>
                    <option value={5}>Cada 5 Minutos</option>
                    <option value={10}>Cada 10 Minutos</option>
                    <option value={15}>Cada 15 Minutos</option>
                    <option value={30}>Cada 30 Minutos</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">Cerrar Video Solo</label>
                  <select
                    value={state.videoDuration || 0}
                    onChange={(e) => onUpdateState({ videoDuration: Number(e.target.value) })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-xs text-white outline-none font-bold"
                  >
                    <option value={0}>No cerrar solo (Loop eterno)</option>
                    <option value={10}>Duración: 10 segundos</option>
                    <option value={15}>Duración: 15 segundos</option>
                    <option value={30}>Duración: 30 segundos</option>
                    <option value={60}>Duración: 1 minuto</option>
                  </select>
                </div>
              </div>

              <div className="text-[10px] text-zinc-500 font-mono leading-normal bg-zinc-900/30 p-2.5 rounded-lg border border-zinc-800">
                La reproducción cíclica se repetirá de forma autónoma en la Pantalla Gigante según los minutos de intervalo. El temporizador durará los segundos seleccionados para volver al cronograma de torneos automáticamente.
              </div>
            </div>

            {/* PREVIEW WIDGET PRESET AND HELPFUL FOOTNOTE */}
            <div className="bg-neutral-900/40 p-4 rounded-xl border border-zinc-850/50 text-[11px] text-zinc-500 leading-normal">
              <p className="font-bold text-zinc-400 mb-1">💡 Control del QR:</p>
              El QR te sirve para compartir el enlace al celular del equipo organizador. Una vez cargado todo, tocá el botón superior "QR" para ocultarlo en la pantalla gigante y que la estética del evento quede 100% limpia para el público.
            </div>

          </div>
        )}

      </main>

      {/* FOOTER WIDGET */}
      <footer className="mt-auto bg-stone-950 p-3 text-center border-t border-zinc-850 text-[10px] font-mono text-zinc-500">
        <span>CONECTADO AL ESTACION DE COMBATE</span>
      </footer>
    </div>
  );
};
