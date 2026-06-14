package io.github.snowykte0426.damoa.auth.jwt.filter

import io.github.snowykte0426.damoa.auth.jwt.service.JwtService
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter

@Component
class JwtAuthFilter(
    private val jwtService: JwtService,
) : OncePerRequestFilter() {
    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain,
    ) {
        val header = request.getHeader("Authorization")
        // EventSource can't send headers, so the SSE stream authenticates via ?token=.
        val token =
            if (header != null && header.startsWith("Bearer ")) {
                header.substring(7)
            } else {
                request.getParameter("token")
            }
        if (token != null) {
            val userId = jwtService.validate(token)
            if (userId != null) {
                val auth = UsernamePasswordAuthenticationToken(userId.toString(), null, emptyList())
                SecurityContextHolder.getContext().authentication = auth
            }
        }
        filterChain.doFilter(request, response)
    }
}
