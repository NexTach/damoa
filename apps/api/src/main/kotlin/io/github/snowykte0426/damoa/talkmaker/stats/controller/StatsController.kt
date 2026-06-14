package io.github.snowykte0426.damoa.talkmaker.stats.controller

import io.github.snowykte0426.damoa.common.currentUserId
import io.github.snowykte0426.damoa.talkmaker.stats.dto.response.RoomStats
import io.github.snowykte0426.damoa.talkmaker.stats.service.StatsService
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/talkmaker/rooms/{roomId}/stats")
class StatsController(
    private val service: StatsService,
) {
    @GetMapping
    fun stats(
        @PathVariable roomId: Long,
    ): RoomStats = service.room(currentUserId(), roomId)
}
