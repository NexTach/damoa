package io.github.snowykte0426.damoa.talkmaker.service

import io.github.snowykte0426.damoa.talkmaker.dto.response.OgResponse

interface OgService {
    /** Fetches Open Graph / meta tags for a link preview. Returns blanks on failure. */
    fun fetch(url: String): OgResponse
}
