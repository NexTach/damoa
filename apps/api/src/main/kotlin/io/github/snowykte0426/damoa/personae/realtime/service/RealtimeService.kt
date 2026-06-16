package io.github.snowykte0426.damoa.personae.realtime.service

import io.github.snowykte0426.damoa.personae.realtime.dto.response.RealtimeEvent
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.CopyOnWriteArrayList

// In-memory SSE fan-out keyed by user — broadcasts change events to a user's
// connected devices (single container, so no external pub/sub needed).
@Service
class RealtimeService {
    private val log = LoggerFactory.getLogger(javaClass)
    private val byUser = ConcurrentHashMap<Long, CopyOnWriteArrayList<SseEmitter>>()

    fun subscribe(userId: Long): SseEmitter {
        val emitter = SseEmitter(30 * 60 * 1000L) // 30 min
        val list = byUser.computeIfAbsent(userId) { CopyOnWriteArrayList() }
        list.add(emitter)
        val remove = {
            list.remove(emitter)
            Unit
        }
        emitter.onCompletion(remove)
        emitter.onTimeout {
            remove()
            emitter.complete()
        }
        emitter.onError { remove() }
        runCatching { emitter.send(SseEmitter.event().comment("ok")) }
        return emitter
    }

    fun publish(
        userId: Long,
        event: RealtimeEvent,
    ) {
        val list = byUser[userId] ?: return
        for (emitter in list) {
            runCatching {
                emitter.send(SseEmitter.event().name("change").data(event))
            }.onFailure {
                list.remove(emitter)
                log.debug("dropped dead emitter for user {}", userId)
            }
        }
    }

    // Keep connections alive through proxies/CDN and prune dead ones.
    @Scheduled(fixedRate = 25_000)
    fun heartbeat() {
        for ((_, list) in byUser) {
            for (emitter in list) {
                runCatching { emitter.send(SseEmitter.event().comment("ping")) }
                    .onFailure { list.remove(emitter) }
            }
        }
    }
}
