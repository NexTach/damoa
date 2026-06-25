package io.github.snowykte0426.damoa.personae.message.entity

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
    open var attachmentName: String? = null, // original file name (for non-media files)
    open var attachmentExpired: Boolean = false, // true after the file was auto-purged
    open var pinned: Boolean = false, // highlighted: excluded from attachment auto-expiry
    open var hidden: Boolean = false, // hidden: never shown in chat (normal or capture), counted only in stats
    open var replyToId: Long? = null, // message this one replies to
    open var replyToName: String? = null, // snapshot: replied persona name
    @Column(columnDefinition = "TEXT")
    open var replyToText: String? = null, // snapshot: replied message preview
    open var sentAt: Instant = Instant.now(), // editable display time, used for ordering
    open var createdAt: Instant = Instant.now(),
)
