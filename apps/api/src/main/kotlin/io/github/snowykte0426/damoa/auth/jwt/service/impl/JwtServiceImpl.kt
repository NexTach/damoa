package io.github.snowykte0426.damoa.auth.jwt.service.impl

import com.nimbusds.jose.JWSAlgorithm
import com.nimbusds.jose.JWSHeader
import com.nimbusds.jose.crypto.MACSigner
import com.nimbusds.jose.crypto.MACVerifier
import com.nimbusds.jwt.JWTClaimsSet
import com.nimbusds.jwt.SignedJWT
import io.github.snowykte0426.damoa.auth.jwt.service.JwtService
import io.github.snowykte0426.damoa.config.AppProperties
import org.springframework.stereotype.Service
import java.util.Date

@Service
class JwtServiceImpl(
    props: AppProperties,
) : JwtService {
    private val key = props.jwtSecret.toByteArray()
    private val ttlMillis = 7L * 24 * 60 * 60 * 1000

    override fun issue(
        userId: Long,
        name: String,
        email: String,
    ): String {
        val now = Date()
        val claims =
            JWTClaimsSet
                .Builder()
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

    override fun validate(token: String): Long? =
        try {
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
