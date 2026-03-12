// server/units.js
const UNITS = {
  // --- 육군 ---
  INFANTRY: { name: "보병", hp: 100, atk: 10, speed: 5, cost: 100, bonus: { TANK: 0.5, ARTILLERY: 1.2 } },
  TANK:      { name: "기갑", hp: 300, atk: 40, speed: 12, cost: 500, bonus: { INFANTRY: 2.0, ARTILLERY: 1.5 } },
  ARTILLERY: { name: "포병", hp: 80,  atk: 50, speed: 3,  cost: 300, bonus: { INFANTRY: 1.8, MOUNTAIN: 1.5 } },

  // --- 공군 ---
  FIGHTER: { name: "전투기", hp: 150, atk: 30, speed: 50, cost: 400, bonus: { BOMBER: 2.5, INFANTRY: 0.5 } },
  BOMBER:  { name: "폭격기", hp: 200, atk: 60, speed: 40, cost: 600, bonus: { SHIP: 2.0, FACTORY: 3.0 } },

  // --- 해군 ---
  SUBMARINE: { name: "잠수함", hp: 120, atk: 40, speed: 15, cost: 400, bonus: { BATTLESHIP: 2.5, DESTROYER: 0.5 } },
  DESTROYER: { name: "구축함", hp: 200, atk: 30, speed: 25, cost: 500, bonus: { SUBMARINE: 3.0, CARRIER: 1.2 } },
  BATTLESHIP:{ name: "전함",   hp: 800, atk: 100,speed: 10, cost: 1500,bonus: { DESTROYER: 1.5, CARRIER: 0.8 } },
  CARRIER:   { name: "항모",   hp: 600, atk: 20, speed: 15, cost: 2000, bonus: { ALL_AIR: 2.0 } } // 함재기 버프용
};
