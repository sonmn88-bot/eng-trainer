// 배지 정의, XP 규칙, 레벨 정의
window.BADGE_DEFS = [
  // 📚 학습량
  { id:'first_step',    name:'첫걸음',     desc:'첫 퀴즈 완료',                    icon:'👣', grade:'bronze', cat:'study' },
  { id:'studious',      name:'열공러',     desc:'퀴즈 100회 완료',                  icon:'📖', grade:'bronze', cat:'study' },
  { id:'veteran',       name:'백전노장',   desc:'퀴즈 200회 완료',                  icon:'⚔️', grade:'silver', cat:'study' },
  { id:'quiz_machine',  name:'퀴즈머신',   desc:'퀴즈 500회 완료',                  icon:'🤖', grade:'gold',   cat:'study' },
  { id:'word_hunter',   name:'단어사냥꾼', desc:'누적 학습 단어 3,000개',           icon:'🎣', grade:'silver', cat:'study' },
  { id:'vocab_king',    name:'어휘왕',     desc:'누적 학습 단어 8,000개',           icon:'📚', grade:'gold',   cat:'study' },
  // 🎯 정확도
  { id:'perfect',       name:'퍼펙트',     desc:'퀴즈 100% 첫 달성',               icon:'🎯', grade:'bronze', cat:'accuracy' },
  { id:'iron_wall',     name:'철벽수비',   desc:'퀴즈 100% 누적 10회',             icon:'🛡️', grade:'silver', cat:'accuracy' },
  { id:'perfectionist', name:'완벽주의자', desc:'퀴즈 100% 누적 30회',             icon:'💫', grade:'gold',   cat:'accuracy' },
  { id:'scorer',        name:'고득점자',   desc:'최근 10회 평균 80% 이상',         icon:'📈', grade:'bronze', cat:'accuracy' },
  { id:'honor',         name:'우등생',     desc:'최근 20회 평균 85% 이상',         icon:'🌟', grade:'silver', cat:'accuracy' },
  { id:'valedictorian', name:'수석',       desc:'최근 30회 평균 90% 이상',         icon:'🥇', grade:'gold',   cat:'accuracy' },
  // 🔥 출석
  { id:'streak3',       name:'3일 연속',   desc:'연속 출석 3일',                   icon:'🔥', grade:'bronze', cat:'attend' },
  { id:'streak7',       name:'1주 개근',   desc:'연속 출석 7일',                   icon:'📅', grade:'bronze', cat:'attend' },
  { id:'streak14',      name:'2주 불꽃',   desc:'연속 출석 14일',                  icon:'💫', grade:'silver', cat:'attend' },
  { id:'streak30',      name:'한달 전설',  desc:'연속 출석 30일',                  icon:'👑', grade:'gold',   cat:'attend' },
  { id:'total60',       name:'꾸준함의힘', desc:'총 출석일 60일',                  icon:'💪', grade:'silver', cat:'attend' },
  { id:'total100',      name:'수험생의자세',desc:'총 출석일 100일',                icon:'🏅', grade:'gold',   cat:'attend' },
  // ⚡ 취약단어
  { id:'grad_first',    name:'첫 졸업',    desc:'취약단어 1개 첫 졸업',            icon:'🎓', grade:'bronze', cat:'weak' },
  { id:'grad20',        name:'졸업생',     desc:'취약단어 누적 20개 졸업',         icon:'📜', grade:'bronze', cat:'weak' },
  { id:'grad60',        name:'우등졸업생', desc:'취약단어 누적 60개 졸업',         icon:'🏫', grade:'silver', cat:'weak' },
  { id:'grad150',       name:'졸업의신',   desc:'취약단어 누적 150개 졸업',        icon:'🌠', grade:'gold',   cat:'weak' },
  { id:'comeback',      name:'오뚝이',     desc:'5회 이상 틀린 단어 10개 정복',   icon:'🦾', grade:'silver', cat:'weak' },
  { id:'phoenix',       name:'불사조',     desc:'10회 이상 틀린 단어 5개 정복',   icon:'🔱', grade:'gold',   cat:'weak' },
  // 🎮 스킬/콤보
  { id:'combo10',       name:'콤보입문',   desc:'10연속 정답',                     icon:'💥', grade:'bronze', cat:'skill' },
  { id:'combo20',       name:'콤보왕',     desc:'20연속 정답',                     icon:'⚡', grade:'silver', cat:'skill' },
  { id:'combo30',       name:'콤보전설',   desc:'30연속 정답',                     icon:'🌪️', grade:'gold',   cat:'skill' },
  { id:'speed_basic',   name:'속독왕',     desc:'속도인식 30개 이상 정답 1회',    icon:'💨', grade:'bronze', cat:'skill' },
  { id:'speed_master',  name:'번개손',     desc:'속도인식 40개 전부 정답 3회',    icon:'🌩️', grade:'silver', cat:'skill' },
  { id:'blank_good',    name:'빈칸고수',   desc:'빈칸채우기 80% 이상 5회',        icon:'✏️', grade:'bronze', cat:'skill' },
  { id:'blank_master',  name:'빈칸마스터', desc:'빈칸채우기 90% 이상 10회',       icon:'🖊️', grade:'silver', cat:'skill' },
  { id:'card_master',   name:'카드달인',   desc:'카드연습 세트 전체 체크 5회',    icon:'🃏', grade:'silver', cat:'skill' },
  // ⭐ 특별/히든
  { id:'night_owl',     name:'올빼미',     desc:'???', icon:'🌙', grade:'hidden', cat:'special', hint:'시간대와 관련 있어요' },
  { id:'early_bird',    name:'새벽용사',   desc:'???', icon:'🌅', grade:'hidden', cat:'special', hint:'아주 이른 아침에...' },
  { id:'weekend',       name:'주말전사',   desc:'???', icon:'🗓️', grade:'hidden', cat:'special', hint:'쉬는 날에도 공부하면' },
  { id:'day_one',       name:'첫날부터',   desc:'???', icon:'🌟', grade:'hidden', cat:'special', hint:'등록하자마자 바로!' },
  { id:'exam_eve',      name:'시험전야',   desc:'???', icon:'🎯', grade:'hidden', cat:'special', hint:'D-day가 가까워지면' },
  { id:'all_rounder',   name:'올라운더',   desc:'모든 학습 모드 각 5회씩',        icon:'🎭', grade:'silver', cat:'special' },
  { id:'listening_kill',name:'리스닝킬러', desc:'리스닝 전 회차 완료',             icon:'🎧', grade:'silver', cat:'special' },
  { id:'legend_start',  name:'전설의시작', desc:'Lv.8 달성',                      icon:'💎', grade:'gold',   cat:'special' },
];

