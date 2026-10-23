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
  Laptop
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

export const AndroidSimulator: React.FC = () => {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(42);
  const [screenOff, setScreenOff] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [forcedRefreshRate, setForcedRefreshRate] = useState<number>(120);
  const [selectedUA, setSelectedUA] = useState<'iphone' | 'ipad'>('iphone');
  const [cacheUsedBytes, setCacheUsedBytes] = useState(248 * 1024 * 1024);
  const [activeTab, setActiveTab] = useState<'listen' | 'browse' | 'radio' | 'library' | 'search'>('listen');
  const [currentTimeString, setCurrentTimeString] = useState('12:15');
  const [simTheme, setSimTheme] = useState<AppTheme>('dark');

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
                className={`flex-1 flex flex-col overflow-hidden transition-colors duration-300 ${
                  isLight ? 'bg-white' : 'bg-black'
                }`}
              >
                {/* Header Bar */}
                <div
                  className={`px-5 pt-1 pb-3 flex items-center justify-between border-b backdrop-blur-md transition-colors ${
                    isLight
                      ? 'bg-white/90 border-neutral-200'
                      : 'bg-black/60 border-white/5'
                  }`}
                >
                  <div>
                    <span className="text-[11px] font-bold tracking-wider uppercase text-rose-500 flex items-center space-x-1">
                      <Music2 className="w-3 h-3 inline mr-1" />
                      Apple Music Beta
                    </span>
                    <h2 className="text-lg font-extrabold tracking-tight capitalize">{activeTab}</h2>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] border ${
                        isLight
                          ? 'bg-neutral-100 text-neutral-700 border-neutral-300'
                          : 'bg-neutral-800 text-neutral-300 border-white/5'
                      }`}
                    >
                      {effectiveTheme === 'light' ? 'Light' : 'Dark'} Mode
                    </span>
                  </div>
                </div>

                {/* WebView Content Area */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 scrollbar-none">
                  {/* Featured Hero Banner */}
                  <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-lg group">
                    <img
                      src={currentTrack.cover}
                      alt={currentTrack.album}
                      className="w-full h-44 object-cover object-center filter brightness-95 transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-4 flex flex-col justify-end text-white">
                      <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">
                        {currentTrack.genre}
                      </span>
                      <h3 className="text-base font-bold text-white truncate">{currentTrack.title}</h3>
                      <p className="text-xs text-neutral-200">{currentTrack.artist}</p>
                    </div>
                  </div>

                  {/* Recently Played / Popular Row */}
                  <div>
                    <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
                      Featured Tracks
                    </h4>
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
                    onClick={() => setActiveTab('listen')}
                    className={`flex flex-col items-center space-y-0.5 ${activeTab === 'listen' ? 'text-rose-500' : isLight ? 'hover:text-black' : 'hover:text-white'}`}
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Listen Now</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('browse')}
                    className={`flex flex-col items-center space-y-0.5 ${activeTab === 'browse' ? 'text-rose-500' : isLight ? 'hover:text-black' : 'hover:text-white'}`}
                  >
                    <Compass className="w-4 h-4" />
                    <span>Browse</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('radio')}
                    className={`flex flex-col items-center space-y-0.5 ${activeTab === 'radio' ? 'text-rose-500' : isLight ? 'hover:text-black' : 'hover:text-white'}`}
                  >
                    <Radio className="w-4 h-4" />
                    <span>Radio</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('library')}
                    className={`flex flex-col items-center space-y-0.5 ${activeTab === 'library' ? 'text-rose-500' : isLight ? 'hover:text-black' : 'hover:text-white'}`}
                  >
                    <Library className="w-4 h-4" />
                    <span>Library</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('search')}
                    className={`flex flex-col items-center space-y-0.5 ${activeTab === 'search' ? 'text-rose-500' : isLight ? 'hover:text-black' : 'hover:text-white'}`}
                  >
                    <Search className="w-4 h-4" />
                    <span>Search</span>
                  </button>
                </div>
              </div>
            )}

            {/* Android 14 Transparent Navigation Bar Pill */}
            <div className="w-full h-4 bg-transparent flex items-center justify-center">
              <div className={`w-28 h-1 rounded-full ${isLight ? 'bg-black/40' : 'bg-white/40'}`}></div>
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
        </div>
      </div>

      {/* Right Column: Hardware Performance & Core Requirements Telemetry Panel */}
      <div className="lg:col-span-6 space-y-4">
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
