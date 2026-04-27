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

  // ── 이미지 URL ──
  pollUrl(en, ko) {
    const mainKo = (ko || '').split(/[,\/]/)[0].trim();
    const prompt = `${en} ${mainKo} simple clean illustration minimal flat design no text white background`;
    const p = encodeURIComponent(prompt);
    const seed = this.wordSeed(en);
    return `https://image.pollinations.ai/prompt/${p}?width=200&height=200&seed=${seed}&nologo=true`;
  },

  wordSeed(word) {
    let h = 0;
    for (const c of word) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return h % 9999;
  },

  // ── 연상법 가져오기 (파일 기반 + Firebase 저장값 우선) ──
  getMnemonic(en, ko) {
    // 1. Firebase에 선생님이 저장한 연상법 우선
    if (window._mnemonicOverrides && window._mnemonicOverrides[en]) {
      return window._mnemonicOverrides[en];
    }
    // 2. 미리 만든 연상법 파일
    if (window.MNEMONICS && window.MNEMONICS[en.toLowerCase()]) {
      return window.MNEMONICS[en.toLowerCase()];
    }
    // 3. 발음 기반 자동생성 (폴백)
    return this.fallbackMnemonic(en, ko);
  },

  fallbackMnemonic(en, ko) {
    const mainKo = (ko || '').split(/[,\/]/)[0].trim();
    // 발음 근사 변환
    const phonetic = en
      .replace(/tion$/i, '션').replace(/sion$/i, '전')
      .replace(/ous$/i, '어스').replace(/ive$/i, '이브')
      .replace(/ate$/i, '에이트').replace(/ment$/i, '먼트')
      .replace(/ness$/i, '니스').replace(/less$/i, '리스')
      .replace(/ful$/i, '풀').replace(/able$/i, '어블')
      .replace(/ible$/i, '이블').replace(/ity$/i, '이티')
      .replace(/ly$/i, '리').replace(/th/gi, '드')
      .replace(/ph/gi, '프').replace(/ch/gi, '치')
      .replace(/sh/gi, '쉬').replace(/ck/gi, '크')
      .replace(/ee|ea/gi, '이').replace(/ou/gi, '아우')
      .replace(/oo/gi, '우').replace(/ai|ay/gi, '에이')
      .replace(/a/gi, '아').replace(/e/gi, '에')
      .replace(/i/gi, '이').replace(/o/gi, '오').replace(/u/gi, '우')
      .replace(/[bcdfghjklmnpqrstvwxyz]/gi, '');
    return `[${phonetic || en}] 소리로 기억 → "${mainKo}"`;
  }
};
