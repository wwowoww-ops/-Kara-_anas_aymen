/**
 * care.js
 * نظام العناية بالحيوان
 *
 * المسؤول عن:
 * إطعام الحيوان
 * علاج الحيوان
 * الصحة
 * الجوع
 * حالة الحيوان
 *
 * يعتمد على:
 * Pdata.js
 * inventory.js
 * achievements.js
 * mission.js
 * stats.js
 */

"use strict";

const Pdata = require("./Pdata");
const Inventory = require("./inventory");
const Achievements = require("./achievements");
const Mission = require("./mission");
const Stats = require("./stats");
const Pets = require("./pets");

// =========================================================
// الإعدادات
// =========================================================

const CARE_HEADER =
  "⌬ ━━ 𝗛𝗜𝗡𝗔 CARE ━━ ⌬";

// مقدار الجوع الذي يضيفه الطعام
const FOOD_HUNGER = 25;

// مقدار الصحة التي يعيدها الدواء
const MEDICINE_HEALTH = 40;

// =========================================================
// الحالات
// =========================================================

const STATUS = {
  HAPPY: "سعيد",
  NORMAL: "طبيعي",
  HUNGRY: "جائع",
  SICK: "مريض"
};

// =========================================================
// تنسيق الأرقام
// =========================================================

function formatNumber(number) {
  const value = Number(number);

  if (!Number.isFinite(value)) {
    return "0";
  }

  return Math.floor(value)
    .toLocaleString("en-US");
}

// =========================================================
// رقم آمن
// =========================================================

function safeNumber(value, fallback = 0) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
}

// =========================================================
// المستوى والنجوم
// =========================================================

function getLevel(pet) {
  return Math.max(
    0,
    Math.min(
      Stats.MAX_LEVEL,
      Math.floor(
        safeNumber(pet?.level)
      )
    )
  );
}

function getStars(pet) {
  return Math.max(
    0,
    Math.min(
      Stats.MAX_STARS,
      Math.floor(
        safeNumber(pet?.stars)
      )
    )
  );
}

// =========================================================
// بيانات الحيوان الأساسية
// =========================================================

function getPetData(pet) {
  if (!pet) {
    return null;
  }

  return Pets.getPetByType(
    pet.type
  );
}

// =========================================================
// الإحصائيات
//
// مهم:
// pets.calculateHealth و pets.calculateMaxHunger
// لا تستقبل level + stars بشكل مباشر.
//
// Stats هي المسؤولة عن تحويل النجوم + المستوى
// إلى effectiveLevel.
// =========================================================

function getPetStats(pet) {
  if (!pet) {
    return null;
  }

  const petData =
    getPetData(pet);

  if (!petData) {
    return null;
  }

  const level =
    getLevel(pet);

  const stars =
    getStars(pet);

  return Stats.getStats(
    petData,
    level,
    stars,
    safeNumber(pet.health),
    safeNumber(pet.hunger)
  );
}

// =========================================================
// الحد الأقصى للصحة
// =========================================================

function getMaxHealth(pet) {
  try {
    const stats =
      getPetStats(pet);

    if (stats) {
      return stats.maxHealth;
    }
  } catch (error) {
    console.error(
      "[HINA CARE] Max health error:",
      error
    );
  }

  return Math.max(
    100,
    safeNumber(
      pet?.health,
      100
    )
  );
}

// =========================================================
// الحد الأقصى للجوع
// =========================================================

function getMaxHunger(pet) {
  try {
    const stats =
      getPetStats(pet);

    if (stats) {
      return stats.maxHunger;
    }
  } catch (error) {
    console.error(
      "[HINA CARE] Max hunger error:",
      error
    );
  }

  return Math.max(
    100,
    safeNumber(
      pet?.hunger,
      100
    )
  );
}

// =========================================================
// تحديد حالة الحيوان
// =========================================================

