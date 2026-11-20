// 실동작 검사: Firebase 에뮬레이터 + 실제 화면(Playwright)으로 로그인·보안 규칙·북마크·메시지 읽음을 확인
// tests/run.sh 가 에뮬레이터와 정적 서버를 띄운 뒤 실행한다. 운영 DB에는 접속하지 않는다.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BASE = process.env.BASE_URL || 'http://localhost:8765';
const SDK = process.env.FIREBASE_SDK_DIR;                  // firebase@10.12.0 패키지 폴더 (run.sh가 준비)
const NS = 'ns=eng-trainer-65cac-default-rtdb';
const DBU = 'http://127.0.0.1:9000';
const AUTHU = 'http://127.0.0.1:9099';
const STRICT = fs.readFileSync(path.join(ROOT, 'database.rules.json'), 'utf8');
const OPEN = '{"rules":{".read":true,".write":true}}';

let pass = 0, fail = 0;
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); c ? pass++ : fail++; };
const rest = async (p, opt = {}) => {
  const r = await fetch(`${DBU}/${p}.json?${NS}`, {
    method: opt.method || 'GET', body: opt.body,
    headers: opt.owner ? { Authorization: 'Bearer owner' } : {},
  });
  return [r.status, await r.text()];
};
const getJ = async (p) => JSON.parse((await rest(p, { owner: true }))[1]);
const setRules = (r) => rest('.settings/rules', { owner: true, method: 'PUT', body: r });
async function reset(seed) {
  await setRules(OPEN);
  await rest('', { owner: true, method: 'PUT', body: JSON.stringify(seed) });
  await fetch(`${AUTHU}/emulator/v1/projects/eng-trainer-65cac/accounts`, { method: 'DELETE' });
}

let browser;
async function page() {
  const c = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await c.addInitScript(() => { window.__FB_EMU = true; localStorage.setItem('onboarding_done', '1'); });
  await c.route(/gstatic\.com\/firebasejs\/10\.12\.0\/(.*)$/, (r) =>
    r.fulfill({ path: path.join(SDK, r.request().url().split('/10.12.0/')[1]), contentType: 'application/javascript' }));
  await c.route(/^https:\/\/(cdn\.jsdelivr\.net|fonts\.googleapis\.com|fonts\.gstatic\.com)/, (r) => r.abort());
  const p = await c.newPage();
  p._errs = [];
  p.on('pageerror', (e) => p._errs.push(e.message));
  p.on('dialog', (d) => d.accept());
  return p;
}
async function studentLogin(p, name, pw, pw2) {
  await p.goto(BASE + '/index.html'); await p.waitForTimeout(1500);
  await p.fill('#stu-input', name); await p.fill('#stu-pw-input', pw);
  await p.evaluate(() => doStuLogin()); await p.waitForTimeout(1500);
  if (pw2) { await p.fill('#stu-pw2-input', pw2); await p.evaluate(() => doStuLogin()); }
  await p.waitForTimeout(2500);
  return p.isVisible('#view-main');
}
async function teacherToDashboard(p, pw) {
  await p.goto(BASE + '/index.html'); await p.waitForTimeout(1500);
  await p.evaluate((pw) => { goTeacher(); document.getElementById('pw-input').value = pw; doLogin(); }, pw);
  await p.waitForURL(/teacher\.html/, { timeout: 15000 }).catch(() => {});
  await p.waitForTimeout(2500);
  return p.url().includes('teacher.html');
}

const BASE_SEED = {
  settings: { appName: 'T', teacherPw: 'tpw1234' },
  students: {
    stu_1: { id: 'stu_1', name: '가나다', password: 'abcd' },
    stu_2: { id: 'stu_2', name: '라마바' },
    stu_3: { id: 'stu_3', name: '사아자', password: '9999' },
  },
  results: { stu_1: { r1: { setId: 'core', score: 80, total: 20 } }, stu_2: { r1: { setId: 'core', score: 50, total: 20 } } },
  notice: { text: '공지' },
};

