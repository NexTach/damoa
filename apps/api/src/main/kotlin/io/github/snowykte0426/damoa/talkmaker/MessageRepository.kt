package io.github.snowykte0426.damoa.talkmaker

import org.springframework.data.jpa.repository.JpaRepository

interface MessageRepository : JpaRepository<Message, Long> {
    fun findByRoomIdOrderBySentAtAscIdAsc(roomId: Long): List<Message>

    fun findByIdAndRoomId(id: Long, roomId: Long): Message?

    fun deleteByRoomId(roomId: Long)
}
