package io.github.snowykte0426.damoa.talkmaker

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.Instant

@Entity
@Table(name = "messages")
open class Message(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    open var id: Long = 0,
    open var roomId: Long = 0,
    open var personaId: Long = 0, // the persona that "sent" this message
    @Column(columnDefinition = "TEXT")
    open var content: String = "",
    open var attachmentKey: String? = null, // storage object key, null once expired
    open var attachmentType: String? = null, // attachment mime type
    open var attachmentExpired: Boolean = false, // true after the file was auto-purged
    open var sentAt: Instant = Instant.now(), // editable display time, used for ordering
    open var createdAt: Instant = Instant.now(),
)
