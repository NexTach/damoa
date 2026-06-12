package io.github.snowykte0426.damoa.talkmaker

import io.github.snowykte0426.damoa.storage.StorageService
import java.util.concurrent.TimeUnit
import org.springframework.core.io.ByteArrayResource
import org.springframework.http.CacheControl
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.server.ResponseStatusException

// Public attachment serving (proxies the S3-compatible storage). Keys are random,
// so this is unguessable; a missing/expired object returns 410 Gone.
@RestController
@RequestMapping("/api/files")
class FileController(private val storage: StorageService) {
    @GetMapping("/{key}")
    fun serve(@PathVariable key: String): ResponseEntity<ByteArrayResource> {
        val (bytes, type) = storage.download(key)
            ?: throw ResponseStatusException(HttpStatus.GONE, "expired file")
        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(type))
            .cacheControl(CacheControl.maxAge(7, TimeUnit.DAYS))
            .body(ByteArrayResource(bytes))
    }
}
