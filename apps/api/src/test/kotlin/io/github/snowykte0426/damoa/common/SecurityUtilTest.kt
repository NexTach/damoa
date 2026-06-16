package io.github.snowykte0426.damoa.common

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test
import org.springframework.http.HttpStatus
import org.springframework.web.server.ResponseStatusException

class SecurityUtilTest {
    @Test
    fun `notFound throws a 404 ResponseStatusException carrying the message`() {
        val ex = assertThrows(ResponseStatusException::class.java) { notFound("room not found") }
        assertEquals(HttpStatus.NOT_FOUND, ex.statusCode)
        assertEquals("room not found", ex.reason)
    }
}
