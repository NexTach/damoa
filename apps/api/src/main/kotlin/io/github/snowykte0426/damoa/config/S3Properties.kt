package io.github.snowykte0426.damoa.config

data class S3Properties(
    val endpoint: String = "http://localhost:9000",
    val region: String = "us-east-1",
    val accessKey: String = "",
    val secretKey: String = "",
    val bucket: String = "talkmaker",
    // Public base URL the browser uses to fetch attachments (proxied by this app).
    val publicBase: String = "http://localhost:8080",
)
