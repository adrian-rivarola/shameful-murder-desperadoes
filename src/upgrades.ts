export const MAX_LEVEL = 4;

// TODO: Improve this
export const PLAYER_UPGRADES = {
  baseSpeed: [200, 300] as Vector,
  maxStamina: [20, 30] as Vector,
  maxHp: [10, 30] as Vector,
};

export const CHARACTER_UPGRADES = {
  baseSpeed: [4, 5.5] as Vector,
  maxStamina: [10, 30] as Vector,
  maxHp: [10, 18] as Vector,
};

// Player weapons upgrades
export const SWORD_UPGRADES = {
  damage: [3, 9] as Vector,
  sizeFactor: [1, 2] as Vector,
  maxAngle: [Math.PI, Math.PI * 2] as Vector,
};

export const BOW_UPGRADES = {
  damage: [2, 6] as Vector,
  coolDown: [0.75, 0.5] as Vector,
  projectileSpeed: [20, 35] as Vector,
};

export const SHIELD_UPGRADES = {
  speedFactor: [0.3, 0.75] as Vector,
  defenseFactor: [1, MAX_LEVEL] as Vector,
};
