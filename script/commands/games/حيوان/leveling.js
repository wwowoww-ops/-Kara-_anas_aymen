
/**
 * ============================================================
 * نظام الحيوانات - المستويات والخبرة والنجوم
 * ============================================================
 *
 * النظام:
 *
 * 0★ Level 0  → البداية
 * 0★ Level 60 → الترقية إلى 1★
 *
 * 1★ Level 0  → يبدأ من إحصائيات 0★ Level 60
 * 1★ Level 60 → الترقية إلى 2★
 *
 * ...
 *
 * 5★ Level 60 → ختم اللعبة
 *
 * ملاحظات:
 * - المستوى يبدأ من 0
 * - الحد الأقصى للمستوى = 60
 * - الحد الأقصى للنجوم = 5
 * - XP يتصفر عند الترقية فقط
 * - القوة والصحة لا تتصفر أبدًا
 * - كل مستوى يزيد القوة والصحة
 * - الصورة الخاصة عند Level 30
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

const DEFAULT_MAX_LEVEL = 60;
const DEFAULT_LEVEL = 0;
const DEFAULT_XP = 0;

const DEFAULT_MAX_STARS = 5;
const DEFAULT_STARS = 0;

const SPECIAL_IMAGE_LEVEL = 30;


/* ============================================================
 * إعدادات XP
 * ============================================================
 *
 * XP المطلوبة للانتقال:
 *
 * Level 0 → 1
 * Level 1 → 2
 * Level 2 → 3
 * ...
 *
 * كلما ارتفع المستوى تصبح XP المطلوبة أكبر.
 * ============================================================
 */

const XP_BASE = 250;
const XP_EXPONENT = 2.05;


/* ============================================================
 * الحصول على بيانات الحيوان
 * ============================================================ */

