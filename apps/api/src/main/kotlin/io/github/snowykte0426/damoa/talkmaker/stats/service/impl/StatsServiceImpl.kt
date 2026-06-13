package io.github.snowykte0426.damoa.talkmaker.stats.service.impl

import io.github.snowykte0426.damoa.talkmaker.message.repository.MessageRepository
import io.github.snowykte0426.damoa.talkmaker.persona.repository.PersonaRepository
import io.github.snowykte0426.damoa.talkmaker.room.service.RoomService
import io.github.snowykte0426.damoa.talkmaker.stats.dto.response.DayStat
import io.github.snowykte0426.damoa.talkmaker.stats.dto.response.PersonaStat
import io.github.snowykte0426.damoa.talkmaker.stats.dto.response.RoomStats
import io.github.snowykte0426.damoa.talkmaker.stats.service.StatsService
import java.time.ZoneId
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class StatsServiceImpl(
    private val messageRepository: MessageRepository,
    private val personaRepository: PersonaRepository,
    private val roomService: RoomService,
) : StatsService {
    private val zone = ZoneId.of("Asia/Seoul")

    @Transactional(readOnly = true)
    override fun room(ownerId: Long, roomId: Long): RoomStats {
        roomService.requireOwned(ownerId, roomId)

        val personas = personaRepository.findByOwnerIdOrderByCreatedAtAsc(ownerId)
            .associateBy { it.id }
        val perPersona = messageRepository.countByPersona(roomId)
            .map { row ->
                val p = personas[row.personaId]
                PersonaStat(row.personaId, p?.name ?: "(삭제됨)", p?.color ?: "#7d7d76", row.cnt)
            }
            .sortedByDescending { it.count }

        // Bucket by KST calendar day (sentAt = the displayed conversation time).
        val buckets = sortedMapOf<String, Long>()
        for (ts in messageRepository.sentAts(roomId)) {
            val day = ts.atZone(zone).toLocalDate().toString()
            buckets[day] = (buckets[day] ?: 0L) + 1L
        }
        val perDay = buckets.map { (date, count) -> DayStat(date, count) }

        return RoomStats(messageRepository.countByRoomId(roomId), perPersona, perDay)
    }
}
