package io.github.snowykte0426.damoa.personae.room.dto.response

import io.github.snowykte0426.damoa.personae.room.entity.Room
import java.time.Instant

data class RoomResponse(
    val id: Long,
    val title: String,
    val participantPersonaIds: List<Long>,
    val updatedAt: Instant,
)

fun Room.toResponse() =
    RoomResponse(
        id = id,
        title = title,
        participantPersonaIds = participantPersonaIds.toList(),
        updatedAt = updatedAt,
    )
