/**
 * care.js
 * نظام العناية بالحيوان
 *
 * المسؤول عن:
 * 🍖 إطعام الحيوان
 * 💊 علاج الحيوان
 * ❤️ الصحة
 * 🍗 الجوع
 * 🤒 حالة الحيوان
 *
 * يعتمد على:
 * Pdata.js
 * inventory.js
 * achievements.js
 */

"use strict";

const Pdata = require("./Pdata");
const Inventory = require("./inventory");
const Achievements = require("./achievements");

// =========================================================
// الإعدادات
// =========================================================

const CARE_HEADER = "⌬ ━━ 𝗛𝗜𝗡𝗔 CARE ━━ ⌬";

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
  return Number(number || 0).toLocaleString("en-US");
}

// =========================================================
// الحصول على قيمة آمنة
// =========================================================

function safeNumber(value, fallback = 0) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
}

// =========================================================
// تحديد حالة الحيوان
// =========================================================

function calculateStatus(pet, maxHealth, maxHunger) {
  const health =
    safeNumber(pet.health);

  const hunger =
    safeNumber(pet.hunger);

  // الحيوان المريض يبقى مريضًا
  if (
    pet.status === STATUS.SICK
  ) {
    return STATUS.SICK;
  }

  // صحة منخفضة جدًا
  if (
    maxHealth > 0 &&
    health <= maxHealth * 0.25
  ) {
    return STATUS.SICK;
  }

  // جوع شديد
  if (
    maxHunger > 0 &&
    hunger <= maxHunger * 0.20
  ) {
    return STATUS.HUNGRY;
  }

  // جوع متوسط
  if (
    maxHunger > 0 &&
    hunger <= maxHunger * 0.50
  ) {
    return STATUS.NORMAL;
  }

  return STATUS.HAPPY;
}

// =========================================================
// الحصول على الحد الأقصى للصحة
// =========================================================

function getMaxHealth(pet) {
  try {
    const Pets = require("./pets");

    if (
      pet &&
      pet.type
    ) {
      const petData =
        Pets.getPetByType(
          pet.type
        );

      if (petData) {
        return Pets.calculateHealth(
          petData,
          Number(pet.level) || 0,
          Number(pet.stars) || 0
        );
      }
    }
  } catch (error) {
    console.error(
      "[HINA CARE] Max health error:",
      error
    );
  }

  return Math.max(
    100,
    safeNumber(pet.health, 100)
  );
}

// =========================================================
// الحصول على الحد الأقصى للجوع
// =========================================================

function getMaxHunger(pet) {
  try {
    const Pets = require("./pets");

    if (
      pet &&
      pet.type
    ) {
      const petData =
        Pets.getPetByType(
          pet.type
        );

      if (petData) {
        return Pets.calculateMaxHunger(
          petData,
          Number(pet.level) || 0,
          Number(pet.stars) || 0
        );
      }
    }
  } catch (error) {
    console.error(
      "[HINA CARE] Max hunger error:",
      error
    );
  }

  return 100;
}

// =========================================================
// الحصول على موديلات قاعدة البيانات
// =========================================================

