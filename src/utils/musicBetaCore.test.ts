import test from 'node:test';
import assert from 'node:assert/strict';
import {
  selectOptimalDisplayMode,
  formatBytes,
  formatDuration,
  evaluateCacheHealth,
  resolveEffectiveTheme,
  getSystemBarAppearance,
  calculateSafeAreaInsets,
  generateSafeAreaCssInjection,
  detectNotchCollision,
  DisplayMode
} from './musicBetaCore';

test('selectOptimalDisplayMode picks highest refresh rate and breaks ties by resolution', () => {
  const modes: DisplayMode[] = [
    { modeId: 1, width: 1080, height: 2400, refreshRate: 60 },
    { modeId: 2, width: 1080, height: 2400, refreshRate: 120 },
    { modeId: 3, width: 1440, height: 3200, refreshRate: 120 },
    { modeId: 4, width: 1080, height: 2400, refreshRate: 90 },
  ];

  const optimal = selectOptimalDisplayMode(modes);
  assert.ok(optimal);
  assert.equal(optimal.modeId, 3);
  assert.equal(optimal.refreshRate, 120);
  assert.equal(optimal.width, 1440);
});

test('formatBytes formats bytes into human-readable strings correctly', () => {
  assert.equal(formatBytes(0), '0 MB');
  assert.equal(formatBytes(1024 * 1024 * 500), '500 MB');
  assert.equal(formatBytes(1024 * 1024 * 1024), '1 GB');
});

test('formatDuration formats seconds to mm:ss format', () => {
  assert.equal(formatDuration(0), '0:00');
  assert.equal(formatDuration(65), '1:05');
  assert.equal(formatDuration(200), '3:20');
});

test('evaluateCacheHealth triggers pruning when cache exceeds limit and targets 85%', () => {
  const underLimit = evaluateCacheHealth(400 * 1024 * 1024, 500 * 1024 * 1024);
  assert.equal(underLimit.needsPruning, false);
  assert.equal(underLimit.usagePercent, 80);

  const overLimit = evaluateCacheHealth(520 * 1024 * 1024, 500 * 1024 * 1024);
  assert.equal(overLimit.needsPruning, true);
  assert.equal(overLimit.targetPrunedBytes, Math.round(500 * 1024 * 1024 * 0.85));
});

test('resolveEffectiveTheme and getSystemBarAppearance produce correct status bar tinting', () => {
  assert.equal(resolveEffectiveTheme('system', true), 'dark');
  assert.equal(resolveEffectiveTheme('system', false), 'light');
  assert.equal(resolveEffectiveTheme('light', true), 'light');

  const lightBars = getSystemBarAppearance('light');
  assert.equal(lightBars.isAppearanceLightStatusBars, true);
  assert.equal(lightBars.isAppearanceLightNavigationBars, true);

  const darkBars = getSystemBarAppearance('dark');
  assert.equal(darkBars.isAppearanceLightStatusBars, false);
  assert.equal(darkBars.isAppearanceLightNavigationBars, false);
});

test('calculateSafeAreaInsets computes DP values from hardware density', () => {
  const insets = calculateSafeAreaInsets({
    statusBarPx: 120,
    displayCutoutPx: 135,
    navBarPx: 60,
    density: 3.0,
  });

  assert.equal(insets.px.top, 135);
  assert.equal(insets.px.bottom, 60);
  assert.equal(insets.dp.top, 45); // 135 / 3.0
  assert.equal(insets.dp.bottom, 20); // 60 / 3.0
});

test('generateSafeAreaCssInjection creates valid CSS variable assignment script', () => {
  const script = generateSafeAreaCssInjection({ top: 48, bottom: 24, left: 0, right: 0 });
  assert.ok(script.includes("--safe-area-top', '48px'"));
  assert.ok(script.includes("--safe-area-bottom', '24px'"));
});

test('detectNotchCollision identifies overlap when safe insets are disabled', () => {
  const isOverlapping = detectNotchCollision({
    headerTopDp: 0,
    headerHeightDp: 56,
    notchHeightDp: 44,
    isSafeInsetApplied: false,
  });
  assert.equal(isOverlapping, true);

  const isProtected = detectNotchCollision({
    headerTopDp: 0,
    headerHeightDp: 56,
    notchHeightDp: 44,
    isSafeInsetApplied: true,
  });
  assert.equal(isProtected, false);
});
