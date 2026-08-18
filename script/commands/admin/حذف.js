const fs = require("fs-extra");

module.exports.config = {
  name: "حذف",
  version: "2.0.0",
  hasPermssion: 1,
  credits: "أبو هريرة",
  description: "حذف رسالة معينة أو عدد من الرسائل",
  commandCategory: "admin",
  usages: "حذف [عدد] أو حذف [رداً على رسالة]",
  cooldowns: 5
};

// ======================================================
// جلب ID المطور
// ======================================================

function getDeveloperID() {
  try {
    const config = JSON.parse(
      fs.readFileSync("./config.json", "utf8")
    );

    return String(
      config.KIRA_CONF?.dev ||
      config.ADMINBOT?.[0] ||
      ""
    );
  } catch (e) {
    return "";
  }
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
          ? admin.id
          : admin;

      return String(id) === String(userID);
    });
  } catch (e) {
    return false;
  }
}

// ======================================================
// تنفيذ حذف رسالة
// ======================================================

async function deleteMessage(api, messageID) {
  try {
    if (!messageID) return false;

    await api.unsendMessage(messageID);

    return true;
  } catch (e) {
    return false;
  }
}

// ======================================================
// الأمر
// ======================================================

module.exports.run = async function({
  api,
  event,
  args
}) {

  const {
    threadID,
    messageID,
    senderID,
    messageReply
  } = event;

  const header = `⌬ ━━ HINA ━━ ⌬`;

  try {

    // ==================================================
    // جلب معلومات المجموعة
    // ==================================================

    let threadInfo;

    try {
      threadInfo =
        await api.getThreadInfo(threadID);
    } catch (e) {
      threadInfo = null;
    }

    // ==================================================
    // المطور
    // ==================================================

    const devID = getDeveloperID();

    const isDeveloper =
      devID &&
      String(senderID) === String(devID);

    // ==================================================
    // أدمن المجموعة
    // ==================================================

    const isGroupAdmin =
      isAdmin(
        threadInfo,
        senderID
      );

    // ==================================================
    // الصلاحية:
    // المطور أو أدمن المجموعة
    // ==================================================

    if (
      !isDeveloper &&
      !isGroupAdmin
    ) {
      return api.sendMessage(
        `${header}\n\n⛔ هذا الأمر للأدمن أو المطور فقط!`,
        threadID,
        messageID
      );
    }

    // ==================================================
    // الحالة 1:
    // حذف رسالة محددة بالرد عليها
    // ==================================================

    if (messageReply) {

      const targetMessageID =
        messageReply.messageID;

      const deleted =
        await deleteMessage(
          api,
          targetMessageID
        );

      if (!deleted) {
        return api.sendMessage(
          `${header}\n\n❌ حدث خطأ أثناء حذف الرسالة المحددة.`,
          threadID,
          messageID
        );
      }

      return api.sendMessage(
        `${header}\n\n✅ تم حذف الرسالة المحددة.`,
        threadID,
        messageID
      );
    }

    // ==================================================
    // الحالة 2:
    // حذف عدد من الرسائل
    // ==================================================

    const num =
      parseInt(
        args && args[0],
        10
      );

    if (
      Number.isInteger(num) &&
      num > 0
    ) {

      const count =
        Math.min(num, 50);

      let messages;

      try {

        messages =
          await api.getThreadHistory(
            threadID,
            count + 1
          );

      } catch (e) {

        return api.sendMessage(
          `${header}\n\n❌ حدث خطأ أثناء جلب الرسائل:\n${e.message}`,
          threadID,
          messageID
        );
      }

      if (
        !Array.isArray(messages) ||
        messages.length === 0
      ) {

        return api.sendMessage(
          `${header}\n\n⚠️ لم يتم العثور على رسائل للحذف.`,
          threadID,
          messageID
        );
      }

      // ------------------------------------------------
      // استخراج IDs مع استثناء رسالة الأمر
      // ------------------------------------------------

      const msgIDs =
        messages
          .filter(msg =>
            msg &&
            msg.messageID &&
            String(msg.messageID) !==
              String(messageID)
          )
          .map(msg =>
            msg.messageID
          );

      // ------------------------------------------------
      // حذف الرسائل
      // ------------------------------------------------

      let deletedCount = 0;

      for (
        const id of msgIDs
      ) {

        try {

          await api.unsendMessage(id);

          deletedCount++;

        } catch (e) {
          // تجاهل الرسائل التي تعذر حذفها
        }

        // تأخير بسيط بين عمليات الحذف
        await new Promise(
          resolve =>
            setTimeout(
              resolve,
              150
            )
        );
      }

      // ------------------------------------------------
      // النتيجة
      // ------------------------------------------------

      return api.sendMessage(
        `${header}\n\n✅ تم حذف ${deletedCount} رسالة.`,
        threadID,
        messageID
      );
    }

    // ==================================================
    // لا يوجد رقم أو رد
    // ==================================================

    return api.sendMessage(
      `${header}\n\n📝 الاستخدام:\n• حذف [عدد] (لحذف عدد من الرسائل)\n• حذف (رداً على رسالة) لحذفها\n• الحد الأقصى: 50 رسالة`,
      threadID,
      messageID
    );

  } catch (error) {

    return api.sendMessage(
      `${header}\n\n❌ حدث خطأ: ${error.message}`,
      threadID,
      messageID
    );
  }
};