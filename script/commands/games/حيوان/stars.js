"use strict";

const MAX_LEVEL = 60;
const MAX_STARS = 5;

/**
 * تحويل المستوى إلى رقم آمن
 */
function normalizeLevel(level) {
  level = Number(level);

  if (!Number.isFinite(level)) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(MAX_LEVEL, Math.floor(level))
  );
}

/**
 * تحويل النجوم إلى رقم آمن
 */
function normalizeStars(stars) {
  stars = Number(stars);

  if (!Number.isFinite(stars)) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(MAX_STARS, Math.floor(stars))
  );
}

/**
 * معرفة المستوى الفعلي للحيوان
 *
 * كل نجمة = 60 مستوى إضافي
 *
 * 0★ Lv60 = 60
 * 1★ Lv0  = 60
 * 1★ Lv60 = 120
 * 5★ Lv60 = 360
 */
function getEffectiveLevel(level = 0, stars = 0) {
  level = normalizeLevel(level);
  stars = normalizeStars(stars);

  return (stars * MAX_LEVEL) + level;
}

/**
 * هل الحيوان وصل للمستوى 60؟
 */
function isMaxLevel(level = 0) {
  return normalizeLevel(level) >= MAX_LEVEL;
}

/**
 * هل الحيوان وصل إلى 5 نجوم؟
 */
function isMaxStars(stars = 0) {
  return normalizeStars(stars) >= MAX_STARS;
}

/**
 * هل الحيوان يمكن ترقيته؟
 *
 * شروط الترقية:
 * - المستوى 60
 * - النجوم أقل من 5
 */
function canPromote(
  level = 0,
  stars = 0
) {
  level = normalizeLevel(level);
  stars = normalizeStars(stars);

  return (
    level >= MAX_LEVEL &&
    stars < MAX_STARS
  );
}

/**
 * هل اللعبة انتهت؟
 *
 * 5★ + Lv60
 */
function isGameCompleted(
  level = 0,
  stars = 0
) {
  level = normalizeLevel(level);
  stars = normalizeStars(stars);

  return (
    level >= MAX_LEVEL &&
    stars >= MAX_STARS
  );
}

/**
 * تنفيذ ترقية الحيوان
 *
 * عند الترقية:
 * - النجمة +1
 * - المستوى يعود إلى 0
 * - XP يعود إلى 0
 *
 * القوة والصحة لا يتم تعديلهما هنا
 * لأنهما يحسبان اعتمادًا على المستوى الفعلي.
 */
function promotePet(
  level = 0,
  stars = 0,
  xp = 0
) {
  level = normalizeLevel(level);
  stars = normalizeStars(stars);

  xp = Number(xp);

  if (!Number.isFinite(xp) || xp < 0) {
    xp = 0;
  }

  /**
   * اللعبة مكتملة
   */
  if (isGameCompleted(level, stars)) {
    return {
      success: false,
      reason: "GAME_COMPLETED",

      level,
      stars,
      xp,

      effectiveLevel:
        getEffectiveLevel(level, stars)
    };
  }

  /**
   * النجوم وصلت للحد الأقصى
   */
  if (isMaxStars(stars)) {
    return {
      success: false,
      reason: "MAX_STARS_REACHED",

      level,
      stars,
      xp,

      effectiveLevel:
        getEffectiveLevel(level, stars)
    };
  }

  /**
   * المستوى لم يصل إلى 60
   */
  if (!isMaxLevel(level)) {
    return {
      success: false,
      reason: "LEVEL_NOT_MAX",

      level,
      stars,
      xp,

      effectiveLevel:
        getEffectiveLevel(level, stars)
    };
  }

  /**
   * الترقية
   */
  const newStars = stars + 1;
  const newLevel = 0;
  const newXP = 0;

  return {
    success: true,
    reason: "PROMOTED",

    level: newLevel,
    stars: newStars,
    xp: newXP,

    previousLevel: level,
    previousStars: stars,
    previousXP: xp,

    effectiveLevel:
      getEffectiveLevel(
        newLevel,
        newStars
      ),

    previousEffectiveLevel:
      getEffectiveLevel(
        level,
        stars
      ),

    isGameCompleted:
      isGameCompleted(
        newLevel,
        newStars
      )
  };
}

/**
 * معلومات النجوم الحالية
 */
function getStarInfo(
  level = 0,
  stars = 0
) {
  level = normalizeLevel(level);
  stars = normalizeStars(stars);

  return {
    level,
    stars,

    maxLevel: MAX_LEVEL,
    maxStars: MAX_STARS,

    effectiveLevel:
      getEffectiveLevel(
        level,
        stars
      ),

    isMaxLevel:
      isMaxLevel(level),

    isMaxStars:
      isMaxStars(stars),

    canPromote:
      canPromote(
        level,
        stars
      ),

    isGameCompleted:
      isGameCompleted(
        level,
        stars
      ),

    nextStars:
      stars < MAX_STARS
        ? stars + 1
        : null
  };
}

/**
 * معرفة النجمة التالية
 */
function getNextStars(stars = 0) {
  stars = normalizeStars(stars);

  if (stars >= MAX_STARS) {
    return null;
  }

  return stars + 1;
}

/**
 * معرفة مقدار التقدم في النجوم
 */
function getStarProgress(stars = 0) {
  stars = normalizeStars(stars);

  return {
    current: stars,
    max: MAX_STARS,
    percentage: Math.floor(
      (stars / MAX_STARS) * 100
    )
  };
}

module.exports = {
  MAX_LEVEL,
  MAX_STARS,

  normalizeLevel,
  normalizeStars,

  getEffectiveLevel,

  isMaxLevel,
  isMaxStars,

  canPromote,
  isGameCompleted,

  promotePet,

  getStarInfo,
  getNextStars,
  getStarProgress
};