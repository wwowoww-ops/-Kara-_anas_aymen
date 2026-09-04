const fs = require("fs-extra");

module.exports.config = {
  name: "حذف",
  version: "2.1.0",
  hasPermssion: 1,
  credits: "أبو هريرة",
  description: "حذف رسالة معينة أو عدد من الرسائل",
  commandCategory: "admin",
  usages: "حذف [عدد] أو حذف [رداً على رسالة]",
  cooldowns: 5
};

// ======================================================
// جلب IDs المطورين
// ======================================================

function getDeveloperIDs() {
  const ids = [];

  try {
    if (Array.isArray(global.config?.ADMINBOT)) {
      for (const id of global.config.ADMINBOT) {
        if (id) {
          ids.push(String(id));
        }
      }
    }
  } catch (e) {}

  try {
    const dev = global.config?.KIRA_CONF?.dev;

    if (dev) {
      ids.push(String(dev));
    }
  } catch (e) {}

  try {
    const config = JSON.parse(
      fs.readFileSync("./config.json", "utf8")
    );

    if (Array.isArray(config.ADMINBOT)) {
      for (const id of config.ADMINBOT) {
        if (id) {
          ids.push(String(id));
        }
      }
    }

    if (config.KIRA_CONF?.dev) {
      ids.push(String(config.KIRA_CONF.dev));
    }
  } catch (e) {}

  return [...new Set(ids)];
}

// ======================================================
// التحقق من المطور
// ======================================================

function isDeveloper(userID) {
  return getDeveloperIDs().includes(
    String(userID)
  );
}

// ======================================================
// التحقق من أدمن المجموعة
// ======================================================

function isAdmin(threadInfo, userID) {
  try {
    if (
      !threadInfo ||
      !Array.isArray(threadInfo.adminIDs)
    ) {
      return false;
    }

    return threadInfo.adminIDs.some(admin => {
      const id =
        typeof admin === "object"
          ? admin?.id
          : admin;

      return (
        String(id || "") ===
        String(userID)
      );
    });

  } catch (e) {
    return false;
  }
}

// ======================================================
// جلب معلومات المجموعة
// ======================================================

async function getThreadInfo(
  api,
  Threads,
  threadID
) {
  let threadInfo = null;

  // المصدر الأول: Threads.getInfo
  try {
    if (
      Threads &&
      typeof Threads.getInfo === "function"
    ) {
      threadInfo =
        await Threads.getInfo(threadID);
    }
  } catch (e) {
    threadInfo = null;
  }

  // المصدر الثاني: api.getThreadInfo
  if (!threadInfo) {
    try {
      if (
        api &&
        typeof api.getThreadInfo === "function"
      ) {
        threadInfo =
          await api.getThreadInfo(threadID);
      }
    } catch (e) {
      threadInfo = null;
    }
  }

  return threadInfo;
}

// ======================================================
// حذف رسالة
// ======================================================

async function deleteMessage(
  api,
  messageID
) {
  try {
    if (
      !api ||
      !messageID ||
      typeof api.unsendMessage !== "function"
    ) {
      return false;
    }

    await api.unsendMessage(
      messageID
    );

    return true;

  } catch (e) {
    return false;
  }
}

// ======================================================
// إرسال رسالة آمن
// ======================================================

async function sendMessage(
  api,
  message,
  threadID,
  messageID
) {
  try {
    if (
      !api ||
      typeof api.sendMessage !== "function"
    ) {
      return;
    }

    return await new Promise(resolve => {

      let finished = false;

      const done = (
        error,
        info
      ) => {

        if (finished) {
          return;
        }

        finished = true;

        if (error) {
          console.error(
            "[حذف SEND ERROR]",
            error
          );
        }

        resolve(info);
      };

      try {

        api.sendMessage(
          message,
          threadID,
          done,
          messageID
        );

      } catch (error) {

        done(error);
      }
    });

  } catch (error) {

    console.error(
      "[حذف SEND ERROR]",
      error.message
    );
  }
}

// ======================================================
// الأمر
// ======================================================

