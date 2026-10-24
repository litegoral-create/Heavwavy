export interface ProjectFileItem {
  id: string;
  name: string;
  path: string;
  category: 'core' | 'manifest' | 'kotlin' | 'layout' | 'workflow' | 'config';
  language: 'kotlin' | 'xml' | 'groovy' | 'yaml' | 'properties';
  description: string;
  requirementTags: string[];
  content: string;
}

export const PROJECT_FILES: ProjectFileItem[] = [
  {
    id: 'app-build-gradle',
    name: 'app/build.gradle.kts',
    path: 'app/build.gradle.kts',
    category: 'core',
    language: 'kotlin',
    description: 'Gradle configuration for Android 14 (API 34, minSdk 26) with MediaSession & WebKit dependencies.',
    requirementTags: ['Core Requirement #1', 'API 34 / minSdk 26', 'MediaSessionCompat'],
    content: `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.musicbeta.wrapper"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.musicbeta.wrapper"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            signingConfig = signingConfigs.getByName("debug") // fallback if release keystore not configured
        }
        debug {
            applicationIdSuffix = ".debug"
            isDebuggable = true
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
        freeCompilerArgs = listOf(
            "-opt-in=kotlinx.coroutines.ExperimentalCoroutinesApi"
        )
    }

    buildFeatures {
        viewBinding = true
    }
}

dependencies {
    // Core AndroidX & UI
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("com.google.android.material:material:1.11.0")
    implementation("androidx.activity:activity-ktx:1.9.0")
    implementation("androidx.coordinatorlayout:coordinatorlayout:1.2.0")

    // High-Performance WebView & OkHttp Aggressive Disk Cache Interceptor
    implementation("androidx.webkit:webkit:1.11.0")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")

    // MediaSession & Foreground Media Notification (Android 14+ compliant)
    implementation("androidx.media:media:1.7.0")

    // Coroutines & Lifecycle
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.7.0")
    implementation("androidx.lifecycle:lifecycle-service:2.7.0")

    // Testing
    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.1.5")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.5.1")
}`
  },
  {
    id: 'android-manifest',
    name: 'AndroidManifest.xml',
    path: 'app/src/main/AndroidManifest.xml',
    category: 'manifest',
    language: 'xml',
    description: 'Hardware acceleration enabled, zero-reload SPA configChanges, Android 14 mediaPlayback foreground service, wake locks, and deep links.',
    requirementTags: ['Core Requirement #1 & #2', 'hardwareAccelerated="true"', 'Zero-Reload configChanges', 'foregroundServiceType="mediaPlayback"'],
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">

    <!-- Network & Streaming Permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
    <uses-permission android:name="android.permission.CHANGE_WIFI_MULTICAST_STATE" />

    <!-- Screen-Off Background Audio & Power Management -->
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <!-- Android 14+ (API 34) Foreground Service type requirement -->
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK" />
    <!-- Android 13+ (API 33) Notification permission -->
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />

    <application
        android:allowBackup="true"
        android:hardwareAccelerated="true"
        android:largeHeap="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.MusicBetaWrapper"
        android:usesCleartextTraffic="false"
        tools:targetApi="34">

        <!-- Main Wrapper Activity with Edge-to-Edge, High Refresh Rate & Zero-Reload SPA Lifecycle -->
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:hardwareAccelerated="true"
            android:launchMode="singleTask"
            android:configChanges="orientation|screenSize|smallestScreenSize|screenLayout|keyboard|keyboardHidden|navigation|uiMode|density|fontScale"
            android:windowSoftInputMode="adjustResize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>

            <!-- Deep linking for Apple Music and Beta web links -->
            <intent-filter android:autoVerify="true">
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data
                    android:scheme="https"
                    android:host="beta.music.apple.com" />
            </intent-filter>
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data
                    android:scheme="https"
                    android:host="music.apple.com" />
            </intent-filter>
        </activity>

        <!-- Media Playback Foreground Service for uninterrupted background streaming -->
        <service
            android:name=".MediaPlaybackService"
            android:enabled="true"
            android:exported="false"
            android:foregroundServiceType="mediaPlayback" />

    </application>

</manifest>`
  },
  {
    id: 'main-activity',
    name: 'MainActivity.kt',
    path: 'app/src/main/java/com/musicbeta/wrapper/MainActivity.kt',
    category: 'kotlin',
    language: 'kotlin',
    description: '5 WebView Anti-Lag Optimizations: OkHttp Disk Cache (shouldInterceptRequest), mzstatic 300x300bb.webp Artwork Downscaler, Telemetry Blocker, GPU CSS Injection, and Zero-Reload SPA Back Navigation.',
    requirementTags: ['OkHttp Disk Cache', '300x300bb.webp Artwork', 'Telemetry Blocker', 'GPU CSS Injection', 'SPA window.history.back()'],
    content: `package com.musicbeta.wrapper

import android.Manifest
import android.annotation.SuppressLint
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.SharedPreferences
import android.content.pm.PackageManager
import android.content.res.Configuration
import android.graphics.Bitmap
import android.graphics.Color
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.Build
import android.os.Bundle
import android.util.Log
import android.view.Display
import android.view.View
import android.webkit.ConsoleMessage
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import android.widget.ProgressBar
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.app.AppCompatDelegate
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.webkit.WebSettingsCompat
import androidx.webkit.WebViewFeature
import okhttp3.Cache
import okhttp3.CacheControl
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.ByteArrayInputStream
import java.io.File
import java.util.concurrent.TimeUnit

/**
 * MainActivity for MusicBetaWrapper.
 * High-performance, edge-to-edge wrapper around https://beta.music.apple.com
 *
 * Key Capabilities:
 * 1. 120Hz+ Display Refresh Rate Forcing
 * 2. Uninterrupted Background Audio (Screen-Off) via ForegroundService & Wake/Wi-Fi locks
 * 3. 500MB Dedicated Internal WebView & OkHttp Disk Cache (shouldInterceptRequest)
 * 4. Apple CDN (mzstatic.com) Artwork Downscaler (1000x1000bb -> 300x300bb.webp)
 * 5. Telemetry & Tracker Blocker (metrics.apple.com, xp.apple.com, sentry)
 * 6. CSS GPU Performance Injection (strips backdrop-filter blurs, hides app banners, enables translateZ(0) & content-visibility)
 * 7. Zero-Reload SPA Navigation (window.history.back(), RenderPriority.HIGH, configChanges)
 */
class MainActivity : AppCompatActivity() {

    companion object {
        private const val TAG = "MusicBetaWrapper"
        private const val APPLE_MUSIC_BETA_URL = "https://beta.music.apple.com"
        private const val NOTIFICATION_PERMISSION_CODE = 1001
        private const val DISK_CACHE_MAX_BYTES = 500L * 1024L * 1024L // 500 MB

        // Preferences for Light/Dark Mode
        private const val PREFS_NAME = "music_wrapper_prefs"
        private const val KEY_THEME_MODE = "pref_theme_mode"
        const val THEME_SYSTEM = "system"
        const val THEME_LIGHT = "light"
        const val THEME_DARK = "dark"

        // iOS Safari 17.5 User-Agent (iPhone Mobile)
        const val IOS_USER_AGENT = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1"

        // Broadcast actions between Activity and MediaPlaybackService
        const val ACTION_MEDIA_COMMAND = "com.musicbeta.wrapper.MEDIA_COMMAND"
        const val EXTRA_COMMAND = "extra_command"
        const val COMMAND_PLAY = "command_play"
        const val COMMAND_PAUSE = "command_pause"
        const val COMMAND_NEXT = "command_next"
        const val COMMAND_PREV = "command_prev"

        // Optimization 3: Blocked Telemetry & Analytics Domains/Substrings
        private val BLOCKED_TELEMETRY_PATTERNS = listOf(
            "metrics.apple.com",
            "xp.apple.com",
            "dzc-metrics.mzstatic.com",
            "notes-analytics-events.apple.com",
            "pancake.apple.com",
            "books-analytics-events.apple.com",
            "sentry.io",
            "browser.sentry-cdn.com",
            "/sentry/"
        )

        // Optimization 2: Regex matching oversized mzstatic.com artwork (e.g. /1000x1000bb.jpg or /600x600bb.png)
        private val MZSTATIC_ARTWORK_REGEX = Regex(
            """/(\\d{3,4})x(\\d{3,4})([a-z]{0,4})\\.(jpg|jpeg|png|webp)(\\?.*)?$""",
            RegexOption.IGNORE_CASE
        )
    }

    private lateinit var rootContainer: View
    private lateinit var webView: WebView
    private lateinit var progressBar: ProgressBar
    private lateinit var errorLayout: FrameLayout
    private lateinit var insetsController: WindowInsetsControllerCompat
    private lateinit var sharedPreferences: SharedPreferences
    private lateinit var okHttpClient: OkHttpClient

    private var currentRefreshRate: Float = 60.0f
    private var isPlayingAudio: Boolean = false
    private var currentThemeMode: String = THEME_SYSTEM
    private var lastTopInsetDp: Int = 0
    private var lastBottomInsetDp: Int = 0
    private var lastLeftInsetDp: Int = 0
    private var lastRightInsetDp: Int = 0

    // Broadcast receiver for hardware media keys forwarded by MediaPlaybackService
    private val mediaCommandReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            if (intent?.action == ACTION_MEDIA_COMMAND) {
                when (intent.getStringExtra(EXTRA_COMMAND)) {
                    COMMAND_PLAY -> executeJavaScript("dispatchMediaAction('play')")
                    COMMAND_PAUSE -> executeJavaScript("dispatchMediaAction('pause')")
                    COMMAND_NEXT -> executeJavaScript("dispatchMediaAction('next')")
                    COMMAND_PREV -> executeJavaScript("dispatchMediaAction('previous')")
                }
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        sharedPreferences = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        currentThemeMode = sharedPreferences.getString(KEY_THEME_MODE, THEME_SYSTEM) ?: THEME_SYSTEM

        // Apply saved theme before view inflation
        applyAppCompatNightMode(currentThemeMode)

        super.onCreate(savedInstanceState)

        // 1. Force High Refresh Rate (120 Hz+)
        enforceMaxDisplayRefreshRate()

        // 2. Setup True Edge-to-Edge display with dynamic status & nav bar tinting
        setupEdgeToEdge()

        setContentView(R.layout.activity_main)

        rootContainer = findViewById(R.id.rootContainer)
        webView = findViewById(R.id.webView)
        progressBar = findViewById(R.id.progressBar)
        errorLayout = findViewById(R.id.errorLayout)

        // Setup Safe Area Inset Handling to resolve Status Bar & Camera Notch Overlap
        setupWindowInsetsHandling()

        // Request POST_NOTIFICATIONS on Android 13+ (API 33+) for foreground media notification
        checkNotificationPermission()

        // 3. Configure WebView for Maximum Performance, 500MB Cache & Light/Dark styling
        configureHighPerformanceWebView()

        // 4. Setup Back-press handling to navigate WebView history
        setupBackNavigation()

        // 5. Register Media Command Receiver
        val filter = IntentFilter(ACTION_MEDIA_COMMAND)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(mediaCommandReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
        } else {
            registerReceiver(mediaCommandReceiver, filter)
        }

        // 6. Load Apple Music Beta
        if (savedInstanceState == null) {
            val targetUrl = intent?.dataString ?: APPLE_MUSIC_BETA_URL
            webView.loadUrl(targetUrl)
        } else {
            webView.restoreState(savedInstanceState)
        }
    }

    private fun enforceMaxDisplayRefreshRate() {
        try {
            val displayObj: Display? = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                display
            } else {
                @Suppress("DEPRECATION")
                windowManager.defaultDisplay
            }

            if (displayObj != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                val modes = displayObj.supportedModes
                val bestMode = modes.maxWithOrNull(
                    compareBy<Display.Mode> { it.refreshRate }
                        .thenBy { it.physicalWidth * it.physicalHeight }
                )

                if (bestMode != null) {
                    currentRefreshRate = bestMode.refreshRate
                    val layoutParams = window.attributes
                    layoutParams.preferredDisplayModeId = bestMode.modeId
                    layoutParams.preferredRefreshRate = bestMode.refreshRate
                    window.attributes = layoutParams
                    Log.i(TAG, "Forced display refresh rate to: \${bestMode.refreshRate} Hz (Mode ID: \${bestMode.modeId})")
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error configuring 120Hz display refresh mode", e)
        }
    }

    private fun setupEdgeToEdge() {
        WindowCompat.setDecorFitsSystemWindows(window, false)
        supportActionBar?.hide()

        window.statusBarColor = Color.TRANSPARENT
        window.navigationBarColor = Color.TRANSPARENT

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            window.attributes.layoutInDisplayCutoutMode =
                android.view.WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
        }

        insetsController = WindowInsetsControllerCompat(window, window.decorView)
        updateSystemBarsForCurrentTheme()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            window.isNavigationBarContrastEnforced = false
            window.isStatusBarContrastEnforced = false
        }
    }

    private fun setupWindowInsetsHandling() {
        ViewCompat.setOnApplyWindowInsetsListener(rootContainer) { view, windowInsets ->
            val insets = windowInsets.getInsets(
                WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout()
            )

            // Apply native hardware safe-area padding so WebView never overlaps status bar or notch
            view.setPadding(insets.left, insets.top, insets.right, insets.bottom)

            val density = resources.displayMetrics.density
            lastTopInsetDp = (insets.top / density).toInt()
            lastBottomInsetDp = (insets.bottom / density).toInt()
            lastLeftInsetDp = (insets.left / density).toInt()
            lastRightInsetDp = (insets.right / density).toInt()

            val progressParams = progressBar.layoutParams as? FrameLayout.LayoutParams
                ?: (progressBar.layoutParams as? androidx.coordinatorlayout.widget.CoordinatorLayout.LayoutParams)
            progressParams?.topMargin = 0
            progressBar.layoutParams = progressParams

            injectSafeAreaInsetsScript()

            WindowInsetsCompat.CONSUMED
        }
    }

    private fun injectSafeAreaInsetsScript() {
        val cssScript = """
            (function() {
                var root = document.documentElement;
                root.style.setProperty('--safe-area-top', '\${lastTopInsetDp}px');
                root.style.setProperty('--safe-area-bottom', '\${lastBottomInsetDp}px');
                root.style.setProperty('--safe-area-left', '\${lastLeftInsetDp}px');
                root.style.setProperty('--safe-area-right', '\${lastRightInsetDp}px');
            })();
        """.trimIndent()
        executeJavaScript(cssScript)
    }

    private fun updateSystemBarsForCurrentTheme() {
        val isDarkMode = isEffectiveDarkMode()
        insetsController.isAppearanceLightStatusBars = !isDarkMode
        insetsController.isAppearanceLightNavigationBars = !isDarkMode
    }

    private fun isEffectiveDarkMode(): Boolean {
        return when (currentThemeMode) {
            THEME_LIGHT -> false
            THEME_DARK -> true
            else -> {
                val currentNightMode = resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK
                currentNightMode == Configuration.UI_MODE_NIGHT_YES
            }
        }
    }

    fun setThemeMode(mode: String) {
        currentThemeMode = mode
        sharedPreferences.edit().putString(KEY_THEME_MODE, mode).apply()
        applyAppCompatNightMode(mode)
        updateSystemBarsForCurrentTheme()
        applyWebViewTheme(mode)
    }

    private fun applyAppCompatNightMode(mode: String) {
        val nightMode = when (mode) {
            THEME_LIGHT -> AppCompatDelegate.MODE_NIGHT_NO
            THEME_DARK -> AppCompatDelegate.MODE_NIGHT_YES
            else -> AppCompatDelegate.MODE_NIGHT_FOLLOW_SYSTEM
        }
        AppCompatDelegate.setDefaultNightMode(nightMode)
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun configureHighPerformanceWebView() {
        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null)
        webView.isVerticalScrollBarEnabled = false
        webView.isHorizontalScrollBarEnabled = false

        val settings = webView.settings

        // 1. JavaScript & Storage
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.databaseEnabled = true

        // 2. 500 MB Dedicated OkHttp Disk Cache & WebView Cache Allocation
        val customCacheDir = File(applicationContext.cacheDir, "music_beta_webview_cache")
        if (!customCacheDir.exists()) {
            customCacheDir.mkdirs()
        }

        val okHttpCacheDir = File(applicationContext.cacheDir, "music_beta_okhttp_cache")
        if (!okHttpCacheDir.exists()) {
            okHttpCacheDir.mkdirs()
        }

        okHttpClient = OkHttpClient.Builder()
            .cache(Cache(okHttpCacheDir, DISK_CACHE_MAX_BYTES))
            .connectTimeout(10, TimeUnit.SECONDS)
            .readTimeout(15, TimeUnit.SECONDS)
            .followRedirects(true)
            .followSslRedirects(true)
            .addNetworkInterceptor { chain ->
                val response = chain.proceed(chain.request())
                response.newBuilder()
                    .removeHeader("Pragma")
                    .removeHeader("Vary")
                    .header("Cache-Control", "public, max-age=604800, immutable")
                    .build()
            }
            .build()

        // Optimization 5: LOAD_DEFAULT with offline fallback to LOAD_CACHE_ELSE_NETWORK
        settings.cacheMode = if (isNetworkAvailable()) {
            WebSettings.LOAD_DEFAULT
        } else {
            WebSettings.LOAD_CACHE_ELSE_NETWORK
        }
        manageCacheQuota(customCacheDir, DISK_CACHE_MAX_BYTES)

        // 3. Optimization 5: High Render Priority & Pre-Rasterization
        @Suppress("DEPRECATION")
        settings.setRenderPriority(WebSettings.RenderPriority.HIGH)
        settings.offscreenPreRaster = true
        settings.mediaPlaybackRequiresUserGesture = false
        settings.mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE
        settings.setSupportMultipleWindows(false)
        settings.loadsImagesAutomatically = true
        settings.allowFileAccess = false
        settings.allowContentAccess = false

        // 4. iOS Safari User-Agent Override
        settings.userAgentString = IOS_USER_AGENT

        // 5. Light/Dark Mode configuration on WebView
        applyWebViewTheme(currentThemeMode)

        // 6. JavaScript Interface for Media Session & Background Sync
        webView.addJavascriptInterface(MusicBridge(), "AndroidBridge")

        // 7. Custom WebViewClient with shouldInterceptRequest & GPU CSS Injection
        setupWebViewClients()
    }

    private fun isNetworkAvailable(): Boolean {
        val cm = getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager ?: return true
        val network = cm.activeNetwork ?: return false
        val capabilities = cm.getNetworkCapabilities(network) ?: return false
        return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }

    private fun applyWebViewTheme(mode: String) {
        val isDark = isEffectiveDarkMode()
        val bgColor = if (isDark) Color.parseColor("#000000") else Color.parseColor("#FFFFFF")
        rootContainer.setBackgroundColor(bgColor)
        webView.setBackgroundColor(bgColor)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            if (WebViewFeature.isFeatureSupported(WebViewFeature.ALGORITHMIC_DARKENING)) {
                WebSettingsCompat.setAlgorithmicDarkeningAllowed(webView.settings, isDark)
            }
        }
        if (WebViewFeature.isFeatureSupported(WebViewFeature.FORCE_DARK)) {
            val forceDarkValue = when (mode) {
                THEME_LIGHT -> WebSettingsCompat.FORCE_DARK_OFF
                THEME_DARK -> WebSettingsCompat.FORCE_DARK_ON
                else -> WebSettingsCompat.FORCE_DARK_AUTO
            }
            WebSettingsCompat.setForceDark(webView.settings, forceDarkValue)
        }

        val themeScript = """
            (function() {
                const scheme = '\${if (isDark) "dark" else "light"}';
                document.documentElement.style.colorScheme = scheme;
                let meta = document.querySelector('meta[name="color-scheme"]');
                if (!meta) {
                    meta = document.createElement('meta');
                    meta.name = 'color-scheme';
                    document.head.appendChild(meta);
                }
                meta.content = scheme;
            })();
        """.trimIndent()
        webView.evaluateJavascript(themeScript, null)
    }

    private fun setupWebViewClients() {
        webView.webViewClient = object : WebViewClient() {
            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                super.onPageStarted(view, url, favicon)
                progressBar.visibility = View.VISIBLE
                errorLayout.visibility = View.GONE
            }

            override fun onPageCommitVisible(view: WebView?, url: String?) {
                super.onPageCommitVisible(view, url)
                injectSafeAreaInsetsScript()
                injectGpuPerformanceCss()
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                progressBar.visibility = View.GONE
                applyWebViewTheme(currentThemeMode)
                injectSafeAreaInsetsScript()
                injectGpuPerformanceCss()
                injectAudioBridgeScript()
            }

            override fun shouldInterceptRequest(
                view: WebView?,
                request: WebResourceRequest?
            ): WebResourceResponse? {
                val req = request ?: return null
                val rawUrl = req.url?.toString() ?: return null

                // Optimization 3: Block background tracking/metrics calls immediately
                if (isTelemetryOrTrackerUrl(rawUrl)) {
                    return createEmptyBlockedResponse()
                }

                // Only intercept GET requests for static asset caching & artwork optimization
                if (!req.method.equals("GET", ignoreCase = true)) {
                    return super.shouldInterceptRequest(view, request)
                }

                // Optimization 2: Rewrite oversized mzstatic.com album art to 300x300bb.webp
                val targetUrl = rewriteAppleArtworkUrl(rawUrl)

                // Optimization 1: Cache static assets (.js, .css, .woff2, and mzstatic.com artwork) to disk
                if (isCacheableStaticAsset(targetUrl)) {
                    fetchFromOkHttpDiskCache(targetUrl, req)?.let { cachedResponse ->
                        return cachedResponse
                    }
                }

                return super.shouldInterceptRequest(view, request)
            }

            override fun onReceivedError(view: WebView?, errorCode: Int, description: String?, failingUrl: String?) {
                super.onReceivedError(view, errorCode, description, failingUrl)
                if (errorCode == ERROR_HOST_LOOKUP || errorCode == ERROR_CONNECT) {
                    errorLayout.visibility = View.VISIBLE
                }
            }

            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val url = request?.url?.toString() ?: return false
                return if (url.contains("music.apple.com")) false else false
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                progressBar.progress = newProgress
                if (newProgress >= 100) {
                    progressBar.visibility = View.GONE
                }
            }

            override fun onConsoleMessage(consoleMessage: ConsoleMessage?): Boolean {
                Log.d(TAG, "WebView Console: \${consoleMessage?.message()} (line \${consoleMessage?.lineNumber()})")
                return true
            }
        }
    }

    private fun isTelemetryOrTrackerUrl(url: String): Boolean {
        val lower = url.lowercase()
        return BLOCKED_TELEMETRY_PATTERNS.any { lower.contains(it) }
    }

    private fun createEmptyBlockedResponse(): WebResourceResponse {
        return WebResourceResponse(
            "text/plain",
            "UTF-8",
            204,
            "No Content",
            mapOf(
                "Access-Control-Allow-Origin" to "*",
                "Cache-Control" to "max-age=86400"
            ),
            ByteArrayInputStream(ByteArray(0))
        )
    }

    private fun rewriteAppleArtworkUrl(url: String): String {
        if (!url.contains("mzstatic.com", ignoreCase = true)) return url
        val match = MZSTATIC_ARTWORK_REGEX.find(url) ?: return url
        val width = match.groupValues[1].toIntOrNull() ?: return url
        val height = match.groupValues[2].toIntOrNull() ?: return url
        val ext = match.groupValues[4].lowercase()
        val query = match.groupValues[5]

        if (width > 300 || height > 300 || ext != "webp") {
            return url.replace(MZSTATIC_ARTWORK_REGEX, "/300x300bb.webp$query")
        }
        return url
    }

    private fun isCacheableStaticAsset(url: String): Boolean {
        val cleanPath = url.substringBefore('?').lowercase()
        if (cleanPath.contains("mzstatic.com") &&
            (cleanPath.endsWith(".webp") || cleanPath.endsWith(".jpg") || cleanPath.endsWith(".jpeg") || cleanPath.endsWith(".png"))
        ) {
            return true
        }
        return cleanPath.endsWith(".js") ||
            cleanPath.endsWith(".mjs") ||
            cleanPath.endsWith(".css") ||
            cleanPath.endsWith(".woff2") ||
            cleanPath.endsWith(".woff") ||
            cleanPath.endsWith(".ttf") ||
            cleanPath.endsWith(".svg")
    }

    private fun fetchFromOkHttpDiskCache(targetUrl: String, webRequest: WebResourceRequest): WebResourceResponse? {
        return try {
            val requestBuilder = Request.Builder()
                .url(targetUrl)
                .header("User-Agent", IOS_USER_AGENT)

            webRequest.requestHeaders["Accept"]?.let { requestBuilder.header("Accept", it) }
            webRequest.requestHeaders["Referer"]?.let { requestBuilder.header("Referer", it) }

            if (!isNetworkAvailable()) {
                requestBuilder.cacheControl(CacheControl.FORCE_CACHE)
            }

            val response = okHttpClient.newCall(requestBuilder.build()).execute()
            if (!response.isSuccessful) {
                response.close()
                return null
            }

            val body = response.body ?: return null
            val contentTypeHeader = response.header("Content-Type", guessMimeType(targetUrl)) ?: "application/octet-stream"
            val mimeType = contentTypeHeader.substringBefore(';').trim()
            val encoding = if (contentTypeHeader.contains("charset=", ignoreCase = true)) {
                contentTypeHeader.substringAfter("charset=", "UTF-8").substringBefore(';').trim()
            } else {
                "UTF-8"
            }

            val responseHeaders = mutableMapOf(
                "Access-Control-Allow-Origin" to "*",
                "Access-Control-Allow-Methods" to "GET, HEAD, OPTIONS",
                "Cache-Control" to "public, max-age=604800, immutable"
            )

            WebResourceResponse(
                mimeType,
                encoding,
                response.code,
                response.message.ifEmpty { "OK" },
                responseHeaders,
                body.byteStream()
            )
        } catch (e: Exception) {
            Log.w(TAG, "OkHttp cache miss/fallback for $targetUrl: \${e.message}")
            null
        }
    }

    private fun guessMimeType(url: String): String {
        val clean = url.substringBefore('?').lowercase()
        return when {
            clean.endsWith(".js") || clean.endsWith(".mjs") -> "application/javascript"
            clean.endsWith(".css") -> "text/css"
            clean.endsWith(".woff2") -> "font/woff2"
            clean.endsWith(".woff") -> "font/woff"
            clean.endsWith(".ttf") -> "font/ttf"
            clean.endsWith(".webp") -> "image/webp"
            clean.endsWith(".png") -> "image/png"
            clean.endsWith(".jpg") || clean.endsWith(".jpeg") -> "image/jpeg"
            clean.endsWith(".svg") -> "image/svg+xml"
            else -> "application/octet-stream"
        }
    }

    private fun injectGpuPerformanceCss() {
        val gpuCssScript = """
            (function() {
                if (document.getElementById('__music_beta_gpu_perf_css')) return;
                const style = document.createElement('style');
                style.id = '__music_beta_gpu_perf_css';
                style.textContent = [
                    '/* 1. Strip expensive GPU Gaussian backdrop-filter blurs */',
                    '*, *::before, *::after { backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }',
                    '.chrome-player, .web-navigation, .header-bar, [class*="backdrop"], [class*="blur"] { backdrop-filter: none !important; -webkit-backdrop-filter: none !important; background-color: rgba(18, 18, 22, 0.96) !important; }',
                    '/* 2. Hide "Open in Music App" upsell banners & promotional clutter */',
                    '.upsell-banner, [data-testid="upsell-banner"], [class*="upsell"], [class*="open-in-app"], [class*="smart-banner"], .native-upsell, a[href*="itunes.apple.com"], button[aria-label*="Open in Music"] { display: none !important; height: 0 !important; max-height: 0 !important; visibility: hidden !important; pointer-events: none !important; overflow: hidden !important; }',
                    '/* 3. Enable GPU hardware-accelerated scrolling & content-visibility */',
                    'main, .scrollable-page, [class*="shelf"], [class*="grid"] { transform: translateZ(0); -webkit-overflow-scrolling: touch; will-change: transform; }',
                    '.shelf-grid__item, .songs-list-row, [data-testid="track-lockup"], [class*="lockup"] { content-visibility: auto; contain-intrinsic-size: 1px 240px; }'
                ].join('\\n');
                (document.head || document.documentElement).appendChild(style);
            })();
        """.trimIndent()
        executeJavaScript(gpuCssScript)
    }

    private fun injectAudioBridgeScript() {
        val script = """
            (function() {
                if (window.__musicBetaBridgeInjected) return;
                window.__musicBetaBridgeInjected = true;

                window.dispatchMediaAction = function(action) {
                    try {
                        if (action === 'play' || action === 'pause') {
                            const btn = document.querySelector('button[data-testid="play-pause-button"], button[aria-label="Play"], button[aria-label="Pause"], .playback-play-pause-button');
                            if (btn) btn.click();
                        } else if (action === 'next') {
                            const nextBtn = document.querySelector('button[aria-label="Next"], button[data-testid="next-button"], .playback-forward-button');
                            if (nextBtn) nextBtn.click();
                        } else if (action === 'previous') {
                            const prevBtn = document.querySelector('button[aria-label="Previous"], button[data-testid="previous-button"], .playback-backward-button');
                            if (prevBtn) prevBtn.click();
                        }
                    } catch(e) {
                        console.error('Error dispatching media action:', e);
                    }
                };

                const notifyStateChange = function(playing) {
                    let title = "Apple Music";
                    let artist = "Now Playing";
                    let artwork = "";

                    if (navigator.mediaSession && navigator.mediaSession.metadata) {
                        title = navigator.mediaSession.metadata.title || title;
                        artist = navigator.mediaSession.metadata.artist || artist;
                        if (navigator.mediaSession.metadata.artwork && navigator.mediaSession.metadata.artwork.length > 0) {
                            artwork = navigator.mediaSession.metadata.artwork[0].src || "";
                        }
                    }

                    if (window.AndroidBridge) {
                        window.AndroidBridge.onPlaybackStateChanged(playing, title, artist, artwork);
                    }
                };

                document.addEventListener('play', function(e) {
                    if (e.target.tagName === 'AUDIO') {
                        notifyStateChange(true);
                    }
                }, true);

                document.addEventListener('pause', function(e) {
                    if (e.target.tagName === 'AUDIO') {
                        notifyStateChange(false);
                    }
                }, true);

                if ('mediaSession' in navigator) {
                    setInterval(function() {
                        if (navigator.mediaSession && navigator.mediaSession.metadata) {
                            const meta = navigator.mediaSession.metadata;
                            const isPlaying = navigator.mediaSession.playbackState === 'playing';
                            const art = (meta.artwork && meta.artwork.length > 0) ? meta.artwork[0].src : '';
                            if (window.AndroidBridge) {
                                window.AndroidBridge.onMetadataUpdated(meta.title || '', meta.artist || '', art, isPlaying);
                            }
                        }
                    }, 2000);
                }
            })();
        """.trimIndent()

        webView.evaluateJavascript(script, null)
    }

    private fun executeJavaScript(code: String) {
        runOnUiThread {
            webView.evaluateJavascript(code, null)
        }
    }

    private fun manageCacheQuota(directory: File, maxSizeBytes: Long) {
        Thread {
            try {
                var totalSize = getDirSize(directory)
                if (totalSize > maxSizeBytes) {
                    val files = directory.listFiles()?.sortedBy { it.lastModified() } ?: return@Thread
                    for (file in files) {
                        val size = file.length()
                        if (file.delete()) {
                            totalSize -= size
                        }
                        if (totalSize <= maxSizeBytes * 0.85) {
                            break
                        }
                    }
                    Log.i(TAG, "Pruned cache directory to \${totalSize / (1024 * 1024)} MB")
                }
            } catch (e: Exception) {
                Log.e(TAG, "Cache pruning error", e)
            }
        }.start()
    }

    private fun getDirSize(dir: File): Long {
        var size: Long = 0
        val files = dir.listFiles() ?: return 0
        for (f in files) {
            size += if (f.isDirectory) getDirSize(f) else f.length()
        }
        return size
    }

    inner class MusicBridge {
        @JavascriptInterface
        fun onPlaybackStateChanged(isPlaying: Boolean, title: String, artist: String, artworkUrl: String) {
            runOnUiThread {
                this@MainActivity.isPlayingAudio = isPlaying
                val serviceIntent = Intent(this@MainActivity, MediaPlaybackService::class.java).apply {
                    action = if (isPlaying) MediaPlaybackService.ACTION_START_PLAYBACK else MediaPlaybackService.ACTION_PAUSE_PLAYBACK
                    putExtra(MediaPlaybackService.EXTRA_TITLE, title)
                    putExtra(MediaPlaybackService.EXTRA_ARTIST, artist)
                    putExtra(MediaPlaybackService.EXTRA_ARTWORK_URL, artworkUrl)
                }
                ContextCompat.startForegroundService(this@MainActivity, serviceIntent)
            }
        }

        @JavascriptInterface
        fun onMetadataUpdated(title: String, artist: String, artworkUrl: String, isPlaying: Boolean) {
            runOnUiThread {
                if (isPlaying || this@MainActivity.isPlayingAudio) {
                    val serviceIntent = Intent(this@MainActivity, MediaPlaybackService::class.java).apply {
                        action = MediaPlaybackService.ACTION_UPDATE_METADATA
                        putExtra(MediaPlaybackService.EXTRA_TITLE, title)
                        putExtra(MediaPlaybackService.EXTRA_ARTIST, artist)
                        putExtra(MediaPlaybackService.EXTRA_ARTWORK_URL, artworkUrl)
                    }
                    ContextCompat.startForegroundService(this@MainActivity, serviceIntent)
                }
            }
        }
    }

    override fun onConfigurationChanged(newConfig: Configuration) {
        super.onConfigurationChanged(newConfig)
        enforceMaxDisplayRefreshRate()
        updateSystemBarsForCurrentTheme()
        applyWebViewTheme(currentThemeMode)
        injectSafeAreaInsetsScript()
    }

    override fun onPause() {
        super.onPause()
        Log.d(TAG, "onPause called: Keeping audio pipeline alive for background playback")
    }

    override fun onStop() {
        super.onStop()
        Log.d(TAG, "onStop called: WebView audio preserved for screen-off playback")
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        webView.saveState(outState)
        Log.d(TAG, "WebView navigation history & state saved to Bundle for seamless back/forward restoration")
    }

    override fun onDestroy() {
        super.onDestroy()
        try {
            unregisterReceiver(mediaCommandReceiver)
        } catch (_: Exception) {}
        webView.destroy()
    }

    private fun setupBackNavigation() {
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                webView.evaluateJavascript(
                    """
                    (function() {
                        if (window.history && window.history.length > 1) {
                            window.history.back();
                            return 'SPA_BACK_HANDLED';
                        }
                        return 'AT_ROOT';
                    })();
                    """.trimIndent()
                ) { result ->
                    if (result?.contains("SPA_BACK_HANDLED") != true) {
                        if (webView.canGoBack()) {
                            webView.goBack()
                        } else {
                            moveTaskToBack(true)
                        }
                    }
                }
            }
        })
    }

    private fun checkNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
                != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(
                    this,
                    arrayOf(Manifest.permission.POST_NOTIFICATIONS),
                    NOTIFICATION_PERMISSION_CODE
                )
            }
        }
    }

    fun onRetryClicked(view: View) {
        errorLayout.visibility = View.GONE
        progressBar.visibility = View.VISIBLE
        webView.reload()
    }
}`
  },
  {
    id: 'media-playback-service',
    name: 'MediaPlaybackService.kt',
    path: 'app/src/main/java/com/musicbeta/wrapper/MediaPlaybackService.kt',
    category: 'kotlin',
    language: 'kotlin',
    description: 'Ongoing ForegroundService with MediaSessionCompat notification, PowerManager partial wake lock, and WiFi high-perf lock.',
    requirementTags: ['Core Requirement #2', 'MediaSessionCompat', 'WakeLock & WiFiLock', 'Android 14 MediaPlayback'],
    content: `package com.musicbeta.wrapper

