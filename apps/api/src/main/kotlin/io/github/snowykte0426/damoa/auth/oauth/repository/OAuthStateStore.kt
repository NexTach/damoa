package io.github.snowykte0426.damoa.auth.oauth.repository

import org.springframework.stereotype.Component
import java.util.concurrent.ConcurrentHashMap

// Single-instance in-memory store for pending OAuth states (PKCE verifiers), TTL 10 minutes.
@Component
class OAuthStateStore {
    // state -> (codeVerifier, expiresAtMillis)
    private val store = ConcurrentHashMap<String, Pair<String, Long>>()
    private val ttlMillis = 10L * 60 * 1000

    fun put(
        state: String,
        verifier: String,
    ) {
        val now = System.currentTimeMillis()
        store.entries.removeIf { it.value.second < now }
        store[state] = verifier to (now + ttlMillis)
    }

    fun consume(state: String): String? {
        val pending = store.remove(state) ?: return null
        return if (pending.second < System.currentTimeMillis()) null else pending.first
    }
}
