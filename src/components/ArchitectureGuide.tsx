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

      {/* Pillar 6: Zero Data Loss & Navigation State Preservation */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/30 to-neutral-900 border border-emerald-500/30 space-y-4">
        <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
          <CheckCircle className="w-4 h-4" />
          <span>6. Zero Data Loss &amp; Seamless Back/Forward Navigation Architecture</span>
        </div>
        <p className="text-xs text-neutral-400 leading-relaxed">
          Navigating backward/forward between screens frequently results in accidental state loss when components unmount and garbage collection clears input memory.
          This codebase eliminates navigation state loss through a dual-layer strategy:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-2">
            <h4 className="font-bold text-emerald-400 flex items-center space-x-1.5">
              <span>Frontend React Architecture</span>
            </h4>
            <ul className="space-y-1.5 text-neutral-400 list-disc list-inside text-[11px] leading-relaxed">
              <li><strong>Keep-Alive Display Caching:</strong> Swapped conditional DOM unmounting with CSS <code>hidden</code> display toggling so audio playback, scroll positions, and interactive states remain alive.</li>
              <li><strong>Browser Popstate / Hash Navigation:</strong> Wired <code>window.history.pushState</code> and <code>hashchange</code> so browser Back/Forward buttons navigate seamlessly.</li>
              <li><strong>Session Storage Draft Cache:</strong> Synchronizes active search queries, selected files, and track history across reloads.</li>
            </ul>
          </div>

          <div className="p-3.5 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-2">
            <h4 className="font-bold text-emerald-400 flex items-center space-x-1.5">
              <span>Native Android Architecture</span>
            </h4>
            <ul className="space-y-1.5 text-neutral-400 list-disc list-inside text-[11px] leading-relaxed">
              <li><strong><code>onSaveInstanceState</code> Bundle Sync:</strong> Invokes <code>webView.saveState(outState)</code> to persist page navigation history, input forms, and DOM state against Activity recreation or memory pressure.</li>
              <li><strong><code>webView.restoreState</code>:</strong> Restores full browsing history immediately upon Activity launch.</li>
              <li><strong>Back Stack Dispatcher:</strong> Overrides <code>OnBackPressedCallback</code> to verify <code>webView.canGoBack()</code> before exiting the task.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Pillar 7: Safe Area & Status Bar / Notch Overlap Architecture */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/30 to-neutral-900 border border-indigo-500/30 space-y-4">
        <div className="flex items-center space-x-2 text-indigo-400 font-bold text-sm">
          <Smartphone className="w-4 h-4" />
          <span>7. Mobile Status Bar &amp; Camera Notch Overlap Architecture</span>
        </div>
        <p className="text-xs text-neutral-400 leading-relaxed">
          In edge-to-edge mobile apps (<code>WindowCompat.setDecorFitsSystemWindows(false)</code>), WebView contents naturally bleed behind
          the system status bar (clock, battery indicator) and hardware display cutouts (camera punch-hole / notch) unless hardware insets
          are bridged into the rendering pipeline. This codebase resolves notch overlap via a triple-tier safe-area protocol:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-1.5">
            <h4 className="font-bold text-indigo-400">1. HTML Viewport-Fit</h4>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              <code>viewport-fit=cover</code> in <code>index.html</code> signals to mobile browsers and WebViews that the document can draw into edge-to-edge margins, enabling CSS <code>env(safe-area-inset-top)</code>.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-1.5">
            <h4 className="font-bold text-indigo-400">2. Native Root Padding + Cutout</h4>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              <code>ViewCompat.setOnApplyWindowInsetsListener</code> queries <code>systemBars() or displayCutout()</code> and applies <code>rootContainer.setPadding(left, top, right, bottom)</code> so the WebView never renders under the camera notch.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-1.5">
            <h4 className="font-bold text-indigo-400">3. Runtime CSS Variable Bridge</h4>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Injects <code>--safe-area-top</code> and <code>--safe-area-bottom</code> into <code>document.documentElement.style</code> on every window inset change and page commit, preventing sticky header clipping.
            </p>
          </div>
        </div>
      </div>

      {/* Pillar 8: 5 WebView Anti-Lag & Speed Optimizations */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-950/30 to-neutral-900 border border-rose-500/30 space-y-4">
        <div className="flex items-center space-x-2 text-rose-400 font-bold text-sm">
          <Zap className="w-4 h-4" />
          <span>8. Five WebView Anti-Lag &amp; Asset Reload Optimizations</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-1">
            <h4 className="font-bold text-rose-400">1. Aggressive OkHttp Disk Caching</h4>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Intercepts <code>.js</code>, <code>.css</code>, <code>.woff2</code>, and <code>mzstatic.com</code> artwork in <code>shouldInterceptRequest</code> using a 500MB <code>OkHttpClient</code> disk cache with 7-day immutable headers.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-1">
            <h4 className="font-bold text-rose-400">2. Apple CDN Artwork Downscaler</h4>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Rewrites oversized <code>mzstatic.com</code> thumbnails (<code>1000x1000bb.jpg</code>, <code>600x600bb.png</code>) down to <code>300x300bb.webp</code>, cutting bitmap decode lag by ~90%.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-1">
            <h4 className="font-bold text-rose-400">3. Telemetry &amp; Tracker Blocker</h4>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Short-circuits background calls to <code>metrics.apple.com</code>, <code>xp.apple.com</code>, and <code>sentry</code> with an instant <code>204 No Content</code> response.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-1">
            <h4 className="font-bold text-rose-400">4 &amp; 5. GPU CSS Injection &amp; Zero-Reload SPA Back</h4>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Injects CSS on <code>onPageCommitVisible</code> stripping expensive <code>backdrop-filter</code> blurs, hiding &ldquo;Open in Music App&rdquo; banners, enabling <code>content-visibility: auto</code>, and routing Android Back via <code>window.history.back()</code>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