import android.annotation.SuppressLint
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.wifi.WifiManager
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import android.support.v4.media.MediaMetadataCompat
import android.support.v4.media.session.MediaSessionCompat
import android.support.v4.media.session.PlaybackStateCompat
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.app.ServiceCompat
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.net.URL

/**
 * Ongoing Foreground Service for MusicBetaWrapper.
 *
 * Fulfills:
 * - Ongoing ForegroundService with MediaSessionCompat media notification
 * - PowerManager.PARTIAL_WAKE_LOCK & WifiManager Wi-Fi Lock during playback
 * - Handles Media Key events (Play, Pause, Next, Prev) via MediaSession callbacks
 * - Android 14+ (API 34) Foreground Service Type: mediaPlayback
 */
class MediaPlaybackService : Service() {

    companion object {
        private const val TAG = "MediaPlaybackService"
        private const val CHANNEL_ID = "music_playback_channel"
        private const val NOTIFICATION_ID = 2001
        private const val MEDIA_SESSION_TAG = "MusicBetaMediaSession"

        const val ACTION_START_PLAYBACK = "com.musicbeta.wrapper.ACTION_START_PLAYBACK"
        const val ACTION_PAUSE_PLAYBACK = "com.musicbeta.wrapper.ACTION_PAUSE_PLAYBACK"
        const val ACTION_STOP_PLAYBACK = "com.musicbeta.wrapper.ACTION_STOP_PLAYBACK"
        const val ACTION_UPDATE_METADATA = "com.musicbeta.wrapper.ACTION_UPDATE_METADATA"

        const val EXTRA_TITLE = "extra_title"
        const val EXTRA_ARTIST = "extra_artist"
        const val EXTRA_ARTWORK_URL = "extra_artwork_url"

        // Notification Action Intents
        const val ACTION_NOTIFICATION_PLAY = "com.musicbeta.wrapper.NOTIFICATION_PLAY"
        const val ACTION_NOTIFICATION_PAUSE = "com.musicbeta.wrapper.NOTIFICATION_PAUSE"
        const val ACTION_NOTIFICATION_NEXT = "com.musicbeta.wrapper.NOTIFICATION_NEXT"
        const val ACTION_NOTIFICATION_PREV = "com.musicbeta.wrapper.NOTIFICATION_PREV"
    }