function calculateStatus(
  pet,
  maxHealth,
  maxHunger
) {
  const health =
    Math.max(
      0,
      safeNumber(pet?.health)
    );

  const hunger =
    Math.max(
      0,
      safeNumber(pet?.hunger)
    );

  // ---------------------------------------------------------
  // صحة منخفضة جدًا = مريض
  // ---------------------------------------------------------

  if (
    maxHealth > 0 &&
    health <= maxHealth * 0.25
  ) {
    return STATUS.SICK;
  }

  // ---------------------------------------------------------
  // جوع شديد
  // ---------------------------------------------------------

  if (
    maxHunger > 0 &&
    hunger <= maxHunger * 0.20
  ) {
    return STATUS.HUNGRY;
  }

  // ---------------------------------------------------------
  // جوع متوسط
  // ---------------------------------------------------------

  if (
    maxHunger > 0 &&
    hunger <= maxHunger * 0.50
  ) {
    return STATUS.NORMAL;
  }

  // ---------------------------------------------------------
  // صحة جيدة وشبع جيد
  // ---------------------------------------------------------

  return STATUS.HAPPY;
}

// =========================================================
// الحصول على موديلات قاعدة البيانات
// =========================================================

function getModels(models) {
  const PetsModel =
    Pdata.getPetsModel(
      models
    );

  const PetCurrency =
    Pdata.getPetCurrencyModel(
      models
    );

  return {
    Pets: PetsModel,
    PetCurrency
  };
}

// =========================================================
// جلب بيانات اللاعب
// =========================================================

async function getPlayer(
  models,
  userID
) {
  const {
    Pets: PetsModel,
    PetCurrency
  } =
    getModels(models);

  const player =
    await Pdata.getPlayerData(
      models,
      userID
    );

  return {
    Pets: PetsModel,
    PetCurrency,

    pet:
      player?.pet || null,

    currency:
      player?.currency || null
  };
}

// =========================================================
// التحقق من وجود الحيوان
// =========================================================

function requirePet(pet) {
  if (!pet) {
    throw new Error(
      "PET_NOT_FOUND"
    );
  }

  return pet;
}

// =========================================================
// تسجيل إنجاز الإطعام
// =========================================================

async function registerFeedAchievement(
  models,
  userID
) {
  try {
    if (
      typeof Achievements.registerFeed ===
      "function"
    ) {
      await Achievements.registerFeed(
        models,
        userID
      );
    }
  } catch (error) {
    console.error(
      "[HINA ACHIEVEMENTS] Feed registration error:",
      error
    );
  }
}

// =========================================================
// تسجيل إنجاز العلاج
// =========================================================

async function registerHealAchievement(
  models,
  userID
) {
  try {
    if (
      typeof Achievements.registerHeal ===
      "function"
    ) {
      await Achievements.registerHeal(
        models,
        userID
      );
    }
  } catch (error) {
    console.error(
      "[HINA ACHIEVEMENTS] Heal registration error:",
      error
    );
  }
}

// =========================================================
// تسجيل مهمة الإطعام
// =========================================================

async function registerFeedMission(
  models,
  userID,
  amount
) {
  try {
    if (
      typeof Mission.registerFeed ===
      "function"
    ) {
      await Mission.registerFeed(
        models,
        userID,
        amount
      );
    }
  } catch (error) {
    console.error(
      "[HINA MISSION] Feed registration error:",
      error
    );
  }
}

// =========================================================
// تسجيل مهمة العلاج
// =========================================================

async function registerHealMission(
  models,
  userID,
  amount
) {
  try {
    if (
      typeof Mission.registerHeal ===
      "function"
    ) {
      await Mission.registerHeal(
        models,
        userID,
        amount
      );
    }
  } catch (error) {
    console.error(
      "[HINA MISSION] Heal registration error:",
      error
    );
  }
}

// =========================================================
// إطعام الحيوان
// =========================================================

