package io.github.snowykte0426.damoa.personae.message.service

import io.github.snowykte0426.damoa.personae.message.dto.request.MessageRequest
import io.github.snowykte0426.damoa.personae.message.dto.response.MessagePage
import io.github.snowykte0426.damoa.personae.message.dto.response.MessageResponse
import io.github.snowykte0426.damoa.personae.message.dto.response.SearchResult
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

    /** Highlighted (pinned) messages of a room — never auto-expire. */
    fun listPinned(
        ownerId: Long,
        roomId: Long,
    ): List<MessageResponse>

    /** Long "letter" messages of a room, newest first (decrypted server-side). */
    fun listLetters(
        ownerId: Long,
        roomId: Long,
    ): List<MessageResponse>

    /**
     * Builds an OpenAI chat fine-tuning JSON ({"messages":[...]}) of the latest
     * [limit] messages, decrypted server-side. [assistantId] maps to "assistant".
     */
    fun exportTraining(
        ownerId: Long,
        roomId: Long,
        assistantId: Long,
        limit: Int,
    ): Map<String, Any?>

    /** Toggles a message's highlight (pin) state. */
    fun setPin(
        ownerId: Long,
        roomId: Long,
        messageId: Long,
        pinned: Boolean,
    ): MessageResponse

    /** Shifts the given messages' times by [deltaMs] (relative gaps preserved). */
    fun shiftTimes(
        ownerId: Long,
        roomId: Long,
        ids: List<Long>,
        deltaMs: Long,
    )
}
