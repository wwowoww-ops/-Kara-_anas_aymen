module.exports.config = {
  name: "ممنوع_الكلام",
  version: "3.0.0",
  hasPermssion: 1,
  credits: "أبو هريرة",
  description: "منع الكلام مع تحذير تلقائي للمخالفين",
  commandCategory: "admin",
  usages: "ممنوع_الكلام [تشغيل/إيقاف]",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const fs = require("fs");
  const path = "./data/mute.json";

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

  if (!fs.existsSync(path)) {
    fs.writeFileSync(path, JSON.stringify({}));
  }

  let data = JSON.parse(fs.readFileSync(path));

  if (!data[threadID]) {
    data[threadID] = {
      active: false,
      warnings: {}
    };
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // تشغيل منع الكلام
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (args[0] === "تشغيل" || args[0] === "on") {
    const isBotAdmin = threadInfo.adminIDs.some(admin => admin.id === api.getCurrentUserID());
    if (!isBotAdmin) {
      return api.sendMessage(
        `⌬ ━━ HINA ADMIN ━━ ⌬\n\n⚠️ يجب أن أكون أدمن في المجموعة لتطبيق هذا الأمر.`,
        threadID,
        messageID
      );
    }

    data[threadID].active = true;
    data[threadID].warnings = {};
    fs.writeFileSync(path, JSON.stringify(data, null, 2));
    
    return api.sendMessage(
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n🔇 تم تفعيل منع الكلام!\n\n🚫 لا يمكن لأي عضو التحدث الآن.\n📌 الأدمن فقط من يستطيع الكلام.\n⚠️ المخالف سيحصل على تحذير تلقائي.\n\n🔓 للسماح بالكلام: ممنوع_الكلام إيقاف`,
      threadID,
      messageID
    );
  } 
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // إيقاف منع الكلام
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  else if (args[0] === "إيقاف" || args[0] === "off") {
    data[threadID].active = false;
    data[threadID].warnings = {};
    fs.writeFileSync(path, JSON.stringify(data, null, 2));
    
    return api.sendMessage(
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n🔊 تم إيقاف منع الكلام!\n\n✅ يمكن للأعضاء التحدث الآن.`,
      threadID,
      messageID
    );
  } 
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // عرض الحالة
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  else {
    const status = data[threadID].active ? "مفعل 🔇" : "معطل 🔊";
    return api.sendMessage(
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n📊 حالة منع الكلام: ${status}\n\n📝 الاستخدام:\n• ممنوع_الكلام تشغيل (لمنع الكلام)\n• ممنوع_الكلام إيقاف (للسماح بالكلام)`,
      threadID,
      messageID
    );
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎯 معالج الرسائل (مع تحذير تلقائي)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
module.exports.handleEvent = async function({ api, event }) {
  const { threadID, senderID, type, messageID } = event;
  const fs = require("fs");
  const path = "./data/mute.json";
  const warningsPath = "./warnings.json";

  if (type !== "message" && type !== "message_reply") return;

  if (!fs.existsSync(path)) return;
  let data = JSON.parse(fs.readFileSync(path));

  if (!data[threadID] || !data[threadID].active) return;

  try {
    const threadInfo = await api.getThreadInfo(threadID);
    const isBotAdmin = threadInfo.adminIDs.some(admin => admin.id === api.getCurrentUserID());
    if (!isBotAdmin) return;

    const isSenderAdmin = threadInfo.adminIDs.some(admin => admin.id === senderID);
    if (isSenderAdmin) return;

    // حذف الرسالة
    if (event.messageID) {
      await api.unsendMessage(event.messageID);
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📝 نظام التحذير التلقائي
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // تهيئة ملف التحذيرات
    if (!fs.existsSync(warningsPath)) {
      fs.writeFileSync(warningsPath, JSON.stringify({}));
    }

    let warningsData = JSON.parse(fs.readFileSync(warningsPath));

    if (!warningsData[threadID]) {
      warningsData[threadID] = {};
    }

    if (!warningsData[threadID][senderID]) {
      warningsData[threadID][senderID] = [];
    }

    // جلب اسم العضو
    let userName = "العضو";
    try {
      const userInfo = await api.getUserInfo(senderID);
      userName = userInfo[senderID]?.name || "العضو";
    } catch (e) {}

    // إضافة تحذير جديد
    warningsData[threadID][senderID].push({
      reason: "🔇 مخالفة منع الكلام (تحدث أثناء التقييد)",
      time: new Date().toLocaleString("ar")
    });

    const warningCount = warningsData[threadID][senderID].length;

    fs.writeFileSync(warningsPath, JSON.stringify(warningsData, null, 2));

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🚨 إرسال تحذير للعضو
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    await api.sendMessage(
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n🔇 تم حذف رسالتك لأن الكلام ممنوع!\n\n👤 ${userName}\n📌 السبب: التحدث أثناء التقييد\n🔢 عدد التحذيرات: ${warningCount}/3\n\n⚠️ عند وصولك إلى 3 تحذيرات، سيتم طردك تلقائياً.`,
      threadID
    );

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🚫 الطرد التلقائي بعد 3 تحذيرات
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    if (warningCount >= 3) {
      // حذف تحذيرات العضو بعد الطرد
      delete warningsData[threadID][senderID];
      fs.writeFileSync(warningsPath, JSON.stringify(warningsData, null, 2));

      // طرد العضو
      try {
        await api.removeUserFromGroup(senderID, threadID);
        await api.sendMessage(
          `⌬ ━━ HINA ADMIN ━━ ⌬\n\n🚫 تم طرد ${userName} من المجموعة!\n\n📌 سبب الطرد: تجاوز 3 تحذيرات بسبب مخالفة منع الكلام.`,
          threadID
        );
        console.log(`🚫 تم طرد ${userName} (${senderID}) بسبب 3 تحذيرات`);
      } catch (error) {
        console.error(`❌ فشل طرد العضو ${senderID}:`, error);
      }
    }

  } catch (error) {
    console.error("❌ خطأ في معالج منع الكلام:", error);
  }
};