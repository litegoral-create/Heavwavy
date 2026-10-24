import React, { useState, useEffect } from 'react';
import {
  Music2,
  Smartphone,
  FileCode2,
  BookOpen,
  Download,
  Github,
  Zap,
  Shield,
  HardDrive,
  Sparkles,
  CheckCircle2,
  Terminal,
  Sun,
  Moon,
  Layers,
  Check
} from 'lucide-react';
import { AndroidSimulator } from './components/AndroidSimulator';
import { CodeExplorer } from './components/CodeExplorer';
import { ArchitectureGuide } from './components/ArchitectureGuide';
import { GitHubApkBuilder } from './components/GitHubApkBuilder';
import { PROJECT_FILES } from './data/projectFiles';
import JSZip from 'jszip';

type NavTab = 'simulator' | 'github-build' | 'code' | 'architecture';

function getTabFromUrl(): NavTab {
  const hash = window.location.hash.replace('#', '');
  if (hash === 'code' || hash === 'architecture' || hash === 'simulator' || hash === 'github-build') {
    return hash;
  }
  try {
    const saved = sessionStorage.getItem('active_nav_tab') as NavTab | null;
    if (saved === 'code' || saved === 'architecture' || saved === 'simulator' || saved === 'github-build') {
      return saved;
    }
  } catch {}
  return 'simulator';
}

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>(getTabFromUrl);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [globalTheme, setGlobalTheme] = useState<'dark' | 'light'>('dark');

  // Handle browser Back / Forward history events (popstate / hashchange)
  useEffect(() => {
    const handleNavigation = () => {
      const current = getTabFromUrl();
      setActiveTab(current);
    };

    window.addEventListener('popstate', handleNavigation);
    window.addEventListener('hashchange', handleNavigation);

    // Ensure initial URL hash is synchronized
    if (!window.location.hash) {
      window.history.replaceState(null, '', `#${activeTab}`);
    }

    return () => {
      window.removeEventListener('popstate', handleNavigation);
      window.removeEventListener('hashchange', handleNavigation);
    };
  }, []);

  const handleTabChange = (tab: NavTab) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    try {
      sessionStorage.setItem('active_nav_tab', tab);
    } catch {}
    // Pushes onto browser history stack so Back/Forward buttons work without losing state
    window.history.pushState(null, '', `#${tab}`);
  };

  const handleDownloadZip = async () => {
    try {
      setIsDownloadingZip(true);
      const zip = new JSZip();

      // Populate complete Android Studio Project hierarchy
      PROJECT_FILES.forEach((file) => {
        zip.file(file.path, file.content);
      });

      const manifestFile = PROJECT_FILES.find((f) => f.id === 'android-manifest');
      if (manifestFile) {
        zip.file('AndroidManifest.xml', manifestFile.content);
      }

      zip.file(
        'gradle/wrapper/gradle-wrapper.properties',
        `distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-8.4-bin.zip
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
`
      );

      zip.file(
        'README.md',
        `# MusicBetaWrapper (Android 14+)

High-performance native Android wrapper around \`https://beta.music.apple.com\`.

## Features
- **120 Hz+ Refresh Rate**: Forced peak display refresh rate.
- **Screen-Off Audio**: Ongoing MediaPlayback ForegroundService with wake & Wi-Fi locks.
- **500 MB Dedicated Cache**: Fast offline buffer.
- **iOS Safari User-Agent**: Renders native Apple Music mobile interface.
- **Dynamic Light & Dark Modes**: Dynamic system bar tinting & WebKit theme sync.
- **Automated CI/CD**: \`.github/workflows/release.yml\` builds and publishes APKs on tag push.

## Build Instructions
\`\`\`bash
# Build release APK
./gradlew assembleRelease
\`\`\`
`
      );

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'MusicBetaWrapper-Android-Project.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to create ZIP', err);
    } finally {
      setIsDownloadingZip(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans antialiased selection:bg-rose-500 selection:text-white transition-colors duration-200 pb-safe ${
      globalTheme === 'dark' ? 'bg-[#0a0a0c] text-white' : 'bg-[#f8f9fa] text-neutral-900'
    }`}>
      {/* Top Header (Respects mobile status bar & notch safe area insets) */}
      <header className={`border-b backdrop-blur-md sticky top-0 z-50 transition-colors pt-safe pl-safe pr-safe ${
        globalTheme === 'dark' ? 'border-white/10 bg-[#0f0f13]/85' : 'border-neutral-200 bg-white/95'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 via-rose-500 to-amber-500 p-0.5 shadow-lg shadow-rose-500/20">
              <div className="w-full h-full bg-black rounded-[10px] flex items-center justify-center">
                <Music2 className="w-5 h-5 text-rose-500" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base font-extrabold tracking-tight">MusicBetaWrapper</h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase bg-rose-500/20 text-rose-500 border border-rose-500/30">
                  Android 14 (API 34)
                </span>
              </div>
              <p className={`text-xs hidden sm:block ${globalTheme === 'dark' ? 'text-neutral-400' : 'text-neutral-500'}`}>
                High-Performance Native 120Hz, Screen-Off & Light/Dark Mode Wrapper
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              onClick={() => setGlobalTheme(globalTheme === 'dark' ? 'light' : 'dark')}
              className={`p-2 rounded-xl border transition ${
                globalTheme === 'dark'
                  ? 'bg-neutral-900 border-neutral-700 text-neutral-300 hover:text-white hover:border-neutral-500'
                  : 'bg-neutral-100 border-neutral-300 text-neutral-700 hover:text-black hover:border-neutral-400'
              }`}
              title={`Switch to ${globalTheme === 'dark' ? 'Light' : 'Dark'} Mode`}
              aria-label="Toggle UI Theme"
            >
              {globalTheme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
            </button>

            <button
              onClick={() => handleTabChange('github-build')}
              className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-rose-500/40 text-rose-400 hover:text-rose-300 text-xs font-bold shadow-sm transition active:scale-95"
            >
              <Github className="w-4 h-4" />
              <span className="hidden sm:inline">Build APK on GitHub</span>
              <span className="sm:hidden">Build APK</span>
            </button>

            <button
              onClick={handleDownloadZip}
              disabled={isDownloadingZip}
              className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white text-xs font-bold shadow-md shadow-rose-500/20 transition active:scale-95 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">
                {isDownloadingZip ? 'Zipping...' : 'Download Project (.zip)'}
              </span>
              <span className="sm:hidden">ZIP</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex overflow-x-auto space-x-1 border-t ${
          globalTheme === 'dark' ? 'border-white/5' : 'border-neutral-200'
        }`}>
          <button
            onClick={() => handleTabChange('simulator')}
            className={`flex items-center space-x-2 py-3 px-4 text-xs font-semibold border-b-2 whitespace-nowrap transition ${
              activeTab === 'simulator'
                ? globalTheme === 'dark' ? 'border-rose-500 text-white bg-white/5' : 'border-rose-500 text-neutral-900 bg-neutral-100'
                : globalTheme === 'dark' ? 'border-transparent text-neutral-400 hover:text-neutral-200' : 'border-transparent text-neutral-500 hover:text-black'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Interactive Android 14 Simulator</span>
          </button>

          <button
            onClick={() => handleTabChange('github-build')}
            className={`flex items-center space-x-2 py-3 px-4 text-xs font-semibold border-b-2 whitespace-nowrap transition ${
              activeTab === 'github-build'
                ? globalTheme === 'dark' ? 'border-rose-500 text-white bg-white/5' : 'border-rose-500 text-neutral-900 bg-neutral-100'
                : globalTheme === 'dark' ? 'border-transparent text-rose-400 hover:text-rose-300' : 'border-transparent text-rose-600 hover:text-rose-700'
            }`}
          >
            <Github className="w-4 h-4" />
            <span>Build APK on GitHub</span>
            <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[9px] font-bold uppercase">
              Auto-Sign CI/CD
            </span>
          </button>

          <button
            onClick={() => handleTabChange('code')}
            className={`flex items-center space-x-2 py-3 px-4 text-xs font-semibold border-b-2 whitespace-nowrap transition ${
              activeTab === 'code'
                ? globalTheme === 'dark' ? 'border-rose-500 text-white bg-white/5' : 'border-rose-500 text-neutral-900 bg-neutral-100'
                : globalTheme === 'dark' ? 'border-transparent text-neutral-400 hover:text-neutral-200' : 'border-transparent text-neutral-500 hover:text-black'
            }`}
          >
            <FileCode2 className="w-4 h-4" />
            <span>Source Code Explorer</span>
          </button>

          <button
            onClick={() => handleTabChange('architecture')}
            className={`flex items-center space-x-2 py-3 px-4 text-xs font-semibold border-b-2 whitespace-nowrap transition ${
              activeTab === 'architecture'
                ? globalTheme === 'dark' ? 'border-rose-500 text-white bg-white/5' : 'border-rose-500 text-neutral-900 bg-neutral-100'
                : globalTheme === 'dark' ? 'border-transparent text-neutral-400 hover:text-neutral-200' : 'border-transparent text-neutral-500 hover:text-black'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Architecture & CI/CD Guide</span>
          </button>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Core Requirements Badge Banner */}
        <div className="mb-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          <div className="p-2.5 rounded-xl bg-neutral-900/60 border border-neutral-800/80 flex items-center space-x-2">
            <Zap className="w-4 h-4 text-rose-500 flex-shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-mono text-neutral-500 block">120 Hz Mode</span>
              <span className="text-xs font-semibold text-neutral-200 truncate block">Display Mode Forcing</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-neutral-900/60 border border-neutral-800/80 flex items-center space-x-2">
            <Shield className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-mono text-neutral-500 block">Screen-Off Audio</span>
              <span className="text-xs font-semibold text-neutral-200 truncate block">Wake & Wi-Fi Locks</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-neutral-900/60 border border-neutral-800/80 flex items-center space-x-2">
            <HardDrive className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-mono text-neutral-500 block">Custom Storage</span>
              <span className="text-xs font-semibold text-neutral-200 truncate block">500 MB Disk Cache</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-neutral-900/60 border border-neutral-800/80 flex items-center space-x-2">
            <Smartphone className="w-4 h-4 text-purple-500 flex-shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-mono text-neutral-500 block">Appearance</span>
              <span className="text-xs font-semibold text-neutral-200 truncate block">iOS Safari Mobile UI</span>
            </div>
          </div>

          <div
            onClick={() => handleTabChange('github-build')}
            className="p-2.5 rounded-xl bg-neutral-900/60 border border-neutral-800/80 hover:border-rose-500/40 cursor-pointer flex items-center space-x-2 col-span-2 sm:col-span-1 transition"
          >
            <Github className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-mono text-neutral-500 block">Automated CI/CD</span>
              <span className="text-xs font-semibold text-neutral-200 truncate block">Build Signed APK →</span>
            </div>
          </div>
        </div>

        {/* State-Preserved View Containers (Offscreen Rendering: Prevents Unmounting & Retains All Data) */}
        <div className={activeTab === 'simulator' ? 'block' : 'hidden'} aria-hidden={activeTab !== 'simulator'}>
          <AndroidSimulator />
        </div>
        <div className={activeTab === 'github-build' ? 'block' : 'hidden'} aria-hidden={activeTab !== 'github-build'}>
          <GitHubApkBuilder onDownloadZip={handleDownloadZip} />
        </div>
        <div className={activeTab === 'code' ? 'block' : 'hidden'} aria-hidden={activeTab !== 'code'}>
          <CodeExplorer />
        </div>
        <div className={activeTab === 'architecture' ? 'block' : 'hidden'} aria-hidden={activeTab !== 'architecture'}>
          <ArchitectureGuide />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-800/60 bg-neutral-950 py-6 text-center text-xs text-neutral-500">
        <p>
          MusicBetaWrapper • Complete Kotlin Android Studio Project (API 34, minSdk 26) targeting{' '}
          <a
            href="https://beta.music.apple.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-rose-400 hover:underline"
          >
            https://beta.music.apple.com
          </a>
        </p>
      </footer>
    </div>
  );
}
