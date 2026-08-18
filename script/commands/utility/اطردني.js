const fs = require("fs-extra");

module.exports.config = {
  name: "اطردني",
  version: "2.2.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "مغادرة المجموعة عبر الطرد",
  commandCategory: "utility",
  usages: "اطردني",
  cooldowns: 5
};

// ======================================================
// إرسال رسالة مؤقتة
// ======================================================

async function sendTemporaryMessage(api, threadID, text, time = 4000) {
  return new Promise(resolve => {
    api.sendMessage(text, threadID, (err, info) => {

      if (!err && info?.messageID) {
        setTimeout(() => {
          api.unsendMessage(info.messageID).catch(() => {});
        }, time);
      }

      resolve(info);
    });
  });
}

// ======================================================
// قراءة إعدادات البوت
// ======================================================

function getAdminID() {
  try {

    const configPath = "./config.json";

    if (!fs.existsSync(configPath)) {
      console.error("❌ config.json غير موجود");
      return null;
    }

    const config =
      JSON.parse(
        fs.readFileSync(
          configPath,
          "utf8"
        )
      );

    return (
      config?.KIRA_CONF?.dev ||
      config?.ADMINBOT?.[0] ||
      null
    );

  } catch (error) {

    console.error(
      "❌ خطأ في قراءة config.json:",
      error
    );

    return null;
  }
}

// ======================================================
// الحصول على اسم المستخدم
// ======================================================

async function getUserName(api, userID) {

  try {

    const info =
      await api.getUserInfo(
        String(userID)
      );

    return (
      info?.[String(userID)]?.name ||
      "حبيبي"
    );

  } catch (error) {

    return "حبيبي";
  }
}

// ======================================================
// تنفيذ الأمر
// ======================================================

module.exports.run = async function ({
  api,
  event
}) {

  const {
    threadID,
    senderID,
    messageID
  } = event;

  try {

    // ==================================================
    // حماية المطور
    // ==================================================

    const adminID =
      getAdminID();

    if (
      adminID &&
      String(senderID) ===
      String(adminID)
    ) {

      return sendTemporaryMessage(
        api,
        threadID,

`🥺 تعال يا أبو هريرة

مامي ما سمحتلك تخرج!

مين سمحلك تطلب الطرد؟

🛡️ أنت المطور، ما تطلعش غير بإذن مامي`
      );
    }

    // ==================================================
    // جلب معلومات المجموعة
    // ==================================================

    const threadInfo =
      await api.getThreadInfo(
        threadID
      );

    if (!threadInfo) {

      return sendTemporaryMessage(
        api,
        threadID,
`❌ تعذر الحصول على معلومات المجموعة.`
      );
    }

    // ==================================================
    // الحصول على ID البوت
    // ==================================================

    const botID =
      api.getCurrentUserID();

    // ==================================================
    // التأكد أن البوت أدمن
    // ==================================================

    const adminIDs =
      Array.isArray(threadInfo.adminIDs)
        ? threadInfo.adminIDs
        : [];

    const isBotAdmin =
      adminIDs.some(
        admin =>
          String(admin.id) ===
          String(botID)
      );

    if (!isBotAdmin) {

      return sendTemporaryMessage(
        api,
        threadID,

`🥺 تعال يا قلبي

مامي ما تقدر تخرجك لأني مش أدمن!

خلي أحد الأدمن يضيفني كمسؤول أولاً.`
      );
    }

    // ==================================================
    // الحصول على اسم المستخدم
    // ==================================================

    const userName =
      await getUserName(
        api,
        senderID
      );

    // ==================================================
    // رسالة الوداع
    // ==================================================

    await new Promise(resolve => {

      api.sendMessage(
`🥺 تعال يا ${userName}

مامي بتسلم عليك وتقولك:

"خلاص، أنت طلعت من المجموعة، بس افتكرني دايم 🌸"

💔 مع السلامة، نلتقي قريباً إن شاء الله`,
        threadID,
        () => resolve()
      );

    });

    // ==================================================
    // انتظار بسيط حتى تظهر رسالة الوداع
    // ==================================================

    await new Promise(
      resolve =>
        setTimeout(resolve, 1000)
    );

    // ==================================================
    // طرد المستخدم
    // ==================================================

    await api.removeUserFromGroup(
      String(senderID),
      String(threadID)
    );

    return;

  } catch (error) {

    // ==================================================
    // تسجيل الخطأ في Console
    // ==================================================

    console.error(
      "❌ خطأ في أمر اطردني:",
      error
    );

    // ==================================================
    // إرسال رسالة الخطأ
    // ==================================================

    return sendTemporaryMessage(
      api,
      threadID,

`🥺 مامي آسفة

حدث خطأ أثناء محاولة طردك.

تأكد أن البوت أدمن في المجموعة وحاول مرة أخرى.

❌ الخطأ:
${error?.message || "خطأ غير معروف"}`
    );
  }
};