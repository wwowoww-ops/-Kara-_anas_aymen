module.exports.config = {
  name: "اذاعة",
  version: "1.0.0",
  hasPermssion: 2,
  credits: "أبو هريرة",
  description: "إرسال رسالة إلى جميع المجموعات التي فيها البوت",
  commandCategory: "developer",
  usages: "اذاعة [الرسالة]",
  cooldowns: 10
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const fs = require("fs");
  const path = "./config.json";

  // التحقق من المطور
  const config = JSON.parse(fs.readFileSync(path));
  const devID = config.KIRA_CONF?.dev || config.ADMINBOT?.[0];

  if (senderID !== devID) {
    return api.sendMessage(
      `⌬ ━━ HINA ━━ ⌬\n\n⛔ هذا الأمر للمطور الأساسي فقط!\nأنت لست مخولاً لاستخدامه.`,
      threadID,
      messageID
    );
  }

  const message = args.join(" ");
  if (!message) {
    return api.sendMessage(
      `⌬ ━━ HINA ━━ ⌬\n\n📝 الاستخدام:\nاذاعة [الرسالة]\nمثال: اذاعة مرحباً جميعاً`,
      threadID,
      messageID
    );
  }

  try {
    // جلب قائمة المجموعات
    const threadList = await api.getThreadList(500, null, ["INBOX"]);
    const groups = threadList.filter(t => t.isGroup === true);
    
    if (groups.length === 0) {
      return api.sendMessage(
        `⌬ ━━ HINA ━━ ⌬\n\n❌ لا توجد مجموعات متاحة.`,
        threadID,
        messageID
      );
    }

    // إرسال رسالة التأكيد
    api.sendMessage(
      `⌬ ━━ HINA ━━ ⌬\n\n📤 جاري إرسال الرسالة إلى ${groups.length} مجموعة...\n\n📝 ${message}`,
      threadID,
      messageID
    );

    let success = 0;
    let fail = 0;

    // إرسال الرسالة إلى كل مجموعة
    for (const group of groups) {
      try {
        await api.sendMessage(
          `⌬ ━━ HINA ━━ ⌬\n\n📢 رسالة من المطور:\n\n${message}`,
          group.threadID
        );
        success++;
        // تأخير بسيط لتجنب الحظر
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (e) {
        fail++;
        console.log(`❌ فشل الإرسال إلى ${group.threadID}: ${e.message}`);
      }
    }

    // إرسال التقرير النهائي
    return api.sendMessage(
      `⌬ ━━ HINA ━━ ⌬\n\n✅ تم إرسال الرسالة بنجاح!\n\n📊 التقرير:\n✅ نجح: ${success} مجموعة\n❌ فشل: ${fail} مجموعة\n📝 الرسالة: ${message}`,
      threadID,
      messageID
    );

  } catch (error) {
    console.error("اذاعة - خطأ:", error);
    return api.sendMessage(
      `⌬ ━━ HINA ━━ ⌬\n\n❌ حدث خطأ:\n${error.message}`,
      threadID,
      messageID
    );
  }
};
