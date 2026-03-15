const express = require('express');
const cors = require('cors'); // CORS 허용 추가
const admin = require('firebase-admin');
const app = express();

app.use(cors());
const port = process.env.PORT || 3000;

// 1. Firebase 초기화
try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://friendwargme-default-rtdb.firebaseio.com/"
    });
    console.log("Firebase 연결 성공!");
} catch (error) {
    console.error("Firebase 초기화 에러: 환경 변수를 확인하세요.");
    process.exit(1);
}

const db = admin.database();

/**
 * [추가] 256개 타일 초기화 함수
 * DB에 provinces 데이터가 없을 때만 실행됩니다.
 */
async function initMapIfEmpty() {
    const snap = await db.ref('provinces').once('value');
    if (snap.exists()) return; // 이미 데이터가 있으면 중단

    console.log("맵 데이터가 없습니다. 256개 타일 생성을 시작합니다...");
    const provinces = {};
    const terrains = ['평지', '산악', '숲', '구릉', '해안'];
    const resources = ['철', '고무', '알루미늄', '텅스텐', '석유', '없음'];

    for (let i = 1; i <= 256; i++) {
        const id = `P${i}`;
        provinces[id] = {
            id: id,
            owner: "중립",
            terrain: terrains[Math.floor(Math.random() * terrains.length)],
            population: Math.floor(Math.random() * 100000) + 10000,
            factories: {
                military: 0, dockyard: 0, light_ind: 1, heavy_ind: 0 
            },
            resources: {
                type: resources[Math.floor(Math.random() * resources.length)],
                amount: Math.floor(Math.random() * 50)
            },
            mines: Math.floor(Math.random() * 2),
            units: 0
        };
    }
    await db.ref('provinces').set(provinces);
    console.log("256개 전략 타일 초기화 완료!");
}

// 서버 시작 시 맵 체크
initMapIfEmpty();

// 자산 생산 로직 (공장 수에 비례)
function calculateIncome(myProvinces) {
    let totalIncome = 0;
    myProvinces.forEach(p => {
        // 경공업 1당 5G, 중공업 1당 20G 생산
        totalIncome += (p.factories?.light_ind || 0) * 5;
        totalIncome += (p.factories?.heavy_ind || 0) * 20;
    });
    return totalIncome || 10; // 최소 기본금 10G
}

// 3초마다 게임 세상 업데이트
setInterval(async () => {
    try {
        const playersSnap = await db.ref('players').once('value');
        const provincesSnap = await db.ref('provinces').once('value');
        
        const players = playersSnap.val();
        const provinces = provincesSnap.val();
        if (!players || !provinces) return;

        const provinceArray = Object.values(provinces);

        for (let pid in players) {
            let p = players[pid];

            // 1. 자원 생산 (내 영지 기반)
            const myProvinces = provinceArray.filter(pr => pr.owner === pid);
            const income = calculateIncome(myProvinces);
            let newMoney = (p.resources?.money || 0) + income;

            // 2. 미션 처리
            let activeMissions = p.active_missions || {};
            for (let mId in activeMissions) {
                let mission = activeMissions[mId];
                if (new Date().getTime() >= mission.arrival_time) {
                    await handleArrival(pid, mission, provinces);
                    delete activeMissions[mId];
                }
            }

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

// 전투 및 도착 처리
async function handleArrival(playerId, mission, allProvinces) {
    const targetId = mission.target;
    const targetProvince = allProvinces[targetId];
    if (!targetProvince) return;

    if (!targetProvince.owner || targetProvince.owner === "중립" || targetProvince.owner === playerId) {
        await db.ref(`provinces/${targetId}`).update({ owner: playerId });
        console.log(`${playerId}가 ${targetId}를 무혈 점령했습니다.`);
    } else {
        // 단순화된 전투: 공격군이 있으면 무조건 승리 (추후 로직 보강 가능)
        await db.ref(`provinces/${targetId}`).update({ 
            owner: playerId,
            units: mission.units 
        });
        console.log(`${playerId}가 ${targetProvince.owner}의 ${targetId}를 함락시켰습니다!`);
    }
}

app.get('/', (req, res) => res.send('War Game Server Live! - 256 Tiles Active'));
app.listen(port, () => console.log(`Listening on port ${port}`));
