package io.github.snowykte0426.damoa.auth

import io.github.snowykte0426.damoa.config.AppProperties
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.stereotype.Component
import org.springframework.web.reactive.function.client.WebClient
import org.springframework.web.reactive.function.client.bodyToMono
import org.springframework.web.server.ResponseStatusException

@Component
class DataGsmClientImpl(
    private val webClient: WebClient,
    private val props: AppProperties,
) : DataGsmClient {
    override fun exchangeToken(code: String, codeVerifier: String): String {
        val body = mapOf(
            "grant_type" to "authorization_code",
            "code" to code,
            "client_id" to props.datagsm.clientId,
            "client_secret" to props.datagsm.clientSecret,
            "redirect_uri" to props.datagsm.redirectUri,
            "code_verifier" to codeVerifier,
        )
        val resp = webClient.post()
            .uri("${props.datagsm.authBase}/v1/oauth/token")
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(body)
            .retrieve()
            .bodyToMono<Map<String, Any?>>()
            .block()
            ?: throw ResponseStatusException(HttpStatus.BAD_GATEWAY)
        return resp["access_token"] as? String
            ?: throw ResponseStatusException(HttpStatus.BAD_GATEWAY)
    }

    override fun userInfo(accessToken: String): DataGsmUser {
        @Suppress("UNCHECKED_CAST")
        val resp = webClient.get()
            .uri("${props.datagsm.resourceBase}/userinfo")
            .header("Authorization", "Bearer $accessToken")
            .retrieve()
            .bodyToMono<Map<String, Any?>>()
            .block()
            ?: throw ResponseStatusException(HttpStatus.BAD_GATEWAY)
        val id = (resp["id"] as? Number)?.toLong()
            ?: throw ResponseStatusException(HttpStatus.BAD_GATEWAY)
        val email = resp["email"] as? String ?: ""
        val student = resp["student"] as? Map<String, Any?>
        val name = (student?.get("name") as? String)
            ?: email.substringBefore("@").ifBlank { "user$id" }
        return DataGsmUser(id, email, name)
    }
}
