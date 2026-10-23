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

