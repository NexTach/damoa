package io.github.snowykte0426.damoa.talkmaker.message.controller

import io.github.snowykte0426.damoa.common.currentUserId
import io.github.snowykte0426.damoa.talkmaker.message.dto.request.MessageRequest
import io.github.snowykte0426.damoa.talkmaker.message.dto.response.MessagePage
import io.github.snowykte0426.damoa.talkmaker.message.dto.response.MessageResponse
import io.github.snowykte0426.damoa.talkmaker.message.dto.response.SearchResult
import io.github.snowykte0426.damoa.talkmaker.message.service.MessageService
import java.time.Instant
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/talkmaker/rooms/{roomId}/messages")
class MessageController(private val service: MessageService) {
    @GetMapping
    fun list(
        @PathVariable roomId: Long,
        @RequestParam(defaultValue = "40") limit: Int,
        @RequestParam(required = false) before: String?,
    ): MessagePage = service.list(currentUserId(), roomId, limit.coerceIn(1, 100), before)

    @GetMapping("/search")
    fun search(
        @PathVariable roomId: Long,
        @RequestParam(required = false) q: String?,
        @RequestParam(required = false) personaId: Long?,
        @RequestParam(required = false) after: Long?,
        @RequestParam(required = false) before: Long?,
    ): SearchResult = service.search(
        currentUserId(),
        roomId,
        q,
        personaId,
        after?.let(Instant::ofEpochMilli),
        before?.let(Instant::ofEpochMilli),
    )

    @PostMapping
    fun create(@PathVariable roomId: Long, @RequestBody req: MessageRequest): MessageResponse =
        service.create(currentUserId(), roomId, req)

    @PatchMapping("/{messageId}")
    fun update(
        @PathVariable roomId: Long,
        @PathVariable messageId: Long,
        @RequestBody req: MessageRequest,
    ): MessageResponse = service.update(currentUserId(), roomId, messageId, req)

    @DeleteMapping("/{messageId}")
    fun delete(@PathVariable roomId: Long, @PathVariable messageId: Long) =
        service.delete(currentUserId(), roomId, messageId)
}
