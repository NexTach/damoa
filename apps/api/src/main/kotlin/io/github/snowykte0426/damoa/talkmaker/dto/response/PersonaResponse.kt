package io.github.snowykte0426.damoa.talkmaker.dto.response

import io.github.snowykte0426.damoa.talkmaker.entity.Persona

data class PersonaResponse(
    val id: Long,
    val name: String,
    val color: String,
    val avatarUrl: String?,
    val bio: String?,
)

fun Persona.toResponse() = PersonaResponse(id, name, color, avatarUrl, bio)
