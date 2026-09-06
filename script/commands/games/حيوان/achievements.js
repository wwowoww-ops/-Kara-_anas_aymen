/**
 * achievements.js
 * نظام إنجازات الحيوانات والمكافآت
 *
 * متوافق مع Pdata.js الحالي
 */

"use strict";

const Pdata = require("./Pdata");
const Leveling = require("./leveling");
const Inventory = require("./inventory");

const MAX_ACHIEVEMENTS_PER_PAGE = 10;

// ======================================================
// Helpers
// ======================================================

function safeNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function formatNumber(value) {
  return safeNumber(value).toLocaleString("en-US");
}

function getUserID(userID) {
  return String(userID);
}

/**
 * تحويل قيم مثل:
 * 100
 * 100k
 * 1m
 * 5m
 * 10m
 * 1b
 */
function parseAchievementTarget(value) {
  const text = String(value)
    .trim()
    .toLowerCase();

  if (text.endsWith("k")) {
    return safeNumber(
      text.slice(0, -1)
    ) * 1000;
  }

  if (text.endsWith("m")) {
    return safeNumber(
      text.slice(0, -1)
    ) * 1000000;
  }

  if (text.endsWith("b")) {
    return safeNumber(
      text.slice(0, -1)
    ) * 1000000000;
  }

  return safeNumber(text);
}

// ======================================================
// Achievement Data
// ======================================================

function getAchievementsData(currency) {
  if (
    !currency ||
    typeof currency !== "object"
  ) {
    return {};
  }

  let data = Pdata.getCurrencyData(currency);

  if (
    !data ||
    typeof data !== "object"
  ) {
    data = {};
  }

  if (
    !data.achievements ||
    typeof data.achievements !== "object"
  ) {
    data.achievements = {};
  }

  return data.achievements;
}

function getAchievementStats(currency) {
  const achievements =
    getAchievementsData(currency);

  if (
    !achievements.stats ||
    typeof achievements.stats !== "object"
  ) {
    achievements.stats = {};
  }

  return achievements.stats;
}

function getUnlockedAchievements(currency) {
  const achievements =
    getAchievementsData(currency);

  if (!Array.isArray(achievements.unlocked)) {
    achievements.unlocked = [];
  }

  return achievements.unlocked;
}

function isUnlocked(
  currency,
  achievementID
) {
  return getUnlockedAchievements(
    currency
  ).includes(achievementID);
}

// ======================================================
// Achievement Definitions
// ======================================================

