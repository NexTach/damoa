package io.github.snowykte0426.damoa.talkmaker.og.controller

import io.github.snowykte0426.damoa.talkmaker.og.dto.response.OgResponse
import io.github.snowykte0426.damoa.talkmaker.og.service.OgService
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/talkmaker/og")
class OgController(private val service: OgService) {
    @GetMapping
    fun fetch(@RequestParam url: String): OgResponse = service.fetch(url)
}
