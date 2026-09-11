module.exports.config = {
  name: "انقلاب",
  version: "1.1.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "نزع الأدمن من الجميع وترك المطور والبوت فقط",
  commandCategory: "admin",
  usages: "انقلاب",
  cooldowns: 10
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID, senderID } = event;

  // ══════════════════════════════════════════
  // المطور فقط
  // ══════════════════════════════════════════
  const DEVELOPER_ID = "61578581225040";

  if (senderID !== DEVELOPER_ID) {
    return api.sendMessage(
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n⛔ هذا الأمر للمطور فقط!`,
      threadID,
      messageID
    );
  }

  try {
    // ══════════════════════════════════════════
    // معلومات المجموعة
    // ══════════════════════════════════════════
    const threadInfo = await api.getThreadInfo(threadID);
    const botID = api.getCurrentUserID();

    if (!threadInfo || !Array.isArray(threadInfo.adminIDs)) {
      return api.sendMessage(
        `⌬ ━━ HINA ADMIN ━━ ⌬\n\n❌ تعذر الحصول على قائمة الأدمن.`,
        threadID,
        messageID
      );
    }

    // ══════════════════════════════════════════
    // التأكد أن البوت أدمن
    // ══════════════════════════════════════════
    const isBotAdmin = threadInfo.adminIDs.some(
      admin => String(admin.id) === String(botID)
    );

    if (!isBotAdmin) {
      return api.sendMessage(
        `⌬ ━━ HINA ADMIN ━━ ⌬\n\n⚠️ يجب أن أكون أدمن في المجموعة لتنفيذ الانقلاب.`,
        threadID,
        messageID
      );
    }

    // ══════════════════════════════════════════
    // تحديد الأدمن الذين سيتم نزع صلاحيتهم
    // ══════════════════════════════════════════
    const adminsToRemove = threadInfo.adminIDs.filter(admin => {
      const id = String(admin.id);

      // إبقاء البوت والمطور
      return id !== String(botID) && id !== String(DEVELOPER_ID);
    });

    // ══════════════════════════════════════════
    // لا يوجد أدمن آخرون
    // ══════════════════════════════════════════
    if (adminsToRemove.length === 0) {
      return api.sendMessage(
        `⌬ ━━ HINA ADMIN ━━ ⌬\n\n👑 الانقلاب مكتمل بالفعل\n\nالمطور والبوت فقط هم الأدمن.`,
        threadID,
        messageID
      );
    }

    // ══════════════════════════════════════════
    // نزع الأدمن من الجميع في نفس الوقت
    // ══════════════════════════════════════════
    const results = await Promise.allSettled(
      adminsToRemove.map(admin =>
        api.changeAdminStatus(
          threadID,
          admin.id,
          false
        )
      )
    );

    // ══════════════════════════════════════════
    // حساب النتائج
    // ══════════════════════════════════════════
    let success = 0;
    let failed = 0;

    for (const result of results) {
      if (result.status === "fulfilled") {
        success++;
      } else {
        failed++;
        console.error(
          "❌ فشل نزع أحد الأدمن:",
          result.reason
        );
      }
    }

    // ══════════════════════════════════════════
    // النتيجة
    // ══════════════════════════════════════════
    return api.sendMessage(
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n` +
      `👑 تم تنفيذ الانقلاب!\n\n` +
      `🛡️ تمت إزالة الأدمن من: ${success}\n` +
      `⚠️ فشل إزالة: ${failed}\n\n` +
      `👑 المطور: محفوظ\n` +
      `🤖 البوت: محفوظ\n\n` +
      `⌬ ━━━━━━━━━━━━━━━ ⌬`,
      threadID,
      messageID
    );

  } catch (error) {
    console.error("❌ خطأ في أمر انقلاب:", error);

    return api.sendMessage(
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n` +
      `❌ حدث خطأ أثناء تنفيذ الانقلاب\n\n` +
      `${error.message || error}`,
      threadID,
      messageID
    );
  }
};