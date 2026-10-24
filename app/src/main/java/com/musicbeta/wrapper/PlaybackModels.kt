package com.musicbeta.wrapper

import kotlinx.parcelize.Parcelize

@Parcelize
data class NativePlaybackState(
    val playing: Boolean = false,
    val title: String = "Apple Music",
    val artist: String = "Now Playing",
    val artworkUrl: String = "",
    val positionMs: Long = 0L,
    val durationMs: Long = 0L,
    val streamUrl: String = "",
    val streamFormat: String = "audio",
    val bitrateKbps: Int? = null,
    val isLossless: Boolean = false,
) : android.os.Parcelable

@Parcelize
data class SignedStreamRequest(
    val trackId: String,
    val title: String,
    val artist: String,
    val artworkUrl: String = "",
    val source: String = "apple_music_web",
) : android.os.Parcelable

@Parcelize
data class SignedStreamResponse(
    val streamUrl: String,
    val format: String = "audio",
    val bitrateKbps: Int? = null,
    val isLossless: Boolean = false,
    val expiresAtEpochMs: Long? = null,
) : android.os.Parcelable

interface SignedStreamResolver {
    suspend fun resolve(request: SignedStreamRequest): Result<SignedStreamResponse>
}

object PlaybackEvents {
    const val EVENT_PLAYING_CHANGED = "playback_changed"
    const val EVENT_METADATA_CHANGED = "metadata_changed"
    const val EVENT_STREAM_RESOLVED = "stream_resolved"
}
