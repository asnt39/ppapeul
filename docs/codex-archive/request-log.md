# 빠플(Ppapeul) 사용자 요청·작업 이력

이 문서는 빠플 관련 사용자 요청과 구현 결과를 구분하는 기록이다. `AGENTS.md`의 기준에 따라 Codex 작업 시 갱신한다. 저장소의 GitHub 커밋 이력은 [ppapeul-history.md](ppapeul-history.md)에서 별도로 자동 생성된다.

## 2026-11-06 — 공동 작업자(ddnwls) 독립 기여 명시

- **요청:** 기존 관리자 `asnt39`와 별개로 `ddnwls`가 수행한 빠플 작업임을 저장소에 명시하고, 본인의 작업만 구분해 기록.
- **분류:** 협업/기여 출처 정리
- **변경 문서:** `README.md`, `AGENTS.md`, `docs/codex-archive/README.md`, `docs/codex-archive/ddnwls-contributions.md` 및 이 요청 이력.
- **기여 구분:** GitHub 커밋 작성자가 `ddnwls`인지 확인하여 별도 기여로 표시. 기존 `asnt39` 커밋 및 자동 `github-actions[bot]` 커밋과 구분.
- **검증:** GitHub의 커밋 작성자 메타데이터 및 저장소 파일에서 구분 근거 확인. 앱 기능·테스트는 이 문서 작업에서 변경하지 않음.
- **향후 기준:** 새 Codex 작업에도 코드 작성자·요청자·자동화 봇을 구분. [공동 작업자 기여 기록](ddnwls-contributions.md) 참조.

## 2026-11-06 — 개발 이력·저장소 분류 정책

- **사용자 요청:** 빠플 관련 Codex 작업은 `asnt39/ppapeul`에만 저장하고, 그 밖의 Codex 작업은 `ddnwls` 계정 소유 저장소에 프로젝트별로 저장. 이전 빠플 작업 이력도 분류하여 보관.
- **분류:** 문서/프로젝트 관리
- **변경 파일:** `docs/codex-archive/README.md`, `.github/workflows/record-ppapeul-history.yml`, `AGENTS.md`, `docs/codex-archive/request-log.md`.
- **검증:** GitHub Actions의 최초 커밋 기록 워크플로 실행 성공 확인. 과거 두 GitHub 저장소에서 확인한 커밋 9개 링크를 README에 기록함.
- **남은 범위:** `ddnwls`에 새로운 비-빠플 프로젝트 저장소를 자동 생성하고 Codex 모든 작업을 라우팅하는 전역 설정은 아직 구축되지 않음. 각 신규 Codex 프로젝트가 해당 `ddnwls` 저장소에 연결되어야 기록 가능. GitHub에 올라오지 않은 Codex 세션 전체를 직접 복원할 수 없음.

## 과거 확인된 빠플 요청

- 2026-10-23: HTML 파일 흰 화면 원인 확인·수정 요청(기존 파일 요청, 해결 결과 미검증)
- 2026-10-31: 빠플 웹사이트 링크 기반 코드 수정 여부, iPad/iPhone에서 PC 없이 Codex 사용 및 클라우드 연결 질문
- 2026-11-05: Codex 모델 작동 상태 확인
- 2026-11-06: 빠플 프로젝트의 과거 요청·변경 이력 정리 및 지속 저장, 작업 취향 분석 요청

과거 대화 요청 원문이 GitHub에 없을 수 있으므로 위 내용은 접근 가능한 대화 정보를 요약한 것이다. 구현 완료/테스트 성공은 별도 확인 없이는 가정하지 않는다.

## 2026-11-06 — Sites 소스 동기화

요청: Sites 소스를 GitHub에 지속 보관하고 공동 작업자 ddnwls의 작업을 구분. 분류: 문서/소스 보관. 검증: 원본 Git 추적 파일을 복사하고 SHA-256 일치 확인. 서비스 코드·배포 변경 없음. 앱 실행 테스트 미실행.

변경 경로: `docs/codex-archive/sites-ddnwls/ppaplan-dial-study`. 원본 커밋: `d39006ed4dc3cf5c740f0a4e7e9deceabf135fc4`. 반영 커밋은 이 문서의 Git 이력에서 확인할 수 있음.

## 2026-11-06 — 기기별 입력 칸 겹침과 화면 넘침 수정

- 요청: `asnt39/ppapeul` 기준으로 기기마다 입력 칸이 다른 칸을 침범하거나 화면이 깨지는 문제 점검·수정.
- 분류: 오류/반응형 UI/테스트/문서. 변경: `public/index.html`, `public/responsive.css`, `tests/responsive.test.cjs`, `README.md`, 본 기록과 `ddnwls-contributions.md`.
- 수정: 좁은 화면 날짜 입력 전체 폭, 시간 입력 4열 배치, 메뉴 줄바꿈, 공통 폼·그리드 축소와 줄바꿈, 긴 과목명·기록·통계 넘침, 일일 목표·알람·설정 컨트롤 배치, 응원 버튼을 메뉴로 옮겨 입력 칸 가림 방지, 작은 화면 응원 패널 높이 제한.
- 검증 성공: Chromium 320~1440px 16개 너비 × 7개 주요 화면 = 112조합의 넘침·입력 요소 겹침 검사, 실행 중 타이머 및 320×480 화면 응원 패널 검사. 계획 엔진/일일 목표/응원 기존 Node 테스트 3개 파일 통과. 대표 화면 스크린샷 확인.
- 검증 제한: 친구 화면은 가상 UI 데이터 사용. 실제 서버 API/알림 전송 및 iOS Safari·Android 실기기 검증 미실행. 프레임워크 전체 빌드 미실행(정적 HTML/CSS 배치 변경).
- 배포: 연결된 Sites 프로젝트 조회가 `project not found`로 거절되어 현재 계정으로 배포할 수 없음. GitHub 코드 반영과 운영 사이트 배포를 구분함.
