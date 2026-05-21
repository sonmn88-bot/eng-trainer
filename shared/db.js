const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyC9HA6mCGWQEoYOCxG2rqRDv17Qi1Ubf7Y",
  authDomain:        "eng-trainer-65cac.firebaseapp.com",
  databaseURL:       "https://eng-trainer-65cac-default-rtdb.firebaseio.com",
  projectId:         "eng-trainer-65cac",
  storageBucket:     "eng-trainer-65cac.appspot.com",
  messagingSenderId: "823536158337",
  appId:             "1:823536158337:web:a49465a60fe47be3e7af80"
};

let _db = null;

async function initDB() {
  if (_db) return _db;
  const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
  const { getDatabase, ref, get, set, update, push, remove, serverTimestamp }
    = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js');
  const app = initializeApp(FIREBASE_CONFIG);
  _db = { db: getDatabase(app), ref, get, set, update, push, serverTimestamp };
  return _db;
}

const DB = {
  async getStudents() {
    const { db, ref, get } = await initDB();
    const snap = await get(ref(db, 'students'));
    return snap.exists() ? snap.val() : {};
  },

  async getStudent(id) {
    const { db, ref, get } = await initDB();
    const snap = await get(ref(db, `students/${id}`));
    return snap.exists() ? snap.val() : null;
  },

  async saveStudent(id, data) {
    const { db, ref, update, set } = await initDB();
    if (data === null) {
      // 삭제
      await set(ref(db, `students/${id}`), null);
    } else {
      await update(ref(db, `students/${id}`), data);
    }
  },

  async createStudent(name) {
    const id = 'stu_' + Date.now();
    await DB.saveStudent(id, { id, name, createdAt: new Date().toISOString() });
    return id;
  },

  async saveResult(stuId, result) {
    const { db, ref, push } = await initDB();
    await push(ref(db, `results/${stuId}`), {
      ...result, date: new Date().toISOString()
    });
  },

  async getResults(stuId) {
    const { db, ref, get } = await initDB();
    const snap = await get(ref(db, `results/${stuId}`));
    return snap.exists() ? Object.values(snap.val()) : [];
  },

  async updateWeakWord(stuId, word, ko, correct) {
    const { db, ref, get, update } = await initDB();
    const path = `students/${stuId}/weakWords/${btoa(word).replace(/=/g,'')}`;
    const snap = await get(ref(db, path));
    const curr = snap.exists() ? snap.val() : { word, ko: ko||'', wrong: 0, right: 0, streak: 0 };
    if (ko && !curr.ko) curr.ko = ko;
    if (correct) { curr.right++; curr.streak++; }
    else { curr.wrong++; curr.streak = 0; }
    curr.lastStudied = Date.now();
    await update(ref(db, path), curr);
  },

  async getWeakWords(stuId) {
    const { db, ref, get } = await initDB();
    const snap = await get(ref(db, `students/${stuId}/weakWords`));
    if (!snap.exists()) return [];
    return Object.values(snap.val()).filter(w => w.streak < 5);
  },

  async getAllWeakWords(stuId) {
    const { db, ref, get } = await initDB();
    const snap = await get(ref(db, `students/${stuId}/weakWords`));
    if (!snap.exists()) return [];
    return Object.values(snap.val());
  },

  async getSettings() {
    const { db, ref, get } = await initDB();
    const snap = await get(ref(db, 'settings'));
    return snap.exists() ? snap.val() : { appName: 'English Trainer', teacherPw: '1234' };
  },

  async saveSettings(data) {
    const { db, ref, update } = await initDB();
    await update(ref(db, 'settings'), data);
  },

  async updateStreak(stuId) {
    const { db, ref, get, update } = await initDB();
    const today = Utils.today();
    const snap = await get(ref(db, `students/${stuId}/streak`));
    const s = snap.exists() ? snap.val() : { count: 0, lastDate: '', max: 0 };
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0,10);
    if (s.lastDate === today) return { count: s.count, max: s.max || s.count };
    s.count = (s.lastDate === yesterday) ? s.count + 1 : 1;
    s.lastDate = today;
    if (s.count > (s.max || 0)) s.max = s.count;
    await update(ref(db, `students/${stuId}/streak`), s);
    return { count: s.count, max: s.max };
  },

  async saveListeningProgress(stuId, setId, qNum, done) {
    const { db, ref, update } = await initDB();
    await update(ref(db, `listening/${stuId}/${setId}`), { [qNum]: done });
  },

  async getListeningProgress(stuId, setId) {
    const { db, ref, get } = await initDB();
    const snap = await get(ref(db, `listening/${stuId}/${setId}`));
    return snap.exists() ? snap.val() : {};
  },

  async saveMnemonic(word, mnemonic) {
    const { db, ref, update } = await initDB();
    const key = btoa(encodeURIComponent(word)).replace(/=/g,'');
    await update(ref(db, `mnemonics/${key}`), { word, mnemonic });
  },


  async getBookmarks(stuId) {
    const { db, ref, get } = await initDB();
    const snap = await get(ref(db, `bookmarks/${stuId}`));
    if (!snap.exists()) return {};
    return snap.val();
  },

  async toggleBookmark(stuId, word, ko) {
    const { db, ref, get, set, remove } = await initDB();
    const r = ref(db, `bookmarks/${stuId}/${word}`);
    const snap = await get(r);
    if (snap.exists()) {
      await remove(r);
      return false; // 제거됨
    } else {
      await set(r, { word, ko: ko||'', addedAt: Date.now() });
      return true; // 추가됨
    }
  },

  async saveMemo(stuId, memo) {
    const { db, ref, set } = await initDB();
    await set(ref(db, 'memos/' + stuId), memo || '');
  },

  async getMemo(stuId) {
    const { db, ref, get } = await initDB();
    const snap = await get(ref(db, 'memos/' + stuId));
    return snap.exists() ? snap.val() : '';
  },

  async saveExamSchedule(data) {
    const { db, ref, set } = await initDB();
    await set(ref(db, 'settings/examSchedule'), data);
  },

  async getExamSchedule() {
    const { db, ref, get } = await initDB();
    const snap = await get(ref(db, 'settings/examSchedule'));
    return snap.exists() ? snap.val() : null;
  },

  async saveRecommendedSet(setId, setName, weekNum) {
    const { db, ref, set } = await initDB();
    await set(ref(db, 'settings/recommendedSet'), { setId, setName, weekNum, updatedAt: Date.now() });
  },

  async getRecommendedSet() {
    const { db, ref, get } = await initDB();
    const snap = await get(ref(db, 'settings/recommendedSet'));
    return snap.exists() ? snap.val() : null;
  },

  async addStudyTime(stuId, minutes) {
    const { db, ref, get, update } = await initDB();
    const snap = await get(ref(db, `students/${stuId}/studyTime`));
    const prev = snap.exists() ? (snap.val() || 0) : 0;
    await update(ref(db, `students/${stuId}`), { studyTime: prev + minutes, lastActive: Date.now() });
  },

  async getLastActive(stuId) {
    const { db, ref, get } = await initDB();
    const snap = await get(ref(db, `students/${stuId}/lastActive`));
    return snap.exists() ? snap.val() : null;
  },

  async getMnemonics() {
    const { db, ref, get } = await initDB();
    const snap = await get(ref(db, 'mnemonics'));
    if (!snap.exists()) return {};
    const res = {};
    Object.values(snap.val()).forEach(v => { res[v.word] = v.mnemonic; });
    return res;
  },

  async saveNotice(text) {
    const { db, ref, set } = await initDB();
    await set(ref(db, 'notice'), { text: text || '', updatedAt: Date.now() });
  },

  async getNotice() {
    const { db, ref, get } = await initDB();
    const snap = await get(ref(db, 'notice'));
    return snap.exists() ? snap.val() : null;
  },

  async sendSticker(stuId, emoji, message) {
    const { db, ref, set } = await initDB();
    await set(ref(db, `stickers/${stuId}`), {
      emoji, message, sentAt: Date.now(), read: false
    });
  },

  async getSticker(stuId) {
    const { db, ref, get } = await initDB();
    const snap = await get(ref(db, `stickers/${stuId}`));
    return snap.exists() ? snap.val() : null;
  },

  async markStickerRead(stuId) {
    const { db, ref, update } = await initDB();
    await update(ref(db, `stickers/${stuId}`), { read: true });
  },

  async saveExamRange(setId, setName, week) {
    const { db, ref, set } = await initDB();
    await set(ref(db, 'examRange'), { setId, setName, week, updatedAt: Date.now() });
  },

  async getExamRange() {
    const { db, ref, get } = await initDB();
    const snap = await get(ref(db, 'examRange'));
    return snap.exists() ? snap.val() : null;
  },

  async getFolders(stuId) {
    const { db, ref, get } = await initDB();
    const snap = await get(ref(db, `folders/${stuId}`));
    return snap.exists() ? snap.val() : {};
  },

  async saveFolder(stuId, folderId, data) {
    const { db, ref, set, update } = await initDB();
    if (data === null) {
      await set(ref(db, `folders/${stuId}/${folderId}`), null);
    } else {
      await update(ref(db, `folders/${stuId}/${folderId}`), data);
    }
  },

  async addWordToFolder(stuId, folderId, word, ko) {
    const { db, ref, set } = await initDB();
    const key = btoa(word).replace(/=/g,'');
    await set(ref(db, `folders/${stuId}/${folderId}/words/${key}`), { word, ko: ko||'' });
  },

  async removeWordFromFolder(stuId, folderId, word) {
    const { db, ref, set } = await initDB();
    const key = btoa(word).replace(/=/g,'');
    await set(ref(db, `folders/${stuId}/${folderId}/words/${key}`), null);
  }
