const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "حظر",
  version: "3.0.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "نظام حظر وفك حظر المجموعات والمستخدمين",
  commandCategory: "developer",
  usages: "حظر | حظر ازالة ID | بان ID | بان ازالة ID",
  cooldowns: 3
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

    const id =
      config.KIRA_CONF?.dev ||
      config.ADMINBOT?.[0];

    return id
      ? String(id)
      : null;

  } catch (error) {

    console.error(
      "GET DEVELOPER ID ERROR:",
      error
    );

    return null;
  }
}

// ======================================================
// تحقق المطور
// ======================================================

function isDeveloper(senderID) {

  const developerID =
    getDeveloperID();

  if (!developerID) {
    return false;
  }

  return (
    String(senderID) ===
    String(developerID)
  );
}

// ======================================================
// قراءة JSON
// ======================================================

function readJSON(file) {

  try {

    if (!fs.existsSync(file)) {
      fs.writeFileSync(
        file,
        "{}",
        "utf8"
      );

      return {};
    }

    const content =
      fs.readFileSync(
        file,
        "utf8"
      ).trim();

    if (!content) {
      return {};
    }

    const data =
      JSON.parse(content);

    if (
      typeof data !== "object" ||
      Array.isArray(data)
    ) {
      return {};
    }

    return data;

  } catch (error) {

    console.error(
      "READ JSON ERROR:",
      file,
      error
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

    const tempFile =
      `${file}.tmp`;

    fs.writeFileSync(
      tempFile,
      JSON.stringify(
        data,
        null,
        2
      ),
      "utf8"
    );

    fs.renameSync(
      tempFile,
      file
    );

    return true;

  } catch (error) {

    console.error(
      "WRITE JSON ERROR:",
      file,
      error
    );

    return false;
  }
}

// ======================================================
// حظر المجموعة
// ======================================================

function banGroup(threadID) {

  const id =
    String(threadID);

  const data =
    readJSON(
      BANNED_GROUPS
    );

  data[id] = {
    banned: true,
    time: Date.now(),
    reason: "حظر بواسطة المطور"
  };

  const saved =
    writeJSON(
      BANNED_GROUPS,
      data
    );

  // تحديث الذاكرة مباشرة
  if (
    saved &&
    global.data &&
    global.data.threadBanned
  ) {

    try {

      if (
        typeof global.data.threadBanned.set ===
        "function"
      ) {

        global.data.threadBanned.set(
          id,
          true
        );
      }

    } catch (e) {}
  }

  return saved;
}

// ======================================================
// فك حظر المجموعة
// ======================================================

function unbanGroup(threadID) {

  const id =
    String(threadID);

  const data =
    readJSON(
      BANNED_GROUPS
    );

  const exists =
    Object.prototype.hasOwnProperty.call(
      data,
      id
    );

  if (exists) {
    delete data[id];
  }

  const saved =
    writeJSON(
      BANNED_GROUPS,
      data
    );

  // مهم جدًا:
  // إزالة المجموعة من global.data.threadBanned
  if (
    global.data &&
    global.data.threadBanned
  ) {

    try {

      if (
        typeof global.data.threadBanned.delete ===
        "function"
      ) {

        global.data.threadBanned.delete(id);

      } else if (
        typeof global.data.threadBanned.set ===
        "function"
      ) {

        global.data.threadBanned.set(
          id,
          false
        );
      }

    } catch (e) {}
  }

  return saved;
}

// ======================================================
// حظر مستخدم
// ======================================================

function banUser(userID) {

  const id =
    String(userID);

  const data =
    readJSON(
      BANNED_USERS
    );

  data[id] = {
    banned: true,
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
    global.data.userBanned
  ) {

    try {

      if (
        typeof global.data.userBanned.set ===
        "function"
      ) {

        global.data.userBanned.set(
          id,
          true
        );
      }

    } catch (e) {}
  }

  return saved;
}

// ======================================================
// فك حظر مستخدم
// ======================================================

function unbanUser(userID) {

  const id =
    String(userID);

  const data =
    readJSON(
      BANNED_USERS
    );

  if (
    Object.prototype.hasOwnProperty.call(
      data,
      id
    )
  ) {

    delete data[id];

  }

  const saved =
    writeJSON(
      BANNED_USERS,
      data
    );

  if (
    global.data &&
    global.data.userBanned
  ) {

    try {

      if (
        typeof global.data.userBanned.delete ===
        "function"
      ) {

        global.data.userBanned.delete(id);

      } else if (
        typeof global.data.userBanned.set ===
        "function"
      ) {

        global.data.userBanned.set(
          id,
          false
        );
      }

    } catch (e) {}
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
// استخراج ID من الرد
// ======================================================

function getReplyUserID(event) {

  if (
    event.messageReply &&
    event.messageReply.senderID
  ) {

    return String(
      event.messageReply.senderID
    );
  }

  return null;
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
    senderID
  } = event;

  // ====================================================
  // المطور فقط
  // ====================================================

  if (
    !isDeveloper(senderID)
  ) {

    return send(
      api,
      event,
      `⛔ هذا الأمر للمطور فقط.`
    );
  }

  try {

    /*
     * مهم:
     * لا نستخدم toLowerCase على الكلمات العربية
     * لأننا نريد الحفاظ عليها كما هي،
     * ونستخدم normalize فقط للمقارنة.
     */

    const normalize =
      value =>
        String(value || "")
          .trim()
          .toLowerCase()
          .replace(/[إأآ]/g, "ا");

    const first =
      normalize(
        args?.[0]
      );

    const second =
      normalize(
        args?.[1]
      );

    const third =
      String(
        args?.[2] || ""
      ).trim();

    // ==================================================
    // 🔒 حظر المجموعة
    // ==================================================

    if (
      first === "حظر" ||
      first === "حظر_مجموعة"
    ) {

      // ----------------------------------------------
      // حظر ازالة
      // ----------------------------------------------

      if (
        second === "ازالة" ||
        second === "إزالة" ||
        second === "ازاله" ||
        second === "الغاء" ||
        second === "إلغاء"
      ) {

        let groupID =
          third;

        // إذا لم يكتب ID
        // نحاول استخدام المجموعة الحالية
        if (!groupID) {
          groupID =
            String(threadID);
        }

        const success =
          unbanGroup(
            groupID
          );

        if (!success) {

          return send(
            api,
            event,
            `❌ تعذر حفظ عملية فك الحظر.

⪼ ID:
${groupID}`
          );
        }

        return send(
          api,
          event,
          `🔓 تم فك حظر المجموعة بنجاح.

⪼ ID:
${groupID}

✅ أصبحت المجموعة مسموحًا لها باستخدام البوت.`
        );
      }

      // ----------------------------------------------
      // حظر المجموعة الحالية
      // ----------------------------------------------

      const success =
        banGroup(
          threadID
        );

      if (!success) {

        return send(
          api,
          event,
          `❌ فشل حفظ حظر المجموعة.`
        );
      }

      return send(
        api,
        event,
        `🔒 تم حظر المجموعة.

⪼ ID:
${threadID}

لن يستجيب البوت للأوامر هنا.

لفك الحظر من مكان آخر:
حظر ازالة ${threadID}`
      );
    }

    // ==================================================
    // 🚫 بان
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
        second === "ازاله" ||
        second === "الغاء" ||
        second === "إلغاء"
      ) {

        let userID =
          third;

        if (!userID) {

          userID =
            getReplyUserID(
              event
            );
        }

        if (!userID) {

          return send(
            api,
            event,
            `⚠️ حدد المستخدم.

مثال:
بان ازالة 100000000000

أو استخدم:
بان ازالة

بالرد على رسالة المستخدم.`
          );
        }

        const success =
          unbanUser(
            userID
          );

        if (!success) {

          return send(
            api,
            event,
            `❌ فشل حفظ فك حظر المستخدم.

⪼ ID:
${userID}`
          );
        }

        return send(
          api,
          event,
          `🔓 تم فك حظر المستخدم.

⪼ ID:
${userID}

✅ أصبح بإمكانه استخدام البوت.`
        );
      }

      // ----------------------------------------------
      // بان المستخدم
      // ----------------------------------------------

      let userID =
        String(
          args?.[1] || ""
        ).trim();

      if (!userID) {

        userID =
          getReplyUserID(
            event
          );
      }

      if (!userID) {

        return send(
          api,
          event,
          `⚠️ حدد المستخدم.

مثال:
بان 100000000000

أو:
بان

بالرد على رسالة المستخدم.`
        );
      }

      // ----------------------------------------------
      // حماية المطور
      // ----------------------------------------------

      const developerID =
        getDeveloperID();

      if (
        developerID &&
        String(userID) ===
        String(developerID)
      ) {

        return send(
          api,
          event,
          `🛡️ لا يمكن حظر المطور الأساسي.`
        );
      }

      const success =
        banUser(
          userID
        );

      if (!success) {

        return send(
          api,
          event,
          `❌ فشل حفظ حظر المستخدم.

⪼ ID:
${userID}`
        );
      }

      return send(
        api,
        event,
        `🚫 تم حظر المستخدم.

⪼ ID:
${userID}

لن يتمكن من استخدام أوامر البوت.`
      );
    }

    // ==================================================
    // الاستخدام
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