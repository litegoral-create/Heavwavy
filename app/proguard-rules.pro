# Keep WebView JavaScript interfaces
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
}
