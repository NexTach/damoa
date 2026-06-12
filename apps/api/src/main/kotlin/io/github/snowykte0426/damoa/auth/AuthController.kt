package io.github.snowykte0426.damoa.auth

import io.github.snowykte0426.damoa.common.currentUserId
import io.github.snowykte0426.damoa.common.notFound
import io.github.snowykte0426.damoa.user.UserService
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/auth")
class AuthController(private val userService: UserService) {
    @GetMapping("/me")
    fun me(): MeResponse {
        val user = userService.get(currentUserId()) ?: notFound("user not found")
        return MeResponse(user.id, user.name, user.email)
    }
}
