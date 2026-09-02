/**
 * ============================================================
 * نظام الحيوانات - المستويات والخبرة
 * ============================================================
 *
 * هذا الملف مسؤول عن:
 * - حساب المستوى
 * - حساب الخبرة
 * - حساب القوة حسب المستوى
 * - حساب الصحة حسب المستوى
 * - حساب الجوع
 * - معرفة مقدار الزيادة في كل مستوى
 * - الصورة الخاصة عند المستوى المحدد
 *
 * متوافق مع pets.js الذي يستخدم:
 *   basePower
 *   baseHealth
 *   growth.power
 *   growth.health
 * ============================================================
 */

const {
  getPetByID,
  getPetByType,
  calculatePower,
  calculateHealth,
  hasSpecialImage
} = require("./pets");


/* ============================================================
 * الإعدادات الأساسية
 * ============================================================ */

const DEFAULT_MAX_LEVEL = 100;
const DEFAULT_LEVEL = 1;
const DEFAULT_XP = 0;

/*
 * الخبرة المطلوبة للمستوى التالي
 *
 * كلما ارتفع المستوى تصبح الخبرة المطلوبة أكبر.
 */
const XP_BASE = 250;
const XP_EXPONENT = 2.05;


/* ============================================================
 * الحصول على بيانات الحيوان
 * ============================================================ */

function resolvePet(pet) {
  if (!pet) return null;

  if (typeof pet === "object") {
    if (pet.id !== undefined) {
      return getPetByID(pet.id) || pet;
    }

    if (pet.type) {
      return getPetByType(pet.type) || pet;
    }

    return pet;
  }

  if (!isNaN(Number(pet))) {
    return getPetByID(Number(pet));
  }

  return getPetByType(String(pet));
}


/* ============================================================
 * تنظيم المستوى
 * ============================================================ */

function normalizeLevel(level, pet = null) {
  const resolvedPet = resolvePet(pet);

  const maxLevel =
    resolvedPet?.maxLevel ||
    DEFAULT_MAX_LEVEL;

  level = Number(level);

  if (!Number.isFinite(level)) {
    level = DEFAULT_LEVEL;
  }

  level = Math.floor(level);

  return Math.max(
    DEFAULT_LEVEL,
    Math.min(level, maxLevel)
  );
}


/* ============================================================
 * تنظيم الخبرة
 * ============================================================ */

function normalizeXP(xp) {
  xp = Number(xp);

  if (!Number.isFinite(xp) || xp < 0) {
    return DEFAULT_XP;
  }

  return Math.floor(xp);
}


/* ============================================================
 * الخبرة المطلوبة للمستوى
 * ============================================================ */

function getRequiredXP(level = 1) {
  level = Math.max(
    DEFAULT_LEVEL,
    Math.floor(Number(level) || DEFAULT_LEVEL)
  );

  return Math.floor(
    XP_BASE * Math.pow(level, XP_EXPONENT)
  );
}


/* ============================================================
 * الخبرة المطلوبة للمستوى التالي
 * ============================================================ */

function getXPForNextLevel(level = 1, pet = null) {
  const resolvedPet = resolvePet(pet);

  const currentLevel = normalizeLevel(
    level,
    resolvedPet
  );

  const maxLevel =
    resolvedPet?.maxLevel ||
    DEFAULT_MAX_LEVEL;

  if (currentLevel >= maxLevel) {
    return 0;
  }

  return getRequiredXP(currentLevel);
}


/* ============================================================
 * إجمالي الخبرة اللازمة للوصول إلى مستوى معين
 * ============================================================
 *
 * مثال:
 *
 * getTotalXPForLevel(1) = 0
 * getTotalXPForLevel(2) = XP المستوى 1
 *
 * ============================================================
 */

function getTotalXPForLevel(level = 1, pet = null) {
  const resolvedPet = resolvePet(pet);

  level = normalizeLevel(
    level,
    resolvedPet
  );

  let totalXP = 0;

  for (let currentLevel = 1; currentLevel < level; currentLevel++) {
    totalXP += getRequiredXP(currentLevel);
  }

  return totalXP;
}


/* ============================================================
 * حساب تقدم المستوى
 * ============================================================ */

