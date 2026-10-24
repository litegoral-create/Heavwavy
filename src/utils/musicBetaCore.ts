/**
 * Core utility functions and constants for MusicBetaWrapper Android project.
 * Pure logic decoupled for testability and UI simulation.
 */

export type AppTheme = 'dark' | 'light' | 'system';

export interface SystemBarConfig {
  isAppearanceLightStatusBars: boolean;
  isAppearanceLightNavigationBars: boolean;
  statusBarColor: string;
  navigationBarColor: string;
  backgroundColor: string;
  textColor: string;
}

export interface DisplayMode {
  modeId: number;
  width: number;
  height: number;
  refreshRate: number;
}

export interface MediaTrack {
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  artworkUrl: string;
}

export interface CacheQuotaState {
  allocatedBytes: number;
  usedBytes: number;
  maxSizeBytes: number;
  fileCount: number;
}

export const IOS_USER_AGENT =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';

export const IPAD_USER_AGENT =
  'Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';

export const DEFAULT_CACHE_SIZE_BYTES = 500 * 1024 * 1024; // 500 MB

/**
 * Finds the optimal display mode by prioritizing maximum refresh rate (e.g. 120Hz, 144Hz, 165Hz)
 * and breaking ties with the highest screen resolution.
 */
export function selectOptimalDisplayMode(modes: DisplayMode[]): DisplayMode | null {
  if (!modes || modes.length === 0) return null;

  return [...modes].sort((a, b) => {
    if (b.refreshRate !== a.refreshRate) {
      return b.refreshRate - a.refreshRate;
    }
    const resA = a.width * a.height;
    const resB = b.width * b.height;
    return resB - resA;
  })[0];
}

/**
 * Formats byte values into human-readable strings (MB, GB, KB).
 */
