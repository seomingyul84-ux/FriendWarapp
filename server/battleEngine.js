// server/battleEngine.js

function processBattleTick(attackerUnits, defenderUnits, terrainType) {
  // 1. 공격력 계산 (병종 상성 + 지형 보정)
  let totalAtk = 0;
  attackerUnits.forEach(u => {
    let baseAtk = UNITS[u.type].atk * u.count;
    // 예: 기갑이 보병 공격 시 상성 적용
    // 상성 로직 추가 필요
    totalAtk += baseAtk;
  });

  // 2. 방어력 계산
  let totalDef = 0;
  defenderUnits.forEach(u => {
    let baseDef = UNITS[u.type].hp * u.count;
    // 산악 지형이면 방어력 1.6배
    if (terrainType === 'MOUNTAIN') baseDef *= 1.6;
    totalDef += baseDef;
  });

  // 3. 피해량 산출 (약간의 랜덤성 부여)
  const randomness = 0.8 + Math.random() * 0.4; // 0.8 ~ 1.2 사이
  const damageToDefender = (totalAtk / 10) * randomness;
  const damageToAttacker = (totalDef / 20) * randomness; // 방어 측도 반격

  return { damageToDefender, damageToAttacker };
}
