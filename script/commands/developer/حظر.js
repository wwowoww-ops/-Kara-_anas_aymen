const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "حظر",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "حظر وإلغاء حظر المجموعات والمستخدمين",
  commandCategory: "developer",
  usages: "حظر | حظر ازالة ID | بان ID | بان ازالة ID",
  cooldowns: 3
};

// ======================================================
// الإعدادات
// ======================================================

const DATA_DIR = path.join(process.cwd(), "data");

const BANNED_GROUPS = path.join(
  DATA_DIR,
  "banned.json"
);

const BANNED_USERS = path.join(
  DATA_DIR,
  "banned_users.json"
);

fs.ensureDirSync(DATA_DIR);

// ======================================================
// زخرفة HINA DEVELOPER
// ======================================================

const HEADER =
`⌬ ━━ HINA DEVELOPER ━━ ⌬`;

// ======================================================
// قراءة config
// ======================================================

function getDeveloperID() {
  try {
    const configPath = path.join(
      process.cwd(),
      "config.json"
    );

    if (!fs.existsSync(configPath)) {
      return null;
    }

    const config = JSON.parse(
      fs.readFileSync(configPath, "utf8")
    );

    return String(
      config.KIRA_CONF?.dev ||
      config.ADMINBOT?.[0] ||
      ""
    );

  } catch (e) {
    return null;
  }
}

// ======================================================
// JSON
// ======================================================

function readJSON(file) {
  try {
    if (!fs.existsSync(file)) {
      return {};
    }

    const content =
      fs.readFileSync(file, "utf8").trim();

    if (!content) {
      return {};
    }

    return JSON.parse(content);

  } catch (e) {
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

  } catch (e) {
    console.error(
      "HINA BAN WRITE ERROR:",
      e
    );

    return false;
  }
}

// ======================================================
// التحقق من المطور
// ======================================================

function isDeveloper(senderID) {
  const devID = getDeveloperID();

  if (!devID) {
    return false;
  }

  return String(senderID) === String(devID);
}

// ======================================================
// حظر مجموعة
// ======================================================

function banGroup(threadID) {
  const groups =
    readJSON(BANNED_GROUPS);

  const id = String(threadID);

  groups[id] = {
    banned: true,
    time: Date.now(),
    reason: "حظر بواسطة المطور"
  };

  return writeJSON(
    BANNED_GROUPS,
    groups
  );
}

// ======================================================
// فك حظر مجموعة
// ======================================================

function unbanGroup(threadID) {
  const groups =
    readJSON(BANNED_GROUPS);

  const id = String(threadID);

  if (
    Object.prototype.hasOwnProperty.call(
      groups,
      id
    )
  ) {
    delete groups[id];
  }

  // تحديث global إن كان موجودًا
  try {
    if (
      global.data &&
      global.data.threadBanned
    ) {
      if (
        typeof global.data.threadBanned.delete ===
        "function"
      ) {
        global.data.threadBanned.delete(id);
      }
    }
  } catch (e) {}

  return writeJSON(
    BANNED_GROUPS,
    groups
  );
}

// ======================================================
// حظر مستخدم
// ======================================================

function banUser(userID) {
  const users =
    readJSON(BANNED_USERS);

  const id = String(userID);

  users[id] = {
    banned: true,
    time: Date.now(),
    reason: "حظر بواسطة المطور"
  };

  return writeJSON(
    BANNED_USERS,
    users
  );
}

// ======================================================
// فك حظر مستخدم
// ======================================================

function unbanUser(userID) {
  const users =
    readJSON(BANNED_USERS);

  const id = String(userID);

  if (
    Object.prototype.hasOwnProperty.call(
      users,
      id
    )
  ) {
    delete users[id];
  }

  return writeJSON(
    BANNED_USERS,
    users
  );
}

// ======================================================
// إرسال رسالة
// ======================================================

function send(api, event, text) {
  return api.sendMessage(
`${HEADER}

${text}`,
    event.threadID,
    event.messageID
  );
}

// ======================================================
// RUN
// ======================================================

