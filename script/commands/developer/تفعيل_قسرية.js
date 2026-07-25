const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "تفعيل_قسرية",
  version: "1.0.0",
  hasPermssion: 2,
  credits: "أبو هريرة",
  description: "تفعيل البوت في مجموعة قسراً (للمطور فقط)",
  commandCategory: "developer",
  usages: "تفعيل_قسرية [معرف المجموعة]",
  cooldowns: 5
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
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n⛔ هذا الأمر للمطور فقط!`,
      threadID,
      messageID
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🎯 تحديد المجموعة المستهدفة
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const targetID = args[0] || threadID;

  if (!targetID) {
    return api.sendMessage(
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n📝 الاستخدام: تفعيل_قسرية [معرف المجموعة]\nمثال: تفعيل_قسرية 123456789`,
      threadID,
      messageID
    );
  }

  try {
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📊 جلب معلومات المجموعة
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const threadInfo = await api.getThreadInfo(targetID);
    const botID = api.getCurrentUserID();
    const isBotAdmin = threadInfo.adminIDs.some(admin => admin.id === botID);

    let msg = `⌬ ━━ HINA ADMIN ━━ ⌬\n\n✅ تم تفعيل المجموعة قسراً:\n\n`;
    msg += `📌 اسم المجموعة: ${threadInfo.name || "بدون اسم"}\n`;
    msg += `🆔 معرف المجموعة: ${targetID}\n`;
    msg += `👥 عدد الأعضاء: ${threadInfo.participantIDs.length}\n`;
    msg += `🔑 البوت أدمن: ${isBotAdmin ? "✅ نعم" : "❌ لا"}\n\n`;

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🗑️ إزالة جميع القيود
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const files = [
      { path: "./data/restrict.json", key: "التقييد" },
      { path: "./data/mute.json", key: "منع الكلام" },
      { path: "./data/banned.json", key: "الحظر" }
    ];

    let removed = 0;
    for (const file of files) {
      if (fs.existsSync(file.path)) {
        const data = JSON.parse(fs.readFileSync(file.path));
        if (data[targetID]) {
          if (file.key === "الحظر") {
            delete data[targetID];
          } else {
            data[targetID].active = false;
          }
          fs.writeFileSync(file.path, JSON.stringify(data, null, 2));
          msg += `✅ تم إلغاء ${file.key}\n`;
          removed++;
        }
      }
    }

    if (removed === 0) {
      msg += `ℹ️ لا توجد قيود على هذه المجموعة\n`;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🗄️ تحديث قاعدة البيانات
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    try {
      const { Threads } = require("../../includes/database");
      const threadData = await Threads.getData(targetID);
      if (threadData) {
        const data = threadData.data || {};
        data.banned = false;
        await Threads.setData(targetID, { data });
        msg += `✅ تم تحديث قاعدة البيانات\n`;
      }
    } catch (e) {
      msg += `⚠️ فشل تحديث قاعدة البيانات: ${e.message}\n`;
    }

    msg += `\n🔓 يمكن للبوت العمل الآن في هذه المجموعة.`;

    return api.sendMessage(msg, threadID, messageID);

  } catch (error) {
    console.error("❌ خطأ في تفعيل_قسرية:", error);
    return api.sendMessage(
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n❌ فشل تفعيل المجموعة:\n${error.message}`,
      threadID,
      messageID
    );
  }
};