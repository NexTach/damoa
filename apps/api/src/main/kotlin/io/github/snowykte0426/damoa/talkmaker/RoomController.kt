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
@RequestMapping("/api/talkmaker/rooms")
class RoomController(private val service: RoomService) {
    @GetMapping
    fun list(): List<RoomResponse> = service.list(currentUserId())

    @GetMapping("/{id}")
    fun get(@PathVariable id: Long): RoomResponse = service.get(currentUserId(), id)

    @PostMapping
    fun create(@RequestBody req: RoomRequest): RoomResponse = service.create(currentUserId(), req)

    @PatchMapping("/{id}")
    fun update(@PathVariable id: Long, @RequestBody req: RoomRequest): RoomResponse =
        service.update(currentUserId(), id, req)

    @DeleteMapping("/{id}")
    fun delete(@PathVariable id: Long) = service.delete(currentUserId(), id)
}
