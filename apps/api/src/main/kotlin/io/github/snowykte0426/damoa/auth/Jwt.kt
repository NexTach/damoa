package io.github.snowykte0426.damoa.auth

import com.nimbusds.jose.JWSAlgorithm
import com.nimbusds.jose.JWSHeader
import com.nimbusds.jose.crypto.MACSigner
import com.nimbusds.jose.crypto.MACVerifier
import com.nimbusds.jwt.JWTClaimsSet
import com.nimbusds.jwt.SignedJWT
import io.github.snowykte0426.damoa.config.AppProperties
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import java.util.Date
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Component
import org.springframework.stereotype.Service
import org.springframework.web.filter.OncePerRequestFilter

@Service
class JwtService(props: AppProperties) {
    private val key = props.jwtSecret.toByteArray()
    private val ttlMillis = 7L * 24 * 60 * 60 * 1000 // 7일

    fun issue(userId: Long, name: String, email: String): String {
        val now = Date()
        val claims = JWTClaimsSet.Builder()
            .subject(userId.toString())
            .claim("name", name)
            .claim("email", email)
            .issueTime(now)
            .expirationTime(Date(now.time + ttlMillis))
            .build()
        val jwt = SignedJWT(JWSHeader(JWSAlgorithm.HS256), claims)
        jwt.sign(MACSigner(key))
        return jwt.serialize()
    }

    /** 유효하면 userId, 아니면 null */
    fun validate(token: String): Long? = try {
        val jwt = SignedJWT.parse(token)
        if (!jwt.verify(MACVerifier(key))) {
            null
        } else {
            val claims = jwt.jwtClaimsSet
            if (claims.expirationTime?.before(Date()) != false) null else claims.subject.toLong()
        }
    } catch (_: Exception) {
        null
    }
}

@Component
class JwtAuthFilter(private val jwtService: JwtService) : OncePerRequestFilter() {
    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain,
    ) {
        val header = request.getHeader("Authorization")
        if (header != null && header.startsWith("Bearer ")) {
            val userId = jwtService.validate(header.substring(7))
            if (userId != null) {
                val auth = UsernamePasswordAuthenticationToken(userId.toString(), null, emptyList())
                SecurityContextHolder.getContext().authentication = auth
            }
        }
        filterChain.doFilter(request, response)
    }
}
