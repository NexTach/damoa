package io.github.snowykte0426.damoa.talkmaker

import io.github.snowykte0426.damoa.common.currentUserId
import io.github.snowykte0426.damoa.common.notFound
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.Instant
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@Entity
@Table(name = "messages")
open class Message(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    open var id: Long = 0,
    open var roomId: Long = 0,
    // the person a that "says" this message, not necessarily the one owned by the user
    // (e.g. system messages can have a special personaId)
    open var personaId: Long = 0,
    @Column(columnDefinition = "TEXT")
    open var content: String = "",
    open var sentAt: Instant = Instant.now(), // allow client to specify sent time for better ordering, but default to now
    open var createdAt: Instant = Instant.now(),
)

interface MessageRepository : JpaRepository<Message, Long> {
    fun findByRoomIdOrderBySentAtAscIdAsc(roomId: Long): List<Message>
    fun findByIdAndRoomId(id: Long, roomId: Long): Message?
    fun deleteByRoomId(roomId: Long)
}

data class MessageRequest(
    val personaId: Long,
    val content: String,
    val sentAt: Instant? = null,
)

data class MessageResponse(
    val id: Long,
    val personaId: Long,
    val content: String,
    val sentAt: Instant,
)

fun Message.toResponse() = MessageResponse(id, personaId, content, sentAt)

@Service
open class MessageService(
    private val repository: MessageRepository,
    private val roomService: RoomService,
) {
    @Transactional(readOnly = true)
    open fun list(ownerId: Long, roomId: Long): List<MessageResponse> {
        roomService.requireOwned(ownerId, roomId)
        return repository.findByRoomIdOrderBySentAtAscIdAsc(roomId).map { it.toResponse() }
    }

    @Transactional
    open fun create(ownerId: Long, roomId: Long, req: MessageRequest): MessageResponse {
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
    open fun update(ownerId: Long, roomId: Long, messageId: Long, req: MessageRequest): MessageResponse {
        roomService.requireOwned(ownerId, roomId)
        val message = repository.findByIdAndRoomId(messageId, roomId) ?: notFound("메시지 없음")
        message.content = req.content
        message.personaId = req.personaId
        req.sentAt?.let { message.sentAt = it }
        return repository.save(message).toResponse()
    }

    @Transactional
    open fun delete(ownerId: Long, roomId: Long, messageId: Long) {
        roomService.requireOwned(ownerId, roomId)
        val message = repository.findByIdAndRoomId(messageId, roomId) ?: notFound("메시지 없음")
        repository.delete(message)
    }
}

@RestController
@RequestMapping("/api/talkmaker/rooms/{roomId}/messages")
class MessageController(private val service: MessageService) {
    @GetMapping
    fun list(@PathVariable roomId: Long): List<MessageResponse> =
        service.list(currentUserId(), roomId)

    @PostMapping
    fun create(@PathVariable roomId: Long, @RequestBody req: MessageRequest): MessageResponse =
        service.create(currentUserId(), roomId, req)

    @PatchMapping("/{messageId}")
    fun update(
        @PathVariable roomId: Long,
        @PathVariable messageId: Long,
        @RequestBody req: MessageRequest,
    ): MessageResponse = service.update(currentUserId(), roomId, messageId, req)

    @DeleteMapping("/{messageId}")
    fun delete(@PathVariable roomId: Long, @PathVariable messageId: Long) =
        service.delete(currentUserId(), roomId, messageId)
}
