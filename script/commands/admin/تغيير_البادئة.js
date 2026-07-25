module.exports.config = {
  name: "تغيير_البادئة",
  version: "2.0.0",
  hasPermssion: 1,
  credits: "أبو هريرة",
  description: "تغيير بادئة البوت في المجموعة",
  commandCategory: "admin",
  usages: "تغيير_البادئة [الرمز الجديد]",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const fs = require("fs");
  const path = "./data/prefix.json";

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

  // التأكد من وجود ملف البادئات
  if (!fs.existsSync(path)) {
    fs.writeFileSync(path, JSON.stringify({}));
  }

  let data = JSON.parse(fs.readFileSync(path));

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // عرض البادئة الحالية
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (!args[0]) {
    const currentPrefix = data[threadID] || global.config.PREFIX || ".";
    return api.sendMessage(
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n🔑 البادئة الحالية: ${currentPrefix}\n\n📝 لتغييرها: تغيير_البادئة [الرمز الجديد]\nمثال: تغيير_البادئة !`,
      threadID,
      messageID
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // تغيير البادئة
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const newPrefix = args[0];
  
  // منع البادئة الفارغة أو الطويلة جداً
  if (newPrefix.length > 5) {
    return api.sendMessage(
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n⚠️ البادئة لا يمكن أن تزيد عن 5 أحرف.`,
      threadID,
      messageID
    );
  }

  // حفظ البادئة الجديدة
  const oldPrefix = data[threadID] || global.config.PREFIX || ".";
  data[threadID] = newPrefix;
  fs.writeFileSync(path, JSON.stringify(data, null, 2));

  // تحديث البادئة في الذاكرة
  if (global.data.threadData) {
    if (!global.data.threadData.has(threadID)) {
      global.data.threadData.set(threadID, {});
    }
    const threadData = global.data.threadData.get(threadID);
    threadData.PREFIX = newPrefix;
    global.data.threadData.set(threadID, threadData);
  }

  return api.sendMessage(
    `⌬ ━━ HINA ADMIN ━━ ⌬\n\n✅ تم تغيير البادئة بنجاح!\n\n🔑 البادئة القديمة: ${oldPrefix}\n🔑 البادئة الجديدة: ${newPrefix}\n\n🔄 سيتم تطبيقها فوراً على جميع الأوامر.`,
    threadID,
    messageID
  );
};