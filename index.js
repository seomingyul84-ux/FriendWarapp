// server/index.js
const admin = require('firebase-admin');
admin.initializeApp({ /* 본인의 Firebase 설정 */ });

const db = admin.database();

// 1분(60000ms)마다 실행되는 게임 루프
setInterval(async () => {
  const snapshot = await db.ref('players').once('value');
  const players = snapshot.val();

  for (let id in players) {
    let p = players[id];
    
    // 1. 자원 생산 로직 (공장 당 자원 추가)
    let newMoney = p.resources.money + (p.factories.civ * 10);
    
    // 2. 이동 중인 유닛 처리
    let activeMissions = p.active_missions || {};
    for (let mId in activeMissions) {
      let mission = activeMissions[mId];
      let now = new Date().getTime();
      
      if (now >= mission.arrival_time) {
        // 도착 완료! 전투 혹은 주둔 로직 실행
        handleArrival(id, mission);
        delete activeMissions[mId];
      }
    }

    // DB 업데이트
    await db.ref(`players/${id}`).update({
      "resources/money": newMoney,
      "active_missions": activeMissions
    });
  }
  
  console.log("Tick processed: " + new Date().toISOString());
}, 60000); 

function handleArrival(playerId, mission) {
  // 여기서 전투 주사위를 굴리거나 점령 처리를 합니다.
  console.log(`${playerId}의 병력이 ${mission.target}에 도착함!`);
}