// 배지로 획득하는 칭호 (퀘스트 보상)
window.BADGE_TITLES = {
  'first_step':     { title:'👣 첫걸음',     desc:'첫 퀴즈를 완료한 자' },
  'studious':       { title:'📖 열공러',     desc:'꾸준히 100회를 채운 자' },
  'veteran':        { title:'⚔️ 백전노장',   desc:'200번의 전투를 치른 전사' },
  'quiz_machine':   { title:'🤖 퀴즈머신',  desc:'500번을 도전한 기계' },
  'word_hunter':    { title:'🎣 단어사냥꾼', desc:'3,000개를 사냥한 자' },
  'vocab_king':     { title:'📚 어휘왕',     desc:'8,000개의 어휘를 정복한 왕' },
  'perfect':        { title:'🎯 퍼펙트',     desc:'완벽한 답을 낸 자' },
  'perfectionist':  { title:'💫 완벽주의자', desc:'30번의 완벽함을 증명한 자' },
  'valedictorian':  { title:'🥇 수석',       desc:'반에서 가장 빛나는 자' },
  'streak7':        { title:'📅 개근왕',     desc:'7일을 쉬지 않은 자' },
  'streak14':       { title:'💫 불꽃인간',   desc:'2주를 불태운 자' },
  'streak30':       { title:'👑 스트릭왕',   desc:'한 달을 버텨낸 전설' },
  'total100':       { title:'🏅 100일전사',  desc:'100일을 함께한 자' },
  'grad150':        { title:'🌠 졸업의신',   desc:'150개의 약점을 극복한 자' },
  'phoenix':        { title:'🔱 불사조',     desc:'죽어도 다시 일어서는 자' },
  'combo30':        { title:'🌪️ 콤보전설',   desc:'30연속을 이어간 전설' },
  'night_owl':      { title:'🌙 올빼미',     desc:'밤에도 공부하는 신비로운 자' },
  'early_bird':     { title:'🌅 새벽용사',   desc:'새벽을 깨운 용사' },
  'all_rounder':    { title:'🎭 올라운더',   desc:'모든 것을 할 줄 아는 자' },
  'listening_kill': { title:'🎧 리스닝킬러', desc:'리스닝을 정복한 자' },
  'legend_start':   { title:'💎 레전드',     desc:'전설의 문턱에 선 자' },
  'total60':        { title:'💪 꾸준함',     desc:'60일을 함께한 자' },
  'comeback':       { title:'🦾 오뚝이',     desc:'쓰러져도 다시 일어선 자' },
};



