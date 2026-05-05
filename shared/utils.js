// ── Utils ──────────────────────────────────────────────────────────────────
const Utils = {

  // ── TTS ──
  speak(text, rate) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.rate = rate || 0.85;
    u.pitch = 1.0;

    // 영어 원어민 음성 선택 (품질 순서)
    const preferred = [
      'Google US English', 'Samantha', 'Alex',
      'Karen', 'Daniel', 'Moira', 'Rishi'
    ];
    const getVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      for (const name of preferred) {
        const v = voices.find(v => v.name === name || v.name.includes(name));
        if (v) return v;
      }
      // fallback: en-US 아무 목소리
      return voices.find(v => v.lang === 'en-US') ||
             voices.find(v => v.lang.startsWith('en')) || null;
    };

    const voice = getVoice();
    if (voice) {
      u.voice = voice;
      window.speechSynthesis.speak(u);
    } else {
      // 음성 목록이 아직 로드 안 됐을 경우 대기
      window.speechSynthesis.onvoiceschanged = () => {
        u.voice = getVoice();
        window.speechSynthesis.speak(u);
        window.speechSynthesis.onvoiceschanged = null;
      };
      window.speechSynthesis.speak(u);
    }
  },

  // ── Date ──
  today() {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  },

  // ── 이미지 URL: 단어 뜻 기반 구체적 장면 묘사 ──
  pollUrl(en, ko) {
    // 한국어 뜻에서 핵심어 추출
    const mainKo = (ko || '').split(/[,\/;]/)[0].trim();

    // 단어별 커스텀 프롬프트 (구체적 장면)
    const customPrompts = {
      'abandon': 'empty broken-down van abandoned on a road, flat illustration',
      'absorb': 'sponge soaking up blue water, cross-section view, flat illustration',
      'accelerate': 'sports car on highway with speed lines, flat illustration',
      'adapt': 'chameleon changing color on different backgrounds, flat illustration',
      'adequate': 'measuring cup filled exactly to the line, flat illustration',
      'advocate': 'person standing at podium speaking to crowd, flat illustration',
      'alert': 'bright red alarm bell ringing, flat illustration',
      'ambiguous': 'optical illusion image showing two different shapes, flat illustration',
      'ancient': 'ancient stone ruins with moss, flat illustration',
      'anxiety': 'person with thought bubbles swirling around head, flat illustration',
      'authentic': 'gold seal of authenticity stamp, flat illustration',
      'barrier': 'concrete wall blocking a path, flat illustration',
      'benefit': 'person receiving a gift wrapped in ribbon, flat illustration',
      'bloom': 'flower blooming from bud to full flower, flat illustration',
      'boundary': 'fence line separating two areas, flat illustration',
      'burden': 'person carrying heavy rocks on back, flat illustration',
      'calm': 'still lake reflecting mountains at sunrise, flat illustration',
      'capture': 'butterfly net catching a butterfly, flat illustration',
      'collapse': 'building crumbling into pieces, flat illustration',
      'compassion': 'person comforting another with hand on shoulder, flat illustration',
      'conflict': 'two opposing arrows clashing in the middle, flat illustration',
      'courage': 'lion standing tall on a rock, flat illustration',
      'creativity': 'colorful lightbulb with art supplies around it, flat illustration',
      'cultivate': 'hands planting a seed in soil, flat illustration',
      'curiosity': 'cat looking into an open box with question marks, flat illustration',
      'decay': 'apple rotting on a wooden surface, flat illustration',
      'dedicate': 'person kneeling in front of an altar, flat illustration',
      'defeat': 'chess king piece toppled over, flat illustration',
      'determination': 'person climbing steep mountain face, flat illustration',
      'discipline': 'military-style checklist on a clipboard, flat illustration',
      'discover': 'person with magnifying glass finding treasure, flat illustration',
      'disperse': 'seeds flying away from a dandelion, flat illustration',
      'dominate': 'chess queen piece towering over other pieces, flat illustration',
      'dream': 'person sleeping with thought bubble of stars, flat illustration',
      'drought': 'cracked dry earth with wilting plant, flat illustration',
      'ecology': 'circular ecosystem diagram with animals and plants, flat illustration',
      'educate': 'teacher at blackboard with students, flat illustration',
      'emerge': 'butterfly emerging from chrysalis, flat illustration',
      'empathy': 'two people with matching heart symbols, flat illustration',
      'endure': 'person walking through heavy rain and wind, flat illustration',
      'enhance': 'before and after image with improvement arrow, flat illustration',
      'erosion': 'cliff face being worn away by waves, flat illustration',
      'evaporate': 'puddle of water turning into steam rising up, flat illustration',
      'evolve': 'evolution chart from fish to upright human, flat illustration',
      'exploit': 'person extracting oil from ground with machine, flat illustration',
      'extinction': 'last remaining dinosaur standing alone, flat illustration',
      'failure': 'rocket crashed on launchpad, flat illustration',
      'faith': 'person reaching toward glowing light, flat illustration',
      'fertility': 'lush green field with abundant crops, flat illustration',
      'flourish': 'plant growing vigorously with many leaves, flat illustration',
      'forgive': 'broken chain being reconnected with golden link, flat illustration',
      'foundation': 'building blueprint showing strong base, flat illustration',
      'fragile': 'glass vase with crack lines, flat illustration',
      'freedom': 'bird flying out of open cage, flat illustration',
      'frustration': 'person hitting desk with fist, angry expression, flat illustration',
      'generate': 'factory with gears producing output, flat illustration',
      'growth': 'seedling growing into tall tree, time-lapse sequence, flat illustration',
      'habitat': 'diverse ecosystem with various animals in natural setting, flat illustration',
      'harvest': 'farmer collecting ripe golden wheat, flat illustration',
      'heal': 'bandage unwrapping to reveal healthy skin, flat illustration',
      'heritage': 'old family photo album with ancestral items, flat illustration',
      'hierarchy': 'pyramid organizational chart, flat illustration',
      'hope': 'tiny plant growing through crack in concrete, flat illustration',
      'humility': 'person bowing respectfully before another, flat illustration',
      'iceberg': 'iceberg with large portion underwater, flat illustration',
      'illuminate': 'candle lighting up dark room, flat illustration',
      'imagine': 'person with cloud thought bubble containing colorful images, flat illustration',
      'immune': 'shield blocking incoming arrows, flat illustration',
      'innovate': 'lightbulb with gears inside, flat illustration',
      'integrity': 'unbroken circle of gold, flat illustration',
      'isolate': 'single island in the middle of ocean, flat illustration',
      'justice': 'balanced scales of justice, flat illustration',
      'kindness': 'person giving flower to another person, flat illustration',
      'knowledge': 'open book with light rays coming out, flat illustration',
      'leadership': 'person standing at front guiding group up mountain, flat illustration',
      'legacy': 'old tree with many branches reaching outward, flat illustration',
      'liberate': 'person breaking free from chains, flat illustration',
      'loyalty': 'dog sitting faithfully beside its owner, flat illustration',
      'maintain': 'wrench maintaining a machine, flat illustration',
      'manifest': 'hand revealing hidden object, flat illustration',
      'migrate': 'birds flying in V-formation across sky, flat illustration',
      'momentum': 'snowball rolling downhill growing larger, flat illustration',
      'nourish': 'hand watering a growing plant, flat illustration',
      'obstacle': 'large boulder blocking a path, flat illustration',
      'overcome': 'person jumping over hurdle, flat illustration',
      'persist': 'person continuing to walk despite heavy wind, flat illustration',
      'pioneer': 'person standing at unexplored frontier, flat illustration',
      'pollution': 'factory chimney with dark smoke over city, flat illustration',
      'potential': 'acorn next to giant oak tree, flat illustration',
      'preserve': 'jar containing preserved fruit, flat illustration',
      'progress': 'staircase going upward with progress markers, flat illustration',
      'protect': 'umbrella shielding from rain, flat illustration',
      'purify': 'dirty water filtering through layers to become clean, flat illustration',
      'purpose': 'compass pointing in clear direction, flat illustration',
      'radical': 'tree with roots being cut at the base, flat illustration',
      'reconcile': 'two hands shaking across a divide, flat illustration',
      'reflect': 'mirror image of person thinking, flat illustration',
      'reinforce': 'steel beams strengthening a structure, flat illustration',
      'resilience': 'rubber ball bouncing back from floor, flat illustration',
      'restore': 'before-after image of old building being renovated, flat illustration',
      'reveal': 'curtain being pulled back to show hidden scene, flat illustration',
      'sacrifice': 'person giving away last piece of bread, flat illustration',
      'scatter': 'seeds being thrown into wind in all directions, flat illustration',
      'shelter': 'small house with warm light in dark storm, flat illustration',
      'shrink': 'object getting progressively smaller in sequence, flat illustration',
      'simplify': 'complex equation reducing to simple expression, flat illustration',
      'soar': 'eagle soaring high above clouds, flat illustration',
      'stability': 'three-legged stool standing firmly, flat illustration',
      'strength': 'muscular arm flexing, flat illustration',
      'struggle': 'person pushing against strong wind, flat illustration',
      'summit': 'mountain peak with flag at top, flat illustration',
      'sustain': 'ecosystem circular flow chart, flat illustration',
      'transform': 'caterpillar cocoon becoming butterfly, flat illustration',
      'trust': 'two people standing on a tightrope together, flat illustration',
      'unity': 'multiple hands joining together in circle, flat illustration',
      'vision': 'eye with telescope looking into distance, flat illustration',
      'vulnerable': 'turtle without its shell, flat illustration',
      'wisdom': 'old owl with glasses reading a book, flat illustration',
    };

    const word = en.toLowerCase();
    let prompt;
    if (customPrompts[word]) {
      prompt = customPrompts[word];
    } else {
      // 기본 프롬프트: 영어 단어 + 핵심 한국어 뜻으로 구체적 장면
      const koClean = mainKo.replace(/[~하다하는이기]/g, '').trim();
      prompt = `${en} concept ${koClean} simple clear scene flat illustration white background no text`;
    }

    const p = encodeURIComponent(prompt);
    const seed = this.wordSeed(en);
    return `https://image.pollinations.ai/prompt/${p}?width=300&height=300&seed=${seed}&nologo=true&model=flux`;
  },

  wordSeed(word) {
    let h = 0;
    for (const c of word) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return h % 9999;
  },

  // ── 정답 체크 ──
  normalize(s) {
    return (s || '').replace(/[~\-().\[\]?!]/g, ' ')
      .replace(/\s+/g, ' ').trim().toLowerCase();
  },

  checkAnswer(input, correct) {
    const inp = this.normalize(input);
    const answers = (correct || '').split(/[,\/]/).map(s => this.normalize(s));
    if (answers.some(a => a === inp)) return 'exact';
    if (answers.some(a => a.includes(inp) || inp.includes(a.split(' ')[0]))) return 'close';
    return 'wrong';
  },

  fmtTime(sec) {
    const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
    return m + ':' + String(s).padStart(2, '0');
  },

  // ── Shuffle ──
  shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  },

  // ── 연상법 가져오기 ──
  getMnemonic(en, ko) {
    const key = (en || '').toLowerCase();
    // Firebase 커스텀 연상법 우선
    if (window._mnemonicOverrides && window._mnemonicOverrides[key]) {
      return window._mnemonicOverrides[key];
    }
    // 기본 연상법
    if (window.MNEMONICS && window.MNEMONICS[key]) {
      return window.MNEMONICS[key];
    }
    return null;
  },
};
