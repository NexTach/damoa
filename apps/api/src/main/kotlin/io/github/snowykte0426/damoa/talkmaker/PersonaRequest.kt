package io.github.snowykte0426.damoa.talkmaker

data class PersonaRequest(
    val name: String,
    val color: String? = null,
    val avatarUrl: String? = null,
    val bio: String? = null,
)
