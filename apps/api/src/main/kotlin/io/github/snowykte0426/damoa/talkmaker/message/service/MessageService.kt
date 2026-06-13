package io.github.snowykte0426.damoa.talkmaker.message.service

import io.github.snowykte0426.damoa.talkmaker.message.dto.request.MessageRequest
import io.github.snowykte0426.damoa.talkmaker.message.dto.response.MessageResponse

interface MessageService {
    fun list(ownerId: Long, roomId: Long): List<MessageResponse>

    fun create(ownerId: Long, roomId: Long, req: MessageRequest): MessageResponse

    fun update(ownerId: Long, roomId: Long, messageId: Long, req: MessageRequest): MessageResponse

    fun delete(ownerId: Long, roomId: Long, messageId: Long)
}
