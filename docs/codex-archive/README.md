# 빠플 개발 기록 · Codex 아카이브

이 폴더는 **빠플(Ppapeul)** 프로젝트 전용입니다. 코드와 개발 기록을 보관할 정식 목적지는 `asnt39/ppapeul`이며, **그 외 Codex 프로젝트는 `ddnwls` 계정의 프로젝트 저장소**로 분리합니다.

## 기록 규칙

- 빠플 관련 요청, 코드·설계·테스트·오류·배포·UI 변경: 이 저장소
- 빠플과 무관한 Codex 작업: `ddnwls` 소유 저장소 (작업 유형/프로젝트별로 분리)
- 커밋 전: 비밀번호, 토큰, API 키, 개인 정보 제외
- 코드 수정은 가능한 한 관련 테스트 및 빌드 확인 후 반영하고, 실행하지 않은 테스트는 성공했다고 쓰지 않기
- 기존 빠플 소스가 `ddnwls/fast`에 남아 있더라도 이를 자동 삭제하거나 여기로 강제 덮어쓰지 않음
- 타인이 소유한 공유 저장소이므로 외부 프로젝트 소스를 이 저장소에 넣지 않음

## 과거 이력 (GitHub에 확인된 범위)

### asnt39/ppapeul

| 날짜 (KST) | 분류 | 내용 | 커밋 |
| --- | --- | --- | --- |
| 2026-11-03 18:16 | 초기/기능 | 원본 빠플 HTML 추가 | [255fa94](https://github.com/asnt39/ppapeul/commit/255fa94e75ceb28a94305e0c8cc6eca7c9091f5f) |
| 2026-11-03 23:53 | 기능/업데이트 | 현재 호스팅 버전 반영 | [7ec25a7](https://github.com/asnt39/ppapeul/commit/7ec25a7618cb1931f606ac15ad3c63599696a46b) |
| 2026-11-04 08:34 | 유지보수 | 사용하지 않는 original.jsx 프로토타입 제거 | [ec4606c](https://github.com/asnt39/ppapeul/commit/ec4606cf704a92460b826b7c32944e20da7f6e83) |
| 2026-11-04 08:34 | 문서 | README를 확인된 프로젝트 안내로 교체 | [c90c032](https://github.com/asnt39/ppapeul/commit/c90c032f126e8eacbd1e0cb513e8bfdedcc310d9) |
| 2026-11-06 13:48 | 자료/제출 | 프로젝트 제출용 압축 파일 추가 | [b5e9707](https://github.com/asnt39/ppapeul/commit/b5e9707707564cb906725690a9571d6738a1e89e) |

### ddnwls/fast에 남아 있는 과거 빠플 이력 (참조만)

| 날짜 (KST) | 분류 | 내용 | 커밋 |
| --- | --- | --- | --- |
| 2026-09-11 13:25 | 초기화 | 저장소 최초 커밋 | [c4af651](https://github.com/ddnwls/fast/commit/c4af651d8ed9bcd762a0663861a0e2b399dbf3d7) |
| 2026-11-03 18:46 | 기능 추가 | 빠플 공부 플래너 추가 | [6932220](https://github.com/ddnwls/fast/commit/6932220bfbec3e3a3f09ebc6e4331a1fec4aa8e5) |
| 2026-11-04 23:54 | 디자인/입력 UX | 터치식 시간 다이얼 및 플래너 디자인 조정 | [56c1fb3](https://github.com/ddnwls/fast/commit/56c1fb3bd0f23da18404c2f0583a68a03a4b2ccf) |
| 2026-11-05 00:10 | 되돌리기 | 다이얼·디자인 변경 이전의 플래너로 복원 | [86ebd5d](https://github.com/ddnwls/fast/commit/86ebd5d7afe202ff24aa937569e55202ad2674ee) |

> 이 표는 접근 가능한 GitHub의 2026-11-06 시점 커밋 9개를 재구성한 것입니다. Codex의 프롬프트/세션 전체 또는 커밋하지 않은 변경은 포함하지 않습니다. `ddnwls/fast`의 과거 빠플 코드를 이 저장소에 별도로 복제하지 않았습니다.

## 앞으로 자동 기록되는 범위

[자동 생성 이력](ppapeul-history.md)은 이 저장소의 새 GitHub 커밋이 `main`에 반영되면 워크플로가 갱신하도록 구성합니다. 이것은 Codex의 모든 개별 채팅 메시지를 자동 수집하는 기능이 아닙니다. GitHub에 반영되지 않은 Codex 수정이나 다른 저장소의 변경은 자동으로 기록되지 않습니다.

## 추가로 확인된 개발 요구 사항

- 아이패드/아이폰에서 PC를 켜지 않고 Codex/클라우드로 코드 수정
- HTML 흰 화면 현상의 원인 분석 및 수정 요청(2026-10-23, 해당 파일과 현재 저장소의 정확한 연결 상태 미검증)
- 빠플 웹사이트 링크에서 작업 가능한지 확인 요청(2026-10-31): https://ppaplan-study-chan-1030.neatsmile32770.chatgpt.site/
- Codex 접속/과금/모델 작동상태 관련 문의(2026-10-31~11-05)
- 기존 변경에 대한 검증 없이 배포 완료나 버그 해결로 표시하지 않음
