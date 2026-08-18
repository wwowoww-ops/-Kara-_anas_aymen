const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "حظر",
  aliases: ["بان"],
  version: "2.0.0",
  hasPermssion: 2,
  credits: "أبو هريرة",
  description: "حظر وإلغاء حظر المجموعات والمستخدمين",
  commandCategory: "developer",
  usages: "حظر | حظر ازالة | بان [ID] | بان ازالة [ID]",
  cooldowns: 3
};

const DEV_ID = "61578581225040";

const DATA_DIR = path.join(process.cwd(), "data");
const GROUP_BAN_FILE = path.join(DATA_DIR, "banned.json");
const USER_BAN_FILE = path.join(DATA_DIR, "bannedUsers.json");

fs.ensureDirSync(DATA_DIR);

// ======================================================
// زخرفة HINA DEVELOPER
// ======================================================

const HEADER = `⌬ ━━ HINA DEVELOPER ━━ ⌬`;

// ======================================================
// JSON
// ======================================================

function readJSON(file) {
  try {
    if (!fs.existsSync(file)) {
      return {};
    }

    const text = fs.readFileSync(file, "utf8").trim();

    if (!text) {
      return {};
    }

    const data = JSON.parse(text);

    return data && typeof data === "object"
      ? data
      : {};

  } catch (error) {
    console.error("HINA JSON READ ERROR:", error);
    return {};
  }
}

function writeJSON(file, data) {
  try {
    fs.writeFileSync(
      file,
      JSON.stringify(data, null, 2),
      "utf8"
    );

    return true;
  } catch (error) {
    console.error("HINA JSON WRITE ERROR:", error);
    return false;
  }
}

// ======================================================
// المطور
// ======================================================

function isDeveloper(senderID) {
  return String(senderID) === DEV_ID;
}

// ======================================================
// تحديد نوع الأمر الحقيقي
// ======================================================

function getCommandType(event) {

  const body = String(event.body || "").trim();

  if (!body) {
    return "حظر";
  }

  const firstWord = body
    .split(/\s+/)[0]
    .toLowerCase();

  if (
    firstWord === "بان" ||
    firstWord === "ban"
  ) {
    return "بان";
  }

  return "حظر";
}

// ======================================================
// تنظيف كلمة الإزالة
// ======================================================

function isRemoveWord(word) {
  const value = String(word || "")
    .trim()
    .toLowerCase();

  return (
    value === "ازالة" ||
    value === "إزالة" ||
    value === "الغاء" ||
    value === "إلغاء" ||
    value === "remove" ||
    value === "unban"
  );
}

// ======================================================
// استخراج ID من المنشن
// ======================================================

function getMentionID(event) {
  try {
    if (
      event.mentions &&
      typeof event.mentions === "object"
    ) {
      const ids = Object.keys(event.mentions);

      if (ids.length > 0) {
        return String(ids[0]);
      }
    }
  } catch (e) {}

  return null;
}

// ======================================================
// استخراج المستخدم المستهدف للبان
// ======================================================

function getTargetUserID(event, args) {

  // الرد على رسالة
  if (
    event.messageReply &&
    event.messageReply.senderID
  ) {
    return String(event.messageReply.senderID);
  }

  // المنشن
  const mentionID = getMentionID(event);

  if (mentionID) {
    return mentionID;
  }

  // ID مكتوب
  if (args && args.length > 0) {

    for (const arg of args) {

      if (
        /^\d{5,}$/.test(String(arg))
      ) {
        return String(arg);
      }
    }
  }

  return null;
}

// ======================================================
// تحديث global.data للحظر
// ======================================================

function updateGlobalBan(threadID, value) {
  try {

    if (
      global.data &&
      global.data.threadBanned
    ) {

      if (
        value &&
        typeof global.data.threadBanned.set === "function"
      ) {
        global.data.threadBanned.set(
          String(threadID),
          true
        );
      }

      if (
        !value &&
        typeof global.data.threadBanned.delete === "function"
      ) {
        global.data.threadBanned.delete(
          String(threadID)
        );
      }
    }

  } catch (e) {}
}

// ======================================================
// RUN
// ======================================================

