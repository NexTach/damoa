package io.github.snowykte0426.damoa.auth

import io.github.snowykte0426.damoa.common.currentUserId
import io.github.snowykte0426.damoa.common.notFound
import io.github.snowykte0426.damoa.config.AppProperties
import io.github.snowykte0426.damoa.user.UserService
import jakarta.servlet.http.HttpServletResponse
import java.net.URLEncoder
import java.nio.charset.StandardCharsets
import java.security.MessageDigest
import java.security.SecureRandom
import java.util.Base64
import java.util.concurrent.ConcurrentHashMap
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Component
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.server.ResponseStatusException

data class MeResponse(val id: Long, val name: String, val email: String)

private val RANDOM = SecureRandom()
private val B64URL = Base64.getUrlEncoder().withoutPadding()

private fun randomToken(bytes: Int): String {
    val buf = ByteArray(bytes)
    RANDOM.nextBytes(buf)
    return B64URL.encodeToString(buf)
}

private fun s256(verifier: String): String {
    val digest = MessageDigest.getInstance("SHA-256").digest(verifier.toByteArray(StandardCharsets.US_ASCII))
    return B64URL.encodeToString(digest)
}

private fun enc(value: String): String = URLEncoder.encode(value, StandardCharsets.UTF_8)

/**
 * Temp in-memory store for pending OAuth states. In production, consider using a shared cache like Redis if you have multiple instances.
 * States are automatically expired after 10 minutes to prevent memory bloat. This is a simple implementation and may not be suitable for high load or distributed environments.
 */
@Component
class OAuthStateStore {
    private data class Pending(val verifier: String, val expiresAt: Long)

    private val store = ConcurrentHashMap<String, Pending>()
    private val ttlMillis = 10L * 60 * 1000

    fun put(state: String, verifier: String) {
        val now = System.currentTimeMillis()
        store.entries.removeIf { it.value.expiresAt < now }
        store[state] = Pending(verifier, now + ttlMillis)
    }

    fun consume(state: String): String? {
        val pending = store.remove(state) ?: return null
        return if (pending.expiresAt < System.currentTimeMillis()) null else pending.verifier
    }
}

@RestController
@RequestMapping("/api/auth")
class AuthController(private val userService: UserService) {
    @GetMapping("/me")
    fun me(): MeResponse {
        val user = userService.get(currentUserId()) ?: notFound("사용자 없음")
        return MeResponse(user.id, user.name, user.email)
    }
}

@RestController
@RequestMapping("/api/auth/datagsm")
class DataGsmOAuthController(
    private val client: DataGsmClient,
    private val jwtService: JwtService,
    private val userService: UserService,
    private val props: AppProperties,
    private val stateStore: OAuthStateStore,
) {
    /**
     * Start OAuth flow by generating state and PKCE verifier, storing them, and redirecting to DataGSM's authorization endpoint with appropriate query parameters.
     */
    @GetMapping("/start")
    fun start(response: HttpServletResponse) {
        val state = randomToken(24)
        val verifier = randomToken(48)
        stateStore.put(state, verifier)

        val d = props.datagsm
        val url = buildString {
            append(d.authBase).append("/v1/oauth/authorize")
            append("?response_type=code")
            append("&client_id=").append(enc(d.clientId))
            append("&redirect_uri=").append(enc(d.redirectUri))
            if (d.scope.isNotBlank()) append("&scope=").append(enc(d.scope))
            append("&state=").append(state)
            append("&code_challenge=").append(s256(verifier))
            append("&code_challenge_method=S256")
        }
        response.sendRedirect(url)
    }

    /**
     * Callback from DataGSM after user authorizes. Validates state and PKCE, exchanges code for token, fetches user info, upserts user in DB, issues JWT, and redirects to frontend with token in hash fragment.
     */
    @GetMapping("/callback")
    fun callback(
        @RequestParam code: String,
        @RequestParam state: String,
        response: HttpServletResponse,
    ) {
        val verifier = stateStore.consume(state)
            ?: throw ResponseStatusException(HttpStatus.BAD_REQUEST, "유효하지 않은 state")
        val accessToken = client.exchangeToken(code, verifier)
        val info = client.userInfo(accessToken)
        val user = userService.upsert(info.id, info.email, info.name)
        val jwt = jwtService.issue(user.id, user.name, user.email)
        response.sendRedirect("${props.frontendUrl}/lab/talkmaker#token=$jwt")
    }
}
