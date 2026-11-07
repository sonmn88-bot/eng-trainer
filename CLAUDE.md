# English Trainer (eng-trainer)

수능 영어 단어 학습 웹앱. 선생님(관리자) 1명 + 수강 학생들이 실제로 사용 중.
- 배포: GitHub Pages (`main` 브랜치) → https://sonmn88-bot.github.io/eng-trainer
- 데이터: Firebase Realtime Database (`eng-trainer-65cac`)
- 스택: 순수 HTML/CSS/JS (빌드 없음)

## 로그인·보안 (2026-11 적용)
- Firebase Auth(이메일/비밀번호). 학생: 이름 → `loginIndex/{이름키}` → 내부 이메일 `{학생ID}[.v버전]@students.eng-trainer.app`. 선생님: `teacher@eng-trainer.app`, 관리자는 `admins/{uid}: true`
- DB 규칙 `database.rules.json`: 학생은 `students/{id}/uid`가 자기 uid인 데이터만, 관리자는 전체. `settings`만 공개 읽기
- 규칙 배포: `npx firebase-tools deploy --only database --project eng-trainer-65cac` (규칙 바꾸면 에뮬레이터로 먼저 검증)
- 비밀번호는 DB에 저장하지 않음. 학생 비번 초기화는 `DB.resetStudentLogin` (다음 입장 때 학생이 새로 만듦)
- 새 학생 데이터 경로를 만들면 `database.rules.json`에 `$sid` 소유자 규칙을 꼭 추가 (안 하면 관리자만 접근 가능)

## 파일 구조
- `index.html` 메인·로그인, `vocab.html` 단어 학습, `teacher.html` 선생님 대시보드, `listening.html` 듣기
- `shared/` 공통: `db.js`(Firebase), `utils.js`, `theme.css`
- `data/_index.js` 단어 데이터 목록, `data/words/*.js` 단어 세트(core-essential, confuse-pairs 등), `data/listening/`
- `audio/` 듣기 음원
## 수능 핵심 필수 단어장 (2026-11 리뉴얼)
- `data/words/core-essential.js`: 1,800개 · 12주 × 150 · `Day N` = 주차. 1주차가 가장 중요(S등급), 주 안에서는 알파벳순. 이전 버전(2,283개·알파벳순 16주)은 `data/archive/core-essential-v1.js`
- 개수를 바꾸면 `data/_index.js`의 `wordCount`·`totalWords`·`desc`도 같이 고칠 것 (목록 화면이 `wordCount`를 씀)
- 학생 북마크·내 단어·학습기록은 단어 문자열 기준이라 단어장을 바꿔도 유지됨 (북마크 화면은 단어장 소속과 무관하게 표시)
- 선생님 '이번 주 시험 범위'는 (단어장, 주차)로 저장됨 → 주차 구성을 바꾸면 시험 범위를 다시 지정해야 함

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
- 스티커/메모 Firebase 경로 불일치 → 읽음 상태 미갱신 (2026-11 수정: 팝업 닫으면 안 읽은 메시지 전부 `DB.markStickersRead`로 처리, 기기에서만 본 메시지는 다음 접속 때 서버에 다시 기록. 최신 1개만 처리하면 재발)
- 결석 배지가 `lastSeen` / `lastActive` 다른 필드를 써서 `daysSince` 오계산
- 시험지 인쇄 레이아웃이 A4 페이지 넘침
- 북마크 해제 어긋남 (2026-11 수정): 북마크 키는 소문자, 해제는 `unbookmarkWord`(전체 북마크 + 모든 폴더 동시 제거). 폴더 화면의 '폴더에서 빼기'만 폴더 단독 제거. 단어 문자열로 북마크를 찾을 땐 항상 소문자 기준 목록(`bookmarks`)을 쓰고 DB 원본 키를 그대로 대입하지 말 것
- CSS 구간을 주석 마커 사이로 통째로 교체하면 사이에 있던 다른 규칙(.list-item, .empty, .ex-box, 리스닝 플레이어 등)이 같이 지워짐 → CSS를 고친 뒤 원본과 선택자 목록을 비교해 사라진 것이 없는지 확인
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
