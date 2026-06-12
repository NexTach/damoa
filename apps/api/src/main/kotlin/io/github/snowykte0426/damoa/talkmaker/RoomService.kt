package io.github.snowykte0426.damoa.talkmaker

interface RoomService {
    fun list(ownerId: Long): List<RoomResponse>

    fun get(ownerId: Long, id: Long): RoomResponse

    fun create(ownerId: Long, req: RoomRequest): RoomResponse

    fun update(ownerId: Long, id: Long, req: RoomRequest): RoomResponse

    fun delete(ownerId: Long, id: Long)

    /** Verifies the room exists and is owned by the user (throws 404 otherwise). */
    fun requireOwned(ownerId: Long, id: Long)

    /** Bumps the room's updatedAt timestamp. */
    fun touch(id: Long)
}
