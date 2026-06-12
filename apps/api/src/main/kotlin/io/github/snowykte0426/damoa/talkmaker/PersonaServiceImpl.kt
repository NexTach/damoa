package io.github.snowykte0426.damoa.talkmaker

import io.github.snowykte0426.damoa.common.notFound
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class PersonaServiceImpl(private val repository: PersonaRepository) : PersonaService {
    @Transactional(readOnly = true)
    override fun list(ownerId: Long): List<PersonaResponse> =
        repository.findByOwnerIdOrderByCreatedAtAsc(ownerId).map { it.toResponse() }

    @Transactional
    override fun create(ownerId: Long, req: PersonaRequest): PersonaResponse {
        val persona = Persona(
            ownerId = ownerId,
            name = req.name.ifBlank { "Unnamed" },
            color = req.color ?: "#7c8cff",
            avatarUrl = req.avatarUrl,
            bio = req.bio,
        )
        return repository.save(persona).toResponse()
    }

    @Transactional
    override fun update(ownerId: Long, id: Long, req: PersonaRequest): PersonaResponse {
        val persona = repository.findByIdAndOwnerId(id, ownerId) ?: notFound("persona not found")
        persona.name = req.name.ifBlank { persona.name }
        req.color?.let { persona.color = it }
        persona.avatarUrl = req.avatarUrl
        persona.bio = req.bio
        return repository.save(persona).toResponse()
    }

    @Transactional
    override fun delete(ownerId: Long, id: Long) {
        val persona = repository.findByIdAndOwnerId(id, ownerId) ?: notFound("persona not found")
        repository.delete(persona)
    }
}
