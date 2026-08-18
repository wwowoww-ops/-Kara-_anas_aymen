const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "حظر",
  version: "3.0.0",
  hasPermssion: 2,
  credits: "أبو هريرة",
  description: "نظام حظر دائم للمجموعات والمستخدمين",
  commandCategory: "developer",
  usages: "حظر | حظر ازالة ID | بان ID | بان ازالة ID",
  cooldowns: 3,

  // أسماء بديلة
  aliases: ["بان", "ban"]
};

// ======================================================
// المسارات
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
// إنشاء الملفات إذا لم تكن موجودة
// ======================================================

function ensureFiles() {

  if (!fs.existsSync(BANNED_GROUPS)) {
    fs.writeFileSync(
      BANNED_GROUPS,
      "{}",
      "utf8"
    );
  }

  if (!fs.existsSync(BANNED_USERS)) {
    fs.writeFileSync(
      BANNED_USERS,
      "{}",
      "utf8"
    );
  }
}

ensureFiles();

// ======================================================
// Header
// ======================================================

const HEADER =
`⌬ ━━ 𝗛𝗜𝗡𝗔 DEVELOPER ━━ ⌬`;

// ======================================================
// المطور
// ======================================================

function getDeveloperID() {

  try {

    const configPath =
      path.join(
        process.cwd(),
        "config.json"
      );

    if (!fs.existsSync(configPath)) {
      return null;
    }

    const config =
      JSON.parse(
        fs.readFileSync(
          configPath,
          "utf8"
        )
      );

    return String(
      config.KIRA_CONF?.dev ||
      config.ADMINBOT?.[0] ||
      ""
    );

  } catch (e) {

    console.error(
      "GET DEVELOPER ERROR:",
      e.message
    );

    return null;
  }
}

// ======================================================
// قراءة JSON بأمان
// ======================================================

function readJSON(file) {

  try {

    ensureFiles();

    const raw =
      fs.readFileSync(
        file,
        "utf8"
      ).trim();

    if (!raw) {
      return {};
    }

    const data =
      JSON.parse(raw);

    if (
      !data ||
      typeof data !== "object"
    ) {
      return {};
    }

    return data;

  } catch (e) {

    console.error(
      "BAN READ ERROR:",
      file,
      e.message
    );

    return {};
  }
}

// ======================================================
// كتابة JSON
// ======================================================

function writeJSON(file, data) {

  try {

    fs.ensureDirSync(
      path.dirname(file)
    );

    fs.writeFileSync(
      file,
      JSON.stringify(
        data,
        null,
        2
      ),
      "utf8"
    );

    return true;

  } catch (e) {

    console.error(
      "BAN WRITE ERROR:",
      e.message
    );

    return false;
  }
}

// ======================================================
// التحقق من المطور
// ======================================================

function isDeveloper(senderID) {

  const developerID =
    getDeveloperID();

  return (
    developerID &&
    String(senderID) ===
    String(developerID)
  );
}

// ======================================================
// حظر مجموعة
// ======================================================

function banGroup(threadID) {

  const data =
    readJSON(BANNED_GROUPS);

  const id =
    String(threadID);

  data[id] = {
    banned: true,
    type: "group",
    time: Date.now(),
    reason: "حظر بواسطة المطور"
  };

  const saved =
    writeJSON(
      BANNED_GROUPS,
      data
    );

  // تحديث الذاكرة أيضًا
  if (
    saved &&
    global.data &&
    global.data.threadBanned &&
    typeof global.data.threadBanned.set ===
      "function"
  ) {

    global.data.threadBanned.set(
      id,
      true
    );
  }

  return saved;
}

// ======================================================
// فك حظر مجموعة
// ======================================================

function unbanGroup(threadID) {

  const data =
    readJSON(BANNED_GROUPS);

  const id =
    String(threadID);

  delete data[id];

  const saved =
    writeJSON(
      BANNED_GROUPS,
      data
    );

  if (
    global.data &&
    global.data.threadBanned &&
    typeof global.data.threadBanned.delete ===
      "function"
  ) {

    global.data.threadBanned.delete(id);
  }

  return saved;
}

// ======================================================
// حظر مستخدم
// ======================================================

function banUser(userID) {

  const data =
    readJSON(BANNED_USERS);

  const id =
    String(userID);

  data[id] = {
    banned: true,
    type: "user",
    time: Date.now(),
    reason: "حظر بواسطة المطور"
  };

  const saved =
    writeJSON(
      BANNED_USERS,
      data
    );

  if (
    saved &&
    global.data &&
    global.data.userBanned &&
    typeof global.data.userBanned.set ===
      "function"
  ) {

    global.data.userBanned.set(
      id,
      true
    );
  }

  return saved;
}

