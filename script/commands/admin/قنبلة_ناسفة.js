module.exports.config = {
  name: ["قنبلة_ناسفة", "كيرو"],
  version: "1.0.0",
  hasPermssion: 1,
  credits: "أبو هريرة",
  description: "طرد جميع الأعضاء عدا الأدمن (تأخير 100 مللي)",
  commandCategory: "admin",
  usages: "قنبلة_ناسفة / كيرو",
  cooldowns: 30
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  try {
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ✅ التحقق من صلاحيات الأدمن
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📋 جلب قائمة الأعضاء
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const participants = threadInfo.participantIDs;
    const adminIDs = threadInfo.adminIDs.map(admin => admin.id);
    
    // استثناء البوت نفسه
    const botID = api.getCurrentUserID();
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🎯 تحديد المستهدفين (غير الأدمن)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const targets = participants.filter(id => 
      !adminIDs.includes(id) && id !== botID
    );

    if (targets.length === 0) {
      return api.sendMessage(
        `⌬ ━━ HINA ━━ ⌬\n\n✅ لا يوجد أعضاء غير أدمن لطردهم!`,
        threadID,
        messageID
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 💣 تأكيد قبل التفجير
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    await api.sendMessage(
      `⌬ ━━ HINA ━━ ⌬\n\n💣 جارٍ تفعيل القنبلة الناسفة!\n\n⚠️ سيتم طرد ${targets.length} عضو غير أدمن.\n\n🕒 جارٍ التنفيذ...`,
      threadID
    );

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 💥 تفجير القنبلة (طرد جميع المستهدفين)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    let kickedCount = 0;
    let failedCount = 0;

    for (const userID of targets) {
      try {
        await api.removeUserFromGroup(userID, threadID);
        kickedCount++;
        
        // ⏳ تأخير 100 ميلي ثانية (0.1 ثانية) بين كل عملية طرد
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        failedCount++;
        console.log(`❌ فشل طرد ${userID}:`, error.message);
      }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📊 تقرير النتيجة
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    await api.sendMessage(
      `⌬ ━━ HINA ━━ ⌬\n\n💥 تم تفعيل القنبلة الناسفة بنجاح!\n\n✅ تم طرد: ${kickedCount} عضو\n❌ فشل طرد: ${failedCount} عضو\n\n🛡️ تم استثناء الأدمن والبوت.`,
      threadID
    );

  } catch (error) {
    console.error("❌ خطأ في أمر القنبلة الناسفة:", error);
    
    await api.sendMessage(
      `⌬ ━━ HINA ━━ ⌬\n\n❌ حدث خطأ أثناء تنفيذ الأمر.`,
      threadID,
      messageID
    );
  }
};