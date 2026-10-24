package com.musicbeta.wrapper

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
import android.os.Bundle
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.PowerManager
import android.support.v4.media.MediaMetadataCompat
import android.support.v4.media.session.MediaSessionCompat
import android.support.v4.media.session.PlaybackStateCompat
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.app.ServiceCompat
import androidx.media3.common.AudioAttributes
import androidx.media3.common.C
import androidx.media3.common.MediaItem
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.net.URL

class MediaPlaybackService : Service() {

    companion object {
        private const val TAG = "MediaPlaybackService"
        private const val CHANNEL_ID = "music_playback_channel"
        private const val NOTIFICATION_ID = 2001
        private const val MEDIA_SESSION_TAG = "MusicBetaMediaSession"

        const val ACTION_START_PLAYBACK = "com.musicbeta.wrapper.ACTION_START_PLAYBACK"
        const val ACTION_PAUSE_PLAYBACK = "com.musicbeta.wrapper.ACTION_PAUSE_PLAYBACK"
        const val ACTION_RESUME_PLAYBACK = "com.musicbeta.wrapper.ACTION_RESUME_PLAYBACK"
        const val ACTION_STOP_PLAYBACK = "com.musicbeta.wrapper.ACTION_STOP_PLAYBACK"
        const val ACTION_UPDATE_METADATA = "com.musicbeta.wrapper.ACTION_UPDATE_METADATA"
        const val ACTION_PLAY_STREAM = "com.musicbeta.wrapper.ACTION_PLAY_STREAM"

        const val EXTRA_TITLE = "extra_title"
        const val EXTRA_ARTIST = "extra_artist"
        const val EXTRA_ARTWORK_URL = "extra_artwork_url"
        const val EXTRA_STREAM_URL = "extra_stream_url"

        const val ACTION_NOTIFICATION_PLAY = "com.musicbeta.wrapper.NOTIFICATION_PLAY"
        const val ACTION_NOTIFICATION_PAUSE = "com.musicbeta.wrapper.NOTIFICATION_PAUSE"
        const val ACTION_NOTIFICATION_NEXT = "com.musicbeta.wrapper.NOTIFICATION_NEXT"
        const val ACTION_NOTIFICATION_PREV = "com.musicbeta.wrapper.NOTIFICATION_PREV"
    }

    private lateinit var mediaSession: MediaSessionCompat
    private lateinit var notificationManager: NotificationManager

    private var wakeLock: PowerManager.WakeLock? = null
    private var wifiLock: WifiManager.WifiLock? = null
    private var player: ExoPlayer? = null

    private val serviceJob = Job()
    private val serviceScope = CoroutineScope(Dispatchers.Main + serviceJob)
    private val playbackHandler = Handler(Looper.getMainLooper())

    private var currentTitle: String = "Apple Music"
    private var currentArtist: String = "Playing in Background"
    private var currentArtworkUrl: String = ""
    private var currentArtworkBitmap: Bitmap? = null
    private var isPlaying: Boolean = false

    private val playbackTicker = object : Runnable {
        override fun run() {
            if (player != null) {
                val position = player?.currentPosition ?: 0L
                val duration = player?.duration ?: 0L
                if (isPlaying || player?.isPlaying == true) {
                    dispatchPlaybackState(position, duration)
                }
            }
            playbackHandler.postDelayed(this, 1000L)
        }
    }

    override fun onCreate() {
        super.onCreate()
        notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        createNotificationChannel()
        initPlayer()
        initMediaSession()
        initLocks()
        playbackHandler.post(playbackTicker)
        Log.i(TAG, "MediaPlaybackService initialized with native ExoPlayer audio engine")
    }

