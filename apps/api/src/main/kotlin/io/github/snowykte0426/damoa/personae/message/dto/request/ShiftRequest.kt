package io.github.snowykte0426.damoa.personae.message.dto.request

data class ShiftRequest(
    val ids: List<Long> = emptyList(),
    val deltaMs: Long = 0,
)
