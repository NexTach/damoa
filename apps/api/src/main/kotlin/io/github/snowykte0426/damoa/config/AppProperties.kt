package io.github.snowykte0426.damoa.config

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties(prefix = "app")
data class AppProperties(
    val jwtSecret: String = "",
    val frontendUrl: String = "",
    val attachmentTtlDays: Long = 30,
    val datagsm: DataGsmProperties = DataGsmProperties(),
    val s3: S3Properties = S3Properties(),
)
