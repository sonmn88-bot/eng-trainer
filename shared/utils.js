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

  // ── 이미지 URL (단어 의미 기반으로 개선) ──
  pollUrl(en, ko) {
    const mainKo = (ko || '').split(/[,\/]/)[0].trim();
    const prompt = `${en} meaning ${mainKo}, simple clean illustration, minimal flat design, no text, white background, icon style`;
    const p = encodeURIComponent(prompt);
    const seed = this.wordSeed(en);
    return `https://image.pollinations.ai/prompt/${p}?width=200&height=200&seed=${seed}&nologo=true`;
  },

  wordSeed(word) {
    let h = 0;
    for (const c of word) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return h % 9999;
  },

  // ── AI 연상법 생성 ──
  _mnemonicCache: {},

  async getMnemonic(en, ko) {
    // 1. 메모리 캐시
    if (this._mnemonicCache[en]) return this._mnemonicCache[en];

    // 2. Firebase 캐시
    try {
      const saved = await DB.getMnemonics();
      if (saved[en]) {
        this._mnemonicCache[en] = saved[en];
        return saved[en];
      }
    } catch(e) {}

    // 3. AI 생성
    const result = await this.generateMnemonic(en, ko);
    this._mnemonicCache[en] = result;

    // Firebase에 저장 (백그라운드)
    try { DB.saveMnemonic(en, result); } catch(e) {}

    return result;
  },

  async generateMnemonic(en, ko) {
    const mainKo = (ko || '').split(/[,\/]/)[0].trim();
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 120,
          messages: [{
            role: 'user',
            content: `수능 영어 단어 암기 연상법을 만들어줘.

단어: ${en}
뜻: ${mainKo}

조건:
- 영어 발음과 비슷한 한국어 소리를 활용
- 그 소리와 단어 뜻을 연결하는 짧고 재미있는 이미지/스토리 1문장
- 충격적이거나 웃기면 더 좋음
- 30자 이내
- 연상법 문장만 답해. 설명 없이.

예시:
abandon → 어! 밴드(band)온(on)이 무대를 버리고 떠났다
adequate → 애들이 쿼트(court)에서 적절히 뛰논다`
          }]
        })
      });
      const data = await res.json();
      const text = data.content?.[0]?.text?.trim();
      return text || this.fallbackMnemonic(en, mainKo);
    } catch(e) {
      return this.fallbackMnemonic(en, mainKo);
    }
  },

  fallbackMnemonic(en, ko) {
    // API 실패 시 발음 기반 폴백
    const chunks = [];
    let i = 0;
    const w = en.toLowerCase();
    const map = [
      ['tion','션'],['sion','전'],['ous','어스'],['ive','이브'],
      ['ize','아이즈'],['ate','에이트'],['ment','먼트'],['ness','니스'],
      ['less','리스'],['ful','풀'],['able','어블'],['ible','이블'],
      ['ity','이티'],['ly','리'],['th','드'],['ph','프'],['ch','취'],
      ['sh','쉬'],['wh','워'],['ck','크'],['qu','크'],['ee','이'],
      ['ea','이'],['ou','아우'],['oo','우'],['ai','에이'],['ay','에이'],
      ['a','아'],['e','에'],['i','이'],['o','오'],['u','우'],
      ['b','브'],['c','크'],['d','드'],['f','프'],['g','그'],
      ['h','흐'],['j','지'],['k','크'],['l','ㄹ'],['m','므'],
      ['n','느'],['p','프'],['r','르'],['s','스'],['t','트'],
      ['v','브'],['w','우'],['x','크스'],['y','이'],['z','즈'],
    ];
    while (i < w.length) {
      let matched = false;
      for (const [pat, kor] of map) {
        if (w.slice(i).startsWith(pat)) {
          chunks.push(kor); i += pat.length; matched = true; break;
        }
      }
      if (!matched) { chunks.push(w[i]); i++; }
    }
    return `[${chunks.join('')}] → "${ko}"`;
  }
};
