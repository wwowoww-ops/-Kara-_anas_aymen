const {
  getPetByID,
  getPetByType,
  calculatePower,
  calculateHealth,
  hasSpecialImage
} = require("./pets");

/**
 * نظام مستويات الحيوانات
 * مستقل تمامًا عن حيوان.js
 */

const DEFAULT_MAX_LEVEL = 100;
const DEFAULT_LEVEL = 1;
const DEFAULT_XP = 0;

/**
 * ==========================================
 * إعدادات XP
 * ==========================================
 *
 * XP المطلوب يزداد بقوة مع كل مستوى
 *
 * المستوى 1 يبدأ بـ 250 XP
 * والمستويات العالية تحتاج كميات ضخمة
 *
 * الصيغة:
 *
 * 250 × المستوى ^ 2
 *
 * مع زيادة إضافية تدريجية حسب المستوى
 */

const XP_BASE = 250;
const XP_EXPONENT = 2.05;

/**
 * الحصول على بيانات الحيوان
 */
function resolvePet(pet) {
  if (!pet) return null;

  if (typeof pet === "number") {
    return getPetByID(pet);
  }

  if (typeof pet === "string") {
    return getPetByType(pet);
  }

  if (typeof pet === "object") {
    if (pet.id !== undefined) {
      return getPetByID(pet.id) || pet;
    }

    if (pet.type) {
      return getPetByType(pet.type) || pet;
    }
  }

  return null;
}

/**
 * تنظيف المستوى
 */
function normalizeLevel(
  level,
  maxLevel = DEFAULT_MAX_LEVEL
) {
  level = Number(level);

  if (!Number.isFinite(level)) {
    return DEFAULT_LEVEL;
  }

  level = Math.floor(level);

  return Math.max(
    1,
    Math.min(level, maxLevel)
  );
}

/**
 * تنظيف XP
 */
function normalizeXP(xp) {
  xp = Number(xp);

  if (!Number.isFinite(xp) || xp < 0) {
    return DEFAULT_XP;
  }

  return Math.floor(xp);
}

/**
 * ==========================================
 * XP المطلوب للمستوى التالي
 * ==========================================
 *
 * كل مستوى يحتاج XP أكثر من السابق
 *
 * 1 → 2
 * 2 → 3
 * 3 → 4
 * ...
 * 99 → 100
 */
function getRequiredXP(level) {
  level = Math.max(
    1,
    Math.floor(Number(level) || 1)
  );

  return Math.floor(
    XP_BASE *
    Math.pow(level, XP_EXPONENT)
  );
}

/**
 * XP المطلوب للمستوى التالي
 */
function getXPForNextLevel(level) {
  return getRequiredXP(level);
}

/**
 * ==========================================
 * إجمالي XP المطلوب للوصول إلى مستوى معين
 * ==========================================
 */
function getTotalXPForLevel(level) {
  level = Math.max(
    1,
    Math.floor(Number(level) || 1)
  );

  let total = 0;

  for (let i = 1; i < level; i++) {
    total += getRequiredXP(i);
  }

  return total;
}

/**
 * ==========================================
 * نسبة التقدم داخل المستوى
 * ==========================================
 */
function getLevelProgress(level, xp) {
  level = Math.max(
    1,
    Math.floor(Number(level) || 1)
  );

  xp = normalizeXP(xp);

  const required = getRequiredXP(level);

  if (required <= 0) {
    return 100;
  }

  return Math.min(
    100,
    Math.floor(
      (xp / required) * 100
    )
  );
}

/**
 * ==========================================
 * حساب القوة
 * ==========================================
 */
function getPetPower(pet, level = 1) {
  const resolvedPet = resolvePet(pet);

  if (!resolvedPet) {
    return 0;
  }

  level = normalizeLevel(
    level,
    resolvedPet.maxLevel ||
      DEFAULT_MAX_LEVEL
  );

  return calculatePower(
    resolvedPet,
    level
  );
}

