module.exports.config = {
  name: "كف",
  version: "2.0.0",
  hasPermssion: 1,
  credits: "أبو هريرة",
  description: "إيقاف البوت مؤقتاً في المجموعة (للأدمن)",
  commandCategory: "admin",
  usages: "كف",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const fs = require("fs");
  const path = "./data/stop.json";

  // التحقق من صلاحية الأدمن
  const threadInfo = await api.getThreadInfo(threadID);
  const isAdmin = threadInfo.adminIDs.some(admin => admin.id === senderID);
  if (!isAdmin) {
    return api.sendMessage(
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n⛔ هذا الأمر للأدمن فقط!`,
      threadID,
      messageID
    );
  }

  // التأكد من وجود ملف الإيقاف
  if (!fs.existsSync(path)) {
    fs.writeFileSync(path, JSON.stringify({}));
  }

  let data = JSON.parse(fs.readFileSync(path));

  if (!data[threadID]) {
    data[threadID] = {
      active: false
    };
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔄 عكس حالة الإيقاف (Toggle)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const currentStatus = data[threadID].active;
  const newStatus = !currentStatus;

  data[threadID].active = newStatus;
  fs.writeFileSync(path, JSON.stringify(data, null, 2));

  if (newStatus) {
    return api.sendMessage(
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n🛑 تم إيقاف البوت!\n\n🚫 البوت متوقف عن العمل في هذه المجموعة.\n📌 استخدم: كف مرة أخرى للتشغيل`,
      threadID,
      messageID
    );
  } else {
    return api.sendMessage(
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n✅ تم تشغيل البوت!\n\n🔓 البوت يعمل الآن في هذه المجموعة.`,
      threadID,
      messageID
    );
  }
};