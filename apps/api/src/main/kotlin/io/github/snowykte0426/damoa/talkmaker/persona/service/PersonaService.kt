package io.github.snowykte0426.damoa.talkmaker.persona.service

import io.github.snowykte0426.damoa.talkmaker.persona.dto.request.PersonaRequest
import io.github.snowykte0426.damoa.talkmaker.persona.dto.response.PersonaResponse

interface PersonaService {
    fun list(ownerId: Long): List<PersonaResponse>

    fun create(ownerId: Long, req: PersonaRequest): PersonaResponse

    fun update(ownerId: Long, id: Long, req: PersonaRequest): PersonaResponse

    fun delete(ownerId: Long, id: Long)
}