module.exports.run = async function ({
  api,
  event,
  args
}) {

  const {
    threadID,
    messageID,
    senderID
  } = event;

  // ====================================================
  // المطور فقط
  // ====================================================

  if (!isDeveloper(senderID)) {

    return api.sendMessage(
`${HEADER}

⛔ هذا الأمر للمطور الأساسي فقط!`,
      threadID,
      messageID
    );
  }

  try {

    const commandType =
      getCommandType(event);

    const commandArgs =
      Array.isArray(args)
        ? args.map(x => String(x).trim())
        : [];

    // ==================================================
    // حظر المجموعة
    // ==================================================

    if (commandType === "حظر") {

      const action =
        commandArgs[0] || "";

      const banned =
        readJSON(GROUP_BAN_FILE);

      const groupID =
        String(threadID);

      // ----------------------------------------------
      // إزالة حظر المجموعة
      // حظر ازالة
      // ----------------------------------------------

      if (isRemoveWord(action)) {

        if (!banned[groupID]) {

          return api.sendMessage(
`${HEADER}

⚠️ هذه المجموعة غير محظورة أصلاً.`,
            threadID,
            messageID
          );
        }

        delete banned[groupID];

        if (
          !writeJSON(
            GROUP_BAN_FILE,
            banned
          )
        ) {

          return api.sendMessage(
`${HEADER}

❌ حدث خطأ أثناء إزالة حظر المجموعة.`,
            threadID,
            messageID
          );
        }

        updateGlobalBan(
          groupID,
          false
        );

        return api.sendMessage(
`${HEADER}

✅ تم إزالة حظر المجموعة.

⪼ ID:
${groupID}`,
          threadID,
          messageID
        );
      }

      // ----------------------------------------------
      // حظر المجموعة
      // ----------------------------------------------

      if (banned[groupID]) {

        return api.sendMessage(
`${HEADER}

⚠️ هذه المجموعة محظورة بالفعل.`,
          threadID,
          messageID
        );
      }

      banned[groupID] = {
        banned: true,
        reason: "حظر بواسطة المطور أبو هريرة",
        time: Date.now()
      };

      if (
        !writeJSON(
          GROUP_BAN_FILE,
          banned
        )
      ) {

        return api.sendMessage(
`${HEADER}

❌ حدث خطأ أثناء حفظ حظر المجموعة.`,
          threadID,
          messageID
        );
      }

      updateGlobalBan(
        groupID,
        true
      );

      return api.sendMessage(
`${HEADER}

🔒 تم حظر هذه المجموعة من استعمال البوت.

⪼ ID:
${groupID}

⪼ بواسطة:
المطور أبو هريرة`,
        threadID,
        messageID
      );
    }

    // ==================================================
    // بان المستخدم
    // ==================================================

    if (commandType === "بان") {

      const firstArg =
        commandArgs[0] || "";

      const removing =
        isRemoveWord(firstArg);

      let targetID = null;

      // ----------------------------------------------
      // بان ازالة ID
      // ----------------------------------------------

      if (removing) {

        targetID =
          getTargetUserID(
            event,
            commandArgs.slice(1)
          );

      } else {

        // --------------------------------------------
        // بان ID
        // --------------------------------------------

        targetID =
          getTargetUserID(
            event,
            commandArgs
          );
      }

      // ----------------------------------------------
      // لا يوجد مستخدم
      // ----------------------------------------------

      if (!targetID) {

        return api.sendMessage(
`${HEADER}

⚠️ يجب تحديد المستخدم.

يمكنك استخدام:

• بان [ID]
• الرد على رسالة المستخدم ثم كتابة بان
• بان @منشن

ولإزالة البان:

• بان ازالة [ID]
• الرد على المستخدم ثم كتابة بان ازالة`,
          threadID,
          messageID
        );
      }

      // ----------------------------------------------
      // حماية المطور
      // ----------------------------------------------

      if (
        String(targetID) === DEV_ID
      ) {

        return api.sendMessage(
`${HEADER}

🛡️ لا يمكن حظر المطور أبو هريرة.`,
          threadID,
          messageID
        );
      }

      const bannedUsers =
        readJSON(
          USER_BAN_FILE
        );

      // ----------------------------------------------
      // إزالة البان
      // ----------------------------------------------

      if (removing) {

        if (!bannedUsers[targetID]) {

          return api.sendMessage(
`${HEADER}

⚠️ هذا المستخدم غير محظور أصلاً.

⪼ ID:
${targetID}`,
            threadID,
            messageID
          );
        }

        delete bannedUsers[targetID];

        if (
          !writeJSON(
            USER_BAN_FILE,
            bannedUsers
          )
        ) {

          return api.sendMessage(
`${HEADER}

❌ حدث خطأ أثناء إزالة البان.`,
            threadID,
            messageID
          );
        }

        return api.sendMessage(
`${HEADER}

✅ تم إزالة البان عن المستخدم.

⪼ ID:
${targetID}

يمكنه الآن استعمال البوت.`,
          threadID,
          messageID
        );
      }

      // ----------------------------------------------
      // إضافة البان
      // ----------------------------------------------

      if (bannedUsers[targetID]) {

        return api.sendMessage(
`${HEADER}

⚠️ هذا المستخدم محظور بالفعل من استعمال البوت.

⪼ ID:
${targetID}`,
          threadID,
          messageID
        );
      }

      bannedUsers[targetID] = {
        banned: true,
        reason: "بان بواسطة المطور أبو هريرة",
        time: Date.now()
      };

      if (
        !writeJSON(
          USER_BAN_FILE,
          bannedUsers
        )
      ) {

        return api.sendMessage(
`${HEADER}

❌ حدث خطأ أثناء حفظ البان.`,
          threadID,
          messageID
        );
      }

      return api.sendMessage(
`${HEADER}

🚫 تم حظر المستخدم من استعمال البوت.

⪼ ID:
${targetID}

لن يتمكن من استعمال أوامر البوت.`,
        threadID,
        messageID
      );
    }

    // ==================================================
    // الاستخدام
    // ==================================================

    return api.sendMessage(
`${HEADER}

📋 الأوامر المتاحة:

🔒 حظر المجموعة:
حظر

🔓 إزالة حظر المجموعة:
حظر ازالة

🚫 حظر مستخدم:
بان [ID]

🚫 حظر مستخدم بالرد:
الرد على رسالته ثم اكتب بان

🔓 إزالة البان:
بان ازالة [ID]

⌬ ━━━━━━━━━━━━ ⌬`,
      threadID,
      messageID
    );

  } catch (error) {

    console.error(
      "HINA DEVELOPER BAN ERROR:",
      error
    );

    return api.sendMessage(
`${HEADER}

❌ حدث خطأ أثناء تنفيذ الأمر.

⪼ الخطأ:
${error.message}`,
      threadID,
      messageID
    );
  }
};