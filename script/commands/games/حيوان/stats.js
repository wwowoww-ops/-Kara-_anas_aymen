"use strict";

const pets = require("./pets");
const leveling = require("./leveling");

const MAX_LEVEL = 60;
const MAX_STARS = 5;

/**
 * الحصول على المستوى الفعلي للحيوان
 * كل نجمة = 60 مستوى إضافي
 */
function getEffectiveLevel(level = 0, stars = 0) {
  level = Math.max(0, Math.min(MAX_LEVEL, Number(level) || 0));
  stars = Math.max(0, Math.min(MAX_STARS, Number(stars) || 0));

  return (stars * MAX_LEVEL) + level;
}

/**
 * حساب القوة
 */
function getPower(pet, level = 0, stars = 0) {
  if (!pet) return 0;

  const effectiveLevel = getEffectiveLevel(level, stars);

  return pets.calculatePower(pet, effectiveLevel);
}

/**
 * حساب الصحة
 */
function getHealth(pet, level = 0, stars = 0) {
  if (!pet) return 0;

  const effectiveLevel = getEffectiveLevel(level, stars);

  return pets.calculateHealth(pet, effectiveLevel);
}

/**
 * حساب الحد الأقصى للجوع
 */
function getMaxHunger(pet, level = 0, stars = 0) {
  if (!pet) return 0;

  const effectiveLevel = getEffectiveLevel(level, stars);

  return pets.calculateMaxHunger(
    pet,
    effectiveLevel
  );
}

/**
 * حساب نسبة الجوع الحالية
 */
function getHungerPercentage(
  pet,
  hunger,
  level = 0,
  stars = 0
) {
  const maxHunger = getMaxHunger(
    pet,
    level,
    stars
  );

  if (maxHunger <= 0) return 0;

  const currentHunger = Math.max(
    0,
    Math.min(Number(hunger) || 0, maxHunger)
  );

  return Math.floor(
    (currentHunger / maxHunger) * 100
  );
}

/**
 * حساب جميع الإحصائيات
 */
function getStats(
  pet,
  level = 0,
  stars = 0,
  currentHealth = null,
  currentHunger = null
) {
  if (!pet) return null;

  level = Math.max(
    0,
    Math.min(MAX_LEVEL, Number(level) || 0)
  );

  stars = Math.max(
    0,
    Math.min(MAX_STARS, Number(stars) || 0)
  );

  const effectiveLevel =
    getEffectiveLevel(level, stars);

  const maxHealth =
    pets.calculateHealth(
      pet,
      effectiveLevel
    );

  const maxHunger =
    pets.calculateMaxHunger(
      pet,
      effectiveLevel
    );

  const power =
    pets.calculatePower(
      pet,
      effectiveLevel
    );

  const health =
    currentHealth === null
      ? maxHealth
      : Math.max(
          0,
          Math.min(
            Number(currentHealth) || 0,
            maxHealth
          )
        );

  const hunger =
    currentHunger === null
      ? maxHunger
      : Math.max(
          0,
          Math.min(
            Number(currentHunger) || 0,
            maxHunger
          )
        );

  return {
    level,
    stars,
    effectiveLevel,

    power,

    health,
    maxHealth,

    hunger,
    maxHunger,

    hungerPercentage:
      maxHunger > 0
        ? Math.floor(
            (hunger / maxHunger) * 100
          )
        : 0,

    maxLevel: pet.maxLevel ?? MAX_LEVEL,
    maxStars: pet.maxStars ?? MAX_STARS,

    isMaxLevel:
      level >= (pet.maxLevel ?? MAX_LEVEL),

    isMaxStars:
      stars >= (pet.maxStars ?? MAX_STARS)
  };
}

/**
 * معلومات الزيادة في المستوى التالي
 */
function getNextLevelGain(
  pet,
  level = 0,
  stars = 0
) {
  if (!pet) return null;

  if (level >= MAX_LEVEL) {
    return {
      power: 0,
      health: 0,
      hunger: 0,
      available: false
    };
  }

  const current = getStats(
    pet,
    level,
    stars
  );

  const next = getStats(
    pet,
    level + 1,
    stars
  );

  return {
    power: next.power - current.power,
    health: next.maxHealth - current.maxHealth,
    hunger: next.maxHunger - current.maxHunger,
    available: true
  };
}

/**
 * معلومات الإحصائيات الأساسية للحيوان
 */
function getBaseStats(pet) {
  if (!pet) return null;

  return {
    power: pet.basePower,
    health: pet.baseHealth,
    hunger: pet.baseHunger,

    powerGrowth: pet.growth?.power ?? 0,
    healthGrowth: pet.growth?.health ?? 0,
    hungerGrowth: pet.growth?.hunger ?? 0
  };
}

module.exports = {
  MAX_LEVEL,
  MAX_STARS,

  getEffectiveLevel,

  getPower,
  getHealth,
  getMaxHunger,
  getHungerPercentage,

  getStats,
  getNextLevelGain,
  getBaseStats
};