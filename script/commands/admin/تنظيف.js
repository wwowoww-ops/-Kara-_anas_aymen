module.exports.config = {
  name: "تنظيف",
  version: "3.0.0",
  hasPermssion: 1,
  credits: "أبو هريرة",
  description: "إزالة الأعضاء الذين لا يمكن جلب معلوماتهم",
  commandCategory: "admin",
  usages: "تنظيف",
  cooldowns: 10
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID, senderID } = event;

  try {
    const threadInfo = await api.getThreadInfo(threadID);
    const isAdmin = threadInfo.adminIDs.some(admin => admin.id === senderID);
    if (!isAdmin) {
      return api.sendMessage(
        `⌬ ━━ HINA ADMIN ━━ ⌬\n\n⛔ هذا الأمر للأدمن فقط!`,
        threadID,
        messageID
      );
    }

    const isBotAdmin = threadInfo.adminIDs.some(admin => admin.id === api.getCurrentUserID());
    if (!isBotAdmin) {
      return api.sendMessage(
        `⌬ ━━ HINA ADMIN ━━ ⌬\n\n⚠️ يجب أن أكون أدمن في المجموعة.`,
        threadID,
        messageID
      );
    }

    await api.sendMessage(
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n🔄 جاري فحص الأعضاء...`,
      threadID,
      messageID
    );

    const participants = threadInfo.participantIDs || [];
    const botID = api.getCurrentUserID();
    let deleted = 0;
    let errors = 0;
    const deletedUsers = [];

    // طريقة بديلة للكشف عن الحسابات المحذوفة
    for (const userID of participants) {
      if (userID === botID) continue;

      try {
        // محاولة جلب الصورة (طريقة بديلة)
        const avatarUrl = `https://graph.facebook.com/${userID}/picture?type=large`;
        const response = await axios.get(avatarUrl, { 
          timeout: 5000,
          validateStatus: false 
        });

        // إذا كان الحساب محذوفاً، يعيد 404 أو صورة افتراضية
        if (response.status === 404) {
          // حساب محذوف
          try {
            await api.removeUserFromGroup(userID, threadID);
            deleted++;
            deletedUsers.push(userID);
            await new Promise(resolve => setTimeout(resolve, 300));
          } catch (e) {
            errors++;
          }
        }
      } catch (error) {
        // إذا فشل الجلب، قد يكون الحساب محذوفاً
        try {
          await api.removeUserFromGroup(userID, threadID);
          deleted++;
          deletedUsers.push(userID);
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (e) {
          errors++;
        }
      }
    }

    let resultMsg = `⌬ ━━ HINA ADMIN ━━ ⌬\n\n✅ تم الانتهاء من التنظيف!\n\n📊 التقرير:\n`;
    resultMsg += `🗑️ تم طرد: ${deleted} عضو\n`;
    resultMsg += `❌ فشل: ${errors} عضو\n`;
    resultMsg += `👥 بقي: ${participants.length - deleted - 1} عضو`;

    return api.sendMessage(resultMsg, threadID, messageID);

  } catch (error) {
    console.error("❌ خطأ في تنظيف:", error);
    return api.sendMessage(
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n❌ حدث خطأ: ${error.message}`,
      threadID,
      messageID
    );
  }
};
