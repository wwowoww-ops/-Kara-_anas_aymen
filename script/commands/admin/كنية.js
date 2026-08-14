module.exports.config = {
  name: "كنية",
  version: "2.0.0",
  hasPermssion: 1,  // ← غيرتها من 0 إلى 1
  credits: "أبو هريرة",
  description: "تغيير كنية جميع الأعضاء بتنسيق من اختيارك (للمطور فقط)",
  commandCategory: "إدارة",
  usages: "كنية [النص] أو كنية [النص] [رقم]",
  cooldowns: 5
};

module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID, senderID } = event;

  // ===== التحقق من المطور =====
  const ADMIN_ID = "61578581225040"; // ابو هريرة

  if (senderID !== ADMIN_ID) {
    return api.sendMessage(
      "🐿️ هذا الأمر للمطور فقط •-•",
      threadID,
      messageID
    );
  }

  // ===== قراءة المدخلات =====
  let customText = "طالب";
  let customNumber = "00";

  if (args.length > 0) {
    const input = args.join(" ");
    const numberMatch = input.match(/(\d+)$/);
    if (numberMatch) {
      customNumber = numberMatch[1].padStart(2, '0');
      customText = input.replace(/\s*\d+$/, '').trim();
    } else {
      customText = input;
    }
  }

  try {
    const threadInfo = await api.getThreadInfo(threadID);
    const participants = threadInfo.participantIDs;

    let count = 0;
    let errors = 0;
    const botID = api.getCurrentUserID();

    for (const userID of participants) {
      if (userID === botID) continue;

      try {
        const userInfo = await api.getUserInfo(userID);
        const name = userInfo[userID]?.firstName || userInfo[userID]?.name || "مستخدم";
        const newNickname = `•|${name} - ${customText}|• ${customNumber}`;
        await api.changeNickname(newNickname, threadID, userID);
        count++;
      } catch (e) {
        errors++;
      }
    }

    return api.sendMessage(
      `🐿️ تم تغيير كنية ${count} عضو\n📌 التنسيق: •|الاسم - ${customText}|• ${customNumber}\n❌ فشل ${errors} عضو`,
      threadID,
      messageID
    );

  } catch (error) {
    return api.sendMessage("🐿️ حدث خطأ أثناء تنفيذ الأمر •-•", threadID, messageID);
  }
};
