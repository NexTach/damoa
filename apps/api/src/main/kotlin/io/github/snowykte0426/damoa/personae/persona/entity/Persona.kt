package io.github.snowykte0426.damoa.personae.persona.entity

import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.Instant

@Entity
@Table(name = "personas")
open class Persona(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    open var id: Long = 0,
    open var ownerId: Long = 0,
    open var name: String = "",
    open var color: String = "#7c8cff",
    open var avatarUrl: String? = null,
    open var bio: String? = null,
    open var createdAt: Instant = Instant.now(),
)
