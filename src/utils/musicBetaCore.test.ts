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
  isTelemetryOrTrackerUrl,
  rewriteAppleArtworkUrl,
  isCacheableStaticAsset,
  generateGpuPerformanceCss,
  generateSpaBackNavigationScript,
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

test('rewriteAppleArtworkUrl rewrites oversized mzstatic.com images down to 300x300bb.webp', () => {
  const oversized =
    'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/12/34/ab/cover.jpg/1000x1000bb.jpg';
  const result1 = rewriteAppleArtworkUrl(oversized);
  assert.equal(result1.wasRewritten, true);
  assert.equal(result1.originalSpec, '1000x1000bb.jpg');
  assert.equal(
    result1.rewrittenUrl,
    'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/12/34/ab/cover.jpg/300x300bb.webp'
  );

  const mediumPng =
    'https://is2-ssl.mzstatic.com/image/thumb/Music116/v4/aa/bb/cc/art.png/600x600bb.png';
  const result2 = rewriteAppleArtworkUrl(mediumPng);
  assert.equal(result2.wasRewritten, true);
  assert.equal(
    result2.rewrittenUrl,
    'https://is2-ssl.mzstatic.com/image/thumb/Music116/v4/aa/bb/cc/art.png/300x300bb.webp'
  );

  const alreadyOptimized =
    'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/12/34/ab/cover.jpg/300x300bb.webp';
  const result3 = rewriteAppleArtworkUrl(alreadyOptimized);
  assert.equal(result3.wasRewritten, false);
  assert.equal(result3.rewrittenUrl, alreadyOptimized);
});

test('isTelemetryOrTrackerUrl detects metrics.apple.com, xp.apple.com, and sentry endpoints', () => {
  assert.equal(isTelemetryOrTrackerUrl('https://metrics.apple.com/b/ss/appleglobal/1/JS'), true);
  assert.equal(isTelemetryOrTrackerUrl('https://xp.apple.com/report/2/xp_amp_music'), true);
  assert.equal(isTelemetryOrTrackerUrl('https://o12345.ingest.sentry.io/api/54321/envelope/'), true);
  assert.equal(isTelemetryOrTrackerUrl('https://beta.music.apple.com/us/browse'), false);
  assert.equal(
    isTelemetryOrTrackerUrl('https://is1-ssl.mzstatic.com/image/thumb/Music/300x300bb.webp'),
    false
  );
});

test('isCacheableStaticAsset identifies .js, .css, .woff2, and mzstatic artwork while excluding telemetry', () => {
  assert.equal(
    isCacheableStaticAsset('https://beta.music.apple.com/assets/musickit.bundle.js'),
    true
  );
  assert.equal(
    isCacheableStaticAsset('https://beta.music.apple.com/assets/sf-pro-display.woff2'),
    true
  );
  assert.equal(
    isCacheableStaticAsset(
      'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/cover.jpg/300x300bb.webp'
    ),
    true
  );
  assert.equal(isCacheableStaticAsset('https://metrics.apple.com/tracker.js'), false);
});

test('generateGpuPerformanceCss and generateSpaBackNavigationScript contain expected optimizations', () => {
  const css = generateGpuPerformanceCss();
  assert.ok(css.includes('backdrop-filter: none !important'));
  assert.ok(css.includes('translateZ(0)'));
  assert.ok(css.includes('content-visibility: auto'));

  const backScript = generateSpaBackNavigationScript();
  assert.ok(backScript.includes('window.history.back()'));
});

test('parseGitHubRepoInput and buildGitTreeItems normalize GitHub repository inputs and tree entries', async () => {
  const { parseGitHubRepoInput, buildGitTreeItems } = await import('./musicBetaCore');

  assert.deepEqual(parseGitHubRepoInput('MusicBetaWrapper', 'octocat'), {
    owner: 'octocat',
    repo: 'MusicBetaWrapper',
    isValid: true,
  });

  assert.deepEqual(parseGitHubRepoInput('https://github.com/octocat/MusicBetaWrapper.git'), {
    owner: 'octocat',
    repo: 'MusicBetaWrapper',
    isValid: true,
  });

  const tree = buildGitTreeItems([
    { path: '/app/build.gradle.kts', content: 'plugins {}' },
    { path: 'app/build.gradle.kts', content: 'duplicate' },
    { path: '.github/workflows/release.yml', content: 'name: Build' },
  ]);
  assert.equal(tree.length, 2);
  assert.equal(tree[0].path, 'app/build.gradle.kts');
  assert.equal(tree[1].path, '.github/workflows/release.yml');
});

