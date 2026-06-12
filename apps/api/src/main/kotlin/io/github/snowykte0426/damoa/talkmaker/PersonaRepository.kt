package io.github.snowykte0426.damoa.talkmaker

import org.springframework.data.jpa.repository.JpaRepository

interface PersonaRepository : JpaRepository<Persona, Long> {
    fun findByOwnerIdOrderByCreatedAtAsc(ownerId: Long): List<Persona>

    fun findByIdAndOwnerId(id: Long, ownerId: Long): Persona?
}
