"use strict";

const pets = require("./pets");
const leveling = require("./leveling");
const Pdata = require("./Pdata");

module.exports.config = {
  name: "تجربة",
  version: "3.0.0",
  credits: "أبو هريرة",
  description: "اختبار نظام الحيوانات الجديد",
  commandCategory: "Games",
  hasPermssion: 0,
  usages: "تجربة",
  cooldowns: 3
};

module.exports.run = async function ({ api, event, models }) {
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

    lines.push(
      "اختبار نظام الحيوانات",
      ""
    );

    /* =========================
       بيانات الحيوانات
    ========================= */

    lines.push(
      "1. اختبار بيانات الحيوانات",
      "",
      `القنفذ : ${hedgehog.name}`,
      `الندرة : ${hedgehog.rarity}`,
      `السعر : ${hedgehog.price}`,
      `الصحة الأساسية : ${hedgehog.baseHealth}`,
      `القوة الأساسية : ${hedgehog.basePower}`,
      `زيادة الصحة : ${hedgehog.growth.health}`,
      `زيادة القوة : ${hedgehog.growth.power}`,
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
      `المستوى الأقصى : ${phoenix.maxLevel}`,
      `النجوم القصوى : ${phoenix.maxStars}`,
      `الصورة الخاصة : لفل ${phoenix.specialImageLevel}`,
      "",
      hedgehog.id === 38 && phoenix.id === 39
        ? "✓ بيانات الحيوانات صحيحة"
        : "✗ خطأ في بيانات الحيوانات",
      ""
    );

    /* =========================
       اختبار المستويات
    ========================= */

    lines.push(
      "2. اختبار المستويات",
      "",
      "القنفذ - 0★",
      ""
    );

    const levels = [0, 1, 10, 29, 30, 59, 60];

    let previousPower = -1;
    let previousHealth = -1;
    let increasing = true;

    for (const level of levels) {
      const stats = leveling.getPetStats(
        hedgehog,
        level,
        0
      );

      if (
        stats.power <= previousPower ||
        stats.health <= previousHealth
      ) {
        increasing = false;
      }

      previousPower = stats.power;
      previousHealth = stats.health;

      lines.push(
        `لفل ${level}`,
        `القوة : ${stats.power}`,
        `الصحة : ${stats.health}`,
        `الجوع : ${stats.maxHunger}`,
        `XP للفل التالي : ${
          level < 60
            ? leveling.getRequiredXP(level)
            : "الحد الأقصى"
        }`,
        ""
      );
    }

    const image59 =
      leveling.checkSpecialImage(hedgehog, 59);

    const image60 =
      leveling.checkSpecialImage(hedgehog, 60);

    lines.push(
      `زيادة القوة والصحة : ${
        increasing ? "✓ صحيحة" : "✗ خطأ"
      }`,
      "",
      "اختبار الصورة الخاصة:",
      `لفل 59 : ${image59 ? "متاحة" : "غير متاحة"}`,
      `لفل 60 : ${image60 ? "متاحة" : "غير متاحة"}`,
      image59 || !image60
        ? "✗ خطأ في مستوى الصورة الخاصة"
        : "✓ الصورة الخاصة تظهر في لفل 60",
      ""
    );

    /* =========================
       اختبار XP
    ========================= */

    lines.push(
      "3. اختبار XP",
      ""
    );

    const xpLevels = [
      0, 1, 2, 5, 10,
      20, 30, 40, 50, 59, 60
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

    lines.push(
      "",
      xpIncreasing
        ? "✓ XP تزداد مع كل مستوى"
        : "✗ يوجد خطأ في XP",
      ""
    );

    /* =========================
       اختبار النجوم
    ========================= */

    lines.push(
      "4. اختبار النجوم",
      ""
    );

    for (let stars = 0; stars <= 5; stars++) {
      const stats = leveling.getPetStats(
        hedgehog,
        60,
        stars
      );

      lines.push(
        `${stars}★ - لفل 60`,
        `المستوى الفعلي : ${stats.effectiveLevel}`,
        `القوة : ${stats.power}`,
        `الصحة : ${stats.health}`,
        `الجوع : ${stats.maxHunger}`,
        `يمكن الترقية : ${
          stats.canPromote ? "نعم" : "لا"
        }`,
        `ختم اللعبة : ${
          stats.isGameCompleted ? "نعم" : "لا"
        }`,
        ""
      );
    }

    lines.push(
      "التسلسل:",
      "0★ → 1★ → 2★ → 3★ → 4★ → 5★",
      "✓ تم اختبار النجوم",
      ""
    );

    /* =========================
       اختبار الترقية
    ========================= */

    lines.push(
      "5. اختبار الترقية",
      ""
    );

    const before = leveling.getPetStats(
      hedgehog,
      60,
      0
    );

    const promotion = leveling.promotePet(
      60,
      0,
      999999,
      hedgehog
    );

    const after = leveling.getPetStats(
      hedgehog,
      promotion.level,
      promotion.stars
    );

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
      `القوة : ${after.power}`,
      `الصحة : ${after.health}`,
      "",
      `الترقية : ${
        promotion.success ? "✓ نجحت" : "✗ فشلت"
      }`,
      `النجمة زادت : ${
        promotion.stars === 1 ? "✓" : "✗"
      }`,
      `المستوى عاد إلى 0 : ${
        promotion.level === 0 ? "✓" : "✗"
      }`,
      `XP عاد إلى 0 : ${
        promotion.xp === 0 ? "✓" : "✗"
      }`,
      `القوة لم تنقص : ${
        after.power >= before.power ? "✓" : "✗"
      }`,
      `الصحة لم تنقص : ${
        after.health >= before.health ? "✓" : "✗"
      }`,
      ""
    );

    /* =========================
       اختبار قاعدة البيانات
    ========================= */

    lines.push(
      "6. اختبار قاعدة البيانات",
      ""
    );

    const data = await Pdata.getPlayerData(
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
      "",
      "✓ تمت قراءة قاعدة البيانات بدون تعديل",
      "",
      "انتهى الاختبار"
    );

    return api.sendMessage(
      lines.join("\n"),
      event.threadID
    );

  } catch (error) {
    console.error("[حيوان/تجربة]", error);

    return api.sendMessage(
      `✗ فشل الاختبار\n${error.message}`,
      event.threadID
    );
  }
};