module.exports.run = async function({
  api,
  event,
  args
}) {

  const {
    threadID,
    senderID,
    messageReply
  } = event;

  // ====================================================
  // المطور فقط
  // ====================================================

  if (!isDeveloper(senderID)) {
    return send(
      api,
      event,
      `⛔ هذا الأمر للمطور فقط.`
    );
  }

  try {

    const first =
      String(args?.[0] || "")
        .trim()
        .toLowerCase();

    const second =
      String(args?.[1] || "")
        .trim();

    // ==================================================
    // ================= حظر المجموعة ===================
    // ==================================================

    if (
      first === "حظر" ||
      first === "حظر_مجموعة"
    ) {

      // حظر ازالة
      if (
        second === "ازالة" ||
        second === "إزالة"
      ) {

        const groupID =
          String(
            args?.[2] ||
            ""
          ).trim();

        if (!groupID) {
          return send(
            api,
            event,
            `⚠️ يجب كتابة ID المجموعة.

مثال:
حظر ازالة 123456789`
          );
        }

        const success =
          unbanGroup(groupID);

        if (!success) {
          return send(
            api,
            event,
            `❌ فشل إلغاء حظر المجموعة.

⪼ ID:
${groupID}`
          );
        }

        return send(
          api,
          event,
          `✅ تم إلغاء حظر المجموعة بنجاح.

⪼ ID:
${groupID}

يمكن للبوت العودة لاستخدامها إذا كان نظام البوت يسمح بذلك.`
        );
      }

      // الحظر الحالي
      const success =
        banGroup(threadID);

      if (!success) {
        return send(
          api,
          event,
          `❌ حدث خطأ أثناء حظر المجموعة.`
        );
      }

      // تحديث global
      try {
        if (
          global.data &&
          global.data.threadBanned
        ) {
          if (
            typeof global.data.threadBanned.set ===
            "function"
          ) {
            global.data.threadBanned.set(
              String(threadID),
              true
            );
          }
        }
      } catch (e) {}

      return send(
        api,
        event,
        `🔒 تم حظر هذه المجموعة.

⪼ ID:
${threadID}

⚠️ لن يستجيب البوت لأوامر هذه المجموعة حسب نظام الحظر.

لفك الحظر استخدم من مجموعة أخرى:

حظر ازالة ${threadID}`
      );
    }

    // ==================================================
    // ===================== بان =========================
    // ==================================================

    if (
      first === "بان" ||
      first === "ban"
    ) {

      // ----------------------------------------------
      // بان ازالة
      // ----------------------------------------------

      if (
        second === "ازالة" ||
        second === "إزالة"
      ) {

        let userID =
          String(
            args?.[2] ||
            ""
          ).trim();

        // إذا كان الأمر ردًا على مستخدم
        if (
          !userID &&
          messageReply
        ) {
          userID =
            String(
              messageReply.senderID
            );
        }

        if (!userID) {
          return send(
            api,
            event,
            `⚠️ يجب تحديد ID المستخدم.

مثال:
بان ازالة 100000000000

أو استخدم الأمر بالرد على رسالة الشخص.`
          );
        }

        const success =
          unbanUser(userID);

        if (!success) {
          return send(
            api,
            event,
            `❌ فشل إلغاء حظر المستخدم.

⪼ ID:
${userID}`
          );
        }

        return send(
          api,
          event,
          `✅ تم إلغاء حظر المستخدم.

⪼ ID:
${userID}`
        );
      }

      // ----------------------------------------------
      // بان المستخدم
      // ----------------------------------------------

      let userID =
        String(
          second || ""
        ).trim();

      // إذا كان بالرد
      if (
        !userID &&
        messageReply
      ) {
        userID =
          String(
            messageReply.senderID
          );
      }

      if (!userID) {
        return send(
          api,
          event,
          `⚠️ يجب تحديد المستخدم.

استخدم:

بان 100000000000

أو استخدم:
بان

بالرد على رسالة المستخدم.`
        );
      }

      // حماية المطور
      if (
        String(userID) ===
        String(getDeveloperID())
      ) {
        return send(
          api,
          event,
          `🛡️ لا يمكن حظر المطور الأساسي.`
        );
      }

      const success =
        banUser(userID);

      if (!success) {
        return send(
          api,
          event,
          `❌ حدث خطأ أثناء حظر المستخدم.

⪼ ID:
${userID}`
        );
      }

      return send(
        api,
        event,
        `🚫 تم حظر المستخدم من استعمال البوت.

⪼ ID:
${userID}

سيتم رفض أوامر المستخدم إذا كان نظام تشغيل الأوامر يفحص ملف banned_users.json.`
      );
    }

    // ==================================================
    // الاستخدام
    // ==================================================

    return send(
      api,
      event,
`⚙️ الاستخدام:

🔒 حظر المجموعة:
حظر

🔓 فك حظر المجموعة:
حظر ازالة ID

🚫 حظر مستخدم:
بان ID

أو:
بان
بالرد على رسالته

✅ فك حظر مستخدم:
بان ازالة ID

أو:
بان ازالة
بالرد على رسالته`
    );

  } catch (error) {

    console.error(
      "HINA BAN ERROR:",
      error
    );

    return send(
      api,
      event,
`❌ حدث خطأ أثناء تنفيذ الأمر.

⪼ ${error.message}`
    );
  }
};