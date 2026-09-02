"use strict";

const pets = require("./pets");
const leveling = require("./leveling");
const Pdata = require("./Pdata");

module.exports.config = {
  name: "تجربة",
  version: "1.0.0",
  credits: "أبو هريرة",
  description: "اختبار نظام الحيوانات الجديد",
  commandCategory: "Games",
  hasPermssion: 0,
  usages: "تجربة | تجربة معلومات | تجربة مستوى | تجربة xp | تجربة قاعدة",
  cooldowns: 3
};

module.exports.run = async function ({ api, event, args, models }) {
  const userID = String(event.senderID);
  const subCommand = String(args[0] || "").toLowerCase();

  try {
    /*
     * ==========================================
     * القائمة الرئيسية
     * ==========================================
     */

    if (!subCommand) {
      return api.sendMessage(
        [
          "╭───〔 تجربة نظام الحيوانات 〕───╮",
          "",
          "استخدم أحد الأوامر:",
          "",
          "تجربة معلومات",
          "تجربة مستوى",
          "تجربة xp",
          "تجربة قاعدة",
          "",
          "╰────────────────────╯"
        ].join("\n"),
        event.threadID
      );
    }

    /*
     * ==========================================
     * اختبار pets.js
     * ==========================================
     */

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
        `الصحة الأساسية : ${hedgehog.stats.health}`,
        `القوة الأساسية : ${hedgehog.stats.power}`,
        `الجوع الأقصى : ${hedgehog.stats.maxHunger}`,
        "",
        `الحيوان 39 : ${phoenix.name}`,
        `الندرة : ${phoenix.rarity}`,
        `السعر : ${phoenix.price}`,
        `الصحة الأساسية : ${phoenix.stats.health}`,
        `القوة الأساسية : ${phoenix.stats.power}`,
        `الجوع الأقصى : ${phoenix.stats.maxHunger}`,
        "",
        hedgehog.id === 38 && phoenix.id === 39
          ? "✓ اختبار بيانات الحيوانات ناجح"
          : "✗ يوجد خطأ في IDs",
        "",
        "╰────────────────────╯"
      ];

      return api.sendMessage(
        result.join("\n"),
        event.threadID
      );
    }

    /*
     * ==========================================
     * اختبار leveling.js
     * ==========================================
     */

    if (subCommand === "مستوى") {
      const levels = [1, 2, 10, 29, 30, 50, 100];

      const lines = [
        "╭───〔 اختبار نظام المستويات 〕───╮",
        "",
        "القنفذ:",
        ""
      ];

      for (const level of levels) {
        const stats = leveling.getPetStats(38, level);

        lines.push(
          `لفل ${level}`,
          `القوة : ${stats.power}`,
          `الصحة : ${stats.health}`,
          `الجوع : ${stats.maxHunger}`,
          ""
        );
      }

      lines.push(
        "اختبار الصورة الخاصة:",
        `لفل 29 : ${
          leveling.checkSpecialImage(29) ? "متاحة" : "غير متاحة"
        }`,
        `لفل 30 : ${
          leveling.checkSpecialImage(30) ? "متاحة" : "غير متاحة"
        }`,
        "",
        "╰────────────────────╯"
      );

      return api.sendMessage(
        lines.join("\n"),
        event.threadID
      );
    }

    /*
     * ==========================================
     * اختبار XP
     * ==========================================
     */

    if (subCommand === "xp") {
      const levels = [1, 2, 3, 5, 10, 20, 30, 50, 100];

      const lines = [
        "╭───〔 اختبار XP 〕───╮",
        ""
      ];

      for (const level of levels) {
        const required = leveling.getRequiredXP(level);

        lines.push(
          `لفل ${level} : ${required} XP`
        );
      }

      lines.push(
        "",
        "اختبار تصاعد XP:"
      );

      let increasing = true;
      let previous = 0;

      for (const level of levels) {
        const current = leveling.getRequiredXP(level);

        if (current <= previous) {
          increasing = false;
          break;
        }

        previous = current;
      }

      lines.push(
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

    /*
     * ==========================================
     * اختبار قاعدة البيانات
     * ==========================================
     *
     * مهم:
     * هذا الاختبار يقرأ البيانات فقط.
     * لا يغير الحيوان ولا المال ولا الحقيبة.
     */

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

    /*
     * ==========================================
     * أمر غير معروف
     * ==========================================
     */

    return api.sendMessage(
      [
        "الأمر غير معروف.",
        "",
        "الأوامر المتاحة:",
        "تجربة معلومات",
        "تجربة مستوى",
        "تجربة xp",
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