async function feedPet({
  models,
  userID,
  amount = 1
}) {
  amount =
    Number(amount);

  if (
    !Number.isSafeInteger(amount) ||
    amount <= 0
  ) {
    throw new Error(
      "INVALID_AMOUNT"
    );
  }

  const {
    pet,
    currency
  } =
    await getPlayer(
      models,
      userID
    );

  requirePet(pet);

  if (!currency) {
    throw new Error(
      "CURRENCY_NOT_FOUND"
    );
  }

  // ---------------------------------------------------------
  // الإحصائيات الحالية
  // ---------------------------------------------------------

  const maxHunger =
    getMaxHunger(pet);

  const maxHealth =
    getMaxHealth(pet);

  const currentHunger =
    Math.max(
      0,
      Math.min(
        maxHunger,
        safeNumber(pet.hunger)
      )
    );

  // ---------------------------------------------------------
  // إذا كان ممتلئًا
  // ---------------------------------------------------------

  if (
    currentHunger >= maxHunger
  ) {
    throw new Error(
      "HUNGER_FULL"
    );
  }

  // ---------------------------------------------------------
  // الطعام المطلوب فعليًا
  //
  // إذا احتاج الحيوان 10 فقط للوصول للحد الأقصى
  // فلا داعي لاستهلاك 3 أو 4 أطعمة.
  // ---------------------------------------------------------

  const hungerNeeded =
    Math.max(
      0,
      maxHunger - currentHunger
    );

  const maxUsefulFood =
    Math.ceil(
      hungerNeeded /
      FOOD_HUNGER
    );

  const foodToUse =
    Math.min(
      amount,
      maxUsefulFood
    );

  // ---------------------------------------------------------
  // التحقق من الطعام
  // ---------------------------------------------------------

  if (
    !Inventory.hasItem(
      currency,
      "food",
      foodToUse
    )
  ) {
    throw new Error(
      "INSUFFICIENT_FOOD"
    );
  }

  // ---------------------------------------------------------
  // حساب الجوع الجديد
  // ---------------------------------------------------------

  const addedHunger =
    FOOD_HUNGER *
    foodToUse;

  const newHunger =
    Math.min(
      maxHunger,
      currentHunger +
        addedHunger
    );

  // ---------------------------------------------------------
  // استهلاك الطعام
  // ---------------------------------------------------------

  await Inventory.useItem(
    currency,
    "food",
    foodToUse
  );

  // ---------------------------------------------------------
  // الحالة الجديدة
  // ---------------------------------------------------------

  const newStatus =
    calculateStatus(
      {
        ...(
          pet.dataValues ||
          pet
        ),

        health:
          safeNumber(
            pet.health
          ),

        hunger:
          newHunger
      },

      maxHealth,
      maxHunger
    );

  // ---------------------------------------------------------
  // تحديث الحيوان
  // ---------------------------------------------------------

  await Pdata.updatePet(
    pet,
    {
      hunger:
        newHunger,

      status:
        newStatus
    }
  );

  // ---------------------------------------------------------
  // تسجيل الإنجازات
  // ---------------------------------------------------------

  await registerFeedAchievement(
    models,
    userID
  );

  // ---------------------------------------------------------
  // تسجيل المهمة
  // ---------------------------------------------------------

  await registerFeedMission(
    models,
    userID,
    foodToUse
  );

  return {
    pet,

    amount:
      foodToUse,

    requestedAmount:
      amount,

    oldHunger:
      currentHunger,

    newHunger,

    maxHunger,

    status:
      newStatus
  };
}

// =========================================================
// علاج الحيوان
// =========================================================

