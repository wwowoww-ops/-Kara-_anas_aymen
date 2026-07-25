module.exports.config = {
  name: "ممنوع_الكلام",
  version: "2.0.0",
  hasPermssion: 1,
  credits: "أبو هريرة",
  description: "منع أو السماح بالكلام في المجموعة (تقييد الأعضاء)",
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

  // التأكد من وجود ملف التقييد
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
  // تشغيل منع الكلام
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (args[0] === "تشغيل" || args[0] === "on") {
    // التأكد من أن البوت أدمن
    const isBotAdmin = threadInfo.adminIDs.some(admin => admin.id === api.getCurrentUserID());
    if (!isBotAdmin) {
      return api.sendMessage(
        `⌬ ━━ HINA ADMIN ━━ ⌬\n\n⚠️ يجب أن أكون أدمن في المجموعة لتطبيق هذا الأمر.`,
        threadID,
        messageID
      );
    }

    data[threadID].active = true;
    fs.writeFileSync(path, JSON.stringify(data, null, 2));
    
    return api.sendMessage(
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n🔇 تم تفعيل منع الكلام!\n\n🚫 لا يمكن لأي عضو التحدث الآن.\n📌 الأدمن فقط من يستطيع الكلام.\n\n🔓 للسماح بالكلام: ممنوع_الكلام إيقاف`,
      threadID,
      messageID
    );
  } 
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // إيقاف منع الكلام (السماح بالكلام)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  else if (args[0] === "إيقاف" || args[0] === "off") {
    data[threadID].active = false;
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
    const status = data[threadID].active ? "مفعل 🔇 (ممنوع الكلام)" : "معطل 🔊 (مسموح الكلام)";
    return api.sendMessage(
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n📊 حالة منع الكلام: ${status}\n\n📝 الاستخدام:\n• ممنوع_الكلام تشغيل (لمنع الكلام)\n• ممنوع_الكلام إيقاف (للسماح بالكلام)`,
      threadID,
      messageID
    );
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎯 معالج الرسائل (لمنع أو السماح بالكلام)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
module.exports.handleEvent = async function({ api, event }) {
  const { threadID, senderID, type } = event;
  const fs = require("fs");
  const path = "./data/mute.json";

  // التأكد من أن الحدث هو رسالة
  if (type !== "message" && type !== "message_reply") return;

  // قراءة ملف التقييد
  if (!fs.existsSync(path)) return;
  let data = JSON.parse(fs.readFileSync(path));

  // التأكد من تفعيل منع الكلام في هذه المجموعة
  if (!data[threadID] || !data[threadID].active) return;

  // التأكد من أن البوت أدمن
  try {
    const threadInfo = await api.getThreadInfo(threadID);
    const isBotAdmin = threadInfo.adminIDs.some(admin => admin.id === api.getCurrentUserID());
    if (!isBotAdmin) {
      console.log(`❌ البوت ليس أدمن في ${threadID}، لا يمكن تطبيق منع الكلام.`);
      return;
    }
  } catch (e) { return; }

  // التحقق من أن المرسل ليس أدمن
  try {
    const threadInfo = await api.getThreadInfo(threadID);
    const isSenderAdmin = threadInfo.adminIDs.some(admin => admin.id === senderID);
    
    // ✅ إذا كان المرسل أدمن، يسمح له بالكلام
    if (isSenderAdmin) return;
    
    // ❌ إذا كان المرسل ليس أدمن، يتم حذف رسالته
    if (event.messageID) {
      await api.unsendMessage(event.messageID);
      console.log(`🔇 تم حذف رسالة من ${senderID} في ${threadID}`);
    }
  } catch (e) { 
    console.log(`❌ خطأ في معالج منع الكلام:`, e);
  }
};