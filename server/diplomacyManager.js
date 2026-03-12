// server/diplomacyManager.js

// 1. 전쟁 선포 (선포 즉시 상대에게 알림)
function onDeclareWar(fromId, toId) {
  db.ref(`relations/${fromId}/${toId}`).set('WAR');
  sendPushNotification(toId, "🚨 경보: 선전포고를 당했습니다!");
}

// 2. 게임 종료 투표 (3명 전원 동의 시)
function voteToFinish(playerId) {
  db.ref(`game_meta/votes/${playerId}`).set(true);
  
  db.ref('game_meta/votes').once('value', (snap) => {
    const votes = snap.val();
    if (votes.p1 && votes.p2 && votes.p3) {
      db.ref('game_meta/status').set('FINISHED');
      alert("모든 플레이어가 동의하여 게임이 종료되었습니다.");
    }
  });
}
