"use strict";

const Pdata = require("./Pdata");
const Inventory = require("./inventory");
const Leveling = require("./leveling");
const Achievements = require("./achievements");

const TRAIN_COOLDOWN = 30 * 60 * 1000;

// XP التدريب
const TRAIN_XP_BASE = 10000;
const TRAIN_XP_PER_LEVEL = 1000;

// بطاقة XP
const XP_CARD_AMOUNT = 100000;

// المنشط يضاعف XP
const TRAINING_BOOSTER_MULTIPLIER = 2;

// تكلفة التدريب من الجوع
const TRAIN_HUNGER_COST = 10;

const MAX_LEVEL = Leveling.DEFAULT_MAX_LEVEL || 60;

/* =========================
   أدوات مساعدة
========================= */

function safeNumber(value, fallback = 0) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return number;
}

function getRemainingCooldown(lastTrain) {
  if (!lastTrain) return 0;

  const last = new Date(lastTrain).getTime();

  if (!Number.isFinite(last)) {
    return 0;
  }

  const remaining = TRAIN_COOLDOWN - (Date.now() - last);

  return Math.max(0, remaining);
}

function formatTime(milliseconds) {
  const totalSeconds = Math.ceil(milliseconds / 1000);

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes > 0) {
    return `${minutes} دقيقة${seconds > 0 ? ` و ${seconds} ثانية` : ""}`;
  }

  return `${seconds} ثانية`;
}

/* =========================
   بيانات اللاعب
========================= */

async function getTrainingData(models, userID) {
  return await Pdata.getPlayerData(models, userID);
}

/* =========================
   الكول داون
========================= */

function checkTrainingCooldown(pet) {
  const remaining = getRemainingCooldown(pet?.lastTrain);

  return {
    onCooldown: remaining > 0,
    remaining,
    text: remaining > 0 ? formatTime(remaining) : null
  };
}

/* =========================
   حساب XP التدريب
========================= */

function calculateTrainingXP(level, useBooster = false) {
  const safeLevel = Math.max(0, safeNumber(level, 0));

  let xp = TRAIN_XP_BASE + safeLevel * TRAIN_XP_PER_LEVEL;

  if (useBooster) {
    xp *= TRAINING_BOOSTER_MULTIPLIER;
  }

  return Math.floor(xp);
}

/* =========================
   تدريب الحيوان
========================= */

