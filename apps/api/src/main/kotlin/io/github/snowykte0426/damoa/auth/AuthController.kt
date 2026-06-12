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
import java.time.Duration
import java.util.Base64
import org.springframework.data.redis.core.StringRedisTemplate
import org.springframework.http.HttpStatus
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
    private val redis: StringRedisTemplate,
) {
    /** DataGSM authorize 로 리다이렉트 (state + PKCE 생성) */
    @GetMapping("/start")
    fun start(response: HttpServletResponse) {
        val state = randomToken(24)
        val verifier = randomToken(48)
        redis.opsForValue().set("oauth:state:$state", verifier, Duration.ofMinutes(10))

        val d = props.datagsm
        val url = buildString {
            append(d.authBase).append("/v1/oauth/authorize")
            append("?response_type=code")
            append("&client_id=").append(enc(d.clientId))
            append("&redirect_uri=").append(enc(d.redirectUri))
            append("&scope=").append(enc(d.scope))
            append("&state=").append(state)
            append("&code_challenge=").append(s256(verifier))
            append("&code_challenge_method=S256")
        }
        response.sendRedirect(url)
    }

    /** DataGSM 콜백: code 교환 → userinfo → User upsert → 우리 JWT 발급 → 프론트로 리다이렉트 */
    @GetMapping("/callback")
    fun callback(
        @RequestParam code: String,
        @RequestParam state: String,
        response: HttpServletResponse,
    ) {
        val verifier = redis.opsForValue().getAndDelete("oauth:state:$state")
            ?: throw ResponseStatusException(HttpStatus.BAD_REQUEST, "유효하지 않은 state")
        val accessToken = client.exchangeToken(code, verifier)
        val info = client.userInfo(accessToken)
        val user = userService.upsert(info.id, info.email, info.name)
        val jwt = jwtService.issue(user.id, user.name, user.email)
        response.sendRedirect("${props.frontendUrl}/lab/talkmaker#token=$jwt")
    }
}
