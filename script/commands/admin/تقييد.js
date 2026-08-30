module.exports.config = {
  name: "تقييد",
  version: "3.0.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "تقييد أو تشغيل البوت في المجموعة للأدمن والمطور",
  commandCategory: "admin",
  usages: "تقييد",
  cooldowns: 5
};

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID, senderID } = event;

  const fs = require("fs");
  const path = "./data/stop.json";

  // ==========================================
  // المطور من config.json
  // ==========================================

  const ADMINBOT = Array.isArray(global.config.ADMINBOT)
    ? global.config.ADMINBOT.map(id => String(id))
    : [];

  const isDeveloper = ADMINBOT.includes(String(senderID));

  // ==========================================
  // التحقق من أدمن المجموعة
  // ==========================================

  let isGroupAdmin = false;

  try {
    const threadInfo = await api.getThreadInfo(threadID);

    if (threadInfo && Array.isArray(threadInfo.adminIDs)) {
      isGroupAdmin = threadInfo.adminIDs.some(
        admin => String(admin.id) === String(senderID)
      );
    }
  } catch (error) {
    console.error("❌ خطأ فحص صلاحية الأدمن:", error);
  }

  // ==========================================
  // السماح للأدمن أو المطور
  // ==========================================

  if (!isDeveloper && !isGroupAdmin) {
    return api.sendMessage(
      `⌬ ━━ 𝗛𝗜𝗡𝗔 𝗔𝗗𝗠𝗜𝗡 ━━ ⌬

⛔ هذا الأمر مخصص لأدمن المجموعة والمطور فقط`,
      threadID,
      messageID
    );
  }

  // ==========================================
  // إنشاء مجلد data إذا لم يكن موجودًا
  // ==========================================

  if (!fs.existsSync("./data")) {
    fs.mkdirSync("./data", { recursive: true });
  }

  // ==========================================
  // إنشاء ملف التقييد
  // ==========================================

  if (!fs.existsSync(path)) {
    fs.writeFileSync(path, JSON.stringify({}, null, 2));
  }

  let data = {};

  try {
    data = JSON.parse(fs.readFileSync(path, "utf8"));
  } catch (error) {
    console.error("❌ خطأ قراءة stop.json:", error);

    return api.sendMessage(
      `⌬ ━━ 𝗛𝗜𝗡𝗔 ━━ ⌬

❌ حدث خطأ أثناء قراءة بيانات التقييد`,
      threadID,
      messageID
    );
  }

  // ==========================================
  // الحالة الحالية
  // ==========================================

  if (!data[threadID]) {
    data[threadID] = {
      active: false
    };
  }

  const currentStatus = data[threadID].active;
  const newStatus = !currentStatus;

  data[threadID].active = newStatus;

  // ==========================================
  // حفظ الحالة
  // ==========================================

  fs.writeFileSync(
    path,
    JSON.stringify(data, null, 2),
    "utf8"
  );

  // ==========================================
  // النتيجة
  // ==========================================

  if (newStatus) {
    return api.sendMessage(
      `⌬ ━━ 𝗛𝗜𝗡𝗔 𝗔𝗗𝗠𝗜𝗡 ━━ ⌬

🔒 تم تقييد البوت في هذه المجموعة

البوت لن يستجيب للأوامر حتى يتم إلغاء التقييد

📌 استخدم "تقييد" مرة أخرى لإلغاء التقييد`,
      threadID,
      messageID
    );
  }

  return api.sendMessage(
    `⌬ ━━ 𝗛𝗜𝗡𝗔 𝗔𝗗𝗠𝗜𝗡 ━━ ⌬

🔓 تم إلغاء تقييد البوت

البوت يعمل الآن بشكل طبيعي في هذه المجموعة`,
    threadID,
    messageID
  );
};