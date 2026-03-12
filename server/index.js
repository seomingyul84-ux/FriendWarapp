const admin = require('firebase-admin');
const { processBattleTick } = require('./battleEngine');
const { calculateIncome } = require('./gameLogic');
const UNITS = require('./units');

// 1. 보안 키 연결
const serviceAccount = require("./serviceAccountKey.json");

// 2. Firebase 초기화
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://friendwargme-default-rtdb.firebaseio.com/"
});

const db = admin.database();

// 3초(3000ms)마다 실행 (빠른 전개!)
setInterval(async () => {
  const playersSnap = await db.ref('players').once('value');
  const provincesSnap = await db.ref('provinces').once('value');
  
  const players = playersSnap.val();
  const provinces = provincesSnap.val();
  if (!players || !provinces) return;

  for (let pid in players) {
    let p = players[pid];

    // 자원 생산
    const income = calculateIncome(Object.values(provinces).filter(pr => pr.owner === pid));
    let newMoney = (p.resources?.money || 0) + income;

    // 미션(이동) 처리
    let activeMissions = p.active_missions || {};
    for (let mId in activeMissions) {
      let mission = activeMissions[mId];
      let now = new Date().getTime();

      if (now >= mission.arrival_time) {
        await handleArrival(pid, mission, provinces);
        delete activeMissions[mId];
      }
    }

    // 데이터 업데이트
    await db.ref(`players/${pid}`).update({
      "resources/money": newMoney,
      "active_missions": activeMissions
    });
  }
  console.log(`Tick processed: ${new Date().toISOString()}`);
}, 3000);

// 도착 처리 함수
async function handleArrival(playerId, mission, allProvinces) {
  const targetId = mission.target;
  const targetProvince = allProvinces[targetId];
  const attackerUnits = mission.units;

  console.log(`${playerId}의 병력이 ${targetId}에 도착함!`);

  if (!targetProvince.owner || targetProvince.owner === playerId) {
    await db.ref(`provinces/${targetId}`).update({ owner: playerId });
    console.log(`${targetId} 점령 완료!`);
  } else {
    const defenderId = targetProvince.owner;
    const defenderSnap = await db.ref(`players/${defenderId}/units`).once('value');
    const defenderUnits = defenderSnap.val() || {};

    const result = processBattleTick(attackerUnits, defenderUnits, targetProvince.type);
    
    if (result.damageToDefender > result.damageToAttacker) {
      await db.ref(`provinces/${targetId}`).update({ owner: playerId });
      console.log(`전투 승리! ${targetId} 획득.`);
    }
  }
}
