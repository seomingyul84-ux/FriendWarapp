// server/gameLogic.js

const TERRAIN_MODIFIERS = {
  PLAIN:    { moveSpeed: 1.0, resource: 1.0, defense: 1.0, color: '#90EE90' }, // 연두색
  MOUNTAIN: { moveSpeed: 0.3, resource: 0.5, defense: 1.6, color: '#006400' }, // 짙은 초록색
  MINERAL:  { moveSpeed: 0.9, resource: 3.0, defense: 1.0, hidden: true }      // 광물 지대 (숨김)
};

function calculateIncome(playerProvinces) {
  let income = 0;
  playerProvinces.forEach(p => {
    const mod = TERRAIN_MODIFIERS[p.type] || TERRAIN_MODIFIERS.PLAIN;
    income += (10 * mod.resource * (p.factories || 1));
  });
  return income;
}

module.exports = { calculateIncome, TERRAIN_MODIFIERS };
