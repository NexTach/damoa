package io.github.snowykte0426.damoa.user.repository

import io.github.snowykte0426.damoa.user.entity.User
import org.springframework.data.jpa.repository.JpaRepository

interface UserRepository : JpaRepository<User, Long>
