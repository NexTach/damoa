package io.github.snowykte0426.damoa.talkmaker.message.repository

import io.github.snowykte0426.damoa.talkmaker.message.entity.Message
import java.time.Instant
import org.springframework.data.jpa.repository.JpaRepository

interface MessageRepository : JpaRepository<Message, Long> {
    fun findByRoomIdOrderBySentAtAscIdAsc(roomId: Long): List<Message>

    fun findByIdAndRoomId(id: Long, roomId: Long): Message?

    fun deleteByRoomId(roomId: Long)

    fun findByAttachmentKeyIsNotNullAndAttachmentExpiredFalseAndCreatedAtBefore(
        cutoff: Instant,
    ): List<Message>
}
