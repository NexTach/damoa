package io.github.snowykte0426.damoa.talkmaker

import io.github.snowykte0426.damoa.common.currentUserId
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/talkmaker/rooms/{roomId}/messages")
class MessageController(private val service: MessageService) {
    @GetMapping
    fun list(@PathVariable roomId: Long): List<MessageResponse> =
        service.list(currentUserId(), roomId)

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
