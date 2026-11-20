// 정적 검사: 배포 전에 깨진 곳이 없는지 빠르게 확인 (브라우저·Firebase 불필요)
//   node tests/static-check.js              검사
//   node tests/static-check.js --update-css 지금 theme.css 선택자를 기준 목록으로 저장 (의도적으로 지운 경우에만)
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
let fail = 0;
const ok = (cond, msg) => { console.log((cond ? 'PASS ' : 'FAIL ') + msg); if (!cond) fail++; };

// 1) HTML: <script> 개수 일치 + 인라인 스크립트 문법
for (const f of ['index.html', 'vocab.html', 'teacher.html', 'listening.html', 'review.html']) {
  const html = read(f);
  const open = (html.match(/<script/g) || []).length;
  const close = (html.match(/<\/script>/g) || []).length;
  ok(open === close, `${f} <script> 열림 ${open} / 닫힘 ${close}`);
  ok(html.trimStart().toLowerCase().startsWith('<!doctype'), `${f} <!DOCTYPE> 앞에 노출된 코드 없음`);
  const re = /<script(?![^>]*\bsrc=)(?![^>]*type=["']?module)[^>]*>([\s\S]*?)<\/script>/g;
  let m, i = 0, bad = [];
  while ((m = re.exec(html))) {
    i++;
    try { new vm.Script(m[1], { filename: `${f}#script${i}` }); } catch (e) { bad.push(`#${i}: ${e.message}`); }
  }
  ok(!bad.length, `${f} 인라인 스크립트 ${i}개 문법` + (bad.length ? ' → ' + bad.join(' | ') : ''));
}

// 2) 공용 JS·데이터 파일 문법
const jsFiles = ['shared/db.js', 'shared/utils.js', 'shared/icons.js', 'shared/srs.js', 'data/_index.js', 'sw.js']
  .concat(fs.readdirSync(path.join(ROOT, 'data/words')).filter((n) => n.endsWith('.js')).map((n) => 'data/words/' + n));
for (const f of jsFiles) {
  if (!fs.existsSync(path.join(ROOT, f))) continue;
  try { new vm.Script(read(f), { filename: f }); ok(true, `${f} 문법`); } catch (e) { ok(false, `${f} 문법 → ${e.message}`); }
}

// 3) CSS 회귀: 기준 목록에 있는 선택자가 theme.css에서 사라지지 않았는지
function selectors(css) {
  css = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const out = new Set();
  const re = /([^{}@][^{}]*)\{/g;
  let m;
  while ((m = re.exec(css))) {
    for (let s of m[1].split(',')) {
      s = s.trim().replace(/\s+/g, ' ');
      if (s && !/^[\d.]+%?$/.test(s) && s !== 'from' && s !== 'to') out.add(s);
    }
  }
  return out;
}
const baseFile = path.join(__dirname, 'css-baseline.txt');
const now = selectors(read('shared/theme.css'));
if (process.argv.includes('--update-css')) {
  fs.writeFileSync(baseFile, [...now].sort().join('\n') + '\n');
  console.log('css-baseline.txt 갱신:', now.size, '개');
} else {
  const base = fs.readFileSync(baseFile, 'utf8').split('\n').filter(Boolean);
  const gone = base.filter((s) => !now.has(s));
  ok(!gone.length, `theme.css 선택자 ${base.length}개 유지` + (gone.length ? ' → 사라짐: ' + gone.slice(0, 20).join(', ') : ''));
}

// 4) 단어장: 목록 화면의 wordCount가 실제 파일과 같은지 + 수능 핵심 필수 구조
const ctx = { window: {} };
ctx.window.window = ctx.window;
vm.createContext(ctx);
vm.runInContext(read('data/_index.js'), ctx);
const catalog = ctx.window.WORD_CATALOG || [];
ok(Array.isArray(catalog) && catalog.length > 0, `window.WORD_CATALOG 접근 가능 (${catalog.length}개 세트)`);
for (const s of catalog) {
  if (!s.wordCount) continue;
  vm.runInContext(read('data/words/' + s.file), ctx);
  const n = (ctx.window[s.varName] || []).length;
  ok(n === s.wordCount, `${s.id} wordCount ${s.wordCount} = 파일 ${n}`);
}
const core = ctx.window.WM_CORE || [];
const coreInfo = catalog.find((s) => s.id === 'core') || {};
const per = coreInfo.wordsPerWeek || 150;
const weeks = {};
core.forEach((w) => { weeks[w[2]] = (weeks[w[2]] || 0) + 1; });
const lower = new Set(core.map((w) => String(w[0]).toLowerCase()));
ok(lower.size === core.length, `수능 핵심 필수 중복 없음 (${core.length}개)`);
ok(core.every((w) => w[0] && w[1] && /^Day \d+$/.test(w[2])), '수능 핵심 필수 모든 단어에 뜻·주차 있음');
ok(Object.values(weeks).every((n) => n === per), `수능 핵심 필수 주차마다 ${per}개 (${Object.keys(weeks).length}주)`);
ok(coreInfo.totalWords === core.length, `_index.js totalWords ${coreInfo.totalWords} = ${core.length}`);

console.log(`\n정적 검사: ${fail ? fail + '개 실패' : '모두 통과'}`);
process.exit(fail ? 1 : 0);