async function healPet({
  models,
  userID,
  amount = 1
}) {
  amount =
    Number(amount);

  if (
    !Number.isSafeInteger(amount) ||
    amount <= 0
  ) {
    throw new Error(
      "INVALID_AMOUNT"
    );
  }

  const {
    pet,
    currency
  } =
    await getPlayer(
      models,
      userID
    );

  requirePet(pet);

  if (!currency) {
    throw new Error(
      "CURRENCY_NOT_FOUND"
    );
  }

  // ---------------------------------------------------------
  // الإحصائيات
  // ---------------------------------------------------------

  const maxHealth =
    getMaxHealth(pet);

  const maxHunger =
    getMaxHunger(pet);

  const currentHealth =
    Math.max(
      0,
      Math.min(
        maxHealth,
        safeNumber(
          pet.health
        )
      )
    );

  // ---------------------------------------------------------
  // إذا كانت الصحة كاملة
  // ---------------------------------------------------------

  if (
    currentHealth >= maxHealth
  ) {
    throw new Error(
      "HEALTH_FULL"
    );
  }

  // ---------------------------------------------------------
  // عدد الأدوية المفيد
  // ---------------------------------------------------------

  const healthNeeded =
    Math.max(
      0,
      maxHealth -
        currentHealth
    );

  const maxUsefulMedicine =
    Math.ceil(
      healthNeeded /
      MEDICINE_HEALTH
    );

  const medicineToUse =
    Math.min(
      amount,
      maxUsefulMedicine
    );

  // ---------------------------------------------------------
  // التحقق من الدواء
  // ---------------------------------------------------------

  if (
    !Inventory.hasItem(
      currency,
      "medicine",
      medicineToUse
    )
  ) {
    throw new Error(
      "INSUFFICIENT_MEDICINE"
    );
  }

  // ---------------------------------------------------------
  // الصحة الجديدة
  // ---------------------------------------------------------

  const addedHealth =
    MEDICINE_HEALTH *
    medicineToUse;

  const newHealth =
    Math.min(
      maxHealth,
      currentHealth +
        addedHealth
    );

  // ---------------------------------------------------------
  // استهلاك الدواء
  // ---------------------------------------------------------

  await Inventory.useItem(
    currency,
    "medicine",
    medicineToUse
  );

  // ---------------------------------------------------------
  // الحالة الجديدة
  // ---------------------------------------------------------

  const newStatus =
    calculateStatus(
      {
        ...(
          pet.dataValues ||
          pet
        ),

        health:
          newHealth,

        hunger:
          safeNumber(
            pet.hunger
          )
      },

      maxHealth,
      maxHunger
    );

  // ---------------------------------------------------------
  // تحديث الحيوان
  // ---------------------------------------------------------

  await Pdata.updatePet(
    pet,
    {
      health:
        newHealth,

      status:
        newStatus
    }
  );

  // ---------------------------------------------------------
  // تسجيل الإنجاز
  // ---------------------------------------------------------

  await registerHealAchievement(
    models,
    userID
  );

  // ---------------------------------------------------------
  // تسجيل المهمة
  // ---------------------------------------------------------

  await registerHealMission(
    models,
    userID,
    medicineToUse
  );

  return {
    pet,

    amount:
      medicineToUse,

    requestedAmount:
      amount,

    oldHealth:
      currentHealth,

    newHealth,

    maxHealth,

    status:
      newStatus
  };
}

// =========================================================
// استعادة الصحة بالكامل
// =========================================================

async function fullHeal({
  models,
  userID
}) {
  const {
    pet,
    currency
  } =
    await getPlayer(
      models,
      userID
    );

  requirePet(pet);

  if (!currency) {
    throw new Error(
      "CURRENCY_NOT_FOUND"
    );
  }

  const maxHealth =
    getMaxHealth(pet);

  const maxHunger =
    getMaxHunger(pet);

  const currentHealth =
    Math.max(
      0,
      Math.min(
        maxHealth,
        safeNumber(
          pet.health
        )
      )
    );

  // ---------------------------------------------------------
  // لا داعي لاستهلاك دواء إذا كانت كاملة
  // ---------------------------------------------------------

  if (
    currentHealth >= maxHealth
  ) {
    throw new Error(
      "HEALTH_FULL"
    );
  }

  // ---------------------------------------------------------
  // التحقق من الدواء
  // ---------------------------------------------------------

  if (
    !Inventory.hasItem(
      currency,
      "medicine",
      1
    )
  ) {
    throw new Error(
      "INSUFFICIENT_MEDICINE"
    );
  }

  // ---------------------------------------------------------
  // استهلاك الدواء
  // ---------------------------------------------------------

  await Inventory.useItem(
    currency,
    "medicine",
    1
  );

  // ---------------------------------------------------------
  // الحالة الجديدة
  // ---------------------------------------------------------

  const newStatus =
    calculateStatus(
      {
        ...(
          pet.dataValues ||
          pet
        ),

        health:
          maxHealth,

        hunger:
          safeNumber(
            pet.hunger
          )
      },

      maxHealth,
      maxHunger
    );

  // ---------------------------------------------------------
  // تحديث الحيوان
  // ---------------------------------------------------------

  await Pdata.updatePet(
    pet,
    {
      health:
        maxHealth,

      status:
        newStatus
    }
  );

  // ---------------------------------------------------------
  // الإنجازات
  // ---------------------------------------------------------

  await registerHealAchievement(
    models,
    userID
  );

  // ---------------------------------------------------------
  // المهمة
  // ---------------------------------------------------------

  await registerHealMission(
    models,
    userID,
    1
  );

  return {
    pet,

    health:
      maxHealth,

    maxHealth,

    status:
      newStatus
  };
}

