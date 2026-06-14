package io.github.snowykte0426.damoa.talkmaker.attachment.controller

import io.github.snowykte0426.damoa.talkmaker.attachment.dto.response.UploadResponse
import io.github.snowykte0426.damoa.talkmaker.attachment.service.AttachmentService
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.multipart.MultipartFile
import org.springframework.web.server.ResponseStatusException

@RestController
@RequestMapping("/api/talkmaker/attachments")
class AttachmentController(
    private val service: AttachmentService,
) {
    @PostMapping
    fun upload(
        @RequestParam("file") file: MultipartFile,
    ): UploadResponse {
        if (file.isEmpty) throw ResponseStatusException(HttpStatus.BAD_REQUEST, "empty file")
        val type = file.contentType ?: "application/octet-stream"
        return service.upload(file.bytes, type, file.originalFilename)
    }
}
