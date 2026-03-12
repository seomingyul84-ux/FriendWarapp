// server/gameLogic.js
const UNIT_STATS = {
  INFANTRY: { hp: 100, atk: 10, speed: 5, cost: 100 },
  TANK: { hp: 300, atk: 40, speed: 10, cost: 500 },
  CARRIER: { hp: 1000, atk: 100, speed: 15, cost: 2000 },
  // ... 나머지 보병/기갑/포병/전투기/폭격기/구축함/전함/항모/잠수함 추가
};

// 단순화된 전투 공식 예시
function calculateCombat(attacker, defender) {
  // 데미지 = 공격력 * (상성 보너스)
  // 결과값만큼 상대 HP 차감
}
