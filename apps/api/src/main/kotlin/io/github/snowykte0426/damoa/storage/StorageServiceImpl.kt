package io.github.snowykte0426.damoa.storage

import io.github.snowykte0426.damoa.config.AppProperties
import java.util.UUID
import org.springframework.stereotype.Service
import software.amazon.awssdk.core.sync.RequestBody
import software.amazon.awssdk.services.s3.S3Client
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest
import software.amazon.awssdk.services.s3.model.GetObjectRequest
import software.amazon.awssdk.services.s3.model.NoSuchKeyException
import software.amazon.awssdk.services.s3.model.PutObjectRequest

@Service
class StorageServiceImpl(
    private val client: S3Client,
    props: AppProperties,
) : StorageService {
    private val bucket = props.s3.bucket

    override fun upload(bytes: ByteArray, contentType: String, extension: String): String {
        val key = if (extension.isBlank()) UUID.randomUUID().toString() else "${UUID.randomUUID()}.$extension"
        client.putObject(
            PutObjectRequest.builder().bucket(bucket).key(key).contentType(contentType).build(),
            RequestBody.fromBytes(bytes),
        )
        return key
    }

    override fun download(key: String): Pair<ByteArray, String>? = try {
        val resp = client.getObjectAsBytes(GetObjectRequest.builder().bucket(bucket).key(key).build())
        resp.asByteArray() to (resp.response().contentType() ?: "application/octet-stream")
    } catch (_: NoSuchKeyException) {
        null
    }

    override fun delete(key: String) {
        runCatching {
            client.deleteObject(DeleteObjectRequest.builder().bucket(bucket).key(key).build())
        }
    }
}
