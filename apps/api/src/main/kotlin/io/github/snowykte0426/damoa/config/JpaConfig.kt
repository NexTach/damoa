package io.github.snowykte0426.damoa.config

import org.springframework.context.annotation.Configuration
import org.springframework.data.jpa.repository.config.EnableJpaRepositories

// JPA repositories are registered explicitly: JPA + Redis on the classpath makes
// Spring Data's automatic store detection ambiguous.
@Configuration(proxyBeanMethods = false)
@EnableJpaRepositories(basePackages = ["io.github.snowykte0426.damoa"])
class JpaConfig
