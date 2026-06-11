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

## 배포

분리 배포: **`apps/web` → Vercel**, **`apps/api` → 온프레미스 홈서버(Mac mini, Docker)**.

### apps/api (홈서버 CD)

`main` 브랜치에 `apps/api/**` 변경이 push 되면 `.github/workflows/deploy-api.yml` 이 동작한다:

1. GitHub Actions(ubuntu) 에서 JDK 25 로 `./gradlew bootJar` → `app.jar` 생성
2. `apps/api/deploy/` 로 jar 를 스테이징
3. `8G4B/GSM-SV-Deploy` 액션이 홈서버로 복사 후 `deployspec.yml` 라이프사이클 실행
   - `ApplicationStop` → 기존 `damoa-app` 컨테이너 제거
   - `AfterInstall` → `docker build` (eclipse-temurin:25-jre)
   - `ApplicationStart` → `docker run` (호스트 `10102`→컨테이너 `8080`)
   - `ValidateService` → `http://127.0.0.1:10102/` 응답 확인

서버 구성(이미 준비됨):
- 기존 docker `mysql`(3306) / `redis`(6379) 재사용 — 컨테이너에서 `host.docker.internal` 로 접속
- DB/Redis 시크릿은 레포가 아닌 서버 파일 `~/deploy/secrets/damoa.env` 에 보관(`--env-file`)
- nginx `kimtaeeun.site` 의 `location /damoa/` → `127.0.0.1:10102` (Cloudflare 가 https 종단)
- 공개 주소: `https://kimtaeeun.site/damoa/`

**필요한 GitHub Secrets** (레포 Settings → Secrets and variables → Actions):

| Secret | 값 |
|--------|-----|
| `HOMESERVER_HOST` | 홈서버 IP |
| `HOMESERVER_USER` | SSH 사용자명 |
| `HOMESERVER_PASSWORD` | SSH 비밀번호 |

### apps/web (Vercel)

Vercel 대시보드에서 GitHub 레포를 연결하고:
- **Root Directory**: `apps/web` (+ "Include files outside root directory" 활성 — pnpm 워크스페이스 설치용)
- **Framework**: Next.js (자동 감지)
- **Environment Variables**: `NEXT_PUBLIC_API_BASE_URL=https://kimtaeeun.site/damoa`, `API_BASE_URL=https://kimtaeeun.site/damoa`

`main` push 시 자동 배포된다.

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
