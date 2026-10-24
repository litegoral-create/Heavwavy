package com.musicbeta.wrapper

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.BufferedWriter
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL

data class StreamResolutionRequest(
    val trackId: String,
    val title: String,
    val artist: String,
    val artworkUrl: String? = null,
)

data class StreamResolutionResponse(
    val streamUrl: String,
    val format: String,
    val bitrateKbps: Int? = null,
    val isLossless: Boolean = false,
)

interface AudioStreamResolver {
    suspend fun resolve(request: StreamResolutionRequest): Result<StreamResolutionResponse>
}

class HttpAudioStreamResolver(
    private val endpoint: String = "https://api.example.com/media/resolve",
    private val timeoutMs: Int = 15_000,
) : AudioStreamResolver {

    override suspend fun resolve(request: StreamResolutionRequest): Result<StreamResolutionResponse> =
        withContext(Dispatchers.IO) {
            try {
                val body = JSONObject().apply {
                    put("trackId", request.trackId)
                    put("title", request.title)
                    put("artist", request.artist)
                    put("artworkUrl", request.artworkUrl ?: "")
                }.toString()

                val url = URL(endpoint)
                val connection = (url.openConnection() as HttpURLConnection).apply {
                    requestMethod = "POST"
                    connectTimeout = timeoutMs
                    readTimeout = timeoutMs
                    setRequestProperty("Content-Type", "application/json")
                    setRequestProperty("Accept", "application/json")
                    doOutput = true
                }

                BufferedWriter(OutputStreamWriter(connection.outputStream, Charsets.UTF_8)).use { writer ->
                    writer.write(body)
                    writer.flush()
                }

                val responseCode = connection.responseCode
                if (responseCode !in 200..299) {
                    return@withContext Result.failure(IllegalStateException("HTTP $responseCode from stream resolver"))
                }

                val responseText = connection.inputStream.bufferedReader(Charsets.UTF_8).use { it.readText() }
                val json = JSONObject(responseText)
                val streamUrl = json.optString("streamUrl", "")
                if (streamUrl.isBlank()) {
                    return@withContext Result.failure(IllegalStateException("Empty streamUrl in resolver payload"))
                }

                Result.success(
                    StreamResolutionResponse(
                        streamUrl = streamUrl,
                        format = json.optString("format", "audio"),
                        bitrateKbps = json.optInt("bitrateKbps", -1).takeIf { it > 0 },
                        isLossless = json.optBoolean("isLossless", false),
                    )
                )
            } catch (e: Exception) {
                Result.failure(e)
            }
        }
}