function getModels(models) {
  const Pets =
    Pdata.getPetsModel(
      models
    );

  const PetCurrency =
    Pdata.getPetCurrencyModel(
      models
    );

  return {
    Pets,
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
    Pets,
    PetCurrency
  } = getModels(models);

  const player =
    await Pdata.getPlayerData(
      models,
      userID
    );

  return {
    Pets,
    PetCurrency,
    pet: player.pet,
    currency: player.currency
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
    await Achievements.registerFeed(
      models,
      userID
    );
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
    await Achievements.registerHeal(
      models,
      userID
    );
  } catch (error) {
    console.error(
      "[HINA ACHIEVEMENTS] Heal registration error:",
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

  // ---------------------------------------------------------
  // الحد الأقصى للجوع
  // ---------------------------------------------------------

  const maxHunger =
    getMaxHunger(pet);

  const currentHunger =
    safeNumber(pet.hunger);

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
  // التحقق من الطعام
  // ---------------------------------------------------------

  if (
    !Inventory.hasItem(
      currency,
      "food",
      amount
    )
  ) {
    throw new Error(
      "INSUFFICIENT_FOOD"
    );
  }

  // ---------------------------------------------------------
  // كمية الجوع الفعلية
  // ---------------------------------------------------------

  const addedHunger =
    FOOD_HUNGER * amount;

  const newHunger =
    Math.min(
      maxHunger,
      currentHunger + addedHunger
    );

  // ---------------------------------------------------------
  // استهلاك الطعام
  // ---------------------------------------------------------

  await Inventory.useItem(
    currency,
    "food",
    amount
  );

  // ---------------------------------------------------------
  // تحديث الحيوان
  // ---------------------------------------------------------

  const maxHealth =
    getMaxHealth(pet);

  const newStatus =
    calculateStatus(
      {
        ...pet.dataValues,
        hunger: newHunger
      },
      maxHealth,
      maxHunger
    );

  await Pdata.updatePet(
    pet,
    {
      hunger: newHunger,
      status: newStatus
    }
  );

  // ---------------------------------------------------------
  // تسجيل إنجاز الإطعام
  // ---------------------------------------------------------

  await registerFeedAchievement(
    models,
    userID
  );

  return {
    pet,
    amount,
    oldHunger: currentHunger,
    newHunger,
    maxHunger,
    status: newStatus
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

  // ---------------------------------------------------------
  // الحد الأقصى للصحة
  // ---------------------------------------------------------

  const maxHealth =
    getMaxHealth(pet);

  const currentHealth =
    safeNumber(
      pet.health
    );

  // ---------------------------------------------------------
  // إذا كانت الصحة كاملة
  // ---------------------------------------------------------

  if (
    currentHealth >= maxHealth &&
    pet.status !== STATUS.SICK
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
      amount
    )
  ) {
    throw new Error(
      "INSUFFICIENT_MEDICINE"
    );
  }

  // ---------------------------------------------------------
  // حساب الصحة الجديدة
  // ---------------------------------------------------------

  const addedHealth =
    MEDICINE_HEALTH * amount;

  const newHealth =
    Math.min(
      maxHealth,
      currentHealth + addedHealth
    );

  // ---------------------------------------------------------
  // استهلاك الدواء
  // ---------------------------------------------------------

  await Inventory.useItem(
    currency,
    "medicine",
    amount
  );

  // ---------------------------------------------------------
  // تحديد الحالة الجديدة
  // ---------------------------------------------------------

  const maxHunger =
    getMaxHunger(pet);

  const newStatus =
    calculateStatus(
      {
        ...pet.dataValues,
        health: newHealth,
        status:
          newHealth >= maxHealth
            ? STATUS.NORMAL
            : pet.status
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
      health: newHealth,
      status: newStatus
    }
  );

  // ---------------------------------------------------------
  // تسجيل إنجاز العلاج
  // ---------------------------------------------------------

  await registerHealAchievement(
    models,
    userID
  );

  return {
    pet,
    amount,
    oldHealth: currentHealth,
    newHealth,
    maxHealth,
    status: newStatus
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

  const maxHealth =
    getMaxHealth(pet);

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

  await Inventory.useItem(
    currency,
    "medicine",
    1
  );

  await Pdata.updatePet(
    pet,
    {
      health: maxHealth,
      status: STATUS.NORMAL
    }
  );

  // ---------------------------------------------------------
  // تسجيل إنجاز العلاج
  // ---------------------------------------------------------

  await registerHealAchievement(
    models,
    userID
  );

  return {
    pet,
    health: maxHealth,
    maxHealth,
    status: STATUS.NORMAL
  };
}

// =========================================================
// الحصول على حالة الحيوان
// =========================================================

function getCareStatus(pet) {
  requirePet(pet);

  const maxHealth =
    getMaxHealth(pet);

  const maxHunger =
    getMaxHunger(pet);

  const health =
    safeNumber(
      pet.health
    );

  const hunger =
    safeNumber(
      pet.hunger
    );

  return {
    health,
    maxHealth,

    hunger,
    maxHunger,

    healthPercentage:
      maxHealth > 0
        ? Math.floor(
            (health / maxHealth) * 100
          )
        : 0,

    hungerPercentage:
      maxHunger > 0
        ? Math.floor(
            (hunger / maxHunger) * 100
          )
        : 0,

    status:
      pet.status ||
      STATUS.NORMAL
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
    getCareStatus(pet);

  const bag =
    Inventory.getInventoryData(
      currency
    );

  let message =
    `${CARE_HEADER}\n\n`;

  message +=
    `🐾 ${pet.name || pet.type}\n\n`;

  message +=
    `❤️ الصحة: ${formatNumber(
      status.health
    )}/${formatNumber(
      status.maxHealth
    )}\n`;

  message +=
    `🍗 الجوع: ${formatNumber(
      status.hunger
    )}/${formatNumber(
      status.maxHunger
    )}\n`;

  message +=
    `📊 الحالة: ${status.status}\n\n`;

  message +=
    "━━━━━━━━━━━━━━━━━━\n\n";

  message +=
    `🍖 الطعام: ×${formatNumber(
      bag.food
    )}\n`;

  message +=
    `💊 الدواء: ×${formatNumber(
      bag.medicine
    )}\n\n`;

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
  switch (error.message) {
    case "PET_NOT_FOUND":
      return "❌ لا تملك حيوانًا بعد.";

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
        `📝 ${error.message || "خطأ غير معروف"}`
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
          userID: senderID,
          amount
        });

      return api.sendMessage(
        `${CARE_HEADER}\n\n` +

        "🍖 تمت إطعام الحيوان بنجاح\n\n" +

        `🐾 ${result.pet.name || result.pet.type}\n` +

        `🍖 الطعام المستخدم: ×${formatNumber(
          result.amount
        )}\n` +

        `🍗 الجوع: ${formatNumber(
          result.oldHunger
        )} → ${formatNumber(
          result.newHunger
        )}/${formatNumber(
          result.maxHunger
        )}\n\n` +

        `📊 الحالة: ${result.status}`,

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
          userID: senderID,
          amount
        });

      return api.sendMessage(
        `${CARE_HEADER}\n\n` +

        "💊 تمت معالجة الحيوان بنجاح\n\n" +

        `🐾 ${result.pet.name || result.pet.type}\n` +

        `💊 الدواء المستخدم: ×${formatNumber(
          result.amount
        )}\n` +

        `❤️ الصحة: ${formatNumber(
          result.oldHealth
        )} → ${formatNumber(
          result.newHealth
        )}/${formatNumber(
          result.maxHealth
        )}\n\n` +

        `📊 الحالة: ${result.status}`,

        threadID,
        messageID
      );
    }

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