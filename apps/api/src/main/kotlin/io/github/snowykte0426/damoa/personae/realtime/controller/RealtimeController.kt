package io.github.snowykte0426.damoa.personae.realtime.controller

import io.github.snowykte0426.damoa.common.currentUserId
import io.github.snowykte0426.damoa.personae.realtime.service.RealtimeService
import jakarta.servlet.http.HttpServletResponse
import org.springframework.http.MediaType
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter

@RestController
@RequestMapping("/api/personae/events")
class RealtimeController(
    private val realtime: RealtimeService,
) {
    @GetMapping(produces = [MediaType.TEXT_EVENT_STREAM_VALUE])
    fun stream(response: HttpServletResponse): SseEmitter {
        // Disable proxy/CDN buffering so events stream immediately.
        response.setHeader("X-Accel-Buffering", "no")
        response.setHeader("Cache-Control", "no-cache")
        return realtime.subscribe(currentUserId())
    }
}
