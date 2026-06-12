package io.github.snowykte0426.damoa.user

interface UserService {
    fun upsert(id: Long, email: String, name: String): User

    fun get(id: Long): User?
}
