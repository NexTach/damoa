package io.github.snowykte0426.damoa.personae.message.repository

import io.github.snowykte0426.damoa.personae.message.entity.Message
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.Instant

interface MessageRepository : JpaRepository<Message, Long> {
    fun findByIdAndRoomId(
        id: Long,
        roomId: Long,
    ): Message?

    fun deleteByRoomId(roomId: Long)

    fun countByRoomId(roomId: Long): Long

    fun findByAttachmentKeyIsNotNullAndAttachmentExpiredFalseAndCreatedAtBefore(cutoff: Instant): List<Message>

    // Newest page (no cursor). Caller reverses to ascending for display.
    fun findByRoomIdOrderBySentAtDescIdDesc(
        roomId: Long,
        pageable: Pageable,
    ): List<Message>

    // Keyset pagination: messages strictly older than the (sentAt, id) cursor.
    @Query(
        """
        select m from Message m
        where m.roomId = :roomId
          and (m.sentAt < :ts or (m.sentAt = :ts and m.id < :id))
        order by m.sentAt desc, m.id desc
        """,
    )
    fun findOlder(
        @Param("roomId") roomId: Long,
        @Param("ts") ts: Instant,
        @Param("id") id: Long,
        pageable: Pageable,
    ): List<Message>

    // Page ending at (and including) the target — used to jump to a message.
    @Query(
        """
        select m from Message m
        where m.roomId = :roomId
          and (m.sentAt < :ts or (m.sentAt = :ts and m.id <= :id))
        order by m.sentAt desc, m.id desc
        """,
    )
    fun findOlderOrEqual(
        @Param("roomId") roomId: Long,
        @Param("ts") ts: Instant,
        @Param("id") id: Long,
        pageable: Pageable,
    ): List<Message>

    @Query(
        """
        select m from Message m
        where m.roomId = :roomId
          and (:q is null or lower(m.content) like lower(concat('%', :q, '%')))
          and (:personaId is null or m.personaId = :personaId)
          and (:after is null or m.sentAt >= :after)
          and (:before is null or m.sentAt <= :before)
          and (:cursorTs is null or m.sentAt < :cursorTs
               or (m.sentAt = :cursorTs and m.id < :cursorId))
        order by m.sentAt desc, m.id desc
        """,
    )
    fun search(
        @Param("roomId") roomId: Long,
        @Param("q") q: String?,
        @Param("personaId") personaId: Long?,
        @Param("after") after: Instant?,
        @Param("before") before: Instant?,
        @Param("cursorTs") cursorTs: Instant?,
        @Param("cursorId") cursorId: Long?,
        pageable: Pageable,
    ): List<Message>

    @Query(
        """
        select count(m) from Message m
        where m.roomId = :roomId
          and (:q is null or lower(m.content) like lower(concat('%', :q, '%')))
          and (:personaId is null or m.personaId = :personaId)
          and (:after is null or m.sentAt >= :after)
          and (:before is null or m.sentAt <= :before)
        """,
    )
    fun searchCount(
        @Param("roomId") roomId: Long,
        @Param("q") q: String?,
        @Param("personaId") personaId: Long?,
        @Param("after") after: Instant?,
        @Param("before") before: Instant?,
    ): Long

    @Query(
        "select m.personaId as personaId, count(m) as cnt from Message m " +
            "where m.roomId = :roomId group by m.personaId",
    )
    fun countByPersona(
        @Param("roomId") roomId: Long,
    ): List<PersonaCountRow>

    @Query("select m.sentAt from Message m where m.roomId = :roomId")
    fun sentAts(
        @Param("roomId") roomId: Long,
    ): List<Instant>
}

interface PersonaCountRow {
    val personaId: Long
    val cnt: Long
}
