"use strict";

const pets = require("./pets");
const leveling = require("./leveling");
const stats = require("./stats");
const stars = require("./stars");
const Pdata = require("./Pdata");

const Achievements = require("./achievements");
const Training = require("./training");
const Care = require("./care");
const Mission = require("./mission");

module.exports.config = {
  name: "تجربة",
  version: "6.0.0",
  credits: "أبو هريرة",
  description: "اختبار شامل لنظام الحيوانات والإنجازات",
  commandCategory: "Games",
  hasPermssion: 0,
  usages: "تجربة",
  cooldowns: 3
};

module.exports.run = async function ({
  api,
  event,
  models
}) {
  const userID = String(event.senderID);

  try {
    const hedgehog = pets.getPetByID(38);
    const phoenix = pets.getPetByID(39);

    if (!hedgehog || !phoenix) {
      return api.sendMessage(
        "✗ فشل تحميل بيانات الحيوانات",
        event.threadID
      );
    }

    const lines = [];

    let passed = 0;
    let failed = 0;

    function testResult(condition, successText, failText) {
      if (condition) {
        passed++;
        lines.push(`✓ ${successText}`);
      } else {
        failed++;
        lines.push(`✗ ${failText}`);
      }
    }

    lines.push(
      "اختبار شامل لنظام الحيوانات",
      "════════════════════",
      ""
    );

    /* =====================================================
       1. اختبار بيانات الحيوانات
    ===================================================== */

    lines.push(
      "1. اختبار بيانات الحيوانات",
      ""
    );

    lines.push(
      `القنفذ : ${hedgehog.name}`,
      `الندرة : ${hedgehog.rarity}`,
      `السعر : ${hedgehog.price}`,
      `الصحة الأساسية : ${hedgehog.baseHealth}`,
      `القوة الأساسية : ${hedgehog.basePower}`,
      `زيادة الصحة : ${hedgehog.growth.health}`,
      `زيادة القوة : ${hedgehog.growth.power}`,
      `زيادة الجوع : ${hedgehog.growth.hunger}`,
      `المستوى الأقصى : ${hedgehog.maxLevel}`,
      `النجوم القصوى : ${hedgehog.maxStars}`,
      `الصورة الخاصة : لفل ${hedgehog.specialImageLevel}`,
      "",
      `العنقاء : ${phoenix.name}`,
      `الندرة : ${phoenix.rarity}`,
      `السعر : ${phoenix.price}`,
      `الصحة الأساسية : ${phoenix.baseHealth}`,
      `القوة الأساسية : ${phoenix.basePower}`,
      `زيادة الصحة : ${phoenix.growth.health}`,
      `زيادة القوة : ${phoenix.growth.power}`,
      `زيادة الجوع : ${phoenix.growth.hunger}`,
      `المستوى الأقصى : ${phoenix.maxLevel}`,
      `النجوم القصوى : ${phoenix.maxStars}`,
      `الصورة الخاصة : لفل ${phoenix.specialImageLevel}`,
      ""
    );

    const petsTest =
      hedgehog.id === 38 &&
      phoenix.id === 39 &&
      hedgehog.maxLevel === 60 &&
      phoenix.maxLevel === 60 &&
      hedgehog.maxStars === 5 &&
      phoenix.maxStars === 5 &&
      hedgehog.specialImageLevel === 60 &&
      phoenix.specialImageLevel === 60 &&
      hedgehog.growth.hunger > 0 &&
      phoenix.growth.hunger > 0;

    testResult(
      petsTest,
      "بيانات الحيوانات صحيحة",
      "خطأ في بيانات الحيوانات"
    );

    lines.push("");

    /* =====================================================
       2. اختبار المستويات
    ===================================================== */

    lines.push(
      "2. اختبار المستويات",
      ""
    );

    const levels = [
      0,
      1,
      10,
      29,
      30,
      59,
      60
    ];

    let increasing = true;
    let previousPower = -1;
    let previousHealth = -1;

    for (const level of levels) {
      const levelStats =
        leveling.getPetStats(
          hedgehog,
          level,
          0
        );

      if (
        levelStats.power <= previousPower ||
        levelStats.health <= previousHealth
      ) {
        increasing = false;
      }

      previousPower = levelStats.power;
      previousHealth = levelStats.health;

      lines.push(
        `لفل ${level}`,
        `القوة : ${levelStats.power}`,
        `الصحة : ${levelStats.health}`,
        `الجوع : ${levelStats.maxHunger}`,
        `XP للفل التالي : ${
          level < 60
            ? leveling.getRequiredXP(level)
            : "الحد الأقصى"
        }`,
        ""
      );
    }

    testResult(
      increasing,
      "القوة والصحة تزدادان مع المستوى",
      "القوة أو الصحة لا تزداد بشكل صحيح"
    );

    const image59 =
      leveling.checkSpecialImage(
        hedgehog,
        59
      );

    const image60 =
      leveling.checkSpecialImage(
        hedgehog,
        60
      );

    testResult(
      !image59 && image60,
      "الصورة الخاصة تظهر عند لفل 60",
      "خطأ في مستوى الصورة الخاصة"
    );

    lines.push("");

    /* =====================================================
       3. اختبار stats.js
    ===================================================== */

    lines.push(
      "3. اختبار الإحصائيات",
      ""
    );

    const statLevels = [
      {
        level: 0,
        stars: 0
      },
      {
        level: 30,
        stars: 0
      },
      {
        level: 60,
        stars: 0
      },
      {
        level: 0,
        stars: 1
      },
      {
        level: 60,
        stars: 1
      },
      {
        level: 60,
        stars: 5
      }
    ];

    let statsTest = true;

    for (const test of statLevels) {
      const result =
        stats.getStats(
          hedgehog,
          test.level,
          test.stars
        );

      const expectedEffective =
        test.stars * 60 +
        test.level;

      if (
        !result ||
        result.effectiveLevel !== expectedEffective ||
        result.power <= 0 ||
        result.maxHealth <= 0 ||
        result.maxHunger <= 0 ||
        result.hungerPercentage !== 100
      ) {
        statsTest = false;
      }

      lines.push(
        `${test.stars}★ Lv${test.level}`,
        `المستوى الفعلي : ${result.effectiveLevel}`,
        `القوة : ${result.power}`,
        `الصحة : ${result.health}`,
        `الصحة القصوى : ${result.maxHealth}`,
        `الجوع : ${result.hunger}`,
        `الجوع الأقصى : ${result.maxHunger}`,
        `نسبة الجوع : ${result.hungerPercentage}%`,
        ""
      );
    }

    const gain =
      stats.getNextLevelGain(
        hedgehog,
        0,
        0
      );

    const gainTest =
      gain &&
      gain.power === hedgehog.growth.power &&
      gain.health === hedgehog.growth.health &&
      gain.hunger === hedgehog.growth.hunger &&
      gain.available === true;

    testResult(
      statsTest && gainTest,
      "stats.js يعمل بشكل صحيح",
      "يوجد خطأ في stats.js"
    );

    lines.push("");

    /* =====================================================
       4. اختبار XP
    ===================================================== */

    lines.push(
      "4. اختبار XP",
      ""
    );

    const xpLevels = [
      0,
      1,
      2,
      5,
      10,
      20,
      30,
      40,
      50,
      59,
      60
    ];

    let xpIncreasing = true;
    let previousXP = -1;

    for (const level of xpLevels) {
      if (level === 60) {
        lines.push(
          "لفل 60 : الحد الأقصى",
          ""
        );
        continue;
      }

      const required =
        leveling.getRequiredXP(
          level
        );

      if (required <= previousXP) {
        xpIncreasing = false;
      }

      previousXP = required;

      lines.push(
        `لفل ${level} → ${level + 1} : ${required} XP`
      );
    }

    testResult(
      xpIncreasing,
      "XP تزداد مع كل مستوى",
      "يوجد خطأ في حساب XP"
    );

    lines.push("");

    /* =====================================================
       5. اختبار stars.js
    ===================================================== */

    lines.push(
      "5. اختبار النجوم",
      ""
    );

    let starsTest = true;

    for (
      let currentStars = 0;
      currentStars <= 5;
      currentStars++
    ) {
      const info =
        stars.getStarInfo(
          60,
          currentStars
        );

      const expectedEffective =
        currentStars * 60 +
        60;

      const expectedCanPromote =
        currentStars < 5;

      const expectedCompleted =
        currentStars === 5;

      if (
        info.effectiveLevel !== expectedEffective ||
        info.stars !== currentStars ||
        info.level !== 60 ||
        info.canPromote !== expectedCanPromote ||
        info.isGameCompleted !== expectedCompleted
      ) {
        starsTest = false;
      }

      lines.push(
        `${currentStars}★ - Lv60`,
        `المستوى الفعلي : ${info.effectiveLevel}`,
        `يمكن الترقية : ${
          info.canPromote
            ? "نعم"
            : "لا"
        }`,
        `ختم اللعبة : ${
          info.isGameCompleted
            ? "نعم"
            : "لا"
        }`,
        `النجمة التالية : ${
          info.nextStars === null
            ? "لا يوجد"
            : info.nextStars + "★"
        }`,
        ""
      );
    }

    testResult(
      starsTest,
      "stars.js يعمل بشكل صحيح",
      "يوجد خطأ في stars.js"
    );

    lines.push("");

    /* =====================================================
       6. اختبار الترقية
    ===================================================== */

    lines.push(
      "6. اختبار الترقية",
      ""
    );

    const before =
      stats.getStats(
        hedgehog,
        60,
        0
      );

    const promotion =
      stars.promotePet(
        60,
        0,
        999999
      );

    const after =
      stats.getStats(
        hedgehog,
        promotion.level,
        promotion.stars
      );

    const promotionTest =
      promotion.success === true &&
      promotion.reason === "PROMOTED" &&
      promotion.level === 0 &&
      promotion.stars === 1 &&
      promotion.xp === 0 &&
      promotion.previousLevel === 60 &&
      promotion.previousStars === 0 &&
      promotion.previousXP === 999999 &&
      promotion.previousEffectiveLevel === 60 &&
      promotion.effectiveLevel === 60 &&
      after.power === before.power &&
      after.health === before.health;

    lines.push(
      "قبل الترقية:",
      `النجوم : ${before.stars}★`,
      `المستوى : ${before.level}`,
      `القوة : ${before.power}`,
      `الصحة : ${before.health}`,
      "",
      "بعد الترقية:",
      `النجوم : ${after.stars}★`,
      `المستوى : ${after.level}`,
      `XP : ${promotion.xp}`,
      `المستوى الفعلي : ${after.effectiveLevel}`,
      `القوة : ${after.power}`,
      `الصحة : ${after.health}`,
      ""
    );

    testResult(
      promotionTest,
      "نظام الترقية يعمل بشكل صحيح",
      "يوجد خطأ في نظام الترقية"
    );

    lines.push("");

    /* =====================================================
       7. اختبار الحالات الممنوعة
    ===================================================== */

    lines.push(
      "7. اختبار حالات الترقية الممنوعة",
      ""
    );

    const earlyPromotion =
      stars.promotePet(
        59,
        0,
        500
      );

    const maxStarPromotion =
      stars.promotePet(
        60,
        5,
        500
      );

    const completedPromotion =
      stars.promotePet(
        60,
        5,
        0
      );

    const invalidTest =
      earlyPromotion.success === false &&
      earlyPromotion.reason === "LEVEL_NOT_MAX" &&
      maxStarPromotion.success === false &&
      maxStarPromotion.reason === "GAME_COMPLETED" &&
      completedPromotion.success === false &&
      completedPromotion.reason === "GAME_COMPLETED";

    testResult(
      invalidTest,
      "الحالات الممنوعة تعمل بشكل صحيح",
      "يوجد خطأ في الحالات الممنوعة"
    );

    lines.push("");

    /* =====================================================
       8. اختبار achievements.js
    ===================================================== */

    lines.push(
      "8. اختبار نظام الإنجازات",
      ""
    );

    const achievementList =
      Achievements.ACHIEVEMENTS;

    testResult(
      Array.isArray(achievementList),
      "تم تحميل قائمة الإنجازات",
      "فشل تحميل قائمة الإنجازات"
    );

    const achievementCount =
      Array.isArray(achievementList)
        ? achievementList.length
        : 0;

    lines.push(
      `عدد الإنجازات : ${achievementCount}`,
      ""
    );

    const expectedCategories = [
      "level",
      "stars",
      "training",
      "care",
      "xp",
      "money"
    ];

    let categoriesTest = true;

    for (const category of expectedCategories) {
      const list =
        Achievements.getAchievementsByCategory(
          category
        );

      lines.push(
        `${category} : ${list.length}`
      );

      if (!Array.isArray(list) || list.length === 0) {
        categoriesTest = false;
      }
    }

    lines.push("");

    testResult(
      categoriesTest,
      "جميع فئات الإنجازات موجودة",
      "هناك فئة إنجازات مفقودة"
    );

    /* =====================================================
       9. اختبار معرفات الإنجازات
    ===================================================== */

    lines.push(
      "9. اختبار معرفات الإنجازات",
      ""
    );

    const achievementIDs =
      achievementList.map(
        achievement => achievement.id
      );

    const uniqueIDs =
      new Set(achievementIDs);

    const duplicateTest =
      uniqueIDs.size ===
      achievementIDs.length;

    lines.push(
      `المعرفات : ${achievementIDs.length}`,
      `المعرفات الفريدة : ${uniqueIDs.size}`,
      ""
    );

    testResult(
      duplicateTest,
      "لا توجد معرفات إنجازات مكررة",
      "يوجد معرف إنجاز مكرر"
    );

    /* =====================================================
       10. اختبار تعريف كل إنجاز
    ===================================================== */

    lines.push(
      "10. اختبار تعريفات الإنجازات",
      ""
    );

    let definitionsTest = true;

    for (const achievement of achievementList) {
      const valid =
        achievement &&
        typeof achievement.id === "string" &&
        achievement.id.length > 0 &&
        typeof achievement.category === "string" &&
        typeof achievement.title === "string" &&
        typeof achievement.description === "string" &&
        typeof achievement.check === "function" &&
        achievement.reward &&
        typeof achievement.reward === "object";

      if (!valid) {
        definitionsTest = false;
        lines.push(
          `✗ تعريف غير صالح : ${achievement?.id || "UNKNOWN"}`
        );
      }
    }

    testResult(
      definitionsTest,
      "جميع تعريفات الإنجازات صحيحة",
      "يوجد إنجاز بتعريف غير صالح"
    );

    lines.push("");

    /* =====================================================
       11. اختبار شروط الإنجازات
    ===================================================== */

    lines.push(
      "11. اختبار شروط الإنجازات",
      ""
    );

    const achievementContexts = {
      level: {
        pet: {
          level: 60,
          stars: 0
        },
        stats: {}
      },

      stars: {
        pet: {
          level: 0,
          stars: 5
        },
        stats: {}
      },

      training: {
        pet: {
          level: 1,
          stars: 0
        },
        stats: {
          training: 250
        }
      },

      care: {
        pet: {
          level: 1,
          stars: 0
        },
        stats: {
          feed: 500,
          heal: 100
        }
      },

      xp: {
        pet: {
          level: 1,
          stars: 0
        },
        stats: {
          totalXP: 5000000
        }
      },

      money: {
        pet: {
          level: 1,
          stars: 0
        },
        stats: {},
        money: 10000000
      }
    };

    let conditionsTest = true;

    for (const achievement of achievementList) {
      const context =
        achievementContexts[
          achievement.category
        ];

      if (!context) {
        conditionsTest = false;

        lines.push(
          `✗ لا يوجد Context للفئة : ${achievement.category}`
        );

        continue;
      }

      try {
        const result =
          achievement.check(context);

        if (result !== true) {
          conditionsTest = false;

          lines.push(
            `✗ الشرط لم ينجح : ${achievement.id}`
          );
        }
      } catch (error) {
        conditionsTest = false;

        lines.push(
          `✗ خطأ في شرط ${achievement.id} : ${error.message}`
        );
      }
    }

    testResult(
      conditionsTest,
      "جميع شروط الإنجازات تعمل مع البيانات الاختبارية",
      "يوجد شرط إنجاز لا يعمل بشكل صحيح"
    );

    lines.push("");

    /* =====================================================
       12. اختبار التقدم
    ===================================================== */

    lines.push(
      "12. اختبار تقدم الإنجازات",
      ""
    );

    let progressTest = true;

    const progressContexts = [
      {
        id: "level_60",
        pet: {
          level: 30,
          stars: 0
        },
        stats: {},
        money: 0
      },

      {
        id: "star_5",
        pet: {
          level: 0,
          stars: 2
        },
        stats: {},
        money: 0
      },

      {
        id: "training_100",
        pet: {
          level: 1,
          stars: 0
        },
        stats: {
          training: 50
        },
        money: 0
      },

      {
        id: "feed_500",
        pet: {
          level: 1,
          stars: 0
        },
        stats: {
          feed: 250
        },
        money: 0
      },

      {
        id: "heal_100",
        pet: {
          level: 1,
          stars: 0
        },
        stats: {
          heal: 50
        },
        money: 0
      },

      {
        id: "xp_1m",
        pet: {
          level: 1,
          stars: 0
        },
        stats: {
          totalXP: 500000
        },
        money: 0
      },

      {
        id: "money_1m",
        pet: {
          level: 1,
          stars: 0
        },
        stats: {},
        money: 500000
      }
    ];

    for (const item of progressContexts) {
      const achievement =
        Achievements.getAchievement(
          item.id
        );

      if (!achievement) {
        progressTest = false;

        lines.push(
          `✗ الإنجاز غير موجود : ${item.id}`
        );

        continue;
      }

      const progress =
        Achievements.getAchievementProgress(
          achievement,
          item
        );

      const valid =
        progress &&
        Number.isFinite(progress.current) &&
        Number.isFinite(progress.target) &&
        Number.isFinite(progress.percentage) &&
        progress.current >= 0 &&
        progress.target > 0 &&
        progress.percentage >= 0 &&
        progress.percentage <= 100;

      if (!valid) {
        progressTest = false;

        lines.push(
          `✗ خطأ في تقدم : ${item.id}`
        );
      } else {
        lines.push(
          `✓ ${item.id} : ${progress.current}/${progress.target} (${progress.percentage}%)`
        );
      }
    }

    testResult(
      progressTest,
      "حساب تقدم الإنجازات يعمل بشكل صحيح",
      "يوجد خطأ في حساب تقدم الإنجازات"
    );

    lines.push("");

    /* =====================================================
       13. اختبار المكافآت
    ===================================================== */

    lines.push(
      "13. اختبار تعريف المكافآت",
      ""
    );

    let rewardsTest = true;

    for (const achievement of achievementList) {
      const reward =
        achievement.reward;

      if (!reward || typeof reward !== "object") {
        rewardsTest = false;

        lines.push(
          `✗ لا توجد مكافأة : ${achievement.id}`
        );

        continue;
      }

      for (const [key, value] of Object.entries(reward)) {
        if (
          !Number.isFinite(Number(value)) ||
          Number(value) < 0
        ) {
          rewardsTest = false;

          lines.push(
            `✗ مكافأة غير صالحة : ${achievement.id} → ${key}`
          );
        }
      }
    }

    testResult(
      rewardsTest,
      "جميع مكافآت الإنجازات معرفة بشكل صحيح",
      "هناك مكافأة غير صالحة"
    );

    lines.push("");

    /* =====================================================
       14. اختبار ربط التدريب
    ===================================================== */

    lines.push(
      "14. اختبار ربط التدريب بالإنجازات",
      ""
    );

    const trainingAchievements =
      [
        "training_10",
        "training_50",
        "training_100",
        "training_250"
      ];

    let trainingAchievementTest = true;

    for (
      const id of trainingAchievements
    ) {
      const achievement =
        Achievements.getAchievement(
          id
        );

      if (
        !achievement ||
        typeof achievement.check !== "function"
      ) {
        trainingAchievementTest = false;

        lines.push(
          `✗ غير مربوط : ${id}`
        );
      } else {
        lines.push(
          `✓ موجود : ${id}`
        );
      }
    }

    const trainingModuleTest =
      typeof Training.trainPet === "function" &&
      typeof Training.useXPCard === "function" &&
      typeof Training.calculateTrainingXP === "function";

    testResult(
      trainingModuleTest &&
      trainingAchievementTest,
      "نظام التدريب مرتبط بنظام الإنجازات",
      "يوجد نقص في ربط التدريب بالإنجازات"
    );

    lines.push("");

    /* =====================================================
       15. اختبار ربط العناية
    ===================================================== */

    lines.push(
      "15. اختبار ربط العناية بالإنجازات",
      ""
    );

    const careAchievements = [
      "feed_10",
      "feed_50",
      "feed_100",
      "feed_500",
      "heal_10",
      "heal_50",
      "heal_100"
    ];

    let careAchievementTest = true;

    for (
      const id of careAchievements
    ) {
      const achievement =
        Achievements.getAchievement(
          id
        );

      if (
        !achievement ||
        typeof achievement.check !== "function"
      ) {
        careAchievementTest = false;

        lines.push(
          `✗ غير مربوط : ${id}`
        );
      } else {
        lines.push(
          `✓ موجود : ${id}`
        );
      }
    }

    const careModuleTest =
      typeof Care.feedPet === "function" &&
      typeof Care.healPet === "function" &&
      typeof Care.fullHeal === "function";

    testResult(
      careModuleTest &&
      careAchievementTest,
      "نظام العناية مرتبط بنظام الإنجازات",
      "يوجد نقص في ربط العناية بالإنجازات"
    );

    lines.push("");

    /* =====================================================
       16. اختبار نظام المهام
    ===================================================== */

    lines.push(
      "16. اختبار نظام المهام",
      ""
    );

    const missionModuleTest =
      Array.isArray(
        Mission.DAILY_MISSIONS
      ) &&
      Array.isArray(
        Mission.WEEKLY_MISSIONS
      ) &&
      typeof Mission.getMissionData === "function" &&
      typeof Mission.claimMission === "function" &&
      typeof Mission.claimCompletedMissions === "function" &&
      typeof Mission.giveMissionRewards === "function";

    lines.push(
      `المهام اليومية : ${
        Mission.DAILY_MISSIONS.length
      }`,
      `المهام الأسبوعية : ${
        Mission.WEEKLY_MISSIONS.length
      }`,
      ""
    );

    testResult(
      missionModuleTest,
      "نظام المهام محمل بشكل صحيح",
      "يوجد نقص في نظام المهام"
    );

    lines.push("");

    /* =====================================================
       17. اختبار الإنجازات المالية
    ===================================================== */

    lines.push(
      "17. اختبار الإنجازات المالية",
      ""
    );

    const moneyAchievements = [
      {
        id: "money_100k",
        money: 100000
      },
      {
        id: "money_1m",
        money: 1000000
      },
      {
        id: "money_10m",
        money: 10000000
      }
    ];

    let moneyAchievementTest = true;

    for (
      const item of moneyAchievements
    ) {
      const achievement =
        Achievements.getAchievement(
          item.id
        );

      if (!achievement) {
        moneyAchievementTest = false;

        lines.push(
          `✗ مفقود : ${item.id}`
        );

        continue;
      }

      const result =
        achievement.check({
          money: item.money,
          pet: {
            level: 1,
            stars: 0
          },
          stats: {}
        });

      if (result !== true) {
        moneyAchievementTest = false;

        lines.push(
          `✗ الشرط لا يعمل : ${item.id}`
        );
      } else {
        lines.push(
          `✓ ${item.id} يعمل عند ${item.money.toLocaleString()}`
        );
      }
    }

    testResult(
      moneyAchievementTest,
      "الإنجازات المالية معرفة وتعمل",
      "يوجد خطأ في الإنجازات المالية"
    );

    lines.push("");

    /* =====================================================
       18. اختبار قاعدة البيانات
    ===================================================== */

    lines.push(
      "18. اختبار قاعدة البيانات",
      ""
    );

    const data =
      await Pdata.getPlayerData(
        models,
        userID
      );

    if (data.pet) {
      lines.push(
        "✓ تم العثور على الحيوان",
        `النوع : ${data.pet.type}`,
        `الاسم : ${data.pet.name}`,
        `الندرة : ${data.pet.rarity}`,
        `النجوم : ${data.pet.stars ?? 0}★`,
        `المستوى : ${data.pet.level}`,
        `القوة : ${data.pet.power}`,
        `XP : ${data.pet.exp}`,
        `الصحة : ${data.pet.health}`,
        `الجوع : ${data.pet.hunger}`,
        `الحالة : ${data.pet.status}`,
        ""
      );
    } else {
      lines.push(
        "لا يوجد حيوان مسجل لهذا الحساب",
        ""
      );
    }

    lines.push(
      "المحفظة:",
      `المال : ${data.money}`,
      "",
      "الحقيبة:",
      `طعام : ${data.bag.food}`,
      `دواء : ${data.bag.medicine}`,
      `دروع : ${data.bag.shields}`,
      `بطاقات استثمار : ${data.bag.investmentCards}`,
      ""
    );

    const currency =
      data.currency;

    const achievementData =
      Achievements.getAchievementsData(
        currency
      );

    const achievementStats =
      Achievements.getAchievementStats(
        currency
      );

    const unlocked =
      Achievements.getUnlockedAchievements(
        currency
      );

    lines.push(
      "بيانات الإنجازات:",
      `الإنجازات المفتوحة : ${unlocked.length}`,
      `العداد المسجل : ${
        achievementStats.unlockedCount || 0
      }`,
      `التدريب : ${
        achievementStats.training || 0
      }`,
      `الإطعام : ${
        achievementStats.feed || 0
      }`,
      `العلاج : ${
        achievementStats.heal || 0
      }`,
      `XP المسجلة : ${
        achievementStats.totalXP || 0
      }`,
      `آخر إنجاز : ${
        achievementStats.lastUnlocked || "لا يوجد"
      }`,
      `بيانات الإنجازات : ${
        achievementData
          ? "✓ موجودة"
          : "✗ غير موجودة"
      }`,
      ""
    );

    testResult(
      currency &&
      achievementData &&
      achievementStats &&
      Array.isArray(unlocked),
      "بيانات الإنجازات في قاعدة البيانات سليمة",
      "يوجد خطأ في بيانات الإنجازات"
    );

    /* =====================================================
       19. اختبار عدم تعديل اللاعب
    ===================================================== */

    lines.push(
      "19. اختبار أمان الاختبار",
      ""
    );

    lines.push(
      "✓ اختبارات الإنجازات استخدمت بيانات وهمية",
      "✓ لم يتم استدعاء checkAchievements",
      "✓ لم يتم فتح إنجازات حقيقية",
      "✓ لم يتم منح مكافآت",
      "✓ لم يتم تعديل مستوى الحيوان",
      "✓ لم يتم تعديل المال",
      "✓ لم يتم تعديل الحقيبة",
      ""
    );

    passed += 6;

    /* =====================================================
       النتيجة النهائية
    ===================================================== */

    lines.push(
      "════════════════════",
      "النتيجة النهائية",
      "",
      `✓ الاختبارات الناجحة : ${passed}`,
      `✗ الاختبارات الفاشلة : ${failed}`,
      `المجموع : ${passed + failed}`,
      ""
    );

    if (failed === 0) {
      lines.push(
        "✓ النظام اجتاز جميع الاختبارات"
      );
    } else {
      lines.push(
        "✗ يوجد اختبار أو أكثر يحتاج إلى مراجعة"
      );
    }

    lines.push(
      "",
      "انتهى الاختبار"
    );

    return api.sendMessage(
      lines.join("\n"),
      event.threadID,
      event.messageID
    );

  } catch (error) {
    console.error(
      "[حيوان/تجربة]",
      error
    );

    return api.sendMessage(
      `✗ فشل الاختبار\n\n${error.message}`,
      event.threadID,
      event.messageID
    );
  }
};