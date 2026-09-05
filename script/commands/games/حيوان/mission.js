"use strict";

const Pdata = require("./Pdata");
const Inventory = require("./inventory");
const Leveling = require("./leveling");

/*
============================================================
 HINA PETS - MISSIONS SYSTEM
 مهام يومية + أسبوعية
============================================================

• المهام مفعلة تلقائيًا
• لا تحتاج إلى قبول
• التقدم يُحسب تلقائيًا
• اليومية تتجدد كل 24 ساعة
• الأسبوعية تتجدد كل 7 أيام
• المكافآت:
  - مال
  - XP للحيوان
  - موارد
  - فرصة للحصول على بطاقة XP ⚡
============================================================
*/

/* =========================================================
   الإعدادات
========================================================= */

const DAILY_DURATION = 24 * 60 * 60 * 1000;
const WEEKLY_DURATION = 7 * 24 * 60 * 60 * 1000;

const LUCKY_CARD_CHANCE = 0.15; // 15%

const XP_CARD_AMOUNT = 100000;

/* =========================================================
   أدوات مساعدة
========================================================= */

function safeNumber(value, fallback = 0) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return number;
}

function normalizeProgress(value) {
  return Math.max(
    0,
    Math.floor(safeNumber(value, 0))
  );
}

function now() {
  return Date.now();
}

function getPeriodStart(timestamp, duration) {
  return Math.floor(timestamp / duration) * duration;
}

function getDailyPeriod() {
  return getPeriodStart(
    now(),
    DAILY_DURATION
  );
}

function getWeeklyPeriod() {
  return getPeriodStart(
    now(),
    WEEKLY_DURATION
  );
}

/* =========================================================
   تعريف المهام
========================================================= */

const DAILY_MISSIONS = [
  {
    id: "daily_train_3",
    type: "train",
    title: "تدريب الحيوان 3 مرات",
    description: "قم بتدريب حيوانك ثلاث مرات",
    target: 3,

    rewards: {
      money: 25000,
      xp: 50000,

      items: {
        food: 5
      }
    }
  },

  {
    id: "daily_feed_5",
    type: "feed",
    title: "إطعام الحيوان 5 مرات",
    description: "قم بإطعام حيوانك خمس مرات",
    target: 5,

    rewards: {
      money: 15000,
      xp: 25000,

      items: {
        food: 5
      }
    }
  },

  {
    id: "daily_heal_3",
    type: "heal",
    title: "علاج الحيوان 3 مرات",
    description: "استخدم الدواء على حيوانك ثلاث مرات",
    target: 3,

    rewards: {
      money: 20000,
      xp: 30000,

      items: {
        medicine: 3
      }
    }
  },

  {
    id: "daily_xp_100k",
    type: "xp",
    title: "اجمع 100,000 XP",
    description: "اكسب 100,000 XP للحيوان",
    target: 100000,

    rewards: {
      money: 30000,
      xp: 50000,

      items: {
        investmentCards: 1
      }
    }
  },

  {
    id: "daily_train_xp",
    type: "trainingXP",
    title: "احصل على 150,000 XP من التدريب",
    description: "اجمع 150,000 XP عن طريق التدريب",
    target: 150000,

    rewards: {
      money: 40000,
      xp: 75000,

      items: {
        trainingBoosters: 1
      }
    }
  }
];

const WEEKLY_MISSIONS = [
  {
    id: "weekly_train_15",
    type: "train",
    title: "تدريب الحيوان 15 مرة",
    description: "قم بتدريب حيوانك 15 مرة",
    target: 15,

    rewards: {
      money: 150000,
      xp: 250000,

      items: {
        food: 20,
        medicine: 5
      }
    }
  },

  {
    id: "weekly_feed_30",
    type: "feed",
    title: "إطعام الحيوان 30 مرة",
    description: "قم بإطعام حيوانك 30 مرة",
    target: 30,

    rewards: {
      money: 100000,
      xp: 150000,

      items: {
        food: 25
      }
    }
  },

  {
    id: "weekly_heal_15",
    type: "heal",
    title: "علاج الحيوان 15 مرة",
    description: "استخدم الدواء 15 مرة",
    target: 15,

    rewards: {
      money: 125000,
      xp: 175000,

      items: {
        medicine: 15
      }
    }
  },

  {
    id: "weekly_xp_1000000",
    type: "xp",
    title: "جمع 1,000,000 XP",
    description: "اجمع مليون XP للحيوان",
    target: 1000000,

    rewards: {
      money: 250000,
      xp: 300000,

      items: {
        developmentStones: 1
      }
    }
  },

  {
    id: "weekly_training_xp",
    type: "trainingXP",
    title: "جمع 1,500,000 XP من التدريب",
    description: "اجمع 1,500,000 XP عن طريق التدريب",
    target: 1500000,

    rewards: {
      money: 350000,
      xp: 500000,

      items: {
        trainingBoosters: 3
      }
    }
  }
];

