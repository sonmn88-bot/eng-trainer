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

window.BADGE_GRADE = {
  bronze:{ stroke:'#FF9A3C', hi:'#FFD280', text:'#FFD280', label:'BRONZE', bg:'#2D1A08' },
  silver:{ stroke:'#E8EAED', hi:'#FFFFFF', text:'#FFFFFF', label:'SILVER', bg:'#151A22' },
  gold:  { stroke:'#FFE566', hi:'#FFF0A0', text:'#FFF0A0', label:'GOLD',   bg:'#251A04' },
  master:{ stroke:'#C77DFF', hi:'#FFFFFF', text:'#C77DFF', label:'MASTER', bg:'#08050E' },
  hidden:{ stroke:'#2A2A2A', hi:'#333',    text:'#444',    label:'HIDDEN', bg:'#0D0D0D' },
};

window.XP_RULES = {
  quiz_correct:8, quiz_wrong:2, quiz_perfect:150,
  weak_correct:15, weak_graduate:80,
  choice_correct:5, speed_complete:30,
  daily_first:50, streak3:100, streak7:250, streak14:500, streak30:1000,
};

window.LEVEL_DEFS = [
  { lv:1,  name:'새싹',      xp:0,     icon:'🌱', border:'default' },
  { lv:2,  name:'입문자',    xp:600,   icon:'📖', border:'default' },
  { lv:3,  name:'학습자',    xp:1800,  icon:'✏️', border:'bronze'  },
  { lv:4,  name:'탐구자',    xp:4000,  icon:'💡', border:'bronze'  },
  { lv:5,  name:'도전자',    xp:8000,  icon:'🔥', border:'silver'  },
  { lv:6,  name:'집중자',    xp:14000, icon:'⚡', border:'silver'  },
  { lv:7,  name:'실력자',    xp:22000, icon:'🎯', border:'gold'    },
  { lv:8,  name:'고수',      xp:32000, icon:'💎', border:'gold'    },
  { lv:9,  name:'수능전사',  xp:45000, icon:'🏹', border:'master'  },
  { lv:10, name:'단어마스터',xp:65000, icon:'👑', border:'master'  },
];

window.PROFILE_ANIMALS = ['🐱','🐶','🦊','🐯','🐻','🐼','🐸','🦁','🐺','🦝','🐨','🦄'];
