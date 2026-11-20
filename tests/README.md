# 배포 전 점검

```bash
bash tests/run.sh            # 정적 검사 + 에뮬레이터 실동작 검사 (약 2분)
node tests/static-check.js   # 정적 검사만 (몇 초)
```

- **정적 검사** (`static-check.js`): HTML `<script>` 개수·인라인 스크립트 문법, 공용 JS·단어 데이터 문법, `theme.css` 선택자가 사라지지 않았는지(`css-baseline.txt`와 비교), 단어장 개수·주차 구조.
  - CSS를 **일부러** 지운 경우에만 `node tests/static-check.js --update-css`로 기준을 갱신한다.
- **실동작 검사** (`e2e.js`): Firebase 에뮬레이터 + 실제 화면으로 로그인·보안 전환, `database.rules.json` 권한, 북마크·폴더 해제, 선생님 메시지 읽음.
  운영 DB에는 접속하지 않는다. 앱은 `window.__FB_EMU`가 있을 때만 에뮬레이터에 연결한다.
- 필요: node, python3, java, playwright. Firebase SDK 사본은 처음 실행 때 `tests/.cache/`에 받는다(커밋 안 함).