// ======================================================
// فك حظر مستخدم
// ======================================================

function unbanUser(userID) {

  const data =
    readJSON(BANNED_USERS);

  const id =
    String(userID);

  delete data[id];

  const saved =
    writeJSON(
      BANNED_USERS,
      data
    );

  if (
    global.data &&
    global.data.userBanned &&
    typeof global.data.userBanned.delete ===
      "function"
  ) {

    global.data.userBanned.delete(id);
  }

  return saved;
}

// ======================================================
// إرسال
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

module.exports.run =
async function ({
  api,
  event,
  args
}) {

  const {
    threadID,
    senderID,
    messageReply
  } = event;

  // المطور فقط
  if (!isDeveloper(senderID)) {

    return send(
      api,
      event,
      "⛔ هذا الأمر للمطور فقط."
    );
  }

  try {

    const first =
      String(
        args?.[0] || ""
      )
      .trim()
      .toLowerCase();

    const second =
      String(
        args?.[1] || ""
      )
      .trim();

    // ==================================================
    // حظر المجموعة
    // ==================================================

    if (
      first === "" ||
      first === "حظر" ||
      first === "مجموعة" ||
      first === "group"
    ) {

      // حظر ازالة ID
      if (
        second === "ازالة" ||
        second === "إزالة" ||
        second === "رفع"
      ) {

        const groupID =
          String(
            args?.[2] || ""
          ).trim();

        if (!groupID) {

          return send(
            api,
            event,
            `⚠️ اكتب ID المجموعة.

مثال:
حظر ازالة 123456789`
          );
        }

        if (
          unbanGroup(groupID)
        ) {

          return send(
            api,
            event,
`🔓 تم فك حظر المجموعة.

⪼ ID:
${groupID}

✅ أصبحت المجموعة مسموحة للبوت من جديد.`
          );
        }

        return send(
          api,
          event,
          "❌ تعذر فك حظر المجموعة."
        );
      }

      // حظر المجموعة الحالية
      if (
        banGroup(threadID)
      ) {

        return send(
          api,
          event,
`🔒 تم حظر المجموعة بالكامل.

⪼ ID:
${threadID}

🚫 لن يستطيع أعضاء المجموعة استخدام البوت.

⚠️ الحظر محفوظ في قاعدة البيانات ولن يختفي بعد إعادة تشغيل البوت.

لفك الحظر:
حظر ازالة ${threadID}`
        );
      }

      return send(
        api,
        event,
        "❌ فشل حفظ حظر المجموعة."
      );
    }

    // ==================================================
    // بان / Ban
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
        second === "إزالة" ||
        second === "رفع"
      ) {

        let userID =
          String(
            args?.[2] || ""
          ).trim();

        if (
          !userID &&
          messageReply &&
          messageReply.senderID
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
`⚠️ حدد ID المستخدم.

مثال:
بان ازالة 100000000000

أو استخدم الأمر بالرد على رسالته.`
          );
        }

        if (
          unbanUser(userID)
        ) {

          return send(
            api,
            event,
`🔓 تم فك حظر المستخدم.

⪼ ID:
${userID}

✅ يستطيع استخدام البوت من جديد.`
          );
        }

        return send(
          api,
          event,
          "❌ فشل فك حظر المستخدم."
        );
      }

      // ----------------------------------------------
      // بان المستخدم
      // ----------------------------------------------

      let userID =
        String(
          second || ""
        ).trim();

      if (
        !userID &&
        messageReply &&
        messageReply.senderID
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
`⚠️ حدد المستخدم.

مثال:
بان 100000000000

أو اكتب:
بان

بالرد على رسالته.`
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
          "🛡️ لا يمكن حظر المطور."
        );
      }

      if (
        banUser(userID)
      ) {

        return send(
          api,
          event,
`🚫 تم حظر المستخدم من البوت.

⪼ ID:
${userID}

لن يستطيع تنفيذ أوامر البوت حتى يتم فك الحظر.

لفك الحظر:
بان ازالة ${userID}`
        );
      }

      return send(
        api,
        event,
        "❌ فشل حفظ حظر المستخدم."
      );
    }

    // ==================================================
    // المساعدة
    // ==================================================

    return send(
      api,
      event,
`⚙️ أوامر نظام الحظر:

🔒 حظر المجموعة الحالية:
حظر

🔓 فك حظر مجموعة:
حظر ازالة ID

🚫 حظر مستخدم:
بان ID

أو:
بان
بالرد على رسالته

🔓 فك حظر مستخدم:
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