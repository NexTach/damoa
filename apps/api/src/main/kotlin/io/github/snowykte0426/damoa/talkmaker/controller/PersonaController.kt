package io.github.snowykte0426.damoa.talkmaker.controller

import io.github.snowykte0426.damoa.common.currentUserId
import io.github.snowykte0426.damoa.talkmaker.dto.request.PersonaRequest
import io.github.snowykte0426.damoa.talkmaker.dto.response.PersonaResponse
import io.github.snowykte0426.damoa.talkmaker.service.PersonaService
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/talkmaker/personas")
class PersonaController(private val service: PersonaService) {
    @GetMapping
    fun list(): List<PersonaResponse> = service.list(currentUserId())

    @PostMapping
    fun create(@RequestBody req: PersonaRequest): PersonaResponse =
        service.create(currentUserId(), req)

    @PatchMapping("/{id}")
    fun update(@PathVariable id: Long, @RequestBody req: PersonaRequest): PersonaResponse =
        service.update(currentUserId(), id, req)

    @DeleteMapping("/{id}")
    fun delete(@PathVariable id: Long) = service.delete(currentUserId(), id)
}
