module.exports.config = {
  name: "قبول",
  version: "2.0.0",
  hasPermssion: 1,
  credits: "أبو هريرة",
  description: "إدارة طلبات انضمام الأعضاء للمجموعة",
  commandCategory: "admin",
  usages: "قبول [قائمة/رقم/الكل/رفض]",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
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
        `⌬ ━━ HINA ADMIN ━━ ⌬\n\n⚠️ يجب أن أكون أدمن في المجموعة لإدارة الطلبات.`,
        threadID,
        messageID
      );
    }

    // جلب طلبات الانضمام المعلقة
    const pendingRequests = threadInfo.pendingRequests || [];

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📋 عرض القائمة
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (!args[0] || args[0] === "قائمة" || args[0] === "list") {
      if (pendingRequests.length === 0) {
        return api.sendMessage(
          `⌬ ━━ HINA ADMIN ━━ ⌬\n\n📭 لا توجد طلبات انضمام معلقة.`,
          threadID,
          messageID
        );
      }

      let msg = `⌬ ━━ HINA ADMIN ━━ ⌬\n\n📋 قائمة طلبات الانضمام (${pendingRequests.length}):\n\n`;
      
      for (let i = 0; i < Math.min(pendingRequests.length, 20); i++) {
        const req = pendingRequests[i];
        const name = req.name || `مستخدم ${i+1}`;
        const id = req.id || req.userID || "غير معروف";
        msg += `${i+1}. ${name}\n`;
        msg += `   🆔 ${id}\n\n`;
      }

      if (pendingRequests.length > 20) {
        msg += `... و ${pendingRequests.length - 20} طلب آخر\n`;
      }

      msg += `\n📝 الأوامر:\n• قبول [رقم] (لقبول طلب معين)\n• قبول الكل (لقبول جميع الطلبات)\n• قبول رفض (لرفض جميع الطلبات)`;

      return api.sendMessage(msg, threadID, messageID);
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ✅ قبول طلب معين
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (!isNaN(args[0])) {
      const index = parseInt(args[0]) - 1;

      if (pendingRequests.length === 0) {
        return api.sendMessage(
          `⌬ ━━ HINA ADMIN ━━ ⌬\n\n📭 لا توجد طلبات انضمام.`,
          threadID,
          messageID
        );
      }

      if (index < 0 || index >= pendingRequests.length) {
        return api.sendMessage(
          `⌬ ━━ HINA ADMIN ━━ ⌬\n\n⚠️ رقم غير صحيح!\n📝 استخدم: قبول [رقم]`,
          threadID,
          messageID
        );
      }

      const target = pendingRequests[index];
      const userID = target.id || target.userID;
      const userName = target.name || "المستخدم";

      if (!userID) {
        return api.sendMessage(
          `⌬ ━━ HINA ADMIN ━━ ⌬\n\n❌ لا يمكن تحديد المستخدم.`,
          threadID,
          messageID
        );
      }

      try {
        await api.addUserToGroup(userID, threadID);
        // حذف الطلب من القائمة
        pendingRequests.splice(index, 1);
        
        return api.sendMessage(
          `⌬ ━━ HINA ADMIN ━━ ⌬\n\n✅ تم قبول ${userName} بنجاح!`,
          threadID,
          messageID
        );
      } catch (error) {
        return api.sendMessage(
          `⌬ ━━ HINA ADMIN ━━ ⌬\n\n❌ فشل قبول ${userName}:\n${error.message}`,
          threadID,
          messageID
        );
      }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ✅ قبول الكل
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (args[0] === "الكل" || args[0] === "all") {
      if (pendingRequests.length === 0) {
        return api.sendMessage(
          `⌬ ━━ HINA ADMIN ━━ ⌬\n\n📭 لا توجد طلبات انضمام.`,
          threadID,
          messageID
        );
      }

      let accepted = 0;
      let failed = 0;

      for (const req of pendingRequests) {
        const userID = req.id || req.userID;
        if (!userID) continue;

        try {
          await api.addUserToGroup(userID, threadID);
          accepted++;
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (e) {
          failed++;
          console.log(`❌ فشل قبول ${userID}:`, e.message);
        }
      }

      // مسح القائمة
      pendingRequests.length = 0;

      return api.sendMessage(
        `⌬ ━━ HINA ADMIN ━━ ⌬\n\n✅ تم قبول الطلبات!\n\n📊 التقرير:\n✅ تم قبول: ${accepted}\n❌ فشل: ${failed}`,
        threadID,
        messageID
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ❌ رفض الكل
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (args[0] === "رفض" || args[0] === "reject") {
      if (pendingRequests.length === 0) {
        return api.sendMessage(
          `⌬ ━━ HINA ADMIN ━━ ⌬\n\n📭 لا توجد طلبات انضمام.`,
          threadID,
          messageID
        );
      }

      // مسح القائمة (رفض الكل)
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
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n📝 الاستخدام:\n• قبول (لعرض القائمة)\n• قبول [رقم] (لقبول طلب معين)\n• قبول الكل (لقبول جميع الطلبات)\n• قبول رفض (لرفض جميع الطلبات)`,
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