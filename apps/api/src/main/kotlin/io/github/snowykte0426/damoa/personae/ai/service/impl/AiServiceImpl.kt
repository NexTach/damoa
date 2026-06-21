package io.github.snowykte0426.damoa.personae.ai.service.impl

import io.github.snowykte0426.damoa.config.AppProperties
import io.github.snowykte0426.damoa.personae.ai.service.AiService
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.web.client.RestClient
import org.springframework.web.server.ResponseStatusException

/**
 * Calls the OpenAI chat completions API directly via Spring's RestClient
 * (Boot 4.x native; avoids spring-ai's Spring Framework 6 / Jackson 2 deps).
 */
@Service
class AiServiceImpl(
    props: AppProperties,
) : AiService {
    private val apiKey = props.openai.apiKey
    private val model = props.openai.model
    private val client = RestClient.builder().baseUrl(props.openai.baseUrl).build()

    override fun isEnabled(): Boolean = apiKey.isNotBlank()

    override fun complete(messages: List<Map<String, String>>): String {
        if (apiKey.isBlank()) {
            throw ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "AI 기능이 설정되지 않았습니다")
        }
        val body =
            mapOf(
                "model" to model,
                "messages" to messages,
                "temperature" to 0.9,
            )
        val res =
            try {
                client
                    .post()
                    .uri("/v1/chat/completions")
                    .header("Authorization", "Bearer $apiKey")
                    .body(body)
                    .retrieve()
                    .body(OpenAiResponse::class.java)
            } catch (e: Exception) {
                throw ResponseStatusException(HttpStatus.BAD_GATEWAY, "AI 응답 생성에 실패했습니다: ${e.message}")
            }
        return res
            ?.choices
            ?.firstOrNull()
            ?.message
            ?.content
            ?.trim()
            .orEmpty()
            .ifBlank { throw ResponseStatusException(HttpStatus.BAD_GATEWAY, "AI가 빈 응답을 반환했습니다") }
    }

    // Minimal response shape (Jackson ignores unknown fields by default).
    data class OpenAiResponse(
        val choices: List<Choice> = emptyList(),
    )

    data class Choice(
        val message: ChoiceMessage? = null,
    )

    data class ChoiceMessage(
        val content: String? = null,
    )
}
