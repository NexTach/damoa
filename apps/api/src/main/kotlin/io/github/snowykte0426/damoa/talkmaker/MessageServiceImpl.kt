package io.github.snowykte0426.damoa.talkmaker

import io.github.snowykte0426.damoa.common.notFound
import java.time.Instant
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class MessageServiceImpl(
    private val repository: MessageRepository,
    private val roomService: RoomService,
) : MessageService {
    @Transactional(readOnly = true)
    override fun list(ownerId: Long, roomId: Long): List<MessageResponse> {
        roomService.requireOwned(ownerId, roomId)
        return repository.findByRoomIdOrderBySentAtAscIdAsc(roomId).map { it.toResponse() }
    }

    @Transactional
    override fun create(ownerId: Long, roomId: Long, req: MessageRequest): MessageResponse {
        roomService.requireOwned(ownerId, roomId)
        val message = Message(
            roomId = roomId,
            personaId = req.personaId,
            content = req.content,
            sentAt = req.sentAt ?: Instant.now(),
        )
        val saved = repository.save(message)
        roomService.touch(roomId)
        return saved.toResponse()
    }

    @Transactional
    override fun update(ownerId: Long, roomId: Long, messageId: Long, req: MessageRequest): MessageResponse {
        roomService.requireOwned(ownerId, roomId)
        val message = repository.findByIdAndRoomId(messageId, roomId) ?: notFound("message not found")
        message.content = req.content
        message.personaId = req.personaId
        req.sentAt?.let { message.sentAt = it }
        return repository.save(message).toResponse()
    }

    @Transactional
    override fun delete(ownerId: Long, roomId: Long, messageId: Long) {
        roomService.requireOwned(ownerId, roomId)
        val message = repository.findByIdAndRoomId(messageId, roomId) ?: notFound("message not found")
        repository.delete(message)
    }
}
