const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const app = express();

app.use(cors());
app.use(express.json()); // 명령 수신을 위해 추가
const port = process.env.PORT || 3000;

// Firebase 초기화
try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://friendwargme-default-rtdb.firebaseio.com/"
    });
} catch (error) {
    process.exit(1);
}

const db = admin.database();

// units.js 기반 데이터 (서버 로직용)
const UNITS = {
    INFANTRY: { hp: 100, atk: 10, speed: 5, cost: 100, bonus: { TANK: 0.5, ARTILLERY: 1.2 } },
    TANK: { hp: 300, atk: 40, speed: 12, cost: 500, bonus: { INFANTRY: 2.0, ARTILLERY: 1.5 } },
    ARTILLERY: { hp: 80, atk: 50, speed: 3, cost: 300, bonus: { INFANTRY: 1.8 } },
    // 공군/해군 데이터 생략 (상기 방식과 동일하게 적용 가능)
};

// 256개 타일 초기화 (기존 로직 유지 + 유닛 객체 구조화)
async function initMapIfEmpty() {
    const snap = await db.ref('provinces').once('value');
    if (snap.exists()) return;

    const provinces = {};
    const terrains = ['평지', '산악', '숲', '구릉', '해안'];
    for (let i = 1; i <= 256; i++) {
        const id = `P${i}`;
        provinces[id] = {
            id: id, owner: "중립", terrain: terrains[Math.floor(Math.random() * terrains.length)],
            population: 50000,
            factories: { military: 0, dockyard: 0, light_ind: 1, heavy_ind: 0 },
            unit: { type: "INFANTRY", count: 0 } 
        };
    }
    await db.ref('provinces').set(provinces);
}
initMapIfEmpty();

// [전투 엔진] 상성 및 지형 반영
function resolveBattle(atkUnit, defUnit, terrain) {
    let atkPower = UNITS[atkUnit.type].atk * atkUnit.count;
    let defPower = UNITS[defUnit.type].atk * defUnit.count;

    // 상성 보너스
    if (UNITS[atkUnit.type].bonus[defUnit.type]) atkPower *= UNITS[atkUnit.type].bonus[defUnit.type];
    if (terrain === '산악' && atkUnit.type === 'ARTILLERY') atkPower *= 1.5;

    // 결과: 공격자 승리 여부 및 잔존 병력 계산 (단순화)
    if (atkPower > defPower) return { winner: "attacker", remain: Math.ceil(atkUnit.count * 0.7) };
    return { winner: "defender", remain: Math.ceil(defUnit.count * 0.8) };
}

// 3초마다 틱 처리
setInterval(async () => {
    const playersSnap = await db.ref('players').once('value');
    const provincesSnap = await db.ref('provinces').once('value');
    const players = playersSnap.val();
    const provinces = provincesSnap.val();
    if (!players || !provinces) return;

    for (let pid in players) {
        let p = players[pid];
        // 1. 수익 계산 (공장 기반)
        const myProvinces = Object.values(provinces).filter(pr => pr.owner === pid);
        const income = myProvinces.reduce((acc, curr) => acc + (curr.factories.light_ind * 5) + (curr.factories.heavy_ind * 20), 0);
        
        // 2. 미션 처리 (이동/전투)
        let missions = p.active_missions || {};
        for (let mId in missions) {
            let m = missions[mId];
            if (new Date().getTime() >= m.arrival_time) {
                const target = provinces[m.target];
                if (target.owner === "중립" || target.owner === pid) {
                    await db.ref(`provinces/${m.target}`).update({ owner: pid, unit: { type: m.unitType, count: m.count } });
                } else {
                    const result = resolveBattle({type: m.unitType, count: m.count}, target.unit, target.terrain);
                    if (result.winner === "attacker") {
                        await db.ref(`provinces/${m.target}`).update({ owner: pid, unit: { type: m.unitType, count: result.remain } });
                    } else {
                        await db.ref(`provinces/${m.target}/unit`).update({ count: result.remain });
                    }
                }
                delete missions[mId];
            }
        }
        await db.ref(`players/${pid}`).update({ "resources/money": (p.resources?.money || 0) + income + 10, "active_missions": missions });
    }
}, 3000);

app.get('/', (req, res) => res.send('Modern Chess War Server Live!'));
app.listen(port, () => console.log(`Listening on port ${port}`));
