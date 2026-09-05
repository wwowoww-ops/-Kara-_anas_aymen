/**
 * leaderboard.js
 * نظام تصدر الحيوانات
 *
 * 1 = القوة + النجوم + المستوى
 * 2 = الرصيد
 *
 * أعلى 10 فقط
 * المطور مستثنى من الترتيب ويظهر أسفل القائمة
 */

"use strict";

const Pdata = require("./Pdata");
const PetsData = require("./pets");

const DEVELOPER_ID = "61592700121061";
const TOP_LIMIT = 10;

/* =========================================================
   أدوات عامة
========================================================= */

function getModel(models, name) {
  if (!models) {
    throw new Error("Database models are required");
  }

  if (typeof models.use === "function") {
    const model = models.use(name);

    if (model) {
      return model;
    }
  }

  if (models[name]) {
    return models[name];
  }

  throw new Error(`${name} model not found`);
}

function formatNumber(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "0";
  }

  return Math.floor(number).toLocaleString("en-US");
}

function getStars(stars) {
  const value = Math.max(
    0,
    Math.min(5, Number(stars) || 0)
  );

  return value > 0
    ? "⭐".repeat(value)
    : "—";
}

/* =========================================================
   اسم المستخدم
========================================================= */

const nameCache = new Map();

async function getUserName(api, Users, userID) {
  const uid = String(userID);

  if (nameCache.has(uid)) {
    return nameCache.get(uid);
  }

  /*
   * المصدر الأساسي:
   * قاعدة البيانات Users
   */
  if (Users) {
    try {
      const user = await Users.findOne({
        where: {
          userID: uid
        }
      });

      if (
        user &&
        typeof user.name === "string" &&
        user.name.trim()
      ) {
        const name = user.name.trim();

        nameCache.set(uid, name);

        return name;
      }
    } catch (error) {
      console.error(
        "[PET LEADERBOARD USERS NAME ERROR]",
        error
      );
    }
  }

  /*
   * احتياط فقط إذا لم يوجد الاسم في قاعدة البيانات
   */
  if (
    api &&
    typeof api.getUserInfo === "function"
  ) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const info = await new Promise(resolve => {
          api.getUserInfo(
            uid,
            (error, result) => {
              if (error || !result) {
                resolve(null);
                return;
              }

              resolve(result);
            }
          );
        });

        const user = info && info[uid];

        if (
          user &&
          typeof user.name === "string" &&
          user.name.trim()
        ) {
          const name = user.name.trim();

          nameCache.set(uid, name);

          return name;
        }
      } catch (error) {
        console.error(
          `[PET LEADERBOARD USER INFO ERROR] محاولة ${attempt + 1}:`,
          error
        );
      }

      if (attempt < 2) {
        await new Promise(resolve =>
          setTimeout(resolve, 700)
        );
      }
    }
  }

  return `مستخدم (${uid})`;
}

/* =========================================================
   إيموجي الحيوان
========================================================= */

function getPetEmoji(pet) {
  if (!pet) {
    return "🐾";
  }

  try {
    const petData =
      PetsData.getPetByType(pet.type);

    if (
      petData &&
      petData.emoji
    ) {
      return petData.emoji;
    }
  } catch (error) {
    console.error(
      "[PET LEADERBOARD EMOJI ERROR]",
      error
    );
  }

  return "🐾";
}

/* =========================================================
   اسم الحيوان
========================================================= */

function getPetName(pet) {
  if (!pet) {
    return "حيوان";
  }

  if (
    pet.name &&
    String(pet.name).trim()
  ) {
    return String(pet.name).trim();
  }

  try {
    const petData =
      PetsData.getPetByType(pet.type);

    if (
      petData &&
      petData.name
    ) {
      return petData.name;
    }
  } catch {}

  return "حيوان";
}

/* =========================================================
   قائمة القوة
========================================================= */