/* =========================================================
   تخزين بيانات المهام
========================================================= */

function createEmptyMissionData() {
  return {
    daily: {
      period: getDailyPeriod(),
      progress: {},
      claimed: {}
    },

    weekly: {
      period: getWeeklyPeriod(),
      progress: {},
      claimed: {}
    }
  };
}

function normalizeMissionData(data) {
  const base = createEmptyMissionData();

  if (!data || typeof data !== "object") {
    return base;
  }

  if (!data.daily || typeof data.daily !== "object") {
    data.daily = base.daily;
  }

  if (!data.weekly || typeof data.weekly !== "object") {
    data.weekly = base.weekly;
  }

  if (!data.daily.progress) {
    data.daily.progress = {};
  }

  if (!data.daily.claimed) {
    data.daily.claimed = {};
  }

  if (!data.weekly.progress) {
    data.weekly.progress = {};
  }

  if (!data.weekly.claimed) {
    data.weekly.claimed = {};
  }

  return data;
}

/* =========================================================
   الحصول على بيانات المهام
========================================================= */

async function getMissionData(models, userID) {
  const playerData = await Pdata.getPlayerData(
    models,
    userID
  );

  const currency = playerData?.currency;

  const currencyData =
    currency?.data &&
    typeof currency.data === "object"
      ? currency.data
      : {};

  const missions = normalizeMissionData(
    currencyData.missions
  );

  let changed = false;

  /* =======================================================
     تجديد اليومية
  ======================================================= */

  const currentDailyPeriod =
    getDailyPeriod();

  if (
    safeNumber(missions.daily.period, 0) !==
    currentDailyPeriod
  ) {
    missions.daily = {
      period: currentDailyPeriod,
      progress: {},
      claimed: {}
    };

    changed = true;
  }

  /* =======================================================
     تجديد الأسبوعية
  ======================================================= */

  const currentWeeklyPeriod =
    getWeeklyPeriod();

  if (
    safeNumber(missions.weekly.period, 0) !==
    currentWeeklyPeriod
  ) {
    missions.weekly = {
      period: currentWeeklyPeriod,
      progress: {},
      claimed: {}
    };

    changed = true;
  }

  /* =======================================================
     حفظ إذا تغيرت الفترة
  ======================================================= */

  if (changed) {
    currencyData.missions = missions;

    await Pdata.updateCurrencyData(
      models,
      userID,
      currencyData
    );
  }

  return missions;
}

/* =========================================================
   حفظ بيانات المهام
========================================================= */

async function saveMissionData(
  models,
  userID,
  missions
) {
  const playerData = await Pdata.getPlayerData(
    models,
    userID
  );

  const currency = playerData?.currency;

  const currencyData =
    currency?.data &&
    typeof currency.data === "object"
      ? currency.data
      : {};

  currencyData.missions =
    normalizeMissionData(missions);

  return await Pdata.updateCurrencyData(
    models,
    userID,
    currencyData
  );
}

/* =========================================================
   الحصول على المهمة
========================================================= */

function findMission(type, missionID) {
  const list =
    type === "weekly"
      ? WEEKLY_MISSIONS
      : DAILY_MISSIONS;

  return list.find(
    mission => mission.id === missionID
  );
}

/* =========================================================
   تحديث تقدم مهمة
========================================================= */

async function updateMissionProgress(
  models,
  userID,
  action,
  amount = 1
) {
  const missions =
    await getMissionData(
      models,
      userID
    );

  const value = normalizeProgress(
    amount
  );

  if (value <= 0) {
    return missions;
  }

  let changed = false;

  /* =======================================================
     اليومية
  ======================================================= */

  for (const mission of DAILY_MISSIONS) {
    if (mission.type !== action) {
      continue;
    }

    if (missions.daily.claimed[mission.id]) {
      continue;
    }

    const current =
      normalizeProgress(
        missions.daily.progress[
          mission.id
        ]
      );

    const next = Math.min(
      mission.target,
      current + value
    );

    if (next !== current) {
      missions.daily.progress[
        mission.id
      ] = next;

      changed = true;
    }
  }

  /* =======================================================
     الأسبوعية
  ======================================================= */

  for (const mission of WEEKLY_MISSIONS) {
    if (mission.type !== action) {
      continue;
    }

    if (missions.weekly.claimed[mission.id]) {
      continue;
    }

    const current =
      normalizeProgress(
        missions.weekly.progress[
          mission.id
        ]
      );

    const next = Math.min(
      mission.target,
      current + value
    );

    if (next !== current) {
      missions.weekly.progress[
        mission.id
      ] = next;

      changed = true;
    }
  }

  if (changed) {
    await saveMissionData(
      models,
      userID,
      missions
    );
  }

  return missions;
}

