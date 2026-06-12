package io.github.snowykte0426.damoa.auth

interface JwtService {
    fun issue(userId: Long, name: String, email: String): String

    /** Returns the user id when the token is valid, otherwise null. */
    fun validate(token: String): Long?
}
