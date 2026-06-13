package io.github.snowykte0426.damoa.talkmaker.service.impl

import io.github.snowykte0426.damoa.config.AppProperties
import io.github.snowykte0426.damoa.storage.StorageService
import io.github.snowykte0426.damoa.talkmaker.dto.response.UploadResponse
import io.github.snowykte0426.damoa.talkmaker.repository.MessageRepository
import io.github.snowykte0426.damoa.talkmaker.service.AttachmentService
import java.time.Instant
import java.time.temporal.ChronoUnit
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class AttachmentServiceImpl(
    private val storage: StorageService,
    private val messageRepository: MessageRepository,
    props: AppProperties,
) : AttachmentService {
    private val ttlDays = props.attachmentTtlDays

    override fun upload(bytes: ByteArray, contentType: String, filename: String?): UploadResponse {
        val ext = filename?.substringAfterLast('.', "")?.lowercase()?.take(8).orEmpty()
        val key = storage.upload(bytes, contentType, ext)
        return UploadResponse(key, contentType, filename?.takeIf { it.isNotBlank() })
    }

    @Transactional
    override fun purgeExpired(): Int {
        val cutoff = Instant.now().minus(ttlDays, ChronoUnit.DAYS)
        val stale = messageRepository
            .findByAttachmentKeyIsNotNullAndAttachmentExpiredFalseAndCreatedAtBefore(cutoff)
        stale.forEach { message ->
            message.attachmentKey?.let { storage.delete(it) }
            message.attachmentKey = null
            message.attachmentExpired = true
        }
        messageRepository.saveAll(stale)
        return stale.size
    }
}
