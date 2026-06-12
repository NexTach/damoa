package io.github.snowykte0426.damoa.config

data class DataGsmProperties(
    val authBase: String = "https://oauth.authorization.datagsm.kr",
    val resourceBase: String = "https://oauth.resource.datagsm.kr",
    val clientId: String = "",
    val clientSecret: String = "",
    val redirectUri: String = "",
    // Blank scope means the scope parameter is omitted from the authorize request.
    val scope: String = "",
)
