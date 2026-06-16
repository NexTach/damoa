package io.github.snowykte0426.damoa.user.service.impl

import io.github.snowykte0426.damoa.common.notFound
import io.github.snowykte0426.damoa.user.entity.User
import io.github.snowykte0426.damoa.user.repository.UserRepository
import io.github.snowykte0426.damoa.user.service.UserService
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.security.SecureRandom
import java.time.Instant
import java.util.Base64

@Service
class UserServiceImpl(
    private val repository: UserRepository,
) : UserService {
    @Transactional
    override fun upsert(
        id: Long,
        email: String,
        name: String,
    ): User {
        val user = repository.findById(id).orElseGet { User(id = id, createdAt = Instant.now()) }
        user.email = email
        user.name = name
        return repository.save(user)
    }

    @Transactional(readOnly = true)
    override fun get(id: Long): User? = repository.findById(id).orElse(null)

    @Transactional
    override fun encryptionKey(id: Long): String {
        val user = repository.findById(id).orElseGet { notFound("user not found") }
        user.encKey?.let { return it }
        val bytes = ByteArray(32).also { SecureRandom().nextBytes(it) }
        val key = Base64.getEncoder().encodeToString(bytes)
        user.encKey = key
        repository.save(user)
        return key
    }
}
