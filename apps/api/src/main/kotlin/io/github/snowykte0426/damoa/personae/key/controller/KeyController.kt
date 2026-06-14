package io.github.snowykte0426.damoa.personae.key.controller

import io.github.snowykte0426.damoa.common.currentUserId
import io.github.snowykte0426.damoa.personae.key.dto.response.KeyResponse
import io.github.snowykte0426.damoa.user.service.UserService
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/personae/key")
class KeyController(
    private val userService: UserService,
) {
    @GetMapping
    fun key(): KeyResponse = KeyResponse(userService.encryptionKey(currentUserId()))
}