async function trainPet({
  models,
  userID,
  useBooster = false
}) {
  const playerData = await getTrainingData(models, userID);

  const pet = playerData?.pet;

  if (!pet) {
    return {
      success: false,
      reason: "NO_PET",
      message: "ليس لديك حيوان حاليًا"
    };
  }

  const currentLevel = Leveling.normalizeLevel(
    pet.level,
    pet.type
  );

  const currentXP = Leveling.normalizeXP(pet.exp);

  if (currentLevel >= MAX_LEVEL) {
    return {
      success: false,
      reason: "MAX_LEVEL",
      message: "حيوانك وصل إلى المستوى الأقصى 60"
    };
  }

  const cooldown = checkTrainingCooldown(pet);

  if (cooldown.onCooldown) {
    return {
      success: false,
      reason: "COOLDOWN",
      remaining: cooldown.remaining,
      message: `يمكنك تدريب حيوانك بعد ${cooldown.text}`
    };
  }

  /* =========================
     التحقق من المنشط
  ========================= */

  if (useBooster) {
    const hasBooster = await Inventory.hasItem(
      models,
      userID,
      "trainingBoosters",
      1
    );

    if (!hasBooster) {
      return {
        success: false,
        reason: "NO_BOOSTER",
        message: "لا تملك منشط تدريب 🧪"
      };
    }
  }

  /* =========================
     حساب XP
  ========================= */

  const gainedXP = calculateTrainingXP(
    currentLevel,
    useBooster
  );

  const result = Leveling.addXP(
    currentLevel,
    currentXP,
    gainedXP,
    pet.type
  );

  /* =========================
     الجوع
  ========================= */

  const maxHunger = Leveling.getPetMaxHunger(
    pet.type,
    result.level
  );

  const currentHunger = safeNumber(
    pet.hunger,
    maxHunger
  );

  const newHunger = Math.max(
    0,
    Math.min(
      maxHunger,
      currentHunger - TRAIN_HUNGER_COST
    )
  );

  /* =========================
     الإحصائيات
  ========================= */

  const newPower = Leveling.getPetPower(
    pet.type,
    result.level
  );

  const newHealth = Leveling.getPetHealth(
    pet.type,
    result.level
  );

  const status = calculateTrainingStatus(
    newHunger,
    maxHunger,
    newHealth
  );

  /* =========================
     استهلاك المنشط
  ========================= */

  if (useBooster) {
    await Inventory.removeItem(
      models,
      userID,
      "trainingBoosters",
      1
    );
  }

  /* =========================
     حفظ البيانات
  ========================= */

  await Pdata.updatePet(
    models,
    userID,
    {
      level: result.level,
      exp: result.xp,
      power: newPower,
      health: newHealth,
      hunger: newHunger,
      status,
      lastTrain: new Date()
    }
  );

  /* =========================
     تسجيل التدريب والـXP
  ========================= */

  await Achievements.registerTraining(
    models,
    userID,
    gainedXP
  );

  /* =========================
     فحص إنجازات المستوى
  ========================= */

  try {
    await Achievements.checkAchievements(
      models,
      userID
    );
  } catch (achievementError) {
    console.error(
      "[HINA ACHIEVEMENTS] Level achievement check error:",
      achievementError
    );
  }

  return {
    success: true,

    gainedXP,

    level: result.level,
    previousLevel: currentLevel,

    xp: result.xp,

    requiredXP: Leveling.getXPForNextLevel(
      result.level,
      pet.type
    ),

    levelsGained: result.levelsGained,
    leveledUp: result.leveledUp,

    power: newPower,
    health: newHealth,

    hunger: newHunger,
    maxHunger,

    status,

    usedBooster: useBooster,

    nextTraining: TRAIN_COOLDOWN,

    hasSpecialImage: result.hasSpecialImage
  };
}

/* =========================
   بطاقة XP
========================= */

async function useXPCard(models, userID) {
  const playerData = await getTrainingData(
    models,
    userID
  );

  const pet = playerData?.pet;

  if (!pet) {
    return {
      success: false,
      reason: "NO_PET",
      message: "ليس لديك حيوان حاليًا"
    };
  }

  const currentLevel = Leveling.normalizeLevel(
    pet.level,
    pet.type
  );

  const currentXP = Leveling.normalizeXP(pet.exp);

  if (currentLevel >= MAX_LEVEL) {
    return {
      success: false,
      reason: "MAX_LEVEL",
      message: "حيوانك وصل إلى المستوى الأقصى 60"
    };
  }

  const hasCard = await Inventory.hasItem(
    models,
    userID,
    "xpCards",
    1
  );

  if (!hasCard) {
    return {
      success: false,
      reason: "NO_XP_CARD",
      message: "لا تملك بطاقة XP ⚡"
    };
  }

  /* =========================
     إضافة XP
  ========================= */

  const result = Leveling.addXP(
    currentLevel,
    currentXP,
    XP_CARD_AMOUNT,
    pet.type
  );

  const maxHunger = Leveling.getPetMaxHunger(
    pet.type,
    result.level
  );

  const currentHunger = Math.max(
    0,
    Math.min(
      maxHunger,
      safeNumber(pet.hunger, maxHunger)
    )
  );

  const newPower = Leveling.getPetPower(
    pet.type,
    result.level
  );

  const newHealth = Leveling.getPetHealth(
    pet.type,
    result.level
  );

  const status = calculateTrainingStatus(
    currentHunger,
    maxHunger,
    newHealth
  );

  /* =========================
     استهلاك البطاقة
  ========================= */

  await Inventory.removeItem(
    models,
    userID,
    "xpCards",
    1
  );

  /* =========================
     حفظ البيانات
  ========================= */

  await Pdata.updatePet(
    models,
    userID,
    {
      level: result.level,
      exp: result.xp,
      power: newPower,
      health: newHealth,
      hunger: currentHunger,
      status
    }
  );

  /* =========================
     تسجيل XP في الإنجازات
  ========================= */

  await Achievements.registerXP(
    models,
    userID,
    XP_CARD_AMOUNT
  );

  /* =========================
     فحص إنجازات المستوى
  ========================= */

  try {
    await Achievements.checkAchievements(
      models,
      userID
    );
  } catch (achievementError) {
    console.error(
      "[HINA ACHIEVEMENTS] Level achievement check error:",
      achievementError
    );
  }

  return {
    success: true,

    gainedXP: XP_CARD_AMOUNT,

    level: result.level,
    previousLevel: currentLevel,

    xp: result.xp,

    requiredXP: Leveling.getXPForNextLevel(
      result.level,
      pet.type
    ),

    levelsGained: result.levelsGained,
    leveledUp: result.leveledUp,

    power: newPower,
    health: newHealth,

    hunger: currentHunger,
    maxHunger,

    status,

    usedCard: true,

    hasSpecialImage: result.hasSpecialImage
  };
}

