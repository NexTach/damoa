package io.github.snowykte0426.damoa.personae.persona.controller

import io.github.snowykte0426.damoa.common.currentUserId
import io.github.snowykte0426.damoa.personae.persona.dto.request.PersonaRequest
import io.github.snowykte0426.damoa.personae.persona.dto.response.PersonaResponse
import io.github.snowykte0426.damoa.personae.persona.service.PersonaService
import io.github.snowykte0426.damoa.personae.realtime.dto.response.RealtimeEvent
import io.github.snowykte0426.damoa.personae.realtime.service.RealtimeService
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/personae/personas")
class PersonaController(
    private val service: PersonaService,
    private val realtime: RealtimeService,
) {
    @GetMapping
    fun list(): List<PersonaResponse> = service.list(currentUserId())

    @PostMapping
    fun create(
        @RequestBody req: PersonaRequest,
        @RequestHeader(value = "X-Client-Id", required = false) clientId: String?,
    ): PersonaResponse {
        val uid = currentUserId()
        val res = service.create(uid, req)
        realtime.publish(uid, RealtimeEvent("persona", null, clientId))
        return res
    }

    @PatchMapping("/{id}")
    fun update(
        @PathVariable id: Long,
        @RequestBody req: PersonaRequest,
        @RequestHeader(value = "X-Client-Id", required = false) clientId: String?,
    ): PersonaResponse {
        val uid = currentUserId()
        val res = service.update(uid, id, req)
        realtime.publish(uid, RealtimeEvent("persona", null, clientId))
        return res
    }

    @DeleteMapping("/{id}")
    fun delete(
        @PathVariable id: Long,
        @RequestHeader(value = "X-Client-Id", required = false) clientId: String?,
    ) {
        val uid = currentUserId()
        service.delete(uid, id)
        realtime.publish(uid, RealtimeEvent("persona", null, clientId))
    }
}
