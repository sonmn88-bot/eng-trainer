// ── Firebase DB ───────────────────────────────
// 설정값을 여기에 채워 넣으세요 (Firebase Console → 프로젝트 설정 → 앱)
const FIREBASE_CONFIG = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT.firebaseapp.com",
  databaseURL:       "https://YOUR_PROJECT-default-rtdb.firebaseio.com",
  projectId:         "YOUR_PROJECT",
  storageBucket:     "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId:             "YOUR_APP_ID"
};

let _db = null;

async function initDB() {
  if (_db) return _db;
  const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
  const { getDatabase, ref, get, set, update, push, serverTimestamp }
    = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js');
  const app = initializeApp(FIREBASE_CONFIG);
  _db = { db: getDatabase(app), ref, get, set, update, push, serverTimestamp };
  return _db;
}

const DB = {
  // ── Students ──
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
    const { db, ref, update } = await initDB();
    await update(ref(db, `students/${id}`), data);
  },

  async createStudent(name) {
    const id = 'stu_' + Date.now();
    await DB.saveStudent(id, { id, name, createdAt: new Date().toISOString() });
    return id;
  },

  // ── Quiz Results ──
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

  // ── Weak Words ──
  async updateWeakWord(stuId, word, correct) {
    const { db, ref, get, update } = await initDB();
    const path = `students/${stuId}/weakWords/${btoa(word).replace(/=/g,'')}`;
    const snap = await get(ref(db, path));
    const curr = snap.exists() ? snap.val() : { word, wrong: 0, right: 0, streak: 0 };
    if (correct) {
      curr.right++; curr.streak++;
    } else {
      curr.wrong++; curr.streak = 0;
    }
    await update(ref(db, path), curr);
  },

  async getWeakWords(stuId) {
    const { db, ref, get } = await initDB();
    const snap = await get(ref(db, `students/${stuId}/weakWords`));
    if (!snap.exists()) return [];
    return Object.values(snap.val()).filter(w => w.streak < 3);
  },

  // ── App Settings ──
  async getSettings() {
    const { db, ref, get } = await initDB();
    const snap = await get(ref(db, 'settings'));
    return snap.exists() ? snap.val() : { appName: 'English Trainer', teacherPw: '1234' };
  },

  async saveSettings(data) {
    const { db, ref, update } = await initDB();
    await update(ref(db, 'settings'), data);
  },

  // ── Streak ──
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

  // ── Listening Progress ──
  async saveListeningProgress(stuId, setId, qNum, done) {
    const { db, ref, update } = await initDB();
    await update(ref(db, `listening/${stuId}/${setId}`), { [qNum]: done });
  },

  async getListeningProgress(stuId, setId) {
    const { db, ref, get } = await initDB();
    const snap = await get(ref(db, `listening/${stuId}/${setId}`));
    return snap.exists() ? snap.val() : {};
  },

  // ── Mnemonic (선생님이 고정한 연상법) ──
  async saveMnemonic(word, mnemonic) {
    const { db, ref, update } = await initDB();
    const key = btoa(encodeURIComponent(word)).replace(/=/g,'');
    await update(ref(db, `mnemonics/${key}`), { word, mnemonic });
  },

  async getMnemonics() {
    const { db, ref, get } = await initDB();
    const snap = await get(ref(db, 'mnemonics'));
    if (!snap.exists()) return {};
    const res = {};
    Object.values(snap.val()).forEach(v => { res[v.word] = v.mnemonic; });
    return res;
  }
};
