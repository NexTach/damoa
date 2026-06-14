package io.github.snowykte0426.damoa.user.entity

import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.Instant

@Entity
@Table(name = "users")
open class User(
    @Id
    open var id: Long = 0, // DataGSM user id (assigned, not generated)
    open var email: String = "",
    open var name: String = "",
    open var encKey: String? = null, // base64 AES-256 key for client-side message encryption
    open var createdAt: Instant = Instant.now(),
)
