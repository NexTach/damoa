package io.github.snowykte0426.damoa.personae.room.dto.request

data class RoomRequest(
    val title: String,
    val participantPersonaIds: Set<Long>? = null,
    val selfPersonaId: Long? = null,
)