const ACHIEVEMENTS = [

  // ----------------------------------------------------
  // Level
  // ----------------------------------------------------

  {
    id: "level_5",
    category: "level",
    title: "البداية الحقيقية",
    description: "وصل بحيوانك إلى المستوى 5",

    check: ({ pet }) =>
      safeNumber(pet?.level) >= 5,

    reward: {
      money: 10000,
      xp: 5000
    }
  },

  {
    id: "level_10",
    category: "level",
    title: "متدرب قوي",
    description: "وصل بحيوانك إلى المستوى 10",

    check: ({ pet }) =>
      safeNumber(pet?.level) >= 10,

    reward: {
      money: 25000,
      xp: 10000
    }
  },

  {
    id: "level_20",
    category: "level",
    title: "محترف",
    description: "وصل بحيوانك إلى المستوى 20",

    check: ({ pet }) =>
      safeNumber(pet?.level) >= 20,

    reward: {
      money: 50000,
      xp: 25000
    }
  },

  {
    id: "level_30",
    category: "level",
    title: "نخبة",
    description: "وصل بحيوانك إلى المستوى 30",

    check: ({ pet }) =>
      safeNumber(pet?.level) >= 30,

    reward: {
      money: 100000,
      xp: 50000
    }
  },

  {
    id: "level_40",
    category: "level",
    title: "أسطورة التدريب",
    description: "وصل بحيوانك إلى المستوى 40",

    check: ({ pet }) =>
      safeNumber(pet?.level) >= 40,

    reward: {
      money: 200000,
      xp: 100000
    }
  },

  {
    id: "level_50",
    category: "level",
    title: "قوة هائلة",
    description: "وصل بحيوانك إلى المستوى 50",

    check: ({ pet }) =>
      safeNumber(pet?.level) >= 50,

    reward: {
      money: 350000,
      xp: 150000
    }
  },

  {
    id: "level_60",
    category: "level",
    title: "قمة المستوى",
    description: "وصل بحيوانك إلى المستوى 60",

    check: ({ pet }) =>
      safeNumber(pet?.level) >= 60,

    reward: {
      money: 750000,
      xp: 300000,
      developmentStones: 1
    }
  },

  // ----------------------------------------------------
  // Stars
  // ----------------------------------------------------

  {
    id: "star_1",
    category: "stars",
    title: "الترقية الأولى",
    description: "ارفع حيوانك إلى نجمة واحدة",

    check: ({ pet }) =>
      safeNumber(pet?.stars) >= 1,

    reward: {
      money: 50000,
      xp: 25000
    }
  },

  {
    id: "star_2",
    category: "stars",
    title: "تطور متقدم",
    description: "ارفع حيوانك إلى نجمتين",

    check: ({ pet }) =>
      safeNumber(pet?.stars) >= 2,

    reward: {
      money: 100000,
      xp: 50000
    }
  },

  {
    id: "star_3",
    category: "stars",
    title: "قوة نادرة",
    description: "ارفع حيوانك إلى 3 نجوم",

    check: ({ pet }) =>
      safeNumber(pet?.stars) >= 3,

    reward: {
      money: 200000,
      xp: 100000
    }
  },

  {
    id: "star_4",
    category: "stars",
    title: "قوة أسطورية",
    description: "ارفع حيوانك إلى 4 نجوم",

    check: ({ pet }) =>
      safeNumber(pet?.stars) >= 4,

    reward: {
      money: 400000,
      xp: 200000
    }
  },

  {
    id: "star_5",
    category: "stars",
    title: "إتقان كامل",
    description: "ارفع حيوانك إلى 5 نجوم",

    check: ({ pet }) =>
      safeNumber(pet?.stars) >= 5,

    reward: {
      money: 1000000,
      xp: 500000,
      developmentStones: 3
    }
  },

  // ----------------------------------------------------
  // Training
  // ----------------------------------------------------

  {
    id: "training_10",
    category: "training",
    title: "المتدرب النشيط",
    description: "درّب حيوانك 10 مرات",

    check: ({ stats }) =>
      safeNumber(stats?.training) >= 10,

    reward: {
      money: 25000,
      xp: 15000,
      food: 3
    }
  },

  {
    id: "training_50",
    category: "training",
    title: "مدرب محترف",
    description: "درّب حيوانك 50 مرة",

    check: ({ stats }) =>
      safeNumber(stats?.training) >= 50,

    reward: {
      money: 100000,
      xp: 50000,
      trainingBoosters: 1
    }
  },

  {
    id: "training_100",
    category: "training",
    title: "مدرب أسطوري",
    description: "درّب حيوانك 100 مرة",

    check: ({ stats }) =>
      safeNumber(stats?.training) >= 100,

    reward: {
      money: 250000,
      xp: 125000,
      trainingBoosters: 2
    }
  },

  {
    id: "training_250",
    category: "training",
    title: "آلة تدريب",
    description: "درّب حيوانك 250 مرة",

    check: ({ stats }) =>
      safeNumber(stats?.training) >= 250,

    reward: {
      money: 750000,
      xp: 300000,
      trainingBoosters: 5
    }
  },

  // ----------------------------------------------------
  // Feeding
  // ----------------------------------------------------

  {
    id: "feed_10",
    category: "care",
    title: "مربي مبتدئ",
    description: "أطعم حيوانك 10 مرات",

    check: ({ stats }) =>
      safeNumber(stats?.feed) >= 10,

    reward: {
      money: 15000,
      xp: 5000,
      food: 5
    }
  },

  {
    id: "feed_50",
    category: "care",
    title: "مربي محترف",
    description: "أطعم حيوانك 50 مرة",

    check: ({ stats }) =>
      safeNumber(stats?.feed) >= 50,

    reward: {
      money: 50000,
      xp: 25000,
      food: 10
    }
  },

  {
    id: "feed_100",
    category: "care",
    title: "رعاية ممتازة",
    description: "أطعم حيوانك 100 مرة",

    check: ({ stats }) =>
      safeNumber(stats?.feed) >= 100,

    reward: {
      money: 150000,
      xp: 75000,
      food: 20
    }
  },

  {
    id: "feed_500",
    category: "care",
    title: "مربي استثنائي",
    description: "أطعم حيوانك 500 مرة",

    check: ({ stats }) =>
      safeNumber(stats?.feed) >= 500,

    reward: {
      money: 500000,
      xp: 250000,
      food: 50
    }
  },

  // ----------------------------------------------------
  // Healing
  // ----------------------------------------------------

  {
    id: "heal_10",
    category: "care",
    title: "الطبيب المبتدئ",
    description: "عالج حيوانك 10 مرات",

    check: ({ stats }) =>
      safeNumber(stats?.heal) >= 10,

    reward: {
      money: 20000,
      xp: 7500,
      medicine: 3
    }
  },

  {
    id: "heal_50",
    category: "care",
    title: "الطبيب المحترف",
    description: "عالج حيوانك 50 مرة",

    check: ({ stats }) =>
      safeNumber(stats?.heal) >= 50,

    reward: {
      money: 75000,
      xp: 30000,
      medicine: 10
    }
  },

  {
    id: "heal_100",
    category: "care",
    title: "حامي الحيوانات",
    description: "عالج حيوانك 100 مرة",

    check: ({ stats }) =>
      safeNumber(stats?.heal) >= 100,

    reward: {
      money: 200000,
      xp: 100000,
      medicine: 20
    }
  },

  // ----------------------------------------------------
  // XP
  // ----------------------------------------------------

  {
    id: "xp_100k",
    category: "xp",
    title: "أول مئة ألف",
    description: "اجمع 100,000 XP من خلال نظام اللعبة",

    check: ({ stats }) =>
      safeNumber(stats?.totalXP) >= 100000,

    reward: {
      money: 25000,
      xp: 10000
    }
  },

  {
    id: "xp_500k",
    category: "xp",
    title: "جامع الخبرة",
    description: "اجمع 500,000 XP",

    check: ({ stats }) =>
      safeNumber(stats?.totalXP) >= 500000,

    reward: {
      money: 100000,
      xp: 50000
    }
  },

  {
    id: "xp_1m",
    category: "xp",
    title: "مليون خبرة",
    description: "اجمع 1,000,000 XP",

    check: ({ stats }) =>
      safeNumber(stats?.totalXP) >= 1000000,

    reward: {
      money: 250000,
      xp: 100000,
      xpCards: 1
    }
  },

  {
    id: "xp_5m",
    category: "xp",
    title: "سيد الخبرة",
    description: "اجمع 5,000,000 XP",

    check: ({ stats }) =>
      safeNumber(stats?.totalXP) >= 5000000,

    reward: {
      money: 1000000,
      xp: 500000,
      xpCards: 3
    }
  },

  // ----------------------------------------------------
  // Money
  // ----------------------------------------------------

  {
    id: "money_100k",
    category: "money",
    title: "أول ثروة",
    description: "اجمع 100,000 من العملات",

    check: ({ money }) =>
      safeNumber(money) >= 100000,

    reward: {
      xp: 25000,
      investmentCards: 1
    }
  },

  {
    id: "money_1m",
    category: "money",
    title: "المليون الأول",
    description: "اجمع 1,000,000 من العملات",

    check: ({ money }) =>
      safeNumber(money) >= 1000000,

    reward: {
      xp: 100000,
      investmentCards: 2
    }
  },

  {
    id: "money_10m",
    category: "money",
    title: "ثروة ضخمة",
    description: "اجمع 10,000,000 من العملات",

    check: ({ money }) =>
      safeNumber(money) >= 10000000,

    reward: {
      xp: 500000,
      investmentCards: 5,
      developmentStones: 1
    }
  }
];