/**
 * ==========================================
 * حساب الصحة القصوى
 * ==========================================
 */
function getPetHealth(pet, level = 1) {
  const resolvedPet = resolvePet(pet);

  if (!resolvedPet) {
    return 0;
  }

  level = normalizeLevel(
    level,
    resolvedPet.maxLevel ||
      DEFAULT_MAX_LEVEL
  );

  return calculateHealth(
    resolvedPet,
    level
  );
}

/**
 * ==========================================
 * حساب Max Hunger
 * ==========================================
 */
function getPetMaxHunger(
  pet,
  level = 1
) {
  const resolvedPet = resolvePet(pet);

  if (!resolvedPet) {
    return 0;
  }

  level = normalizeLevel(
    level,
    resolvedPet.maxLevel ||
      DEFAULT_MAX_LEVEL
  );

  const base =
    Number(
      resolvedPet.stats?.maxHunger
    ) || 0;

  const growth =
    Number(
      resolvedPet.growth?.hunger
    ) || 0;

  return Math.floor(
    base +
    ((level - 1) * growth)
  );
}

/**
 * ==========================================
 * جميع إحصائيات الحيوان
 * ==========================================
 */
function getPetStats(
  pet,
  level = 1
) {
  const resolvedPet = resolvePet(pet);

  if (!resolvedPet) {
    return null;
  }

  level = normalizeLevel(
    level,
    resolvedPet.maxLevel ||
      DEFAULT_MAX_LEVEL
  );

  return {
    level,

    power: getPetPower(
      resolvedPet,
      level
    ),

    health: getPetHealth(
      resolvedPet,
      level
    ),

    maxHunger: getPetMaxHunger(
      resolvedPet,
      level
    )
  };
}

/**
 * ==========================================
 * مقدار زيادة القوة
 * ==========================================
 */
function getPowerGain(
  pet,
  level
) {
  const resolvedPet = resolvePet(pet);

  if (!resolvedPet) {
    return 0;
  }

  const maxLevel =
    resolvedPet.maxLevel ||
    DEFAULT_MAX_LEVEL;

  const currentLevel =
    normalizeLevel(
      level,
      maxLevel
    );

  if (currentLevel >= maxLevel) {
    return 0;
  }

  return Math.max(
    0,
    getPetPower(
      resolvedPet,
      currentLevel + 1
    ) -
    getPetPower(
      resolvedPet,
      currentLevel
    )
  );
}

/**
 * ==========================================
 * مقدار زيادة الصحة
 * ==========================================
 */
function getHealthGain(
  pet,
  level
) {
  const resolvedPet = resolvePet(pet);

  if (!resolvedPet) {
    return 0;
  }

  const maxLevel =
    resolvedPet.maxLevel ||
    DEFAULT_MAX_LEVEL;

  const currentLevel =
    normalizeLevel(
      level,
      maxLevel
    );

  if (currentLevel >= maxLevel) {
    return 0;
  }

  return Math.max(
    0,
    getPetHealth(
      resolvedPet,
      currentLevel + 1
    ) -
    getPetHealth(
      resolvedPet,
      currentLevel
    )
  );
}

/**
 * ==========================================
 * مقدار زيادة الشبع
 * ==========================================
 */
function getHungerGain(
  pet,
  level
) {
  const resolvedPet = resolvePet(pet);

  if (!resolvedPet) {
    return 0;
  }

  const maxLevel =
    resolvedPet.maxLevel ||
    DEFAULT_MAX_LEVEL;

  const currentLevel =
    normalizeLevel(
      level,
      maxLevel
    );

  if (currentLevel >= maxLevel) {
    return 0;
  }

  return Math.max(
    0,
    getPetMaxHunger(
      resolvedPet,
      currentLevel + 1
    ) -
    getPetMaxHunger(
      resolvedPet,
      currentLevel
    )
  );
}

