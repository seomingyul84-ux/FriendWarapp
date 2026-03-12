// server/diplomacy.js

const RELATIONS = {
  PEACE: "평화",
  WAR: "전쟁",
  ALLY: "동맹"
};

// 전쟁 선포 로직
function declareWar(declaringPlayerId, targetPlayerId, db) {
  // 1. 세계 긴장도 상승
  db.ref('game_meta/tension').transaction(t => (t || 0) + 5);
  
  // 2. 상태 변경 (실시간 반영)
  db.ref(`diplomacy/${declaringPlayerId}/${targetPlayerId}`).set(RELATIONS.WAR);
  db.ref(`diplomacy/${targetPlayerId}/${declaringPlayerId}`).set(RELATIONS.WAR);
  
  console.log(`${declaringPlayerId}가 ${targetPlayerId}에게 선전포고했습니다!`);
}

// 기습 공격 페널티 로직
function checkAttackValid(attackerId, targetId, currentRelation) {
  if (currentRelation !== RELATIONS.WAR) {
    // 선전포고 없이 공격 시 '정치력'이나 '안정도' 대폭 하락
    return { valid: true, penalty: "STABILITY_DROP_30%" };
  }
  return { valid: true, penalty: null };
}
