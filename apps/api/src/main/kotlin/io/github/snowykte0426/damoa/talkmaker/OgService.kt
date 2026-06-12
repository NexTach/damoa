package io.github.snowykte0426.damoa.talkmaker

interface OgService {
    /** Fetches Open Graph / meta tags for a link preview. Returns blanks on failure. */
    fun fetch(url: String): OgResponse
}
