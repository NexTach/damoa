package io.github.snowykte0426.damoa.config

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties(prefix = "app")
data class AppProperties(
    val jwtSecret: String = "",
    val frontendUrl: String = "",
    val attachmentTtlDays: Long = 30,
    val datagsm: DataGsmProperties = DataGsmProperties(),
    val s3: S3Properties = S3Properties(),
    val openai: OpenAiProperties = OpenAiProperties(),
)

data class OpenAiProperties(
    val apiKey: String = "",
    val model: String = "gpt-5.5",
    val baseUrl: String = "https://api.openai.com",
)