module.exports.run = async function({
  api,
  event,
  args,
  Threads
}) {

  const {
    threadID,
    messageID,
    senderID,
    messageReply
  } = event;

  const header =
    "⌬ ━━ HINA ━━ ⌬";

  try {

    // ==================================================
    // التحقق من المطور
    // ==================================================

    const developer =
      isDeveloper(senderID);

    // ==================================================
    // جلب معلومات المجموعة
    // ==================================================

    const threadInfo =
      await getThreadInfo(
        api,
        Threads,
        threadID
      );

    // ==================================================
    // التحقق من أدمن المجموعة
    // ==================================================

    const groupAdmin =
      isAdmin(
        threadInfo,
        senderID
      );

    // ==================================================
    // الصلاحية
    // ==================================================

    if (
      !developer &&
      !groupAdmin
    ) {

      return sendMessage(
        api,
        `${header}

⛔ هذا الأمر للأدمن أو المطور فقط!`,
        threadID,
        messageID
      );
    }

    // ==================================================
    // الحالة 1
    // حذف رسالة بالرد عليها
    // ==================================================

    if (messageReply) {

      const targetMessageID =
        messageReply.messageID;

      if (!targetMessageID) {

        return sendMessage(
          api,
          `${header}

❌ لم أتمكن من تحديد الرسالة المراد حذفها.`,
          threadID,
          messageID
        );
      }

      const deleted =
        await deleteMessage(
          api,
          targetMessageID
        );

      if (!deleted) {

        return sendMessage(
          api,
          `${header}

❌ حدث خطأ أثناء حذف الرسالة المحددة.`,
          threadID,
          messageID
        );
      }

      return sendMessage(
        api,
        `${header}

✅ تم حذف الرسالة المحددة.`,
        threadID,
        messageID
      );
    }

    // ==================================================
    // الحالة 2
    // حذف عدد من الرسائل
    // ==================================================

    const num =
      parseInt(
        args?.[0],
        10
      );

    if (
      Number.isInteger(num) &&
      num > 0
    ) {

      const count =
        Math.min(
          num,
          50
        );

      let messages;

      // ==================================================
      // جلب سجل الرسائل
      // ==================================================

      try {

        messages =
          await api.getThreadHistory(
            threadID,
            count + 1
          );

      } catch (error) {

        return sendMessage(
          api,
          `${header}

❌ حدث خطأ أثناء جلب الرسائل

${error.message}`,
          threadID,
          messageID
        );
      }

      if (
        !Array.isArray(messages) ||
        messages.length === 0
      ) {

        return sendMessage(
          api,
          `${header}

⚠️ لم يتم العثور على رسائل للحذف.`,
          threadID,
          messageID
        );
      }

      // ==================================================
      // استخراج الرسائل
      // ==================================================

      const msgIDs =
        messages
          .filter(msg => {

            if (
              !msg ||
              !msg.messageID
            ) {
              return false;
            }

            return (
              String(msg.messageID) !==
              String(messageID)
            );
          })
          .map(
            msg =>
              msg.messageID
          )
          .slice(
            0,
            count
          );

      // ==================================================
      // حذف الرسائل
      // ==================================================

      let deletedCount = 0;

      for (
        const id of msgIDs
      ) {

        try {

          await api.unsendMessage(
            id
          );

          deletedCount++;

        } catch (error) {

          // تجاهل الرسائل التي لا يمكن حذفها
        }

        await new Promise(
          resolve =>
            setTimeout(
              resolve,
              150
            )
        );
      }

      // ==================================================
      // النتيجة
      // ==================================================

      return sendMessage(
        api,
        `${header}

✅ تم حذف ${deletedCount} رسالة.`,
        threadID,
        messageID
      );
    }

    // ==================================================
    // الاستخدام
    // ==================================================

    return sendMessage(
      api,
      `${header}

📝 الاستخدام:

• حذف [عدد]
لحذف عدد من الرسائل

• حذف
بالرد على رسالة لحذفها

• الحد الأقصى: 50 رسالة`,
      threadID,
      messageID
    );

  } catch (error) {

    console.error(
      "[حذف ERROR]",
      error
    );

    return sendMessage(
      api,
      `${header}

❌ حدث خطأ أثناء تنفيذ الأمر

${error.message}`,
      threadID,
      messageID
    );
  }
};