/* =========================
   حالة الحيوان أثناء التدريب
========================= */

function calculateTrainingStatus(
  hunger,
  maxHunger,
  health
) {
  const safeMaxHunger = Math.max(
    1,
    safeNumber(maxHunger, 100)
  );

  const hungerPercentage =
    (safeNumber(hunger, 0) / safeMaxHunger) * 100;

  const safeHealth = safeNumber(
    health,
    0
  );

  if (safeHealth <= 0) {
    return "ميت";
  }

  if (hungerPercentage <= 10) {
    return "جائع جدًا";
  }

  if (hungerPercentage <= 25) {
    return "جائع";
  }

  if (hungerPercentage <= 50) {
    return "بحاجة إلى الطعام";
  }

  return "جيد";
}

/* =========================
   معلومات التدريب
========================= */

async function getTrainingInfo(models, userID) {
  const playerData = await getTrainingData(
    models,
    userID
  );

  const pet = playerData?.pet;

  if (!pet) {
    return {
      success: false,
      reason: "NO_PET",
      message: "ليس لديك حيوان حاليًا"
    };
  }

  const level = Leveling.normalizeLevel(
    pet.level,
    pet.type
  );

  const xp = Leveling.normalizeXP(
    pet.exp
  );

  const requiredXP =
    Leveling.getXPForNextLevel(
      level,
      pet.type
    );

  const cooldown =
    checkTrainingCooldown(pet);

  const trainingXP =
    calculateTrainingXP(level, false);

  const boosterXP =
    calculateTrainingXP(level, true);

  const xpCardAmount =
    XP_CARD_AMOUNT;

  const boosterCount =
    safeNumber(
      playerData?.currency?.data
        ?.trainingBoosters,
      0
    );

  const xpCardCount =
    safeNumber(
      playerData?.currency?.data
        ?.xpCards,
      0
    );

  return {
    success: true,

    pet,

    level,
    xp,
    requiredXP,

    trainingXP,
    boosterXP,
    xpCardAmount,

    cooldown,

    boosterCount,
    xpCardCount,

    isMaxLevel:
      level >= MAX_LEVEL
  };
}

/* =========================
   رسالة حالة التدريب
========================= */

function buildTrainingMessage(info) {
  if (!info || !info.success) {
    return info?.message ||
      "تعذر الحصول على معلومات التدريب";
  }

  const pet = info.pet;

  let message =
    `⌬ ━━ 𝗛𝗜𝗡𝗔 TRAINING ━━ ⌬\n\n` +

    `🐾 الحيوان : ${pet.name || pet.type}\n` +

    `⭐ المستوى : ${info.level}/${MAX_LEVEL}\n` +

    `⚡ XP : ${info.xp}/${info.requiredXP || "MAX"}\n\n` +

    `🏋️ تدريب عادي : +${info.trainingXP} XP\n` +

    `🧪 مع المنشط : +${info.boosterXP} XP\n` +

    `⚡ بطاقة XP : +${info.xpCardAmount} XP\n\n` +

    `🧪 المنشطات : ${info.boosterCount}\n` +

    `⚡ بطاقات XP : ${info.xpCardCount}\n`;

  if (info.isMaxLevel) {
    message +=
      `\n✦ وصل الحيوان إلى المستوى الأقصى`;
  } else if (info.cooldown.onCooldown) {
    message +=
      `\n⏳ التدريب القادم بعد : ${info.cooldown.text}`;
  } else {
    message +=
      `\n✓ يمكنك تدريب الحيوان الآن`;
  }

  return message;
}

