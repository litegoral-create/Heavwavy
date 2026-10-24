import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  Wifi,
  Battery,
  Shield,
  Zap,
  HardDrive,
  Eye,
  EyeOff,
  Bell,
  CheckCircle2,
  Smartphone,
  ExternalLink,
  RotateCcw,
  Music2,
  Radio,
  Compass,
  Library,
  Search,
  Sparkles,
  Lock,
  Sun,
  Moon,
  Laptop,
  ChevronLeft,
  ChevronRight,
  X,
  History,
  Sliders,
  Disc,
  Flame,
  ArrowRight
} from 'lucide-react';
import {
  formatBytes,
  formatDuration,
  IOS_USER_AGENT,
  IPAD_USER_AGENT,
  AppTheme,
  resolveEffectiveTheme,
  getSystemBarAppearance
} from '../utils/musicBetaCore';

interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  cover: string;
  genre: string;
}

const SAMPLE_TRACKS: Track[] = [
  {
    id: '1',
    title: 'Starboy (feat. Daft Punk)',
    artist: 'The Weeknd',
    album: 'Starboy',
    duration: 230,
    cover: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&w=400&q=80',
    genre: 'R&B / Soul'
  },
  {
    id: '2',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    album: 'After Hours',
    duration: 200,
    cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=400&q=80',
    genre: 'Synthpop'
  },
  {
    id: '3',
    title: 'vampire',
    artist: 'Olivia Rodrigo',
    album: 'GUTS',
    duration: 219,
    cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80',
    genre: 'Pop Rock'
  },
  {
    id: '4',
    title: 'Anti-Hero',
    artist: 'Taylor Swift',
    album: 'Midnights',
    duration: 200,
    cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=400&q=80',
    genre: 'Pop'
  }
];

type SimTab = 'listen' | 'browse' | 'radio' | 'library' | 'search';

interface SimHistoryEntry {
  tab: SimTab;
  query?: string;
  genre?: string;
}

