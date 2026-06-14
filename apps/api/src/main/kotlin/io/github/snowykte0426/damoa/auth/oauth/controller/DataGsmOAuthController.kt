package io.github.snowykte0426.damoa.auth.oauth.controller

import io.github.snowykte0426.damoa.auth.jwt.service.JwtService
import io.github.snowykte0426.damoa.auth.oauth.repository.OAuthStateStore
import io.github.snowykte0426.damoa.auth.oauth.service.DataGsmClient
import io.github.snowykte0426.damoa.config.AppProperties
import io.github.snowykte0426.damoa.user.service.UserService
import jakarta.servlet.http.HttpServletResponse
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.server.ResponseStatusException
import java.net.URLEncoder
import java.nio.charset.StandardCharsets
import java.security.MessageDigest
import java.security.SecureRandom
import java.util.Base64

private val RANDOM = SecureRandom()
private val B64URL = Base64.getUrlEncoder().withoutPadding()

private fun randomToken(bytes: Int): String = ByteArray(bytes).also { RANDOM.nextBytes(it) }.let { B64URL.encodeToString(it) }

private fun s256(verifier: String): String =
    B64URL.encodeToString(
        MessageDigest.getInstance("SHA-256").digest(verifier.toByteArray(StandardCharsets.US_ASCII)),
    )

private fun enc(value: String): String = URLEncoder.encode(value, StandardCharsets.UTF_8)

@RestController
@RequestMapping("/api/auth/datagsm")
class DataGsmOAuthController(
    private val client: DataGsmClient,
    private val jwtService: JwtService,
    private val userService: UserService,
    private val props: AppProperties,
    private val stateStore: OAuthStateStore,
) {
    @GetMapping("/start")
    fun start(response: HttpServletResponse) {
        val state = randomToken(24)
        val verifier = randomToken(48)
        stateStore.put(state, verifier)

        val d = props.datagsm
        val url =
            buildString {
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

    @GetMapping("/callback")
    fun callback(
        @RequestParam code: String,
        @RequestParam state: String,
        response: HttpServletResponse,
    ) {
        val verifier =
            stateStore.consume(state)
                ?: throw ResponseStatusException(HttpStatus.BAD_REQUEST, "invalid state")
        val accessToken = client.exchangeToken(code, verifier)
        val info = client.userInfo(accessToken)
        val user = userService.upsert(info.id, info.email, info.name)
        val jwt = jwtService.issue(user.id, user.name, user.email)
        response.sendRedirect("${props.frontendUrl}/lab/talkmaker#token=$jwt")
    }
}
