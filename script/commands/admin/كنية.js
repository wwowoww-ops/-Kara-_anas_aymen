module.exports.config = {
  name: "كنية",
  version: "3.2.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "تغيير كنية الأعضاء الذين لا يملكون كنية",
  commandCategory: "إدارة",
  usages: "كنية",
  cooldowns: 5
};

module.exports.run = async ({ api, event }) => {
  const { threadID, messageID, senderID } = event;

  // المطور الوحيد المسموح له باستخدام الأمر
  const ADMIN_ID = "61578581225040";

  // التحقق من المطور
  if (senderID !== ADMIN_ID) {
    return api.sendMessage(
      "هذا الأمر للمطور فقط",
      threadID,
      messageID
    );
  }

  try {
    const threadInfo = await api.getThreadInfo(threadID);

    if (!threadInfo || !threadInfo.participantIDs) {
      return api.sendMessage(
        "تعذر الحصول على معلومات المجموعة",
        threadID,
        messageID
      );
    }

    const participants = threadInfo.participantIDs;
    const botID = api.getCurrentUserID();

    let changed = 0;
    let skipped = 0;
    let errors = 0;

    for (const userID of participants) {

      // تجاهل البوت
      if (userID === botID) continue;

      // تجاهل المطور نفسه
      if (userID === ADMIN_ID) continue;

      try {
        const userInfo = await api.getUserInfo(userID);

        const name =
          userInfo[userID]?.name ||
          userInfo[userID]?.firstName ||
          "مستخدم";

        // الكنية الحالية
        const currentNickname =
          threadInfo.nicknames?.[userID] || "";

        // إذا لديه كنية مسبقًا لا نغيرها
        if (currentNickname.trim() !== "") {
          skipped++;
          continue;
        }

        // حماية اتجاه الاسم الإنجليزي
        const safeName = `\u200E${name}\u200E`;

        // الكنية الجديدة
        const newNickname =
          `※ ${safeName}「جـنــدي」【✯】※`;

        await api.changeNickname(
          newNickname,
          threadID,
          userID
        );

        changed++;

      } catch (error) {
        errors++;
        console.error(
          `خطأ في تغيير كنية ${userID}:`,
          error
        );
      }
    }

    return api.sendMessage(
      `تم تنفيذ الأمر\n\n` +
      `تم تغيير الكنية: ${changed}\n` +
      `تم تجاهل أصحاب الكنيات: ${skipped}\n` +
      `فشل: ${errors}`,
      threadID,
      messageID
    );

  } catch (error) {
    console.error("خطأ أمر كنية:", error);

    return api.sendMessage(
      "حدث خطأ أثناء تنفيذ الأمر",
      threadID,
      messageID
    );
  }
};