    private lateinit var mediaSession: MediaSessionCompat
    private lateinit var notificationManager: NotificationManager

    // Power & Wi-Fi Locks for uninterrupted screen-off audio streaming
    private var wakeLock: PowerManager.WakeLock? = null
    private var wifiLock: WifiManager.WifiLock? = null

    private val serviceJob = Job()
    private val serviceScope = CoroutineScope(Dispatchers.Main + serviceJob)

    private var currentTitle: String = "Apple Music"
    private var currentArtist: String = "Playing in Background"
    private var currentArtworkUrl: String = ""
    private var currentArtworkBitmap: Bitmap? = null
    private var isPlaying: Boolean = false

    override fun onCreate() {
        super.onCreate()
        notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        createNotificationChannel()
        initMediaSession()
        initLocks()
        Log.i(TAG, "MediaPlaybackService initialized with MediaSession & Locks")
    }

    /**
     * Requirement 2: Acquire WakeLock & Wi-Fi Lock so audio streams uninterrupted when screen turns off.
     */
    @SuppressLint("WakelockTimeout")
    private fun initLocks() {
        try {
            val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
            wakeLock = powerManager.newWakeLock(
                PowerManager.PARTIAL_WAKE_LOCK,
                "MusicBetaWrapper:PlaybackWakeLock"
            ).apply {
                setReferenceCounted(false)
            }

            val wifiManager = applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager
            val wifiMode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                WifiManager.WIFI_MODE_FULL_LOW_LATENCY
            } else {
                @Suppress("DEPRECATION")
                WifiManager.WIFI_MODE_FULL_HIGH_PERF
            }
            wifiLock = wifiManager.createWifiLock(wifiMode, "MusicBetaWrapper:PlaybackWifiLock").apply {
                setReferenceCounted(false)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error initializing Power/Wi-Fi locks", e)
        }
    }

