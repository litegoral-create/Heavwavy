import test from 'node:test';
import assert from 'node:assert/strict';
import {
  selectOptimalDisplayMode,
  formatBytes,
  evaluateCacheHealth,
  formatDuration,
  resolveEffectiveTheme,
  getSystemBarAppearance,
  DEFAULT_CACHE_SIZE_BYTES,
  DisplayMode,
} from './musicBetaCore';

test('selectOptimalDisplayMode picks the highest refresh rate mode (120Hz over 60Hz)', () => {
  const modes: DisplayMode[] = [
    { modeId: 1, width: 1080, height: 2400, refreshRate: 60.0 },
    { modeId: 2, width: 1080, height: 2400, refreshRate: 120.0 },
    { modeId: 3, width: 720, height: 1600, refreshRate: 90.0 },
  ];

  const optimal = selectOptimalDisplayMode(modes);
  assert.ok(optimal);
  assert.equal(optimal?.modeId, 2);
  assert.equal(optimal?.refreshRate, 120.0);
});

test('selectOptimalDisplayMode breaks refresh rate tie with highest resolution', () => {
  const modes: DisplayMode[] = [
    { modeId: 1, width: 1080, height: 2400, refreshRate: 120.0 },
    { modeId: 2, width: 1440, height: 3200, refreshRate: 120.0 },
    { modeId: 3, width: 1080, height: 2400, refreshRate: 60.0 },
  ];

  const optimal = selectOptimalDisplayMode(modes);
  assert.ok(optimal);
  assert.equal(optimal?.modeId, 2);
  assert.equal(optimal?.width, 1440);
});

test('selectOptimalDisplayMode handles empty or null array safely', () => {
  assert.equal(selectOptimalDisplayMode([]), null);
});

test('formatBytes formats 500MB properly', () => {
  assert.equal(formatBytes(500 * 1024 * 1024), '500 MB');
  assert.equal(formatBytes(0), '0 MB');
});

test('evaluateCacheHealth flags cache when above 500MB and calculates 85% prune target', () => {
  const underLimit = evaluateCacheHealth(250 * 1024 * 1024, DEFAULT_CACHE_SIZE_BYTES);
  assert.equal(underLimit.usagePercent, 50);
  assert.equal(underLimit.needsPruning, false);

  const overLimit = evaluateCacheHealth(520 * 1024 * 1024, DEFAULT_CACHE_SIZE_BYTES);
  assert.equal(overLimit.needsPruning, true);
  assert.equal(overLimit.targetPrunedBytes, Math.round(DEFAULT_CACHE_SIZE_BYTES * 0.85));
});

test('formatDuration formats track seconds into mm:ss', () => {
  assert.equal(formatDuration(185), '3:05');
  assert.equal(formatDuration(60), '1:00');
  assert.equal(formatDuration(9), '0:09');
});

test('resolveEffectiveTheme respects explicit light/dark and system fallback', () => {
  assert.equal(resolveEffectiveTheme('dark', false), 'dark');
  assert.equal(resolveEffectiveTheme('light', true), 'light');
  assert.equal(resolveEffectiveTheme('system', true), 'dark');
  assert.equal(resolveEffectiveTheme('system', false), 'light');
});

test('getSystemBarAppearance sets correct light/dark status bar icon tinting', () => {
  const lightConfig = getSystemBarAppearance('light');
  assert.equal(lightConfig.isAppearanceLightStatusBars, true);
  assert.equal(lightConfig.isAppearanceLightNavigationBars, true);
  assert.equal(lightConfig.backgroundColor, '#FFFFFF');

  const darkConfig = getSystemBarAppearance('dark');
  assert.equal(darkConfig.isAppearanceLightStatusBars, false);
  assert.equal(darkConfig.isAppearanceLightNavigationBars, false);
  assert.equal(darkConfig.backgroundColor, '#000000');
});
