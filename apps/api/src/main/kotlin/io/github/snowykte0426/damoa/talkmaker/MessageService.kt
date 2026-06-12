package io.github.snowykte0426.damoa.talkmaker

interface MessageService {
    fun list(ownerId: Long, roomId: Long): List<MessageResponse>

    fun create(ownerId: Long, roomId: Long, req: MessageRequest): MessageResponse

    fun update(ownerId: Long, roomId: Long, messageId: Long, req: MessageRequest): MessageResponse

    fun delete(ownerId: Long, roomId: Long, messageId: Long)
}
