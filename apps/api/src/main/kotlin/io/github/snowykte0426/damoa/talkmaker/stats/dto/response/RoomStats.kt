package io.github.snowykte0426.damoa.talkmaker.stats.dto.response

data class RoomStats(
    val total: Long,
    val perPersona: List<PersonaStat>,
    val perDay: List<DayStat>,
)

data class PersonaStat(
    val personaId: Long,
    val name: String,
    val color: String,
    val count: Long,
)

data class DayStat(
    val date: String, // yyyy-MM-dd (KST)
    val count: Long,
)