export function formatBytes(bytes: number, decimals: number = 1): string {
  if (bytes === 0) return '0 MB';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i] || 'MB'}`;
}

/**
 * Calculates cache usage percentage and checks if pruning is needed (prunes down to 85% if exceeding 100%).
 */
export function evaluateCacheHealth(usedBytes: number, maxSizeBytes: number = DEFAULT_CACHE_SIZE_BYTES): {
  usagePercent: number;
  needsPruning: boolean;
  targetPrunedBytes: number;
} {
  const usagePercent = Math.min(100, Math.round((usedBytes / maxSizeBytes) * 100));
  const needsPruning = usedBytes > maxSizeBytes;
  const targetPrunedBytes = needsPruning ? Math.round(maxSizeBytes * 0.85) : usedBytes;

  return {
    usagePercent,
    needsPruning,
    targetPrunedBytes,
  };
}

/**
 * Generates the JavaScript injection code used by WebView to observe Apple Music's web player
 * and bridge MediaSession metadata and controls back to Android.
 */
export function generateWebViewInjectionScript(): string {
  return `(function() {
    if (window.__musicBetaBridgeInjected) return;
    window.__musicBetaBridgeInjected = true;
    window.dispatchMediaAction = function(action) {
      const selectors = {
        play: 'button[data-testid="play-pause-button"], button[aria-label="Play"], button[aria-label="Pause"]',
        pause: 'button[data-testid="play-pause-button"], button[aria-label="Play"], button[aria-label="Pause"]',
        next: 'button[aria-label="Next"], button[data-testid="next-button"]',
        previous: 'button[aria-label="Previous"], button[data-testid="previous-button"]'
      };
      const btn = document.querySelector(selectors[action]);
      if (btn) btn.click();
    };
  })();`;
}

/**
 * Formats time in seconds to mm:ss format.
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

/**
 * Resolves effective theme ('light' | 'dark') given user setting ('dark' | 'light' | 'system')
 * and system preference.
 */
export function resolveEffectiveTheme(
  themeChoice: AppTheme,
  systemPrefersDark: boolean = true
): 'dark' | 'light' {
  if (themeChoice === 'system') {
    return systemPrefersDark ? 'dark' : 'light';
  }
  return themeChoice;
}

/**
 * Computes WindowInsetsControllerCompat appearance flags and system bar colors
 * for dynamic edge-to-edge status and navigation bars.
 */
export function getSystemBarAppearance(effectiveTheme: 'dark' | 'light'): SystemBarConfig {
  if (effectiveTheme === 'light') {
    return {
      // In light mode, status/nav bar icons must be dark (isAppearanceLight = true)
      isAppearanceLightStatusBars: true,
      isAppearanceLightNavigationBars: true,
      statusBarColor: 'transparent',
      navigationBarColor: 'transparent',
      backgroundColor: '#FFFFFF',
      textColor: '#000000',
    };
  }

  // In dark mode, status/nav bar icons must be light (isAppearanceLight = false)
  return {
    isAppearanceLightStatusBars: false,
    isAppearanceLightNavigationBars: false,
    statusBarColor: 'transparent',
    navigationBarColor: 'transparent',
    backgroundColor: '#000000',
    textColor: '#FFFFFF',
  };
}

export interface SafeAreaInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/**
 * Calculates Density-Independent Pixel (DP) insets from hardware pixel values.
 * Accounts for status bar, display cutout (punch hole or notch), and navigation bar.
 */
export function calculateSafeAreaInsets(params: {
  statusBarPx: number;
  displayCutoutPx?: number;
  navBarPx: number;
  density?: number;
}): { px: SafeAreaInsets; dp: SafeAreaInsets } {
  const density = params.density && params.density > 0 ? params.density : 1.0;
  // Top inset is the maximum of status bar height and camera cutout height
  const topPx = Math.max(params.statusBarPx, params.displayCutoutPx || 0);
  const bottomPx = params.navBarPx;
  const leftPx = 0;
  const rightPx = 0;

  return {
    px: { top: topPx, bottom: bottomPx, left: leftPx, right: rightPx },
    dp: {
      top: Math.round(topPx / density),
      bottom: Math.round(bottomPx / density),
      left: Math.round(leftPx / density),
      right: Math.round(rightPx / density),
    },
  };
}

/**
 * Generates the JavaScript code injected by WebView's onApplyWindowInsets listener
 * to define CSS variables for safe area insets on mobile web content.
 */
export function generateSafeAreaCssInjection(insetsDp: SafeAreaInsets): string {
  return `(function() {
    var root = document.documentElement;
    root.style.setProperty('--safe-area-top', '${insetsDp.top}px');
    root.style.setProperty('--safe-area-bottom', '${insetsDp.bottom}px');
    root.style.setProperty('--safe-area-left', '${insetsDp.left}px');
    root.style.setProperty('--safe-area-right', '${insetsDp.right}px');
  })();`;
}

/**
 * Detects whether a header container is positioned within the status bar or notch danger zone
 * when safe area padding is disabled.
 */
export function detectNotchCollision(params: {
  headerTopDp: number;
  headerHeightDp: number;
  notchHeightDp: number;
  isSafeInsetApplied: boolean;
}): boolean {
  if (params.isSafeInsetApplied) return false;
  // If no safe inset is applied and header starts before the notch clears, collision occurs
  return params.headerTopDp < params.notchHeightDp;
}

/**
 * Optimization 3: Telemetry & Tracker Blocker patterns.
 * Matches background Apple Music telemetry, experiment tracking, and Sentry crash reporting endpoints.
 */
export const BLOCKED_TELEMETRY_PATTERNS = [
  'metrics.apple.com',
  'xp.apple.com',
  'dzc-metrics.mzstatic.com',
  'notes-analytics-events.apple.com',
  'pancake.apple.com',
  'books-analytics-events.apple.com',
  'sentry.io',
  'browser.sentry-cdn.com',
  '/sentry/',
];

export function isTelemetryOrTrackerUrl(url: string): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  return BLOCKED_TELEMETRY_PATTERNS.some((pattern) => lower.includes(pattern));
}

/**
 * Optimization 2: Apple CDN Artwork Downscaler & WebP Rewriter.
 * Rewrites oversized mzstatic.com thumbnails (e.g., 1000x1000bb.jpg, 600x600bb.png, 1200x1200cc.jpg)
 * down to 300x300bb.webp to eliminate main-thread bitmap decoding stutter and cut bandwidth by ~88%.
 */
export function rewriteAppleArtworkUrl(
  url: string,
  targetSpec: string = '300x300bb.webp'
): {
  rewrittenUrl: string;
  wasRewritten: boolean;
  originalSpec: string | null;
} {
  if (!url || !url.toLowerCase().includes('mzstatic.com')) {
    return { rewrittenUrl: url, wasRewritten: false, originalSpec: null };
  }

  // Matches trailing dimension pattern like /1000x1000bb.jpg, /600x600bb.webp, /1400x1400sr.png
  const artworkRegex = /\/(\d{3,4})x(\d{3,4})([a-z]{0,4})\.(jpg|jpeg|png|webp)(\?.*)?$/i;
  const match = url.match(artworkRegex);
  if (!match) {
    return { rewrittenUrl: url, wasRewritten: false, originalSpec: null };
  }

  const width = parseInt(match[1], 10);
  const height = parseInt(match[2], 10);
  const mode = match[3] || 'bb';
  const ext = match[4];
  const query = match[5] || '';
  const originalSpec = `${width}x${height}${mode}.${ext}`;

  // Rewrite if dimensions exceed 300px or if format is not already webp at <=300px
  if (width > 300 || height > 300 || ext.toLowerCase() !== 'webp') {
    const rewrittenUrl = url.replace(artworkRegex, `/${targetSpec}${query}`);
    return {
      rewrittenUrl,
      wasRewritten: rewrittenUrl !== url,
      originalSpec,
    };
  }

  return { rewrittenUrl: url, wasRewritten: false, originalSpec };
}

/**
 * Optimization 1: Aggressive Disk Caching (shouldInterceptRequest).
 * Determines whether a request URL represents an immutable/static asset (.js, .css, .woff2, or mzstatic artwork)
 * that should be intercepted and cached via OkHttpClient to context.cacheDir.
 */
export function isCacheableStaticAsset(url: string): boolean {
  if (!url || isTelemetryOrTrackerUrl(url)) return false;
  const lower = url.toLowerCase().split('?')[0];
  if (lower.includes('mzstatic.com') && /\.(jpg|jpeg|png|webp|svg|woff2|woff|ttf|js|css)$/.test(lower)) {
    return true;
  }
  return /\.(js|mjs|css|woff2|woff|ttf|otf|webp|png|jpg|jpeg|svg|ico)$/.test(lower);
}

/**
 * Optimization 4: CSS GPU Performance Injection.
 * Strips heavy real-time backdrop-filter blurs, hides "Open in Music App" promotional banners,
 * and promotes scrollable shelves & track lockups to GPU-accelerated layers with content-visibility: auto.
 */
export function generateGpuPerformanceCss(): string {
  return `
    /* 1. Strip expensive GPU Gaussian backdrop-filter blurs that cause scroll frame drops */
    *, *::before, *::after {
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
    }
    .chrome-player, .web-navigation, .header-bar, [class*="backdrop"], [class*="blur"] {
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
      background-color: rgba(18, 18, 22, 0.96) !important;
    }

    /* 2. Hide "Open in Music App" upsell banners & web promotional clutter */
    .upsell-banner, [data-testid="upsell-banner"], [class*="upsell"],
    [class*="open-in-app"], [class*="smart-banner"], .native-upsell,
    a[href*="itunes.apple.com"], button[aria-label*="Open in Music"] {
      display: none !important;
      height: 0 !important;
      max-height: 0 !important;
      visibility: hidden !important;
      pointer-events: none !important;
      overflow: hidden !important;
    }

    /* 3. Enable hardware-accelerated scrolling & offscreen layout skipping */
    main, .scrollable-page, [class*="shelf"], [class*="grid"] {
      transform: translateZ(0);
      -webkit-overflow-scrolling: touch;
      will-change: transform;
    }
    .shelf-grid__item, .songs-list-row, [data-testid="track-lockup"], [class*="lockup"] {
      content-visibility: auto;
      contain-intrinsic-size: 1px 240px;
    }
  `.trim();
}

/**
 * Optimization 5: Zero-Reload SPA Back Navigation Script.
 * Routes Android hardware/gesture Back press through window.history.back() inside the SPA
 * so MusicKit JS transitions views in-memory without a full WebView page reload.
 */
export function generateSpaBackNavigationScript(): string {
  return `(function() {
    if (window.history && window.history.length > 1) {
      window.history.back();
      return 'SPA_BACK_HANDLED';
    }
    return 'AT_ROOT';
  })();`;
}

export interface ParsedGitHubRepo {
  owner: string | null;
  repo: string;
  isValid: boolean;
}

/**
 * Parses a repository input string (e.g. "MusicBetaWrapper", "username/MusicBetaWrapper",
 * or "https://github.com/username/MusicBetaWrapper.git") into owner and repo name.
 */
export function parseGitHubRepoInput(input: string, fallbackOwner?: string): ParsedGitHubRepo {
  const trimmed = (input || '').trim().replace(/\/+$/, '').replace(/\.git$/i, '');
  if (!trimmed) {
    return { owner: fallbackOwner || null, repo: '', isValid: false };
  }

  // Handle full GitHub URL
  const urlMatch = trimmed.match(/github\.com\/([^/]+)\/([^/]+)/i);
  if (urlMatch) {
    const owner = urlMatch[1].trim();
    const repo = urlMatch[2].trim();
    return {
      owner,
      repo,
      isValid: /^[a-zA-Z0-9._-]+$/.test(owner) && /^[a-zA-Z0-9._-]+$/.test(repo),
    };
  }

  // Handle owner/repo shorthand
  if (trimmed.includes('/')) {
    const parts = trimmed.split('/').filter(Boolean);
    if (parts.length === 2) {
      const [owner, repo] = parts;
      return {
        owner,
        repo,
        isValid: /^[a-zA-Z0-9._-]+$/.test(owner) && /^[a-zA-Z0-9._-]+$/.test(repo),
      };
    }
    return { owner: null, repo: trimmed, isValid: false };
  }

  // Repo name only
  const isValidRepo = /^[a-zA-Z0-9._-]+$/.test(trimmed);
  return {
    owner: fallbackOwner || null,
    repo: trimmed,
    isValid: isValidRepo,
  };
}

export interface GitTreeItemInput {
  path: string;
  content: string;
}

export interface GitHubTreeEntry {
  path: string;
  mode: '100644';
  type: 'blob';
  content: string;
}

/**
 * Builds the GitHub Git Data API tree array from project files, ensuring no leading slashes
 * and no duplicate paths.
 */
export function buildGitTreeItems(files: GitTreeItemInput[]): GitHubTreeEntry[] {
  const seen = new Set<string>();
  const entries: GitHubTreeEntry[] = [];

  for (const file of files) {
    const normalizedPath = file.path.replace(/^\/+/, '');
    if (!normalizedPath || seen.has(normalizedPath)) continue;
    seen.add(normalizedPath);
    entries.push({
      path: normalizedPath,
      mode: '100644',
      type: 'blob',
      content: file.content,
    });
  }

  return entries;
}


