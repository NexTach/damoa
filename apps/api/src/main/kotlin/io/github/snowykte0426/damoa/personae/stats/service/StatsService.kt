package io.github.snowykte0426.damoa.personae.stats.service

import io.github.snowykte0426.damoa.personae.stats.dto.response.RoomStats

interface StatsService {
    fun room(
        ownerId: Long,
        roomId: Long,
    ): RoomStats
}