function getLevelProgress(level = 1, xp = 0, pet = null) {
  const resolvedPet = resolvePet(pet);

  level = normalizeLevel(
    level,
    resolvedPet
  );

  xp = normalizeXP(xp);

  const maxLevel =
    resolvedPet?.maxLevel ||
    DEFAULT_MAX_LEVEL;

  if (level >= maxLevel) {
    return {
      level,
      xp,
      requiredXP: 0,
      remainingXP: 0,
      percentage: 100,
      isMaxLevel: true
    };
  }

  const requiredXP = getRequiredXP(level);

  const percentage = Math.min(
    100,
    Math.floor((xp / requiredXP) * 100)
  );

  return {
    level,
    xp,
    requiredXP,
    remainingXP: Math.max(0, requiredXP - xp),
    percentage,
    isMaxLevel: false
  };
}


/* ============================================================
 * حساب القوة
 * ============================================================
 *
 * المستوى 1:
 * basePower
 *
 * كل مستوى:
 * + growth.power
 *
 * ============================================================
 */

function getPetPower(pet, level = 1) {
  const resolvedPet = resolvePet(pet);

  if (!resolvedPet) {
    return 0;
  }

  level = normalizeLevel(
    level,
    resolvedPet
  );

  return calculatePower(
    resolvedPet,
    level
  );
}


/* ============================================================
 * حساب الصحة
 * ============================================================
 *
 * المستوى 1:
 * baseHealth
 *
 * كل مستوى:
 * + growth.health
 *
 * ============================================================
 */

function getPetHealth(pet, level = 1) {
  const resolvedPet = resolvePet(pet);

  if (!resolvedPet) {
    return 0;
  }

  level = normalizeLevel(
    level,
    resolvedPet
  );

  return calculateHealth(
    resolvedPet,
    level
  );
}


/* ============================================================
 * حساب الحد الأقصى للجوع
 * ============================================================
 *
 * حاليًا pets.js لا يحتوي على:
 *   maxHunger
 *   growth.hunger
 *
 * لذلك نستخدم 100 كقيمة افتراضية.
 *
 * ويمكن إضافة نظام نمو للجوع لاحقًا بدون كسر النظام.
 * ============================================================
 */

function getPetMaxHunger(pet, level = 1) {
  const resolvedPet = resolvePet(pet);

  if (!resolvedPet) {
    return 100;
  }

  level = normalizeLevel(
    level,
    resolvedPet
  );

  const baseHunger =
    Number(resolvedPet.baseHunger) || 100;

  const hungerGrowth =
    Number(resolvedPet.growth?.hunger) || 0;

  return Math.floor(
    baseHunger +
    ((level - 1) * hungerGrowth)
  );
}


/* ============================================================
 * الحصول على جميع إحصائيات الحيوان
 * ============================================================ */

function getPetStats(pet, level = 1) {
  const resolvedPet = resolvePet(pet);

  if (!resolvedPet) {
    return null;
  }

  level = normalizeLevel(
    level,
    resolvedPet
  );

  const power = getPetPower(
    resolvedPet,
    level
  );

  const health = getPetHealth(
    resolvedPet,
    level
  );

  const maxHunger = getPetMaxHunger(
    resolvedPet,
    level
  );

  return {
    id: resolvedPet.id,
    type: resolvedPet.type,
    name: resolvedPet.name,
    rarity: resolvedPet.rarity,

    level,

    power,
    health,
    maxHunger,

    basePower: resolvedPet.basePower,
    baseHealth: resolvedPet.baseHealth,

    powerGrowth:
      Number(resolvedPet.growth?.power) || 0,

    healthGrowth:
      Number(resolvedPet.growth?.health) || 0,

    hungerGrowth:
      Number(resolvedPet.growth?.hunger) || 0,

    emoji: resolvedPet.emoji,

    maxLevel:
      resolvedPet.maxLevel ||
      DEFAULT_MAX_LEVEL,

    specialImageLevel:
      resolvedPet.specialImageLevel || 30,

    hasSpecialImage:
      hasSpecialImage(
        resolvedPet,
        level
      )
  };
}


/* ============================================================
 * مقدار زيادة القوة
 * ============================================================ */

