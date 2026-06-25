package io.github.snowykte0426.damoa.personae.message.dto.request

data class GenerateHiddenRequest(
    val date: String = "", // ISO local date (yyyy-MM-dd), interpreted in KST
    val count: Int = 1,
)
