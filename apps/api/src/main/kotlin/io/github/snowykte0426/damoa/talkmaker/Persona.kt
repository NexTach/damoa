package io.github.snowykte0426.damoa.talkmaker

import io.github.snowykte0426.damoa.common.currentUserId
import io.github.snowykte0426.damoa.common.notFound
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.Instant
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@Entity
@Table(name = "personas")
open class Persona(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    open var id: Long = 0,
    open var ownerId: Long = 0,
    open var name: String = "",
    open var color: String = "#7c8cff",
    open var avatarUrl: String? = null,
    open var bio: String? = null,
    open var createdAt: Instant = Instant.now(),
)

interface PersonaRepository : JpaRepository<Persona, Long> {
    fun findByOwnerIdOrderByCreatedAtAsc(ownerId: Long): List<Persona>
    fun findByIdAndOwnerId(id: Long, ownerId: Long): Persona?
}

data class PersonaRequest(
    val name: String,
    val color: String? = null,
    val avatarUrl: String? = null,
    val bio: String? = null,
)

data class PersonaResponse(
    val id: Long,
    val name: String,
    val color: String,
    val avatarUrl: String?,
    val bio: String?,
)

fun Persona.toResponse() = PersonaResponse(id, name, color, avatarUrl, bio)

@Service
open class PersonaService(private val repository: PersonaRepository) {
    @Transactional(readOnly = true)
    open fun list(ownerId: Long): List<PersonaResponse> =
        repository.findByOwnerIdOrderByCreatedAtAsc(ownerId).map { it.toResponse() }

    @Transactional
    open fun create(ownerId: Long, req: PersonaRequest): PersonaResponse {
        val persona = Persona(
            ownerId = ownerId,
            name = req.name.ifBlank { "이름없음" },
            color = req.color ?: "#7c8cff",
            avatarUrl = req.avatarUrl,
            bio = req.bio,
        )
        return repository.save(persona).toResponse()
    }

    @Transactional
    open fun update(ownerId: Long, id: Long, req: PersonaRequest): PersonaResponse {
        val persona = repository.findByIdAndOwnerId(id, ownerId) ?: notFound("페르소나 없음")
        persona.name = req.name.ifBlank { persona.name }
        req.color?.let { persona.color = it }
        persona.avatarUrl = req.avatarUrl
        persona.bio = req.bio
        return repository.save(persona).toResponse()
    }

    @Transactional
    open fun delete(ownerId: Long, id: Long) {
        val persona = repository.findByIdAndOwnerId(id, ownerId) ?: notFound("페르소나 없음")
        repository.delete(persona)
    }
}

@RestController
@RequestMapping("/api/talkmaker/personas")
class PersonaController(private val service: PersonaService) {
    @GetMapping
    fun list(): List<PersonaResponse> = service.list(currentUserId())

    @PostMapping
    fun create(@RequestBody req: PersonaRequest): PersonaResponse = service.create(currentUserId(), req)

    @PatchMapping("/{id}")
    fun update(@PathVariable id: Long, @RequestBody req: PersonaRequest): PersonaResponse =
        service.update(currentUserId(), id, req)

    @DeleteMapping("/{id}")
    fun delete(@PathVariable id: Long) = service.delete(currentUserId(), id)
}
