"""Bazel 네이티브 Spring Boot 실행 jar 룰.

`spring_boot_jar` 는 kt_jvm_library/java_library 타겟을 받아, 그 산출물을 소스로 하고
전이적 런타임 의존성을 BOOT-INF/lib/ 로 중첩한 Spring Boot 실행 jar 를 만든다.
"""

load("@rules_java//java/common:java_info.bzl", "JavaInfo")

def _spring_boot_jar_impl(ctx):
    info = ctx.attr.app[JavaInfo]

    # 우리 앱 자신의 런타임 jar(클래스 + resources) — Repackager 의 소스.
    own = info.runtime_output_jars
    if not own:
        fail("app target produces no runtime_output_jars: %s" % ctx.attr.app.label)
    source = own[0]
    own_paths = {j.path: True for j in own}

    # 나머지 전이 런타임 jar = 중첩될 라이브러리.
    libraries = [j for j in info.transitive_runtime_jars.to_list() if j.path not in own_paths]

    out = ctx.actions.declare_file(ctx.label.name + ".jar")

    args = ctx.actions.args()
    args.add(source)
    args.add(out)
    args.add(ctx.attr.main_class)
    args.add_all(libraries)

    ctx.actions.run(
        executable = ctx.executable._repackager,
        arguments = [args],
        inputs = depset([source], transitive = [depset(libraries)]),
        outputs = [out],
        mnemonic = "SpringBootRepackage",
        progress_message = "Repackaging Spring Boot jar %{label}",
    )

    return [DefaultInfo(files = depset([out]))]

spring_boot_jar = rule(
    implementation = _spring_boot_jar_impl,
    attrs = {
        "app": attr.label(
            providers = [JavaInfo],
            mandatory = True,
            doc = "앱 클래스를 담은 kt_jvm_library/java_library",
        ),
        "main_class": attr.string(mandatory = True),
        "_repackager": attr.label(
            default = "//tools/springboot:repackager",
            executable = True,
            cfg = "exec",
        ),
    },
)