function getPowerGain(pet) {
  const resolvedPet = resolvePet(pet);

  if (!resolvedPet) {
    return 0;
  }

  return Math.max(
    0,
    Number(resolvedPet.growth?.power) || 0
  );
}


/* ============================================================
 * مقدار زيادة الصحة
 * ============================================================ */

function getHealthGain(pet) {
  const resolvedPet = resolvePet(pet);

  if (!resolvedPet) {
    return 0;
  }

  return Math.max(
    0,
    Number(resolvedPet.growth?.health) || 0
  );
}


/* ============================================================
 * مقدار زيادة الجوع
 * ============================================================ */

function getHungerGain(pet) {
  const resolvedPet = resolvePet(pet);

  if (!resolvedPet) {
    return 0;
  }

  return Math.max(
    0,
    Number(resolvedPet.growth?.hunger) || 0
  );
}


/* ============================================================
 * إضافة XP
 * ============================================================ */

function addXP(level = 1, xp = 0, amount = 0, pet = null) {
  const resolvedPet = resolvePet(pet);

  let currentLevel = normalizeLevel(
    level,
    resolvedPet
  );

  let currentXP = normalizeXP(xp);

  amount = Number(amount);

  if (!Number.isFinite(amount) || amount < 0) {
    amount = 0;
  }

  amount = Math.floor(amount);

  currentXP += amount;

  const maxLevel =
    resolvedPet?.maxLevel ||
    DEFAULT_MAX_LEVEL;

  let levelsGained = 0;

  while (
    currentLevel < maxLevel &&
    currentXP >= getRequiredXP(currentLevel)
  ) {
    currentXP -= getRequiredXP(currentLevel);

    currentLevel++;
    levelsGained++;
  }

  if (currentLevel >= maxLevel) {
    currentXP = 0;
  }

  return {
    level: currentLevel,
    xp: currentXP,
    levelsGained,
    leveledUp: levelsGained > 0,

    power: getPetPower(
      resolvedPet,
      currentLevel
    ),

    health: getPetHealth(
      resolvedPet,
      currentLevel
    ),

    maxHunger: getPetMaxHunger(
      resolvedPet,
      currentLevel
    ),

    hasSpecialImage:
      hasSpecialImage(
        resolvedPet,
        currentLevel
      )
  };
}


/* ============================================================
 * التحقق من الصورة الخاصة
 * ============================================================ */

function checkSpecialImage(pet, level = 1) {
  const resolvedPet = resolvePet(pet);

  if (!resolvedPet) {
    return false;
  }

  level = normalizeLevel(
    level,
    resolvedPet
  );

  return hasSpecialImage(
    resolvedPet,
    level
  );
}


/* ============================================================
 * معلومات المستوى
 * ============================================================ */

function getLevelInfo(pet, level = 1) {
  const resolvedPet = resolvePet(pet);

  if (!resolvedPet) {
    return null;
  }

  level = normalizeLevel(
    level,
    resolvedPet
  );

  const stats = getPetStats(
    resolvedPet,
    level
  );

  const progress = getLevelProgress(
    level,
    0,
    resolvedPet
  );

  return {
    ...stats,

    xpRequired:
      getXPForNextLevel(
        level,
        resolvedPet
      ),

    totalXP:
      getTotalXPForLevel(
        level,
        resolvedPet
      ),

    progress,

    powerGain:
      getPowerGain(resolvedPet),

    healthGain:
      getHealthGain(resolvedPet),

    hungerGain:
      getHungerGain(resolvedPet)
  };
}


/* ============================================================
 * التصدير
 * ============================================================ */

module.exports = {

  DEFAULT_MAX_LEVEL,
  DEFAULT_LEVEL,
  DEFAULT_XP,

  XP_BASE,
  XP_EXPONENT,

  resolvePet,
  normalizeLevel,
  normalizeXP,

  getRequiredXP,
  getXPForNextLevel,
  getTotalXPForLevel,
  getLevelProgress,

  getPetPower,
  getPetHealth,
  getPetMaxHunger,

  getPetStats,

  getPowerGain,
  getHealthGain,
  getHungerGain,

  addXP,

  checkSpecialImage,

  getLevelInfo
};