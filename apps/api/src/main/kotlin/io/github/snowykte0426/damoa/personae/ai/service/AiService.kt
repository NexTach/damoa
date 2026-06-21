package io.github.snowykte0426.damoa.personae.ai.service

interface AiService {
    /** True when an OpenAI API key is configured. */
    fun isEnabled(): Boolean

    /**
     * Generates one assistant reply from chat messages
     * ([{"role","content"}, ...]) via the OpenAI chat completions API.
     */
    fun complete(messages: List<Map<String, String>>): String
}
