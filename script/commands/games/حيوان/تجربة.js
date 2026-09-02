"use strict";

const pets = require("./pets");
const leveling = require("./leveling");
const Pdata = require("./Pdata");

module.exports.config = {
  name: "تجربة",
  version: "2.0.0",
  credits: "أبو هريرة",
  description: "اختبار نظام الحيوانات الجديد",
  commandCategory: "Games",
  hasPermssion: 0,
  usages: "تجربة | تجربة معلومات | تجربة مستوى | تجربة xp | تجربة نجوم | تجربة ترقية | تجربة قاعدة",
  cooldowns: 3
};

module.exports.run = async function ({ api, event, args, models }) {
  const userID = String(event.senderID);
  const subCommand = String(args[0] || "").toLowerCase();

  try {

    /* =====================================================
       القائمة الرئيسية
    ===================================================== */

    if (!subCommand) {
      return api.sendMessage(
        [
          "╭───〔 تجربة نظام الحيوانات 〕───╮",
          "",
          "الأوامر المتاحة:",
          "",
          "تجربة معلومات",
          "تجربة مستوى",
          "تجربة xp",
          "تجربة نجوم",
          "تجربة ترقية",
          "تجربة قاعدة",
          "",
          "╰────────────────────╯"
        ].join("\n"),
        event.threadID
      );
    }

    /* =====================================================
       اختبار بيانات الحيوانات
    ===================================================== */

    if (subCommand === "معلومات") {
      const hedgehog = pets.getPetByID(38);
      const phoenix = pets.getPetByID(39);

      if (!hedgehog || !phoenix) {
        return api.sendMessage(
          "فشل اختبار pets.js\nلم يتم العثور على القنفذ أو العنقاء",
          event.threadID
        );
      }

      const result = [
        "╭───〔 اختبار pets.js 〕───╮",
        "",
        `الحيوان 38 : ${hedgehog.name}`,
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
        `الحيوان 39 : ${phoenix.name}`,
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
          : "✗ يوجد خطأ في IDs",
        "",
        "╰────────────────────╯"
      ];

      return api.sendMessage(
        result.join("\n"),
        event.threadID
      );
    }

    /* =====================================================
       اختبار المستويات
    ===================================================== */

    if (subCommand === "مستوى") {
      const levels = [0, 1, 10, 29, 30, 59, 60];

      const hedgehog = pets.getPetByID(38);

      if (!hedgehog) {
        return api.sendMessage(
          "فشل اختبار نظام المستويات\nلم يتم العثور على القنفذ",
          event.threadID
        );
      }

      const lines = [
        "╭───〔 اختبار نظام المستويات 〕───╮",
        "",
        "القنفذ - 0★",
        ""
      ];

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
          stats.power < previousPower ||
          stats.health < previousHealth
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
          `XP المطلوب : ${leveling.getRequiredXP(level)}`,
          ""
        );
      }

      lines.push(
        increasing
          ? "✓ القوة والصحة تزدادان مع كل مستوى"
          : "✗ يوجد خطأ في زيادة القوة أو الصحة",
        "",
        "اختبار الصورة الخاصة:",
        `لفل 29 : ${
          leveling.checkSpecialImage(hedgehog, 29)
            ? "متاحة"
            : "غير متاحة"
        }`,
        `لفل 30 : ${
          leveling.checkSpecialImage(hedgehog, 30)
            ? "متاحة"
            : "غير متاحة"
        }`,
        "",
        "╰────────────────────╯"
      );

      return api.sendMessage(
        lines.join("\n"),
        event.threadID
      );
    }

    /* =====================================================
       اختبار XP
    ===================================================== */

    if (subCommand === "xp") {
      const levels = [0, 1, 2, 5, 10, 20, 30, 40, 50, 59, 60];

      const lines = [
        "╭───〔 اختبار XP 〕───╮",
        ""
      ];

      let increasing = true;
      let previous = -1;

      for (const level of levels) {
        const required = leveling.getRequiredXP(level);

        lines.push(
          `من لفل ${level} إلى ${level + 1} : ${required} XP`
        );

        if (level < 60 && required <= previous) {
          increasing = false;
        }

        previous = required;
      }

      lines.push(
        "",
        increasing
          ? "✓ XP تزداد مع كل مستوى"
          : "✗ يوجد خطأ في تصاعد XP",
        "",
        "╰────────────────────╯"
      );

      return api.sendMessage(
        lines.join("\n"),
        event.threadID
      );
    }

    /* =====================================================
       اختبار النجوم
    ===================================================== */

    if (subCommand === "نجوم") {
      const hedgehog = pets.getPetByID(38);

      if (!hedgehog) {
        return api.sendMessage(
          "فشل اختبار النجوم\nلم يتم العثور على القنفذ",
          event.threadID
        );
      }

      const lines = [
        "╭───〔 اختبار النجوم 〕───╮",
        ""
      ];

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
        "المفروض:",
        "0★ → 1★ → 2★ → 3★ → 4★ → 5★",
        "",
        "✓ تم اختبار جميع النجوم",
        "",
        "╰────────────────────╯"
      );

      return api.sendMessage(
        lines.join("\n"),
        event.threadID
      );
    }

    /* =====================================================
       اختبار الترقية
    ===================================================== */

    if (subCommand === "ترقية") {
      const hedgehog = pets.getPetByID(38);

      if (!hedgehog) {
        return api.sendMessage(
          "فشل اختبار الترقية\nلم يتم العثور على القنفذ",
          event.threadID
        );
      }

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

      const powerPreserved =
        after.power >= before.power;

      const healthPreserved =
        after.health >= before.health;

      const xpReset =
        promotion.xp === 0;

      const levelReset =
        promotion.level === 0;

      const starIncreased =
        promotion.stars === 1;

      const success =
        promotion.success &&
        powerPreserved &&
        healthPreserved &&
        xpReset &&
        levelReset &&
        starIncreased;

      const lines = [
        "╭───〔 اختبار الترقية 〕───╮",
        "",
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
        `النجمة زادت : ${starIncreased ? "✓" : "✗"}`,
        `المستوى عاد إلى 0 : ${levelReset ? "✓" : "✗"}`,
        `XP عاد إلى 0 : ${xpReset ? "✓" : "✗"}`,
        `القوة لم تنقص : ${powerPreserved ? "✓" : "✗"}`,
        `الصحة لم تنقص : ${healthPreserved ? "✓" : "✗"}`,
        "",
        success
          ? "✓ نظام الترقية يعمل بشكل صحيح"
          : "✗ يوجد خطأ في نظام الترقية",
        "",
        "╰────────────────────╯"
      ];

      return api.sendMessage(
        lines.join("\n"),
        event.threadID
      );
    }

    /* =====================================================
       اختبار قاعدة البيانات
    ===================================================== */

    if (subCommand === "قاعدة") {
      const data = await Pdata.getPlayerData(
        models,
        userID
      );

      const lines = [
        "╭───〔 اختبار قاعدة البيانات 〕───╮",
        ""
      ];

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
        "✓ تم اختبار القراءة من قاعدة البيانات",
        "✓ لم يتم تعديل أي بيانات",
        "",
        "╰────────────────────╯"
      );

      return api.sendMessage(
        lines.join("\n"),
        event.threadID
      );
    }

    /* =====================================================
       أمر غير معروف
    ===================================================== */

    return api.sendMessage(
      [
        "الأمر غير معروف.",
        "",
        "الأوامر المتاحة:",
        "تجربة معلومات",
        "تجربة مستوى",
        "تجربة xp",
        "تجربة نجوم",
        "تجربة ترقية",
        "تجربة قاعدة"
      ].join("\n"),
      event.threadID
    );

  } catch (error) {
    console.error("[حيوان/تجربة]", error);

    return api.sendMessage(
      [
        "╭───〔 فشل الاختبار 〕───╮",
        "",
        "حدث خطأ أثناء الاختبار.",
        "",
        `الخطأ : ${error.message}`,
        "",
        "راجع Console لمعرفة التفاصيل.",
        "",
        "╰────────────────────╯"
      ].join("\n"),
      event.threadID
    );
  }
};