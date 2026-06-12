package io.github.snowykte0426.damoa.user

import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.Instant
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Entity
@Table(name = "users")
open class User(
    @Id
    open var id: Long = 0, // DataGSM 사용자 id (assigned)
    open var email: String = "",
    open var name: String = "",
    open var createdAt: Instant = Instant.now(),
)

interface UserRepository : JpaRepository<User, Long>

@Service
open class UserService(private val repository: UserRepository) {
    @Transactional
    open fun upsert(id: Long, email: String, name: String): User {
        val user = repository.findById(id).orElseGet { User(id = id, createdAt = Instant.now()) }
        user.email = email
        user.name = name
        return repository.save(user)
    }

    @Transactional(readOnly = true)
    open fun get(id: Long): User? = repository.findById(id).orElse(null)
}
