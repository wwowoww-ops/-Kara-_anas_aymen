module.exports.config = {
  name: "قبول",
  version: "3.0.0",
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

    const isBotAdmin = threadInfo.adminIDs.some(admin => admin.id === api.getCurrentUserID());
    if (!isBotAdmin) {
      return api.sendMessage(
        `⌬ ━━ HINA ADMIN ━━ ⌬\n\n⚠️ يجب أن أكون أدمن في المجموعة.`,
        threadID,
        messageID
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🔍 محاولة جلب الطلبات بطرق مختلفة
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    let pendingRequests = [];

    // الطريقة 1: من threadInfo.pendingRequests
    if (threadInfo.pendingRequests && threadInfo.pendingRequests.length > 0) {
      pendingRequests = threadInfo.pendingRequests;
    }

    // الطريقة 2: من threadInfo.approvalQueue
    if (threadInfo.approvalQueue && threadInfo.approvalQueue.length > 0) {
      pendingRequests = threadInfo.approvalQueue;
    }

    // الطريقة 3: محاولة جلب الطلبات يدوياً
    if (pendingRequests.length === 0) {
      try {
        // محاولة جلب طلبات الانضمام من API مباشر
        const response = await api.getThreadInfo(threadID);
        if (response.pendingRequests && response.pendingRequests.length > 0) {
          pendingRequests = response.pendingRequests;
        }
      } catch (e) {
        console.log("⚠️ فشل جلب الطلبات يدوياً:", e.message);
      }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📋 عرض القائمة
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (!args[0] || args[0] === "قائمة" || args[0] === "list") {
      if (pendingRequests.length === 0) {
        return api.sendMessage(
          `⌬ ━━ HINA ADMIN ━━ ⌬\n\n📭 لا توجد طلبات انضمام معلقة.\n\n💡 تأكد من:\n• أن البوت أدمن في المجموعة\n• أن المجموعة تحتاج موافقة للانضمام`,
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
          `⌬ ━━ HINA ADMIN ━━ ⌬\n\n⚠️ رقم غير صحيح!`,
          threadID,
          messageID
        );
      }

      const target = pendingRequests[index];
      const userID = target.id || target.userID;

      if (!userID) {
        return api.sendMessage(
          `⌬ ━━ HINA ADMIN ━━ ⌬\n\n❌ لا يمكن تحديد المستخدم.`,
          threadID,
          messageID
        );
      }

      try {
        await api.addUserToGroup(userID, threadID);
        return api.sendMessage(
          `⌬ ━━ HINA ADMIN ━━ ⌬\n\n✅ تم قبول ${target.name || "المستخدم"} بنجاح!`,
          threadID,
          messageID
        );
      } catch (error) {
        return api.sendMessage(
          `⌬ ━━ HINA ADMIN ━━ ⌬\n\n❌ فشل القبول: ${error.message}`,
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
          `⌬ ━━ HINA ADMIN ━━ ⌬\n\n📭 لا توجد طلبات.`,
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
        }
      }

      return api.sendMessage(
        `⌬ ━━ HINA ADMIN ━━ ⌬\n\n✅ تم قبول ${accepted} طلب.\n❌ فشل: ${failed}`,
        threadID,
        messageID
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ❌ رفض الكل
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (args[0] === "رفض" || args[0] === "reject") {
      const count = pendingRequests.length;
      pendingRequests.length = 0;
      return api.sendMessage(
        `⌬ ━━ HINA ADMIN ━━ ⌬\n\n❌ تم رفض ${count} طلب.`,
        threadID,
        messageID
      );
    }

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