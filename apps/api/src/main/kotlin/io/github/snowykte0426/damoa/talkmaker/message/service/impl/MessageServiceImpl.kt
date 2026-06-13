package io.github.snowykte0426.damoa.talkmaker.message.service.impl

import io.github.snowykte0426.damoa.common.notFound
import io.github.snowykte0426.damoa.config.AppProperties
import io.github.snowykte0426.damoa.talkmaker.message.dto.request.MessageRequest
import io.github.snowykte0426.damoa.talkmaker.message.dto.response.MessagePage
import io.github.snowykte0426.damoa.talkmaker.message.dto.response.MessageResponse
import io.github.snowykte0426.damoa.talkmaker.message.dto.response.SearchResult
import io.github.snowykte0426.damoa.talkmaker.message.dto.response.toResponse
import io.github.snowykte0426.damoa.talkmaker.message.entity.Message
import io.github.snowykte0426.damoa.talkmaker.message.repository.MessageRepository
import io.github.snowykte0426.damoa.talkmaker.message.service.MessageService
import io.github.snowykte0426.damoa.talkmaker.room.service.RoomService
import java.time.Instant
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class MessageServiceImpl(
    private val repository: MessageRepository,
    private val roomService: RoomService,
    props: AppProperties,
) : MessageService {
    private val publicBase = props.s3.publicBase
    private val searchCap = 100

    @Transactional(readOnly = true)
    override fun list(ownerId: Long, roomId: Long, limit: Int, before: String?): MessagePage {
        roomService.requireOwned(ownerId, roomId)
        val page = PageRequest.of(0, limit + 1) // +1 to detect more
        val desc = if (before == null) {
            repository.findByRoomIdOrderBySentAtDescIdDesc(roomId, page)
        } else {
            val (ts, id) = decodeCursor(before)
            repository.findOlder(roomId, ts, id, page)
        }
        val hasMore = desc.size > limit
        val rows = desc.take(limit) // newest → oldest within page
        val oldest = rows.lastOrNull()
        val nextCursor = if (hasMore && oldest != null) encodeCursor(oldest.sentAt, oldest.id) else null
        return MessagePage(rows.reversed().map { it.toResponse(publicBase) }, hasMore, nextCursor)
    }

    @Transactional(readOnly = true)
    override fun search(
        ownerId: Long,
        roomId: Long,
        q: String?,
        personaId: Long?,
        after: Instant?,
        before: Instant?,
    ): SearchResult {
        roomService.requireOwned(ownerId, roomId)
        val query = q?.trim()?.ifBlank { null }
        val rows = repository.search(
            roomId,
            query,
            personaId,
            after,
            before,
            PageRequest.of(0, searchCap),
        )
        val total = repository.searchCount(roomId, query, personaId, after, before)
        return SearchResult(rows.map { it.toResponse(publicBase) }, total, total > searchCap)
    }

    private fun encodeCursor(ts: Instant, id: Long) = "${ts.toEpochMilli()}_$id"

    private fun decodeCursor(c: String): Pair<Instant, Long> {
        val (ms, id) = c.split("_")
        return Instant.ofEpochMilli(ms.toLong()) to id.toLong()
    }

    @Transactional
    override fun create(ownerId: Long, roomId: Long, req: MessageRequest): MessageResponse {
        roomService.requireOwned(ownerId, roomId)
        val message = Message(
            roomId = roomId,
            personaId = req.personaId,
            content = req.content,
            attachmentKey = req.attachmentKey,
            attachmentType = req.attachmentType,
            attachmentName = req.attachmentName,
            sentAt = req.sentAt ?: Instant.now(),
        )
        val saved = repository.save(message)
        roomService.touch(roomId)
        return saved.toResponse(publicBase)
    }

    @Transactional
    override fun update(ownerId: Long, roomId: Long, messageId: Long, req: MessageRequest): MessageResponse {
        roomService.requireOwned(ownerId, roomId)
        val message = repository.findByIdAndRoomId(messageId, roomId) ?: notFound("message not found")
        message.content = req.content
        message.personaId = req.personaId
        req.sentAt?.let { message.sentAt = it }
        return repository.save(message).toResponse(publicBase)
    }

    @Transactional
    override fun delete(ownerId: Long, roomId: Long, messageId: Long) {
        roomService.requireOwned(ownerId, roomId)
        val message = repository.findByIdAndRoomId(messageId, roomId) ?: notFound("message not found")
        repository.delete(message)
    }
}