/* =========================================================
   تحديث XP
========================================================= */

async function addMissionXP(
  models,
  userID,
  amount,
  fromTraining = false
) {
  const xp = normalizeProgress(
    amount
  );

  if (xp <= 0) {
    return;
  }

  await updateMissionProgress(
    models,
    userID,
    "xp",
    xp
  );

  if (fromTraining) {
    await updateMissionProgress(
      models,
      userID,
      "trainingXP",
      xp
    );
  }
}

/* =========================================================
   أحداث التدريب
========================================================= */

async function registerTraining(
  models,
  userID,
  gainedXP
) {
  await updateMissionProgress(
    models,
    userID,
    "train",
    1
  );

  await addMissionXP(
    models,
    userID,
    gainedXP,
    true
  );
}

/* =========================================================
   حدث الإطعام
========================================================= */

async function registerFeed(
  models,
  userID
) {
  return await updateMissionProgress(
    models,
    userID,
    "feed",
    1
  );
}

/* =========================================================
   حدث العلاج
========================================================= */

async function registerHeal(
  models,
  userID
) {
  return await updateMissionProgress(
    models,
    userID,
    "heal",
    1
  );
}

/* =========================================================
   التحقق من اكتمال المهمة
========================================================= */

function isMissionCompleted(
  missions,
  type,
  mission
) {
  const data =
    type === "weekly"
      ? missions.weekly
      : missions.daily;

  const progress =
    normalizeProgress(
      data.progress[mission.id]
    );

  return progress >= mission.target;
}

/* =========================================================
   مكافأة الحظ
========================================================= */

function rollLuckyCard() {
  return Math.random() <
    LUCKY_CARD_CHANCE;
}

/* =========================================================
   منح المكافآت
========================================================= */

async function giveMissionRewards(
  models,
  userID,
  rewards
) {
  const result = {
    money: 0,
    xp: 0,
    items: {},
    luckyCard: false
  };

  /* =======================================================
     المال
  ======================================================= */

  const money = normalizeProgress(
    rewards?.money
  );

  if (money > 0) {
    await Pdata.addMoney(
      models,
      userID,
      money
    );

    result.money = money;
  }

  /* =======================================================
     XP
  ======================================================= */

  const xp = normalizeProgress(
    rewards?.xp
  );

  if (xp > 0) {
    const playerData =
      await Pdata.getPlayerData(
        models,
        userID
      );

    const pet =
      playerData?.pet;

    if (pet) {
      const currentLevel =
        Leveling.normalizeLevel(
          pet.level,
          pet.type
        );

      const currentXP =
        Leveling.normalizeXP(
          pet.exp
        );

      const levelResult =
        Leveling.addXP(
          currentLevel,
          currentXP,
          xp,
          pet.type
        );

      const newPower =
        Leveling.getPetPower(
          pet.type,
          levelResult.level
        );

      const newHealth =
        Leveling.getPetHealth(
          pet.type,
          levelResult.level
        );

      const maxHunger =
        Leveling.getPetMaxHunger(
          pet.type,
          levelResult.level
        );

      const hunger =
        Math.min(
          maxHunger,
          normalizeProgress(
            pet.hunger
          )
        );

      await Pdata.updatePet(
        models,
        userID,
        {
          level: levelResult.level,
          exp: levelResult.xp,
          power: newPower,
          health: newHealth,
          hunger: hunger,
          maxHunger: maxHunger
        }
      );

      result.xp = xp;
      result.levelsGained =
        levelResult.levelsGained;
    }
  }

  /* =======================================================
     الموارد
  ======================================================= */

  const items =
    rewards?.items || {};

  for (const [
    item,
    amount
  ] of Object.entries(items)) {
    const quantity =
      normalizeProgress(amount);

    if (quantity <= 0) {
      continue;
    }

    await Inventory.addItem(
      models,
      userID,
      item,
      quantity
    );

    result.items[item] =
      quantity;
  }

  /* =======================================================
     بطاقة XP المحظوظة
  ======================================================= */

  if (rollLuckyCard()) {
    await Inventory.addItem(
      models,
      userID,
      "xpCards",
      1
    );

    result.luckyCard = true;
  }

  return result;
}

