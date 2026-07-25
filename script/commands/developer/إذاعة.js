const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "اذاعة",
  version: "2.0.0",
  hasPermssion: 2,
  credits: "أبو هريرة",
  description: "إرسال رسالة من المطور إلى جميع المجموعات",
  commandCategory: "developer",
  usages: "اذاعة [الرسالة]",
  cooldowns: 10
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const configPath = "./config.json";

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔑 التحقق من المطور
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const config = JSON.parse(fs.readFileSync(configPath));
  const devID = config.KIRA_CONF?.dev || config.ADMINBOT?.[0];

  if (senderID !== devID) {
    return api.sendMessage(
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n⛔ هذا الأمر للمطور الأساسي فقط!`,
      threadID,
      messageID
    );
  }

  const message = args.join(" ");
  if (!message) {
    return api.sendMessage(
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n📝 الاستخدام:\nاذاعة [الرسالة]\nمثال: اذاعة مرحباً جميعاً`,
      threadID,
      messageID
    );
  }

  try {
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📋 جلب قائمة المجموعات
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const threadList = await api.getThreadList(500, null, ["INBOX"]);
    const groups = threadList.filter(t => t.isGroup === true);
    
    if (groups.length === 0) {
      return api.sendMessage(
        `⌬ ━━ HINA ADMIN ━━ ⌬\n\n❌ لا توجد مجموعات متاحة.`,
        threadID,
        messageID
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📤 إرسال رسالة التأكيد
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    await api.sendMessage(
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n📤 جاري إرسال الرسالة إلى ${groups.length} مجموعة...\n\n📝 ${message}`,
      threadID,
      messageID
    );

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📨 إرسال الرسالة إلى كل مجموعة
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    let success = 0;
    let fail = 0;

    // جلب اسم المطور
    let devName = "أبو هريرة";
    try {
      const userInfo = await api.getUserInfo(devID);
      devName = userInfo[devID]?.name || "أبو هريرة";
    } catch (e) {}

    for (const group of groups) {
      try {
        await api.sendMessage(
          `⌬ ━━ HINA ADMIN ━━ ⌬\n\n📢 رسالة من المطور ${devName}:\n\n${message}`,
          group.threadID
        );
        success++;
        await new Promise(resolve => setTimeout(resolve, 800));
      } catch (e) {
        fail++;
        console.log(`❌ فشل الإرسال إلى ${group.threadID}: ${e.message}`);
      }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📊 التقرير النهائي
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    return api.sendMessage(
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n✅ تم إرسال الرسالة بنجاح!\n\n📊 التقرير:\n✅ نجح: ${success} مجموعة\n❌ فشل: ${fail} مجموعة\n📝 الرسالة: ${message}`,
      threadID,
      messageID
    );

  } catch (error) {
    console.error("❌ خطأ في اذاعة:", error);
    return api.sendMessage(
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n❌ حدث خطأ:\n${error.message}`,
      threadID,
      messageID
    );
  }
};