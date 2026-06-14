package io.github.snowykte0426.damoa.personae.message.dto.request

import java.time.Instant

data class MessageRequest(
    val personaId: Long,
    val content: String = "",
    val attachmentKey: String? = null,
    val attachmentType: String? = null,
    val attachmentName: String? = null,
    val replyToId: Long? = null,
    val replyToName: String? = null,
    val replyToText: String? = null,
    val sentAt: Instant? = null,
)
