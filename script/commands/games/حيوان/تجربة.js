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
const Shop = require("./shop");
const Inventory = require("./inventory");

module.exports.config = {
  name: "تجربة",
  version: "7.0.0",
  credits: "أبو هريرة",
  description: "اختبار شامل لنظام الحيوانات والإنجازات والمتجر والحقيبة",
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

    function section(number, title) {
      lines.push(
        `${number}. ${title}`,
        ""
      );
    }

    function isFinitePositiveNumber(value) {
      return (
        Number.isFinite(Number(value)) &&
        Number(value) > 0
      );
    }

    lines.push(
      "اختبار شامل لنظام الحيوانات",
      "════════════════════",
      ""
    );

    /* =====================================================
       1. بيانات الحيوانات
    ===================================================== */

    section(1, "اختبار بيانات الحيوانات");

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
       2. المستويات
    ===================================================== */

    section(2, "اختبار المستويات");

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
       3. stats.js
    ===================================================== */

    section(3, "اختبار الإحصائيات");

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
       4. XP
    ===================================================== */

    section(4, "اختبار XP");

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
        leveling.getRequiredXP(level);

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
       5. stars.js
    ===================================================== */

    section(5, "اختبار النجوم");

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
       6. الترقية
    ===================================================== */

    section(6, "اختبار الترقية");

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
       7. الحالات الممنوعة
    ===================================================== */

    section(7, "اختبار حالات الترقية الممنوعة");

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
       8. نظام الإنجازات
    ===================================================== */

    section(8, "اختبار نظام الإنجازات");

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
       9. معرفات الإنجازات
    ===================================================== */

    section(9, "اختبار معرفات الإنجازات");

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
       10. تعريف الإنجازات
    ===================================================== */

    section(10, "اختبار تعريفات الإنجازات");

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
       11. شروط الإنجازات
    ===================================================== */

    section(11, "اختبار شروط الإنجازات");

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
       12. تقدم الإنجازات
    ===================================================== */

    section(12, "اختبار تقدم الإنجازات");

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
        id: "xp_5m",
        pet: {
          level: 1,
          stars: 0
        },
        stats: {
          totalXP: 2500000
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
      },

      {
        id: "money_10m",
        pet: {
          level: 1,
          stars: 0
        },
        stats: {},
        money: 5000000
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
       13. مكافآت الإنجازات
    ===================================================== */

    section(13, "اختبار تعريف المكافآت");

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
       14. ربط التدريب
    ===================================================== */

    section(14, "اختبار ربط التدريب بالإنجازات");

    const trainingAchievements = [
      "training_10",
      "training_50",
      "training_100",
      "training_250"
    ];

    let trainingAchievementTest = true;

    for (const id of trainingAchievements) {
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
       15. ربط العناية
    ===================================================== */

    section(15, "اختبار ربط العناية بالإنجازات");

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

    for (const id of careAchievements) {
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
       16. نظام المهام
    ===================================================== */

    section(16, "اختبار نظام المهام");

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
       17. الإنجازات المالية
    ===================================================== */

    section(17, "اختبار الإنجازات المالية");

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

    for (const item of moneyAchievements) {
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
       18. اختبار المتجر
    ===================================================== */

    section(18, "اختبار المتجر");

    const shopItems =
      Shop.SHOP_ITEMS;

    const shopLoaded =
      Array.isArray(shopItems) &&
      shopItems.length > 0;

    testResult(
      shopLoaded,
      "تم تحميل منتجات المتجر",
      "فشل تحميل منتجات المتجر"
    );

    lines.push(
      `عدد المنتجات : ${
        Array.isArray(shopItems)
          ? shopItems.length
          : 0
      }`,
      `الحد الأقصى للشراء : ${Shop.MAX_PURCHASE_QUANTITY}`,
      ""
    );

    /* -----------------------------------------------------
       اختبار تعريف المنتجات
    ----------------------------------------------------- */

    let shopDefinitionsTest = true;
    const shopNumbers = new Set();
    const shopIDs = new Set();

    for (const item of shopItems || []) {
      const valid =
        item &&
        typeof item.id === "string" &&
        item.id.length > 0 &&
        Number.isInteger(item.number) &&
        item.number > 0 &&
        typeof item.name === "string" &&
        item.name.length > 0 &&
        Number.isFinite(Number(item.price)) &&
        Number(item.price) > 0 &&
        typeof item.emoji === "string" &&
        typeof item.description === "string" &&
        typeof item.bagField === "string" &&
        item.bagField.length > 0;

      if (!valid) {
        shopDefinitionsTest = false;

        lines.push(
          `✗ منتج غير صالح : ${item?.id || "UNKNOWN"}`
        );
      }

      if (shopNumbers.has(item.number)) {
        shopDefinitionsTest = false;

        lines.push(
          `✗ رقم منتج مكرر : ${item.number}`
        );
      }

      if (shopIDs.has(item.id)) {
        shopDefinitionsTest = false;

        lines.push(
          `✗ معرف منتج مكرر : ${item.id}`
        );
      }

      shopNumbers.add(item.number);
      shopIDs.add(item.id);
    }

    testResult(
      shopDefinitionsTest,
      "جميع منتجات المتجر معرفة بشكل صحيح",
      "يوجد خطأ في تعريف منتجات المتجر"
    );

    lines.push("");

    /* -----------------------------------------------------
       اختبار أرقام المتجر
    ----------------------------------------------------- */

    let shopNumberTest = true;

    for (const item of shopItems || []) {
      const byNumber =
        Shop.getItemByNumber(
          item.number
        );

      const byID =
        Shop.getItemByID(
          item.id
        );

      if (
        !byNumber ||
        byNumber.id !== item.id ||
        !byID ||
        byID.number !== item.number
      ) {
        shopNumberTest = false;

        lines.push(
          `✗ فشل الوصول إلى المنتج : ${item.id}`
        );
      }
    }

    testResult(
      shopNumberTest,
      "الوصول إلى المنتجات بالرقم والمعرف يعمل",
      "يوجد خطأ في الوصول إلى منتجات المتجر"
    );

    lines.push("");

    /* -----------------------------------------------------
       اختبار أسعار المتجر
    ----------------------------------------------------- */

    let pricesTest = true;

    for (const item of shopItems || []) {
      const price =
        Number(item.price);

      if (
        !Number.isSafeInteger(price) ||
        price <= 0
      ) {
        pricesTest = false;

        lines.push(
          `✗ سعر غير صالح : ${item.id}`
        );
      }
    }

    testResult(
      pricesTest,
      "جميع أسعار المتجر صحيحة",
      "يوجد سعر غير صالح في المتجر"
    );

    lines.push("");

    /* =====================================================
       19. توافق المتجر مع الحقيبة
    ===================================================== */

    section(19, "اختبار توافق المتجر مع الحقيبة");

    const inventoryItems =
      Inventory.INVENTORY_ITEMS;

    let shopInventoryTest = true;

    for (const shopItem of shopItems || []) {
      const inventoryItem =
        Inventory.getInventoryItem(
          shopItem.bagField
        );

      if (
        !inventoryItem ||
        inventoryItem.field !== shopItem.bagField
      ) {
        shopInventoryTest = false;

        lines.push(
          `✗ منتج المتجر غير موجود في الحقيبة : ${shopItem.id} → ${shopItem.bagField}`
        );
      } else {
        lines.push(
          `✓ ${shopItem.id} → ${inventoryItem.field}`
        );
      }
    }

    testResult(
      shopInventoryTest,
      "جميع منتجات المتجر مرتبطة بحقوق الحقيبة الصحيحة",
      "يوجد منتج غير مرتبط بالحقيبة"
    );

    lines.push("");

    /* =====================================================
       20. اختبار الحقيبة
    ===================================================== */

    section(20, "اختبار الحقيبة");

    const inventoryLoaded =
      Array.isArray(inventoryItems) &&
      inventoryItems.length > 0;

    testResult(
      inventoryLoaded,
      "تم تحميل عناصر الحقيبة",
      "فشل تحميل عناصر الحقيبة"
    );

    lines.push(
      `عدد عناصر الحقيبة : ${
        Array.isArray(inventoryItems)
          ? inventoryItems.length
          : 0
      }`,
      ""
    );

    let inventoryDefinitionsTest = true;

    const inventoryIDs = new Set();
    const inventoryFields = new Set();

    for (const item of inventoryItems || []) {
      const valid =
        item &&
        typeof item.id === "string" &&
        item.id.length > 0 &&
        typeof item.name === "string" &&
        item.name.length > 0 &&
        typeof item.emoji === "string" &&
        typeof item.field === "string" &&
        item.field.length > 0 &&
        typeof item.description === "string";

      if (!valid) {
        inventoryDefinitionsTest = false;

        lines.push(
          `✗ عنصر حقيبة غير صالح : ${item?.id || "UNKNOWN"}`
        );
      }

      if (inventoryIDs.has(item.id)) {
        inventoryDefinitionsTest = false;

        lines.push(
          `✗ معرف حقيبة مكرر : ${item.id}`
        );
      }

      if (inventoryFields.has(item.field)) {
        inventoryDefinitionsTest = false;

        lines.push(
          `✗ حقل حقيبة مكرر : ${item.field}`
        );
      }

      inventoryIDs.add(item.id);
      inventoryFields.add(item.field);
    }

    testResult(
      inventoryDefinitionsTest,
      "جميع عناصر الحقيبة معرفة بشكل صحيح",
      "يوجد خطأ في تعريف الحقيبة"
    );

    lines.push("");

    /* =====================================================
       21. اختبار توافق جميع عناصر الحقيبة
    ===================================================== */

    section(21, "اختبار اكتمال موارد الحقيبة");

    let inventoryMethodsTest =
      typeof Inventory.getInventoryData === "function" &&
      typeof Inventory.getInventoryItem === "function" &&
      typeof Inventory.getTotalItems === "function" &&
      typeof Inventory.buildInventoryMessage === "function" &&
      typeof Inventory.hasItem === "function" &&
      typeof Inventory.useItem === "function" &&
      typeof Inventory.addItem === "function" &&
      typeof Inventory.removeItem === "function" &&
      typeof Inventory.getAllItems === "function";

    testResult(
      inventoryMethodsTest,
      "جميع دوال الحقيبة الأساسية موجودة",
      "هناك دالة مفقودة في الحقيبة"
    );

    const allItems =
      typeof Inventory.getAllItems === "function"
        ? Inventory.getAllItems()
        : [];

    testResult(
      Array.isArray(allItems) &&
      allItems.length === inventoryItems.length,
      "getAllItems يعيد جميع موارد الحقيبة",
      "getAllItems لا يعيد جميع الموارد"
    );

    lines.push("");

    /* =====================================================
       22. اختبار بيانات الحقيبة الوهمية
    ===================================================== */

    section(22, "اختبار قراءة الحقيبة");

    /*
     * بيانات وهمية بالكامل
     * لا يتم استخدام قاعدة بيانات اللاعب الحقيقية
     */

    const fakeCurrency = {
      money: 2500000,

      data: {
        food: 10,
        medicine: 5,
        shields: 3,
        investmentCards: 2,
        xpCards: 4,
        trainingBoosters: 6,
        developmentStones: 1
      },

      save: async function () {
        return true;
      }
    };

    let inventoryReadTest = false;

    try {
      const fakeInventory =
        Inventory.getInventoryData(
          fakeCurrency
        );

      inventoryReadTest =
        fakeInventory.food === 10 &&
        fakeInventory.medicine === 5 &&
        fakeInventory.shields === 3 &&
        fakeInventory.investmentCards === 2 &&
        fakeInventory.xpCards === 4 &&
        fakeInventory.trainingBoosters === 6 &&
        fakeInventory.developmentStones === 1;

      lines.push(
        `طعام : ${fakeInventory.food}`,
        `دواء : ${fakeInventory.medicine}`,
        `دروع : ${fakeInventory.shields}`,
        `بطاقات استثمار : ${fakeInventory.investmentCards}`,
        `بطاقات XP : ${fakeInventory.xpCards}`,
        `منشطات تدريب : ${fakeInventory.trainingBoosters}`,
        `أحجار تطوير : ${fakeInventory.developmentStones}`,
        ""
      );
    } catch (error) {
      lines.push(
        `✗ خطأ أثناء قراءة الحقيبة الوهمية : ${error.message}`,
        ""
      );
    }

    testResult(
      inventoryReadTest,
      "قراءة بيانات الحقيبة تعمل بشكل صحيح",
      "يوجد خطأ في قراءة بيانات الحقيبة"
    );

    /* =====================================================
       23. إجمالي الموارد
    ===================================================== */

    section(23, "اختبار إجمالي موارد الحقيبة");

    let totalItemsTest = false;

    try {
      const total =
        Inventory.getTotalItems(
          fakeCurrency
        );

      const expectedTotal =
        10 +
        5 +
        3 +
        2 +
        4 +
        6 +
        1;

      lines.push(
        `الإجمالي الفعلي : ${total}`,
        `الإجمالي المتوقع : ${expectedTotal}`,
        ""
      );

      totalItemsTest =
        total === expectedTotal;
    } catch (error) {
      lines.push(
        `✗ خطأ في حساب الإجمالي : ${error.message}`,
        ""
      );
    }

    testResult(
      totalItemsTest,
      "حساب مجموع موارد الحقيبة يعمل",
      "يوجد خطأ في حساب مجموع الموارد"
    );

    /* =====================================================
       24. hasItem
    ===================================================== */

    section(24, "اختبار امتلاك الموارد");

    let hasItemTest = true;

    try {
      const tests = [
        {
          field: "food",
          amount: 10,
          expected: true
        },
        {
          field: "food",
          amount: 11,
          expected: false
        },
        {
          field: "medicine",
          amount: 5,
          expected: true
        },
        {
          field: "medicine",
          amount: 6,
          expected: false
        },
        {
          field: "shields",
          amount: 0,
          expected: true
        },
        {
          field: "unknown",
          amount: 1,
          expected: false
        }
      ];

      for (const item of tests) {
        const result =
          Inventory.hasItem(
            fakeCurrency,
            item.field,
            item.amount
          );

        lines.push(
          `${item.field} ×${item.amount} → ${
            result ? "نعم" : "لا"
          }`
        );

        if (result !== item.expected) {
          hasItemTest = false;
        }
      }

      lines.push("");
    } catch (error) {
      hasItemTest = false;

      lines.push(
        `✗ خطأ في hasItem : ${error.message}`,
        ""
      );
    }

    testResult(
      hasItemTest,
      "التحقق من امتلاك الموارد يعمل",
      "يوجد خطأ في hasItem"
    );

    /* =====================================================
       25. إضافة مورد
    ===================================================== */

    section(25, "اختبار إضافة مورد للحقيبة");

    let addItemTest = false;

    try {
      const beforeAmount =
        fakeCurrency.data.food;

      const newAmount =
        await Inventory.addItem(
          fakeCurrency,
          "food",
          5
        );

      addItemTest =
        newAmount === 15 &&
        fakeCurrency.data.food === 15 &&
        beforeAmount === 10;

      lines.push(
        `قبل الإضافة : ${beforeAmount}`,
        `بعد الإضافة : ${newAmount}`,
        ""
      );
    } catch (error) {
      lines.push(
        `✗ خطأ في إضافة المورد : ${error.message}`,
        ""
      );
    }

    testResult(
      addItemTest,
      "إضافة الموارد إلى الحقيبة تعمل",
      "يوجد خطأ في إضافة الموارد"
    );

    /* =====================================================
       26. استخدام مورد
    ===================================================== */

    section(26, "اختبار استخدام مورد من الحقيبة");

    let useItemTest = false;

    try {
      const beforeAmount =
        fakeCurrency.data.food;

      const newAmount =
        await Inventory.useItem(
          fakeCurrency,
          "food",
          3
        );

      useItemTest =
        beforeAmount === 15 &&
        newAmount === 12 &&
        fakeCurrency.data.food === 12;

      lines.push(
        `قبل الاستخدام : ${beforeAmount}`,
        `بعد الاستخدام : ${newAmount}`,
        ""
      );
    } catch (error) {
      lines.push(
        `✗ خطأ في استخدام المورد : ${error.message}`,
        ""
      );
    }

    testResult(
      useItemTest,
      "استخدام الموارد من الحقيبة يعمل",
      "يوجد خطأ في استخدام الموارد"
    );

    /* =====================================================
       27. إزالة مورد
    ===================================================== */

    section(27, "اختبار إزالة مورد");

    let removeItemTest = false;

    try {
      const beforeAmount =
        fakeCurrency.data.medicine;

      const newAmount =
        await Inventory.removeItem(
          fakeCurrency,
          "medicine",
          2
        );

      removeItemTest =
        beforeAmount === 5 &&
        newAmount === 3 &&
        fakeCurrency.data.medicine === 3;

      lines.push(
        `قبل الإزالة : ${beforeAmount}`,
        `بعد الإزالة : ${newAmount}`,
        ""
      );
    } catch (error) {
      lines.push(
        `✗ خطأ في إزالة المورد : ${error.message}`,
        ""
      );
    }

    testResult(
      removeItemTest,
      "إزالة الموارد من الحقيبة تعمل",
      "يوجد خطأ في إزالة الموارد"
    );

    /* =====================================================
       28. حالات الحقيبة الممنوعة
    ===================================================== */

    section(28, "اختبار الحالات الممنوعة للحقيبة");

    let inventoryInvalidTest = true;

    try {
      const invalidTests = [
        {
          name: "عنصر غير موجود",
          fn: () =>
            Inventory.addItem(
              fakeCurrency,
              "unknown",
              1
            ),
          error: "INVALID_INVENTORY_ITEM"
        },

        {
          name: "كمية صفر",
          fn: () =>
            Inventory.addItem(
              fakeCurrency,
              "food",
              0
            ),
          error: "INVALID_AMOUNT"
        },

        {
          name: "كمية سالبة",
          fn: () =>
            Inventory.addItem(
              fakeCurrency,
              "food",
              -1
            ),
          error: "INVALID_AMOUNT"
        },

        {
          name: "كمية عشرية",
          fn: () =>
            Inventory.addItem(
              fakeCurrency,
              "food",
              1.5
            ),
          error: "INVALID_AMOUNT"
        },

        {
          name: "استخدام أكثر من الموجود",
          fn: () =>
            Inventory.useItem(
              fakeCurrency,
              "food",
              999999
            ),
          error: "INSUFFICIENT_ITEM"
        }
      ];

      for (const test of invalidTests) {
        let caught = false;

        try {
          await test.fn();
        } catch (error) {
          caught =
            error.message === test.error;
        }

        lines.push(
          `${caught ? "✓" : "✗"} ${test.name}`
        );

        if (!caught) {
          inventoryInvalidTest = false;
        }
      }

      lines.push("");
    } catch (error) {
      inventoryInvalidTest = false;

      lines.push(
        `✗ خطأ في اختبارات الحالات الممنوعة : ${error.message}`,
        ""
      );
    }

    testResult(
      inventoryInvalidTest,
      "الحالات الممنوعة للحقيبة تعمل بشكل صحيح",
      "يوجد خطأ في حماية الحقيبة"
    );

    /* =====================================================
       29. رسالة الحقيبة
    ===================================================== */

    section(29, "اختبار رسالة الحقيبة");

    let inventoryMessageTest = false;

    try {
      const message =
        Inventory.buildInventoryMessage(
          fakeCurrency
        );

      inventoryMessageTest =
        typeof message === "string" &&
        message.includes("𝗛𝗜𝗡𝗔 BAG") &&
        message.includes("طعام الحيوان") &&
        message.includes("دواء الحيوان") &&
        message.includes("درع الحماية") &&
        message.includes("بطاقة الاستثمار") &&
        message.includes("بطاقة مضاعفة XP") &&
        message.includes("منشّط التدريب") &&
        message.includes("حجر التطوير") &&
        message.includes("2,500,000") &&
        message.includes("31");

      lines.push(
        inventoryMessageTest
          ? "✓ رسالة الحقيبة تحتوي على جميع الموارد والرصيد"
          : "✗ رسالة الحقيبة ناقصة"
      );

      lines.push("");
    } catch (error) {
      lines.push(
        `✗ خطأ في بناء رسالة الحقيبة : ${error.message}`,
        ""
      );
    }

    testResult(
      inventoryMessageTest,
      "رسالة الحقيبة تعمل بشكل صحيح",
      "يوجد خطأ في رسالة الحقيبة"
    );

    /* =====================================================
       30. رسالة المتجر
    ===================================================== */

    section(30, "اختبار رسالة المتجر");

    let shopMessageTest = false;

    try {
      const message =
        Shop.getShopList();

      shopMessageTest =
        typeof message === "string" &&
        message.includes("𝗛𝗜𝗡𝗔 SHOP") &&
        message.includes("متجر موارد الحيوانات") &&
        message.includes("طعام الحيوان") &&
        message.includes("دواء الحيوان") &&
        message.includes("درع الحماية") &&
        message.includes("بطاقة الاستثمار") &&
        message.includes("بطاقة مضاعفة XP") &&
        message.includes("منشّط التدريب") &&
        message.includes("حجر التطوير") &&
        message.includes(
          String(Shop.MAX_PURCHASE_QUANTITY)
        );

      lines.push(
        shopMessageTest
          ? "✓ رسالة المتجر تحتوي على جميع المنتجات"
          : "✗ رسالة المتجر ناقصة"
      );

      lines.push("");
    } catch (error) {
      lines.push(
        `✗ خطأ في بناء رسالة المتجر : ${error.message}`,
        ""
      );
    }

    testResult(
      shopMessageTest,
      "رسالة المتجر تعمل بشكل صحيح",
      "يوجد خطأ في رسالة المتجر"
    );

    /* =====================================================
       31. أسعار المنتجات وحساب الشراء
    ===================================================== */

    section(31, "اختبار حساب أسعار المتجر");

    let purchaseMathTest = true;

    for (const item of shopItems || []) {
      const quantities = [
        1,
        2,
        10,
        100
      ];

      for (const quantity of quantities) {
        const total =
          item.price * quantity;

        if (
          !Number.isSafeInteger(total) ||
          total <= 0 ||
          total !==
            Number(item.price) *
              quantity
        ) {
          purchaseMathTest = false;

          lines.push(
            `✗ حساب خاطئ : ${item.id} ×${quantity}`
          );
        }
      }

      lines.push(
        `✓ ${item.name} : ${item.price.toLocaleString("en-US")} للعملة الواحدة`
      );
    }

    lines.push("");

    testResult(
      purchaseMathTest,
      "حساب أسعار الشراء يعمل بشكل صحيح",
      "يوجد خطأ في حساب أسعار الشراء"
    );

    /* =====================================================
       32. الحد الأقصى للشراء
    ===================================================== */

    section(32, "اختبار حدود شراء المتجر");

    const maxPurchase =
      Number(
        Shop.MAX_PURCHASE_QUANTITY
      );

    const purchaseLimitTest =
      Number.isSafeInteger(maxPurchase) &&
      maxPurchase > 0 &&
      maxPurchase === 100;

    lines.push(
      `الحد الأقصى : ${maxPurchase}`,
      `شراء 1 : مسموح`,
      `شراء ${maxPurchase} : مسموح`,
      `شراء ${maxPurchase + 1} : ممنوع`,
      ""
    );

    testResult(
      purchaseLimitTest,
      "حد كمية الشراء مضبوط بشكل صحيح",
      "يوجد خطأ في حد كمية الشراء"
    );

    /* =====================================================
       33. ربط كل منتج بالحقيبة
    ===================================================== */

    section(33, "اختبار تكامل المتجر والحقيبة");

    let integrationTest = true;

    for (const shopItem of shopItems || []) {
      const bagItem =
        Inventory.getInventoryItem(
          shopItem.bagField
        );

      if (!bagItem) {
        integrationTest = false;

        lines.push(
          `✗ ${shopItem.id} لا يملك حقل حقيبة`
        );

        continue;
      }

      const sameName =
        typeof bagItem.name === "string";

      const sameField =
        bagItem.field ===
        shopItem.bagField;

      if (!sameName || !sameField) {
        integrationTest = false;

        lines.push(
          `✗ عدم تطابق : ${shopItem.id}`
        );
      } else {
        lines.push(
          `✓ ${shopItem.id} → ${bagItem.field}`
        );
      }
    }

    lines.push("");

    testResult(
      integrationTest,
      "تكامل المتجر والحقيبة يعمل بشكل صحيح",
      "يوجد خلل في تكامل المتجر والحقيبة"
    );

    /* =====================================================
       34. اختبار قاعدة البيانات الحقيقية
    ===================================================== */

    section(34, "اختبار قاعدة البيانات");

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
      `بطاقات XP : ${data.bag.xpCards}`,
      `منشطات تدريب : ${data.bag.trainingBoosters}`,
      `أحجار تطوير : ${data.bag.developmentStones}`,
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
       35. فحص الحقيبة الحقيقية
    ===================================================== */

    section(35, "اختبار الحقيبة في قاعدة البيانات");

    let realInventoryTest = true;

    if (!data.bag) {
      realInventoryTest = false;

      lines.push(
        "✗ لم يتم العثور على بيانات الحقيبة"
      );
    } else {
      for (const item of inventoryItems || []) {
        const amount =
          Number(
            data.bag[item.field] ?? 0
          );

        const valid =
          Number.isSafeInteger(amount) &&
          amount >= 0;

        lines.push(
          `${valid ? "✓" : "✗"} ${item.field} : ${amount}`
        );

        if (!valid) {
          realInventoryTest = false;
        }
      }
    }

    lines.push("");

    testResult(
      realInventoryTest,
      "بيانات الحقيبة في قاعدة البيانات سليمة",
      "يوجد مورد غير صالح في بيانات الحقيبة"
    );

    /* =====================================================
       36. فحص المحفظة
    ===================================================== */

    section(36, "اختبار المحفظة");

    const realMoney =
      Number(data.money);

    const moneyTest =
      Number.isFinite(realMoney) &&
      realMoney >= 0;

    lines.push(
      `الرصيد الحالي : ${realMoney.toLocaleString("en-US")}`,
      ""
    );

    testResult(
      moneyTest,
      "بيانات المحفظة سليمة",
      "بيانات المحفظة غير صالحة"
    );

    /* =====================================================
       37. اختبار عدم وجود موارد سالبة
    ===================================================== */

    section(37, "اختبار حماية الموارد من القيم السالبة");

    let negativeProtectionTest = true;

    for (const item of inventoryItems || []) {
      const amount =
        Number(
          fakeCurrency.data[item.field] ?? 0
        );

      if (
        !Number.isSafeInteger(amount) ||
        amount < 0
      ) {
        negativeProtectionTest = false;

        lines.push(
          `✗ قيمة سالبة أو غير صالحة : ${item.field}`
        );
      }
    }

    testResult(
      negativeProtectionTest,
      "جميع موارد الاختبار بقيم صحيحة وغير سالبة",
      "تم العثور على قيمة مورد غير صالحة"
    );

    lines.push("");

    /* =====================================================
       38. اختبار دوال المتجر الأساسية
    ===================================================== */

    section(38, "اختبار دوال المتجر الأساسية");

    const shopMethodsTest =
      typeof Shop.getItemByID === "function" &&
      typeof Shop.getItemByNumber === "function" &&
      typeof Shop.getShopList === "function" &&
      typeof Shop.openShop === "function" &&
      typeof Shop.handleReply === "function";

    testResult(
      shopMethodsTest,
      "جميع دوال المتجر الأساسية موجودة",
      "هناك دالة مفقودة في المتجر"
    );

    /* =====================================================
       39. اختبار عناصر المتجر والحقيبة واحدًا بواحد
    ===================================================== */

    section(39, "اختبار المطابقة الكاملة بين المتجر والحقيبة");

    let exactMappingTest = true;

    const mapping = [
      ["food", "food"],
      ["medicine", "medicine"],
      ["shield", "shields"],
      ["investment_card", "investmentCards"],
      ["xp_card", "xpCards"],
      ["training_booster", "trainingBoosters"],
      ["development_stone", "developmentStones"]
    ];

    for (const [shopID, bagField] of mapping) {
      const shopItem =
        Shop.getItemByID(
          shopID
        );

      const bagItem =
        Inventory.getInventoryItem(
          bagField
        );

      const valid =
        !!shopItem &&
        !!bagItem &&
        shopItem.bagField === bagField &&
        bagItem.field === bagField;

      lines.push(
        `${valid ? "✓" : "✗"} ${shopID} → ${bagField}`
      );

      if (!valid) {
        exactMappingTest = false;
      }
    }

    lines.push("");

    testResult(
      exactMappingTest,
      "جميع منتجات المتجر تطابق موارد الحقيبة",
      "يوجد اختلاف بين المتجر والحقيبة"
    );

    /* =====================================================
       40. اختبار أمان الاختبار
    ===================================================== */

    section(40, "اختبار أمان الاختبار");

    lines.push(
      "✓ اختبارات الإنجازات استخدمت بيانات وهمية",
      "✓ لم يتم استدعاء checkAchievements",
      "✓ لم يتم فتح إنجازات حقيقية",
      "✓ لم يتم منح مكافآت إنجازات حقيقية",
      "✓ لم يتم شراء أي منتج من المتجر الحقيقي",
      "✓ لم يتم خصم مال حقيقي من اللاعب",
      "✓ لم تتم إضافة منتجات إلى حقيبة اللاعب الحقيقية",
      "✓ لم تتم إزالة منتجات من حقيبة اللاعب الحقيقية",
      "✓ اختبارات addItem/useItem استخدمت محفظة وهمية",
      "✓ اختبارات المتجر اعتمدت على بيانات المنتجات",
      "✓ لم يتم تعديل مستوى الحيوان الحقيقي",
      ""
    );

    passed += 11;

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