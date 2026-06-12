package io.github.snowykte0426.damoa.talkmaker

import io.github.snowykte0426.damoa.common.currentUserId
import io.github.snowykte0426.damoa.common.notFound
import jakarta.persistence.CollectionTable
import jakarta.persistence.Column
import jakarta.persistence.ElementCollection
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
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
@Table(name = "rooms")
open class Room(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    open var id: Long = 0,
    open var ownerId: Long = 0,
    open var title: String = "",
    open var selfPersonaId: Long? = null,
    @ElementCollection
    @CollectionTable(name = "room_personas", joinColumns = [JoinColumn(name = "room_id")])
    @Column(name = "persona_id")
    open var participantPersonaIds: MutableSet<Long> = mutableSetOf(),
    open var createdAt: Instant = Instant.now(),
    open var updatedAt: Instant = Instant.now(),
)

interface RoomRepository : JpaRepository<Room, Long> {
    fun findByOwnerIdOrderByUpdatedAtDesc(ownerId: Long): List<Room>
    fun findByIdAndOwnerId(id: Long, ownerId: Long): Room?
}

data class RoomRequest(
    val title: String,
    val participantPersonaIds: Set<Long>? = null,
    val selfPersonaId: Long? = null,
)

data class RoomResponse(
    val id: Long,
    val title: String,
    val selfPersonaId: Long?,
    val participantPersonaIds: List<Long>,
    val updatedAt: Instant,
)

@Service
open class RoomService(private val repository: RoomRepository) {
    @Transactional(readOnly = true)
    open fun list(ownerId: Long): List<RoomResponse> =
        repository.findByOwnerIdOrderByUpdatedAtDesc(ownerId).map { it.toResponse() }

    @Transactional(readOnly = true)
    open fun get(ownerId: Long, id: Long): RoomResponse = find(ownerId, id).toResponse()

    @Transactional
    open fun create(ownerId: Long, req: RoomRequest): RoomResponse {
        val room = Room(
            ownerId = ownerId,
            title = req.title.ifBlank { "새 대화" },
            selfPersonaId = req.selfPersonaId,
            participantPersonaIds = (req.participantPersonaIds ?: emptySet()).toMutableSet(),
        )
        return repository.save(room).toResponse()
    }

    @Transactional
    open fun update(ownerId: Long, id: Long, req: RoomRequest): RoomResponse {
        val room = find(ownerId, id)
        room.title = req.title.ifBlank { room.title }
        req.participantPersonaIds?.let { room.participantPersonaIds = it.toMutableSet() }
        room.selfPersonaId = req.selfPersonaId
        room.updatedAt = Instant.now()
        return repository.save(room).toResponse()
    }

    @Transactional
    open fun delete(ownerId: Long, id: Long) {
        repository.delete(find(ownerId, id))
    }

    /** 방 소유 검증 (메시지 서비스에서도 사용) */
    @Transactional(readOnly = true)
    open fun requireOwned(ownerId: Long, id: Long) {
        find(ownerId, id)
    }

    @Transactional
    open fun touch(id: Long) {
        repository.findById(id).ifPresent {
            it.updatedAt = Instant.now()
            repository.save(it)
        }
    }

    private fun find(ownerId: Long, id: Long): Room =
        repository.findByIdAndOwnerId(id, ownerId) ?: notFound("채팅방 없음")
}

fun Room.toResponse() = RoomResponse(
    id = id,
    title = title,
    selfPersonaId = selfPersonaId,
    participantPersonaIds = participantPersonaIds.toList(),
    updatedAt = updatedAt,
)

@RestController
@RequestMapping("/api/talkmaker/rooms")
class RoomController(private val service: RoomService) {
    @GetMapping
    fun list(): List<RoomResponse> = service.list(currentUserId())

    @GetMapping("/{id}")
    fun get(@PathVariable id: Long): RoomResponse = service.get(currentUserId(), id)

    @PostMapping
    fun create(@RequestBody req: RoomRequest): RoomResponse = service.create(currentUserId(), req)

    @PatchMapping("/{id}")
    fun update(@PathVariable id: Long, @RequestBody req: RoomRequest): RoomResponse =
        service.update(currentUserId(), id, req)

    @DeleteMapping("/{id}")
    fun delete(@PathVariable id: Long) = service.delete(currentUserId(), id)
}
