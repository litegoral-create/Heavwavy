package com.musicbeta.wrapper

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.BufferedWriter
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL

class SignedStreamResolverImpl(
    private val endpoint: String = "https://api.example.com/media/resolve",
    private val timeoutMs: Int = 15_000,
) : SignedStreamResolver {

    override suspend fun resolve(request: SignedStreamRequest): Result<SignedStreamResponse> =
        withContext(Dispatchers.IO) {
            try {
                val payload = JSONObject().apply {
                    put("trackId", request.trackId)
                    put("title", request.title)
                    put("artist", request.artist)
                    put("artworkUrl", request.artworkUrl)
                    put("source", request.source)
                }.toString()

                val connection = (URL(endpoint).openConnection() as HttpURLConnection).apply {
                    requestMethod = "POST"
                    connectTimeout = timeoutMs
                    readTimeout = timeoutMs
                    setRequestProperty("Content-Type", "application/json")
                    setRequestProperty("Accept", "application/json")
                    doOutput = true
                }

                BufferedWriter(OutputStreamWriter(connection.outputStream, Charsets.UTF_8)).use { writer ->
                    writer.write(payload)
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
                    SignedStreamResponse(
                        streamUrl = streamUrl,
                        format = json.optString("format", "audio"),
                        bitrateKbps = json.optInt("bitrateKbps", -1).takeIf { it > 0 },
                        isLossless = json.optBoolean("isLossless", false),
                        expiresAtEpochMs = json.optLong("expiresAtEpochMs", -1L).takeIf { it > 0L }
                    )
                )
            } catch (e: Exception) {
                Result.failure(e)
            }
        }
}
