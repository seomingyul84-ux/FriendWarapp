// client/moveUnit.js
import { getDatabase, ref, push } from "firebase/database";

function sendArmy(unitId, from, to) {
  const db = getDatabase();
  const travelTime = 3600000; // 거리 계산 로직 필요 (예: 1시간)

  push(ref(db, `players/my_id/active_missions`), {
    unit_id: unitId,
    start_node: from,
    target: to,
    departure_time: new Date().getTime(),
    arrival_time: new Date().getTime() + travelTime,
    status: "moving"
  });
}
