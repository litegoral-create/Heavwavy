import React from 'react';
import {
  Zap,
  Shield,
  HardDrive,
  Smartphone,
  GitBranch,
  Terminal,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Cpu
} from 'lucide-react';

export const ArchitectureGuide: React.FC = () => {
  return (
    <div className="space-y-6 text-neutral-300">
      {/* Intro Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 shadow-lg">
        <h2 className="text-xl font-black text-white flex items-center space-x-2.5">
          <Cpu className="w-6 h-6 text-rose-500" />
          <span>MusicBetaWrapper Architectural Blueprint</span>
        </h2>
        <p className="text-sm text-neutral-400 mt-2 leading-relaxed">
          Standard Android WebView wrappers suffer from three fatal flaws when wrapping Apple Music: 
          audio halts the instant the screen turns off or the user switches apps, refresh rates default to 60Hz 
          producing stuttery scrolling, and Apple Music renders the desktop or generic web interface without native gestures.
          Here is how <strong>MusicBetaWrapper</strong> solves each one for Android 14+ (API 34).
        </p>
      </div>

      {/* 5 Core Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pillar 1 */}
        <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-3">
          <div className="flex items-center space-x-2 text-rose-400 font-bold text-sm">
            <Zap className="w-4 h-4" />
            <span>1. 120 Hz+ Refresh Rate & Hardware Acceleration</span>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            By default, Android dynamically caps WebViews to 60Hz to conserve power. In <code>MainActivity.kt</code>, we inspect
            <code>display.supportedModes</code>, identify the mode with highest refresh rate (e.g. 120Hz, 144Hz, or 165Hz),
            and force <code>window.attributes.preferredDisplayModeId = bestMode.modeId</code>.
          </p>
          <div className="p-2.5 rounded-xl bg-black/50 border border-white/5 font-mono text-[11px] text-neutral-300 space-y-1">
            <p className="text-emerald-400">// Forces peak refresh rate</p>
            <p>val bestMode = modes.maxByOrNull &#123; it.refreshRate &#125;</p>
            <p>window.attributes.preferredDisplayModeId = bestMode.modeId</p>
          </div>
        </div>

        {/* Pillar 2 */}
        <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-3">
          <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm">
            <Shield className="w-4 h-4" />
            <span>2. Screen-Off & Background Audio Playback</span>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Android 14 mandates <code>foregroundServiceType="mediaPlayback"</code>. We pair this with 
            <code>PowerManager.PARTIAL_WAKE_LOCK</code> and <code>WifiManager.WIFI_MODE_FULL_HIGH_PERF</code>.
            Crucially, we <strong>omit</strong> <code>webView.onPause()</code> and <code>webView.pauseTimers()</code> in <code>onPause()</code>,
            keeping HTML5 WebAudio and remote MediaSession active when the screen locks.
          </p>
          <div className="p-2.5 rounded-xl bg-black/50 border border-white/5 font-mono text-[11px] text-neutral-300 space-y-1">
            <p className="text-emerald-400">// Notification & MediaSession bridge</p>
            <p>NotificationCompat.MediaStyle().setMediaSession(token)</p>
            <p>wakeLock.acquire() &amp; wifiLock.acquire()</p>
          </div>
        </div>

        {/* Pillar 3 */}
        <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-3">
          <div className="flex items-center space-x-2 text-blue-400 font-bold text-sm">
            <HardDrive className="w-4 h-4" />
            <span>3. Dedicated 500 MB Internal Disk Cache</span>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Apple Music streaming relies on heavy chunk buffering and album art caching. We allocate an internal directory 
            under <code>applicationContext.cacheDir/music_beta_webview_cache</code> configured with 
            <code>WebSettings.LOAD_DEFAULT</code>. A background maintenance thread checks total byte usage and prunes
            oldest files down to 85% whenever 500 MB is reached.
          </p>
          <div className="p-2.5 rounded-xl bg-black/50 border border-white/5 font-mono text-[11px] text-neutral-300 space-y-1">
            <p className="text-emerald-400">// Dedicated 500MB Cache</p>
            <p>val maxSizeBytes = 500L * 1024L * 1024L</p>
            <p>manageCacheQuota(cacheDir, maxSizeBytes)</p>
          </div>
        </div>

        {/* Pillar 4 */}
        <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-3">
          <div className="flex items-center space-x-2 text-purple-400 font-bold text-sm">
            <Smartphone className="w-4 h-4" />
            <span>4. iOS Safari User-Agent & True Edge-to-Edge</span>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            When visited with an Android User-Agent, Apple Music Beta serves a desktop layout or prompts users to install the Google Play app.
            By overriding the User-Agent to iOS Safari (iPhone 17.5), Apple Music serves its native touch-first mobile interface.
            Edge-to-edge immersion is achieved via <code>WindowCompat.setDecorFitsSystemWindows(window, false)</code> and transparent system bars.
          </p>
          <div className="p-2.5 rounded-xl bg-black/50 border border-white/5 font-mono text-[11px] text-neutral-300 space-y-1">
            <p className="text-emerald-400">// iOS Mobile User-Agent</p>
            <p>settings.userAgentString = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5... Safari/604.1)"</p>
            <p>WindowCompat.setDecorFitsSystemWindows(window, false)</p>
          </div>
        </div>
      </div>

      {/* Pillar 5: GitHub CI/CD & How to Build */}
      <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-4">
        <div className="flex items-center space-x-2 text-cyan-400 font-bold text-sm">
          <GitBranch className="w-4 h-4" />
          <span>5. GitHub Actions Release Automation & Building Guide</span>
        </div>
        <p className="text-xs text-neutral-400 leading-relaxed">
          The included <code>.github/workflows/release.yml</code> workflow triggers whenever a git tag matching <code>v*</code> is pushed.
          It sets up JDK 17, compiles the release APK via <code>./gradlew assembleRelease</code>, signs it (with optional repository secrets),
          and publishes the binary directly to GitHub Releases.
        </p>

        <div className="p-4 rounded-xl bg-black border border-neutral-800 text-xs font-mono space-y-2 text-neutral-300">
          <div className="flex items-center space-x-2 text-neutral-500 pb-2 border-b border-neutral-800">
            <Terminal className="w-3.5 h-3.5" />
            <span>Quick Start Terminal Commands</span>
          </div>
          <p><span className="text-neutral-500"># 1. Compile Release APK locally</span></p>
          <p className="text-white">./gradlew assembleRelease</p>
          <p><span className="text-neutral-500"># 2. Trigger automated GitHub Release</span></p>
          <p className="text-white">git tag v1.0.0</p>
          <p className="text-white">git push origin v1.0.0</p>
        </div>
      </div>
    </div>
  );
};
