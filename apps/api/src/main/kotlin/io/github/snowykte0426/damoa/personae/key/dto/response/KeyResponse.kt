package io.github.snowykte0426.damoa.personae.key.dto.response

data class KeyResponse(
    val key: String, // base64 AES-256 key for client-side message encryption
)
