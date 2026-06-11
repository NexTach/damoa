# damoa

Bazel(bzlmod) 모노레포 — Spring Boot API + Next.js 웹.

## 구조

```
damoa/
├── MODULE.bazel          # Bazel 모듈/의존성 (bzlmod)
├── .bazelrc              # Java 25 local_jdk 등 빌드 설정
├── pnpm-workspace.yaml   # pnpm 워크스페이스 (apps/web)
├── apps/
│   ├── api/              # Spring Boot 4.1 + Kotlin 2.3 (Java 25)
│   │   ├── BUILD.bazel   #   kt_jvm_library / java_binary / kt_jvm_test
│   │   ├── build.gradle  #   Gradle fallback (선택)
│   │   └── src/
│   └── web/              # Next.js 15 (App Router, TS, Tailwind v4, Biome)
│       └── BUILD.bazel   #   next build / dev (aspect_rules_js)
└── bazel/BUILD.bazel     # Kotlin 2.3 / JVM 25 툴체인
```

- **배포**: `apps/web` → Vercel, `apps/api` → 온프레미스 홈서버 (완전 분리).
- 프론트는 `NEXT_PUBLIC_API_BASE_URL` / `API_BASE_URL`(`.env`)로 Spring API 절대주소를 주입해 호출 (`apps/web/lib/api.ts`).

## 사전 요구

- Bazel 9.1.1 (`.bazelversion`, bazelisk 권장)
- JDK 25 (로컬 설치 — Bazel `local_jdk` 사용)
- Node 22+, pnpm 10+

## 빌드 / 실행

### Bazel (네이티브)

```bash
bazel build //...                 # 전체
bazel build //apps/api:app        # Spring 실행 바이너리
bazel run   //apps/api:app        # Spring 실행 (개별 jar 클래스패스 → 오토컨피그 정상)
bazel test  //apps/api:test       # Spring 테스트 (DB 필요)

bazel build //apps/web:build      # Next 프로덕션 빌드 → apps/web/.next
bazel run   //apps/web:dev        # Next 개발 서버
```

> Spring 실행/테스트는 MySQL·Redis 등 외부 의존성 구성이 필요하다(현재 `application.yaml` 은
> 앱 이름만 설정). 데이터소스 미구성 시 컨텍스트 로딩이 실패한다.

### pnpm (프론트 직접)

```bash
pnpm --filter @damoa/web dev      # 개발
pnpm --filter @damoa/web build    # 빌드
pnpm --filter @damoa/web lint     # Biome
```

### Gradle (apps/api fallback)

```bash
cd apps/api && ./gradlew bootRun
```

## AI 하네스

`.harness/sync.yml` 로 Claude Code / Codex 의 skills·agents·hooks 를 동기화한다
(secret-guard, command-guard, biome, ts-check 활성화). 자세한 내용:
<https://github.com/themoment-team/themoment-ai-harness-sync/wiki>

## 알려진 메모

- **Bazel 9 + rules_spring**: rules_spring 2.6.3 은 Bazel 9 에서 제거된 레거시 글로벌
  (`JavaInfo`)을 사용해 동작하지 않는다. 그래서 Spring Boot 실행 jar 대신
  `java_binary`(rules_java) 로 패키징한다. `bazel run` 은 개별 jar 클래스패스라
  여러 라이브러리의 `spring.factories` / `AutoConfiguration.imports` 가 모두 정상 로드된다.
  단일 배포 jar(`app_deploy.jar`)가 필요하면 이 파일들이 충돌하므로 별도 머지 전략이 필요하다.
- **Java 25**: 원격 JDK 25 툴체인이 불안정해 로컬 설치 JDK 25 를 `local_jdk` 로 사용한다(`.bazelrc`).
- **maven 핀**: Spring Boot BOM 이 버전을 결정적으로 고정하므로 lock 파일 없이도 재현 가능.
  필요 시 `MODULE.bazel` 의 `lock_file` 주석을 해제하고 핀한다.
