package io.github.snowykte0426.damoa.talkmaker.message.dto.response

import io.github.snowykte0426.damoa.talkmaker.message.entity.Message
import java.time.Instant

data class MessageResponse(
    val id: Long,
    val personaId: Long,
    val content: String,
    val attachmentUrl: String?,
    val attachmentType: String?,
    val attachmentName: String?,
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
    attachmentName = if (!attachmentExpired) attachmentName else null,
    attachmentExpired = attachmentExpired,
    sentAt = sentAt,
)
