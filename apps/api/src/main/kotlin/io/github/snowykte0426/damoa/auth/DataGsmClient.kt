package io.github.snowykte0426.damoa.auth

interface DataGsmClient {
    fun exchangeToken(code: String, codeVerifier: String): String

    fun userInfo(accessToken: String): DataGsmUser
}