// ======================================================
// Find Achievement
// ======================================================

function getAchievement(id) {
  return ACHIEVEMENTS.find(
    achievement =>
      achievement.id === id
  ) || null;
}

function getAchievementsByCategory(category) {
  return ACHIEVEMENTS.filter(
    achievement =>
      achievement.category === category
  );
}

// ======================================================
// Reward Handling
// ======================================================

async function giveReward(
  currency,
  pet,
  reward
) {
  const rewards = [];

  if (
    !reward ||
    typeof reward !== "object"
  ) {
    return rewards;
  }

  // ----------------------------------------------------
  // Money
  // ----------------------------------------------------

  const money =
    safeNumber(reward.money);

  if (money > 0) {
    await Pdata.addMoney(
      currency,
      money
    );

    rewards.push(
      `💰 ${formatNumber(money)} عملة`
    );
  }

  // ----------------------------------------------------
  // XP
  // ----------------------------------------------------

  const xp =
    safeNumber(reward.xp);

  if (
    xp > 0 &&
    pet
  ) {
    const result =
      Leveling.addXP(
        safeNumber(pet.level),
        safeNumber(pet.exp),
        xp,
        pet
      );

    await Pdata.updatePet(
      pet,
      {
        level: result.level,
        exp: result.xp,
        power: result.power,
        health: result.health,
        hunger: result.maxHunger
      }
    );

    rewards.push(
      `⚡ ${formatNumber(xp)} XP`
    );
  }

  // ----------------------------------------------------
  // Items
  // ----------------------------------------------------

  const items = [
    ["food", "🍖", "طعام"],
    ["medicine", "💊", "دواء"],
    ["shields", "🛡️", "درع"],
    ["investmentCards", "🎫", "بطاقة استثمار"],
    ["xpCards", "⚡", "بطاقة XP"],
    ["trainingBoosters", "🧪", "منشط تدريب"],
    ["developmentStones", "💎", "حجر تطوير"]
  ];

  for (
    const [key, emoji, name]
    of items
  ) {
    const amount =
      safeNumber(reward[key]);

    if (amount <= 0) {
      continue;
    }

    await Inventory.addItem(
      currency,
      key,
      amount
    );

    rewards.push(
      `${emoji} ${formatNumber(amount)} ${name}`
    );
  }

  return rewards;
}