    private fun acquireLocks() {
        try {
            wakeLock?.let {
                if (!it.isHeld) {
                    it.acquire()
                    Log.d(TAG, "PARTIAL_WAKE_LOCK acquired")
                }
            }
            wifiLock?.let {
                if (!it.isHeld) {
                    it.acquire()
                    Log.d(TAG, "WIFI_LOCK acquired")
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error acquiring locks", e)
        }
    }

    private fun releaseLocks() {
        try {
            wakeLock?.let {
                if (it.isHeld) {
                    it.release()
                    Log.d(TAG, "PARTIAL_WAKE_LOCK released")
                }
            }
            wifiLock?.let {
                if (it.isHeld) {
                    it.release()
                    Log.d(TAG, "WIFI_LOCK released")
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error releasing locks", e)
        }
    }

    private fun initMediaSession() {
        mediaSession = MediaSessionCompat(this, MEDIA_SESSION_TAG).apply {
            setFlags(
                MediaSessionCompat.FLAG_HANDLES_MEDIA_BUTTONS or
                MediaSessionCompat.FLAG_HANDLES_TRANSPORT_CONTROLS
            )

            setCallback(object : MediaSessionCompat.Callback() {
                override fun onPlay() {
                    handlePlayCommand()
                }

                override fun onPause() {
                    handlePauseCommand()
                }

                override fun onSkipToNext() {
                    handleNextCommand()
                }

                override fun onSkipToPrevious() {
                    handlePreviousCommand()
                }

                override fun onStop() {
                    handleStopCommand()
                }
            })

            isActive = true
        }
    }

    private fun updatePlaybackState(playing: Boolean) {
        val state = if (playing) PlaybackStateCompat.STATE_PLAYING else PlaybackStateCompat.STATE_PAUSED
        val actions = PlaybackStateCompat.ACTION_PLAY or
                PlaybackStateCompat.ACTION_PAUSE or
                PlaybackStateCompat.ACTION_PLAY_PAUSE or
                PlaybackStateCompat.ACTION_SKIP_TO_NEXT or
                PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS or
                PlaybackStateCompat.ACTION_STOP

        mediaSession.setPlaybackState(
            PlaybackStateCompat.Builder()
                .setActions(actions)
                .setState(state, PlaybackStateCompat.PLAYBACK_POSITION_UNKNOWN, 1.0f)
                .build()
        )
    }

    private fun updateMediaMetadata() {
        val builder = MediaMetadataCompat.Builder()
            .putString(MediaMetadataCompat.METADATA_KEY_TITLE, currentTitle)
            .putString(MediaMetadataCompat.METADATA_KEY_ARTIST, currentArtist)
            .putString(MediaMetadataCompat.METADATA_KEY_ALBUM, "Apple Music")

        currentArtworkBitmap?.let {
            builder.putBitmap(MediaMetadataCompat.METADATA_KEY_ALBUM_ART, it)
            builder.putBitmap(MediaMetadataCompat.METADATA_KEY_DISPLAY_ICON, it)
        }

        mediaSession.setMetadata(builder.build())
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val action = intent?.action ?: return START_STICKY

        val title = intent.getStringExtra(EXTRA_TITLE) ?: currentTitle
        val artist = intent.getStringExtra(EXTRA_ARTIST) ?: currentArtist
        val artworkUrl = intent.getStringExtra(EXTRA_ARTWORK_URL) ?: currentArtworkUrl

        if (title.isNotEmpty()) currentTitle = title
        if (artist.isNotEmpty()) currentArtist = artist

        when (action) {
            ACTION_START_PLAYBACK, ACTION_NOTIFICATION_PLAY -> {
                isPlaying = true
                acquireLocks()
                updatePlaybackState(true)
                loadArtworkAndRefresh(artworkUrl)
                startForegroundWithNotification()
                if (action == ACTION_NOTIFICATION_PLAY) {
                    dispatchToActivity(MainActivity.COMMAND_PLAY)
                }
            }

            ACTION_PAUSE_PLAYBACK, ACTION_NOTIFICATION_PAUSE -> {
                isPlaying = false
                releaseLocks()
                updatePlaybackState(false)
                refreshNotification()
                if (action == ACTION_NOTIFICATION_PAUSE) {
                    dispatchToActivity(MainActivity.COMMAND_PAUSE)
                }
            }

            ACTION_STOP_PLAYBACK -> {
                isPlaying = false
                releaseLocks()
                updatePlaybackState(false)
                stopForeground(STOP_FOREGROUND_REMOVE)
                stopSelf()
            }

            ACTION_UPDATE_METADATA -> {
                loadArtworkAndRefresh(artworkUrl)
            }

            ACTION_NOTIFICATION_NEXT -> {
                handleNextCommand()
            }

            ACTION_NOTIFICATION_PREV -> {
                handlePreviousCommand()
            }
        }

        return START_STICKY
    }

    private fun handlePlayCommand() {
        isPlaying = true
        acquireLocks()
        updatePlaybackState(true)
        refreshNotification()
        dispatchToActivity(MainActivity.COMMAND_PLAY)
    }

    private fun handlePauseCommand() {
        isPlaying = false
        releaseLocks()
        updatePlaybackState(false)
        refreshNotification()
        dispatchToActivity(MainActivity.COMMAND_PAUSE)
    }

    private fun handleNextCommand() {
        dispatchToActivity(MainActivity.COMMAND_NEXT)
    }

    private fun handlePreviousCommand() {
        dispatchToActivity(MainActivity.COMMAND_PREV)
    }

    private fun handleStopCommand() {
        isPlaying = false
        releaseLocks()
        updatePlaybackState(false)
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    private fun dispatchToActivity(command: String) {
        val intent = Intent(MainActivity.ACTION_MEDIA_COMMAND).apply {
            putExtra(MainActivity.EXTRA_COMMAND, command)
            setPackage(packageName)
        }
        sendBroadcast(intent)
    }

    private fun loadArtworkAndRefresh(url: String) {
        if (url.isNotEmpty() && url != currentArtworkUrl) {
            currentArtworkUrl = url
            serviceScope.launch {
                val bitmap = downloadBitmap(url)
                currentArtworkBitmap = bitmap
                updateMediaMetadata()
                refreshNotification()
            }
        } else {
            updateMediaMetadata()
            refreshNotification()
        }
    }

    private suspend fun downloadBitmap(urlString: String): Bitmap? = withContext(Dispatchers.IO) {
        try {
            val stream = URL(urlString).openStream()
            BitmapFactory.decodeStream(stream)
        } catch (_: Exception) {
            null
        }
    }

    private fun startForegroundWithNotification() {
        val notification = buildMediaNotification()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            ServiceCompat.startForeground(
                this,
                NOTIFICATION_ID,
                notification,
                ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK
            )
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }
    }

    private fun refreshNotification() {
        val notification = buildMediaNotification()
        notificationManager.notify(NOTIFICATION_ID, notification)
    }

    private fun buildMediaNotification(): Notification {
        val openAppIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val contentPendingIntent = PendingIntent.getActivity(
            this,
            0,
            openAppIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val prevIntent = Intent(this, MediaPlaybackService::class.java).apply {
            action = ACTION_NOTIFICATION_PREV
        }
        val prevPendingIntent = PendingIntent.getService(
            this,
            1,
            prevIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val playPauseIntent = Intent(this, MediaPlaybackService::class.java).apply {
            action = if (isPlaying) ACTION_NOTIFICATION_PAUSE else ACTION_NOTIFICATION_PLAY
        }
        val playPausePendingIntent = PendingIntent.getService(
            this,
            2,
            playPauseIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val nextIntent = Intent(this, MediaPlaybackService::class.java).apply {
            action = ACTION_NOTIFICATION_NEXT
        }
        val nextPendingIntent = PendingIntent.getService(
            this,
            3,
            nextIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val playPauseIcon = if (isPlaying) android.R.drawable.ic_media_pause else android.R.drawable.ic_media_play
        val playPauseText = if (isPlaying) "Pause" else "Play"

        val mediaStyle = androidx.media.app.NotificationCompat.MediaStyle()
            .setMediaSession(mediaSession.sessionToken)
            .setShowActionsInCompactView(0, 1, 2)

        val builder = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_media_play)
            .setContentTitle(currentTitle)
            .setContentText(currentArtist)
            .setSubText("Apple Music Beta")
            .setContentIntent(contentPendingIntent)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setOngoing(isPlaying)
            .setAutoCancel(false)
            .setStyle(mediaStyle)
            .addAction(android.R.drawable.ic_media_previous, "Previous", prevPendingIntent)
            .addAction(playPauseIcon, playPauseText, playPausePendingIntent)
            .addAction(android.R.drawable.ic_media_next, "Next", nextPendingIntent)

        currentArtworkBitmap?.let {
            builder.setLargeIcon(it)
        }

        return builder.build()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Music Playback Service",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Ongoing media playback and audio controls for MusicBetaWrapper"
                setShowBadge(false)
                lockscreenVisibility = Notification.VISIBILITY_PUBLIC
            }
            notificationManager.createNotificationChannel(channel)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        serviceJob.cancel()
        releaseLocks()
        mediaSession.isActive = false
        mediaSession.release()
        Log.i(TAG, "MediaPlaybackService destroyed, locks released")
    }

    override fun onBind(intent: Intent?): IBinder? = null
}`
  },
  {
    id: 'activity-main-layout',
    name: 'activity_main.xml',
    path: 'app/src/main/res/layout/activity_main.xml',
    category: 'layout',
    language: 'xml',
    description: 'Edge-to-edge root layout with hardware-accelerated WebView, indeterminate progress bar, and retry view.',
    requirementTags: ['Core Requirement #1 & #4', 'fitsSystemWindows="false"', 'layerType="hardware"'],
    content: `<?xml version="1.0" encoding="utf-8"?>
<androidx.coordinatorlayout.widget.CoordinatorLayout xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    xmlns:tools="http://schemas.android.com/tools"
    android:id="@+id/rootContainer"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="#000000"
    android:fitsSystemWindows="false"
    tools:context=".MainActivity">

    <!-- High Performance Hardware-Accelerated Edge-to-Edge WebView -->
    <WebView
        android:id="@+id/webView"
        android:layout_width="match_parent"
        android:layout_height="match_parent"
        android:background="#000000"
        android:fitsSystemWindows="false"
        android:layerType="hardware"
        android:overScrollMode="never"
        android:scrollbars="none" />

    <!-- Thin Top Progress Bar for Page Loads -->
    <ProgressBar
        android:id="@+id/progressBar"
        style="?android:attr/progressBarStyleHorizontal"
        android:layout_width="match_parent"
        android:layout_height="3dp"
        android:layout_gravity="top"
        android:indeterminate="false"
        android:max="100"
        android:progressBackgroundTint="#33FFFFFF"
        android:progressTint="#FA2D48"
        android:visibility="gone"
        tools:progress="65"
        tools:visibility="visible" />

    <!-- Offline / Network Error Fallback View -->
    <FrameLayout
        android:id="@+id/errorLayout"
        android:layout_width="match_parent"
        android:layout_height="match_parent"
        android:background="#000000"
        android:clickable="true"
        android:focusable="true"
        android:visibility="gone"
        tools:visibility="gone">

        <LinearLayout
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:layout_gravity="center"
            android:gravity="center"
            android:orientation="vertical"
            android:padding="24dp">

            <ImageView
                android:layout_width="72dp"
                android:layout_height="72dp"
                android:layout_marginBottom="16dp"
                android:contentDescription="@string/network_error_title"
                android:src="@android:drawable/ic_dialog_alert"
                app:tint="#FA2D48" />

            <TextView
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:layout_marginBottom="8dp"
                android:text="@string/network_error_title"
                android:textColor="#FFFFFF"
                android:textSize="20sp"
                android:textStyle="bold" />

            <TextView
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:layout_marginBottom="24dp"
                android:gravity="center"
                android:text="@string/network_error_subtitle"
                android:textColor="#9E9E9E"
                android:textSize="14sp" />

            <Button
                android:id="@+id/btnRetry"
                android:layout_width="wrap_content"
                android:layout_height="48dp"
                android:backgroundTint="#FA2D48"
                android:onClick="onRetryClicked"
                android:paddingStart="28dp"
                android:paddingEnd="28dp"
                android:text="@string/action_retry"
                android:textColor="#FFFFFF"
                android:textStyle="bold" />

        </LinearLayout>
    </FrameLayout>

</androidx.coordinatorlayout.widget.CoordinatorLayout>`
  },
  {
    id: 'github-workflow-release',
    name: '.github/workflows/release.yml',
    path: '.github/workflows/release.yml',
    category: 'workflow',
    language: 'yaml',
    description: 'Automated CI/CD workflow: runs on push to main, v* tags, or manual click; sets up JDK 17 + Gradle 8.5, builds & signs the release APK, uploads artifact & publishes GitHub Release.',
    requirementTags: ['Core Requirement #5', 'GitHub Releases CI/CD', 'Auto-Signed APK', 'Gradle 8.5'],
    content: `name: Build & Release MusicBetaWrapper APK

on:
  push:
    branches:
      - main
      - master
    tags:
      - 'v*'
  workflow_dispatch:

permissions:
  contents: write
  actions: read

jobs:
  build-and-release:
    name: Build & Sign Android APK
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'

      - name: Setup Gradle 8.5
        uses: gradle/actions/setup-gradle@v3
        with:
          gradle-version: '8.5'

      - name: Accept Android SDK Licenses
        run: |
          yes | $ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager --licenses 2>/dev/null || true

      - name: Build Release & Debug APKs with Gradle
        run: |
          gradle assembleRelease assembleDebug --stacktrace --no-daemon

      - name: Align & Sign Release APK (Secrets or Auto-Generated Keystore)
        id: sign_apk
        env:
          KEYSTORE_BASE64: \${{ secrets.KEYSTORE_BASE64 }}
          KEYSTORE_PASSWORD: \${{ secrets.KEYSTORE_PASSWORD }}
          KEY_ALIAS: \${{ secrets.KEY_ALIAS }}
          KEY_PASSWORD: \${{ secrets.KEY_PASSWORD }}
        run: |
          mkdir -p release-artifacts

          BUILT_APK=$(find app/build/outputs/apk/release -name "*.apk" | head -n 1)
          if [ -z "$BUILT_APK" ]; then
            echo "Error: No APK found in app/build/outputs/apk/release"
            exit 1
          fi
          echo "Found built APK: $BUILT_APK"

          VERSION_LABEL="\${GITHUB_REF_NAME:-v1.0.0}"
          ALIGNED_APK="release-artifacts/aligned.apk"
          DEST_APK="release-artifacts/MusicBetaWrapper-\${VERSION_LABEL}-signed.apk"

          BUILD_TOOLS_DIR=$(ls -d $ANDROID_HOME/build-tools/* | sort -V | tail -n 1)

          if [ -n "$KEYSTORE_BASE64" ] && [ -n "$KEYSTORE_PASSWORD" ] && [ -n "$KEY_ALIAS" ]; then
            echo "Signing APK with provided repository secrets..."
            echo "$KEYSTORE_BASE64" | base64 --decode > release.keystore
            KS_PASS="$KEYSTORE_PASSWORD"
            K_ALIAS="$KEY_ALIAS"
            K_PASS="\${KEY_PASSWORD:-$KEYSTORE_PASSWORD}"
          else
            echo "No signing secrets configured; generating self-contained release keystore so APK installs cleanly on Android..."
            KS_PASS="musicbeta123"
            K_ALIAS="musicbeta"
            K_PASS="musicbeta123"
            keytool -genkeypair -v \\
              -keystore release.keystore \\
              -alias "$K_ALIAS" \\
              -keyalg RSA \\
              -keysize 2048 \\
              -validity 10000 \\
              -storepass "$KS_PASS" \\
              -keypass "$K_PASS" \\
              -dname "CN=MusicBetaWrapper, OU=Mobile, O=MusicBeta, L=Cupertino, ST=CA, C=US"
          fi

          "$BUILD_TOOLS_DIR/zipalign" -v -p 4 "$BUILT_APK" "$ALIGNED_APK"
          "$BUILD_TOOLS_DIR/apksigner" sign \\
            --ks release.keystore \\
            --ks-key-alias "$K_ALIAS" \\
            --ks-pass pass:"$KS_PASS" \\
            --key-pass pass:"$K_PASS" \\
            --v1-signing-enabled true \\
            --v2-signing-enabled true \\
            --v3-signing-enabled true \\
            --out "$DEST_APK" \\
            "$ALIGNED_APK"

          rm -f release.keystore "$ALIGNED_APK"
          echo "apk_path=$DEST_APK" >> $GITHUB_OUTPUT

      - name: Upload Signed APK as Workflow Artifact
        uses: actions/upload-artifact@v4
        with:
          name: MusicBetaWrapper-Signed-APK
          path: \${{ steps.sign_apk.outputs.apk_path }}
          if-no-files-found: error

      - name: Publish GitHub Release (on Tag or Main Push)
        uses: softprops/action-gh-release@v2
        with:
          name: MusicBetaWrapper \${{ github.ref_name }}
          tag_name: \${{ startsWith(github.ref, 'refs/tags/') && github.ref_name || format('v1.0.{0}', github.run_number) }}
          files: \${{ steps.sign_apk.outputs.apk_path }}
          draft: false
          prerelease: false
          generate_release_notes: true
          body: |
            ### 🎵 MusicBetaWrapper Signed Android APK (\${{ github.ref_name }})

            Ready-to-install signed Android 14+ (API 34) APK wrapping \`https://beta.music.apple.com\`.

            #### Included Optimizations:
            - **5 WebView Anti-Lag Optimizations**: 500MB OkHttp disk cache (\`shouldInterceptRequest\`), \`mzstatic.com\` \`300x300bb.webp\` artwork downscaler, telemetry/Sentry blocker, GPU CSS \`backdrop-filter\` stripper, and zero-reload SPA \`window.history.back()\`.
            - **Camera Notch & Status Bar Safe-Area Protection**: Physical \`WindowInsetsCompat\` (\`systemBars() | displayCutout()\`) padding + runtime CSS safe-area variables.
            - **120 Hz+ Display Refresh Rate**: Forced peak hardware display mode.
            - **Screen-Off & Background Audio**: Foreground \`MediaPlaybackService\` with \`MediaSessionCompat\`, \`PARTIAL_WAKE_LOCK\`, and high-perf Wi-Fi lock.`
  },
  {
    id: 'root-build-gradle',
    name: 'build.gradle.kts (Root)',
    path: 'build.gradle.kts',
    category: 'config',
    language: 'kotlin',
    description: 'Root Gradle configuration defining Android and Kotlin Gradle plugins.',
    requirementTags: ['Project Config'],
    content: `plugins {
    id("com.android.application") version "8.3.2" apply false
    id("org.jetbrains.kotlin.android") version "1.9.23" apply false
}`
  },
  {
    id: 'settings-gradle',
    name: 'settings.gradle.kts',
    path: 'settings.gradle.kts',
    category: 'config',
    language: 'kotlin',
    description: 'Repository management with Google and MavenCentral, project name "MusicBetaWrapper".',
    requirementTags: ['Project Config'],
    content: `pluginManagement {
    repositories {
        google {
            content {
                includeGroupByRegex("com\\\\.android.*")
                includeGroupByRegex("com\\\\.google.*")
                includeGroupByRegex("androidx.*")
            }
        }
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "MusicBetaWrapper"
include(":app")`
  },
  {
    id: 'gradle-properties',
    name: 'gradle.properties',
    path: 'gradle.properties',
    category: 'config',
    language: 'properties',
    description: 'AndroidX and JVM heap settings required by Android Gradle Plugin 8+.',
    requirementTags: ['Project Config', 'AndroidX'],
    content: `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.enableJetifier=false
kotlin.code.style=official
android.nonTransitiveRClass=true`
  },
  {
    id: 'strings-xml',
    name: 'values/strings.xml',
    path: 'app/src/main/res/values/strings.xml',
    category: 'layout',
    language: 'xml',
    description: 'String resources for app name and offline fallback UI.',
    requirementTags: ['App Resources'],
    content: `<resources>
    <string name="app_name">MusicBetaWrapper</string>
    <string name="network_error_title">Connection Lost</string>
    <string name="network_error_subtitle">Unable to load Apple Music Beta. Check your internet connection and try again.</string>
    <string name="action_retry">Retry</string>
</resources>`
  },
  {
    id: 'themes-xml',
    name: 'themes.xml',
    path: 'app/src/main/res/values/themes.xml',
    category: 'layout',
    language: 'xml',
    description: 'Material theme with transparent system status and navigation bars for Light mode.',
    requirementTags: ['Core Requirement #4', 'Light Mode', 'Edge-to-Edge Theme'],
    content: `<resources xmlns:tools="http://schemas.android.com/tools">
    <style name="Theme.MusicBetaWrapper" parent="Theme.MaterialComponents.DayNight.NoActionBar">
        <!-- Edge-to-Edge System Bars (Light Theme Default) -->
        <item name="android:statusBarColor">@android:color/transparent</item>
        <item name="android:navigationBarColor">@android:color/transparent</item>
        <item name="android:windowDrawsSystemBarBackgrounds">true</item>
        <item name="android:windowBackground">@color/window_background_light</item>
        <item name="android:windowLightStatusBar" tools:targetApi="m">true</item>
        <item name="android:windowLightNavigationBar" tools:targetApi="o_mr1">true</item>
        
        <!-- Primary Brand Colors -->
        <item name="colorPrimary">@color/apple_red</item>
        <item name="colorPrimaryVariant">#D32F2F</item>
        <item name="colorOnPrimary">@color/apple_text_light</item>
        <item name="colorSurface">@color/surface_light</item>
        <item name="colorOnSurface">@color/apple_text_light</item>
    </style>
</resources>`
  },
  {
    id: 'themes-night-xml',
    name: 'values-night/themes.xml',
    path: 'app/src/main/res/values-night/themes.xml',
    category: 'layout',
    language: 'xml',
    description: 'Dark Mode theme configuration with OLED dark background and light system icon tinting.',
    requirementTags: ['Dark Mode', 'Edge-to-Edge Theme', 'Theme.MusicBetaWrapper'],
    content: `<resources xmlns:tools="http://schemas.android.com/tools">
    <style name="Theme.MusicBetaWrapper" parent="Theme.MaterialComponents.DayNight.NoActionBar">
        <!-- Edge-to-Edge System Bars (Dark Mode) -->
        <item name="android:statusBarColor">@android:color/transparent</item>
        <item name="android:navigationBarColor">@android:color/transparent</item>
        <item name="android:windowDrawsSystemBarBackgrounds">true</item>
        <item name="android:windowBackground">@color/window_background_dark</item>
        <item name="android:windowLightStatusBar" tools:targetApi="m">false</item>
        <item name="android:windowLightNavigationBar" tools:targetApi="o_mr1">false</item>
        
        <!-- Primary Brand Colors -->
        <item name="colorPrimary">@color/apple_red</item>
        <item name="colorPrimaryVariant">#D32F2F</item>
        <item name="colorOnPrimary">@color/apple_text_dark</item>
        <item name="colorSurface">@color/surface_dark</item>
        <item name="colorOnSurface">@color/apple_text_dark</item>
    </style>
</resources>`
  },
  {
    id: 'colors-xml',
    name: 'values/colors.xml',
    path: 'app/src/main/res/values/colors.xml',
    category: 'layout',
    language: 'xml',
    description: 'Color resource definitions for Light and Dark modes with Apple Music brand red accent.',
    requirementTags: ['Theme Colors', 'Light & Dark Palette'],
    content: `<resources>
    <!-- Brand Accent -->
    <color name="apple_red">#FA2D48</color>
    <color name="apple_red_dark">#D32F2F</color>

    <!-- Light Theme Palette -->
    <color name="window_background_light">#FFFFFF</color>
    <color name="surface_light">#F2F2F7</color>
    <color name="apple_text_light">#000000</color>
    <color name="apple_text_secondary_light">#6E6E73</color>

    <!-- Dark Theme Palette -->
    <color name="window_background_dark">#000000</color>
    <color name="surface_dark">#1C1C1E</color>
    <color name="apple_text_dark">#FFFFFF</color>
    <color name="apple_text_secondary_dark">#8E8E93</color>
</resources>`
  },
  {
    id: 'ic-launcher-bg',
    name: 'drawable/ic_launcher_background.xml',
    path: 'app/src/main/res/drawable/ic_launcher_background.xml',
    category: 'layout',
    language: 'xml',
    description: 'Adaptive icon OLED black vector background.',
    requirementTags: ['Adaptive Icon'],
    content: `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path
        android:fillColor="#000000"
        android:pathData="M0,0h108v108h-108z" />
</vector>`
  },
  {
    id: 'ic-launcher-fg',
    name: 'drawable/ic_launcher_foreground.xml',
    path: 'app/src/main/res/drawable/ic_launcher_foreground.xml',
    category: 'layout',
    language: 'xml',
    description: 'Adaptive icon Apple Music crimson note vector foreground.',
    requirementTags: ['Adaptive Icon'],
    content: `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <group
        android:scaleX="1.8"
        android:scaleY="1.8"
        android:translateX="32.4"
        android:translateY="32.4">
        <path
            android:fillColor="#FA2D48"
            android:pathData="M12,3v10.55c-0.59,-0.34 -1.27,-0.55 -2,-0.55 -2.21,0 -4,1.79 -4,4s1.79,4 4,4 4,-1.79 4,-4V7h4V3h-6z" />
    </group>
</vector>`
  },
  {
    id: 'mipmap-ic-launcher',
    name: 'mipmap-anydpi-v26/ic_launcher.xml',
    path: 'app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml',
    category: 'layout',
    language: 'xml',
    description: 'Adaptive launcher icon definition.',
    requirementTags: ['Adaptive Icon'],
    content: `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background" />
    <foreground android:drawable="@drawable/ic_launcher_foreground" />
</adaptive-icon>`
  },
  {
    id: 'mipmap-ic-launcher-round',
    name: 'mipmap-anydpi-v26/ic_launcher_round.xml',
    path: 'app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml',
    category: 'layout',
    language: 'xml',
    description: 'Adaptive round launcher icon definition.',
    requirementTags: ['Adaptive Icon'],
    content: `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background" />
    <foreground android:drawable="@drawable/ic_launcher_foreground" />
</adaptive-icon>`
  },
  {
    id: 'proguard-rules',
    name: 'proguard-rules.pro',
    path: 'app/proguard-rules.pro',
    category: 'config',
    language: 'properties',
    description: 'Keeps JavascriptInterface, MediaSession, and MediaPlaybackService from R8/ProGuard obfuscation.',
    requirementTags: ['Release Optimization', 'ProGuard / R8'],
    content: `# Keep WebView JavaScript interfaces
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep MediaSession and NotificationCompat components
-keep class androidx.media.** { *; }
-keep class android.support.v4.media.** { *; }
-keep class com.musicbeta.wrapper.MediaPlaybackService { *; }
-keep class com.musicbeta.wrapper.MainActivity { *; }
-keepclassmembers class com.musicbeta.wrapper.MainActivity$MusicBridge {
    public *;
}`
  }
];
