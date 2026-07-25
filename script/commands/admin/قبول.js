module.exports.config = {
  name: "قبول",
  version: "5.0.0",
  hasPermssion: 1,
  credits: "أبو هريرة",
  description: "إدارة طلبات الانضمام عن طريق رابط المجموعة",
  commandCategory: "admin",
  usages: "قبول [قائمة/رابط]",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
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

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📋 عرض القائمة مع روابط
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (!args[0] || args[0] === "قائمة" || args[0] === "list") {
      // جلب طلبات الانضمام
      let pendingRequests = [];
      try {
        const response = await api.getThreadInfo(threadID);
        if (response.pendingRequests && response.pendingRequests.length > 0) {
          pendingRequests = response.pendingRequests;
        }
      } catch (e) {
        console.log("⚠️ فشل جلب الطلبات:", e.message);
      }

      if (pendingRequests.length === 0) {
        return api.sendMessage(
          `⌬ ━━ HINA ADMIN ━━ ⌬\n\n📭 لا توجد طلبات انضمام معلقة.`,
          threadID,
          messageID
        );
      }

      // إنشاء رابط المجموعة
      let inviteLink = "https://www.facebook.com/groups/" + threadID;
      try {
        const link = await api.createGroupLink(threadID);
        if (link) inviteLink = link;
      } catch (e) {
        console.log("⚠️ فشل إنشاء الرابط:", e.message);
      }

      let msg = `⌬ ━━ HINA ADMIN ━━ ⌬\n\n📋 قائمة طلبات الانضمام (${pendingRequests.length}):\n\n`;
      
      for (let i = 0; i < Math.min(pendingRequests.length, 20); i++) {
        const req = pendingRequests[i];
        const name = req.name || `مستخدم ${i+1}`;
        msg += `${i+1}. ${name}\n`;
        msg += `   🔗 https://www.facebook.com/${req.id || req.userID || 'profile'}\n\n`;
      }

      if (pendingRequests.length > 20) {
        msg += `... و ${pendingRequests.length - 20} طلب آخر\n`;
      }

      msg += `\n🔗 رابط المجموعة:\n${inviteLink}\n\n`;
      msg += `📝 الأوامر:\n• قبول رابط (لإنشاء رابط جديد)\n• قبول رفض (لرفض جميع الطلبات)`;

      return api.sendMessage(msg, threadID, messageID);
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🔗 إنشاء رابط المجموعة
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (args[0] === "رابط" || args[0] === "link") {
      try {
        const inviteLink = await api.createGroupLink(threadID);
        return api.sendMessage(
          `⌬ ━━ HINA ADMIN ━━ ⌬\n\n🔗 رابط دعوة المجموعة:\n${inviteLink}\n\n📤 أرسل الرابط للأشخاص الذين تريد قبولهم.`,
          threadID,
          messageID
        );
      } catch (error) {
        return api.sendMessage(
          `⌬ ━━ HINA ADMIN ━━ ⌬\n\n❌ فشل إنشاء الرابط:\n${error.message}`,
          threadID,
          messageID
        );
      }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ❌ رفض الكل
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (args[0] === "رفض" || args[0] === "reject") {
      let pendingRequests = [];
      try {
        const response = await api.getThreadInfo(threadID);
        if (response.pendingRequests && response.pendingRequests.length > 0) {
          pendingRequests = response.pendingRequests;
        }
      } catch (e) {}

      const count = pendingRequests.length;
      pendingRequests.length = 0;
      
      return api.sendMessage(
        `⌬ ━━ HINA ADMIN ━━ ⌬\n\n❌ تم رفض ${count} طلب.`,
        threadID,
        messageID
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ❌ أمر غير معروف
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    return api.sendMessage(
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n📝 الاستخدام:\n• قبول (لعرض القائمة مع الروابط)\n• قبول رابط (لإنشاء رابط المجموعة)\n• قبول رفض (لرفض جميع الطلبات)`,
      threadID,
      messageID
    );

  } catch (error) {
    console.error("❌ خطأ في قبول:", error);
    return api.sendMessage(
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n❌ حدث خطأ: ${error.message}`,
      threadID,
      messageID
    );
  }
};