// ======================================================
// Save Achievement Data
// ======================================================

async function saveAchievementData(
  currency
) {
  const achievements =
    getAchievementsData(currency);

  await Pdata.updateCurrencyData(
    currency,
    {
      achievements
    }
  );

  return achievements;
}

// ======================================================
// Unlock Achievement
// ======================================================

async function unlockAchievement(
  models,
  userID,
  achievement,
  currency,
  pet = null
) {
  if (!achievement) {
    return null;
  }

  if (!currency) {
    return null;
  }

  if (
    isUnlocked(
      currency,
      achievement.id
    )
  ) {
    return null;
  }

  const unlocked =
    getUnlockedAchievements(
      currency
    );

  unlocked.push(
    achievement.id
  );

  const stats =
    getAchievementStats(
      currency
    );

  stats.unlockedCount =
    unlocked.length;

  stats.lastUnlocked =
    achievement.id;

  stats.lastUnlockedAt =
    Date.now();

  const rewardText =
    await giveReward(
      currency,
      pet,
      achievement.reward
    );

  await saveAchievementData(
    currency
  );

  return {
    achievement,
    rewards: rewardText
  };
}

// ======================================================
// Check All Achievements
// ======================================================

async function checkAchievements(
  models,
  userID
) {
  const uid =
    getUserID(userID);

  const player =
    await Pdata.getPlayerData(
      models,
      uid
    );

  if (!player) {
    return [];
  }

  const currency =
    player.currency;

  if (!currency) {
    return [];
  }

  const pet =
    player.pet;

  const money =
    safeNumber(player.money);

  const stats =
    getAchievementStats(
      currency
    );

  const context = {
    userID: uid,
    pet,
    money,
    stats,
    currency,
    player
  };

  const unlockedNow = [];

  for (
    const achievement
    of ACHIEVEMENTS
  ) {
    if (
      isUnlocked(
        currency,
        achievement.id
      )
    ) {
      continue;
    }

    let completed = false;

    try {
      completed =
        Boolean(
          achievement.check(
            context
          )
        );
    } catch (error) {
      console.error(
        `[ACHIEVEMENT CHECK ERROR] ${achievement.id}`,
        error
      );

      completed = false;
    }

    if (!completed) {
      continue;
    }

    try {
      const result =
        await unlockAchievement(
          models,
          uid,
          achievement,
          currency,
          pet
        );

      if (result) {
        unlockedNow.push(
          result
        );
      }
    } catch (error) {
      console.error(
        `[ACHIEVEMENT UNLOCK ERROR] ${achievement.id}`,
        error
      );
    }
  }

  return unlockedNow;
}

