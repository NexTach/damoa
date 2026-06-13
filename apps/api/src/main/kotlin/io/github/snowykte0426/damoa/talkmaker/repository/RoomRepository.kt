package io.github.snowykte0426.damoa.talkmaker.repository

import io.github.snowykte0426.damoa.talkmaker.entity.Room
import org.springframework.data.jpa.repository.JpaRepository

interface RoomRepository : JpaRepository<Room, Long> {
    fun findByOwnerIdOrderByUpdatedAtDesc(ownerId: Long): List<Room>

    fun findByIdAndOwnerId(id: Long, ownerId: Long): Room?
}
