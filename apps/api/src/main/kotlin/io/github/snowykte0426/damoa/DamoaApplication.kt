package io.github.snowykte0426.damoa

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.data.jpa.repository.config.EnableJpaRepositories

// JPA + R2DBC + Redis Multi-store makes auto-registration ambiguous, so we explicitly register JPA repositories.
// Registration of JPA repositories is explicitly done. (R2DBC/Redis repository scanning is disabled in application.yaml)
@SpringBootApplication
@EnableJpaRepositories(basePackages = ["io.github.snowykte0426.damoa"])
class DamoaApplication

fun main(args: Array<String>) {
    runApplication<DamoaApplication>(*args)
}
