package io.github.snowykte0426.damoa.personae.message.support

import java.security.SecureRandom
import java.util.Base64
import javax.crypto.Cipher
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.SecretKeySpec

/**
 * Decrypts message content for server-side processing (search, letters).
 *
 * Content is stored as the client format "enc:v1:<ivB64>:<ctB64>" (AES-256-GCM,
 * matching Web Crypto's encrypt output: ciphertext||tag). The per-user key is
 * server-held, so this is encrypted-at-rest, not true E2EE. Legacy plaintext
 * (no prefix) and undecryptable values are returned/handled gracefully.
 */
object MessageCrypto {
    private const val PREFIX = "enc:v1:"
    private val decoder: Base64.Decoder = Base64.getDecoder()
    private val encoder: Base64.Encoder = Base64.getEncoder()
    private val random = SecureRandom()

    /** Encrypts plaintext to the client-compatible "enc:v1:<iv>:<ct>" format. */
    fun encrypt(
        plain: String,
        keyB64: String?,
    ): String {
        if (plain.isEmpty() || keyB64.isNullOrBlank()) return plain
        val iv = ByteArray(12).also { random.nextBytes(it) }
        val key = SecretKeySpec(decoder.decode(keyB64), "AES")
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(Cipher.ENCRYPT_MODE, key, GCMParameterSpec(128, iv))
        val ct = cipher.doFinal(plain.toByteArray(Charsets.UTF_8))
        return "$PREFIX${encoder.encodeToString(iv)}:${encoder.encodeToString(ct)}"
    }

    /** Returns plaintext, or the original token if it can't be decrypted. */
    fun decrypt(
        token: String?,
        keyB64: String?,
    ): String {
        if (token.isNullOrEmpty()) return ""
        if (!token.startsWith(PREFIX) || keyB64.isNullOrBlank()) return token
        return try {
            val parts = token.split(":")
            val iv = decoder.decode(parts[2])
            val ct = decoder.decode(parts[3])
            val key = SecretKeySpec(decoder.decode(keyB64), "AES")
            val cipher = Cipher.getInstance("AES/GCM/NoPadding")
            cipher.init(Cipher.DECRYPT_MODE, key, GCMParameterSpec(128, iv))
            String(cipher.doFinal(ct), Charsets.UTF_8)
        } catch (_: Exception) {
            ""
        }
    }

    /** Long messages shown as "letters" (mirrors the client heuristic). */
    fun isLetter(plain: String): Boolean = plain.length >= 220 || plain.count { it == '\n' } >= 8
}