    private fun initPlayer() {
        val audioAttributes = AudioAttributes.Builder()
            .setContentType(C.AUDIO_CONTENT_TYPE_MUSIC)
            .setUsage(C.USAGE_MEDIA)
            .build()

        player = ExoPlayer.Builder(this).build().apply {
            setAudioAttributes(audioAttributes, true)
            setHandleAudioBecomingNoisy(true)
            addListener(object : Player.Listener {
                override fun onPlaybackStateChanged(playbackState: Int) {
                    when (playbackState) {
                        Player.STATE_READY -> {
                            updatePlaybackState(true)
                            dispatchPlaybackState(currentPosition, duration)
                            updateNotification()
                        }
                        Player.STATE_ENDED -> {
                            isPlaying = false
                            updatePlaybackState(false)
                            dispatchPlaybackState(currentPosition, duration)
                            updateNotification()
                        }
                        Player.STATE_IDLE -> Unit
                        else -> Unit
                    }
                }

                override fun onPlayerError(error: PlaybackException) {
                    Log.e(TAG, "ExoPlayer error", error)
                    isPlaying = false
                    updatePlaybackState(false)
                    dispatchPlaybackState(currentPosition, duration)
                    updateNotification()
                }
            })
        }
    }

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
            wakeLock?.let { if (!it.isHeld) it.acquire() }
            wifiLock?.let { if (!it.isHeld) it.acquire() }
        } catch (e: Exception) {
            Log.e(TAG, "Error acquiring locks", e)
        }
    }

    private fun releaseLocks() {
        try {
            wakeLock?.let { if (it.isHeld) it.release() }
            wifiLock?.let { if (it.isHeld) it.release() }
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
        val streamUrl = intent.getStringExtra(EXTRA_STREAM_URL)

        if (title.isNotEmpty()) currentTitle = title
        if (artist.isNotEmpty()) currentArtist = artist
        if (artworkUrl.isNotEmpty()) currentArtworkUrl = artworkUrl

        when (action) {
            ACTION_PLAY_STREAM -> {
                if (!streamUrl.isNullOrEmpty()) {
                    playNativeStream(streamUrl)
                }
                startForegroundWithNotification()
            }

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
                pausePlayback()
                if (action == ACTION_NOTIFICATION_PAUSE) {
                    dispatchToActivity(MainActivity.COMMAND_PAUSE)
                }
            }

            ACTION_RESUME_PLAYBACK -> {
                resumePlayback()
            }

            ACTION_STOP_PLAYBACK -> {
                stopPlayback()
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

    private fun playNativeStream(streamUrl: String) {
        val uri = streamUrl.trim()
        if (uri.isEmpty()) return

        val mediaItem = MediaItem.fromUri(uri)
        player?.setMediaItem(mediaItem)
        player?.prepare()
        player?.play()

        isPlaying = true
        acquireLocks()
        updatePlaybackState(true)
        loadArtworkAndRefresh(currentArtworkUrl)
        dispatchPlaybackState(player?.currentPosition ?: 0L, player?.duration ?: 0L)
        updateNotification()
        startForegroundWithNotification()
    }

    private fun pausePlayback() {
        isPlaying = false
        player?.pause()
        releaseLocks()
        updatePlaybackState(false)
        dispatchPlaybackState(player?.currentPosition ?: 0L, player?.duration ?: 0L)
        refreshNotification()
    }

    private fun resumePlayback() {
        isPlaying = true
        player?.play()
        acquireLocks()
        updatePlaybackState(true)
        dispatchPlaybackState(player?.currentPosition ?: 0L, player?.duration ?: 0L)
        refreshNotification()
    }

    private fun stopPlayback() {
        isPlaying = false
        player?.stop()
        player?.clearMediaItems()
        releaseLocks()
        updatePlaybackState(false)
        dispatchPlaybackState(0L, 0L)
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    private fun handlePlayCommand() {
        isPlaying = true
        player?.play()
        acquireLocks()
        updatePlaybackState(true)
        dispatchPlaybackState(player?.currentPosition ?: 0L, player?.duration ?: 0L)
        refreshNotification()
        dispatchToActivity(MainActivity.COMMAND_PLAY)
    }

    private fun handlePauseCommand() {
        isPlaying = false
        player?.pause()
        releaseLocks()
        updatePlaybackState(false)
        dispatchPlaybackState(player?.currentPosition ?: 0L, player?.duration ?: 0L)
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
        stopPlayback()
    }

    private fun dispatchToActivity(command: String) {
        val intent = Intent(MainActivity.ACTION_MEDIA_COMMAND).apply {
            putExtra(MainActivity.EXTRA_COMMAND, command)
            setPackage(packageName)
        }
        sendBroadcast(intent)
    }

    private fun dispatchPlaybackState(positionMs: Long, durationMs: Long) {
        val intent = Intent(MainActivity.ACTION_PLAYBACK_STATE).apply {
            putExtra(MainActivity.EXTRA_PLAYING, isPlaying)
            putExtra(MainActivity.EXTRA_TITLE, currentTitle)
            putExtra(MainActivity.EXTRA_ARTIST, currentArtist)
            putExtra(MainActivity.EXTRA_ARTWORK, currentArtworkUrl)
            putExtra(MainActivity.EXTRA_POSITION_MS, positionMs)
            putExtra(MainActivity.EXTRA_DURATION_MS, durationMs)
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

    private fun updateNotification() {
        refreshNotification()
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
            .setSubText("Apple Music")
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
                description = "Ongoing media playback and audio controls"
                setShowBadge(false)
                lockscreenVisibility = Notification.VISIBILITY_PUBLIC
            }
            notificationManager.createNotificationChannel(channel)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        serviceJob.cancel()
        playbackHandler.removeCallbacks(playbackTicker)
        releaseLocks()
        player?.release()
        mediaSession.isActive = false
        mediaSession.release()
        Log.i(TAG, "MediaPlaybackService destroyed, ExoPlayer released")
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
