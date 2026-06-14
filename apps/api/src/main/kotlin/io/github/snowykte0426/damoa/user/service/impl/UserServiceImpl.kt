package io.github.snowykte0426.damoa.user.service.impl

import io.github.snowykte0426.damoa.user.entity.User
import io.github.snowykte0426.damoa.user.repository.UserRepository
import io.github.snowykte0426.damoa.user.service.UserService
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant

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
}
