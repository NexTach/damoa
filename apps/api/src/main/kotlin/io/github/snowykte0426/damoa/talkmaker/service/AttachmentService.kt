package io.github.snowykte0426.damoa.talkmaker.service

import io.github.snowykte0426.damoa.talkmaker.dto.response.UploadResponse

interface AttachmentService {
    fun upload(bytes: ByteArray, contentType: String, filename: String?): UploadResponse

    /** Deletes attachments older than the TTL and marks their messages as expired. */
    fun purgeExpired(): Int
}