async function buildPowerLeaderboard(
  api,
  Pets,
  PetCurrency,
  Users
) {
  const pets = await Pets.findAll();

  if (!pets || !pets.length) {
    return (
      "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗢𝗪𝗘𝗥 𝗥𝗔𝗡𝗞 ━━ ⌬\n\n" +
      "لا توجد حيوانات في التصدر حاليًا."
    );
  }

  /*
   * المطور لا يدخل في الترتيب
   */
  const developer =
    pets.find(
      pet =>
        String(pet.userID) ===
        DEVELOPER_ID
    );

  const players =
    pets.filter(
      pet =>
        String(pet.userID) !==
        DEVELOPER_ID
    );

  /*
   * الترتيب:
   * القوة أولًا
   * ثم النجوم
   * ثم المستوى
   */
  players.sort((a, b) => {
    const powerA =
      Number(a.power) || 0;

    const powerB =
      Number(b.power) || 0;

    if (powerA !== powerB) {
      return powerB - powerA;
    }

    const starsA =
      Number(a.stars) || 0;

    const starsB =
      Number(b.stars) || 0;

    if (starsA !== starsB) {
      return starsB - starsA;
    }

    const levelA =
      Number(a.level) || 0;

    const levelB =
      Number(b.level) || 0;

    return levelB - levelA;
  });

  const top =
    players.slice(0, TOP_LIMIT);

  let message =
    "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗢𝗪𝗘𝗥 𝗥𝗔𝗡𝗞 ━━ ⌬\n\n";

  message +=
    "🏆 أعلى 10 لاعبين\n\n";

  for (
    let i = 0;
    i < top.length;
    i++
  ) {
    const pet = top[i];

    const userID =
      String(pet.userID);

    const name =
      await getUserName(
        api,
        Users,
        userID
      );

    const emoji =
      getPetEmoji(pet);

    const petName =
      getPetName(pet);

    const power =
      Number(pet.power) || 0;

    const level =
      Number(pet.level) || 0;

    const stars =
      Number(pet.stars) || 0;

    message +=
      `${i + 1}. ${name}\n` +
      `${emoji} ${petName}\n` +
      `💪 القوة : ${formatNumber(power)}\n` +
      `⭐ المستوى : ${level}\n` +
      `✦ النجوم : ${getStars(stars)}\n\n`;
  }

  /*
   * المطور يظهر أسفل القائمة
   */
  if (developer) {
    const developerName =
      await getUserName(
        api,
        Users,
        DEVELOPER_ID
      );

    message +=
      "━━━━━━━━━━━━━━\n\n" +
      "♛ المطور\n" +
      `${developerName}\n` +
      `${getPetEmoji(developer)} ${getPetName(developer)}\n` +
      `💪 القوة : ${formatNumber(developer.power)}\n` +
      `⭐ المستوى : ${Number(developer.level) || 0}\n` +
      `✦ النجوم : ${getStars(developer.stars)}`;
  }

  return message.trim();
}

/* =========================================================
   قائمة الرصيد
========================================================= */

async function buildMoneyLeaderboard(
  api,
  Pets,
  PetCurrency,
  Users
) {
  const currencies =
    await PetCurrency.findAll();

  if (
    !currencies ||
    !currencies.length
  ) {
    return (
      "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗠𝗢𝗡𝗘𝗬 𝗥𝗔𝗡𝗞 ━━ ⌬\n\n" +
      "لا توجد أرصدة في التصدر حاليًا."
    );
  }

  /*
   * المطور خارج المراكز
   */
  const developer =
    currencies.find(
      currency =>
        String(currency.userID) ===
        DEVELOPER_ID
    );

  const players =
    currencies.filter(
      currency =>
        String(currency.userID) !==
        DEVELOPER_ID
    );

  players.sort((a, b) => {
    const moneyA =
      Number(a.money) || 0;

    const moneyB =
      Number(b.money) || 0;

    return moneyB - moneyA;
  });

  const top =
    players.slice(0, TOP_LIMIT);

  let message =
    "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗠𝗢𝗡𝗘𝗬 𝗥𝗔𝗡𝗞 ━━ ⌬\n\n";

  message +=
    "🏆 أعلى 10 أرصدة\n\n";

  for (
    let i = 0;
    i < top.length;
    i++
  ) {
    const currency =
      top[i];

    const userID =
      String(currency.userID);

    const name =
      await getUserName(
        api,
        Users,
        userID
      );

    const money =
      Number(currency.money) || 0;

    message +=
      `${i + 1}. ${name}\n` +
      `💰 الرصيد : ${formatNumber(money)}\n\n`;
  }

  /*
   * المطور أسفل القائمة
   */
  if (developer) {
    const developerName =
      await getUserName(
        api,
        Users,
        DEVELOPER_ID
      );

    const developerMoney =
      Number(developer.money) || 0;

    message +=
      "━━━━━━━━━━━━━━\n\n" +
      "♛ المطور\n" +
      `${developerName}\n` +
      `💰 الرصيد : ${formatNumber(developerMoney)}`;
  }

  return message.trim();
}

/* =========================================================
   القائمة الرئيسية
========================================================= */

function getLeaderboardMenu() {
  return (
    "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗥𝗔𝗡𝗞 ━━ ⌬\n\n" +
    "اختر قائمة التصدر:\n\n" +
    "1. القوة والنجوم والمستوى\n" +
    "2. الرصيد\n\n" +
    "↪ قم بالرد على هذه الرسالة بالرقم"
  );
}

/* =========================================================
   اختيار القائمة
========================================================= */

async function getLeaderboard(
  api,
  Pets,
  PetCurrency,
  Users,
  type = null
) {
  if (!type) {
    return getLeaderboardMenu();
  }

  if (type === "power") {
    return await buildPowerLeaderboard(
      api,
      Pets,
      PetCurrency,
      Users
    );
  }

  if (type === "money") {
    return await buildMoneyLeaderboard(
      api,
      Pets,
      PetCurrency,
      Users
    );
  }

  return getLeaderboardMenu();
}

