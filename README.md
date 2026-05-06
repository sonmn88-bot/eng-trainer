# 📚 English Trainer — 운영 매뉴얼

## 🚀 최초 설정

### 1. Firebase 설정
1. [Firebase Console](https://console.firebase.google.com) → 새 프로젝트 생성
2. Realtime Database 활성화 (테스트 모드로 시작)
3. 프로젝트 설정 → 앱 추가(웹) → 설정값 복사
4. `shared/db.js` 파일의 `FIREBASE_CONFIG` 부분에 붙여넣기

### 2. GitHub Pages 배포
1. GitHub 새 repo 생성 (`english-trainer`)
2. 이 폴더 전체를 repo에 업로드
3. Settings → Pages → Source: `main` 브랜치
4. 생성된 URL을 학생들에게 공유

---

## 🎵 리스닝 MP3 연결

MP3 파일을 `audio/2026-suneung/` 폴더에 이렇게 넣으세요:
```
audio/
└── 2026-suneung/
    ├── 01.mp3   (1번 문항)
    ├── 02.mp3   (2번 문항)
    ├── ...
    └── 16.mp3   (16-17번 문항, 파일명은 16.mp3)
```

**GitHub 파일 크기 제한 (100MB)** 때문에 MP3가 클 경우:
- jsDelivr CDN 사용: `listening.html`의 `audioSrc` 변수를
  `https://cdn.jsdelivr.net/gh/{유저명}/{repo명}/audio/2026-suneung/01.mp3` 형식으로 변경

---

## ➕ 새 단어장 추가

1. `data/words/` 폴더에 JS 파일 추가:
```js
// data/words/my-wordbook.js
window.MY_WORDBOOK = [
  ['abandon', '버리다', 'Day 01'],
  ['ability', '능력', 'Day 01'],
  // ...
];
```

2. `data/_index.js`의 `WORD_CATALOG` 배열에 항목 추가:
```js
{
  id:       'my-wordbook',
  name:     '나의 단어장',
  subname:  '설명',
  icon:     '📕',
  file:     'my-wordbook.js',
  varName:  'MY_WORDBOOK',
  color:    '#A78BFA',
  tag:      'NEW',
  tagColor: '#A78BFA',
  desc:     '설명 텍스트',
},
```

---

## ➕ 새 리스닝 회차 추가

1. `data/listening/` 폴더에 메타 JSON 파일 추가:
```
data/listening/2026-09-meta.json
```
파일 형식은 `2026-suneung-meta.json` 참고.

2. `audio/2026-09/` 폴더에 MP3 파일 업로드

3. `data/_index.js`의 `LISTENING_CATALOG` 배열에 항목 추가:
```js
{
  id:       '2026-09',
  name:     '2026학년도 9월 모의',
  subname:  '전국연합학력평가',
  icon:     '📝',
  metaFile: '2026-09-meta.json',
  audioDir: '2026-09',
  color:    '#60A5FA',
  tag:      '9모',
  tagColor: '#60A5FA',
  total:    17,
},
```

---

## 🗂 파일 구조

```
english-trainer/
├── index.html          ← 홈 (학생 로그인 + 모듈 선택)
├── vocab.html          ← 단어 모듈
├── listening.html      ← 리스닝 모듈
├── teacher.html        ← 선생님 대시보드
│
├── shared/
│   ├── theme.css       ← 디자인 시스템 (수정 시 전체 반영)
│   ├── utils.js        ← 공통 함수
│   └── db.js           ← Firebase 연결 ★ 여기에 설정값 입력
│
├── data/
│   ├── _index.js       ← 카탈로그 목록 ★ 추가 시 여기만 수정
│   ├── words/          ← 단어 데이터 JS 파일들
│   └── listening/      ← 리스닝 메타 JSON 파일들
│
└── audio/              ← MP3 파일들
    └── 2026-suneung/
        └── *.mp3
```

---

## 🔑 초기 비밀번호
- 선생님 비밀번호: **1234**
- 선생님 모드에서 변경 가능

---

## ⚠️ 주의사항
- EBS 리스닝 자료는 저작권이 있으므로 **비공개 repo** 또는 **비공개 URL** 운영 권장
- Firebase Realtime Database는 기본 1GB 저장 / 10GB 다운로드 무료
- GitHub Pages는 public repo 무료 / private repo는 유료 플랜 필요
  → 대안: Cloudflare Pages (private repo도 무료)-
