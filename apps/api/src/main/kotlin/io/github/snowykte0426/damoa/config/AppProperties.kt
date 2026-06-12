package io.github.snowykte0426.damoa.config

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties(prefix = "app")
data class AppProperties(
    val jwtSecret: String = "",
    val frontendUrl: String = "",
    val datagsm: DataGsmProperties = DataGsmProperties(),
)
