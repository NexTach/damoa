package io.github.snowykte0426.damoa.talkmaker

interface PersonaService {
    fun list(ownerId: Long): List<PersonaResponse>

    fun create(ownerId: Long, req: PersonaRequest): PersonaResponse

    fun update(ownerId: Long, id: Long, req: PersonaRequest): PersonaResponse

    fun delete(ownerId: Long, id: Long)
}
