// server/index.js
const admin = require('firebase-admin');
const { processBattleTick } = require('./battleEngine');
const { calculateIncome } = require('./gameLogic');
const UNITS = require('./units');

// Firebase 초기화 (설정 필요)
const db = admin.database();

setInterval(async () => {
  const playersSnap = await db.ref('players').once('value');
  const provincesSnap = await db.ref('provinces').once('value');
  
  const players = playersSnap.val();
  const provinces = provincesSnap.val();
  if (!players || !provinces) return;

  for (let pid in players) {
    let p = players[pid];

    // 1. 자원 생산 (gameLogic 활용)
    // p.ownedProvinces 데이터를 기반으로 수입 계산
    const income = calculateIncome(Object.values(provinces).filter(pr => pr.owner === pid));
    let newMoney = (p.resources?.money || 0) + income;

    // 2. 미션 처리 (이동 및 도착)
    let activeMissions = p.active_missions || {};
    for (let mId in activeMissions) {
      let mission = activeMissions[mId];
      let now = new Date().getTime();

      if (now >= mission.arrival_time) {
        // 도착 발생!
        await handleArrival(pid, mission, provinces);
        delete activeMissions[mId];
      }
    }

    // 3. 생산 대기열(Queue) 등 나머지 처리...
    // (이전 단계에서 드린 생산 로직을 여기에 합치시면 됩니다)

    await db.ref(`players/${pid}`).update({
      "resources/money": newMoney,
      "active_missions": activeMissions
    });
  }
  console.log(`Tick processed: ${new Date().toISOString()}`);
}, 60000);

// 도착 시 실행되는 핵심 함수
async function handleArrival(playerId, mission, allProvinces) {
  const targetId = mission.target;
  const targetProvince = allProvinces[targetId];
  const attackerUnits = mission.units; // 미션에 포함된 병력

  console.log(`${playerId}가 ${targetId}에 도착!`);

  // 상황 A: 빈 땅이거나 내 땅인 경우 -> 주둔/점령
  if (!targetProvince.owner || targetProvince.owner === playerId) {
    await db.ref(`provinces/${targetId}`).update({
      owner: playerId // 점령자 변경 (이 순간 지도의 테두리 색이 바뀜!)
    });
    console.log(`${targetId} 점령 완료!`);
  } 
  // 상황 B: 적의 땅인 경우 -> 전투 발생
  else {
    const defenderId = targetProvince.owner;
    const defenderSnap = await db.ref(`players/${defenderId}/units`).once('value');
    const defenderUnits = defenderSnap.val() || {};

    // battleEngine 호출하여 피해 계산
    const result = processBattleTick(attackerUnits, defenderUnits, targetProvince.type);
    
    // 전투 결과 반영 (유닛 수 차감 등)
    // 여기서는 간단하게 점령 성공으로 가정하거나, 결과에 따라 owner를 변경합니다.
    if (result.damageToDefender > result.damageToAttacker) {
      await db.ref(`provinces/${targetId}`).update({ owner: playerId });
      console.log(`전투 승리! ${targetId}를 획득했습니다.`);
    }
  }
}log(`${playerId}의 병력이 ${mission.target}에 도착함!`);
}