window.BADGE_GRADE = {
  bronze:{ stroke:'#FF9A3C', hi:'#FFD280', text:'#FFD280', label:'BRONZE', bg:'#2D1A08' },
  silver:{ stroke:'#E8EAED', hi:'#FFFFFF', text:'#FFFFFF', label:'SILVER', bg:'#151A22' },
  gold:  { stroke:'#FFE566', hi:'#FFF0A0', text:'#FFF0A0', label:'GOLD',   bg:'#251A04' },
  master:{ stroke:'#C77DFF', hi:'#FFFFFF', text:'#C77DFF', label:'MASTER', bg:'#08050E' },
  hidden:{ stroke:'#2A2A2A', hi:'#333',    text:'#444',    label:'HIDDEN', bg:'#0D0D0D' },
};

window.XP_RULES = {
  // 퀴즈 1문제 기준: 하루 20문제 = 약 100XP 목표
  quiz_correct:5,   // 정답 1개 (기존 8 → 5)
  quiz_wrong:0,     // 오답은 XP 없음 (기존 2 → 0)
  quiz_perfect:80,  // 100% 달성 보너스 (기존 150 → 80)
  weak_correct:8,   // 취약단어 정답 (기존 15 → 8)
  weak_graduate:50, // 취약단어 졸업 (기존 80 → 50)
  choice_correct:3, // 4지선다 정답 (기존 5 → 3)
  speed_complete:20,// 스피드 모드 완료
  daily_first:30,   // 오늘 첫 퀴즈 보너스 (기존 50 → 30)
  streak3:60, streak7:150, streak14:300, streak30:600, // 스트릭 보너스 조정
};

// 레벨 설계: 하루 100XP 기준
// Lv2: 7일, Lv3: 20일, Lv5: 2달, Lv7: 6달, Lv10: 1년+
window.LEVEL_DEFS = [
  { lv:1,  name:'새싹',      xp:0,      icon:'🌱', border:'default' },
  { lv:2,  name:'입문자',    xp:700,    icon:'📖', border:'default' },
  { lv:3,  name:'학습자',    xp:2000,   icon:'✏️', border:'bronze'  },
  { lv:4,  name:'탐구자',    xp:4500,   icon:'💡', border:'bronze'  },
  { lv:5,  name:'도전자',    xp:9000,   icon:'🔥', border:'silver'  },
  { lv:6,  name:'집중자',    xp:16000,  icon:'⚡', border:'silver'  },
  { lv:7,  name:'실력자',    xp:26000,  icon:'🎯', border:'gold'    },
  { lv:8,  name:'고수',      xp:40000,  icon:'💎', border:'gold'    },
  { lv:9,  name:'수능전사',  xp:60000,  icon:'🏹', border:'master'  },
  { lv:10, name:'단어마스터',xp:65000, icon:'👑', border:'master'  },
];

window.PROFILE_ANIMALS = ['🐱','🐶','🦊','🐯','🐻','🐼','🐸','🦁','🐺','🦝','🐨','🦄'];
