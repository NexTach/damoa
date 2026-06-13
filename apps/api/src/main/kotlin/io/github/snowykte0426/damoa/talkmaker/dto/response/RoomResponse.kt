package io.github.snowykte0426.damoa.talkmaker.dto.response

import io.github.snowykte0426.damoa.talkmaker.entity.Room
import java.time.Instant

data class RoomResponse(
    val id: Long,
    val title: String,
    val selfPersonaId: Long?,
    val participantPersonaIds: List<Long>,
    val updatedAt: Instant,
)

fun Room.toResponse() = RoomResponse(
    id = id,
    title = title,
    selfPersonaId = selfPersonaId,
    participantPersonaIds = participantPersonaIds.toList(),
    updatedAt = updatedAt,
)
