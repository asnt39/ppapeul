# vinext-starter

A clean full-stack starter running on [vinext](https://github.com/cloudflare/vinext), with optional Cloudflare D1 and Drizzle support.

## Prerequisites

- Node.js `>=22.13.0`
- Portable: Windows, macOS, or Linux; no Bash required
- Managed Linux: managed Linux runtime with Bash, `flock`, `curl`, `sha256sum`, and GNU `timeout`
- Git and `tar` (including Windows `tar.exe`) are required for publishing; portable publication does not require Bash

## Sites Lifecycle

The Sites initializer copies the shared starter and selects managed-linux only when `SITES_MANAGED_LINUX_CONTAINER=1`; otherwise it selects portable. It saves the selection only in ignored `.sites-runtime/execution-profile.json`. Both profiles copy/configure first, then use the plugin's separate `install-dependencies.mjs` step to measure installation independently. Edit source under `app/` and follow the Sites skill for installation, preview, builds, and publishing.

Run `node <plugin-root>/scripts/configure-execution-profile.mjs` only when the profile is unknown for the current checkout and environment. Profile changes do not alter tracked source or require reinstalling otherwise-valid dependencies; restart an existing preview to use the new selection. Do not commit or upload `.sites-runtime/`.

This starter does not use `wrangler.jsonc`.

Publish archives outside the source checkout or under its ignored `outputs/` directory. Local `.env*`, `.dev.vars*`, TypeScript build state, and tool runtime directories are ignored; keep the hosting manifest, migrations, and authored scripts in source control.

`install:ci` runs `npm ci` once against the shared lockfile, disables parent-workspace discovery, and includes required dev/optional dependencies despite production/omit settings. Sharp defaults to prebuilt binaries unless explicitly configured otherwise. Do not overlap installers.

- **Portable:** Preserve host HOME, npm cache, registry, proxy, temporary paths, retry/concurrency settings, and lifecycle-script policy. Use `--prefer-offline --no-audit --no-fund`.
- **Managed Linux:** Use the existing project-local HOME/cache/tmp setup and Linux install lock, tarball preflight, and timeout. Restore the image-seeded npm cache only when its lockfile hash matches; retain network fallback. Builds keep their existing timeout. These helpers are not invoked by the portable profile.

`scripts/sites-env.mjs` preserves the caller's HOME, npm cache, proxy, XDG, and temporary-directory configuration while defaulting Wrangler and Miniflare state to the checkout. If npm reports an unwritable cache, select a writable path with `npm_config_cache` for that install. The `dev` and `start` scripts also keep Wrangler logs inside the checkout. Generated `.sites-runtime/` and `.wrangler/` directories are disposable and ignored by Git.

On portable, `npm run dev` uses `vinext dev` with HMR, starting at port 5173. Vinext records the running server in ignored `.vinext/` state, rejects an ordinary duplicate launch, and recovers stale state after a stopped process; exactly simultaneous starts can race. Pass `--port <port>` or `--hostname <host>` after `npm run dev --` when needed; keep portable previews on loopback.

For managed Linux browser QA, follow the Sites skill's managed preview reference. The daemon runs the project's Vite dev script with `--host 0.0.0.0 --port 4173 --strictPort`; use the CLI's returned URL. The ignored local profile survives the daemon's cleared environment.

The portable profile simulates ChatGPT sign-in only for loopback development requests. Visit `/signin-with-chatgpt?return_to=/` to sign in as `local_seedy` (`seedy@sites.test`, display name `Seedy`) and `/signout-with-chatgpt?return_to=/` to sign out. The development cookie preserves that identity across server restarts. Mock auth is disabled in the managed-linux profile and is not included in production builds; hosted authentication remains dispatch-owned.

The Worker uses `vinext/server/fetch-handler`, including Vinext's config-aware image handling. After building, `npm start` runs that Worker locally through Wrangler on `127.0.0.1`, sharing `.wrangler/state` with dev preview and local D1 migrations; it does not deploy the site or simulate sign-in. Use the URL printed by the server. Pass `npm start -- --port <port>` to select a different built-preview port.

Local previews use Miniflare's placeholder `Request.cf` metadata without a network lookup. Set `CLOUDFLARE_CF_FETCH_ENABLED=true` to opt into fetching preview metadata; this setting does not change hosted request metadata.

Local tool usage metrics are disabled by default. Set `WRANGLER_SEND_METRICS=true` to opt in.

## Included Shape

- edit site code under `app/`
- `app/chatgpt-auth.ts` provides optional dispatch-owned ChatGPT sign-in helpers
- `.openai/hosting.json` declares optional Sites D1 and R2 bindings
- `vite.config.ts` simulates declared bindings for local development
- `worker/index.ts` is the production Worker entrypoint and preserves request-scoped connector bindings
- `scripts/vite/` contains the maintained Vite integrations and the vendored Sites plugin license
- `scripts/connector-preview/` contains the local connector preview Worker and session helpers
- the remaining `scripts/` files select execution profiles and run installation, development, and builds; the plugin's helpers orchestrate the Sites lifecycle
- `dist/` contains generated deployment output; `.vinext/`, `.wrangler/`, and `.sites-runtime/` contain ignored local tool state
- `db/index.ts` reads the D1 binding from the Cloudflare Worker environment
- `db/schema.ts` starts intentionally empty
- `@cloudflare/workers-types` provides Worker types; `cloudflare-env.d.ts` declares optional `DB`/`BUCKET` bindings—update these declarations if binding names change
- `examples/d1/` contains an optional D1 example surface
- `drizzle.config.ts` supports local migration generation when needed

## Workspace Auth Headers

Signed-in visitors receive both `oai-authenticated-user-id` and `oai-authenticated-user-email`. Private Sites require every visitor to sign in; public Sites may also have anonymous visitors, for whom neither header is present.

The user ID is stable for the same user on the same Site and different across Sites. Use it as the durable user key; use email and name for display or contact purposes.

SIWC-authenticated workspace sites may also receive `oai-authenticated-user-full-name` when the user's SIWC profile has a non-empty `name` claim. The full-name value is percent-encoded UTF-8 and is accompanied by `oai-authenticated-user-full-name-encoding: percent-encoded-utf-8`.

Treat the full name as optional and fall back to email when it is absent:

```tsx
import { headers } from "next/headers";

export default async function Home() {
  const requestHeaders = await headers();
  const userId = requestHeaders.get("oai-authenticated-user-id");
  const email = requestHeaders.get("oai-authenticated-user-email");
  const encodedFullName = requestHeaders.get("oai-authenticated-user-full-name");
  const fullName =
    encodedFullName &&
    requestHeaders.get("oai-authenticated-user-full-name-encoding") ===
      "percent-encoded-utf-8"
      ? decodeURIComponent(encodedFullName)
      : null;

  const displayName = fullName ?? email;
  // ...
}
```

## Optional Dispatch-Owned ChatGPT Sign-In

Import the ready-to-use helpers from `app/chatgpt-auth.ts` when the site needs optional or required ChatGPT sign-in:

- Use `getChatGPTUser()` for optional signed-in UI.
- Use the returned `userId` as the stable user key for user-owned records; do not use email as a durable identifier.
- Use `requireChatGPTUser(returnTo)` for server-rendered pages that should send anonymous visitors through Sign in with ChatGPT.
- In a Server Component, start sign-in with `<a href={chatGPTSignInPath(returnTo)} target="_top">`. The auth helper module is server-only; do not import it into a Client Component.
- Do not use `fetch`, XHR, a client-side router, or a framework link that can prefetch the sign-in route. SIWC must start as a top-level navigation.
- Never request the AuthAPI authorization endpoint directly. The dispatch-owned `/signin-with-chatgpt` route must start the SIWC flow.
- Use `chatGPTSignOutPath(returnTo)` for browser sign-out links or actions.
- Pass a same-origin relative `returnTo` path for the destination after sign-in or sign-out. The helper validates and safely encodes it.
- Mark protected pages with `export const dynamic = "force-dynamic"` because they depend on per-request identity headers.

Dispatch owns `/signin-with-chatgpt`, `/signout-with-chatgpt`, `/callback`, the OAuth cookies, and identity header injection. Do not implement app routes for those reserved paths. Routes that do not import and call the helper remain anonymous-compatible.

SIWC establishes identity only; it does not prove workspace membership. Use the Sites hosting platform's access policy controls for workspace-wide restrictions, or enforce explicit server-side membership or allowlist checks.

Use SIWC for account pages, user-specific dashboards, saved records, and write actions tied to the current ChatGPT user. Leave public content anonymous.

## Local D1 migrations

For a D1-backed local preview, generate SQL with `npm run db:generate`. Build once through the Sites skill's build entrypoint (or `npm run build` for standalone use) to generate `dist/server/wrangler.json`, rebuilding if bindings change. From the project root, apply each pending migration in order:

```sh
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_example.sql
```

Replace the filename with the pending migration and `DB` with your D1 binding name if different. Use `.wrangler/state`, not `.wrangler/state/v3`; Wrangler adds the versioned directories. Do not replay migrations already applied locally. This updates only the preview database; publishing applies production migrations separately.

## Diagnostic Commands

- `npm run install:ci`: perform the one locked dependency install
- `npm run dev`: start the Vite/Vinext development server
- `npm run build`: build the deployable Sites artifact
- `npm run start`: preview the built Worker locally with D1/R2 support
- `npm run db:generate`: generate Drizzle migrations after schema changes

When using the Sites plugin, follow its skill instructions for installation, builds, and publishing. These npm commands remain available for standalone use.

The portable build runs Vinext directly without a host `timeout` command. The managed-linux build uses `scripts/build-verified.sh` and its existing `SITES_BUILD_TIMEOUT` setting.

## Learn More

- [vinext Documentation](https://github.com/cloudflare/vinext)
- [Drizzle D1 Guide](https://orm.drizzle.team/docs/get-started/d1-new)

## 공개 스터디 확장
public/의 프런트엔드와 app/api/community/route.ts의 D1 API로 구성됩니다. 프로필은 비밀번호/ChatGPT 로그인 대신 서버에서 발급한 게스트 토큰으로 소유권을 확인합니다. 토큰은 서버에서 SHA-256 해시로 보관하고 응답에는 프로필 생성 시에만 반환합니다. 친구 코드에는 토큰이 포함되지 않습니다. 브라우저 저장소 또는 복구 키를 잃으면 프로필 복구는 불가능합니다.

라이트/다크/기기 테마, 동일 파랑-남색 강조, 기본/포모도로 타이머, 구간 시간 변경, 날짜 지정/분 후 알람, 수동 시간 기록, 7일 통계, 기록 JSON 내보내기, 규칙 기반 동료 파랑을 제공합니다. 포모도로의 다음 구간은 직접 시작합니다. 브라우저 종료/절전에서는 알람이 지연될 수 있습니다. 타이머·계획·개인 기록은 브라우저에 저장됩니다. 게스트 프로필 사용 시 기록이 서버로 전송되어 친구가 7일 누적 시간을 볼 수 있습니다. 친구 상태는 30초 갱신, 2분 이상 미갱신 시 오프라인입니다. 친구 메시지는 상호 수락 후 전송 가능하며 길이와 전송 간격을 제한합니다. 스터디 방과 공유 포모도로는 아직 포함하지 않습니다.

검증: 계획 엔진 12개 검증 통과. 별도 로컬 Worker에서 테스트 프로필 2개로 요청/수락/메시지/인증 거부/음수 시간 거부/중복 기록 방지/친구 해제 후 전송 거부 검증 통과. UI에서 타이머 22초 기록과 게스트 생성 확인. 실제 모바일 절전 알람은 미검증.

## 오늘 공부 개선
필수 입력 검사 실패 시 상단 빨간 경고와 입력 테두리를 표시합니다. 공통 시험일과 과목 버튼/쉼표 일괄 입력을 지원합니다. 오늘 과목의 목표 분을 수정할 수 있고, 날짜별 override로 저장하여 다른 날짜를 유지합니다. 원형 타이머는 선택 과목의 오늘 실제 시간(현재 측정 포함)/오늘 목표 비율을 표시하며 100% 초과 수치는 유지하고 원은 100%에서 채웁니다. 계획 체크 완료율과 실제 시간 성취도를 구분합니다. 친구 화면에 오늘 기록/목표를 표시하며, 날짜별 daily_stats를 서버에 보관합니다. 친구의 목표 미설정과 오래된 공유 기록을 구분합니다. 게스트 사용 시 30초 간격으로 공유되며 실제 집중도를 인증하지 않습니다. 파랑 채팅 입력과 대화 기록 사용을 제거하고 클릭형 팁/응원으로 변경했습니다.
검증: daily.test.cjs의 날짜별 수정, 0분, 합계, 다른 날짜 유지, 잘못된 override 무시 통과. API에서 오늘 목표/실제 공유, 다른 날짜 분리, 24시간 초과 거부 검증 추가. 브라우저에서 빈 시작일 경고, 목표 수정과 새로고침 유지, 과목 일괄 추가와 타이머 선택 확인.
