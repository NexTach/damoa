package io.github.snowykte0426.damoa

import org.junit.platform.engine.discovery.DiscoverySelectors.selectPackage
import org.junit.platform.launcher.core.LauncherDiscoveryRequestBuilder.request
import org.junit.platform.launcher.core.LauncherFactory
import org.junit.platform.launcher.listeners.SummaryGeneratingListener
import java.io.PrintWriter
import kotlin.system.exitProcess

/**
 * JUnit 5 (Platform) entry point for `bazel test //apps/api:test`.
 *
 * rules_kotlin's kt_jvm_test defaults to the JUnit4 BazelTestRunner, which cannot
 * run Jupiter (org.junit.jupiter) tests. We drive the platform launcher directly and
 * signal pass/fail to Bazel through the process exit code (0 = pass).
 */
object JUnit5Runner {
    @JvmStatic
    fun main(args: Array<String>) {
        val request =
            request()
                .selectors(selectPackage("io.github.snowykte0426.damoa"))
                .build()
        val listener = SummaryGeneratingListener()
        LauncherFactory.create().apply {
            registerTestExecutionListeners(listener)
            execute(request)
        }

        val summary = listener.summary
        PrintWriter(System.out).use(summary::printTo)
        if (summary.totalFailureCount > 0) {
            PrintWriter(System.err).use(summary::printFailuresTo)
        }
        // Fail on test failures, or if discovery found nothing (likely a wiring bug).
        val ok = summary.totalFailureCount == 0L && summary.testsFoundCount > 0
        exitProcess(if (ok) 0 else 1)
    }
}
