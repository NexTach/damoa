package io.github.snowykte0426.damoa.common

import org.springframework.http.HttpStatus
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.web.server.ResponseStatusException

fun currentUserId(): Long {
    val auth = SecurityContextHolder.getContext().authentication
        ?: throw ResponseStatusException(HttpStatus.UNAUTHORIZED, "인증이 필요합니다")
    return auth.name?.toLongOrNull()
        ?: throw ResponseStatusException(HttpStatus.UNAUTHORIZED, "인증이 필요합니다")
}

fun notFound(message: String = "찾을 수 없습니다"): Nothing =
    throw ResponseStatusException(HttpStatus.NOT_FOUND, message)
