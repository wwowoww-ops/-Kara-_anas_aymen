const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "حظر",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "حظر المجموعة أو حظر مستخدم من استعمال البوت",
  commandCategory: "developer",
  usages: "حظر | حظر ازالة | بان [ID] | بان ازالة [ID]",
  cooldowns: 3
};

const DEV_ID = "61578581225040";

const DATA_DIR = path.join(process.cwd(), "data");
const GROUP_BAN_FILE = path.join(DATA_DIR, "banned.json");
const USER_BAN_FILE = path.join(DATA_DIR, "bannedUsers.json");

fs.ensureDirSync(DATA_DIR);

function readJSON(file) {
  try {
    if (!fs.existsSync(file)) return {};
    const data = fs.readFileSync(file, "utf8");
    if (!data.trim()) return {};
    return JSON.parse(data);
  } catch (e) {
    return {};
  }
}

function writeJSON(file, data) {
  fs.writeFileSync(
    file,
    JSON.stringify(data, null, 2),
    "utf8"
  );
}

function isDeveloper(id) {
  return String(id) === DEV_ID;
}

function getHeader() {
  return `⌬ ━━ HINA DEVELOPER ━━ ⌬`;
}

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  // ==================================================
  // حماية المطور
  // ==================================================

  if (!isDeveloper(senderID)) {
    return api.sendMessage(
      `${getHeader()}

⛔ هذا الأمر للمطور الأساسي فقط!`,
      threadID,
      messageID
    );
  }

  try {
    const action = String(args[0] || "").toLowerCase();
    const option = String(args[1] || "").toLowerCase();

    // ==================================================
    // حظر المجموعة
    //
    // حظر
    // حظر ازالة
    // ==================================================

    if (
      action === "حظر" ||
      action === "حظر_مجموعة"
    ) {

      const banned = readJSON(GROUP_BAN_FILE);

      // إزالة حظر المجموعة
      if (
        option === "ازالة" ||
        option === "إزالة" ||
        option === "الغاء" ||
        option === "إلغاء"
      ) {

        if (!banned[String(threadID)]) {
          return api.sendMessage(
            `${getHeader()}

⚠️ هذه المجموعة ليست محظورة أصلاً.`,
            threadID,
            messageID
          );
        }

        delete banned[String(threadID)];
        writeJSON(GROUP_BAN_FILE, banned);

        // تحديث نظام البوت إن كان موجوداً
        try {
          if (
            global.data &&
            global.data.threadBanned &&
            typeof global.data.threadBanned.delete === "function"
          ) {
            global.data.threadBanned.delete(String(threadID));
          }
        } catch (e) {}

        return api.sendMessage(
          `${getHeader()}

✅ تم إزالة حظر المجموعة.

⪼ ID:
${threadID}`,
          threadID,
          messageID
        );
      }

      // إضافة حظر
      banned[String(threadID)] = {
        banned: true,
        reason: "حظر بواسطة المطور",
        time: Date.now()
      };

      writeJSON(GROUP_BAN_FILE, banned);

      // تحديث نظام البوت إن كان موجوداً
      try {
        if (
          global.data &&
          global.data.threadBanned &&
          typeof global.data.threadBanned.set === "function"
        ) {
          global.data.threadBanned.set(
            String(threadID),
            true
          );
        }
      } catch (e) {}

      return api.sendMessage(
        `${getHeader()}

🔒 تم حظر هذه المجموعة من استعمال البوت.

⪼ ID:
${threadID}

يمكن إزالة الحظر باستخدام:
حظر ازالة`,
        threadID,
        messageID
      );
    }

    // ==================================================
    // بان مستخدم
    //
    // بان [ID]
    // بان ازالة [ID]
    //
    // أو بالرد على رسالة:
    // بان
    // بان ازالة
    // ==================================================

    if (
      action === "بان" ||
      action === "ban"
    ) {

      let targetID = null;

      // إذا كان الأمر بالرد على شخص
      if (event.messageReply && event.messageReply.senderID) {
        targetID = String(event.messageReply.senderID);
      }

      // إذا تم وضع ID بعد الأمر
      if (
        args[1] &&
        ![
          "ازالة",
          "إزالة",
          "الغاء",
          "إلغاء"
        ].includes(option)
      ) {
        targetID = String(args[1]);
      }

      // إذا كان "بان ازالة ID"
      if (
        option === "ازالة" ||
        option === "إزالة" ||
        option === "الغاء" ||
        option === "إلغاء"
      ) {

        if (args[2]) {
          targetID = String(args[2]);
        }

        if (!targetID) {
          return api.sendMessage(
            `${getHeader()}

⚠️ حدد المستخدم الذي تريد إزالة البان عنه.

مثال:
بان ازالة 100000000000000`,
            threadID,
            messageID
          );
        }

        const bannedUsers = readJSON(USER_BAN_FILE);

        if (!bannedUsers[targetID]) {
          return api.sendMessage(
            `${getHeader()}

⚠️ هذا المستخدم غير محظور من استعمال البوت.

⪼ ID:
${targetID}`,
            threadID,
            messageID
          );
        }

        delete bannedUsers[targetID];
        writeJSON(USER_BAN_FILE, bannedUsers);

        return api.sendMessage(
          `${getHeader()}

✅ تم إزالة البان عن المستخدم.

⪼ ID:
${targetID}

يمكنه الآن استعمال البوت.`,
          threadID,
          messageID
        );
      }

      if (!targetID) {
        return api.sendMessage(
          `${getHeader()}

⚠️ حدد المستخدم الذي تريد حظره.

يمكنك استخدام:

• بان [ID]
• الرد على رسالة المستخدم ثم كتابة بان

مثال:
بان 100000000000000`,
          threadID,
          messageID
        );
      }

      // منع المطور من حظر نفسه
      if (targetID === DEV_ID) {
        return api.sendMessage(
          `${getHeader()}

🛡️ لا يمكن حظر المطور الأساسي.`,
          threadID,
          messageID
        );
      }

      const bannedUsers = readJSON(USER_BAN_FILE);

      bannedUsers[targetID] = {
        banned: true,
        reason: "بان بواسطة المطور",
        time: Date.now()
      };

      writeJSON(USER_BAN_FILE, bannedUsers);

      return api.sendMessage(
        `${getHeader()}

🚫 تم حظر المستخدم من استعمال البوت.

⪼ ID:
${targetID}

لن يتمكن من استخدام أوامر البوت.`,
        threadID,
        messageID
      );
    }

    // ==================================================
    // الاستخدام
    // ==================================================

    return api.sendMessage(
      `${getHeader()}

📋 الأوامر:

🔒 حظر المجموعة:
حظر

🔓 إزالة حظر المجموعة:
حظر ازالة

🚫 بان مستخدم:
بان [ID]

🔓 إزالة بان مستخدم:
بان ازالة [ID]

💡 ويمكنك أيضاً الرد على رسالة المستخدم وكتابة:
بان

بان ازالة`,
      threadID,
      messageID
    );

  } catch (error) {

    console.error("HINA BAN ERROR:", error);

    return api.sendMessage(
      `${getHeader()}

❌ حدث خطأ أثناء تنفيذ الأمر.

⪼ الخطأ:
${error.message}`,
      threadID,
      messageID
    );
  }
};