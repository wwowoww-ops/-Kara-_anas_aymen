const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "حماية_ادمن",
  version: "1.0.0",
  hasPermssion: 1,
  credits: "أبو هريرة",
  description: "تفعيل أو إيقاف حماية الأدمن (منع نزع الأدمن من أي شخص)",
  commandCategory: "admin",
  usages: "حماية_ادمن [تشغيل/إيقاف]",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const path = "./data/protect_admin.json";

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

  // التأكد من أن البوت أدمن
  const isBotAdmin = threadInfo.adminIDs.some(admin => admin.id === api.getCurrentUserID());
  if (!isBotAdmin) {
    return api.sendMessage(
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n⚠️ يجب أن أكون أدمن في المجموعة لاستخدام هذا الأمر.`,
      threadID,
      messageID
    );
  }

  // التأكد من وجود ملف الحماية
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
  // تشغيل حماية الأدمن
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (args[0] === "تشغيل" || args[0] === "on") {
    data[threadID].active = true;
    fs.writeFileSync(path, JSON.stringify(data, null, 2));
    
    return api.sendMessage(
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n🛡️ تم تفعيل حماية الأدمن!\n\n🔒 لن يتمكن أي شخص من نزع الأدمن من أي عضو.\n🔓 سيتم إعادة الأدمن تلقائياً.\n\n📝 لإيقافها: حماية_ادمن إيقاف`,
      threadID,
      messageID
    );
  } 
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // إيقاف حماية الأدمن
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  else if (args[0] === "إيقاف" || args[0] === "off") {
    data[threadID].active = false;
    fs.writeFileSync(path, JSON.stringify(data, null, 2));
    
    return api.sendMessage(
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n🔓 تم إيقاف حماية الأدمن.\n\n✅ يمكن الآن نزع الأدمن من الأعضاء.`,
      threadID,
      messageID
    );
  } 
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // عرض الحالة
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  else {
    const status = data[threadID].active ? "مفعل 🛡️" : "معطل 🔓";
    return api.sendMessage(
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n📊 حالة حماية الأدمن: ${status}\n\n📝 الاستخدام:\n• حماية_ادمن تشغيل (لتفعيل الحماية)\n• حماية_ادمن إيقاف (لإلغاء الحماية)`,
      threadID,
      messageID
    );
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎯 معالج الأحداث (لمنع نزع الأدمن)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
module.exports.handleEvent = async function({ api, event }) {
  const { threadID, logMessageData, logMessageType, author } = event;
  const fs = require("fs");
  const path = "./data/protect_admin.json";

  // التأكد من أن الحدث هو نزع أدمن
  if (logMessageType !== "log:thread-admins") return;

  // قراءة ملف الحماية
  if (!fs.existsSync(path)) return;
  let data = JSON.parse(fs.readFileSync(path));

  // التأكد من تفعيل الحماية في هذه المجموعة
  if (!data[threadID] || !data[threadID].active) return;

  // التأكد من أن البوت أدمن
  try {
    const threadInfo = await api.getThreadInfo(threadID);
    const isBotAdmin = threadInfo.adminIDs.some(admin => admin.id === api.getCurrentUserID());
    if (!isBotAdmin) {
      console.log(`❌ البوت ليس أدمن في ${threadID}، لا يمكن تطبيق حماية الأدمن.`);
      return;
    }
  } catch (e) { return; }

  // التحقق من أن الحدث هو نزع أدمن (وليس إضافة)
  if (logMessageData.adminIDs && logMessageData.adminIDs.length > 0) {
    // إذا كان هناك أدمن تم نزعه
    const removedAdmin = logMessageData.adminIDs[0];
    if (!removedAdmin) return;

    // التأكد من أن الشخص الذي نزع الأدمن ليس البوت نفسه
    if (author === api.getCurrentUserID()) return;

    // إعادة الأدمن للشخص
    try {
      await api.changeAdminStatus(threadID, removedAdmin, true);
      console.log(`🛡️ تم إعادة الأدمن للعضو ${removedAdmin} في ${threadID}`);
      
      // جلب اسم العضو
      let userName = "العضو";
      try {
        const userInfo = await api.getUserInfo(removedAdmin);
        userName = userInfo[removedAdmin]?.name || "العضو";
      } catch (e) {}

      // إرسال إشعار
      await api.sendMessage(
        `⌬ ━━ HINA ADMIN ━━ ⌬\n\n🛡️ تم إعادة الأدمن للعضو ${userName}!\n\n🔒 حماية الأدمن مفعلة، لا يمكن نزع الأدمن من أي شخص.`,
        threadID
      );
    } catch (error) {
      console.error(`❌ فشل إعادة الأدمن للعضو ${removedAdmin}:`, error);
    }
  }
};