/* =========================================================
   استلام مكافأة مهمة
========================================================= */

async function claimMission(
  models,
  userID,
  type,
  missionID
) {
  const missions =
    await getMissionData(
      models,
      userID
    );

  const mission =
    findMission(
      type,
      missionID
    );

  if (!mission) {
    return {
      success: false,
      reason: "MISSION_NOT_FOUND",
      message: "المهمة غير موجودة"
    };
  }

  const data =
    type === "weekly"
      ? missions.weekly
      : missions.daily;

  if (data.claimed[mission.id]) {
    return {
      success: false,
      reason: "ALREADY_CLAIMED",
      message: "تم استلام مكافأة هذه المهمة مسبقًا"
    };
  }

  const progress =
    normalizeProgress(
      data.progress[mission.id]
    );

  if (progress < mission.target) {
    return {
      success: false,
      reason: "NOT_COMPLETED",
      progress,
      target: mission.target,
      message:
        `المهمة لم تكتمل بعد\n${progress}/${mission.target}`
    };
  }

  /* =======================================================
     المكافأة
  ======================================================= */

  const rewards =
    await giveMissionRewards(
      models,
      userID,
      mission.rewards
    );

  data.claimed[mission.id] =
    true;

  await saveMissionData(
    models,
    userID,
    missions
  );

  return {
    success: true,

    mission,

    progress,

    rewards,

    message:
      "تم استلام مكافأة المهمة بنجاح"
  };
}

/* =========================================================
   استلام جميع المهام المكتملة
========================================================= */

async function claimCompletedMissions(
  models,
  userID
) {
  const missions =
    await getMissionData(
      models,
      userID
    );

  const results = [];

  for (const type of [
    "daily",
    "weekly"
  ]) {
    const list =
      type === "weekly"
        ? WEEKLY_MISSIONS
        : DAILY_MISSIONS;

    const data =
      type === "weekly"
        ? missions.weekly
        : missions.daily;

    for (const mission of list) {
      if (
        data.claimed[
          mission.id
        ]
      ) {
        continue;
      }

      const progress =
        normalizeProgress(
          data.progress[
            mission.id
          ]
        );

      if (
        progress >=
        mission.target
      ) {
        const result =
          await claimMission(
            models,
            userID,
            type,
            mission.id
          );

        if (result.success) {
          results.push(result);
        }
      }
    }
  }

  return results;
}

/* =========================================================
   عرض المهام
========================================================= */

function formatReward(rewards) {
  const parts = [];

  if (rewards?.money) {
    parts.push(
      `💰 +${rewards.money.toLocaleString()}`
    );
  }

  if (rewards?.xp) {
    parts.push(
      `⚡ +${rewards.xp.toLocaleString()} XP`
    );
  }

  const items =
    rewards?.items || {};

  const itemNames = {
    food: "🍖",
    medicine: "💊",
    shields: "🛡️",
    investmentCards: "🎫",
    xpCards: "⚡",
    trainingBoosters: "🧪",
    developmentStones: "💎"
  };

  for (const [
    item,
    amount
  ] of Object.entries(items)) {
    if (
      safeNumber(amount) > 0
    ) {
      parts.push(
        `${itemNames[item] || item} ×${amount}`
      );
    }
  }

  return parts.join(" + ");
}

function formatMission(
  mission,
  progress,
  claimed
) {
  const completed =
    progress >= mission.target;

  let status = "";

  if (claimed) {
    status = " ✓ مستلمة";
  } else if (completed) {
    status = " ✓ مكتملة";
  }

  return (
    `\n${mission.title}${status}` +
    `\nالتقدم : ${progress.toLocaleString()}/${mission.target.toLocaleString()}` +
    `\nالمكافأة : ${formatReward(mission.rewards)}\n`
  );
}

/* =========================================================
   بناء رسالة المهام
========================================================= */

