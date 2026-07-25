module.exports.config = {
  name: "تنظيف",
  version: "2.0.0",
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
    const participants = threadInfo.participantIDs || [];
    const botID = api.getCurrentUserID();
    let deleted = 0;
    let errors = 0;
    let skipped = 0;
    const deletedUsers = [];

    // فحص كل عضو
    for (let i = 0; i < participants.length; i++) {
      const userID = participants[i];
      
      // تخطي البوت نفسه
      if (userID === botID) continue;

      try {
        // محاولة جلب معلومات العضو
        const userInfo = await api.getUserInfo(userID);
        
        // إذا كان العضو موجوداً، نمرره
        if (userInfo && userInfo[userID]) {
          continue;
        }
        
      } catch (error) {
        // إذا فشل جلب المعلومات، قد يكون الحساب محذوفاً
        // نتحقق من نوع الخطأ
        const errorMsg = error.message || error.toString();
        
        // إذا كان الخطأ يشير إلى أن الحساب غير موجود
        if (errorMsg.includes("Not Found") || 
            errorMsg.includes("not found") || 
            errorMsg.includes("This user") ||
            errorMsg.includes("User") && errorMsg.includes("not") ||
            errorMsg.includes("does not exist") ||
            errorMsg.includes("unavailable") ||
            errorMsg.includes("deactivated")) {
          
          try {
            // محاولة طرد العضو
            await api.removeUserFromGroup(userID, threadID);
            deleted++;
            deletedUsers.push(userID);
            
            // تأخير بسيط لتجنب الحظر
            await new Promise(resolve => setTimeout(resolve, 300));
            
          } catch (e) {
            errors++;
            console.log(`❌ فشل طرد ${userID}:`, e.message);
          }
        } else {
          // أخطاء أخرى (مشكلة في الاتصال)
          skipped++;
          console.log(`⚠️ تخطي ${userID}:`, error.message);
        }
      }

      // تحديث التقدم كل 10 أعضاء
      if (i % 10 === 0 && i > 0) {
        await api.sendMessage(
          `⌬ ━━ HINA ADMIN ━━ ⌬\n\n🔄 جاري التنظيف... ${Math.round((i/participants.length)*100)}%`,
          threadID,
          messageID
        );
      }
    }

    // بناء رسالة النتيجة
    let resultMsg = `⌬ ━━ HINA ADMIN ━━ ⌬\n\n✅ تم الانتهاء من التنظيف!\n\n📊 التقرير:\n`;
    resultMsg += `🗑️ تم طرد: ${deleted} عضو (حسابات محذوفة)\n`;
    resultMsg += `❌ فشل: ${errors} عضو\n`;
    resultMsg += `⚠️ تم تخطي: ${skipped} عضو (أخطاء أخرى)\n`;
    resultMsg += `👥 بقي: ${participants.length - deleted - 1} عضو`;

    if (deletedUsers.length > 0) {
      resultMsg += `\n\n🆔 المعرفات المطرودة (${deletedUsers.length}):\n`;
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
