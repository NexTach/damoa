package io.github.snowykte0426.damoa.personae.room.service.impl

import io.github.snowykte0426.damoa.common.notFound
import io.github.snowykte0426.damoa.personae.room.dto.request.RoomRequest
import io.github.snowykte0426.damoa.personae.room.dto.response.RoomResponse
import io.github.snowykte0426.damoa.personae.room.dto.response.toResponse
import io.github.snowykte0426.damoa.personae.room.entity.Room
import io.github.snowykte0426.damoa.personae.room.repository.RoomRepository
import io.github.snowykte0426.damoa.personae.room.service.RoomService
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant

@Service
class RoomServiceImpl(
    private val repository: RoomRepository,
) : RoomService {
    @Transactional(readOnly = true)
    override fun list(ownerId: Long): List<RoomResponse> = repository.findByOwnerIdOrderByUpdatedAtDesc(ownerId).map { it.toResponse() }

    @Transactional(readOnly = true)
    override fun get(
        ownerId: Long,
        id: Long,
    ): RoomResponse = find(ownerId, id).toResponse()

    @Transactional
    override fun create(
        ownerId: Long,
        req: RoomRequest,
    ): RoomResponse {
        val room =
            Room(
                ownerId = ownerId,
                title = req.title.ifBlank { "New chat" },
                selfPersonaId = req.selfPersonaId,
                participantPersonaIds = (req.participantPersonaIds ?: emptySet()).toMutableSet(),
            )
        return repository.save(room).toResponse()
    }

    @Transactional
    override fun update(
        ownerId: Long,
        id: Long,
        req: RoomRequest,
    ): RoomResponse {
        val room = find(ownerId, id)
        room.title = req.title.ifBlank { room.title }
        req.participantPersonaIds?.let { room.participantPersonaIds = it.toMutableSet() }
        room.selfPersonaId = req.selfPersonaId
        room.updatedAt = Instant.now()
        return repository.save(room).toResponse()
    }

    @Transactional
    override fun delete(
        ownerId: Long,
        id: Long,
    ) {
        repository.delete(find(ownerId, id))
    }

    @Transactional(readOnly = true)
    override fun requireOwned(
        ownerId: Long,
        id: Long,
    ) {
        find(ownerId, id)
    }

    @Transactional
    override fun touch(id: Long) {
        repository.findById(id).ifPresent {
            it.updatedAt = Instant.now()
            repository.save(it)
        }
    }

    private fun find(
        ownerId: Long,
        id: Long,
    ): Room = repository.findByIdAndOwnerId(id, ownerId) ?: notFound("room not found")
}