function resolvePet(pet) {
  if (!pet) {
    return null;
  }

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
    Number(resolvedPet?.maxLevel) ||
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
 * تنظيم النجوم
 * ============================================================ */

function normalizeStars(stars) {
  stars = Number(stars);

  if (!Number.isFinite(stars)) {
    return DEFAULT_STARS;
  }

  stars = Math.floor(stars);

  return Math.max(
    DEFAULT_STARS,
    Math.min(stars, DEFAULT_MAX_STARS)
  );
}


/* ============================================================
 * تنظيم XP
 * ============================================================ */

function normalizeXP(xp) {
  xp = Number(xp);

  if (!Number.isFinite(xp) || xp < 0) {
    return DEFAULT_XP;
  }

  return Math.floor(xp);
}


/* ============================================================
 * المستوى الفعلي
 * ============================================================
 *
 * هذا أهم جزء في نظام النجوم.
 *
 * مثال:
 *
 * 0★ Level 0  = effectiveLevel 0
 * 0★ Level 60 = effectiveLevel 60
 *
 * 1★ Level 0  = effectiveLevel 60
 * 1★ Level 30 = effectiveLevel 90
 * 1★ Level 60 = effectiveLevel 120
 *
 * 5★ Level 60 = effectiveLevel 360
 *
 * وبذلك القوة والصحة لا ترجعان للخلف
 * عند الترقية.
 * ============================================================
 */

function getEffectiveLevel(level = DEFAULT_LEVEL, stars = DEFAULT_STARS, pet = null) {
  level = normalizeLevel(level, pet);
  stars = normalizeStars(stars);

  return (
    stars * DEFAULT_MAX_LEVEL
  ) + level;
}


/* ============================================================
 * التحقق من إمكانية الترقية
 * ============================================================ */

function canPromote(level = DEFAULT_LEVEL, stars = DEFAULT_STARS, pet = null) {
  const resolvedPet = resolvePet(pet);

  level = normalizeLevel(level, resolvedPet);
  stars = normalizeStars(stars);

  return (
    level >= (
      Number(resolvedPet?.maxLevel) ||
      DEFAULT_MAX_LEVEL
    ) &&
    stars < DEFAULT_MAX_STARS
  );
}


/* ============================================================
 * التحقق من ختم اللعبة
 * ============================================================ */

function isGameCompleted(
  level = DEFAULT_LEVEL,
  stars = DEFAULT_STARS,
  pet = null
) {
  const resolvedPet = resolvePet(pet);

  level = normalizeLevel(level, resolvedPet);
  stars = normalizeStars(stars);

  const maxLevel =
    Number(resolvedPet?.maxLevel) ||
    DEFAULT_MAX_LEVEL;

  return (
    stars >= DEFAULT_MAX_STARS &&
    level >= maxLevel
  );
}


/* ============================================================
 * الخبرة المطلوبة للانتقال للمستوى التالي
 * ============================================================
 *
 * Level 0 → 1:
 * getRequiredXP(0)
 *
 * Level 1 → 2:
 * getRequiredXP(1)
 *
 * وهكذا.
 * ============================================================
 */

function getRequiredXP(level = DEFAULT_LEVEL) {
  level = Math.max(
    DEFAULT_LEVEL,
    Math.floor(Number(level) || DEFAULT_LEVEL)
  );

  return Math.floor(
    XP_BASE *
    Math.pow(
      level + 1,
      XP_EXPONENT
    )
  );
}


/* ============================================================
 * XP المطلوبة للمستوى التالي
 * ============================================================ */

function getXPForNextLevel(
  level = DEFAULT_LEVEL,
  pet = null
) {
  const resolvedPet = resolvePet(pet);

  const currentLevel = normalizeLevel(
    level,
    resolvedPet
  );

  const maxLevel =
    Number(resolvedPet?.maxLevel) ||
    DEFAULT_MAX_LEVEL;

  if (currentLevel >= maxLevel) {
    return 0;
  }

  return getRequiredXP(currentLevel);
}


/* ============================================================
 * إجمالي XP اللازمة للوصول لمستوى معين
 * ============================================================
 *
 * Level 0 = 0 XP
 *
 * Level 1 = XP الانتقال من 0 → 1
 *
 * Level 2 = XP:
 *   0 → 1
 *   1 → 2
 *
 * وهكذا.
 * ============================================================
 */

function getTotalXPForLevel(
  level = DEFAULT_LEVEL,
  pet = null
) {
  const resolvedPet = resolvePet(pet);

  level = normalizeLevel(
    level,
    resolvedPet
  );

  let totalXP = 0;

  for (
    let currentLevel = DEFAULT_LEVEL;
    currentLevel < level;
    currentLevel++
  ) {
    totalXP += getRequiredXP(
      currentLevel
    );
  }

  return totalXP;
}


/* ============================================================
 * حساب تقدم المستوى
 * ============================================================ */

function getLevelProgress(
  level = DEFAULT_LEVEL,
  xp = DEFAULT_XP,
  pet = null
) {
  const resolvedPet = resolvePet(pet);

  level = normalizeLevel(
    level,
    resolvedPet
  );

  xp = normalizeXP(xp);

  const maxLevel =
    Number(resolvedPet?.maxLevel) ||
    DEFAULT_MAX_LEVEL;

  if (level >= maxLevel) {
    return {
      level,
      xp: 0,

      requiredXP: 0,
      remainingXP: 0,

      percentage: 100,

      isMaxLevel: true
    };
  }

  const requiredXP =
    getRequiredXP(level);

  const percentage = Math.min(
    100,
    Math.floor(
      (xp / requiredXP) * 100
    )
  );

  return {
    level,
    xp,

    requiredXP,

    remainingXP:
      Math.max(
        0,
        requiredXP - xp
      ),

    percentage,

    isMaxLevel: false
  };
}


/* ============================================================
 * حساب القوة
 * ============================================================
 *
 * نعطي pets.js المستوى الفعلي.
 *
 * مثال:
 *
 * 0★ Level 0
 * → effectiveLevel 0
 *
 * 0★ Level 60
 * → effectiveLevel 60
 *
 * 1★ Level 0
 * → effectiveLevel 60
 *
 * لذلك الإحصائيات تستمر بالنمو بدون Reset.
 * ============================================================
 */

function getPetPower(
  pet,
  level = DEFAULT_LEVEL,
  stars = DEFAULT_STARS
) {
  const resolvedPet = resolvePet(pet);

  if (!resolvedPet) {
    return 0;
  }

  const effectiveLevel =
    getEffectiveLevel(
      level,
      stars,
      resolvedPet
    );

  return calculatePower(
    resolvedPet,
    effectiveLevel
  );
}


/* ============================================================
 * حساب الصحة
 * ============================================================ */

function getPetHealth(
  pet,
  level = DEFAULT_LEVEL,
  stars = DEFAULT_STARS
) {
  const resolvedPet = resolvePet(pet);

  if (!resolvedPet) {
    return 0;
  }

  const effectiveLevel =
    getEffectiveLevel(
      level,
      stars,
      resolvedPet
    );

  return calculateHealth(
    resolvedPet,
    effectiveLevel
  );
}


/* ============================================================
 * حساب الحد الأقصى للجوع
 * ============================================================ */

function getPetMaxHunger(
  pet,
  level = DEFAULT_LEVEL,
  stars = DEFAULT_STARS
) {
  const resolvedPet = resolvePet(pet);

  if (!resolvedPet) {
    return 100;
  }

  const effectiveLevel =
    getEffectiveLevel(
      level,
      stars,
      resolvedPet
    );

  const baseHunger =
    Number(resolvedPet.baseHunger) ||
    100;

  const hungerGrowth =
    Number(resolvedPet.growth?.hunger) ||
    0;

  return Math.floor(
    baseHunger +
    (
      effectiveLevel *
      hungerGrowth
    )
  );
}


/* ============================================================
 * الحصول على جميع إحصائيات الحيوان
 * ============================================================ */

function getPetStats(
  pet,
  level = DEFAULT_LEVEL,
  stars = DEFAULT_STARS
) {
  const resolvedPet = resolvePet(pet);

  if (!resolvedPet) {
    return null;
  }

  level = normalizeLevel(
    level,
    resolvedPet
  );

  stars = normalizeStars(stars);

  const effectiveLevel =
    getEffectiveLevel(
      level,
      stars,
      resolvedPet
    );

  const power =
    getPetPower(
      resolvedPet,
      level,
      stars
    );

  const health =
    getPetHealth(
      resolvedPet,
      level,
      stars
    );

  const maxHunger =
    getPetMaxHunger(
      resolvedPet,
      level,
      stars
    );

  const maxLevel =
    Number(resolvedPet.maxLevel) ||
    DEFAULT_MAX_LEVEL;

  const specialImageLevel =
    Number(
      resolvedPet.specialImageLevel
    ) || SPECIAL_IMAGE_LEVEL;

  return {

    id: resolvedPet.id,

    type: resolvedPet.type,

    name: resolvedPet.name,

    rarity: resolvedPet.rarity,

    /* المستوى الحالي */
    level,

    /* النجوم الحالية */
    stars,

    /* المستوى الكامل عبر النجوم */
    effectiveLevel,

    /* الإحصائيات */
    power,

    health,

    maxHunger,

    /* الإحصائيات الأساسية */
    basePower:
      Number(resolvedPet.basePower) || 0,

    baseHealth:
      Number(resolvedPet.baseHealth) || 0,

    /* مقدار النمو */
    powerGrowth:
      Number(
        resolvedPet.growth?.power
      ) || 0,

    healthGrowth:
      Number(
        resolvedPet.growth?.health
      ) || 0,

    hungerGrowth:
      Number(
        resolvedPet.growth?.hunger
      ) || 0,

    emoji:
      resolvedPet.emoji,

    maxLevel,

    maxStars:
      DEFAULT_MAX_STARS,

    specialImageLevel,

    hasSpecialImage:
      hasSpecialImage(
        resolvedPet,
        level
      ),

    canPromote:
      canPromote(
        level,
        stars,
        resolvedPet
      ),

    isGameCompleted:
      isGameCompleted(
        level,
        stars,
        resolvedPet
      )
  };
}


/* ============================================================
 * مقدار زيادة القوة في كل مستوى
 * ============================================================ */

function getPowerGain(pet) {
  const resolvedPet = resolvePet(pet);

  if (!resolvedPet) {
    return 0;
  }

  return Math.max(
    0,
    Number(
      resolvedPet.growth?.power
    ) || 0
  );
}


/* ============================================================
 * مقدار زيادة الصحة في كل مستوى
 * ============================================================ */

function getHealthGain(pet) {
  const resolvedPet = resolvePet(pet);

  if (!resolvedPet) {
    return 0;
  }

  return Math.max(
    0,
    Number(
      resolvedPet.growth?.health
    ) || 0
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
    Number(
      resolvedPet.growth?.hunger
    ) || 0
  );
}


/* ============================================================
 * إضافة XP
 * ============================================================
 *
 * ملاحظة مهمة:
 *
 * الوصول إلى Level 60 لا يقوم بالترقية تلقائيًا.
 *
 * اللاعب يصل إلى:
 *
 * 0★ Level 60
 *
 * ثم يجب استخدام نظام الترقية لاحقًا.
 *
 * عند الوصول للحد الأقصى:
 * XP تصبح 0.
 * ============================================================
 */

function addXP(
  level = DEFAULT_LEVEL,
  xp = DEFAULT_XP,
  amount = 0,
  pet = null,
  stars = DEFAULT_STARS
) {
  const resolvedPet = resolvePet(pet);

  let currentLevel =
    normalizeLevel(
      level,
      resolvedPet
    );

  let currentStars =
    normalizeStars(stars);

  let currentXP =
    normalizeXP(xp);

  amount = Number(amount);

  if (
    !Number.isFinite(amount) ||
    amount < 0
  ) {
    amount = 0;
  }

  amount = Math.floor(amount);

  currentXP += amount;

  const maxLevel =
    Number(resolvedPet?.maxLevel) ||
    DEFAULT_MAX_LEVEL;

  let levelsGained = 0;

  while (
    currentLevel < maxLevel &&
    currentXP >=
      getRequiredXP(currentLevel)
  ) {

    currentXP -=
      getRequiredXP(currentLevel);

    currentLevel++;

    levelsGained++;
  }

  /*
   * عند الوصول للمستوى 60:
   *
   * لا نرقّي النجمة تلقائيًا.
   *
   * اللاعب يقرر الترقية لاحقًا.
   */

  if (currentLevel >= maxLevel) {
    currentXP = 0;
  }

  return {

    level:
      currentLevel,

    stars:
      currentStars,

    xp:
      currentXP,

    levelsGained,

    leveledUp:
      levelsGained > 0,

    effectiveLevel:
      getEffectiveLevel(
        currentLevel,
        currentStars,
        resolvedPet
      ),

    power:
      getPetPower(
        resolvedPet,
        currentLevel,
        currentStars
      ),

    health:
      getPetHealth(
        resolvedPet,
        currentLevel,
        currentStars
      ),

    maxHunger:
      getPetMaxHunger(
        resolvedPet,
        currentLevel,
        currentStars
      ),

    hasSpecialImage:
      hasSpecialImage(
        resolvedPet,
        currentLevel
      ),

    canPromote:
      canPromote(
        currentLevel,
        currentStars,
        resolvedPet
      ),

    isGameCompleted:
      isGameCompleted(
        currentLevel,
        currentStars,
        resolvedPet
      )
  };
}


/* ============================================================
 * ترقية الحيوان إلى النجمة التالية
 * ============================================================
 *
 * مثال:
 *
 * 0★ Level 60
 *      ↓
 * 1★ Level 0
 *
 * القوة والصحة:
 * لا تتصفر.
 *
 * XP:
 * تصبح 0.
 *
 * المستوى:
 * يصبح 0.
 *
 * النجمة:
 * +1
 * ============================================================
 */

function promotePet(
  level = DEFAULT_LEVEL,
  stars = DEFAULT_STARS,
  xp = DEFAULT_XP,
  pet = null
) {
  const resolvedPet = resolvePet(pet);

  if (!resolvedPet) {
    return {
      success: false,
      reason: "PET_NOT_FOUND"
    };
  }

  level = normalizeLevel(
    level,
    resolvedPet
  );

  stars = normalizeStars(stars);
  xp = normalizeXP(xp);

  const maxLevel =
    Number(resolvedPet.maxLevel) ||
    DEFAULT_MAX_LEVEL;

  /* اللعبة مكتملة */
  if (
    stars >= DEFAULT_MAX_STARS &&
    level >= maxLevel
  ) {
    return {
      success: false,

      reason: "GAME_COMPLETED",

      level,
      stars,
      xp: 0,

      effectiveLevel:
        getEffectiveLevel(
          level,
          stars,
          resolvedPet
        ),

      power:
        getPetPower(
          resolvedPet,
          level,
          stars
        ),

      health:
        getPetHealth(
          resolvedPet,
          level,
          stars
        ),

      isGameCompleted: true
    };
  }

  /* لم يصل إلى المستوى المطلوب */
  if (level < maxLevel) {
    return {
      success: false,

      reason: "LEVEL_NOT_MAX",

      requiredLevel: maxLevel,

      level,
      stars,
      xp
    };
  }

  /* لا توجد نجمة سادسة */
  if (stars >= DEFAULT_MAX_STARS) {
    return {
      success: false,

      reason: "MAX_STARS_REACHED",

      level,
      stars,
      xp: 0,

      isGameCompleted:
        level >= maxLevel
    };
  }

  const newStars =
    stars + 1;

  const newLevel =
    DEFAULT_LEVEL;

  const newXP =
    DEFAULT_XP;

  return {

    success: true,

    previousLevel:
      level,

    previousStars:
      stars,

    previousXP:
      xp,

    level:
      newLevel,

    stars:
      newStars,

    xp:
      newXP,

    /*
     * القوة والصحة محسوبة
     * من effectiveLevel الجديد.
     *
     * لذلك:
     *
     * 0★ Level 60
     * =
     * 1★ Level 0
     */

    effectiveLevel:
      getEffectiveLevel(
        newLevel,
        newStars,
        resolvedPet
      ),

    power:
      getPetPower(
        resolvedPet,
        newLevel,
        newStars
      ),

    health:
      getPetHealth(
        resolvedPet,
        newLevel,
        newStars
      ),

    maxHunger:
      getPetMaxHunger(
        resolvedPet,
        newLevel,
        newStars
      ),

    hasSpecialImage:
      hasSpecialImage(
        resolvedPet,
        newLevel
      ),

    isGameCompleted:
      isGameCompleted(
        newLevel,
        newStars,
        resolvedPet
      )
  };
}


/* ============================================================
 * التحقق من الصورة الخاصة
 * ============================================================
 *
 * الصورة مرتبطة بالمستوى الحالي داخل النجمة.
 *
 * يعني:
 *
 * 0★ Level 30 → صورة
 * 1★ Level 30 → صورة
 * 2★ Level 30 → صورة
 *
 * وليس بالـ effectiveLevel.
 * ============================================================
 */

function checkSpecialImage(
  pet,
  level = DEFAULT_LEVEL
) {
  const resolvedPet =
    resolvePet(pet);

  if (!resolvedPet) {
    return false;
  }

  level =
    normalizeLevel(
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

function getLevelInfo(
  pet,
  level = DEFAULT_LEVEL,
  stars = DEFAULT_STARS
) {
  const resolvedPet =
    resolvePet(pet);

  if (!resolvedPet) {
    return null;
  }

  level =
    normalizeLevel(
      level,
      resolvedPet
    );

  stars =
    normalizeStars(stars);

  const stats =
    getPetStats(
      resolvedPet,
      level,
      stars
    );

  const progress =
    getLevelProgress(
      level,
      DEFAULT_XP,
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
      getPowerGain(
        resolvedPet
      ),

    healthGain:
      getHealthGain(
        resolvedPet
      ),

    hungerGain:
      getHungerGain(
        resolvedPet
      ),

    nextStar:
      stars < DEFAULT_MAX_STARS
        ? stars + 1
        : null
  };
}


/* ============================================================
 * التصدير
 * ============================================================ */

module.exports = {

  /* الإعدادات */
  DEFAULT_MAX_LEVEL,
  DEFAULT_LEVEL,
  DEFAULT_XP,

  DEFAULT_MAX_STARS,
  DEFAULT_STARS,

  SPECIAL_IMAGE_LEVEL,

  XP_BASE,
  XP_EXPONENT,

  /* البيانات */
  resolvePet,

  /* التنظيم */
  normalizeLevel,
  normalizeStars,
  normalizeXP,

  /* النجوم */
  getEffectiveLevel,
  canPromote,
  isGameCompleted,
  promotePet,

  /* XP */
  getRequiredXP,
  getXPForNextLevel,
  getTotalXPForLevel,
  getLevelProgress,

  /* الإحصائيات */
  getPetPower,
  getPetHealth,
  getPetMaxHunger,
  getPetStats,

  /* النمو */
  getPowerGain,
  getHealthGain,
  getHungerGain,

  /* XP */
  addXP,

  /* الصورة */
  checkSpecialImage,

  /* المعلومات */
  getLevelInfo
};