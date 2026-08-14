const fs = require("fs-extra");

module.exports.config = {
  name: "طلبات",
  version: "1.3.0",
  hasPermssion: 2,
  credits: "أبو هريرة",
  description: "إدارة طلبات المجموعات للمطور فقط",
  commandCategory: "developer",
  usages: "طلبات",
  cooldowns: 5
};

// جلب ID المطور
function getDevID() {
  try {
    const config = JSON.parse(
      fs.readFileSync("./config.json", "utf8")
    );

    return config.KIRA_CONF?.dev || config.ADMINBOT?.[0];
  } catch (error) {
    console.error("❌ خطأ في قراءة config.json:", error);
    return null;
  }
}

// التحقق من المطور
function isDeveloper(senderID) {
  const devID = getDevID();

  if (!devID) return false;

  return String(senderID) === String(devID);
}


// =====================================================
// handleReply
// =====================================================

module.exports.handleReply = async function ({
  api,
  event,
  handleReply
}) {
  const {
    threadID,
    messageID,
    senderID,
    body = ""
  } = event;

  // التحقق من المطور
  if (!isDeveloper(senderID)) {
    return api.sendMessage(
      `⌬ ━━ HINA ADMIN ━━ ⌬

⛔ هذا الأمر للمطور الأساسي فقط!`,
      threadID,
      messageID
    );
  }

  const args = body.trim().split(/\s+/);

  const action = args[0]?.toLowerCase();

  const nums = args
    .slice(1)
    .map(n => Number(n))
    .filter(n => Number.isInteger(n) && n > 0);

  // التحقق من الأمر
  if (
    !["قبول", "رفض", "اوافق", "ارفض"].includes(action) ||
    nums.length === 0
  ) {
    return api.sendMessage(
      `⌬ ━━ HINA ADMIN ━━ ⌬

⚠️ الاستخدام:

قبول [رقم]
رفض [رقم]

مثال:
قبول 1 2 3`,
      threadID,
      messageID
    );
  }

  let msg = `⌬ ━━ HINA ADMIN ━━ ⌬\n\n`;

  let accepted = 0;
  let rejected = 0;
  let notFound = 0;

  try {

    for (const num of nums) {

      const item = handleReply.listRequest?.[num - 1];

      if (!item) {
        msg += `⚠️ الطلب رقم ${num} غير موجود\n`;
        notFound++;
        continue;
      }


      // =================================================
      // قبول المجموعة
      // =================================================

      if (action === "قبول" || action === "اوافق") {

        try {

          // إرسال رسالة القبول
          await api.sendMessage(
            `⌬ ━━ HINA ADMIN ━━ ⌬

✅ تم قبول المجموعة بنجاح!
شكراً لإضافتي.`,
            item.threadID
          );

          /*
           * مهم:
           * لا نستخدم removeUserFromGroup هنا
           *
           * لأن البوت يجب أن يبقى داخل المجموعة بعد القبول.
           */

          msg += `✅ تم قبول: ${item.name}\n`;

          accepted++;

        } catch (error) {

          console.error(
            `❌ فشل قبول المجموعة ${item.threadID}:`,
            error
          );

          msg += `❌ فشل قبول: ${item.name}\n`;
        }
      }


      // =================================================
      // رفض المجموعة
      // =================================================

      else if (action === "رفض" || action === "ارفض") {

        try {

          // إرسال رسالة الرفض أولاً
          await api.sendMessage(
            `⌬ ━━ HINA ADMIN ━━ ⌬

❌ تم رفض طلب المجموعة.
سيتم مغادرة المجموعة.`,
            item.threadID
          );

          // إخراج البوت من المجموعة
          await api.removeUserFromGroup(
            api.getCurrentUserID(),
            item.threadID
          );

          msg += `❌ تم رفض: ${item.name}\n`;

          rejected++;

        } catch (error) {

          console.error(
            `❌ فشل رفض المجموعة ${item.threadID}:`,
            error
          );

          msg += `⚠️ فشل رفض: ${item.name}\n`;
        }
      }
    }


    // حذف رسالة قائمة الطلبات
    if (handleReply.messageID) {

      try {

        await api.unsendMessage(
          handleReply.messageID
        );

      } catch (error) {

        console.log(
          "⚠️ تعذر حذف رسالة قائمة الطلبات:",
          error.message
        );
      }
    }


    // التقرير
    msg += `\n📊 التقرير:

✅ مقبول: ${accepted}
❌ مرفوض: ${rejected}
⚠️ غير موجود: ${notFound}`;

    return api.sendMessage(
      msg,
      threadID,
      messageID
    );

  } catch (error) {

    console.error(
      "❌ خطأ في handleReply:",
      error
    );

    return api.sendMessage(
      `⌬ ━━ HINA ADMIN ━━ ⌬

❌ حدث خطأ:
${error.message}`,
      threadID,
      messageID
    );
  }
};


