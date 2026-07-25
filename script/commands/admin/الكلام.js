const fs = require("fs");
const path = "./data/noTalk.json";

module.exports.config = {
  name: "الكلام",
  version: "2.0.0",
  hasPermssion: 1,
  credits: "أبو هريرة",
  description: "منع أو السماح بالكلام في المجموعة مع تحذير المخالفين",
  commandCategory: "admin",
  usages: "الكلام ممنوع / الكلام مسموح",
  cooldowns: 3
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

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

  // التأكد من وجود مجلد data
  if (!fs.existsSync("./data")) {
    fs.mkdirSync("./data");
  }

  if (!fs.existsSync(path)) {
    fs.writeFileSync(path, JSON.stringify({}));
  }

  let data = JSON.parse(fs.readFileSync(path));

  if (args[0] === "ممنوع" || args[0] === "منع") {
    // التأكد من أن البوت أدمن
    const isBotAdmin = threadInfo.adminIDs.some(admin => admin.id === api.getCurrentUserID());
    if (!isBotAdmin) {
      return api.sendMessage(
        `⌬ ━━ HINA ADMIN ━━ ⌬\n\n⚠️ يجب أن أكون أدمن في المجموعة لمنع الكلام.`,
        threadID,
        messageID
      );
    }

    data[threadID] = {
      enabled: true,
      time: Date.now(),
      warnings: {}
    };

    fs.writeFileSync(path, JSON.stringify(data, null, 2));

    return api.sendMessage(
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n🔇 تم منع الكلام في المجموعة!\n\n🚫 أي عضو يرسل رسالة سيتم تحذيره.\n📌 الأدمن فقط يستطيع الكلام.\n\n🔓 للسماح: الكلام مسموح`,
      threadID,
      messageID
    );

  } else if (args[0] === "مسموح" || args[0] === "سماح") {
    delete data[threadID];
    fs.writeFileSync(path, JSON.stringify(data, null, 2));

    return api.sendMessage(
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n🔊 تم السماح بالكلام في المجموعة!\n\n✅ يمكن للأعضاء التحدث الآن.`,
      threadID,
      messageID
    );

  } else {
    const status = data[threadID] && data[threadID].enabled ? "🔇 ممنوع" : "🔊 مسموح";
    return api.sendMessage(
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n📊 حالة الكلام: ${status}\n\n📝 الاستخدام:\n• الكلام ممنوع (لمنع الكلام)\n• الكلام مسموح (للسماح بالكلام)`,
      threadID,
      messageID
    );
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎯 معالج الأحداث (لمنع الكلام وتحذير المخالفين)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
module.exports.handleEvent = async function({ api, event }) {
  const { threadID, senderID, type, messageID, body } = event;

  // التأكد من أن الحدث هو رسالة
  if (type !== "message" && type !== "message_reply") return;

  // قراءة ملف منع الكلام
  const fs = require("fs");
  const path = "./data/noTalk.json";
  const warningsPath = "./warnings.json";

  if (!fs.existsSync(path)) return;
  let data = JSON.parse(fs.readFileSync(path));

  // التأكد من تفعيل منع الكلام في هذه المجموعة
  if (!data[threadID] || !data[threadID].enabled) return;

  try {
    // التحقق من أن البوت أدمن
    const threadInfo = await api.getThreadInfo(threadID);
    const isBotAdmin = threadInfo.adminIDs.some(admin => admin.id === api.getCurrentUserID());
    if (!isBotAdmin) {
      console.log(`❌ البوت ليس أدمن في ${threadID}`);
      return;
    }

    // التحقق من أن المرسل ليس أدمن
    const isSenderAdmin = threadInfo.adminIDs.some(admin => admin.id === senderID);
    if (isSenderAdmin) return;

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🗑️ حذف الرسالة
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (messageID) {
      try {
        await api.unsendMessage(messageID);
        console.log(`🔇 تم حذف رسالة من ${senderID} في ${threadID}`);
      } catch (e) {
        console.log(`❌ فشل حذف الرسالة: ${e.message}`);
      }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📝 نظام التحذير التلقائي
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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
      reason: "🔇 مخالفة منع الكلام",
      time: new Date().toLocaleString("ar")
    });

    const warningCount = warningsData[threadID][senderID].length;

    fs.writeFileSync(warningsPath, JSON.stringify(warningsData, null, 2));

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🚨 إرسال تحذير للعضو
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    try {
      await api.sendMessage(
        `⌬ ━━ HINA ADMIN ━━ ⌬\n\n🔇 تم حذف رسالتك لأن الكلام ممنوع!\n\n👤 ${userName}\n📌 السبب: التحدث أثناء منع الكلام\n🔢 عدد التحذيرات: ${warningCount}/3\n\n⚠️ عند وصولك إلى 3 تحذيرات، سيتم طردك تلقائياً.`,
        threadID
      );
    } catch (e) {
      console.log(`❌ فشل إرسال تحذير: ${e.message}`);
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🚫 الطرد التلقائي بعد 3 تحذيرات
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (warningCount >= 3) {
      delete warningsData[threadID][senderID];
      fs.writeFileSync(warningsPath, JSON.stringify(warningsData, null, 2));

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
