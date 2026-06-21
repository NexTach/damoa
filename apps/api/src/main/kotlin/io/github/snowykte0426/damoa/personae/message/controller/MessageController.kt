package io.github.snowykte0426.damoa.personae.message.controller

import io.github.snowykte0426.damoa.common.currentUserId
import io.github.snowykte0426.damoa.personae.message.dto.request.GenerateRequest
import io.github.snowykte0426.damoa.personae.message.dto.request.MessageRequest
import io.github.snowykte0426.damoa.personae.message.dto.request.PinRequest
import io.github.snowykte0426.damoa.personae.message.dto.request.ShiftRequest
import io.github.snowykte0426.damoa.personae.message.dto.response.MessagePage
import io.github.snowykte0426.damoa.personae.message.dto.response.MessageResponse
import io.github.snowykte0426.damoa.personae.message.dto.response.SearchResult
import io.github.snowykte0426.damoa.personae.message.service.MessageService
import io.github.snowykte0426.damoa.personae.realtime.dto.response.RealtimeEvent
import io.github.snowykte0426.damoa.personae.realtime.service.RealtimeService
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.time.Instant

@RestController
@RequestMapping("/api/personae/rooms/{roomId}/messages")
class MessageController(
    private val service: MessageService,
    private val realtime: RealtimeService,
) {
    @PostMapping("/generate")
    fun generate(
        @PathVariable roomId: Long,
        @RequestBody req: GenerateRequest,
        @RequestHeader(value = "X-Client-Id", required = false) clientId: String?,
    ): MessageResponse {
        val uid = currentUserId()
        val res = service.generateReply(uid, roomId, req.personaId)
        realtime.publish(uid, RealtimeEvent("message", roomId, clientId))
        return res
    }

    // Server-side training-data export: builds the JSON (decrypting in memory)
    // and serves it as a download (Spring serializes the body; Content-Disposition
    // forces a download). Auth via ?token= (a download navigation can't set
    // headers). Caps at the latest [limit] messages.
    @GetMapping("/export")
    fun export(
        @PathVariable roomId: Long,
        @RequestParam assistant: Long,
        @RequestParam(defaultValue = "1000") limit: Int,
    ): ResponseEntity<Map<String, Any?>> {
        val root = service.exportTraining(currentUserId(), roomId, assistant, limit.coerceIn(1, 2000))
        return ResponseEntity
            .ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"personae-room$roomId.json\"")
            .contentType(MediaType.APPLICATION_JSON)
            .body(root)
    }

    @GetMapping
    fun list(
        @PathVariable roomId: Long,
        @RequestParam(defaultValue = "40") limit: Int,
        @RequestParam(required = false) before: String?,
        @RequestParam(required = false) at: Long?,
    ): MessagePage = service.list(currentUserId(), roomId, limit.coerceIn(1, 100), before, at)

    @GetMapping("/search")
    fun search(
        @PathVariable roomId: Long,
        @RequestParam(required = false) q: String?,
        @RequestParam(required = false) personaId: Long?,
        @RequestParam(required = false) after: Long?,
        @RequestParam(required = false) before: Long?,
        @RequestParam(required = false) cursor: String?,
    ): SearchResult =
        service.search(
            currentUserId(),
            roomId,
            q,
            personaId,
            after?.let(Instant::ofEpochMilli),
            before?.let(Instant::ofEpochMilli),
            cursor,
        )

    @GetMapping("/pinned")
    fun pinned(
        @PathVariable roomId: Long,
    ): List<MessageResponse> = service.listPinned(currentUserId(), roomId)

    @GetMapping("/letters")
    fun letters(
        @PathVariable roomId: Long,
    ): List<MessageResponse> = service.listLetters(currentUserId(), roomId)

    @PatchMapping("/{messageId}/pin")
    fun pin(
        @PathVariable roomId: Long,
        @PathVariable messageId: Long,
        @RequestBody req: PinRequest,
        @RequestHeader(value = "X-Client-Id", required = false) clientId: String?,
    ): MessageResponse {
        val uid = currentUserId()
        val res = service.setPin(uid, roomId, messageId, req.pinned)
        realtime.publish(uid, RealtimeEvent("message", roomId, clientId))
        return res
    }

    @PostMapping("/shift")
    fun shift(
        @PathVariable roomId: Long,
        @RequestBody req: ShiftRequest,
        @RequestHeader(value = "X-Client-Id", required = false) clientId: String?,
    ) {
        val uid = currentUserId()
        service.shiftTimes(uid, roomId, req.ids, req.deltaMs)
        realtime.publish(uid, RealtimeEvent("message", roomId, clientId))
    }

    @PostMapping
    fun create(
        @PathVariable roomId: Long,
        @RequestBody req: MessageRequest,
        @RequestHeader(value = "X-Client-Id", required = false) clientId: String?,
    ): MessageResponse {
        val uid = currentUserId()
        val res = service.create(uid, roomId, req)
        realtime.publish(uid, RealtimeEvent("message", roomId, clientId))
        return res
    }

    @PatchMapping("/{messageId}")
    fun update(
        @PathVariable roomId: Long,
        @PathVariable messageId: Long,
        @RequestBody req: MessageRequest,
        @RequestHeader(value = "X-Client-Id", required = false) clientId: String?,
    ): MessageResponse {
        val uid = currentUserId()
        val res = service.update(uid, roomId, messageId, req)
        realtime.publish(uid, RealtimeEvent("message", roomId, clientId))
        return res
    }

    @DeleteMapping("/{messageId}")
    fun delete(
        @PathVariable roomId: Long,
        @PathVariable messageId: Long,
        @RequestHeader(value = "X-Client-Id", required = false) clientId: String?,
    ) {
        val uid = currentUserId()
        service.delete(uid, roomId, messageId)
        realtime.publish(uid, RealtimeEvent("message", roomId, clientId))
    }
}