// ======================================================
// Stats
// ======================================================

async function updateStat(
  models,
  userID,
  stat,
  amount = 1
) {
  const PetCurrency =
    Pdata.getPetCurrencyModel(
      models
    );

  const currency =
    await Pdata.getPetCurrency(
      PetCurrency,
      userID
    );

  if (!currency) {
    return [];
  }

  const achievements =
    getAchievementsData(
      currency
    );

  const stats =
    getAchievementStats(
      currency
    );

  stats[stat] =
    safeNumber(stats[stat]) +
    safeNumber(amount);

  achievements.stats =
    stats;

  await Pdata.updateCurrencyData(
    currency,
    {
      achievements
    }
  );

  return checkAchievements(
    models,
    userID
  );
}

// ======================================================
// Register Training
// ======================================================

async function registerTraining(
  models,
  userID,
  xp = 0
) {
  const PetCurrency =
    Pdata.getPetCurrencyModel(
      models
    );

  const currency =
    await Pdata.getPetCurrency(
      PetCurrency,
      userID
    );

  if (!currency) {
    return [];
  }

  const achievements =
    getAchievementsData(
      currency
    );

  const stats =
    getAchievementStats(
      currency
    );

  stats.training =
    safeNumber(stats.training) + 1;

  stats.totalXP =
    safeNumber(stats.totalXP) +
    safeNumber(xp);

  achievements.stats =
    stats;

  await Pdata.updateCurrencyData(
    currency,
    {
      achievements
    }
  );

  return checkAchievements(
    models,
    userID
  );
}

// ======================================================
// Register Feed
// ======================================================

async function registerFeed(
  models,
  userID
) {
  return updateStat(
    models,
    userID,
    "feed",
    1
  );
}

// ======================================================
// Register Heal
// ======================================================

async function registerHeal(
  models,
  userID
) {
  return updateStat(
    models,
    userID,
    "heal",
    1
  );
}

// ======================================================
// Register XP
// ======================================================

async function registerXP(
  models,
  userID,
  amount
) {
  return updateStat(
    models,
    userID,
    "totalXP",
    amount
  );
}

// ======================================================
// Progress
// ======================================================

