package io.github.snowykte0426.damoa.talkmaker

import java.time.Instant

data class MessageResponse(
    val id: Long,
    val personaId: Long,
    val content: String,
    val sentAt: Instant,
)

fun Message.toResponse() = MessageResponse(id, personaId, content, sentAt)
