package io.github.snowykte0426.damoa.talkmaker.repository

import io.github.snowykte0426.damoa.talkmaker.entity.Persona
import org.springframework.data.jpa.repository.JpaRepository

interface PersonaRepository : JpaRepository<Persona, Long> {
    fun findByOwnerIdOrderByCreatedAtAsc(ownerId: Long): List<Persona>

    fun findByIdAndOwnerId(id: Long, ownerId: Long): Persona?
}
