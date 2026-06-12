package io.github.snowykte0426.damoa

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.data.jpa.repository.config.EnableJpaRepositories

// JPA + R2DBC + Redis 멀티 스토어라 자동등록이 모호해지므로 JPA 리포지토리를 명시적으로 등록한다.
// (R2DBC/Redis 리포지토리 스캔은 application.yaml 에서 비활성)
@SpringBootApplication
@EnableJpaRepositories(basePackages = ["io.github.snowykte0426.damoa"])
class DamoaApplication

fun main(args: Array<String>) {
    runApplication<DamoaApplication>(*args)
}
