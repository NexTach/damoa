package io.github.snowykte0426.damoa.personae.room.controller

import io.github.snowykte0426.damoa.common.currentUserId
import io.github.snowykte0426.damoa.personae.realtime.dto.response.RealtimeEvent
import io.github.snowykte0426.damoa.personae.realtime.service.RealtimeService
import io.github.snowykte0426.damoa.personae.room.dto.request.RoomRequest
import io.github.snowykte0426.damoa.personae.room.dto.response.RoomResponse
import io.github.snowykte0426.damoa.personae.room.service.RoomService
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/personae/rooms")
class RoomController(
    private val service: RoomService,
    private val realtime: RealtimeService,
) {
    @GetMapping
    fun list(): List<RoomResponse> = service.list(currentUserId())

    @GetMapping("/{id}")
    fun get(
        @PathVariable id: Long,
    ): RoomResponse = service.get(currentUserId(), id)

    @PostMapping
    fun create(
        @RequestBody req: RoomRequest,
        @RequestHeader(value = "X-Client-Id", required = false) clientId: String?,
    ): RoomResponse {
        val uid = currentUserId()
        val res = service.create(uid, req)
        realtime.publish(uid, RealtimeEvent("room", null, clientId))
        return res
    }

    @PatchMapping("/{id}")
    fun update(
        @PathVariable id: Long,
        @RequestBody req: RoomRequest,
        @RequestHeader(value = "X-Client-Id", required = false) clientId: String?,
    ): RoomResponse {
        val uid = currentUserId()
        val res = service.update(uid, id, req)
        realtime.publish(uid, RealtimeEvent("room", id, clientId))
        return res
    }

    @DeleteMapping("/{id}")
    fun delete(
        @PathVariable id: Long,
        @RequestHeader(value = "X-Client-Id", required = false) clientId: String?,
    ) {
        val uid = currentUserId()
        service.delete(uid, id)
        realtime.publish(uid, RealtimeEvent("room", id, clientId))
    }
}
