# English Trainer (eng-trainer)

수능 영어 단어 학습 웹앱. 선생님(관리자) 1명 + 수강 학생들이 실제로 사용 중.
- 배포: GitHub Pages (`main` 브랜치) → https://sonmn88-bot.github.io/eng-trainer
- 데이터: Firebase Realtime Database (`eng-trainer-65cac`)
- 스택: 순수 HTML/CSS/JS (빌드 없음)

## 파일 구조
- `index.html` 메인·로그인, `vocab.html` 단어 학습, `teacher.html` 선생님 대시보드, `listening.html` 듣기
- `shared/` 공통: `db.js`(Firebase), `utils.js`, `theme.css`
- `data/_index.js` 단어 데이터 목록, `data/words/*.js` 단어 세트(core-essential, confuse-pairs 등), `data/listening/`
- `audio/` 듣기 음원

## 사용 실태 (우선순위 판단 기준)
- 기기: 폰 > 아이패드 > 갤럭시탭 → 모바일 우선
- 거의 단어 학습 전용. 주 150개 수능핵심필수 암기, 북마크로 다시 보기, 내 단어 등록
- 듣기·약점/복습·상점(골드)은 거의 안 씀 → 크게 손대지 말 것
- 예정: 학생 화면을 Focus Dark(어두운 배경+라임 포인트) 스타일로 리뉴얼

## 필수 코딩 규칙 (예외 없음)
1. JS 문자열 안 HTML 닫는 태그는 반드시 이스케이프: `<\/script>` `<\/body>` `<\/html>`
2. 수정 후 `<script>` 열림/닫힘 개수 일치 확인
3. `<!DOCTYPE>` 앞이나 `<script>` 밖에 코드가 노출되지 않게
4. 수정한 JS는 `node --check`로 문법 검사 (HTML 안 스크립트는 추출해서 검사)
5. 새 함수는 정의 위치·스코프 확인, 정의 전 참조 금지

## 반복됐던 버그 (재발 금지)
- 함수 삭제 후 남은 `async` 키워드 → `async is not defined`
- `WORD_CATALOG`는 `window.WORD_CATALOG`로 접근 가능해야 함 (`const`로 선언 금지)
- 스티커/메모 Firebase 경로 불일치 → 읽음 상태 미갱신
- 결석 배지가 `lastSeen` / `lastActive` 다른 필드를 써서 `daysSince` 오계산
- 시험지 인쇄 레이아웃이 A4 페이지 넘침
- 디자인 수정 시 지적받은 곳만 고치고 같은 유형을 놓쳐 사용자가 다시 말하게 함 → 아래 "디자인 수정 규칙" 필수

## 디자인 수정 규칙 (사용자가 같은 말을 두 번 하지 않게)
- 지적 하나를 받으면 **같은 유형 전체**를 찾아 함께 고친다 (예: 아이콘+글 정렬 → 공지·복습·출석·미션·도움말·목록 전부).
- 아이콘+글 한 줄: 아이콘은 **제목(또는 제목+설명 묶음)과 세로 가운데**. 진행 막대·부가 줄은 그 줄 밖으로 분리하고 글 시작선에 맞춰 들여쓴다.
- 보고 전 검사: 가짜 데이터로 모든 카드·배너가 보이게 띄운 뒤 **확대 캡처**로 아이콘↔글 수평, 간격(4px 단위), 글자 최소 11px를 하나씩 확인. 확인 못 한 곳은 "확인 못 함"으로 보고.
- 미리보기 캡처는 실제 글꼴(Pretendard)을 로드한 상태로 찍는다 (`npm pack pretendard` 후 Playwright route로 CDN 요청을 로컬 파일로 연결). 대체 글꼴로 찍으면 줄 높이가 달라 정렬 오류를 놓친다.
- 목록 항목(아이콘+여러 줄)은 아이콘을 **항목 전체**의 세로 가운데에 두고, 진행 막대도 글 칸 안에 넣어 아이콘 아래 빈 공간이 생기지 않게 한다.
- 디자인 기준은 `DESIGN.md`, 아이콘은 `.claude/skills/pro-icons` 스킬.

## 작업 방식
- 필요한 함수·부분만 수정. 파일 전체 재작성 금지
- 작업할 때 필요한 파일만 읽기 (저장소 전체 훑기 금지)
- 작업은 브랜치에서 하고, 사용자가 "배포해줘"라고 할 때만 `main`에 반영
- 비밀번호·학생 개인정보를 코드에 넣지 말 것 (Firebase에만 보관)
- 답변은 결론 먼저, 짧게, 한국어로
