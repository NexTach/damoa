package io.github.snowykte0426.damoa.talkmaker

import java.time.Instant

data class MessageResponse(
    val id: Long,
    val personaId: Long,
    val content: String,
    val attachmentUrl: String?,
    val attachmentType: String?,
    val attachmentExpired: Boolean,
    val sentAt: Instant,
)

fun Message.toResponse(publicBase: String) = MessageResponse(
    id = id,
    personaId = personaId,
    content = content,
    attachmentUrl =
        if (attachmentKey != null && !attachmentExpired) "$publicBase/api/files/$attachmentKey" else null,
    attachmentType = attachmentType,
    attachmentExpired = attachmentExpired,
    sentAt = sentAt,
)
