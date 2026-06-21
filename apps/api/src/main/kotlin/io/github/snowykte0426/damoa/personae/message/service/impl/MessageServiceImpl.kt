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
import io.github.snowykte0426.damoa.personae.persona.entity.Persona
import io.github.snowykte0426.damoa.personae.persona.repository.PersonaRepository
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
    private val personaRepository: PersonaRepository,
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

    @Transactional(readOnly = true)
    override fun exportTraining(
        ownerId: Long,
        roomId: Long,
        assistantId: Long,
        limit: Int,
    ): Map<String, Any?> {
        roomService.requireOwned(ownerId, roomId)
        val key = userService.get(ownerId)?.encKey
        // Latest [limit] messages, oldest → newest.
        val rows =
            repository
                .findByRoomIdOrderBySentAtDescIdDesc(roomId, PageRequest.of(0, limit))
                .reversed()

        // Disambiguate duplicate persona names (mirrors the client export).
        val byId = personaRepository.findByOwnerIdOrderByCreatedAtAsc(ownerId).associateBy { it.id }
        val appearingIds = (rows.map { it.personaId } + assistantId).toSet()
        val appearing = byId.values.filter { it.id in appearingIds }
        val totals = appearing.groupingBy { displayBase(it) }.eachCount()
        val seen = mutableMapOf<String, Int>()
        val disp = mutableMapOf<Long, String>()
        for (p in appearing) {
            val base = displayBase(p)
            val n = (seen[base] ?: 0) + 1
            seen[base] = n
            disp[p.id] = if ((totals[base] ?: 0) > 1) "$base ($n)" else base
        }

        fun nameOf(id: Long): String = disp[id] ?: byId[id]?.let { displayBase(it) } ?: "이름없음"

        val assistantName = nameOf(assistantId)
        val bios =
            appearing
                .filter { !it.bio.isNullOrBlank() }
                .joinToString("\n") { "- ${nameOf(it.id)}: ${it.bio}" }
        val others =
            appearing
                .filter { it.id != assistantId }
                .joinToString(", ") { "'${nameOf(it.id)}'" }
                .ifEmpty { "상대" }

        val out = mutableListOf<Map<String, Any?>>()
        out +=
            linkedMapOf(
                "role" to "system",
                "content" to
                    "다음은 '$assistantName'와(과) 다른 참여자($others)의 대화입니다." +
                    (if (bios.isNotEmpty()) "\n$bios" else "") +
                    "\n\n'$assistantName'의 말투와 성격으로 응답하세요.",
            )
        for (m in rows) {
            val plain = MessageCrypto.decrypt(m.content, key).trim()
            val mk = attachmentMarker(m)
            val content = listOf(plain, mk).filter { it.isNotEmpty() }.joinToString(" ")
            val msg =
                linkedMapOf<String, Any?>(
                    "role" to if (m.personaId == assistantId) "assistant" else "user",
                    "content" to content,
                    "speaker" to nameOf(m.personaId),
                    "at" to m.sentAt.toString(),
                )
            if (m.replyToId != null) {
                msg["reply_to"] =
                    linkedMapOf(
                        "speaker" to m.replyToName,
                        "text" to MessageCrypto.decrypt(m.replyToText, key),
                    )
            }
            out += msg
        }
        return linkedMapOf("messages" to out)
    }

    private fun displayBase(p: Persona): String = p.name.trim().ifEmpty { "이름없음" }

    private fun attachmentMarker(m: Message): String =
        when {
            m.attachmentExpired -> "[만료된 파일]"
            m.attachmentType?.startsWith("image/") == true -> "[사진]"
            m.attachmentType?.startsWith("video/") == true -> "[동영상]"
            m.attachmentType?.startsWith("audio/") == true -> "[오디오]"
            m.attachmentKey != null -> "[파일${m.attachmentName?.let { ": $it" } ?: ""}]"
            else -> ""
        }

    @Transactional
    override fun shiftTimes(
        ownerId: Long,
        roomId: Long,
        ids: List<Long>,
        deltaMs: Long,
    ) {
        roomService.requireOwned(ownerId, roomId)
        if (ids.isEmpty() || deltaMs == 0L) return
        val msgs = repository.findByRoomIdAndIdIn(roomId, ids)
        msgs.forEach { it.sentAt = it.sentAt.plusMillis(deltaMs) }
        repository.saveAll(msgs)
        roomService.touch(roomId)
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