,

  // ── XP / 레벨 ──────────────────────────────────
  async getProfile(stuId) {
    const { db, ref, get } = await initDB();
    const snap = await get(ref(db, `profiles/${stuId}`));
    return snap.exists() ? snap.val() : {
      xp:0, level:1, totalDays:0,
      animal:'🐱', borderType:'default',
      selectedTitle:'', customPhotoUrl:''
    };
  },

  async addXP(stuId, amount) {
    const { db, ref, get, update } = await initDB();
    const snap = await get(ref(db, `profiles/${stuId}`));
    const prof = snap.exists() ? snap.val() : { xp:0, level:1 };
    const newXP = (prof.xp || 0) + amount;
    const LEVELS = [0,600,1800,4000,8000,14000,22000,32000,45000,65000];
    let newLv = 1;
    for (let i = LEVELS.length-1; i >= 0; i--) {
      if (newXP >= LEVELS[i]) { newLv = i+1; break; }
    }
    const leveled = newLv > (prof.level || 1);
    const updateData = { xp: newXP, level: newLv };
    // 레벨업 시 칭호 자동 부여 (기존 칭호가 기본값이거나 없을 때만)
    if (leveled) {
      const LEVEL_TITLES = ['','🌱 새싹','📖 입문자','✏️ 학습자','💡 탐구자','🔥 도전자','⚡ 집중자','🎯 실력자','💎 고수','🏹 수능전사','👑 단어마스터'];
      const autoTitle = LEVEL_TITLES[newLv] || '';
      const prevTitle = prof.selectedTitle || '';
      // 이전 칭호가 레벨 기본 칭호였거나 비어있으면 자동 갱신
      const prevLevelTitle = LEVEL_TITLES[prof.level||1] || '';
      if (!prevTitle || prevTitle === prevLevelTitle) {
        updateData.selectedTitle = autoTitle;
      }
    }
    await update(ref(db, `profiles/${stuId}`), updateData);
    return { xp: newXP, level: newLv, leveled, prevLevel: prof.level || 1 };
  },

  async saveProfile(stuId, data) {
    const { db, ref, update } = await initDB();
    await update(ref(db, `profiles/${stuId}`), data);
  },

  async getBadges(stuId) {
    const { db, ref, get } = await initDB();
    const snap = await get(ref(db, `badges/${stuId}`));
    return snap.exists() ? snap.val() : {};
  },

  async awardBadge(stuId, badgeId) {
    const { db, ref, get, update } = await initDB();
    const path = `badges/${stuId}/${badgeId}`;
    const snap = await get(ref(db, path));
    if (snap.exists()) return false;
    await update(ref(db, path), { earnedAt: Date.now() });
    return true;
  },

  async getBadgeProgress(stuId) {
    const { db, ref, get } = await initDB();
    const snap = await get(ref(db, `badge_progress/${stuId}`));
    return snap.exists() ? snap.val() : {};
  },

  async updateBadgeProgress(stuId, updates) {
    const { db, ref, update } = await initDB();
    await update(ref(db, `badge_progress/${stuId}`), updates);
  },

  async getProfileStats(stuId) {
    const { db, ref, get } = await initDB();
    const [profSnap, badgeSnap, progressSnap] = await Promise.all([
      get(ref(db, `profiles/${stuId}`)),
      get(ref(db, `badges/${stuId}`)),
      get(ref(db, `badge_progress/${stuId}`)),
    ]);
    return {
      profile:  profSnap.exists()    ? profSnap.val()    : {},
      badges:   badgeSnap.exists()   ? badgeSnap.val()   : {},
      progress: progressSnap.exists()? progressSnap.val(): {},
    };
  }

};

