package io.github.snowykte0426.damoa.auth.oauth.service

import io.github.snowykte0426.damoa.auth.oauth.dto.response.DataGsmUser

interface DataGsmClient {
    fun exchangeToken(code: String, codeVerifier: String): String

    fun userInfo(accessToken: String): DataGsmUser
}
