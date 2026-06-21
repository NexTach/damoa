package io.github.snowykte0426.damoa.personae.ai.controller

import io.github.snowykte0426.damoa.personae.ai.dto.response.AiStatusResponse
import io.github.snowykte0426.damoa.personae.ai.service.AiService
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/personae/ai")
class AiController(
    private val aiService: AiService,
) {
    @GetMapping
    fun status(): AiStatusResponse = AiStatusResponse(aiService.isEnabled())
}
