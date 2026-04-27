// ── Utils ─────────────────────────────────────
const Utils = {
  speak(text) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US'; u.rate = 0.9;
    window.speechSynthesis.speak(u);
  },

  shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  },

  normalize(s) {
    return s.replace(/[^가-힣a-zA-Z0-9\s,]/g, '').trim().toLowerCase();
  },

  checkAnswer(input, correct) {
    const inp = this.normalize(input);
    const answers = correct.split(/[,\/]/).map(s => this.normalize(s));
    if (answers.some(a => a === inp)) return 'exact';
    if (answers.some(a => a.includes(inp) || inp.includes(a.split(' ')[0]))) return 'close';
    return 'wrong';
  },

  fmtTime(sec) {
    const m = Math.floor(sec / 60), s = sec % 60;
    return `${m}:${String(s).padStart(2,'0')}`;
  },

  today() {
    return new Date().toISOString().slice(0, 10);
  },

  weekOf(dateStr) {
    const d = new Date(dateStr || Date.now());
    const day = d.getDay() || 7;
    d.setDate(d.getDate() - day + 1);
    return d.toISOString().slice(0, 10);
  },

  pollUrl(prompt, seed) {
    const p = encodeURIComponent(prompt + ', clean illustration, minimal, soft');
    return `https://image.pollinations.ai/prompt/${p}?width=200&height=200&seed=${seed}&nologo=true`;
  },

  // 단어 → 시드값 (일관된 이미지)
  wordSeed(word) {
    let h = 0;
    for (const c of word) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return h % 9999;
  },

  // 연상법 자동 생성 (발음 기반)
  autoMnemonic(en, ko) {
    const soundMap = [
      [/^ab/i,'앱'],  [/^ac/i,'액'],  [/^ad/i,'애드'], [/^ag/i,'애그'],
      [/^al/i,'알'],  [/^am/i,'암'],  [/^an/i,'안'],   [/^ap/i,'앱'],
      [/^ar/i,'아'],  [/^as/i,'아스'],[/^at/i,'앳'],   [/^av/i,'아브'],
      [/^be/i,'비'],  [/^bo/i,'보'],  [/^br/i,'브r'],  [/^ca/i,'카'],
      [/^ch/i,'채'],  [/^co/i,'코'],  [/^cr/i,'크r'],  [/^cu/i,'큐'],
      [/^de/i,'디'],  [/^di/i,'디'],  [/^do/i,'도'],   [/^dr/i,'드r'],
      [/^em/i,'엠'],  [/^en/i,'엔'],  [/^ex/i,'엑스'],
      [/^fa/i,'파'],  [/^fl/i,'플'],  [/^fo/i,'포'],   [/^fr/i,'프r'],
      [/^ge/i,'제'],  [/^gr/i,'그r'], [/^gu/i,'구'],
      [/^ha/i,'하'],  [/^he/i,'히'],  [/^hi/i,'하이'],  [/^ho/i,'호'],
      [/^im/i,'임'],  [/^in/i,'인'],
      [/^la/i,'라'],  [/^le/i,'리'],  [/^li/i,'리'],   [/^lo/i,'로'],
      [/^ma/i,'마'],  [/^me/i,'미'],  [/^mi/i,'미'],   [/^mo/i,'모'],
      [/^na/i,'나'],  [/^ne/i,'니'],  [/^no/i,'노'],
      [/^ob/i,'옵'],  [/^op/i,'옵'],  [/^or/i,'오r'],  [/^ov/i,'오브'],
      [/^pa/i,'파'],  [/^pe/i,'피'],  [/^po/i,'포'],   [/^pr/i,'프r'],
      [/^re/i,'리'],  [/^ro/i,'로'],  [/^ru/i,'루'],
      [/^sa/i,'사'],  [/^se/i,'시'],  [/^si/i,'시'],   [/^so/i,'소'],
      [/^sp/i,'스p'], [/^st/i,'스t'], [/^str/i,'스tr'], [/^su/i,'수'],
      [/^ta/i,'타'],  [/^te/i,'티'],  [/^th/i,'더'],   [/^ti/i,'타이'],
      [/^tr/i,'트r'], [/^tu/i,'튜'],  [/^tw/i,'트w'],
      [/^un/i,'언'],  [/^up/i,'업'],  [/^ut/i,'얼'],
      [/^va/i,'바'],  [/^ve/i,'비'],  [/^vi/i,'바이'],  [/^vo/i,'보'],
      [/^wa/i,'워'],  [/^we/i,'위'],  [/^wi/i,'위'],   [/^wo/i,'워'],
    ];
    let sound = en.slice(0, 3);
    for (const [rx, s] of soundMap) { if (rx.test(en)) { sound = s; break; } }
    const mainKo = ko.split(/[,\/]/)[0].trim();
    return `'${en}' → [${sound}...] → "${mainKo}"`;
  }
};
