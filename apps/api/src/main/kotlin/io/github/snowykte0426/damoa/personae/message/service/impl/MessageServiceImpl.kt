package io.github.snowykte0426.damoa.personae.message.service.impl

import io.github.snowykte0426.damoa.common.notFound
import io.github.snowykte0426.damoa.config.AppProperties
import io.github.snowykte0426.damoa.personae.message.dto.request.MessageRequest
import io.github.snowykte0426.damoa.personae.message.dto.response.MessagePage
import io.github.snowykte0426.damoa.personae.message.dto.response.MessageResponse
import io.github.snowykte0426.damoa.personae.message.dto.response.SearchResult
import io.github.snowykte0426.damoa.personae.message.dto.response.toResponse
import io.github.snowykte0426.damoa.personae.message.entity.Message
import io.github.snowykte0426.damoa.personae.message.repository.MessageRepository
import io.github.snowykte0426.damoa.personae.message.service.MessageService
import io.github.snowykte0426.damoa.personae.message.support.MessageCrypto
import io.github.snowykte0426.damoa.personae.room.service.RoomService
import io.github.snowykte0426.damoa.user.service.UserService
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant

@Service
class MessageServiceImpl(
    private val repository: MessageRepository,
    private val roomService: RoomService,
    private val userService: UserService,
    props: AppProperties,
) : MessageService {
    private val publicBase = props.s3.publicBase
    private val searchPageSize = 100

    @Transactional(readOnly = true)
    override fun list(
        ownerId: Long,
        roomId: Long,
        limit: Int,
        before: String?,
        at: Long?,
    ): MessagePage {
        roomService.requireOwned(ownerId, roomId)
        val page = PageRequest.of(0, limit + 1) // +1 to detect more
        val desc =
            when {
                at != null -> {
                    val target = find(roomId, at)
                    repository.findOlderOrEqual(roomId, target.sentAt, target.id, page)
                }
                before != null -> {
                    val (ts, id) = decodeCursor(before)
                    repository.findOlder(roomId, ts, id, page)
                }
                else -> repository.findByRoomIdOrderBySentAtDescIdDesc(roomId, page)
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
        cursor: String?,
    ): SearchResult {
        roomService.requireOwned(ownerId, roomId)
        val query = q?.trim()?.lowercase()?.ifBlank { null }
        // Content is encrypted at rest; the server holds the key, so we decrypt
        // candidates in memory and match the query here (accurate, whole-room).
        val candidates = repository.searchCandidates(roomId, personaId, after, before)
        val matched =
            if (query == null) {
                candidates
            } else {
                val key = userService.get(ownerId)?.encKey
                candidates.filter { MessageCrypto.decrypt(it.content, key).lowercase().contains(query) }
            }
        // Cursor is the last message id of the previous page (stable per query).
        val startIdx =
            cursor?.toLongOrNull()?.let { cid ->
                matched.indexOfFirst { it.id == cid }.let { if (it >= 0) it + 1 else 0 }
            } ?: 0
        val page = matched.drop(startIdx).take(searchPageSize)
        val hasMore = matched.size > startIdx + searchPageSize
        val nextCursor = if (hasMore && page.isNotEmpty()) page.last().id.toString() else null
        return SearchResult(page.map { it.toResponse(publicBase) }, matched.size.toLong(), hasMore, nextCursor)
    }

    private fun encodeCursor(
        ts: Instant,
        id: Long,
    ) = "${ts.toEpochMilli()}_$id"

    private fun decodeCursor(c: String): Pair<Instant, Long> {
        val (ms, id) = c.split("_")
        return Instant.ofEpochMilli(ms.toLong()) to id.toLong()
    }

    @Transactional
    override fun create(
        ownerId: Long,
        roomId: Long,
        req: MessageRequest,
    ): MessageResponse {
        roomService.requireOwned(ownerId, roomId)
        val message =
            Message(
                roomId = roomId,
                personaId = req.personaId,
                content = req.content,
                attachmentKey = req.attachmentKey,
                attachmentType = req.attachmentType,
                attachmentName = req.attachmentName,
                replyToId = req.replyToId,
                replyToName = req.replyToName,
                replyToText = req.replyToText,
                sentAt = req.sentAt ?: Instant.now(),
            )
        val saved = repository.save(message)
        roomService.touch(roomId)
        return saved.toResponse(publicBase)
    }

    @Transactional
    override fun update(
        ownerId: Long,
        roomId: Long,
        messageId: Long,
        req: MessageRequest,
    ): MessageResponse {
        roomService.requireOwned(ownerId, roomId)
        val message = find(roomId, messageId)
        message.content = req.content
        message.personaId = req.personaId
        req.sentAt?.let { message.sentAt = it }
        return repository.save(message).toResponse(publicBase)
    }

    @Transactional
    override fun delete(
        ownerId: Long,
        roomId: Long,
        messageId: Long,
    ) {
        roomService.requireOwned(ownerId, roomId)
        val message = find(roomId, messageId)
        repository.delete(message)
    }

    @Transactional(readOnly = true)
    override fun listPinned(
        ownerId: Long,
        roomId: Long,
    ): List<MessageResponse> {
        roomService.requireOwned(ownerId, roomId)
        return repository.findByRoomIdAndPinnedTrueOrderBySentAtDescIdDesc(roomId).map { it.toResponse(publicBase) }
    }

    @Transactional(readOnly = true)
    override fun listLetters(
        ownerId: Long,
        roomId: Long,
    ): List<MessageResponse> {
        roomService.requireOwned(ownerId, roomId)
        val key = userService.get(ownerId)?.encKey
        return repository
            .findLetterCandidates(roomId)
            .filter { MessageCrypto.isLetter(MessageCrypto.decrypt(it.content, key)) }
            .map { it.toResponse(publicBase) }
    }

    @Transactional
    override fun setPin(
        ownerId: Long,
        roomId: Long,
        messageId: Long,
        pinned: Boolean,
    ): MessageResponse {
        roomService.requireOwned(ownerId, roomId)
        val message = find(roomId, messageId)
        message.pinned = pinned
        return repository.save(message).toResponse(publicBase)
    }

    private fun find(
        roomId: Long,
        messageId: Long,
    ): Message = repository.findByIdAndRoomId(messageId, roomId) ?: notFound("message not found")
}