// =========================================================
// الحصول على حالة الحيوان
// =========================================================

function getCareStatus(pet) {
  requirePet(pet);

  const stats =
    getPetStats(pet);

  if (!stats) {
    throw new Error(
      "PET_DATA_NOT_FOUND"
    );
  }

  const health =
    Math.max(
      0,
      Math.min(
        stats.maxHealth,
        safeNumber(
          pet.health
        )
      )
    );

  const hunger =
    Math.max(
      0,
      Math.min(
        stats.maxHunger,
        safeNumber(
          pet.hunger
        )
      )
    );

  const status =
    calculateStatus(
      {
        ...(
          pet.dataValues ||
          pet
        ),

        health,
        hunger
      },

      stats.maxHealth,
      stats.maxHunger
    );

  return {
    health,

    maxHealth:
      stats.maxHealth,

    hunger,

    maxHunger:
      stats.maxHunger,

    healthPercentage:
      stats.maxHealth > 0
        ? Math.floor(
            (
              health /
              stats.maxHealth
            ) * 100
          )
        : 0,

    hungerPercentage:
      stats.maxHunger > 0
        ? Math.floor(
            (
              hunger /
              stats.maxHunger
            ) * 100
          )
        : 0,

    status
  };
}

// =========================================================
// رسالة حالة العناية
// =========================================================

function buildCareMessage(
  pet,
  currency
) {
  const status =
    getCareStatus(
      pet
    );

  const bag =
    Inventory.getInventoryData(
      currency
    );

  let message =
    `${CARE_HEADER}\n\n`;

  message +=
    `🐾 ${
      pet.name ||
      pet.type
    }\n\n`;

  message +=
    `❤️ الصحة: ${
      formatNumber(
        status.health
      )
    }/${
      formatNumber(
        status.maxHealth
      )
    }\n`;

  message +=
    `🍗 الجوع: ${
      formatNumber(
        status.hunger
      )
    }/${
      formatNumber(
        status.maxHunger
      )
    }\n`;

  message +=
    `📊 الحالة: ${
      status.status
    }\n\n`;

  message +=
    "━━━━━━━━━━━━━━━━━━\n\n";

  message +=
    `🍖 الطعام: ×${
      formatNumber(
        bag.food
      )
    }\n`;

  message +=
    `💊 الدواء: ×${
      formatNumber(
        bag.medicine
      )
    }\n\n`;

  message +=
    "أوامر العناية:\n";

  message +=
    "🍖 إطعام\n";

  message +=
    "💊 علاج\n";

  return message;
}

// =========================================================
// رسائل الأخطاء
// =========================================================

function getErrorMessage(error) {
  switch (
    error?.message
  ) {
    case "PET_NOT_FOUND":
      return "❌ لا تملك حيوانًا بعد.";

    case "PET_DATA_NOT_FOUND":
      return "❌ تعذر العثور على بيانات هذا الحيوان.";

    case "CURRENCY_NOT_FOUND":
      return "❌ تعذر العثور على بيانات محفظتك.";

    case "INVALID_AMOUNT":
      return "❌ الكمية غير صحيحة.";

    case "HUNGER_FULL":
      return "🍗 حيوانك ليس جائعًا حاليًا.";

    case "HEALTH_FULL":
      return "❤️ صحة حيوانك ممتلئة بالفعل.";

    case "INSUFFICIENT_FOOD":
      return "❌ لا تملك كمية كافية من الطعام.";

    case "INSUFFICIENT_MEDICINE":
      return "❌ لا تملك كمية كافية من الدواء.";

    default:
      return (
        "❌ حدث خطأ أثناء عملية العناية.\n\n" +
        `📝 ${
          error?.message ||
          "خطأ غير معروف"
        }`
      );
  }
}