function getAchievementProgress(
  achievement,
  context
) {
  if (!achievement) {
    return {
      current: 0,
      target: 0,
      percentage: 0
    };
  }

  const id =
    achievement.id;

  let current = 0;
  let target = 0;

  // ----------------------------------------------------
  // Level
  // ----------------------------------------------------

  if (
    id.startsWith("level_")
  ) {
    current =
      safeNumber(
        context.pet?.level
      );

    target =
      parseAchievementTarget(
        id.replace(
          "level_",
          ""
        )
      );
  }

  // ----------------------------------------------------
  // Stars
  // ----------------------------------------------------

  else if (
    id.startsWith("star_")
  ) {
    current =
      safeNumber(
        context.pet?.stars
      );

    target =
      parseAchievementTarget(
        id.replace(
          "star_",
          ""
        )
      );
  }

  // ----------------------------------------------------
  // Training
  // ----------------------------------------------------

  else if (
    id.startsWith("training_")
  ) {
    current =
      safeNumber(
        context.stats?.training
      );

    target =
      parseAchievementTarget(
        id.replace(
          "training_",
          ""
        )
      );
  }

  // ----------------------------------------------------
  // Feeding
  // ----------------------------------------------------

  else if (
    id.startsWith("feed_")
  ) {
    current =
      safeNumber(
        context.stats?.feed
      );

    target =
      parseAchievementTarget(
        id.replace(
          "feed_",
          ""
        )
      );
  }

  // ----------------------------------------------------
  // Healing
  // ----------------------------------------------------

  else if (
    id.startsWith("heal_")
  ) {
    current =
      safeNumber(
        context.stats?.heal
      );

    target =
      parseAchievementTarget(
        id.replace(
          "heal_",
          ""
        )
      );
  }

  // ----------------------------------------------------
  // XP
  // ----------------------------------------------------

  else if (
    id.startsWith("xp_")
  ) {
    current =
      safeNumber(
        context.stats?.totalXP
      );

    target =
      parseAchievementTarget(
        id.replace(
          "xp_",
          ""
        )
      );
  }

  // ----------------------------------------------------
  // Money
  // ----------------------------------------------------

  else if (
    id.startsWith("money_")
  ) {
    current =
      safeNumber(
        context.money
      );

    target =
      parseAchievementTarget(
        id.replace(
          "money_",
          ""
        )
      );
  }

  const percentage =
    target > 0
      ? Math.min(
          100,
          Math.floor(
            (current / target) * 100
          )
        )
      : 0;

  return {
    current,
    target,
    percentage
  };
}

// ======================================================
// Display
// ======================================================

function getCategoryName(
  category
) {
  const names = {
    level: "المستوى",
    stars: "النجوم",
    training: "التدريب",
    care: "العناية",
    xp: "الخبرة",
    money: "المال"
  };

  return (
    names[category] ||
    category
  );
}

function buildRewardText(
  reward
) {
  const parts = [];

  if (
    safeNumber(reward.money) > 0
  ) {
    parts.push(
      `💰 ${formatNumber(
        reward.money
      )}`
    );
  }

  if (
    safeNumber(reward.xp) > 0
  ) {
    parts.push(
      `⚡ ${formatNumber(
        reward.xp
      )} XP`
    );
  }

  const items = [
    ["food", "🍖"],
    ["medicine", "💊"],
    ["shields", "🛡️"],
    ["investmentCards", "🎫"],
    ["xpCards", "⚡"],
    ["trainingBoosters", "🧪"],
    ["developmentStones", "💎"]
  ];

  for (
    const [key, emoji]
    of items
  ) {
    const amount =
      safeNumber(
        reward[key]
      );

    if (amount > 0) {
      parts.push(
        `${emoji} ×${formatNumber(
          amount
        )}`
      );
    }
  }

  return (
    parts.join("  ") ||
    "لا توجد"
  );
}

// ======================================================
// Build Achievements Message
// ======================================================