function buildMissionsMessage(
  missions
) {
  let message =
    "⌬ ━━ 𝗛𝗜𝗡𝗔 MISSIONS ━━ ⌬\n\n";

  /* =======================================================
     اليومية
  ======================================================= */

  message +=
    "✦ المهام اليومية\n";

  for (const mission of DAILY_MISSIONS) {
    const progress =
      normalizeProgress(
        missions.daily.progress[
          mission.id
        ]
      );

    const claimed =
      Boolean(
        missions.daily.claimed[
          mission.id
        ]
      );

    message += formatMission(
      mission,
      progress,
      claimed
    );
  }

  /* =======================================================
     الأسبوعية
  ======================================================= */

  message +=
    "\n✦ المهام الأسبوعية\n";

  for (const mission of WEEKLY_MISSIONS) {
    const progress =
      normalizeProgress(
        missions.weekly.progress[
          mission.id
        ]
      );

    const claimed =
      Boolean(
        missions.weekly.claimed[
          mission.id
        ]
      );

    message += formatMission(
      mission,
      progress,
      claimed
    );
  }

  message +=
    "\n✦ جميع المهام مفعلة تلقائيًا";

  message +=
    "\n✦ أكمل المهمة ثم استخدم استلام للحصول على المكافأة";

  message +=
    "\n✦ هناك فرصة للحصول على بطاقة XP ⚡ كمكافأة حظ";

  return message;
}

/* =========================================================
   معلومات المهام
========================================================= */

async function getMissions(
  models,
  userID
) {
  const missions =
    await getMissionData(
      models,
      userID
    );

  return {
    daily: DAILY_MISSIONS.map(
      mission => ({
        ...mission,

        progress:
          normalizeProgress(
            missions.daily.progress[
              mission.id
            ]
          ),

        claimed:
          Boolean(
            missions.daily.claimed[
              mission.id
            ]
          )
      })
    ),

    weekly: WEEKLY_MISSIONS.map(
      mission => ({
        ...mission,

        progress:
          normalizeProgress(
            missions.weekly.progress[
              mission.id
            ]
          ),

        claimed:
          Boolean(
            missions.weekly.claimed[
              mission.id
            ]
          )
      })
    ),

    periods: {
      daily:
        missions.daily.period,

      weekly:
        missions.weekly.period
    }
  };
}

/* =========================================================
   أمر المهام
========================================================= */

async function missionsCommand({
  models,
  userID,
  action = "status",
  missionType,
  missionID
}) {
  const normalizedAction =
    String(
      action || "status"
    )
      .trim()
      .toLowerCase();

  /* =======================================================
     عرض المهام
  ======================================================= */

  if (
    normalizedAction === "status" ||
    normalizedAction === "حالة" ||
    normalizedAction === "مهام"
  ) {
    const missions =
      await getMissionData(
        models,
        userID
      );

    return {
      success: true,

      missions,

      message:
        buildMissionsMessage(
          missions
        )
    };
  }

  /* =======================================================
     استلام مهمة واحدة
  ======================================================= */

  if (
    normalizedAction === "استلام" ||
    normalizedAction === "claim"
  ) {
    if (
      !missionType ||
      !missionID
    ) {
      return {
        success: false,
        reason: "MISSING_MISSION",
        message:
          "حدد نوع المهمة ورقمها"
      };
    }

    return await claimMission(
      models,
      userID,
      missionType,
      missionID
    );
  }

  /* =======================================================
     استلام كل المكتمل
  ======================================================= */

  if (
    normalizedAction === "استلام الكل" ||
    normalizedAction === "claimall"
  ) {
    const results =
      await claimCompletedMissions(
        models,
        userID
      );

    return {
      success: true,
      results,

      count:
        results.length,

      message:
        results.length > 0
          ? `تم استلام ${results.length} مكافأة`
          : "لا توجد مهام مكتملة لاستلامها"
    };
  }

  return {
    success: false,
    reason: "INVALID_ACTION",

    message:
      "الأوامر المتاحة:\n" +
      "مهام\n" +
      "استلام\n" +
      "استلام الكل"
  };
}

/* =========================================================
   التصدير
========================================================= */

module.exports = {
  DAILY_DURATION,
  WEEKLY_DURATION,

  LUCKY_CARD_CHANCE,
  XP_CARD_AMOUNT,

  DAILY_MISSIONS,
  WEEKLY_MISSIONS,

  createEmptyMissionData,
  normalizeMissionData,

  getMissionData,
  saveMissionData,

  findMission,

  updateMissionProgress,
  addMissionXP,

  registerTraining,
  registerFeed,
  registerHeal,

  isMissionCompleted,

  rollLuckyCard,
  giveMissionRewards,

  claimMission,
  claimCompletedMissions,

  formatReward,
  formatMission,
  buildMissionsMessage,

  getMissions,
  missionsCommand
};