// =========================================================
// تنفيذ أمر العناية
// =========================================================

async function careCommand({
  api,
  event,
  models,
  action,
  amount = 1
}) {
  const {
    threadID,
    messageID,
    senderID
  } = event;

  try {
    // -------------------------------------------------------
    // عرض الحالة
    // -------------------------------------------------------

    if (
      !action ||
      action === "حالة" ||
      action === "status"
    ) {
      const {
        pet,
        currency
      } =
        await getPlayer(
          models,
          senderID
        );

      if (!pet) {
        return api.sendMessage(
          `${CARE_HEADER}\n\n` +
          "❌ لا تملك حيوانًا بعد.",
          threadID,
          messageID
        );
      }

      return api.sendMessage(
        buildCareMessage(
          pet,
          currency
        ),
        threadID,
        messageID
      );
    }

    // -------------------------------------------------------
    // إطعام
    // -------------------------------------------------------

    if (
      action === "إطعام" ||
      action === "اطعام" ||
      action === "أطعم" ||
      action === "طعام" ||
      action === "feed"
    ) {
      const result =
        await feedPet({
          models,
          userID:
            senderID,
          amount
        });

      return api.sendMessage(
        `${CARE_HEADER}\n\n` +

        "🍖 تمت إطعام الحيوان بنجاح\n\n" +

        `🐾 ${
          result.pet.name ||
          result.pet.type
        }\n` +

        `🍖 الطعام المستخدم: ×${
          formatNumber(
            result.amount
          )
        }\n` +

        `🍗 الجوع: ${
          formatNumber(
            result.oldHunger
          )
        } → ${
          formatNumber(
            result.newHunger
          )
        }/${
          formatNumber(
            result.maxHunger
          )
        }\n\n` +

        `📊 الحالة: ${
          result.status
        }`,

        threadID,
        messageID
      );
    }

    // -------------------------------------------------------
    // علاج
    // -------------------------------------------------------

    if (
      action === "علاج" ||
      action === "عالج" ||
      action === "دواء" ||
      action === "heal"
    ) {
      const result =
        await healPet({
          models,
          userID:
            senderID,
          amount
        });

      return api.sendMessage(
        `${CARE_HEADER}\n\n` +

        "💊 تمت معالجة الحيوان بنجاح\n\n" +

        `🐾 ${
          result.pet.name ||
          result.pet.type
        }\n` +

        `💊 الدواء المستخدم: ×${
          formatNumber(
            result.amount
          )
        }\n` +

        `❤️ الصحة: ${
          formatNumber(
            result.oldHealth
          )
        } → ${
          formatNumber(
            result.newHealth
          )
        }/${
          formatNumber(
            result.maxHealth
          )
        }\n\n` +

        `📊 الحالة: ${
          result.status
        }`,

        threadID,
        messageID
      );
    }

    // -------------------------------------------------------
    // أمر غير معروف
    // -------------------------------------------------------

    return api.sendMessage(
      `${CARE_HEADER}\n\n` +

      "❌ الأمر غير معروف.\n\n" +

      "الأوامر المتاحة:\n" +

      "🍖 إطعام\n" +
      "💊 علاج\n" +
      "📊 حالة",

      threadID,
      messageID
    );

  } catch (error) {
    console.error(
      "[HINA CARE ERROR]",
      error
    );

    return api.sendMessage(
      `${CARE_HEADER}\n\n` +
      getErrorMessage(error),

      threadID,
      messageID
    );
  }
}

// =========================================================
// EXPORTS
// =========================================================

module.exports = {
  CARE_HEADER,

  STATUS,

  FOOD_HUNGER,

  MEDICINE_HEALTH,

  getMaxHealth,

  getMaxHunger,

  calculateStatus,

  getCareStatus,

  buildCareMessage,

  feedPet,

  healPet,

  fullHeal,

  careCommand
};