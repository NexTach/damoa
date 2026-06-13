package io.github.snowykte0426.damoa.talkmaker.message.dto.response

data class SearchResult(
    val messages: List<MessageResponse>,
    val total: Long,
    val hasMore: Boolean,
    val nextCursor: String?,
)
