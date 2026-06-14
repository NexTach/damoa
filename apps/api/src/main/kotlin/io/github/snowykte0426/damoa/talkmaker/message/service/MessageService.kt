package io.github.snowykte0426.damoa.talkmaker.message.service

import io.github.snowykte0426.damoa.talkmaker.message.dto.request.MessageRequest
import io.github.snowykte0426.damoa.talkmaker.message.dto.response.MessagePage
import io.github.snowykte0426.damoa.talkmaker.message.dto.response.MessageResponse
import io.github.snowykte0426.damoa.talkmaker.message.dto.response.SearchResult
import java.time.Instant

interface MessageService {
    /**
     * Keyset page of messages (ascending). Newest page when [before] and [at]
     * are null; [at] loads the page ending at a specific message (for jumps).
     */
    fun list(
        ownerId: Long,
        roomId: Long,
        limit: Int,
        before: String?,
        at: Long?,
    ): MessagePage

    fun search(
        ownerId: Long,
        roomId: Long,
        q: String?,
        personaId: Long?,
        after: Instant?,
        before: Instant?,
        cursor: String?,
    ): SearchResult

    fun create(
        ownerId: Long,
        roomId: Long,
        req: MessageRequest,
    ): MessageResponse

    fun update(
        ownerId: Long,
        roomId: Long,
        messageId: Long,
        req: MessageRequest,
    ): MessageResponse

    fun delete(
        ownerId: Long,
        roomId: Long,
        messageId: Long,
    )
}