async function securitySuite() {
  console.log('\n## 로그인·보안 전환');
  await reset(BASE_SEED);
  // 전환 전: 학생이 먼저 들어와도 계정이 생겨야 함
  ok(!(await studentLogin(await page(), '사아자', '0000')), '전환 전: 기존 비번 틀리면 거부');
  ok(await studentLogin(await page(), '사아자', '9999'), '전환 전: 기존 비번으로 입장 + 계정 자동 생성');
  const t = await page();
  await t.goto(BASE + '/index.html'); await t.waitForTimeout(1500);
  ok((await t.evaluate(() => DB.teacherLogin('wrong'))) === false, '선생님 틀린 비번 거부');
  ok(await teacherToDashboard(t, 'tpw1234'), '선생님 첫 로그인(계정 자동 생성) → 선생님 화면');
  await t.evaluate(() => runAuthMigration()); await t.waitForTimeout(6000);
  const msg = await t.evaluate(() => document.getElementById('migrate-msg').textContent);
  ok(/계정 생성 1명/.test(msg) && /첫 입장 때 설정 1명/.test(msg) && /이미 전환 1명/.test(msg), '보안 전환 결과: ' + msg.replace(/\s+/g, ' '));
  const st = await getJ('students');
  ok(!st.stu_1.password && !st.stu_3.password && st.stu_1.uid && st.stu_3.uid && !st.stu_2.uid, 'DB에서 평문 비번 삭제 + uid 연결');
  ok((await rest('settings/teacherPw', { owner: true }))[1] === 'null', '선생님 평문 비번 삭제');
  ok(!t._errs.length, '선생님 화면 오류 없음 ' + t._errs.join('|'));

  console.log('\n## 엄격 규칙');
  await setRules(STRICT);
  for (const [pth, want] of [['students', false], ['results', false], ['loginIndex', false], ['settings', true], ['notice', false]]) {
    const [c] = await rest(pth);
    ok(want ? c === 200 : (c === 401 || c === 403), `로그인 없이 ${pth} 읽기 ${want ? '허용' : '차단'} (${c})`);
  }
  const [c3, v3] = await rest('loginIndex/' + encodeURIComponent(encodeURIComponent('가나다')));
  ok(c3 === 200 && v3.includes('stu_1'), '이름 하나 조회는 허용');
  const a = await page();
  ok(!(await studentLogin(a, '가나다', 'zzzz')) && /틀렸/.test(await a.textContent('#stu-err')), '학생 틀린 비번 → 오류');
  ok(await studentLogin(a, '가나다', 'abcd'), '학생 A 입장');
  ok(await a.evaluate(async () => { try { await DB.getResults('stu_1'); return true; } catch (e) { return false; } }), 'A 자기 기록 읽기');
  ok(await a.evaluate(async () => { try { await DB.getResults('stu_2'); return false; } catch (e) { return /permission/i.test(e.message); } }), 'A가 다른 학생 기록 읽기 차단');
  ok(await a.evaluate(async () => { try { await DB.saveResult('stu_2', { x: 1 }); return false; } catch (e) { return true; } }), 'A가 다른 학생 이름으로 쓰기 차단');
  ok(await a.evaluate(async () => { try { const { db, ref, set } = await initDB(); await set(ref(db, 'admins/' + (await DB.currentUid())), true); return false; } catch (e) { return true; } }), '학생이 스스로 관리자 등록 차단');
  await a.reload(); await a.waitForTimeout(3000);
  ok(await a.isVisible('#view-main'), '새로고침해도 로그인 유지');
  await a.goto(BASE + '/vocab.html?stu=stu_1&name=x'); await a.waitForTimeout(2000);
  ok((await a.evaluate(async () => { try { await DB.saveResult('stu_1', { setId: 'core', score: 90, total: 20 }); await DB.markCorrect('stu_1', 'abandon'); return true; } catch (e) { return e.message; } })) === true, '단어 학습 화면에서 자기 기록·맞힌 단어 저장');
  ok(!a._errs.length, '학생 화면 오류 없음 ' + a._errs.join('|'));
  const b = await page();
  await b.goto(BASE + '/index.html'); await b.waitForTimeout(1500);
  await b.fill('#stu-input', '라마바'); await b.fill('#stu-pw-input', '1111');
  await b.evaluate(() => doStuLogin()); await b.waitForTimeout(1500);
  ok(await b.isVisible('#stu-pw2-wrap'), '비번 없던 학생 첫 입장 → 확인칸 표시');
  await b.fill('#stu-pw2-input', '1111'); await b.evaluate(() => doStuLogin()); await b.waitForTimeout(2500);
  ok(await b.isVisible('#view-main'), '비번 만들고 입장');
  ok(!(await studentLogin(await page(), '라마바', '2222')), '계정 생긴 뒤엔 다른 비번으로 못 들어감');
  const x = await page();
  await studentLogin(x, '없는학생', '1');
  ok(/등록되지 않은/.test(await x.textContent('#stu-err')), '없는 이름 안내');
  const t2 = await page();
  ok(await teacherToDashboard(t2, 'tpw1234'), '엄격 규칙에서 선생님 로그인');
  ok(await t2.evaluate(async () => Object.keys(await DB.getStudents()).length === 3), '선생님 학생 전체 읽기');
  await t2.evaluate(() => DB.resetStudentLogin('stu_2'));
  ok(await studentLogin(await page(), '라마바', '5555', '5555'), '비번 초기화 후 학생이 새로 만들고 입장');
  // ── 코드 리뷰에서 찾은 문제들 (재발 방지) ──
  const newId = await t2.evaluate(async () => { const id = await DB.createStudent('차카타'); await DB.registerLogin(id, '차카타'); return id; });
  ok(await a.evaluate(async (id) => { try { const { db, ref, set } = await initDB(); await set(ref(db, 'students/' + id + '/uid'), await DB.currentUid()); return false; } catch (e) { return true; } }, newId),
    '다른 학생(아직 첫 입장 전) 계정에 내 uid를 붙여 가로채기 차단');
  await fetch(`${AUTHU}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: newId + '@students.eng-trainer.app', password: 'etrn::7777', returnSecureToken: true }) });
  ok(await studentLogin(await page(), '차카타', '7777', '7777'), '첫 입장이 계정만 만들고 끊겼어도 같은 비번으로 다시 하면 연결됨');
  await t2.evaluate(() => DB.migrateAllToAuth());
  const li = await getJ('loginIndex/' + encodeURIComponent(encodeURIComponent('라마바'))); // DB 키 자체가 URI 인코딩이라 REST 경로는 한 번 더
  ok(li && li.ver === 1 && li.ready === true, '보안 전환을 다시 실행해도 초기화된 학생 버전 유지 (ver ' + (li && li.ver) + ')');
  ok(await studentLogin(await page(), '라마바', '5555'), '…그 학생은 새 비번으로 계속 입장');
  await rest('students/stu_noname', { owner: true, method: 'PUT', body: JSON.stringify({ id: 'stu_noname' }) });
  const liBefore = Object.keys(await getJ('loginIndex')).length;
  const resetMsg = await t2.evaluate(() => DB.resetStudentLogin('stu_noname').then(() => 'ok', (e) => e.message));
  ok(resetMsg !== 'ok' && Object.keys(await getJ('loginIndex')).length === liBefore, '이름 없는 학생 초기화는 막히고 로그인 목록 유지');
  ok(await t2.evaluate(() => DB.registerLogin('stu_3', '가나다').then(() => false, () => true)), '다른 학생 이름으로 로그인 등록 시 거부');
  ok(await a.evaluate(() => DB.changeMyPassword('wrong', 'abcd22').then(() => false, () => true)), '학생 비번 변경: 현재 비번 틀리면 거부');
  ok(await a.evaluate(() => DB.changeMyPassword('abcd', 'abcd22').then(() => true, (e) => e.code)) === true, '학생 비번 변경: 현재 비번 맞으면 변경');
  ok(await studentLogin(await page(), '가나다', 'abcd22'), '…새 비번으로 입장');
  // ── 오류 기록·전체 백업 ──
  await a.evaluate(() => DB.logError('테스트', new Error('테스트 오류 123')));
  await a.waitForTimeout(1500);
  const day = new Date().toISOString().slice(0, 10);
  const errs = Object.values((await getJ('errors/' + day)) || {});
  ok(errs.some((e) => e.msg === '테스트 오류 123' && e.page && e.t), '학생 화면 오류가 errors/{날짜}에 기록됨');
  const [ce] = await rest('errors/' + day + '/x', { method: 'PUT', body: JSON.stringify({ t: 1, msg: 'x', page: 'p' }) });
  ok(ce === 401 || ce === 403, '로그인 없이 오류 기록 쓰기 차단 (' + ce + ')');
  ok(await a.evaluate(async (day) => { try { const { db, ref, set } = await initDB(); await set(ref(db, 'errors/' + day + '/zz'), { t: 1, msg: 'x', page: 'p', extra: 'no' }); return false; } catch (e) { return true; } }, day), '정해진 항목 외 필드는 거부');
  ok(await a.evaluate(async () => { try { await DB.getErrors(7); return false; } catch (e) { return true; } }), '학생은 오류 기록을 읽을 수 없음');
  await t2.evaluate(() => { switchT('settings'); }); await t2.waitForTimeout(2000);
  ok(/테스트 오류 123/.test(await t2.textContent('#error-list')), '선생님 설정 탭에 최근 오류 표시');
  const dump = await t2.evaluate(async () => { const d = await DB.exportAll(); return Object.keys(d); });
  ok(['students', 'results', 'loginIndex'].every((k) => dump.includes(k)), '전체 백업이 DB 전체를 담음 (' + dump.join(',') + ')');
  ok(/백업/.test(await t2.textContent('#ops-notice')), '백업 기록이 없으면 학생 탭 위에 백업 알림');
  ok((await t2.evaluate(async () => { try { await DB.changeTeacherPassword('tpw1234', 'newpw99'); return true; } catch (e) { return e.code; } })) === true, '선생님 비번 변경');
  const t3 = await page(); await t3.goto(BASE + '/index.html'); await t3.waitForTimeout(1500);
  ok((await t3.evaluate(() => DB.teacherLogin('tpw1234'))) === false, '옛 선생님 비번 거부');
  ok((await t3.evaluate(() => DB.teacherLogin('newpw99'))) === true, '새 선생님 비번 로그인');
}

// 학생 계정을 만든 뒤 엄격 규칙으로 바꿔 둔 상태에서 vocab 화면을 연다
async function studentVocab(seed) {
  await reset(seed);
  const p = await page();
  await studentLogin(p, '가나다', 'abcd');
  await setRules(STRICT);
  return p;
}

async function bookmarkSuite() {
  console.log('\n## 북마크·폴더');
  const wk = (w) => Buffer.from(w).toString('base64').replace(/=/g, '');
  const p = await studentVocab({
    settings: { appName: 'T' },
    students: { stu_1: { id: 'stu_1', name: '가나다', password: 'abcd' } },
    bookmarks: { stu_1: {
      Acquisition: { word: 'Acquisition', ko: '습득', addedAt: 1 },
      adapt: { word: 'adapt', ko: '적응', addedAt: 2 }, Adapt: { word: 'Adapt', ko: '적응', addedAt: 3 },
      abandon: { word: 'abandon', ko: '버리다', addedAt: 4 }, absorb: { word: 'absorb', ko: '흡수하다', addedAt: 5 },
    } },
    folders: { stu_1: {
      f1: { name: '3', words: { [wk('acquisition')]: { word: 'acquisition', ko: '습득' }, [wk('abandon')]: { word: 'abandon', ko: '버리다' }, [wk('absorb')]: { word: 'absorb', ko: '흡수하다' } } },
      f2: { name: '4', words: { [wk('abandon')]: { word: 'abandon', ko: '버리다' } } },
    } },
  });
  await p.goto(BASE + '/vocab.html?stu=stu_1&name=x'); await p.waitForTimeout(2000);
  await p.evaluate(() => { showView('folders'); return loadFolders(); }); await p.waitForTimeout(500);
  const bm = async () => Object.keys((await getJ('bookmarks/stu_1')) || {}).sort().join(',');
  const fo = async (f) => Object.values(((await getJ('folders/stu_1/' + f)) || {}).words || {}).map((x) => x.word).sort().join(',');
  ok((await p.evaluate(() => toggleBookmarkSmart('acquisition', '습득'))) === false, '대문자 키 북마크도 ☆로 해제됨');
  ok(!(await bm()).toLowerCase().includes('acquisition') && !(await fo('f1')).includes('acquisition'), '…전체 북마크와 폴더에서 함께 빠짐');
  await p.evaluate(() => toggleBookmarkSmart('adapt', '적응'));
  ok(!(await bm()).toLowerCase().includes('adapt'), '대소문자만 다른 중복 북마크도 모두 해제');
  await p.evaluate(() => toggleBookmarkSmart('abandon', '버리다'));
  ok(!(await fo('f1')).includes('abandon') && !(await fo('f2')).includes('abandon'), '해제하면 모든 폴더에서 빠짐');
  await p.evaluate(() => removeFromFolder('absorb', 'f1')); await p.waitForTimeout(500);
  ok((await bm()).includes('absorb') && !(await fo('f1')).includes('absorb'), '"폴더에서 빼기"는 그 폴더만, 전체 북마크는 유지');
  await p.evaluate(() => toggleBookmarkSmart('Abandon', '버리다'));
  ok((await bm()).split(',').includes('abandon'), '다시 추가하면 소문자 키로 저장');
  ok(!p._errs.length, '북마크 화면 오류 없음 ' + p._errs.join('|'));
}

async function stickerSuite() {
  console.log('\n## 선생님 메시지 읽음');
  await reset({
    settings: { appName: 'T' },
    students: { stu_1: { id: 'stu_1', name: '가나다', password: 'abcd' } },
    stickers: { stu_1: {
      sticker_1761000000001: { emoji: '👍', text: '잘했어요', sentAt: 1761000000001, read: false },
      sticker_1761000000002: { emoji: '🌟', text: '최고', sentAt: 1761000000002, read: false },
    } },
  });
  const p = await page();
  ok(await studentLogin(p, '가나다', 'abcd'), '학생 입장');
  ok(await p.isVisible('#sticker-popup'), '안 읽은 메시지 팝업');
  ok(/2개/.test(await p.textContent('#sticker-popup-more')), '팝업에 안 읽은 개수 표시');
  await setRules(STRICT);
  await p.click('#sticker-popup button'); await p.waitForTimeout(1500);
  const s = await getJ('stickers/stu_1');
  ok(Object.values(s).every((v) => v.read === true), '닫으면 안 읽은 메시지 전부 읽음 처리');
  const q = await page();
  ok(await studentLogin(q, '가나다', 'abcd') && !(await q.isVisible('#sticker-popup')), '다른 기기로 들어와도 다시 안 뜸');
}

async function chartSuite() {
  console.log('\n## 선생님 분석 차트');
  const core = fs.readFileSync(path.join(ROOT, 'data/words/core-essential.js'), 'utf8');
  const words = [...core.matchAll(/\[\s*'([^']+)'/g)].map((m) => m[1]);
  const t = await page();
  await t.goto(BASE + '/index.html'); await t.waitForTimeout(1000);
  const keys = await t.evaluate((ws) => ws.map((w) => DB._wordKey(w)), words);
  const cw = (n) => Object.fromEntries(keys.slice(0, n).map((k) => [k, 1]));
  const now = Date.now(), wk = 7 * 86400000;
  const res = (arr) => Object.fromEntries(arr.map(([ago, sc], i) => ['r' + i, { setId: 'core', score: sc, total: 20, date: new Date(now - ago * wk).toISOString() }]));
  await reset({
    settings: { appName: 'T', teacherPw: 'tpw1234' },
    students: {
      stu_1: { id: 'stu_1', name: '가나다', correctWords: cw(420) },
      stu_2: { id: 'stu_2', name: '라마바', correctWords: cw(80) },
      stu_3: { id: 'stu_3', name: '사아자' },
    },
    results: { stu_1: res([[0, 90], [1, 80], [3, 70], [5, 60]]), stu_2: res([[0, 50], [1, 40], [2, 65]]) },
    examRange: { setId: 'core', setName: '수능 핵심 필수', week: 2 },
  });
  if (process.env.PD_DIR) await t.context().route(/pretendard\/dist\/web\/static\/(.*)$/, (r) => r.fulfill({ path: path.join(process.env.PD_DIR, r.request().url().split('/static/')[1]) }));
  ok(await teacherToDashboard(t, 'tpw1234'), '선생님 화면');
  await t.evaluate(() => switchT('analysis')); await t.waitForTimeout(3500);
  const cells = await t.$$eval('.hm-cell', (e) => e.map((x) => x.className));
  ok(cells.length === 36, '진도 히트맵 학생 3 × 12주 = ' + cells.length);
  ok(/l5/.test(cells[0]) && /l5/.test(cells[1]) && !/l\d/.test(cells[35]), '맞힌 비율에 따라 칸 진하기 다름');
  await t.click('.hm-cell >> nth=0');
  ok(/가나다 · 1주차 · 맞힌 150\/150/.test(await t.textContent('#hm-detail')), '칸 누르면 학생·주차·개수 표시: ' + await t.textContent('#hm-detail'));
  ok((await t.$$('#trend-score .dot')).length === 5, '주간 평균 점수 점 5개(기록 있는 주)');
  ok((await t.$$('#trend-count .bar')).length === 5, '주간 퀴즈 수 막대 5개');
  if (process.env.SHOT_DIR) {
    for (const w of [390, 1280]) {
      await t.setViewportSize({ width: w, height: 900 }); await t.waitForTimeout(500);
      await (await t.$('#ts-progress')).screenshot({ path: path.join(process.env.SHOT_DIR, 'charts_' + w + '.png') });
    }
  }
  const tiny = await t.evaluate(() => { const out = []; for (const tab of ['students', 'analysis', 'exam', 'settings']) { switchT(tab);
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n;
    while ((n = w.nextNode())) { const e = n.parentElement; if (n.nodeValue.trim() && e && e.offsetParent && !e.closest('svg') && parseFloat(getComputedStyle(e).fontSize) < 11) out.push(n.nodeValue.trim().slice(0, 12)); } }
    switchT('analysis'); return out; });
  ok(!tiny.length, '선생님 화면 11px 미만 글자 없음 ' + tiny.slice(0, 5).join('|'));
  const route = await t.evaluate(() => {
    const wk = {}; for (let i = 1; i <= 12; i++) wk[i] = { words: [['w' + i, '뜻']] };
    const d = document.createElement('div'); d.innerHTML = Utils.routeHtml(wk, { cur: 3, exam: 3, correct: { [DB._wordKey('w1')]: 1 } });
    return [...d.querySelectorAll('li')].map((li) => li.className);
  });
  ok(route.length === 12 && route[0] === 'pass' && route[2] === 'cur exam' && route[1] === '', '노선도: 맞힌 주차 pass, 지금 주차 cur·시험 표시');
  ok(!t._errs.length, '분석 화면 오류 없음 ' + t._errs.join('|'));
}

async function swSuite() {
  console.log('\n## 서비스 워커 (재방문·끊김)');
  const p = await page();
  await p.context().addInitScript(() => { window.__SW_TEST = true; });
  await p.goto(BASE + '/index.html'); await p.waitForTimeout(2500);
  await p.reload(); await p.waitForTimeout(2000);
  ok(await p.evaluate(() => !!navigator.serviceWorker.controller), '서비스 워커가 화면을 맡음');
  const cached = await p.evaluate(async () => (await caches.keys()).length && (await (await caches.open((await caches.keys())[0])).keys()).length);
  ok(cached >= 7, '앱 기본 파일 저장됨 (' + cached + '개)');
  await p.context().setOffline(true);
  await p.reload().catch(() => {}); await p.waitForTimeout(2500);
  ok(await p.isVisible('#stu-input'), '인터넷이 끊겨도 첫 화면이 뜸');
  await p.context().setOffline(false);
  ok(!p._errs.filter((e) => !/fetch|network|offline/i.test(e)).length, '오류 없음 ' + p._errs.join('|'));
}

async function srsSuite() {
  console.log('\n## N회독 노선 (간격 반복)');
  // 1) 계산 규칙
  const p0 = await page();
  await p0.goto(BASE + '/index.html'); await p0.waitForTimeout(1200);
  const unit = await p0.evaluate(() => {
    const W = []; for (let i = 0; i < 60; i++) W.push(['w' + i, '뜻' + i, 'Day ' + (i < 30 ? 1 : 2)]);
    const t = 1000, k = (w) => DB._wordKey(w);
    const r = {};
    r.fresh = SRS.plan(W, {}, null, t).fresh.length;                                  // 처음: 새 단어 30
    const srs = {}; srs[k('w0')] = { s: 2, d: t };                                     // 오늘 복습 1개
    const p = SRS.plan(W, srs, null, t); r.locked = p.fresh.length; r.due = p.dueTotal; // 복습 남으면 새 단어 잠금
    r.after = SRS.plan(W, {}, { day: t, newDone: 30 }, t).fresh.length;              // 하루 30개 다 했으면 0
    r.up = JSON.stringify(SRS.next({ s: 2, d: t }, true, t));                         // 맞히면 3단계, 7일 뒤
    r.down = JSON.stringify(SRS.next({ s: 4, d: t }, false, t));                      // 틀리면 1단계, 내일
    r.grad = SRS.next({ s: 5, d: t }, true, t).s;
    const seed = SRS.seedFromCorrect(W, { [k('w1')]: 1, [k('w2')]: 1 }, t);
    r.seed = Object.values(seed).map((e) => e.s + ':' + (e.d - t)).join(',');
    return r;
  });
  ok(unit.fresh === 30, '처음엔 새 단어 30개');
  ok(unit.due === 1 && unit.locked === 0, '복습이 남아 있으면 새 단어 잠김');
  ok(unit.after === 0, '하루 새 단어 30개를 다 하면 더 안 나옴');
  ok(unit.up === '{"s":3,"d":1007}' && unit.down === '{"s":1,"d":1001}' && unit.grad === 6, '맞히면 단계↑(3단계=7일 뒤), 틀리면 1단계·내일, 6단계 졸업');
  ok(unit.seed === '2:1,2:2', '기존 학생: 맞힌 단어는 2단계로 시작, 복습일을 나눔');

  // 2) 실제 화면: 기존 학생(맞힌 단어 있음) → 홈 카드 → 복습 화면에서 새 단어 학습 → DB 저장
  const core = fs.readFileSync(path.join(ROOT, 'data/words/core-essential.js'), 'utf8');
  const words = [...core.matchAll(/\[\s*'([^']+)'/g)].map((m) => m[1]);
  const keys = await p0.evaluate((ws) => ws.map((w) => DB._wordKey(w)), words.slice(0, 5));
  await reset({ settings: { appName: 'T' }, students: { stu_1: { id: 'stu_1', name: '가나다', password: 'abcd',
    correctWords: Object.fromEntries(keys.map((k) => [k, 1])) } } });
  const p = await page();
  ok(await studentLogin(p, '가나다', 'abcd'), '학생 입장');
  await setRules(STRICT);
  await p.waitForTimeout(1500);
  ok(await p.isVisible('#srs-card') && /새 단어 30개/.test(await p.textContent('#srs-title')), '홈 첫 카드: 오늘의 새 단어 30개 (' + await p.textContent('#srs-title') + ')');
  ok((await p.$$('#srs-route .route li')).length === 12, '홈 노선도 12주');
  ok(await p.evaluate(() => document.getElementById('wp-go').classList.contains('sub') || document.getElementById('week-progress').style.display !== 'block'), '주 버튼은 노선 카드 하나');
  await p.click('#srs-go'); await p.waitForURL(/review\.html/); await p.waitForTimeout(3000);
  const st0 = await getJ('students/stu_1');
  ok(st0.srsInit === true && Object.keys(st0.srs || {}).length === 5 && Object.values(st0.srs).every((e) => e.s === 2), '처음 들어오면 맞힌 단어 5개가 2단계로 저장');
  // 새 단어 10개 보기 → 10문제 (정답 고르기)
  for (let i = 0; i < 10; i++) { await p.click('#rv-card .btn-gold'); await p.waitForTimeout(80); }
  for (let i = 0; i < 10; i++) {
    await p.evaluate(() => { const w = document.querySelector('.rv-word').textContent; const m = WM_CORE.find((x) => x[0] === w)[1];
      [...document.querySelectorAll('.rv-opt')].find((b) => b.dataset.v === m).click(); });
    await p.waitForTimeout(150); await p.evaluate(() => { const n = document.getElementById('rv-next'); if (n) n.click(); }); await p.waitForTimeout(100);
  }
  await p.waitForTimeout(1200);
  const st1 = await getJ('students/stu_1');
  const ones = Object.values(st1.srs).filter((e) => e.s === 1).length;
  ok(ones === 10 && st1.srsDay && st1.srsDay.newDone === 10, '새 단어 10개 맞힘 → 1단계·내일 복습으로 저장, 오늘 10개 진행 (' + ones + ')');
  // 오늘 복습 1개가 생기면 새 단어 대신 복습부터
  const k0 = Object.keys(st1.srs).find((k) => st1.srs[k].s === 2);
  const todayN = await p.evaluate(() => SRS.today());
  await rest(`students/stu_1/srs/${encodeURIComponent(k0)}`, { owner: true, method: 'PUT', body: JSON.stringify({ s: 2, d: todayN }) });
  await p.reload(); await p.waitForTimeout(3000);
  ok(/복습/.test(await p.textContent('#rv-step')) && (await p.textContent('#rv-count')) === '0 / 1', '복습이 있으면 복습부터 (새 단어 잠김)');
  await p.evaluate(() => { const w = document.querySelector('.rv-word').textContent; const m = WM_CORE.find((x) => x[0] === w)[1];
    [...document.querySelectorAll('.rv-opt')].find((b) => b.dataset.v !== m).click(); });
  await p.waitForTimeout(800);
  const e0 = (await getJ('students/stu_1/srs'))[k0];
  ok(e0.s === 1 && e0.d === todayN + 1, '복습에서 틀리면 1단계·내일 다시');
  ok(!p._errs.length, '복습 화면 오류 없음 ' + p._errs.join('|'));
}

(async () => {
  if (!SDK || !fs.existsSync(path.join(SDK, 'firebase-app.js'))) { console.error('FIREBASE_SDK_DIR 없음 (tests/run.sh로 실행하세요)'); process.exit(2); }
  browser = await chromium.launch();
  try {
    await securitySuite();
    await bookmarkSuite();
    await stickerSuite();
    await chartSuite();
    await swSuite();
    await srsSuite();
  } catch (e) {
    fail++; console.log('FAIL 실행 중 오류: ' + (e && e.stack || e));
  }
  await browser.close();
  console.log(`\n실동작 검사: ${pass}개 통과 / ${fail}개 실패`);
  process.exit(fail ? 1 : 0);
})();
