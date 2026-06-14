package io.github.snowykte0426.damoa.personae.message.dto.response

data class MessagePage(
    val messages: List<MessageResponse>,
    val hasMore: Boolean,
    val nextCursor: String?,
)
