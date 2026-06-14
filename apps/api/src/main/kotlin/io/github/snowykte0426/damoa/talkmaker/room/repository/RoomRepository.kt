package io.github.snowykte0426.damoa.talkmaker.room.repository

import io.github.snowykte0426.damoa.talkmaker.room.entity.Room
import org.springframework.data.jpa.repository.JpaRepository

interface RoomRepository : JpaRepository<Room, Long> {
    fun findByOwnerIdOrderByUpdatedAtDesc(ownerId: Long): List<Room>

    fun findByIdAndOwnerId(
        id: Long,
        ownerId: Long,
    ): Room?
}
