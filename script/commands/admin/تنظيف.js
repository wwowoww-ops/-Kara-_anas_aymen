module.exports.config = {
  name: "تنظيف",
  version: "1.0.0",
  hasPermssion: 1,
  credits: "أبو هريرة",
  description: "إزالة الأعضاء الذين حساباتهم محذوفة من المجموعة",
  commandCategory: "admin",
  usages: "تنظيف",
  cooldowns: 10
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID, senderID } = event;

  try {
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

    // إرسال رسالة البدء
    await api.sendMessage(
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n🔄 جاري فحص الأعضاء...`,
      threadID,
      messageID
    );

    // جلب قائمة الأعضاء
    const participants = threadInfo.participantIDs;
    const botID = api.getCurrentUserID();
    let deleted = 0;
    let errors = 0;
    const deletedUsers = [];

    // فحص كل عضو
    for (const userID of participants) {
      // تخطي البوت نفسه
      if (userID === botID) continue;

      try {
        // محاولة جلب معلومات العضو
        const userInfo = await api.getUserInfo(userID);
        
        // إذا كان العضو موجوداً، نمرره
        if (userInfo[userID]) continue;
        
      } catch (error) {
        // إذا فشل جلب المعلومات، يعني أن الحساب محذوف
        try {
          // محاولة طرد العضو
          await api.removeUserFromGroup(userID, threadID);
          deleted++;
          deletedUsers.push(userID);
          
          // تأخير بسيط لتجنب الحظر
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (e) {
          errors++;
          console.log(`❌ فشل طرد ${userID}:`, e.message);
        }
      }
    }

    // بناء رسالة النتيجة
    let resultMsg = `⌬ ━━ HINA ADMIN ━━ ⌬\n\n✅ تم الانتهاء من التنظيف!\n\n`;
    resultMsg += `📊 التقرير:\n`;
    resultMsg += `🗑️ تم طرد: ${deleted} عضو (حسابات محذوفة)\n`;
    resultMsg += `❌ فشل: ${errors} عضو\n`;
    resultMsg += `👥 بقي: ${participants.length - deleted - 1} عضو`;

    if (deletedUsers.length > 0) {
      resultMsg += `\n\n🆔 المعرفات المطرودة:\n`;
      deletedUsers.slice(0, 20).forEach(id => {
        resultMsg += `• ${id}\n`;
      });
      if (deletedUsers.length > 20) {
        resultMsg += `... و ${deletedUsers.length - 20} آخرين`;
      }
    }

    return api.sendMessage(resultMsg, threadID, messageID);

  } catch (error) {
    console.error("❌ خطأ في تنظيف:", error);
    return api.sendMessage(
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n❌ حدث خطأ أثناء التنظيف:\n${error.message}`,
      threadID,
      messageID
    );
  }
};