export const AndroidSimulator: React.FC = () => {
  // Navigation History Stack with Session Persistence
  const [historyStack, setHistoryStack] = useState<SimHistoryEntry[]>(() => {
    try {
      const saved = sessionStorage.getItem('sim_history_stack');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [{ tab: 'listen', query: '', genre: 'All' }];
  });

  const [historyIndex, setHistoryIndex] = useState<number>(() => {
    try {
      const saved = sessionStorage.getItem('sim_history_idx');
      if (saved !== null) return parseInt(saved, 10);
    } catch {}
    return 0;
  });

  const [activeTab, setActiveTab] = useState<SimTab>(() => {
    try {
      const saved = sessionStorage.getItem('sim_active_tab');
      if (saved) return saved as SimTab;
    } catch {}
    return 'listen';
  });

  const [searchQuery, setSearchQuery] = useState<string>(() => {
    try {
      return sessionStorage.getItem('sim_search_query') || '';
    } catch {
      return '';
    }
  });

  const [selectedGenre, setSelectedGenre] = useState<string>(() => {
    try {
      return sessionStorage.getItem('sim_selected_genre') || 'All';
    } catch {
      return 'All';
    }
  });

  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(() => {
    try {
      const saved = sessionStorage.getItem('sim_track_idx');
      if (saved !== null) {
        const idx = parseInt(saved, 10);
        if (idx >= 0 && idx < SAMPLE_TRACKS.length) return idx;
      }
    } catch {}
    return 0;
  });

  const [isPlaying, setIsPlaying] = useState<boolean>(() => {
    try {
      const saved = sessionStorage.getItem('sim_is_playing');
      if (saved !== null) return saved === 'true';
    } catch {}
    return true;
  });

  const [currentTime, setCurrentTime] = useState<number>(() => {
    try {
      const saved = sessionStorage.getItem('sim_current_time');
      if (saved !== null) return parseInt(saved, 10);
    } catch {}
    return 42;
  });

  const [screenOff, setScreenOff] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [forcedRefreshRate, setForcedRefreshRate] = useState<number>(120);
  const [selectedUA, setSelectedUA] = useState<'iphone' | 'ipad'>('iphone');
  const [cacheUsedBytes, setCacheUsedBytes] = useState(248 * 1024 * 1024);
  const [currentTimeString, setCurrentTimeString] = useState('12:15');

  const [simTheme, setSimTheme] = useState<AppTheme>(() => {
    try {
      const saved = sessionStorage.getItem('sim_theme');
      if (saved === 'dark' || saved === 'light' || saved === 'system') return saved;
    } catch {}
    return 'dark';
  });

  const [safeAreaProtected, setSafeAreaProtected] = useState<boolean>(() => {
    try {
      const saved = sessionStorage.getItem('sim_safe_area_protected');
      if (saved !== null) return saved === 'true';
    } catch {}
    return true;
  });

  const [showNotchGuide, setShowNotchGuide] = useState<boolean>(false);

  // Automatically sync state to sessionStorage so page refreshes or route changes never cause data loss
  useEffect(() => {
    try {
      sessionStorage.setItem('sim_history_stack', JSON.stringify(historyStack));
      sessionStorage.setItem('sim_history_idx', historyIndex.toString());
      sessionStorage.setItem('sim_active_tab', activeTab);
      sessionStorage.setItem('sim_search_query', searchQuery);
      sessionStorage.setItem('sim_selected_genre', selectedGenre);
      sessionStorage.setItem('sim_track_idx', currentTrackIndex.toString());
      sessionStorage.setItem('sim_is_playing', isPlaying.toString());
      sessionStorage.setItem('sim_current_time', currentTime.toString());
      sessionStorage.setItem('sim_theme', simTheme);
      sessionStorage.setItem('sim_safe_area_protected', safeAreaProtected.toString());
    } catch {}
  }, [historyStack, historyIndex, activeTab, searchQuery, selectedGenre, currentTrackIndex, isPlaying, currentTime, simTheme, safeAreaProtected]);

  // Navigate to a new screen inside the simulator, appending to history stack
  const navigateTo = (tab: SimTab, query?: string, genre?: string) => {
    const nextQuery = query !== undefined ? query : searchQuery;
    const nextGenre = genre !== undefined ? genre : selectedGenre;

    if (tab === activeTab && nextQuery === searchQuery && nextGenre === selectedGenre) {
      return;
    }

    setActiveTab(tab);
    if (query !== undefined) setSearchQuery(query);
    if (genre !== undefined) setSelectedGenre(genre);

    const newEntry: SimHistoryEntry = { tab, query: nextQuery, genre: nextGenre };
    const newStack = [...historyStack.slice(0, historyIndex + 1), newEntry];
    setHistoryStack(newStack);
    setHistoryIndex(newStack.length - 1);
  };

  // Back in simulated history stack (mirrors Android back-stack or browser history)
  const handleGoBack = () => {
    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1;
      const target = historyStack[prevIdx];
      setHistoryIndex(prevIdx);
      setActiveTab(target.tab);
      if (target.query !== undefined) setSearchQuery(target.query);
      if (target.genre !== undefined) setSelectedGenre(target.genre);
    }
  };

  // Forward in simulated history stack
  const handleGoForward = () => {
    if (historyIndex < historyStack.length - 1) {
      const nextIdx = historyIndex + 1;
      const target = historyStack[nextIdx];
      setHistoryIndex(nextIdx);
      setActiveTab(target.tab);
      if (target.query !== undefined) setSearchQuery(target.query);
      if (target.genre !== undefined) setSelectedGenre(target.genre);
    }
  };

  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < historyStack.length - 1;

  const handleResetSimulatorState = () => {
    try {
      sessionStorage.removeItem('sim_history_stack');
      sessionStorage.removeItem('sim_history_idx');
      sessionStorage.removeItem('sim_active_tab');
      sessionStorage.removeItem('sim_search_query');
      sessionStorage.removeItem('sim_selected_genre');
      sessionStorage.removeItem('sim_track_idx');
      sessionStorage.removeItem('sim_current_time');
      sessionStorage.removeItem('sim_safe_area_protected');
    } catch {}
    setHistoryStack([{ tab: 'listen', query: '', genre: 'All' }]);
    setHistoryIndex(0);
    setActiveTab('listen');
    setSearchQuery('');
    setSelectedGenre('All');
    setCurrentTrackIndex(0);
    setCurrentTime(0);
    setSafeAreaProtected(true);
    setShowNotchGuide(false);
  };

  const effectiveTheme = resolveEffectiveTheme(simTheme, true);
  const isLight = effectiveTheme === 'light';
  const systemBarConfig = getSystemBarAppearance(effectiveTheme);

  const currentTrack = SAMPLE_TRACKS[currentTrackIndex];

  // Simulated clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeString(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    };
    updateTime();
    const timer = setInterval(updateTime, 30000);
    return () => clearInterval(timer);
  }, []);

  // Playback timer (runs even when screenOff is true, simulating screen-off background playback)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= currentTrack.duration) {
            setCurrentTrackIndex((t) => (t + 1) % SAMPLE_TRACKS.length);
            return 0;
          }
          return prev + 1;
        });
        // Slowly simulate cache buffering
        setCacheUsedBytes((prev) => Math.min(480 * 1024 * 1024, prev + 1024 * 64));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentTrack.duration]);

  const handlePlayPause = () => setIsPlaying(!isPlaying);
  const handleNext = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % SAMPLE_TRACKS.length);
    setCurrentTime(0);
  };
  const handlePrev = () => {
    if (currentTime > 3) {
      setCurrentTime(0);
    } else {
      setCurrentTrackIndex((prev) => (prev - 1 + SAMPLE_TRACKS.length) % SAMPLE_TRACKS.length);
      setCurrentTime(0);
    }
  };

  const handleClearCache = () => {
    setCacheUsedBytes(45 * 1024 * 1024);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Column: Android 14 Phone Simulator */}
      <div className="lg:col-span-6 flex flex-col items-center">
        {/* Device Frame */}
        <div className="relative w-[340px] sm:w-[380px] h-[740px] bg-neutral-950 rounded-[48px] p-3 shadow-2xl border-[6px] border-neutral-800 ring-1 ring-white/10 select-none overflow-hidden flex flex-col">
          {/* Edge-to-Edge Bezel Screen Surface */}
          <div
            className={`relative w-full h-full rounded-[38px] overflow-hidden flex flex-col transition-colors duration-300 ${
              isLight ? 'bg-white text-neutral-900' : 'bg-black text-white'
            }`}
          >
            {/* Top Status Bar (Edge-to-Edge with transparent styling) */}
            <div
              className={`relative z-40 w-full h-11 px-6 flex items-center justify-between text-xs bg-transparent transition-colors duration-300 ${
                isLight ? 'text-black' : 'text-white/90'
              }`}
            >
              <span className="font-semibold tracking-tight">{currentTimeString}</span>

              {/* Camera Punch-Hole */}
              <div className="absolute left-1/2 -translate-x-1/2 top-2.5 w-4 h-4 bg-black rounded-full ring-2 ring-neutral-800 flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-neutral-900 rounded-full"></div>
              </div>

              {/* Status Icons: 120Hz badge, Wi-Fi high perf, Battery */}
              <div className="flex items-center space-x-2">
                <span
                  className={`px-1.5 py-0.5 text-[9px] font-black uppercase rounded ${
                    isLight
                      ? 'bg-rose-50 text-rose-600 border border-rose-300'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {forcedRefreshRate}Hz
                </span>
                <Wifi className={`w-3.5 h-3.5 ${isLight ? 'text-neutral-800' : 'text-white/80'}`} />
                <div className="flex items-center space-x-0.5">
                  <span className={`text-[10px] font-mono ${isLight ? 'text-neutral-700 font-semibold' : 'text-neutral-300'}`}>
                    92%
                  </span>
                  <Battery className={`w-4 h-4 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
                </div>
              </div>
            </div>

            {/* Visual Safe Area & Notch Inset Boundary Guide */}
            {showNotchGuide && (
              <div className="absolute top-0 inset-x-0 h-11 pointer-events-none z-50 border-b-2 border-dashed border-rose-500 bg-rose-500/10 flex items-end justify-between px-3 pb-0.5">
                <span className="text-[8px] font-mono font-bold text-rose-400 bg-black/80 px-1 rounded shadow">
                  env(safe-area-inset-top): 44px
                </span>
                <span className="text-[8px] font-mono font-bold text-cyan-400 bg-black/80 px-1 rounded shadow">
                  Cutout Inset Cleared
                </span>
              </div>
            )}

            {/* Overlap Warning Badge when Safe Area is disabled to simulate defect */}
            {!safeAreaProtected && !screenOff && (
              <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 bg-rose-600/95 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-lg border border-white/20 pointer-events-none flex items-center space-x-1 animate-pulse">
                <span>⚠️ Notch Overlap Active (Defect State)</span>
              </div>
            )}

            {/* Notification Drawer Shade (Pull down or toggle) */}
            {notificationOpen && (
              <div
                className={`absolute inset-x-0 top-11 z-50 border-b p-4 transition-all duration-300 shadow-2xl ${
                  isLight
                    ? 'bg-neutral-100/98 backdrop-blur-xl border-neutral-300 text-neutral-900'
                    : 'bg-neutral-900/95 backdrop-blur-xl border-white/10 text-white'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-2">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                    <span className="font-semibold text-rose-500">MediaPlaybackService (Foreground)</span>
                  </div>
                  <span className={`text-[10px] font-mono ${isLight ? 'text-neutral-500' : 'text-white/50'}`}>
                    NotificationCompat.MediaStyle
                  </span>
                </div>

                {/* Android 14 Media Card */}
                <div
                  className={`rounded-2xl p-3.5 border shadow-lg ${
                    isLight
                      ? 'bg-white border-neutral-200 text-neutral-900'
                      : 'bg-neutral-800/90 border-white/10 text-white'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={currentTrack.cover}
                      alt={currentTrack.title}
                      className="w-14 h-14 rounded-xl object-cover shadow-md"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold truncate">{currentTrack.title}</h4>
                      <p className={`text-xs truncate ${isLight ? 'text-neutral-600' : 'text-white/60'}`}>
                        {currentTrack.artist} — Apple Music
                      </p>

                      {/* Scrubber in notification */}
                      <div className="mt-2 flex items-center space-x-2">
                        <div className={`flex-1 h-1 rounded-full overflow-hidden ${isLight ? 'bg-neutral-200' : 'bg-white/20'}`}>
                          <div
                            className="h-full bg-rose-500 rounded-full transition-all duration-300"
                            style={{ width: `${(currentTime / currentTrack.duration) * 100}%` }}
                          />
                        </div>
                        <span className={`text-[10px] font-mono ${isLight ? 'text-neutral-500' : 'text-white/50'}`}>
                          {formatDuration(currentTime)} / {formatDuration(currentTrack.duration)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Remote Media Controls */}
                  <div className={`mt-3 flex items-center justify-center space-x-6 pt-2 border-t ${isLight ? 'border-neutral-100' : 'border-white/5'}`}>
                    <button
                      onClick={handlePrev}
                      className={`p-1.5 transition active:scale-95 ${isLight ? 'text-neutral-600 hover:text-black' : 'text-white/70 hover:text-white'}`}
                      aria-label="Previous Track"
                    >
                      <SkipBack className="w-4 h-4 fill-current" />
                    </button>
                    <button
                      onClick={handlePlayPause}
                      className={`p-2.5 rounded-full transition active:scale-95 ${
                        isLight ? 'bg-black text-white hover:bg-neutral-800' : 'bg-white text-black hover:bg-neutral-200'
                      }`}
                      aria-label={isPlaying ? 'Pause' : 'Play'}
                    >
                      {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                    </button>
                    <button
                      onClick={handleNext}
                      className={`p-1.5 transition active:scale-95 ${isLight ? 'text-neutral-600 hover:text-black' : 'text-white/70 hover:text-white'}`}
                      aria-label="Next Track"
                    >
                      <SkipForward className="w-4 h-4 fill-current" />
                    </button>
                  </div>
                </div>

                <div className="mt-2 text-center">
                  <button
                    onClick={() => setNotificationOpen(false)}
                    className={`text-[10px] transition ${isLight ? 'text-neutral-500 hover:text-black' : 'text-white/40 hover:text-white/80'}`}
                  >
                    ▲ Close Notification Shade
                  </button>
                </div>
              </div>
            )}

            {/* SCREEN-OFF MODE OVERLAY */}
            {screenOff ? (
              <div className="absolute inset-0 z-30 bg-black flex flex-col items-center justify-center p-6 text-center text-white">
                <div className="w-16 h-16 rounded-full bg-neutral-900/80 border border-neutral-800 flex items-center justify-center mb-4">
                  <Lock className="w-7 h-7 text-neutral-500" />
                </div>
                <h3 className="text-sm font-semibold text-neutral-300">Display Turned Off</h3>
                <p className="text-xs text-neutral-500 mt-1 max-w-[220px]">
                  Audio pipeline running via <code className="text-rose-400">PARTIAL_WAKE_LOCK</code> & Wi-Fi lock
                </p>

                <div className="mt-6 p-3 rounded-xl bg-neutral-900/60 border border-neutral-800/80 w-full max-w-[260px]">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></div>
                    <div className="text-left flex-1 min-w-0">
                      <p className="text-xs font-medium text-white truncate">{currentTrack.title}</p>
                      <p className="text-[10px] text-neutral-400 truncate">{currentTrack.artist}</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setScreenOff(false)}
                  className="mt-8 px-4 py-2 rounded-full bg-neutral-800 text-xs text-neutral-300 hover:bg-neutral-700 hover:text-white transition"
                >
                  Turn Screen On
                </button>
              </div>
            ) : (
              /* SCREEN ON: Apple Music Beta iOS Mobile WebView Simulator */
              <div
                className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${
                  isLight ? 'bg-white' : 'bg-black'
                } ${!safeAreaProtected ? '-mt-11' : ''}`}
              >
                {/* Header Bar with Back/Forward History Controls */}
                <div
                  className={`px-4 pt-1.5 pb-2.5 flex items-center justify-between border-b backdrop-blur-md transition-colors ${
                    isLight
                      ? 'bg-white/90 border-neutral-200'
                      : 'bg-black/60 border-white/5'
                  }`}
                >
                  <div className="flex items-center space-x-1.5">
                    {/* Simulated History Stack Back/Forward Controls */}
                    <div className="flex items-center space-x-0.5 mr-0.5">
                      <button
                        onClick={handleGoBack}
                        disabled={!canGoBack}
                        title="Back in history (Preserves inputs & state)"
                        className={`p-1 rounded-md transition ${
                          canGoBack
                            ? isLight
                              ? 'text-neutral-800 hover:bg-neutral-200 active:scale-90'
                              : 'text-white hover:bg-white/10 active:scale-90'
                            : 'text-neutral-500/30 cursor-not-allowed'
                        }`}
                        aria-label="Back"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleGoForward}
                        disabled={!canGoForward}
                        title="Forward in history"
                        className={`p-1 rounded-md transition ${
                          canGoForward
                            ? isLight
                              ? 'text-neutral-800 hover:bg-neutral-200 active:scale-90'
                              : 'text-white hover:bg-white/10 active:scale-90'
                            : 'text-neutral-500/30 cursor-not-allowed'
                        }`}
                        aria-label="Forward"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold tracking-wider uppercase text-rose-500 flex items-center space-x-1">
                        <Music2 className="w-2.5 h-2.5 inline mr-1" />
                        Apple Music Beta
                      </span>
                      <h2 className="text-sm font-extrabold tracking-tight capitalize leading-none">{activeTab}</h2>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-mono border ${
                        isLight
                          ? 'bg-neutral-100 text-neutral-600 border-neutral-300'
                          : 'bg-neutral-800 text-neutral-400 border-white/5'
                      }`}
                      title="History stack depth"
                    >
                      Step {historyIndex + 1}/{historyStack.length}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] border ${
                        isLight
                          ? 'bg-neutral-100 text-neutral-700 border-neutral-300'
                          : 'bg-neutral-800 text-neutral-300 border-white/5'
                      }`}
                    >
                      {effectiveTheme === 'light' ? 'Light' : 'Dark'}
                    </span>
                  </div>
                </div>

                {/* WebView Content Area with Persistent State */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 scrollbar-none">
                  {/* TAB 1: LISTEN NOW */}
                  {activeTab === 'listen' && (
                    <div className="space-y-4">
                      {/* Featured Hero Banner */}
                      <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-lg group">
                        <img
                          src={currentTrack.cover}
                          alt={currentTrack.album}
                          className="w-full h-40 object-cover object-center filter brightness-95 transition duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent p-3.5 flex flex-col justify-end text-white">
                          <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">
                            {currentTrack.genre} • Now Playing
                          </span>
                          <h3 className="text-sm font-bold text-white truncate">{currentTrack.title}</h3>
                          <p className="text-[11px] text-neutral-200">{currentTrack.artist}</p>
                        </div>
                      </div>

                      {/* Featured Tracks */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
                            Featured Tracks
                          </h4>
                          <span className="text-[10px] text-rose-500 font-semibold cursor-pointer" onClick={() => navigateTo('browse')}>
                            See All →
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          {SAMPLE_TRACKS.map((t, idx) => {
                            const isCurrent = idx === currentTrackIndex;
                            return (
                              <div
                                key={t.id}
                                onClick={() => {
                                  setCurrentTrackIndex(idx);
                                  setCurrentTime(0);
                                  setIsPlaying(true);
                                }}
                                className={`flex items-center space-x-3 p-2 rounded-xl cursor-pointer transition active:scale-[0.98] ${
                                  isCurrent
                                    ? 'bg-rose-500/15 border border-rose-500/30'
                                    : isLight
                                    ? 'bg-neutral-100 hover:bg-neutral-200/80 border border-neutral-200'
                                    : 'bg-neutral-900/60 hover:bg-neutral-800/80 border border-white/5'
                                }`}
                              >
                                <img src={t.cover} alt={t.title} className="w-10 h-10 rounded-lg object-cover" />
                                <div className="flex-1 min-w-0">
                                  <p className={`text-xs font-semibold truncate ${isCurrent ? 'text-rose-500 font-bold' : isLight ? 'text-neutral-900' : 'text-white'}`}>
                                    {t.title}
                                  </p>
                                  <p className={`text-[10px] truncate ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                    {t.artist}
                                  </p>
                                </div>
                                {isCurrent && isPlaying ? (
                                  <div className="flex items-center space-x-0.5">
                                    <span className="w-1 h-3 bg-rose-500 animate-pulse rounded-full"></span>
                                    <span className="w-1 h-4 bg-rose-500 animate-pulse delay-75 rounded-full"></span>
                                    <span className="w-1 h-2 bg-rose-500 animate-pulse delay-150 rounded-full"></span>
                                  </div>
                                ) : (
                                  <span className={`text-[10px] font-mono ${isLight ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                    {formatDuration(t.duration)}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: BROWSE */}
                  {activeTab === 'browse' && (
                    <div className="space-y-4">
                      {/* Spatial Audio Highlight */}
                      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-rose-600/20 to-purple-600/20 border border-rose-500/30">
                        <div className="flex items-center space-x-1.5 text-rose-500 text-xs font-bold mb-1">
                          <Zap className="w-3.5 h-3.5" />
                          <span>Spatial Audio with Dolby Atmos</span>
                        </div>
                        <p className={`text-[11px] ${isLight ? 'text-neutral-600' : 'text-neutral-300'}`}>
                          Optimized with native 120Hz refresh rate and custom audio buffer.
                        </p>
                      </div>

                      {/* Genre Chips (interactive & preserved) */}
                      <div>
                        <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
                          Explore by Genre
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {['All', 'R&B / Soul', 'Synthpop', 'Pop Rock', 'Pop'].map((g) => (
                            <button
                              key={g}
                              onClick={() => navigateTo('browse', searchQuery, g)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition ${
                                selectedGenre === g
                                  ? 'bg-rose-500 text-white shadow-sm'
                                  : isLight
                                  ? 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 border border-neutral-200'
                                  : 'bg-neutral-900 text-neutral-300 hover:bg-neutral-800 border border-white/5'
                              }`}
                            >
                              {g}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Filtered Track Grid */}
                      <div className="space-y-1.5">
                        {SAMPLE_TRACKS.filter((t) => selectedGenre === 'All' || t.genre === selectedGenre).map((t, idx) => (
                          <div
                            key={t.id}
                            onClick={() => {
                              const originalIdx = SAMPLE_TRACKS.findIndex((item) => item.id === t.id);
                              if (originalIdx !== -1) {
                                setCurrentTrackIndex(originalIdx);
                                setCurrentTime(0);
                                setIsPlaying(true);
                              }
                            }}
                            className={`flex items-center space-x-3 p-2 rounded-xl cursor-pointer transition ${
                              isLight ? 'bg-neutral-100 hover:bg-neutral-200/80' : 'bg-neutral-900/60 hover:bg-neutral-800/80'
                            }`}
                          >
                            <img src={t.cover} alt={t.title} className="w-9 h-9 rounded-lg object-cover" />
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-semibold truncate ${isLight ? 'text-neutral-900' : 'text-white'}`}>
                                {t.title}
                              </p>
                              <p className={`text-[10px] truncate ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                {t.artist} • {t.genre}
                              </p>
                            </div>
                            <Play className="w-3.5 h-3.5 text-rose-500" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TAB 3: RADIO */}
                  {activeTab === 'radio' && (
                    <div className="space-y-3">
                      {/* Live Station 1 */}
                      <div className="p-3.5 rounded-2xl bg-gradient-to-br from-rose-600 via-rose-700 to-amber-700 text-white shadow-md">
                        <div className="flex items-center justify-between mb-2">
                          <span className="px-2 py-0.5 rounded-full bg-white/20 text-[9px] font-bold uppercase tracking-wider flex items-center space-x-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                            <span>LIVE BROADCAST</span>
                          </span>
                          <span className="text-[10px] font-mono text-white/80">98.4K Listening</span>
                        </div>
                        <h3 className="text-base font-black">Apple Music 1</h3>
                        <p className="text-xs text-white/80">The Zane Lowe Show • Live from LA</p>
                        <div className="mt-3 flex items-center justify-between pt-2 border-t border-white/20">
                          <div className="flex items-center space-x-1">
                            <span className="w-1 h-3 bg-white animate-pulse rounded-full"></span>
                            <span className="w-1 h-5 bg-white animate-pulse delay-75 rounded-full"></span>
                            <span className="w-1 h-2 bg-white animate-pulse delay-150 rounded-full"></span>
                            <span className="w-1 h-4 bg-white animate-pulse delay-100 rounded-full"></span>
                          </div>
                          <button
                            onClick={() => setIsPlaying(true)}
                            className="px-3 py-1 rounded-full bg-white text-rose-600 font-bold text-xs shadow-sm hover:bg-neutral-100 transition"
                          >
                            Tune In
                          </button>
                        </div>
                      </div>

                      {/* Station 2 */}
                      <div className={`p-3 rounded-xl border flex items-center justify-between ${
                        isLight ? 'bg-neutral-100 border-neutral-200' : 'bg-neutral-900 border-white/5'
                      }`}>
                        <div>
                          <h4 className="text-xs font-bold">Apple Music Hits</h4>
                          <p className={`text-[10px] ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>80s, 90s & 2000s Essentials</p>
                        </div>
                        <Radio className="w-4 h-4 text-rose-500" />
                      </div>

                      {/* Station 3 */}
                      <div className={`p-3 rounded-xl border flex items-center justify-between ${
                        isLight ? 'bg-neutral-100 border-neutral-200' : 'bg-neutral-900 border-white/5'
                      }`}>
                        <div>
                          <h4 className="text-xs font-bold">Apple Music Country</h4>
                          <p className={`text-[10px] ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>Nashville Today & Hits</p>
                        </div>
                        <Radio className="w-4 h-4 text-rose-500" />
                      </div>
                    </div>
                  )}

                  {/* TAB 4: LIBRARY */}
                  {activeTab === 'library' && (
                    <div className="space-y-3">
                      <div className={`rounded-xl divide-y border overflow-hidden ${
                        isLight ? 'bg-neutral-50 border-neutral-200 divide-neutral-200' : 'bg-neutral-900/60 border-white/5 divide-white/5'
                      }`}>
                        <div className="p-3 flex items-center justify-between text-xs cursor-pointer hover:bg-rose-500/5">
                          <span className="font-semibold">Playlists</span>
                          <span className={`text-[10px] ${isLight ? 'text-neutral-400' : 'text-neutral-500'}`}>12</span>
                        </div>
                        <div className="p-3 flex items-center justify-between text-xs cursor-pointer hover:bg-rose-500/5">
                          <span className="font-semibold">Artists</span>
                          <span className={`text-[10px] ${isLight ? 'text-neutral-400' : 'text-neutral-500'}`}>4</span>
                        </div>
                        <div className="p-3 flex items-center justify-between text-xs cursor-pointer hover:bg-rose-500/5">
                          <span className="font-semibold">Albums</span>
                          <span className={`text-[10px] ${isLight ? 'text-neutral-400' : 'text-neutral-500'}`}>4</span>
                        </div>
                        <div className="p-3 flex items-center justify-between text-xs cursor-pointer hover:bg-rose-500/5">
                          <span className="font-semibold text-rose-500">Downloaded (Offline)</span>
                          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">4 Songs • 500MB Cache</span>
                        </div>
                      </div>

                      <div>
                        <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
                          Cached Offline Songs
                        </h4>
                        <div className="space-y-1.5">
                          {SAMPLE_TRACKS.map((t) => (
                            <div
                              key={t.id}
                              className={`flex items-center space-x-2.5 p-2 rounded-xl text-xs ${
                                isLight ? 'bg-neutral-100 text-neutral-800' : 'bg-neutral-900/50 text-white'
                              }`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate text-xs">{t.title}</p>
                                <p className={`text-[10px] truncate ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>{t.artist}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 5: SEARCH (WITH PERSISTENT INPUT AND STATE) */}
                  {activeTab === 'search' && (
                    <div className="space-y-3">
                      {/* Search Bar Input */}
                      <div className="relative">
                        <Search className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${
                          isLight ? 'text-neutral-400' : 'text-neutral-500'
                        }`} />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSearchQuery(val);
                            // Also update current history step's query so back/forward naturally remembers query
                            const updated = [...historyStack];
                            if (updated[historyIndex]) {
                              updated[historyIndex] = { ...updated[historyIndex], query: val };
                              setHistoryStack(updated);
                            }
                          }}
                          placeholder="Search artists, songs, lyrics..."
                          className={`w-full pl-8 pr-8 py-2 rounded-xl text-xs outline-none transition border ${
                            isLight
                              ? 'bg-neutral-100 border-neutral-300 text-neutral-900 focus:border-rose-500'
                              : 'bg-neutral-900 border-white/10 text-white focus:border-rose-500'
                          }`}
                        />
                        {searchQuery && (
                          <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Search Suggestions Chips */}
                      <div>
                        <span className={`text-[10px] uppercase font-bold tracking-wider block mb-1.5 ${
                          isLight ? 'text-neutral-400' : 'text-neutral-500'
                        }`}>
                          Suggestions
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {['The Weeknd', 'Starboy', 'Olivia', 'Taylor', 'Daft Punk'].map((chip) => (
                            <button
                              key={chip}
                              onClick={() => {
                                setSearchQuery(chip);
                                navigateTo('search', chip);
                              }}
                              className={`px-2 py-0.5 rounded-full text-[10px] transition ${
                                searchQuery.toLowerCase() === chip.toLowerCase()
                                  ? 'bg-rose-500 text-white'
                                  : isLight
                                  ? 'bg-neutral-200/80 text-neutral-700 hover:bg-neutral-300'
                                  : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                              }`}
                            >
                              {chip}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Live Filtered Results */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${
                            isLight ? 'text-neutral-500' : 'text-neutral-400'
                          }`}>
                            {searchQuery ? `Results for "${searchQuery}"` : 'All Tracks'}
                          </span>
                          <span className="text-[10px] font-mono text-neutral-400">
                            {SAMPLE_TRACKS.filter((t) =>
                              t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              t.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              t.album.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              t.genre.toLowerCase().includes(searchQuery.toLowerCase())
                            ).length} found
                          </span>
                        </div>

                        <div className="space-y-1">
                          {SAMPLE_TRACKS.filter((t) =>
                            t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            t.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            t.album.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            t.genre.toLowerCase().includes(searchQuery.toLowerCase())
                          ).map((t) => {
                            const originalIdx = SAMPLE_TRACKS.findIndex((item) => item.id === t.id);
                            const isCurrent = originalIdx === currentTrackIndex;
                            return (
                              <div
                                key={t.id}
                                onClick={() => {
                                  if (originalIdx !== -1) {
                                    setCurrentTrackIndex(originalIdx);
                                    setCurrentTime(0);
                                    setIsPlaying(true);
                                  }
                                }}
                                className={`flex items-center space-x-2.5 p-2 rounded-xl cursor-pointer transition ${
                                  isCurrent
                                    ? 'bg-rose-500/15 border border-rose-500/30'
                                    : isLight
                                    ? 'bg-neutral-100 hover:bg-neutral-200/80'
                                    : 'bg-neutral-900/60 hover:bg-neutral-800/80'
                                }`}
                              >
                                <img src={t.cover} alt={t.title} className="w-8 h-8 rounded-lg object-cover" />
                                <div className="flex-1 min-w-0">
                                  <p className={`text-xs font-semibold truncate ${isCurrent ? 'text-rose-500' : isLight ? 'text-neutral-900' : 'text-white'}`}>
                                    {t.title}
                                  </p>
                                  <p className={`text-[10px] truncate ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                    {t.artist}
                                  </p>
                                </div>
                                <Play className="w-3.5 h-3.5 text-rose-500" />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Persistent iOS Style Mini Player */}
                <div
                  className={`mx-3 mb-2 p-2.5 rounded-2xl backdrop-blur-md border shadow-xl flex items-center space-x-3 transition-colors ${
                    isLight
                      ? 'bg-neutral-100/95 border-neutral-200 text-neutral-900'
                      : 'bg-neutral-900/90 border-white/10 text-white'
                  }`}
                >
                  <img
                    src={currentTrack.cover}
                    alt={currentTrack.title}
                    className="w-10 h-10 rounded-xl object-cover shadow-sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate">{currentTrack.title}</p>
                    <p className={`text-[10px] truncate ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
                      {currentTrack.artist}
                    </p>

                    <div className={`w-full h-1 rounded-full mt-1 overflow-hidden ${isLight ? 'bg-neutral-300' : 'bg-white/10'}`}>
                      <div
                        className="h-full bg-rose-500"
                        style={{ width: `${(currentTime / currentTrack.duration) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={handlePlayPause}
                      className={`p-2 transition ${isLight ? 'text-neutral-800 hover:text-rose-500' : 'text-white hover:text-rose-400'}`}
                      aria-label={isPlaying ? 'Pause' : 'Play'}
                    >
                      {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                    </button>
                    <button
                      onClick={handleNext}
                      className={`p-2 transition ${isLight ? 'text-neutral-500 hover:text-black' : 'text-neutral-400 hover:text-white'}`}
                      aria-label="Next"
                    >
                      <SkipForward className="w-4 h-4 fill-current" />
                    </button>
                  </div>
                </div>

                {/* Bottom Navigation Bar */}
                <div
                  className={`w-full px-4 py-2 border-t flex items-center justify-around text-[10px] transition-colors ${
                    isLight
                      ? 'bg-neutral-50 border-neutral-200 text-neutral-500'
                      : 'bg-black/90 border-white/10 text-neutral-400'
                  }`}
                >
                  <button
                    onClick={() => navigateTo('listen')}
                    className={`flex flex-col items-center space-y-0.5 ${activeTab === 'listen' ? 'text-rose-500' : isLight ? 'hover:text-black' : 'hover:text-white'}`}
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Listen Now</span>
                  </button>
                  <button
                    onClick={() => navigateTo('browse')}
                    className={`flex flex-col items-center space-y-0.5 ${activeTab === 'browse' ? 'text-rose-500' : isLight ? 'hover:text-black' : 'hover:text-white'}`}
                  >
                    <Compass className="w-4 h-4" />
                    <span>Browse</span>
                  </button>
                  <button
                    onClick={() => navigateTo('radio')}
                    className={`flex flex-col items-center space-y-0.5 ${activeTab === 'radio' ? 'text-rose-500' : isLight ? 'hover:text-black' : 'hover:text-white'}`}
                  >
                    <Radio className="w-4 h-4" />
                    <span>Radio</span>
                  </button>
                  <button
                    onClick={() => navigateTo('library')}
                    className={`flex flex-col items-center space-y-0.5 ${activeTab === 'library' ? 'text-rose-500' : isLight ? 'hover:text-black' : 'hover:text-white'}`}
                  >
                    <Library className="w-4 h-4" />
                    <span>Library</span>
                  </button>
                  <button
                    onClick={() => navigateTo('search')}
                    className={`flex flex-col items-center space-y-0.5 ${activeTab === 'search' ? 'text-rose-500' : isLight ? 'hover:text-black' : 'hover:text-white'}`}
                  >
                    <Search className="w-4 h-4" />
                    <span>Search</span>
                  </button>
                </div>
              </div>
            )}

            {/* Android 14 Transparent Navigation Bar Pill (Interactive Back Gesture) */}
            <div
              onClick={canGoBack ? handleGoBack : undefined}
              title={canGoBack ? 'Android Back Gesture: Tap to navigate back in history without losing data' : 'Android Navigation Bar'}
              className={`w-full h-4 bg-transparent flex items-center justify-center ${canGoBack ? 'cursor-pointer hover:opacity-80' : ''}`}
            >
              <div className={`w-28 h-1 rounded-full transition-all ${
                canGoBack
                  ? isLight ? 'bg-rose-500/80 hover:h-1.5' : 'bg-rose-500/80 hover:h-1.5'
                  : isLight ? 'bg-black/40' : 'bg-white/40'
              }`}></div>
            </div>

          </div>
        </div>

        {/* Simulator Hardware Action Controls */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {/* Theme Quick Switcher for Simulator */}
          <div className="inline-flex rounded-lg bg-neutral-900 border border-neutral-700 p-0.5">
            <button
              onClick={() => setSimTheme('dark')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-medium transition ${
                simTheme === 'dark' ? 'bg-rose-500 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Moon className="w-3 h-3" />
              <span>Dark</span>
            </button>
            <button
              onClick={() => setSimTheme('light')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-medium transition ${
                simTheme === 'light' ? 'bg-rose-500 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Sun className="w-3 h-3" />
              <span>Light</span>
            </button>
            <button
              onClick={() => setSimTheme('system')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-medium transition ${
                simTheme === 'system' ? 'bg-rose-500 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Laptop className="w-3 h-3" />
              <span>System</span>
            </button>
          </div>

          <button
            onClick={() => setScreenOff(!screenOff)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
              screenOff
                ? 'bg-rose-500 text-white border-rose-400'
                : 'bg-neutral-900 text-neutral-300 border-neutral-700 hover:border-neutral-500'
            }`}
          >
            {screenOff ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>{screenOff ? 'Wake Screen' : 'Screen-Off'}</span>
          </button>

          <button
            onClick={() => setNotificationOpen(!notificationOpen)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
              notificationOpen
                ? 'bg-amber-500 text-black border-amber-400'
                : 'bg-neutral-900 text-neutral-300 border-neutral-700 hover:border-neutral-500'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>{notificationOpen ? 'Hide Shade' : 'Media Shade'}</span>
          </button>

          {/* Safe Area & Notch Simulator Toggles */}
          <button
            onClick={() => setSafeAreaProtected(!safeAreaProtected)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
              safeAreaProtected
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/25'
                : 'bg-rose-500 text-white border-rose-400 animate-pulse'
            }`}
            title="Toggle Safe Area Inset Protection to simulate or resolve status bar & notch overlap"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>{safeAreaProtected ? 'Safe Area: Protected' : 'Defect: Notch Overlap'}</span>
          </button>

          <button
            onClick={() => setShowNotchGuide(!showNotchGuide)}
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition ${
              showNotchGuide
                ? 'bg-cyan-500/20 text-cyan-400 border-cyan-400'
                : 'bg-neutral-900 text-neutral-400 border-neutral-700 hover:text-white'
            }`}
            title="Show safe area and camera punch-hole boundary guides"
          >
            <span>{showNotchGuide ? 'Hide Guides' : 'Notch Guides'}</span>
          </button>

          <button
            onClick={handleResetSimulatorState}
            title="Clear saved draft and reset navigation back stack"
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-neutral-700 bg-neutral-900 text-neutral-400 hover:text-white hover:border-neutral-500 transition"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset State</span>
          </button>
        </div>
      </div>

      {/* Right Column: Hardware Performance & Core Requirements Telemetry Panel */}
      <div className="lg:col-span-6 space-y-4">
        {/* Navigation State Preservation Monitor */}
        <div className="p-4 rounded-2xl bg-neutral-900/80 border border-emerald-500/30 shadow-md bg-gradient-to-br from-emerald-950/20 to-neutral-900">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <span>Navigation State Persistence Engine</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                    ZERO DATA LOSS
                  </span>
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Protects screen unmounting via Keep-Alive display caching, Session Storage &amp; <code className="text-emerald-400">onSaveInstanceState</code>
                </p>
              </div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-neutral-950/70 border border-neutral-800">
              <span className="text-neutral-500 block text-[10px] uppercase font-mono">History Stack</span>
              <span className="text-white font-semibold font-mono text-xs block mt-0.5">
                Step {historyIndex + 1} of {historyStack.length}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-neutral-950/70 border border-neutral-800">
              <span className="text-neutral-500 block text-[10px] uppercase font-mono">Input Draft</span>
              <span className="text-emerald-400 font-semibold font-mono text-xs block mt-0.5 truncate">
                {searchQuery ? `"${searchQuery}"` : 'Cached & Safe'}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-neutral-950/70 border border-neutral-800">
              <span className="text-neutral-500 block text-[10px] uppercase font-mono">Back Gestures</span>
              <span className="text-white font-semibold font-mono text-xs block mt-0.5">
                {canGoBack ? 'Active (Pop)' : 'At Root'}
              </span>
            </div>
          </div>
        </div>

        {/* Mobile Status Bar & Notch Overlap Resolution Architecture */}
        <div className={`p-4 rounded-2xl border shadow-md transition-all ${
          safeAreaProtected
            ? 'bg-neutral-900/80 border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 to-neutral-900'
            : 'bg-neutral-900/80 border-rose-500/40 bg-gradient-to-br from-rose-950/20 to-neutral-900'
        }`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2.5">
              <div className={`p-2 rounded-xl border ${
                safeAreaProtected
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              }`}>
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <span>Mobile Status Bar &amp; Notch Overlap Protection</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                    safeAreaProtected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                  }`}>
                    {safeAreaProtected ? 'SAFE AREA ACTIVE (44PX)' : 'DEFECT SIMULATED'}
                  </span>
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Guarantees top headers clear physical camera cutout, clock, and battery using <code className="text-rose-400">ViewCompat.setOnApplyWindowInsetsListener</code> &amp; <code className="text-rose-400">env(safe-area-inset-top)</code>
                </p>
              </div>
            </div>

            <button
              onClick={() => setSafeAreaProtected(!safeAreaProtected)}
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition ${
                safeAreaProtected
                  ? 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:text-white'
                  : 'bg-rose-600 text-white border-rose-500 hover:bg-rose-700'
              }`}
            >
              {safeAreaProtected ? 'Simulate Defect' : 'Apply Safe Insets'}
            </button>
          </div>

          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-neutral-950/70 border border-neutral-800">
              <span className="text-neutral-500 block text-[10px] uppercase font-mono">HTML Viewport</span>
              <span className="text-emerald-400 font-semibold font-mono text-xs block mt-0.5 truncate">
                viewport-fit=cover
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-neutral-950/70 border border-neutral-800">
              <span className="text-neutral-500 block text-[10px] uppercase font-mono">Cutout Clearance</span>
              <span className="text-white font-semibold font-mono text-xs block mt-0.5">
                {safeAreaProtected ? 'Cleared (0px overlap)' : 'Overlapping'}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-neutral-950/70 border border-neutral-800">
              <span className="text-neutral-500 block text-[10px] uppercase font-mono">CSS Inset Var</span>
              <span className="text-rose-400 font-semibold font-mono text-xs block mt-0.5">
                --safe-area-top: 44px
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-neutral-950/70 border border-neutral-800">
              <span className="text-neutral-500 block text-[10px] uppercase font-mono">System Insets</span>
              <span className="text-white font-semibold font-mono text-xs block mt-0.5 truncate" title="rootContainer.setPadding(left, top, right, bottom)">
                rootContainer.setPadding
              </span>
            </div>
          </div>
        </div>

        {/* 5 WebView Anti-Lag & Speed Optimizations */}
        <div className="p-4 rounded-2xl bg-neutral-900/80 border border-rose-500/30 shadow-md bg-gradient-to-br from-rose-950/20 to-neutral-900">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <span>5 WebView Anti-Lag &amp; Speed Optimizations</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold">
                    ENABLED
                  </span>
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Eliminates scroll jank, slow reloads &amp; main-thread bitmap decoding on <code className="text-rose-400">beta.music.apple.com</code>
                </p>
              </div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-neutral-950/70 border border-neutral-800">
              <span className="text-rose-400 block text-[10px] uppercase font-mono font-bold">1. OkHttp Disk Cache</span>
              <span className="text-white font-semibold text-[11px] block mt-0.5">
                Intercepts <code className="text-emerald-400">.js, .css, .woff2, mzstatic</code> → 7-day immutable disk cache
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-neutral-950/70 border border-neutral-800">
              <span className="text-rose-400 block text-[10px] uppercase font-mono font-bold">2. CDN Artwork Downscaler</span>
              <span className="text-white font-semibold text-[11px] block mt-0.5">
                Rewrites <code className="text-amber-400">1000x1000bb.jpg</code> → <code className="text-emerald-400">300x300bb.webp</code>
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-neutral-950/70 border border-neutral-800">
              <span className="text-rose-400 block text-[10px] uppercase font-mono font-bold">3. Telemetry Blocker</span>
              <span className="text-white font-semibold text-[11px] block mt-0.5">
                Blocks <code className="text-rose-300">metrics.apple.com, xp.apple.com, sentry</code> (204 empty)
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-neutral-950/70 border border-neutral-800">
              <span className="text-rose-400 block text-[10px] uppercase font-mono font-bold">4 &amp; 5. GPU CSS + SPA Back</span>
              <span className="text-white font-semibold text-[11px] block mt-0.5">
                Strips <code className="text-purple-300">backdrop-filter</code> blurs + routes Back via <code className="text-emerald-400">history.back()</code>
              </span>
            </div>
          </div>
        </div>

        {/* Requirement 1: 120Hz & Hardware Acceleration */}
        <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 shadow-md">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <span>Requirement 1: 120Hz & Peak Performance</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">ACTIVE</span>
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Detects <code className="text-rose-400">display.supportedModes</code> & forces <code className="text-rose-400">preferredDisplayModeId</code>
                </p>
              </div>
            </div>
            <span className="text-xl font-black font-mono text-rose-500">{forcedRefreshRate} FPS</span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-neutral-950/60 border border-neutral-800/80">
              <span className="text-neutral-500 block text-[10px] uppercase font-mono">Hardware Layer</span>
              <span className="text-white font-semibold flex items-center space-x-1 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 inline" />
                <span>LAYER_TYPE_HARDWARE</span>
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-neutral-950/60 border border-neutral-800/80">
              <span className="text-neutral-500 block text-[10px] uppercase font-mono">Acceleration Scope</span>
              <span className="text-white font-semibold flex items-center space-x-1 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 inline" />
                <span>Global Manifest Enabled</span>
              </span>
            </div>
          </div>
        </div>

        {/* Requirement 2: Screen-Off & Background Playback */}
        <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 shadow-md">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <span>Requirement 2: Background Playback & Locks</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                    {isPlaying ? 'STREAMING' : 'IDLE'}
                  </span>
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  ForegroundService with MediaSessionCompat notification & Wake/Wi-Fi locks
                </p>
              </div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-neutral-950/60 border border-neutral-800/80">
              <span className="text-neutral-500 block text-[10px] uppercase font-mono">PowerManager</span>
              <span className="text-white font-semibold flex items-center space-x-1.5 mt-0.5">
                <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-600'}`}></span>
                <span>PARTIAL_WAKE_LOCK</span>
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-neutral-950/60 border border-neutral-800/80">
              <span className="text-neutral-500 block text-[10px] uppercase font-mono">WifiManager</span>
              <span className="text-white font-semibold flex items-center space-x-1.5 mt-0.5">
                <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-600'}`}></span>
                <span>WIFI_MODE_FULL_HIGH_PERF</span>
              </span>
            </div>
          </div>

          <div className="mt-2 p-2.5 rounded-xl bg-neutral-950/40 border border-neutral-800/60 text-[11px] text-neutral-400 flex items-center justify-between">
            <span>onPause() / onStop() behavior:</span>
            <span className="font-mono text-emerald-400 font-semibold">WebAudio pipeline preserved (Not paused)</span>
          </div>
        </div>

        {/* Requirement 3: 500 MB Custom Disk Cache */}
        <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Requirement 3: 500 MB Custom Disk Cache</h3>
                <p className="text-xs text-neutral-400">
                  Dedicated internal directory: <code className="text-blue-400">cacheDir/music_beta_webview_cache</code>
                </p>
              </div>
            </div>
            <button
              onClick={handleClearCache}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition flex items-center space-x-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Prune</span>
            </button>
          </div>

          {/* Progress bar */}
          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-neutral-400 font-mono">
                {formatBytes(cacheUsedBytes)} Used ({Math.round((cacheUsedBytes / (500 * 1024 * 1024)) * 100)}%)
              </span>
              <span className="text-neutral-500 font-mono">500 MB Limit</span>
            </div>
            <div className="w-full h-2 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-300"
                style={{ width: `${(cacheUsedBytes / (500 * 1024 * 1024)) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Requirement 4: iOS Appearance & User-Agent */}
        <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 shadow-md">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Requirement 4: iOS Appearance & Edge-to-Edge</h3>
                <p className="text-xs text-neutral-400">
                  Safari User-Agent spoofing for native Apple Music mobile UI
                </p>
              </div>
            </div>
          </div>

          <div className="mt-3 p-2.5 rounded-xl bg-neutral-950/80 border border-neutral-800 text-[11px] font-mono text-purple-300 break-all">
            {selectedUA === 'iphone' ? IOS_USER_AGENT : IPAD_USER_AGENT}
          </div>
        </div>

        {/* Feature: Dynamic Light & Dark Mode */}
        <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 shadow-md">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20">
                {isLight ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-400" />}
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <span>Dynamic Light &amp; Dark Mode</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded uppercase font-semibold ${
                    isLight ? 'bg-amber-500/20 text-amber-400' : 'bg-indigo-500/20 text-indigo-400'
                  }`}>
                    {effectiveTheme.toUpperCase()} MODE
                  </span>
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Synchronizes <code className="text-pink-400">WindowInsetsControllerCompat</code> &amp; WebKit color-scheme
                </p>
              </div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-neutral-950/60 border border-neutral-800/80">
              <span className="text-neutral-500 block text-[10px] uppercase font-mono">Status Bar Icons</span>
              <span className="text-white font-semibold flex items-center space-x-1.5 mt-0.5 font-mono text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 inline" />
                <span>isAppearanceLight: {isLight ? 'true (dark icons)' : 'false (light icons)'}</span>
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-neutral-950/60 border border-neutral-800/80">
              <span className="text-neutral-500 block text-[10px] uppercase font-mono">WebSettingsCompat</span>
              <span className="text-white font-semibold flex items-center space-x-1.5 mt-0.5 font-mono text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 inline" />
                <span>{isLight ? 'FORCE_DARK_OFF' : 'FORCE_DARK_ON'}</span>
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
