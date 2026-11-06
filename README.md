# 빠플 (Ppapeul)

시험일까지 남은 기간, 과목별 시험일·우선순위, 요일별 공부 가능 시간을 바탕으로 학습 계획을 만드는 웹앱이야.

## 관리자와 공동 작업자의 역할 구분

- **기존 관리자·저장소 소유자:** [asnt39](https://github.com/asnt39)
- **별도 공동 작업자:** [ddnwls](https://github.com/ddnwls) — 기존 관리자와 별개로 빠플의 개발·수정 및 개발 기록 관리 작업에 기여

**ddnwls의 작업과 asnt39의 기존 프로젝트 작업을 혼동하지 않도록 분리해 기록해.** GitHub에서 작성자가 `ddnwls`로 확인되는 빠플 관련 작업(예: 별도 `ddnwls/fast`에서 시도한 터치식 시간 다이얼·UI 개선·복원, 이 저장소의 개발 기록 및 자동화 구성)은 [공동 작업자 ddnwls의 기여 내역](docs/codex-archive/ddnwls-contributions.md)에 커밋 증거와 함께 별도 수록했어. 기존 `asnt39` 작성 커밋은 `ddnwls`의 작업으로 표시하지 않아.

## 프로젝트 구조

| 경로 | 역할 |
| --- | --- |
| `public/index.html` | 사용자 화면 진입점 |
| `public/engine.js` | 날짜 검증 및 공부 계획 생성 로직 |
| `public/app.js` | 시험·과목·가능 시간 입력과 계획 화면 |
| `public/hub.js`, `public/daily.js` | 공부 타이머, 일일 목표 수정, 공부 기록·현황 |
| `public/settings.js`, `public/sw.js` | 알림 설정, 별도 공부 기록, 웹 푸시 서비스 워커 |
| `public/cheer.js` | 공부 응원 메시지 |
| `app/page.tsx` | 웹 루트에서 `/index.html`로 이동 |
| `app/api/community/route.ts` | 친구·메시지·공부 기록 API |
| `app/api/notifications/route.ts` | 알림 구독·요청 API |
| `worker/index.ts`, `lib/push.ts` | Cloudflare Worker 진입점·알림 처리 |
| `db/`, `drizzle/` | 데이터베이스 스키마와 마이그레이션 |
| `tests/` | 계획 생성·일일 목표·응원·알림 관련 테스트 |

현재 화면은 `public/`의 정적 HTML·JavaScript가 담당해. `components/ui/`는 공용 React 컴포넌트 모음이며, 검증 없이 일괄 삭제하지 않아.

## 로컬 개발

필요한 환경: Node.js **22.13 이상**, pnpm **11.25.0** (프로젝트 `package.json` 기준).

```sh
pnpm install
pnpm dev
```

`package.json`에 정의된 주요 명령:

```sh
pnpm build
pnpm lint
```

- `build`는 프로젝트의 Vinext/Vite·Sites 빌드 스크립트를 사용해.
- `.openai/hosting.json`의 Sites 프로젝트 설정은 배포와 연결되므로 함부로 수정하지 마.
- D1 데이터베이스와 기존 마이그레이션을 삭제하거나 초기화하지 마.

## 테스트

Node.js 내장 테스트를 사용하는 계획·응원 테스트:

```sh
node --test tests/engine.test.cjs tests/daily.test.cjs tests/cheer.test.cjs
```

설치된 의존성과 테스트용 환경이 필요한 알림 테스트:

```sh
node tests/notifications.test.mjs
```

서버 API 통합 검사용 `tests/community.py`는 `http://127.0.0.1:8787`에서 로컬 API와 데이터베이스가 정상 실행 중일 때만 실행해.

Playwright와 Chromium이 설치된 개발 환경에서는 화면 겹침 회귀 검사도 실행할 수 있어:

```sh
CHROMIUM_PATH=/usr/bin/chromium node --test tests/responsive.test.cjs
```

Playwright가 관리하는 Chromium을 사용하면 `CHROMIUM_PATH`는 생략해. 이 검사는 로컬 정적 파일과 가상 데이터를 사용해 320~1440px의 16개 너비에서 7개 주요 화면의 가로 넘침·입력 요소 겹침을 확인해. 실제 서버 API나 iOS Safari 실기기 동작을 검증하는 테스트는 아니야.

**이 문서에 적힌 명령은 실행 방법이지, 이번 README 수정 과정에서 테스트 성공을 보증하는 것은 아니야.**

## 현재 제약과 주의사항

- 별도 공부 기록은 기기 로컬 저장소를 사용하므로 기기 간 자동 동기화되지 않아.
- 앱을 닫은 상태의 예약 알림과 실제 기기별 푸시 수신은 환경에 따라 추가 검증이 필요해. 서버의 무인 예약 실행은 아직 확인되지 않았어.
- 서비스 워커가 있다고 해서 완전한 오프라인 사용이 지원되는 것은 아니야.
- 토큰·VAPID 비밀키·개인 정보는 저장소에 커밋하지 마.

알림 기능의 상세 구현 및 확인 범위는 [NOTIFICATION-UPDATE.md](./NOTIFICATION-UPDATE.md)를 참고해.

## 배포·작업 원칙

이 저장소는 ChatGPT Sites 프로젝트와 연결되어 있어. 실제 서비스에 영향을 줄 수 있으므로 `public/`, API, 데이터베이스, 호스팅 설정을 변경한 뒤에는 관련 테스트 및 빌드 결과를 확인해. 과거 프로토타입 `original.jsx`는 현재 실행 코드에서 참조되지 않아 2026-11-04에 저장소에서 제거했으며, 이전 버전은 Git 기록으로 복원할 수 있어.
