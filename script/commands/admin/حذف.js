module.exports.config = {
  name: "حذف",
  version: "1.0.0",
  hasPermssion: 1,
  credits: "أبو هريرة",
  description: "حذف رسالة معينة أو عدد من الرسائل",
  commandCategory: "admin",
  usages: "حذف [عدد] أو حذف [رداً على رسالة]",
  cooldowns: 5
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
        `⌬ ━━ HINA ━━ ⌬\n\n⚠️ يجب أن أكون أدمن في المجموعة لحذف الرسائل.`,
        threadID,
        messageID
      );
    }

    // حالة 1: حذف رسالة محددة (رد على رسالة)
    if (messageReply) {
      await api.unsendMessage(messageReply.messageID);
      return api.sendMessage(
        `⌬ ━━ HINA ━━ ⌬\n\n✅ تم حذف الرسالة المحددة.`,
        threadID,
        messageID
      );
    }

    // حالة 2: حذف عدد من الرسائل
    const num = parseInt(args[0]);
    if (num && num > 0 && num <= 50) {
      const messages = await api.getThreadHistory(threadID, num);
      const msgIDs = messages.map(msg => msg.messageID);
      
      // حذف الرسائل (باستثناء رسالة الأمر)
      const filtered = msgIDs.filter(id => id !== messageID);
      
      for (const id of filtered) {
        try {
          await api.unsendMessage(id);
        } catch (e) {
          // تجاهل الأخطاء (قد تكون رسائل قديمة)
        }
      }
      
      return api.sendMessage(
        `⌬ ━━ HINA ━━ ⌬\n\n✅ تم حذف ${filtered.length} رسالة.`,
        threadID,
        messageID
      );
    }

    // إذا لم يحدد المستخدم شيئاً
    return api.sendMessage(
      `⌬ ━━ HINA ━━ ⌬\n\n📝 الاستخدام:\n• حذف [عدد] (لحذف عدد من الرسائل)\n• حذف (رداً على رسالة) لحذفها\n• الحد الأقصى: 50 رسالة`,
      threadID,
      messageID
    );

  } catch (error) {
    console.error("حذف - خطأ:", error);
    return api.sendMessage(
      `⌬ ━━ HINA ━━ ⌬\n\n❌ حدث خطأ: ${error.message}`,
      threadID,
      messageID
    );
  }
};