/**
 * ==========================================
 * إضافة XP
 * ==========================================
 *
 * يدعم:
 * - رفع مستوى واحد
 * - رفع عدة مستويات
 * - حساب الزيادات
 * - فتح صورة المستوى 30
 */
function addXP(
  pet,
  currentData = {},
  amount = 0
) {
  const resolvedPet = resolvePet(pet);

  if (!resolvedPet) {
    return {
      success: false,
      error: "PET_NOT_FOUND"
    };
  }

  const maxLevel =
    resolvedPet.maxLevel ||
    DEFAULT_MAX_LEVEL;

  let level =
    normalizeLevel(
      currentData.level ||
        DEFAULT_LEVEL,
      maxLevel
    );

  let xp =
    normalizeXP(
      currentData.xp
    );

  amount = Number(amount);

  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    return {
      success: false,
      error: "INVALID_XP"
    };
  }

  amount = Math.floor(amount);

  const oldLevel = level;
  const oldXP = xp;

  xp += amount;

  const levelUps = [];

  /**
   * رفع المستويات
   */
  while (level < maxLevel) {
    const requiredXP =
      getRequiredXP(level);

    if (xp < requiredXP) {
      break;
    }

    xp -= requiredXP;

    const previousLevel = level;

    level++;

    levelUps.push({
      from: previousLevel,

      to: level,

      powerGain:
        getPowerGain(
          resolvedPet,
          previousLevel
        ),

      healthGain:
        getHealthGain(
          resolvedPet,
          previousLevel
        ),

      hungerGain:
        getHungerGain(
          resolvedPet,
          previousLevel
        )
    });
  }

  /**
   * عند الوصول إلى المستوى 100
   */
  if (level >= maxLevel) {
    level = maxLevel;
    xp = 0;
  }

  const specialImageUnlocked =
    hasSpecialImage(
      resolvedPet,
      level
    );

  return {
    success: true,

    oldLevel,
    level,

    oldXP,
    xp,

    addedXP: amount,

    levelUps,

    levelsGained:
      level - oldLevel,

    leveledUp:
      level > oldLevel,

    stats:
      getPetStats(
        resolvedPet,
        level
      ),

    specialImageUnlocked,

    progress:
      level >= maxLevel
        ? 100
        : getLevelProgress(
            level,
            xp
          ),

    nextLevelXP:
      level >= maxLevel
        ? 0
        : getRequiredXP(level)
  };
}

/**
 * ==========================================
 * فحص الصورة الخاصة
 * ==========================================
 */
function checkSpecialImage(
  pet,
  level = 1
) {
  const resolvedPet =
    resolvePet(pet);

  if (!resolvedPet) {
    return false;
  }

  return hasSpecialImage(
    resolvedPet,
    normalizeLevel(
      level,
      resolvedPet.maxLevel ||
        DEFAULT_MAX_LEVEL
    )
  );
}

/**
 * ==========================================
 * معلومات المستوى
 * ==========================================
 */
function getLevelInfo(
  pet,
  level = 1,
  xp = 0
) {
  const resolvedPet =
    resolvePet(pet);

  if (!resolvedPet) {
    return null;
  }

  const maxLevel =
    resolvedPet.maxLevel ||
    DEFAULT_MAX_LEVEL;

  level = normalizeLevel(
    level,
    maxLevel
  );

  xp = normalizeXP(xp);

  const isMaxLevel =
    level >= maxLevel;

  return {
    level,

    maxLevel,

    xp:
      isMaxLevel
        ? 0
        : xp,

    requiredXP:
      isMaxLevel
        ? 0
        : getRequiredXP(level),

    progress:
      isMaxLevel
        ? 100
        : getLevelProgress(
            level,
            xp
          ),

    stats:
      getPetStats(
        resolvedPet,
        level
      ),

    specialImageUnlocked:
      checkSpecialImage(
        resolvedPet,
        level
      )
  };
}

/**
 * ==========================================
 * تصدير النظام
 * ==========================================
 */
module.exports = {
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