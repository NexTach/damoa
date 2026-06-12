package io.github.snowykte0426.damoa.config

import io.github.snowykte0426.damoa.auth.JwtAuthFilter
import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.config.http.SessionCreationPolicy
import org.springframework.security.web.SecurityFilterChain
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter
import org.springframework.web.cors.CorsConfiguration
import org.springframework.web.cors.CorsConfigurationSource
import org.springframework.web.cors.UrlBasedCorsConfigurationSource
import org.springframework.web.reactive.function.client.WebClient

@ConfigurationProperties(prefix = "app")
data class AppProperties(
    val jwtSecret: String = "",
    val frontendUrl: String = "",
    val datagsm: DataGsm = DataGsm(),
) {
    data class DataGsm(
        val authBase: String = "https://oauth.authorization.datagsm.kr",
        val resourceBase: String = "https://oauth.resource.datagsm.kr",
        val clientId: String = "",
        val clientSecret: String = "",
        val redirectUri: String = "",
        val scope: String = "STUDENT_READ",
    )
}

@Configuration(proxyBeanMethods = false)
@EnableConfigurationProperties(AppProperties::class)
class WebClientConfig {
    @Bean
    fun webClient(): WebClient = WebClient.builder().build()
}

@Configuration(proxyBeanMethods = false)
@EnableWebSecurity
class SecurityConfig(
    private val jwtFilter: JwtAuthFilter,
    private val props: AppProperties,
) {
    @Bean
    fun filterChain(http: HttpSecurity): SecurityFilterChain {
        http
            .csrf { it.disable() }
            .cors { }
            .sessionManagement { it.sessionCreationPolicy(SessionCreationPolicy.STATELESS) }
            .authorizeHttpRequests {
                it
                    .requestMatchers("/api/talkmaker/**").authenticated()
                    .anyRequest().permitAll()
            }
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter::class.java)
        return http.build()
    }

    @Bean
    fun corsConfigurationSource(): CorsConfigurationSource {
        val config = CorsConfiguration()
        config.allowedOrigins = listOf(props.frontendUrl, "http://localhost:3000")
        config.allowedOriginPatterns = listOf("https://*.vercel.app")
        config.allowedMethods = listOf("GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS")
        config.allowedHeaders = listOf("*")
        config.allowCredentials = false
        val source = UrlBasedCorsConfigurationSource()
        source.registerCorsConfiguration("/**", config)
        return source
    }
}
