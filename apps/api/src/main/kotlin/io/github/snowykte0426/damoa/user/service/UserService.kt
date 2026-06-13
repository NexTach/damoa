package io.github.snowykte0426.damoa.user.service

import io.github.snowykte0426.damoa.user.entity.User

interface UserService {
    fun upsert(id: Long, email: String, name: String): User

    fun get(id: Long): User?
}
