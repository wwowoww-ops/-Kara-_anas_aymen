const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "1000-7",
  version: "2.5.0",
  hasPermssion: 1,
  credits: "أبو هريرة",
  description: "طرد وإضافة العضو مع عد تنازلي 1000-7",
  commandCategory: "admin",
  usages: "1000-7 (رد على رسالة العضو)",
  cooldowns: 10
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID, messageReply } = event;

  try {
    const threadInfo = await api.getThreadInfo(threadID);
    const isAdmin = threadInfo.adminIDs.some(admin => admin.id === senderID);
    const isBotAdmin = threadInfo.adminIDs.some(admin => admin.id === api.getCurrentUserID());

    if (!isAdmin) {
      return api.sendMessage(
        `⌬ ━━ HINA ━━ ⌬\n\n⛔ هذا الأمر للأدمن فقط!`,
        threadID,
        messageID
      );
    }

    if (!isBotAdmin) {
      return api.sendMessage(
        `⌬ ━━ HINA ━━ ⌬\n\n⚠️ يجب أن أكون أدمن في المجموعة لاستخدام هذا الأمر`,
        threadID,
        messageID
      );
    }

    let targetID;

    if (messageReply) {
      targetID = messageReply.senderID;
    } else {
      return api.sendMessage(
        `⌬ ━━ HINA ━━ ⌬\n\n📝 الاستخدام:\n• قم بالرد على رسالة العضو ثم اكتب 1000-7`,
        threadID,
        messageID
      );
    }

    if (!targetID) {
      return api.sendMessage(
        `⌬ ━━ HINA ━━ ⌬\n\n❌ لم يتم تحديد العضو المستهدف.`,
        threadID,
        messageID
      );
    }

    // ═══════════════════════════════════════════════
    // 🛡️ حماية المطور
    // ═══════════════════════════════════════════════
    const DEV_ID = "61578581225040";
    
    if (targetID === DEV_ID) {
      return api.sendMessage(
        `⌬ ━━ HINA ━━ ⌬\n\n🛡️ لا يمكن طرد المطور!`,
        threadID,
        messageID
      );
    }

    if (targetID === api.getCurrentUserID()) {
      return api.sendMessage(
        `⌬ ━━ HINA ━━ ⌬\n\n😅 لا يمكنني طرد نفسي!`,
        threadID,
        messageID
      );
    }

    // جلب اسم العضو
    let userName = "العضو";
    try {
      const userInfo = await api.getUserInfo(targetID);
      userName = userInfo[targetID]?.name || "العضو";
    } catch (e) {}

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🎯 العد التنازلي 1000-7
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    let count = 1000;
    const maxIterations = 150; // 1000 / 7 ≈ 143 تكرار

    for (let i = 0; i < maxIterations; i++) {
      if (count < 0) break;

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // 📨 إرسال الرسالة النصية
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      const messageBody = `⌬ ━━ HINA ━━ ⌬\n\n🔥 جارٍ تنفيذ الأمر 1000-7 🔥\n\n💰 العدد: ${count}\n📌 ${userName}\n🆔 ${targetID}\n\n♻️ جارٍ الطرد والإضافة...`;

      await api.sendMessage(messageBody, threadID);

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // 🚫 طرد العضو
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      await api.removeUserFromGroup(targetID, threadID);
      
      // ⏳ تأخير نصف ثانية
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // ➕ إضافة العضو مرة أخرى
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      await api.addUserToGroup(targetID, threadID);
      
      // ⏳ تأخير نصف ثانية
      await new Promise(resolve => setTimeout(resolve, 500));

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // 🔢 طرح 7 من العدد
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      count -= 7;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🏁 رسالة النهاية
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    await api.sendMessage(
      `⌬ ━━ HINA ━━ ⌬\n\n✅ اكتمل العد التنازلي 1000-7!\n\n📌 تم طرد وإضافة ${userName} ${Math.ceil(1000/7)} مرة!`,
      threadID
    );

  } catch (error) {
    console.error("❌ خطأ في 1000-7:", error);
    
    try {
      await api.sendMessage(
        `⌬ ━━ HINA ━━ ⌬\n\n❌ حدث خطأ أثناء تنفيذ الأمر.`,
        threadID,
        messageID
      );
    } catch (e) {
      console.error("❌ فشل حتى في الرسالة النصية:", e);
    }
  }
};