/* =========================
   أمر التدريب
========================= */

async function trainingCommand({
  models,
  userID,
  action = "status"
}) {
  const normalizedAction = String(
    action || "status"
  )
    .trim()
    .toLowerCase();

  if (
    normalizedAction === "status" ||
    normalizedAction === "حالة"
  ) {
    const info =
      await getTrainingInfo(
        models,
        userID
      );

    return {
      ...info,
      message: buildTrainingMessage(info)
    };
  }

  if (
    normalizedAction === "تدريب" ||
    normalizedAction === "train"
  ) {
    const result =
      await trainPet({
        models,
        userID,
        useBooster: false
      });

    if (!result.success) {
      return result;
    }

    return {
      ...result,

      message:
        `⌬ ━━ 𝗛𝗜𝗡𝗔 TRAINING ━━ ⌬\n\n` +

        `🐾 تم تدريب حيوانك بنجاح\n\n` +

        `⚡ XP المكتسبة : +${result.gainedXP}\n` +

        `⭐ المستوى : ${result.level}` +
        (
          result.leveledUp
            ? ` ↑ (+${result.levelsGained})`
            : ""
        ) +

        `\n⚡ XP الحالية : ${result.xp}` +

        (
          result.requiredXP
            ? `/${result.requiredXP}`
            : ""
        ) +

        `\n💪 القوة : ${result.power}` +

        `\n❤️ الصحة : ${result.health}` +

        `\n🍖 الجوع : ${result.hunger}/${result.maxHunger}` +

        `\n\n⏳ التدريب القادم بعد 30 دقيقة`
    };
  }

  if (
    normalizedAction === "منشط" ||
    normalizedAction === "منشّط" ||
    normalizedAction === "booster"
  ) {
    const result =
      await trainPet({
        models,
        userID,
        useBooster: true
      });

    if (!result.success) {
      return result;
    }

    return {
      ...result,

      message:
        `⌬ ━━ 𝗛𝗜𝗡𝗔 TRAINING ━━ ⌬\n\n` +

        `🧪 تم استخدام منشط التدريب\n\n` +

        `⚡ XP المكتسبة : +${result.gainedXP}\n` +

        `⭐ المستوى : ${result.level}` +
        (
          result.leveledUp
            ? ` ↑ (+${result.levelsGained})`
            : ""
        ) +

        `\n⚡ XP الحالية : ${result.xp}` +

        (
          result.requiredXP
            ? `/${result.requiredXP}`
            : ""
        ) +

        `\n💪 القوة : ${result.power}` +

        `\n❤️ الصحة : ${result.health}` +

        `\n🍖 الجوع : ${result.hunger}/${result.maxHunger}` +

        `\n\n⏳ التدريب القادم بعد 30 دقيقة`
    };
  }

  if (
    normalizedAction === "بطاقة" ||
    normalizedAction === "بطاقة xp" ||
    normalizedAction === "بطاقة XP" ||
    normalizedAction === "xp" ||
    normalizedAction === "xp card"
  ) {
    return await useXPCard(
      models,
      userID
    );
  }

  return {
    success: false,
    reason: "INVALID_ACTION",
    message:
      "الأوامر المتاحة:\n" +
      "حالة\n" +
      "تدريب\n" +
      "منشط\n" +
      "بطاقة XP"
  };
}

/* =========================
   التصدير
========================= */

module.exports = {
  TRAIN_COOLDOWN,

  TRAIN_XP_BASE,
  TRAIN_XP_PER_LEVEL,

  XP_CARD_AMOUNT,

  TRAINING_BOOSTER_MULTIPLIER,

  TRAIN_HUNGER_COST,

  MAX_LEVEL,

  safeNumber,
  getRemainingCooldown,
  formatTime,

  getTrainingData,

  checkTrainingCooldown,

  calculateTrainingXP,

  trainPet,

  useXPCard,

  calculateTrainingStatus,

  getTrainingInfo,

  buildTrainingMessage,

  trainingCommand
};