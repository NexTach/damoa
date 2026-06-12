package io.github.snowykte0426.damoa.common

import org.springframework.http.HttpStatus
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.web.server.ResponseStatusException

/** Current authenticated user id (the DataGSM user id), or 401 if absent. */
fun currentUserId(): Long {
    val auth = SecurityContextHolder.getContext().authentication
        ?: throw ResponseStatusException(HttpStatus.UNAUTHORIZED)
    return auth.name?.toLongOrNull()
        ?: throw ResponseStatusException(HttpStatus.UNAUTHORIZED)
}

fun notFound(message: String): Nothing =
    throw ResponseStatusException(HttpStatus.NOT_FOUND, message)
