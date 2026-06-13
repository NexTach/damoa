package io.github.snowykte0426.damoa.talkmaker.entity

import jakarta.persistence.CollectionTable
import jakarta.persistence.Column
import jakarta.persistence.ElementCollection
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.Table
import java.time.Instant

@Entity
@Table(name = "rooms")
open class Room(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    open var id: Long = 0,
    open var ownerId: Long = 0,
    open var title: String = "",
    // The persona whose messages are aligned as "me" (right side).
    open var selfPersonaId: Long? = null,
    @ElementCollection
    @CollectionTable(name = "room_personas", joinColumns = [JoinColumn(name = "room_id")])
    @Column(name = "persona_id")
    open var participantPersonaIds: MutableSet<Long> = mutableSetOf(),
    open var createdAt: Instant = Instant.now(),
    open var updatedAt: Instant = Instant.now(),
)
