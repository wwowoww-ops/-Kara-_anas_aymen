module.exports.config = {
  name: "انقلاب",
  version: "1.0.0",
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

    // ══════════════════════════════════════════
    // التأكد أن البوت أدمن
    // ══════════════════════════════════════════
    const isBotAdmin = threadInfo.adminIDs.some(
      admin => admin.id === botID
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
      const id = admin.id;

      // إبقاء البوت والمطور
      return id !== botID && id !== DEVELOPER_ID;
    });

    if (adminsToRemove.length === 0) {
      return api.sendMessage(
        `⌬ ━━ HINA ADMIN ━━ ⌬\n\n👑 الانقلاب مكتمل بالفعل\n\nالمطور والبوت فقط هم الأدمن.`,
        threadID,
        messageID
      );
    }

    // ══════════════════════════════════════════
    // نزع الأدمن من الجميع
    // ══════════════════════════════════════════
    let success = 0;
    let failed = 0;

    for (const admin of adminsToRemove) {
      try {
        await api.changeAdminStatus(threadID, admin.id, false);
        success++; 
      } catch (error) {
        failed++;
        console.error(
          `خطأ في نزع الأدمن من ${admin.id}:`,
          error
        );
      }
    }

    // ══════════════════════════════════════════
    // النتيجة
    // ══════════════════════════════════════════
    return api.sendMessage(
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n` +
      `👑 تم تنفيذ الانقلاب بنجاح!\n\n` +
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
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n❌ حدث خطأ أثناء تنفيذ الانقلاب\n\n${error.message}`,
      threadID,
      messageID
    );
  }
};