async function buildAchievementsMessage(
  models,
  userID,
  page = 1
) {
  const player =
    await Pdata.getPlayerData(
      models,
      userID
    );

  if (!player) {
    return (
      "⌬ ━━ 𝗛𝗜𝗡𝗔 ACHIEVEMENTS ━━ ⌬\n\n" +
      "لا توجد بيانات للاعب"
    );
  }

  const currency =
    player.currency || {
      data: {}
    };

  const unlocked =
    getUnlockedAchievements(
      currency
    );

  const stats =
    getAchievementStats(
      currency
    );

  const total =
    ACHIEVEMENTS.length;

  const unlockedCount =
    unlocked.length;

  const maxPage =
    Math.max(
      1,
      Math.ceil(
        total /
        MAX_ACHIEVEMENTS_PER_PAGE
      )
    );

  page = Math.max(
    1,
    Math.min(
      safeNumber(
        page,
        1
      ),
      maxPage
    )
  );

  const start =
    (page - 1) *
    MAX_ACHIEVEMENTS_PER_PAGE;

  const list =
    ACHIEVEMENTS.slice(
      start,
      start +
      MAX_ACHIEVEMENTS_PER_PAGE
    );

  const lines = [];

  lines.push(
    "⌬ ━━ 𝗛𝗜𝗡𝗔 ACHIEVEMENTS ━━ ⌬"
  );

  lines.push("");

  lines.push(
    `✦ الإنجازات : ${unlockedCount}/${total}`
  );

  lines.push(
    `✦ نسبة الإنجاز : ${Math.floor(
      (unlockedCount / total) *
      100
    )}%`
  );

  lines.push(
    `✦ الصفحة : ${page}/${maxPage}`
  );

  lines.push("");

  for (
    const achievement
    of list
  ) {
    const done =
      unlocked.includes(
        achievement.id
      );

    const icon =
      done ? "✓" : "○";

    lines.push(
      `${icon} ${achievement.title}`
    );

    lines.push(
      `   ├ الفئة : ${getCategoryName(
        achievement.category
      )}`
    );

    lines.push(
      `   ├ ${achievement.description}`
    );

    if (done) {
      lines.push(
        `   └ المكافأة : ${buildRewardText(
          achievement.reward
        )}`
      );
    } else {
      const progress =
        getAchievementProgress(
          achievement,
          {
            pet: player.pet,
            money: player.money,
            stats
          }
        );

      if (
        progress.target > 0
      ) {
        lines.push(
          `   └ التقدم : ${formatNumber(
            progress.current
          )}/${formatNumber(
            progress.target
          )} (${progress.percentage}%)`
        );
      } else {
        lines.push(
          `   └ المكافأة : ${buildRewardText(
            achievement.reward
          )}`
        );
      }
    }

    lines.push("");
  }

  return lines.join("\n");
}

// ======================================================
// Command
// ======================================================

async function achievementsCommand({
  api,
  event,
  models,
  args = []
}) {
  const userID =
    getUserID(
      event.senderID
    );

  try {
    await checkAchievements(
      models,
      userID
    );

    const page =
      safeNumber(
        args[0],
        1
      );

    const text =
      await buildAchievementsMessage(
        models,
        userID,
        page
      );

    return api.sendMessage(
      text,
      event.threadID,
      event.messageID
    );

  } catch (error) {
    console.error(
      "[HINA ACHIEVEMENTS ERROR]",
      error
    );

    return api.sendMessage(
      "⌬ ━━ 𝗛𝗜𝗡𝗔 ACHIEVEMENTS ━━ ⌬\n\n" +
      "حدث خطأ أثناء تحميل الإنجازات.",
      event.threadID,
      event.messageID
    );
  }
}

// ======================================================
// Config
// ======================================================

module.exports.config = {
  name: "انجازات",

  aliases: [
    "إنجازات",
    "انجاز",
    "إنجاز",
    "achievements"
  ],

  version: "2.0.0",

  credits: "أبو هريرة",

  description:
    "نظام إنجازات الحيوانات والمكافآت",

  commandCategory: "Games",

  usages:
    "انجازات [رقم الصفحة]",

  cooldowns: 3
};

// ======================================================
// Exports
// ======================================================

module.exports.ACHIEVEMENTS =
  ACHIEVEMENTS;

module.exports.getAchievement =
  getAchievement;

module.exports.getAchievementsByCategory =
  getAchievementsByCategory;

module.exports.getAchievementsData =
  getAchievementsData;

module.exports.getAchievementStats =
  getAchievementStats;

module.exports.getUnlockedAchievements =
  getUnlockedAchievements;

module.exports.isUnlocked =
  isUnlocked;

module.exports.checkAchievements =
  checkAchievements;

module.exports.unlockAchievement =
  unlockAchievement;

module.exports.updateStat =
  updateStat;

module.exports.registerTraining =
  registerTraining;

module.exports.registerFeed =
  registerFeed;

module.exports.registerHeal =
  registerHeal;

module.exports.registerXP =
  registerXP;

module.exports.getAchievementProgress =
  getAchievementProgress;

module.exports.buildAchievementsMessage =
  buildAchievementsMessage;

module.exports.run =
  achievementsCommand;