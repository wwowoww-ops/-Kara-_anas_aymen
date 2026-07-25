module.exports.config = {
  name: "قبول",
  version: "2.0.0",
  hasPermssion: 1,
  credits: "أبو هريرة",
  description: "قبول طلبات الانضمام المعلقة في المجموعة",
  commandCategory: "admin",
  usages: "قبول [الكل/رقم]",
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
        `⌬ ━━ HINA ADMIN ━━ ⌬\n\n⚠️ يجب أن أكون أدمن في المجموعة لقبول الطلبات.`,
        threadID,
        messageID
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // جلب قائمة طلبات الانضمام
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    let pendingRequests = [];
    try {
      // محاولة جلب الطلبات المعلقة
      const requests = await api.getThreadInfo(threadID);
      pendingRequests = requests.pendingRequests || [];
    } catch (e) {
      // إذا لم تكن المجموعة تحتاج موافقة
      return api.sendMessage(
        `⌬ ━━ HINA ADMIN ━━ ⌬\n\nℹ️ هذه المجموعة لا تحتاج إلى موافقة للانضمام.\nأو لا توجد طلبات معلقة.`,
        threadID,
        messageID
      );
    }

    if (pendingRequests.length === 0) {
      return api.sendMessage(
        `⌬ ━━ HINA ADMIN ━━ ⌬\n\nℹ️ لا توجد طلبات انضمام معلقة.`,
        threadID,
        messageID
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // عرض قائمة الطلبات
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (!args[0] || args[0] === "قائمة") {
      let msg = `⌬ ━━ HINA ADMIN ━━ ⌬\n\n📋 قائمة طلبات الانضمام (${pendingRequests.length}):\n\n`;
      
      for (let i = 0; i < Math.min(pendingRequests.length, 20); i++) {
        const req = pendingRequests[i];
        const name = req.name || `مستخدم ${i+1}`;
        const id = req.id || req.userID || "غير معروف";
        msg += `${i+1}. ${name}\n   🆔 ${id}\n\n`;
      }

      if (pendingRequests.length > 20) {
        msg += `... و ${pendingRequests.length - 20} طلب آخر`;
      }

      msg += `\n📝 استخدم:\n• قبول الكل (لقبول جميع الطلبات)\n• قبول [رقم] (لقبول طلب معين)`;

      return api.sendMessage(msg, threadID, messageID);
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // قبول جميع الطلبات
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (args[0] === "الكل" || args[0] === "all") {
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

      return api.sendMessage(
        `⌬ ━━ HINA ADMIN ━━ ⌬\n\n✅ تم قبول الطلبات!\n\n📊 التقرير:\n✅ تم قبول: ${accepted}\n❌ فشل: ${failed}`,
        threadID,
        messageID
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // قبول طلب معين برقمه
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const index = parseInt(args[0]) - 1;
    if (isNaN(index) || index < 0 || index >= pendingRequests.length) {
      return api.sendMessage(
        `⌬ ━━ HINA ADMIN ━━ ⌬\n\n⚠️ رقم غير صحيح!\n📝 استخدم: قبول [رقم] أو قبول الكل`,
        threadID,
        messageID
      );
    }

    const targetReq = pendingRequests[index];
    const userID = targetReq.id || targetReq.userID;
    const userName = targetReq.name || "المستخدم";

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
        `⌬ ━━ HINA ADMIN ━━ ⌬\n\n✅ تم قبول ${userName} بنجاح!`,
        threadID,
        messageID
      );
    } catch (e) {
      return api.sendMessage(
        `⌬ ━━ HINA ADMIN ━━ ⌬\n\n❌ فشل قبول ${userName}:\n${e.message}`,
        threadID,
        messageID
      );
    }

  } catch (error) {
    console.error("❌ خطأ في قبول:", error);
    return api.sendMessage(
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n❌ حدث خطأ:\n${error.message}`,
      threadID,
      messageID
    );
  }
};
