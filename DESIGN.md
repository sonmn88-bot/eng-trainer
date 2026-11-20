# DESIGN.md — English Trainer

기준 톤: **노선도 라이트 (Transit Light)** — speak-daily(`sonmn88-bot/speak-daily` DESIGN.md)와 같은 디자인 (2026-11 전환).
따뜻한 오프화이트 바탕 + 노선색 초록 하나, 그림자 대신 1px 선, 각진 모서리. 기본은 라이트, 다크는 같은 초록 계열.
토큰은 `shared/theme.css` 맨 끝 "노선도 라이트" 구간(`:root`=다크, `[data-theme="light"]`=라이트). 새 색을 하드코딩하지 말고 토큰을 쓴다.
(라임색 rgba는 `rgba(var(--acc-rgb),α)`로 쓴다. 캔버스는 CSS 변수를 못 읽으니 `getComputedStyle`로 `--gold` 값을 읽는다.)

## 색 토큰 (라이트 / 다크)
| 역할 | 라이트 | 다크 |
|---|---|---|
| 바탕 `--bg` | #F7F7F4 | #121412 |
| 표면 `--sur` / `--sur2` / `--sur3` | #FFF / #EFEFEA / #E7E7E1 | #1C1F1C / #242824 / #2C302C |
| 선 `--bdr` / `--track` | #E0E0DA / #D5D6D0 | #2E322E / #3A3F3A |
| 글자 `--txt` / `--txt2` / `--txt3` | #151515 / #62625C / #6E6E67 | #ECECE6 / #A6A69E / #8E8E86 |
| 강조 `--gold`(이름은 호환용, 실제 초록) / `--on-gold` | #1E6B52 / #FFF | #4FC08D / #0E1210 |
| 해야 할 일 `--due` (시험·NEW) | #F2C230 | 같음 |
| 채점 `--grn` `--amb` `--red` | #1E6B52 / #9A6410 / #B8392A | |
- 아이콘 색은 초록(주 기능)·노랑(할 일)·빨강(경고)만. 파랑·보라·분홍 톤은 회색(`--txt2`)으로 통일됨.
- 단어장 색(`WORD_CATALOG[].color`)은 목록 왼쪽 점에만. 태그 글자는 회색 칩.

## 글꼴
- 한글 Pretendard, 영어 단어·숫자는 Archivo(`--font-display`/`--font-mono`, 폭 80~85%, 800), 영어 문장 Inter(`--font-en`). 숫자는 `tabular-nums`.
- 영어 단어 기울임 금지. 한글에 넓은 자간 금지(`.sec-title`은 13px·자간 0).

## 모양
- 모서리: 칩 4px(`--r-chip`) · 버튼·입력 6px(`--rs`) · 카드 8px(`--r`) · 바텀시트 12px(`--rx`). 그림자 없음.
- 버튼: `.btn-gold`(초록 채움)는 한 화면에 하나 / `.btn`(옅은 면) / `.btn-ghost`(글자만).

## 노선도
- 주차 = 노선 번호 배지(`.wbadge`), 진도 = 정거장(`Utils.routeHtml`, `.route`). 지금 주차 `cur`(초록 채움), 맞힌 비율 80%↑ `pass`(초록 테두리), 시험 주차 노란 "시험" 표시.
- 쓰는 곳: 홈 '이번 주 시험 범위' 카드, 단어장 주차 선택 화면.

## 모션
- 곡선 `cubic-bezier(.2,.8,.2,1)`, 길이 150~200ms. `transform`·`opacity`만.
- 채점·다음 버튼처럼 자주 누르는 것은 즉시. 누름 느낌은 `:active { transform: scale(.98) }`.
- 호버 시 떠오르기(translateY)·확대 금지. 무한 반복 애니메이션은 로딩 자리표시에만.
- `prefers-reduced-motion`에서 모두 끈다(theme.css 하단).

## 아이콘 세트
- Phosphor Icons만 사용 (`shared/icons.js`, 스킬 `.claude/skills/pro-icons`). 직접 그린 SVG·이모지 아이콘 금지.
- 단어장 구분은 색 점, 세트 헤더 아이콘은 초록(`--gold`).

## 이모지 처리 (4차)
- 화면의 이모지는 `shared/icons.js`가 그려질 때 자동으로 Phosphor 컬러 아이콘으로 바꾼다. 대응표: `.claude/skills/pro-icons/emoji_map.txt`.
- 새 이모지를 쓰게 되면 대응표에 한 줄 추가 후 `build_icons.py` 재실행. 상점 캐릭터·테마처럼 이모지 자체가 콘텐츠인 것은 표에 넣지 않는다.
- 톤: lime=초록(주 기능) · amber(보상·할 일) · green(성공) · red(경고·삭제) · blue/purple/pink/muted는 회색으로 보임.
- 글자 최소 11px.

## 이 앱에서 하지 않는 것
- 한 화면에 초록 채움 버튼 두 개 이상, 그라데이션 배경·글자, 글로우, 그림자 카드
- 똑같은 카드 그리드로 목록 나열 → 한 줄 행 + 1px 구분선
- 100vh(→ 100dvh), 44px 미만 터치 영역, 16px 미만 입력 글자, 11px 미만 글자
