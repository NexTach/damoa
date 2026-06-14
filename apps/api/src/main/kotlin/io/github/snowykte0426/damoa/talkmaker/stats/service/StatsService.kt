package io.github.snowykte0426.damoa.talkmaker.stats.service

import io.github.snowykte0426.damoa.talkmaker.stats.dto.response.RoomStats

interface StatsService {
    fun room(
        ownerId: Long,
        roomId: Long,
    ): RoomStats
}
