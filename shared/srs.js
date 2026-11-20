// ── N회독 노선: 간격 반복 암기 (수능 핵심 필수 1,800개) ─────────────────
// 단어마다 단계 s: 1(처음 익힘) → 2 → 3(숙달) → 4 → 5 → 6(졸업)
// 맞히면 한 단계 올라가고 INT[s]일 뒤 다시 나옴, 틀리면 1단계로 내려가 내일 다시
// 하루 순서: 오늘 돌아온 복습을 다 끝내야 새 단어(하루 30개)가 열림
// 저장: students/{id}/srs/{단어키} = {s, d(다시 볼 날: 지역 날짜 일수)}, students/{id}/srsDay = {day, newDone}
window.SRS = (function () {
  var INT = [0, 1, 3, 7, 14, 30];   // INT[s] = s단계가 된 뒤 다음 복습까지 일수
  var GRAD = 6, MASTER = 3, NEW_PER_DAY = 30, MAX_REVIEW = 100;

  function today() { var d = new Date(); return Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000); }
  function key(w) { return DB._wordKey(w); }
  function weekOf(w) { var m = String(w[2] || '').match(/Day\s*(\d+)/); return m ? +m[1] : 0; }

  // 오늘 할 일 계산 (words = 주차 순서 단어 배열)
  function plan(words, srs, dayInfo, t) {
    t = t || today(); srs = srs || {};
    var newDone = (dayInfo && dayInfo.day === t) ? (dayInfo.newDone || 0) : 0;
    var due = [], fresh = [], seen = 0, mastered = 0, frontier = 0;
    var newLeft = Math.max(0, NEW_PER_DAY - newDone);
    for (var i = 0; i < words.length; i++) {
      var w = words[i], e = srs[key(w[0])];
      if (e) {
        seen++;
        if (e.s >= MASTER) mastered++;
        if (e.s < GRAD && e.d <= t) due.push({ w: w, e: e });
      } else {
        if (!frontier) frontier = weekOf(w) || 1;
        if (fresh.length < newLeft) fresh.push(w);
      }
    }
    due.sort(function (a, b) { return a.e.d - b.e.d; });
    return {
      today: t, due: due.slice(0, MAX_REVIEW), dueTotal: due.length,
      fresh: due.length ? [] : fresh,          // 복습이 남아 있으면 새 단어 잠금
      newLeft: fresh.length, newDone: newDone, seen: seen, mastered: mastered,
      total: words.length, frontier: frontier || (weekOf(words[words.length - 1]) || 1),
    };
  }

  // 답한 뒤 새 상태
  function next(e, correct, t) {
    t = t || today();
    if (!correct) return { s: 1, d: t + 1 };
    var s = Math.min((e ? e.s : 0) + 1, GRAD);
    return s >= GRAD ? { s: GRAD, d: t + 3650 } : { s: s, d: t + INT[s] };
  }

  // 기존 학생: 퀴즈에서 이미 맞힌 단어는 2단계로 시작, 복습 날짜는 1~7일에 나눠서 (첫날 몰리지 않게)
  function seedFromCorrect(words, correct, t) {
    t = t || today(); var out = {}, n = 0;
    for (var i = 0; i < words.length; i++) {
      var k = key(words[i][0]);
      if (correct && correct[k]) { out[k] = { s: 2, d: t + 1 + (n % 7) }; n++; }
    }
    return out;
  }

  // 주차별 숙달 비율·복습 대기 (노선도·선생님 화면)
  function weekStats(words, srs, t) {
    t = t || today(); srs = srs || {}; var out = {};
    for (var i = 0; i < words.length; i++) {
      var w = words[i], wk = weekOf(w) || 1, e = srs[key(w[0])];
      var o = out[wk] || (out[wk] = { total: 0, mastered: 0, seen: 0, due: 0 });
      o.total++;
      if (e) { o.seen++; if (e.s >= MASTER) o.mastered++; if (e.s < GRAD && e.d <= t) o.due++; }
    }
    return out;
  }

  // 노선도 HTML: 지금 위치 = 새 단어 진행 주차, 숙달 80%↑ = 지나간 정거장, 복습 대기 있는 주차 = 노란 점
  function routeHtml(words, srs, frontier, t) {
    var st = weekStats(words, srs, t), nums = Object.keys(st).map(Number).sort(function (a, b) { return a - b; });
    if (nums.length < 2) return '';
    var ci = nums.indexOf(frontier), p = ci > 0 ? ci / (nums.length - 1) : 0;
    return '<ol class="route" style="--p:' + p.toFixed(3) + '" aria-label="주차 노선">' + nums.map(function (n) {
      var o = st[n], pct = Math.round(o.mastered / o.total * 100);
      var cls = (n === frontier ? 'cur' : (o.mastered / o.total >= 0.8 ? 'pass' : '')) + (o.due ? ' due' : '');
      return '<li class="' + cls.trim() + '" title="' + n + '주차 · 숙달 ' + pct + '%' + (o.due ? ' · 복습 ' + o.due + '개' : '') + '"><i></i>' + n + '</li>';
    }).join('') + '</ol>';
  }

  return { INT: INT, GRAD: GRAD, MASTER: MASTER, NEW_PER_DAY: NEW_PER_DAY, today: today, key: key, weekOf: weekOf,
           plan: plan, next: next, seedFromCorrect: seedFromCorrect, weekStats: weekStats, routeHtml: routeHtml };
})();
