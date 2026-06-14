package io.github.snowykte0426.damoa.personae.realtime.dto.response

// Broadcast to a user's other devices so they can refetch what changed.
data class RealtimeEvent(
    val scope: String, // "message" | "room" | "persona"
    val roomId: Long?, // present for message events
    val clientId: String?, // originating device — receivers ignore their own
)
