package io.github.snowykte0426.damoa.talkmaker.service.impl

import io.github.snowykte0426.damoa.talkmaker.dto.response.OgResponse
import io.github.snowykte0426.damoa.talkmaker.service.OgService
import io.github.snowykte0426.damoa.user.entity.User
import java.net.InetAddress
import java.net.URI
import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse
import java.time.Duration
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException

@Service
class OgServiceImpl : OgService {
    private val log = LoggerFactory.getLogger(javaClass)
    private val client = HttpClient.newBuilder()
        .followRedirects(HttpClient.Redirect.NEVER) // followed manually to re-check each hop
        .connectTimeout(Duration.ofSeconds(4))
        .build()

    override fun fetch(url: String): OgResponse {
        var current = parseSafe(url)
        var html = ""
        var finalUri = current
        repeat(MAX_REDIRECTS) {
            val res = request(current)
            val status = res.statusCode()
            if (status in 300..399) {
                val location = res.headers().firstValue("location").orElse(null)
                    ?: throw badGateway("redirect without location")
                current = parseSafe(current.resolve(location).toString())
                return@repeat
            }
            if (status >= 400) throw badGateway("upstream $status")
            html = res.body().take(MAX_BYTES)
            finalUri = current
            return buildResponse(url, finalUri, html)
        }
        throw badGateway("too many redirects")
    }

    private fun request(uri: URI): HttpResponse<String> {
        val req = HttpRequest.newBuilder(uri)
            .timeout(Duration.ofSeconds(6))
            .header("User-Agent", USER_AGENT)
            .header("Accept", "text/html,application/xhtml+xml")
            .GET()
            .build()
        return try {
            client.send(req, HttpResponse.BodyHandlers.ofString())
        } catch (e: Exception) {
            log.debug("og fetch failed for {}: {}", uri, e.message)
            throw badGateway("fetch failed")
        }
    }

    private fun buildResponse(requested: String, base: URI, html: String): OgResponse {
        val meta = parseMeta(html)
        val title = meta["og:title"] ?: meta["twitter:title"] ?: titleTag(html)
        val image = (meta["og:image"] ?: meta["twitter:image"])?.let { abs(base, it) }
        return OgResponse(
            url = requested,
            title = title?.trim()?.ifBlank { null },
            description = (meta["og:description"] ?: meta["description"])?.trim()?.ifBlank { null },
            image = image,
            siteName = meta["og:site_name"]?.trim()?.ifBlank { null } ?: base.host,
        )
    }

    // Parses every <meta> tag into a property/name -> content map (attribute order agnostic).
    private fun parseMeta(html: String): Map<String, String> {
        val out = HashMap<String, String>()
        for (tag in META_TAG.findAll(html)) {
            val attrs = HashMap<String, String>()
            for (a in ATTR.findAll(tag.value)) {
                val v = a.groupValues[2].ifEmpty { a.groupValues[3] }
                attrs[a.groupValues[1].lowercase()] = decode(v)
            }
            val key = attrs["property"] ?: attrs["name"] ?: continue
            val content = attrs["content"] ?: continue
            out.putIfAbsent(key.lowercase(), content)
        }
        return out
    }

    private fun titleTag(html: String): String? =
        TITLE_TAG.find(html)?.groupValues?.get(1)?.let { decode(it) }

    private fun abs(base: URI, ref: String): String? =
        runCatching { base.resolve(ref).toString() }.getOrNull()

    private fun decode(s: String): String = s
        .replace("&amp;", "&")
        .replace("&quot;", "\"")
        .replace("&#39;", "'")
        .replace("&#x27;", "'")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&nbsp;", " ")

    // Rejects non-http(s) and any host resolving to a private/loopback address (SSRF guard).
    private fun parseSafe(raw: String): URI {
        val uri = runCatching { URI(raw) }.getOrNull()
            ?: throw badRequest("invalid url")
        val scheme = uri.scheme?.lowercase()
        if (scheme != "http" && scheme != "https") throw badRequest("unsupported scheme")
        val host = uri.host ?: throw badRequest("missing host")
        val addrs = runCatching { InetAddress.getAllByName(host) }.getOrNull()
            ?: throw badGateway("dns failed")
        if (addrs.any { it.isLoopbackAddress || it.isSiteLocalAddress || it.isLinkLocalAddress || it.isAnyLocalAddress }) {
            throw badRequest("blocked host")
        }
        return uri
    }

    private fun badRequest(msg: String) = ResponseStatusException(HttpStatus.BAD_REQUEST, msg)

    private fun badGateway(msg: String) = ResponseStatusException(HttpStatus.BAD_GATEWAY, msg)

    private companion object {
        const val MAX_REDIRECTS = 4
        const val MAX_BYTES = 512 * 1024
        const val USER_AGENT =
            "Mozilla/5.0 (compatible; TalkmakerBot/1.0; +https://kimtaeeun.site/damoa)"
        val META_TAG = Regex("<meta\\b[^>]*>", RegexOption.IGNORE_CASE)
        val ATTR = Regex("([a-zA-Z:_-]+)\\s*=\\s*(?:\"([^\"]*)\"|'([^']*)')")
        val TITLE_TAG = Regex("<title[^>]*>(.*?)</title>", setOf(RegexOption.IGNORE_CASE, RegexOption.DOT_MATCHES_ALL))
    }
}
