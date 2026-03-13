const admin = require('firebase-admin');
const { processBattleTick } = require('./battleEngine');
const { calculateIncome } = require('./gameLogic');
const UNITS = require('./units');

// 보안 파일 대신 Render의 환경 변수(FIREBASE_CONFIG)를 읽어옵니다.
try {
  const serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://friendwargme-default-rtdb.firebaseio.com/"
  });
  console.log("Firebase 연결 성공!");
} catch (error) {
  console.error("Firebase 초기화 에러: 환경 변수(FIREBASE_CONFIG)를 확인하세요.");
  process.exit(1);
}

const db = admin.database();

// 3초마다 게임 세상 업데이트
setInterval(async () => {
  try {
    const playersSnap = await db.ref('players').once('value');
    const provincesSnap = await db.ref('provinces').once('value');
    
    const players = playersSnap.val();
    const provinces = provincesSnap.val();
    if (!players || !provinces) return;

    for (let pid in players) {
      let p = players[pid];

      // 1. 자원 생산
      const income = calculateIncome(Object.values(provinces).filter(pr => pr.owner === pid));
      let newMoney = (p.resources?.money || 0) + income;

      // 2. 미션(이동/전투) 처리
      let activeMissions = p.active_missions || {};
      for (let mId in activeMissions) {
        let mission = activeMissions[mId];
        let now = new Date().getTime();

        if (now >= mission.arrival_time) {
          await handleArrival(pid, mission, provinces);
          delete activeMissions[mId];
        }
      }

      // DB 업데이트
      await db.ref(`players/${pid}`).update({
        "resources/money": newMoney,
        "active_missions": activeMissions
      });
    }
    console.log(`Tick processed: ${new Date().toISOString()}`);
  } catch (err) {
    console.error("Tick Error:", err);
  }
}, 3000);

async function handleArrival(playerId, mission, allProvinces) {
  const targetId = mission.target;
  const targetProvince = allProvinces[targetId];
  const attackerUnits = mission.units;

  console.log(`${playerId}의 병력이 ${targetId}에 도착!`);

  if (!targetProvince.owner || targetProvince.owner === playerId) {
    await db.ref(`provinces/${targetId}`).update({ owner: playerId });
  } else {
    const defenderId = targetProvince.owner;
    const defenderSnap = await db.ref(`players/${defenderId}/units`).once('value');
    const defenderUnits = defenderSnap.val() || {};

    const result = processBattleTick(attackerUnits, defenderUnits, targetProvince.type);
    
    if (result.damageToDefender > result.damageToAttacker) {
      await db.ref(`provinces/${targetId}`).update({ owner: playerId });
      console.log(`전투 승리: ${targetId} 점령!`);
    }
  }
}
