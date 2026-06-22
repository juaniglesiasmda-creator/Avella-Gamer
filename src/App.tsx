import React, { useState, useEffect } from 'react';
import { 
  Tv, 
  Smartphone, 
  Monitor, 
  AlertTriangle, 
  HelpCircle,
  Wifi,
  WifiOff
} from 'lucide-react';
import { EventState } from './types';
import { GiantScreenView } from './components/GiantScreenView';
import { MobileControlPanel } from './components/MobileControlPanel';

export default function App() {
  const [state, setState] = useState<EventState | null>(null);
  const [offline, setOffline] = useState(false);
  const [viewMode, setViewMode] = useState<'dual' | 'screen' | 'admin'>('screen');

  // Sync state with back-end Express server
  const fetchState = async () => {
    try {
      const res = await fetch('/api/state');
      if (!res.ok) throw new Error('Error al conectar con la API');
      const data = await res.json();
      setState(data);
      setOffline(false);
    } catch (err) {
      console.error('Error al sincronizar estado del evento:', err);
      setOffline(true);
    }
  };

  useEffect(() => {
    // Initial load
    fetchState();
    
    // High-frequency polling (1.5 seconds) to keep multi-device controls in sync
    const interval = setInterval(fetchState, 1500);
    return () => clearInterval(interval);
  }, []);

  // Sync query-params from QR codes directly to set full mobile phone mode
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const modeParam = params.get('mode');
    if (modeParam === 'admin') {
      setViewMode('admin');
    } else if (modeParam === 'screen') {
      setViewMode('screen');
    }
  }, []);

  // Update server state & trigger optimistic UI changes
  const handleUpdateState = async (updates: Partial<EventState>) => {
    if (!state) return;

    // Apply optimistic updates to local state for instant client-side responsiveness
    const optimisticState = { ...state, ...updates };
    setState(optimisticState);

    try {
      const res = await fetch('/api/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.state) {
          setState(data.state);
          setOffline(false);
        }
      }
    } catch (err) {
      console.error('Error enviando actualizaciones de estado:', err);
      setOffline(true);
    }
  };

  // Reset backend back to standard sample values
  const handleResetState = async () => {
    try {
      const res = await fetch('/api/state/reset', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.state) {
          setState(data.state);
          setOffline(false);
        }
      }
    } catch (err) {
      console.error('Error al reiniciar el estado:', err);
    }
  };

  // Quick toggle and reverse toggles
  const handleToggleQrOnScreen = () => {
    if (state) {
      handleUpdateState({ qrVisible: !state.qrVisible });
    }
  };

  // Loading Screen Layout
  if (!state) {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center p-6 text-stone-300">
        <div className="w-12 h-12 rounded-full border-t-2 border-indigo-500 animate-spin mb-4"></div>
        <p className="font-mono text-sm uppercase tracking-wider text-zinc-400">Iniciando Servidor de Cronogramas Gamer...</p>
        {offline && (
          <div className="mt-4 px-3 py-1 bg-red-950/60 border border-red-900 rounded text-xs text-red-400 font-mono">
            Error de conexión - Reintentando sincronización automáticamente
          </div>
        )}
      </div>
    );
  }

  // Render Mobile Admin Mode Directly (when opened as ?mode=admin via QR or toggled)
  if (viewMode === 'admin') {
    return (
      <MobileControlPanel 
        state={state} 
        onUpdateState={handleUpdateState} 
        onResetState={handleResetState} 
      />
    );
  }

  // Render Giant Screen Mode Directly (when connected to computer screen as public view)
  if (viewMode === 'screen') {
    return (
      <div className="relative h-screen max-h-screen overflow-hidden">
        <GiantScreenView 
          state={state} 
          onToggleQr={handleToggleQrOnScreen} 
          onGoToAdmin={() => setViewMode('admin')}
          onUpdateState={handleUpdateState}
        />
        {/* Connection status overlay badge */}
        {offline && (
          <div className="fixed top-2 right-2 bg-red-950 border border-red-800 text-red-400 px-3 py-1 rounded text-[10px] font-mono flex items-center gap-1.5 z-50">
            <WifiOff className="w-3.5 h-3.5" />
            VINCULO CAÍDO (REINTENTANDO)
          </div>
        )}
      </div>
    );
  }

  // DEFAULT VIEW: Beautiful Interative dual simulator configuration
  return (
    <div className="h-screen max-h-screen overflow-hidden bg-stone-950 flex flex-col">
      
      {/* SIMULATOR TOOLBAR HEADER - Only visible in dual split/mock simulator */}
      <div className="bg-neutral-900 border-b border-zinc-800 p-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-stone-200 shrink-0 sticky top-0 z-50 shadow-md">
        
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <div>
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-white">Consola de Control Gamer 360°</h2>
            <p className="text-[10px] text-zinc-400 font-mono">Simulador de Vinculo Multi-dispositivo</p>
          </div>
        </div>

        {/* View mode toggle triggers */}
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setViewMode('dual')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono flex items-center gap-1.5 transition-colors ${viewMode === 'dual' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-zinc-800 hover:bg-zinc-750 text-zinc-400'}`}
          >
            <Monitor className="w-3.5 h-3.5" />
            SIMULACIÓN INTEGRADA
          </button>
          
          <button 
            onClick={() => setViewMode('screen')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono flex items-center gap-1.5 transition-colors ${viewMode === 'screen' ? 'bg-indigo-600 text-white' : 'bg-zinc-800 hover:bg-zinc-750 text-zinc-400'}`}
          >
            <Tv className="w-3.5 h-3.5" />
            SÓLO PANTALLA GIGANTE
          </button>

          <button 
            onClick={() => setViewMode('admin')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono flex items-center gap-1.5 transition-colors ${viewMode === 'admin' ? 'bg-indigo-600 text-white' : 'bg-zinc-800 hover:bg-zinc-750 text-zinc-400'}`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            SÓLO CELULAR
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <div className="flex items-center gap-1">
            {offline ? (
              <span className="text-red-400 flex items-center gap-1">
                <WifiOff className="w-3.5 h-3.5" />
                Desconectado
              </span>
            ) : (
              <span className="text-emerald-400 flex items-center gap-1">
                <Wifi className="w-3.5 h-3.5" />
                Conectado
              </span>
            )}
          </div>
        </div>

      </div>

      {/* THREE-COLUMN LAYOUT SIMULATING BIG SCREEN & SMARTPHONE PAIRING IN REAL-TIME */}
      <div className="flex-grow grid grid-cols-1 lg:grid-cols-12 overflow-hidden bg-stone-950">
        
        {/* Left Section: Giant screen preview (Takes 70% width on Desktop) */}
        <div className="lg:col-span-8 overflow-hidden border-r border-zinc-800/60 flex flex-col justify-between">
          
          {/* Mock Screen Indicator label */}
          <div className="bg-indigo-950/60 border-b border-indigo-900/40 p-2 text-center text-[10px] font-mono text-indigo-300">
            PANTALLA DEL ESTADIO (Conectada a la computadora principal)
          </div>

          <div className="flex-grow">
            <GiantScreenView 
              state={state} 
              onToggleQr={handleToggleQrOnScreen} 
              onGoToAdmin={() => setViewMode('admin')}
              onUpdateState={handleUpdateState}
            />
          </div>
        </div>

        {/* Right Section: Mobile Control container with a gorgeous physical bezel mock outline (Takes 30% width) */}
        <div className="lg:col-span-4 bg-zinc-950 overflow-y-auto pb-12 p-4 flex flex-col items-center justify-start border-t lg:border-t-0 border-zinc-800">
          
          <div className="bg-zinc-900/60 border border-zinc-800 px-3 py-1.5 rounded-full text-[10px] font-mono text-zinc-400 mb-4 text-center">
            PÁGINA CONTROL DEL CELULAR (Simulado)
          </div>

          {/* Smatphone hardware mockup container frame */}
          <div className="w-full max-w-[390px] border-[6px] border-zinc-800 rounded-[44px] overflow-hidden shadow-2xl relative bg-zinc-900">
            {/* Top speaker notch notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-4 bg-zinc-800 rounded-b-2xl z-50 flex items-center justify-center">
              <div className="w-12 h-1 bg-stone-950 rounded-full"></div>
            </div>

            <div className="pt-3">
              <MobileControlPanel 
                state={state} 
                onUpdateState={handleUpdateState} 
                onResetState={handleResetState} 
              />
            </div>
          </div>

          <div className="mt-4 text-center max-w-xs text-[10px] text-zinc-500 font-mono leading-relaxed">
            Podés abrir este mismo panel celular en tu teléfono real escaneando el código QR que se muestra en la pantalla principal. Ambos dispositivos se sincronizan al instante.
          </div>

        </div>

      </div>

    </div>
  );
}