/* =========================================================
   CONFIG
========================================================= */

module.exports.config = {
  name: "حيوان",
  version: "1.0.0",
  credits: "أبو هريرة",
  description: "قوائم تصدر الحيوانات والرصيد",
  commandCategory: "Games",
  hasPermssion: 0,
  usages: "حيوان تصدر",
  cooldowns: 3
};

/* =========================================================
   RUN
========================================================= */

module.exports.run = async function ({
  api,
  event,
  models,
  args
}) {
  const {
    threadID,
    messageID,
    senderID
  } = event;

  try {
    const lower =
      Array.isArray(args)
        ? args
            .join(" ")
            .trim()
            .toLowerCase()
        : "";

    if (
      lower !== "تصدر" &&
      lower !== "تصدّر" &&
      lower !== "leaderboard"
    ) {
      return;
    }

    const Pets =
      getModel(
        models,
        "Pets"
      );

    const PetCurrency =
      getModel(
        models,
        "PetCurrency"
      );

    const Users =
      getModel(
        models,
        "Users"
      );

    const text =
      await getLeaderboard(
        api,
        Pets,
        PetCurrency,
        Users
      );

    const sent =
      await new Promise(resolve => {
        api.sendMessage(
          text,
          threadID,
          (error, info) => {
            if (error) {
              console.error(
                "[PET LEADERBOARD SEND ERROR]",
                error
              );

              resolve(null);
              return;
            }

            resolve(info);
          },
          messageID
        );
      });

    if (
      sent &&
      sent.messageID
    ) {
      if (
        !Array.isArray(
          global.client.handleReply
        )
      ) {
        global.client.handleReply = [];
      }

      global.client.handleReply.push({
        name:
          module.exports.config.name,

        messageID:
          sent.messageID,

        author:
          String(senderID),

        type:
          "leaderboard_choice"
      });
    }

  } catch (error) {
    console.error(
      "[PET LEADERBOARD RUN ERROR]",
      error
    );

    return api.sendMessage(
      "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗥𝗔𝗡𝗞 ━━ ⌬\n\n" +
      "❌ حدث خطأ أثناء فتح قائمة التصدر.",
      threadID,
      messageID
    );
  }
};

/* =========================================================
   HANDLE REPLY
========================================================= */

module.exports.handleReply = async function ({
  api,
  event,
  handleReply,
  models
}) {
  const {
    threadID,
    messageID,
    senderID,
    body
  } = event;

  try {
    /*
     * فقط صاحب القائمة يستطيع الاختيار
     */
    if (
      handleReply.author &&
      String(handleReply.author) !==
        String(senderID)
    ) {
      return;
    }

    if (
      handleReply.type !==
      "leaderboard_choice"
    ) {
      return;
    }

    const choice =
      String(body || "")
        .trim();

    if (
      choice !== "1" &&
      choice !== "2"
    ) {
      return api.sendMessage(
        "❌ اختيار غير صحيح\n\n" +
        "1. القوة والنجوم والمستوى\n" +
        "2. الرصيد",
        threadID,
        messageID
      );
    }

    const Pets =
      getModel(
        models,
        "Pets"
      );

    const PetCurrency =
      getModel(
        models,
        "PetCurrency"
      );

    const Users =
      getModel(
        models,
        "Users"
      );

    let text;

    if (choice === "1") {
      text =
        await buildPowerLeaderboard(
          api,
          Pets,
          PetCurrency,
          Users
        );
    } else {
      text =
        await buildMoneyLeaderboard(
          api,
          Pets,
          PetCurrency,
          Users
        );
    }

    /*
     * إزالة الرد بعد الاختيار
     */
    if (
      Array.isArray(
        global.client.handleReply
      )
    ) {
      const index =
        global.client.handleReply.indexOf(
          handleReply
        );

      if (index !== -1) {
        global.client.handleReply.splice(
          index,
          1
        );
      }
    }

    return api.sendMessage(
      text,
      threadID,
      messageID
    );

  } catch (error) {
    console.error(
      "[PET LEADERBOARD REPLY ERROR]",
      error
    );

    return api.sendMessage(
      "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗥𝗔𝗡𝗞 ━━ ⌬\n\n" +
      "❌ حدث خطأ أثناء تحميل التصدر.",
      threadID,
      messageID
    );
  }
};

/* =========================================================
   EXPORTS
========================================================= */

module.exports.getLeaderboard =
  getLeaderboard;

module.exports.buildPowerLeaderboard =
  buildPowerLeaderboard;

module.exports.buildMoneyLeaderboard =
  buildMoneyLeaderboard;

module.exports.getLeaderboardMenu =
  getLeaderboardMenu;

module.exports.DEVELOPER_ID =
  DEVELOPER_ID;