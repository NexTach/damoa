package io.github.snowykte0426.damoa.talkmaker

import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component

@Component
class AttachmentCleanupScheduler(private val service: AttachmentService) {
    private val log = LoggerFactory.getLogger(javaClass)

    // Daily at 04:00: purge attachments older than the configured TTL.
    @Scheduled(cron = "0 0 4 * * *")
    fun purge() {
        val count = service.purgeExpired()
        if (count > 0) log.info("purged {} expired attachments", count)
    }
}
