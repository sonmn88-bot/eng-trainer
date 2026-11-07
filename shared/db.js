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
let _app = null;
let _authMod = null;
let _auth = null;

// ── 로그인(Firebase Auth) ─────────────────────────
// 학생: 이름 → loginIndex 로 학생 ID를 찾고, 학생 ID로 만든 내부 이메일 + 비밀번호로 로그인
// 선생님: 고정 내부 이메일 + 선생님 비밀번호, admins/{uid} 로 관리자 판별
const STUDENT_EMAIL_DOMAIN = '@students.eng-trainer.app';
const TEACHER_EMAIL = 'teacher@eng-trainer.app';
function _fbPw(pw) { return 'etrn::' + pw; } // Firebase 최소 6자 맞춤 (짧은 기존 비밀번호도 허용)
function _stuEmail(id, ver) { return id + (ver ? '.v' + ver : '') + STUDENT_EMAIL_DOMAIN; }

async function initDB() {
  if (_db) return _db;
  const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
  const { getDatabase, ref, get, set, update, push, remove, serverTimestamp }
    = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js');
  _authMod = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js');
  _app = initializeApp(FIREBASE_CONFIG);
  _auth = _authMod.getAuth(_app);
  const _dbInst = getDatabase(_app);
  // 로컬 검증용: 테스트 도구가 window.__FB_EMU 를 넣었을 때만 에뮬레이터에 연결 (운영에는 영향 없음)
  if (window.__FB_EMU) {
    const { connectDatabaseEmulator } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js');
    connectDatabaseEmulator(_dbInst, '127.0.0.1', 9000);
    _authMod.connectAuthEmulator(_auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  }
  // 저장된 로그인 상태가 복원된 뒤에 DB 요청 (규칙이 로그인 상태를 보므로)
  await new Promise(res => { const un = _authMod.onAuthStateChanged(_auth, () => { un(); res(); }); });
  _db = { db: _dbInst, ref, get, set, update, push, remove, serverTimestamp };
  return _db;
}

const DB = {
  // ── 로그인 ──────────────────────────────────
  loginKey(name) {
    return encodeURIComponent(String(name || '').trim()).replace(/\./g, '%2E');
  },
  async currentUid() {
    await initDB();
    return _auth.currentUser ? _auth.currentUser.uid : null;
  },
  async isAdmin() {
    const { db, ref, get } = await initDB();
    if (!_auth.currentUser) return false;
    try { return (await get(ref(db, `admins/${_auth.currentUser.uid}`))).val() === true; }
    catch (e) { return false; }
  },
  // 로그인된 학생 계정이면 { id, name } (자동 로그인 복원용)
  async myStudent() {
    const { db, ref, get } = await initDB();
    if (!_auth.currentUser) return null;
    try { return (await get(ref(db, `uids/${_auth.currentUser.uid}`))).val(); }
    catch (e) { return null; }
  },
  // 이름으로 로그인 정보 조회: { id, ready, ver } | null
  async lookupLogin(name) {
    const { db, ref, get } = await initDB();
    const snap = await get(ref(db, `loginIndex/${this.loginKey(name)}`));
    return snap.exists() ? snap.val() : null;
  },
  async _setPersistence(remember) {
    await initDB();
    await _authMod.setPersistence(_auth, remember ? _authMod.browserLocalPersistence : _authMod.browserSessionPersistence);
  },
  async studentSignIn(entry, pw, remember) {
    await this._setPersistence(remember);
    await _authMod.signInWithEmailAndPassword(_auth, _stuEmail(entry.id, entry.ver), _fbPw(pw));
  },
  // 첫 입장(계정 없음): 학생이 비밀번호를 만들고 계정 생성 + 연결
  async studentCreate(entry, name, pw, remember) {
    const { db, ref, set, update } = await initDB();
    await this._setPersistence(remember);
    const cred = await _authMod.createUserWithEmailAndPassword(_auth, _stuEmail(entry.id, entry.ver), _fbPw(pw));
    const uid = cred.user.uid;
    // 순서 중요: 규칙이 앞 단계 결과를 확인함
    await set(ref(db, `students/${entry.id}/uid`), uid);
    await set(ref(db, `uids/${uid}`), { id: entry.id, name });
    await set(ref(db, `loginIndex/${this.loginKey(name)}`), { id: entry.id, ready: true, ver: entry.ver || 0 });
    await update(ref(db, `students/${entry.id}`), { password: null, loginKey: this.loginKey(name) });
  },
  async signOut() {
    await initDB();
    await _authMod.signOut(_auth);
  },
  async changeMyPassword(newPw) {
    await initDB();
    await _authMod.updatePassword(_auth.currentUser, _fbPw(newPw));
  },
  // 선생님 로그인. 계정이 아직 없으면 기존 settings.teacherPw 와 맞을 때 한 번만 계정 생성
  async teacherLogin(pw) {
    const { db, ref, get, set } = await initDB();
    await this._setPersistence(true);
    try {
      await _authMod.signInWithEmailAndPassword(_auth, TEACHER_EMAIL, _fbPw(pw));
    } catch (e) {
      if (e.code === 'auth/wrong-password') return false; // 계정은 있고 비밀번호만 틀림
      if (e.code !== 'auth/invalid-credential' && e.code !== 'auth/user-not-found') throw e;
      let legacy = null;
      try { legacy = (await get(ref(db, 'settings/teacherPw'))).val(); } catch (e2) {}
      if (!legacy || legacy !== pw) return false;
      try {
        await _authMod.createUserWithEmailAndPassword(_auth, TEACHER_EMAIL, _fbPw(pw));
      } catch (e3) {
        if (e3.code === 'auth/email-already-in-use') return false; // 계정은 있는데 비밀번호가 다름
        throw e3;
      }
      await set(ref(db, `admins/${_auth.currentUser.uid}`), true);
    }
    return await this.isAdmin();
  },
  async changeTeacherPassword(oldPw, newPw) {
    await initDB();
    const cred = _authMod.EmailAuthProvider.credential(TEACHER_EMAIL, _fbPw(oldPw));
    await _authMod.reauthenticateWithCredential(_auth.currentUser, cred);
    await _authMod.updatePassword(_auth.currentUser, _fbPw(newPw));
  },
  // (관리자) 학생 이름 → 로그인 정보 등록/갱신. 이름이 바뀌면 옛 키 삭제
  async registerLogin(id, name, oldName) {
    const { db, ref, get, update } = await initDB();
    const key = this.loginKey(name);
    const updates = {};
    let prev = null;
    if (oldName && oldName !== name) {
      const oldKey = this.loginKey(oldName);
      prev = (await get(ref(db, `loginIndex/${oldKey}`))).val();
      updates[`loginIndex/${oldKey}`] = null;
    }
    const cur = prev || (await get(ref(db, `loginIndex/${key}`))).val();
    const stu = (await get(ref(db, `students/${id}`))).val() || {};
    updates[`loginIndex/${key}`] = { id, ready: !!stu.uid, ver: (cur && cur.id === id && cur.ver) || 0 };
    updates[`students/${id}/loginKey`] = key;
    if (stu.uid) updates[`uids/${stu.uid}`] = { id, name };
    await update(ref(db), updates);
  },
  // (관리자) 학생 로그인 초기화: 다음 입장 때 학생이 새 비밀번호를 만든다
  async resetStudentLogin(id) {
    const { db, ref, get, update } = await initDB();
    const stu = (await get(ref(db, `students/${id}`))).val() || {};
    const key = stu.loginKey || this.loginKey(stu.name);
    const cur = (await get(ref(db, `loginIndex/${key}`))).val() || {};
    const updates = {};
    updates[`loginIndex/${key}`] = { id, ready: false, ver: (cur.ver || 0) + 1 };
    updates[`students/${id}/uid`] = null;
    updates[`students/${id}/password`] = null;
    if (stu.uid) updates[`uids/${stu.uid}`] = null;
    await update(ref(db), updates);
  },
  // (관리자) 기존 학생 전체를 로그인 계정으로 전환. 이미 전환된 학생은 건너뜀. 다시 실행해도 안전
  async migrateAllToAuth(onProgress) {
    const { db, ref, get, update } = await initDB();
    const { initializeApp, deleteApp } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
    const secApp = initializeApp(FIREBASE_CONFIG, 'migrate-' + Date.now());
    const secAuth = _authMod.getAuth(secApp);
    if (window.__FB_EMU) _authMod.connectAuthEmulator(secAuth, 'http://127.0.0.1:9099', { disableWarnings: true });
    await _authMod.setPersistence(secAuth, _authMod.inMemoryPersistence);
    const all = (await get(ref(db, 'students'))).val() || {};
    const report = { done: 0, noPassword: 0, skipped: 0, failed: [], duplicateNames: [] };
    const seen = {};
    const ids = Object.keys(all);
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i], stu = all[id] || {};
      if (onProgress) onProgress(i + 1, ids.length, stu.name);
      if (!stu.name) { report.skipped++; continue; }
      const key = this.loginKey(stu.name);
      if (seen[key]) { report.duplicateNames.push(stu.name); continue; }
      seen[key] = true;
      const updates = { [`students/${id}/loginKey`]: key };
      try {
        if (stu.uid) {
          updates[`loginIndex/${key}`] = { id, ready: true, ver: 0 };
          updates[`uids/${stu.uid}`] = { id, name: stu.name };
          report.skipped++;
        } else if (stu.password) {
          let uid;
          try {
            uid = (await _authMod.createUserWithEmailAndPassword(secAuth, _stuEmail(id, 0), _fbPw(stu.password))).user.uid;
          } catch (e) {
            if (e.code !== 'auth/email-already-in-use') throw e;
            uid = (await _authMod.signInWithEmailAndPassword(secAuth, _stuEmail(id, 0), _fbPw(stu.password))).user.uid;
          }
          await _authMod.signOut(secAuth);
          updates[`students/${id}/uid`] = uid;
          updates[`students/${id}/password`] = null;
          updates[`uids/${uid}`] = { id, name: stu.name };
          updates[`loginIndex/${key}`] = { id, ready: true, ver: 0 };
          report.done++;
        } else {
          updates[`loginIndex/${key}`] = { id, ready: false, ver: 0 };
          report.noPassword++;
        }
        await update(ref(db), updates);
      } catch (e) {
        report.failed.push(stu.name + ' (' + (e.code || e.message) + ')');
      }
    }
    try { await deleteApp(secApp); } catch (e) {}
    return report;
  },
  // (관리자) 학생 삭제 시 로그인 정보도 삭제
  async removeLogin(key, uid) {
    const { db, ref, update } = await initDB();
    const updates = {};
    if (key) updates[`loginIndex/${key}`] = null;
    if (uid) updates[`uids/${uid}`] = null;
    if (Object.keys(updates).length) await update(ref(db), updates);
  },
  // (관리자) 전환이 끝난 뒤 남은 평문 비밀번호 정리
  async removeLegacyTeacherPw() {
    const { db, ref, update } = await initDB();
    await update(ref(db, 'settings'), { teacherPw: null });
  },

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

  async updateWeakWord(stuId, word, ko, correct, neutral) {
    const { db, ref, get, update } = await initDB();
    const path = `students/${stuId}/weakWords/${btoa(word).replace(/=/g,'')}`;
    const snap = await get(ref(db, path));
    // 핵심: 오답일 때만 신규 등록, 이미 등록된 단어만 정답 업데이트
    if (!snap.exists()) {
      if (correct) return; // 처음 보는 단어를 맞혔으면 취약단어 등록 안 함
      // 애매해요(neutral)는 오답 횟수 없이 복습 목록에만 등록
      await update(ref(db, path), { word, ko: ko||'', wrong: neutral ? 0 : 1, right: 0, streak: 0, lastStudied: Date.now() });
      return;
    }
    const curr = snap.val();
    if (ko && !curr.ko) curr.ko = ko;
    if (neutral) { /* 애매해요: 연속정답/오답 모두 유지, 복습 시각만 갱신 */ }
    else if (correct) { curr.right++; curr.streak++; }
    else { curr.wrong++; curr.streak = 0; }
    curr.lastStudied = Date.now();
    await update(ref(db, path), curr);
  },

  // 퀴즈에서 맞힌 단어 기록 (홈 주간 진도용). 키: 소문자 단어를 URI 인코딩('.'도 인코딩)
  _wordKey(word) {
    return encodeURIComponent(String(word || '').toLowerCase()).replace(/\./g, '%2E');
  },
  async markCorrect(stuId, word) {
    if (!stuId || stuId === 'guest' || !word) return;
    const { db, ref, update } = await initDB();
    await update(ref(db, `students/${stuId}/correctWords`), { [this._wordKey(word)]: Date.now() });
  },
  async getCorrectWords(stuId) {
    const { db, ref, get } = await initDB();
    const snap = await get(ref(db, `students/${stuId}/correctWords`));
    return snap.exists() ? snap.val() : {};
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


  _bk(word) { return String(word).replace(/[.#$\[\]\/]/g, '_'); },

  async getBookmarks(stuId) {
    const { db, ref, get } = await initDB();
    const snap = await get(ref(db, `bookmarks/${stuId}`));
    if (!snap.exists()) return {};
    return snap.val();
  },



  // ── 학생 개인 단어장 ──
  async saveMyWord(stuId, word, data) {
    const { db, ref, update } = await initDB();
    const key = btoa(encodeURIComponent(word.toLowerCase())).replace(/=/g,'');
    await update(ref(db, `myWords/${stuId}/${key}`), data);
    return key;
  },

  async getMyWords(stuId) {
    const { db, ref, get } = await initDB();
    const snap = await get(ref(db, `myWords/${stuId}`));
    return snap.exists() ? snap.val() : {};
  },

  async deleteMyWord(stuId, key) {
    const { db, ref, set } = await initDB();
    await set(ref(db, `myWords/${stuId}/${key}`), null);
  },

  async saveBookmark(stuId, word, ko) {
    const { db, ref, set } = await initDB();
    // 키는 항상 소문자: 대소문자만 다른 중복 북마크가 생기지 않게 함
    await set(ref(db, `bookmarks/${stuId}/${this._bk(String(word).toLowerCase())}`), { word, ko: ko||'', addedAt: Date.now() });
  },
  // 북마크 완전 해제: 전체 북마크(대소문자 다른 키 포함)와 폴더 안 같은 단어를 한 번에(전부 성공하거나 전부 실패) 제거
  async unbookmarkEverywhere(stuId, bookmarkKeys, folderRefs) {
    const { db, ref, update } = await initDB();
    const u = {};
    (bookmarkKeys || []).forEach(k => { if (k) u[`bookmarks/${stuId}/${k}`] = null; });
    (folderRefs || []).forEach(r => { if (r && r.fid && r.key) u[`folders/${stuId}/${r.fid}/words/${r.key}`] = null; });
    if (Object.keys(u).length) await update(ref(db), u);
  },

  async removeBookmark(stuId, word) {
    const { db, ref, remove } = await initDB();
    await remove(ref(db, `bookmarks/${stuId}/${this._bk(word)}`));
  },



  async migrateOldMemos() {
    const { db, ref, get, update, remove } = await initDB();
    const snap = await get(ref(db, 'memos'));
    if (!snap.exists()) return 0;
    const oldMemos = snap.val();
    let count = 0;
    for (const stuId in oldMemos) {
      const memoText = oldMemos[stuId];
      if (memoText && memoText.trim()) {
        await update(ref(db, `students/${stuId}`), { memo: memoText });
        count++;
      }
    }
    await remove(ref(db, 'memos')); // 이전 완료 후 구 경로 삭제
    return count;
  },
  async saveMemo(stuId, memo) {
    const { db, ref, update } = await initDB();
    await update(ref(db, `students/${stuId}`), { memo: memo || '' });
  },

  async getMemo(stuId) {
    const { db, ref, get } = await initDB();
    const snap = await get(ref(db, `students/${stuId}/memo`));
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



  async cleanupLegacyStickers() {
    const { db, ref, get, remove, update } = await initDB();
    const snap = await get(ref(db, 'stickers'));
    if (!snap.exists()) return 0;
    const all = snap.val();
    let cleaned = 0;
    for (const stuId in all) {
      const node = all[stuId];
      const flatFields = {};
      let hasFlat = false;
      for (const k in node) {
        const v = node[k];
        // 키가 'sticker_'로 시작하지 않는데 값이 객체가 아니면 레거시 평면 필드
        if (!k.startsWith('sticker_') && (typeof v !== 'object' || v === null)) {
          hasFlat = true;
        }
      }
      if (hasFlat) {
        // 레거시 평면 필드만 제거 (emoji/message/text/sentAt/read 등 최상위 원시값)
        await update(ref(db, `stickers/${stuId}`), {
          emoji: null, message: null, text: null, sentAt: null, read: null
        });
        cleaned++;
      }
    }
    return cleaned;
  },
  async saveSticker(stuId, emoji, text) {
    const { db, ref, set } = await initDB();
    const key = 'sticker_' + Date.now();
    await set(ref(db, `stickers/${stuId}/${key}`), {
      emoji, text, sentAt: Date.now(), read: false
    });
  },

  async getStickers(stuId) {
    const { db, ref, get } = await initDB();
    const snap = await get(ref(db, `stickers/${stuId}`));
    return snap.exists() ? snap.val() : {};
  },

  async markStickerRead(stuId, key) {
    return this.markStickersRead(stuId, [key]);
  },
  // 여러 메시지를 한 번에 읽음 처리 (키가 비면 쓰지 않음: 예전엔 묶음 위치에 read가 잘못 써졌음)
  async markStickersRead(stuId, keys) {
    const { db, ref, update } = await initDB();
    const updates = {};
    (keys || []).forEach(k => { if (stuId && k) updates[`${k}/read`] = true; });
    if (!Object.keys(updates).length) return;
    await update(ref(db, `stickers/${stuId}`), updates);
  },

  async saveStudentPassword(stuId, password) {
    const { db, ref, update } = await initDB();
    await update(ref(db, `students/${stuId}`), { password: password || '' });
  },

  async getStudentPassword(stuId) {
    const { db, ref, get } = await initDB();
    const snap = await get(ref(db, `students/${stuId}/password`));
    return snap.exists() ? snap.val() : '';
  },


  // ── 골드 시스템 ────────────────────────────
  async getGold(stuId) {
    const { db, ref, get } = await initDB();
    const snap = await get(ref(db, `gold/${stuId}`));
    if (!snap.exists()) return { amount: 0, totalEarned: 0, lastDailyDate: '', dailyEarned: 0 };
    return snap.val();
  },

  async addGold(stuId, amount, reason) {
    const { db, ref, get, update } = await initDB();
    const path = `gold/${stuId}`;
    const snap = await get(ref(db, path));
    const g = snap.exists() ? snap.val() : { amount: 0, totalEarned: 0, lastDailyDate: '', dailyEarned: 0 };

    const today = new Date().toISOString().slice(0, 10);
    // 날짜 리셋
    if (g.lastDailyDate !== today) { g.dailyEarned = 0; g.lastDailyDate = today; }

    // 하루 획득 상한 15골드
    const DAILY_MAX = 15;
    const MAX_HOLD  = 50;
    const canEarn = Math.min(amount, DAILY_MAX - (g.dailyEarned || 0));
    if (canEarn <= 0) return { amount: g.amount, capped: true };

    g.amount      = Math.min(MAX_HOLD, (g.amount || 0) + canEarn);
    g.totalEarned = (g.totalEarned || 0) + canEarn;
    g.dailyEarned = (g.dailyEarned || 0) + canEarn;
    g.lastDailyDate = today;

    await update(ref(db, path), g);
    return { amount: g.amount, earned: canEarn, dailyEarned: g.dailyEarned };
  },

  async spendGold(stuId, amount) {
    const { db, ref, get, update } = await initDB();
    const path = `gold/${stuId}`;
    const snap = await get(ref(db, path));
    const g = snap.exists() ? snap.val() : { amount: 0 };
    if ((g.amount || 0) < amount) return { success: false, amount: g.amount || 0 };
    g.amount = (g.amount || 0) - amount;
    await update(ref(db, path), g);
    return { success: true, amount: g.amount };
  },

  async getDailyFreeItems(stuId) {
    const { db, ref, get } = await initDB();
    const snap = await get(ref(db, `daily_free/${stuId}`));
    const today = new Date().toISOString().slice(0, 10);
    if (!snap.exists() || snap.val().date !== today) {
      return { date: today, hint: 0, shield: 0, skip: 0 };
    }
    return snap.val();
  },

  async useDailyFreeItem(stuId, itemType) {
    const { db, ref, get, update } = await initDB();
    const path = `daily_free/${stuId}`;
    const today = new Date().toISOString().slice(0, 10);
    const snap = await get(ref(db, path));
    const d = (snap.exists() && snap.val().date === today)
      ? snap.val()
      : { date: today, hint: 0, shield: 0, skip: 0 };

    const limits = { hint: 2, shield: 1, skip: 1 };
    if ((d[itemType] || 0) >= (limits[itemType] || 0)) return { success: false, used: d[itemType] };
    d[itemType] = (d[itemType] || 0) + 1;
    await update(ref(db, path), d);
    return { success: true, used: d[itemType], limit: limits[itemType] };
  },


  async clearAllWeakWords(stuId) {
    const { db, ref, set } = await initDB();
    await set(ref(db, `students/${stuId}/weakWords`), null);
  },

  async clearAllWeakWordsAll(students) {
    // 전체 학생 취약단어 초기화
    const { db, ref, set } = await initDB();
    const promises = Object.keys(students).map(id =>
      set(ref(db, `students/${id}/weakWords`), null)
    );
    await Promise.all(promises);
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
