package io.github.snowykte0426.damoa.talkmaker

import java.time.Instant

data class MessageRequest(
    val personaId: Long,
    val content: String,
    val sentAt: Instant? = null,
)