// =====================================================
// run
// =====================================================

module.exports.run = async function ({
  api,
  event
}) {

  const {
    threadID,
    messageID,
    senderID
  } = event;


  // التحقق من المطور
  if (!isDeveloper(senderID)) {

    return api.sendMessage(
      `⌬ ━━ HINA ADMIN ━━ ⌬

⛔ هذا الأمر للمطور الأساسي فقط!`,
      threadID,
      messageID
    );
  }


  try {

    // =================================================
    // جلب الطلبات
    // =================================================

    const pending =
      await api.getThreadList(
        100,
        null,
        ["PENDING"]
      ) || [];

    const other =
      await api.getThreadList(
        100,
        null,
        ["OTHER"]
      ) || [];


    // دمج النتائج
    const combined = [
      ...pending,
      ...other
    ];


    // =================================================
    // إزالة التكرار
    // =================================================

    const seen = new Set();

    const all = combined.filter(t => {

      if (!t?.threadID) {
        return false;
      }

      if (seen.has(t.threadID)) {
        return false;
      }

      seen.add(t.threadID);

      // فقط المجموعات
      return t.isGroup === true;
    });


    // =================================================
    // لا توجد طلبات
    // =================================================

    if (all.length === 0) {

      return api.sendMessage(
        `⌬ ━━ HINA ADMIN ━━ ⌬

📭 لا توجد طلبات مجموعات حالياً.`,
        threadID,
        messageID
      );
    }


    // =================================================
    // إنشاء القائمة
    // =================================================

    let msg =
      `⌬ ━━ HINA ADMIN ━━ ⌬

📋 قائمة طلبات المجموعات (${all.length}):

`;

    const listRequest = [];


    for (let i = 0; i < all.length; i++) {

      const t = all[i];

      const name =
        t.name ||
        t.threadName ||
        "مجموعة مجهولة";

      const members =
        Array.isArray(t.participantIDs)
          ? t.participantIDs.length
          : 0;


      msg +=
        `${i + 1}. ${name} (${members} عضو)\n`;


      listRequest.push({
        threadID: t.threadID,
        name
      });
    }


    // تعليمات الرد
    msg +=
      `\n📝 رد بـ:

قبول [رقم]
أو
رفض [رقم]

مثال:
قبول 1 2 3`;


    // =================================================
    // إرسال القائمة وحفظ handleReply
    // =================================================

    return api.sendMessage(
      msg,
      threadID,
      (err, info) => {

        if (err) {

          console.error(
            "❌ خطأ في إرسال قائمة الطلبات:",
            err
          );

          return;
        }


        if (!global.client.handleReply) {
          global.client.handleReply = [];
        }


        global.client.handleReply.push({

          name: module.exports.config.name,

          messageID: info.messageID,

          author: senderID,

          listRequest: listRequest
        });

      },
      messageID
    );

  } catch (error) {

    console.error(
      "❌ خطأ في أمر طلبات:",
      error
    );

    return api.sendMessage(
      `⌬ ━━ HINA ADMIN ━━ ⌬

❌ حدث خطأ:
${error.message}`,
      threadID,
      messageID
    );
  }
};
