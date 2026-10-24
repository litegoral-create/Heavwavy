package com.musicbeta.wrapper

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
            """/(\d{3,4})x(\d{3,4})([a-z]{0,4})\.(jpg|jpeg|png|webp)(\?.*)?$""",
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

    /**
     * Requirement 1: Performance & 120 Hz.
     */
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
                    Log.i(TAG, "Forced display refresh rate to: ${bestMode.refreshRate} Hz (Mode ID: ${bestMode.modeId})")
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error configuring 120Hz display refresh mode", e)
        }
    }

    /**
     * Edge-to-Edge display and Dynamic Status/Navigation Bar Styling for Light and Dark modes.
     */
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

    /**
     * Requirement: Mobile Status Bar & Camera Cutout Safe Area Handling.
     * Prevents top headers and navigation elements from rendering under the physical clock,
     * battery percentage, and camera punch-hole notch.
     *
     * 1. Applies physical padding (insets.left, insets.top, insets.right, insets.bottom)
     *    directly to rootContainer so the WebView viewport starts strictly below the camera notch
     *    and above the gesture pill, while rootContainer's background fills the status bar smoothly.
     * 2. Injects CSS custom properties (--safe-area-top, etc.) into the WebView DOM.
     */
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

            // Keep progress bar flush at the top of the safe WebView area
            val progressParams = progressBar.layoutParams as? FrameLayout.LayoutParams
                ?: (progressBar.layoutParams as? androidx.coordinatorlayout.widget.CoordinatorLayout.LayoutParams)
            progressParams?.topMargin = 0
            progressBar.layoutParams = progressParams

            // Inject CSS Safe Area variables into current page
            injectSafeAreaInsetsScript()

            WindowInsetsCompat.CONSUMED
        }
    }

    /**
     * Injects CSS variables onto document.documentElement so mobile web headers
     * respect safe area boundaries without being drawn behind status bar or notch.
     */
    private fun injectSafeAreaInsetsScript() {
        val cssScript = """
            (function() {
                var root = document.documentElement;
                root.style.setProperty('--safe-area-top', '${lastTopInsetDp}px');
                root.style.setProperty('--safe-area-bottom', '${lastBottomInsetDp}px');
                root.style.setProperty('--safe-area-left', '${lastLeftInsetDp}px');
                root.style.setProperty('--safe-area-right', '${lastRightInsetDp}px');
            })();
        """.trimIndent()
        executeJavaScript(cssScript)
    }

    /**
     * Sets status bar and navigation bar icon colors (light vs dark) based on the active theme.
     */
    private fun updateSystemBarsForCurrentTheme() {
        val isDarkMode = isEffectiveDarkMode()
        // In Light Mode, icons must be dark (isAppearanceLight = true).
        // In Dark Mode, icons must be light (isAppearanceLight = false).
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

    /**
     * Public theme switcher function for setting Light, Dark, or System mode.
     */
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

    /**
     * Requirement 1, 3, 4 & 5:
     * - Configure WebView for max speed: RenderPriority.HIGH, JS, DOM storage, database caching, offscreenPreRaster.
     * - Hardware layer acceleration.
     * - Dedicated 500 MB OkHttpClient Disk Cache for shouldInterceptRequest static asset caching.
     * - Dynamic LOAD_DEFAULT / LOAD_CACHE_ELSE_NETWORK offline fallback.
     * - iOS Safari User-Agent override & Light/Dark mode synchronization.
     */
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
                // Enforce 7-day immutable disk caching on static assets & album artwork
                response.newBuilder()
                    .removeHeader("Pragma")
                    .removeHeader("Vary")
                    .header("Cache-Control", "public, max-age=604800, immutable")
                    .build()
            }
            .build()

        // Optimization 5:LOAD_DEFAULT with offline fallback to LOAD_CACHE_ELSE_NETWORK
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

        // Use AndroidX WebSettingsCompat if supported on this device
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

        // Also inject color-scheme meta tag into web page DOM
        val themeScript = """
            (function() {
                const scheme = '${if (isDark) "dark" else "light"}';
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

            /**
             * Optimization 4: Early CSS GPU Performance Injection on onPageCommitVisible
             * Eliminates backdrop-filter lag and hides app upsell banners before first scroll.
             */
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

            /**
             * Optimizations 1, 2 & 3:
             * 1. Telemetry & Tracker Blocker (metrics.apple.com, xp.apple.com, sentry)
             * 2. Apple CDN Artwork Optimization (1000x1000bb -> 300x300bb.webp)
             * 3. Aggressive Disk Caching (.js, .css, .woff2, and mzstatic.com artwork) via OkHttpClient
             */
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
                Log.d(TAG, "WebView Console: ${consoleMessage?.message()} (line ${consoleMessage?.lineNumber()})")
                return true
            }
        }
    }

    /**
     * Optimization 3: Returns true if the URL matches known Apple Music telemetry or Sentry crash trackers.
     */
    private fun isTelemetryOrTrackerUrl(url: String): Boolean {
        val lower = url.lowercase()
        return BLOCKED_TELEMETRY_PATTERNS.any { lower.contains(it) }
    }

    /**
     * Optimization 3: Immediately returns an empty 204 WebResourceResponse to short-circuit telemetry calls.
     */
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

    /**
     * Optimization 2: Rewrites oversized mzstatic.com thumbnails (e.g., 1000x1000bb.jpg, 600x600bb.png)
     * down to 300x300bb.webp to eliminate main-thread bitmap decoding stutter and save bandwidth.
     */
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

    /**
     * Optimization 1: Identifies static assets (.js, .css, .woff2, and mzstatic.com artwork) eligible for disk caching.
     */
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

    /**
     * Optimization 1: Executes the request through OkHttpClient backed by context.cacheDir
     * so repeat visits and scrolled album art load instantaneously from disk.
     */
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
            Log.w(TAG, "OkHttp cache miss/fallback for $targetUrl: ${e.message}")
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

    /**
     * Optimization 4: CSS GPU Performance Injection.
     * - Strips heavy real-time backdrop-filter Gaussian blurs that cause scroll stutter.
     * - Hides "Open in Music App" promotional banners and native upsell overlays.
     * - Enables GPU layer compositing (transform: translateZ(0)) and offscreen content-visibility: auto.
     */
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
                ].join('\n');
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
                    Log.i(TAG, "Pruned cache directory to ${totalSize / (1024 * 1024)} MB")
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

    /**
     * Optimization 5: Zero-Reload SPA Lifecycle on Configuration Changes.
     * Prevents Activity recreation when rotating screen, resizing window, or toggling system dark mode.
     */
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

    /**
     * Optimization 5: Zero-Reload SPA Back Navigation.
     * Routes the Android Back button through evaluateJavascript("window.history.back()")
     * so Apple Music's MusicKit JS router transitions views in-memory without a full page reload.
     */
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
}
