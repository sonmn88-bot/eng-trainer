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
    const s = snap.exists() ? snap.val() : { count: 0, lastDate: '' };
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0,10);
    if (s.lastDate === today) return s.count;
    s.count = (s.lastDate === yesterday) ? s.count + 1 : 1;
    s.lastDate = today;
    await update(ref(db, `students/${stuId}/streak`), s);
    return s.count;
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
};
