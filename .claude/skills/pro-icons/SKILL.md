---
name: pro-icons
description: 앱·웹 화면에 아이콘을 넣거나 바꿀 때 — 이모지·손으로 그린 SVG 대신 전문 아이콘 세트(Phosphor)만 쓰고, 굵기·크기·색·용기(배경 칸) 규칙을 맞춰 '디자이너가 만든' 수준으로 맞춤
---

# 전문 아이콘 스킬

모델이 직접 그린 SVG 경로와 이모지(🎯📖✏️)는 비율·선 굵기·광학 보정이 제각각이라 바로 'AI가 만든 티'가 난다.
아이콘은 **반드시 검증된 세트에서 원본 그대로** 가져온다. 경로를 직접 그리거나 고치지 않는다.

## 1. 세트: Phosphor Icons (MIT)
- 이유: 한 디자이너 팀이 6가지 굵기(thin·light·regular·bold·fill·duotone)를 같은 격자(256)로 설계 → 섞어도 일관됨. duotone이 다크 UI에서 고급스럽다.
- 받기: `npm pack @phosphor-icons/core@2.1.1 && mkdir ph && tar xzf phosphor-icons-core-2.1.1.tgz -C ph`
- 이름 찾기: https://phosphoricons.com 또는 `ls ph/package/assets/regular | grep 키워드`
- 대안이 필요하면 Lucide(ISC)만. 한 앱에서 두 세트를 섞지 않는다.

## 2. 앱에 넣는 법 (빌드 없는 HTML 앱)
1. 쓰는 아이콘을 `icons.txt`에 적는다 (`이름` = regular, `이름:fill`, `이름:duotone`).
2. `python3 .claude/skills/pro-icons/build_icons.py ph/package/assets .claude/skills/pro-icons/icons.txt > shared/icons.js`
3. `<head>`에 `<script src="shared/icons.js"></script>` (다른 스크립트보다 먼저).
4. HTML: `<i data-icon="moon"></i>` → 자동으로 SVG로 바뀜. JS 문자열: `Icon('bookmark-simple-fill')`.
- 동적으로 넣은 HTML에 `data-icon`을 쓰면 `Icon.hydrate(그요소)`를 호출. 가능하면 JS에서는 `Icon()`을 직접 쓴다.

## 2-1. 이모지 자동 교체 (기존 앱 정리용)
- `emoji_map.txt`에 "이모지 아이콘[:weight] 톤"을 적고 `build_icons.py ph/package/assets icons.txt emoji_map.txt > shared/icons.js`.
- icons.js가 화면에 그려지는 텍스트(정적 HTML·innerHTML·textContent·DB에서 온 칭호까지)를 감시해 이모지를 컬러 아이콘으로 바꾼다. 데이터·소스는 그대로 둬도 됨.
- 제외: input·textarea·option·title, `data-no-icon` 붙은 영역, 표에 없는 이모지(캐릭터 등 콘텐츠).
- 검사: 화면 텍스트 노드에서 이모지를 찾는 스크립트로 남은 것을 확인(체크·화살표 기호는 글자로 둬도 됨).

## 2-2. 색감 (선만 있으면 허전할 때)
- 의미 있는 자리(섹션 제목, 미션, 모드 타일, 보상)는 duotone + 톤 색. 톤은 의미별로 고정: lime 주기능 · amber 보상 · green 성공 · blue 학습도구 · purple 음악/놀이 · pink 축하 · red 경고 · muted 보조.
- 버튼 안·툴바는 단색 regular. 한 줄에 톤 3가지 이상 섞지 않는다.

## 3. 굵기 규칙 (한 화면 안에서 지킴)
| 자리 | 굵기 |
|---|---|
| 헤더·툴바·입력칸 안 아이콘 | regular |
| 켜짐 상태(북마크됨, 고정됨, 현재 탭) | fill — 같은 아이콘의 fill 버전으로 바꾸는 것만으로 상태 표시 |
| 메뉴 타일·모드 선택·빈 화면 일러스트 | duotone |
| 로고 마크 | duotone 또는 fill 1개 |

## 4. 크기·간격
- 4의 배수: 16(글자 옆) · 20(버튼 안) · 24(탭바·타일) · 28~32(빈 화면).
- 터치 영역은 아이콘 크기와 별개로 44×44px 이상.
- 글자 옆 아이콘은 `gap: 6px`, 세로 가운데 정렬. 아이콘과 글자 색은 같게(보조 정보면 둘 다 txt2).

## 5. 색·용기(배경 칸)
- 기본은 `currentColor` 한 색. 강조색은 활성 상태·주 동작에만.
- 타일 아이콘은 용기에 담는다: 36~40px 정사각, 라운드는 DESIGN.md의 작은 단계, 배경 = 강조색 10~12% 투명, 아이콘 = 강조색. 한 화면의 용기는 모두 같은 크기·같은 라운드.
- 여러 항목(단어장 등)을 아이콘으로 구분하지 말 것 — 의미 없는 그림 고르기가 유치함의 원인. 대신 **색 점 / 이니셜 모노그램 / 숫자**로 구분.

## 6. 하지 않는 것
- UI에 이모지 (토스트 문구·축하 화면·카톡 공유 문구는 예외)
- 모델이 직접 그린 `<path d=...>` 아이콘, 세트 아이콘을 늘이거나 일부만 잘라 쓰기
- 한 화면에서 굵기 3종 이상 섞기, 아이콘마다 다른 색
- 과녁·로켓·전구·불꽃처럼 '열심히'를 상징하는 상투적 은유를 장식으로 남발
- 모든 버튼에 아이콘 붙이기 — 글자만으로 분명하면 아이콘 생략

## 7. 검사
- `grep -nP '[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]' *.html` 로 UI 이모지 남은 곳 확인 (문구 예외 제외).
- 390px 스크린샷에서 아이콘 굵기·크기가 한 줄에서 들쭉날쭉하지 않은지 본다.
- 라이선스: Phosphor MIT — icons.js 머리 주석에 출처를 남긴다.
