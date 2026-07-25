module.exports.config = {
  name: "اقهريه",
  version: "1.0.0",
  hasPermssion: 1,
  credits: "أبو هريرة",
  description: "نزع الأدمن من شخص في المجموعة (بالرد أو المنشن)",
  commandCategory: "admin",
  usages: "اقهريه [@منشن] أو رد على رسالة العضو",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID, mentions, messageReply } = event;

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
        `⌬ ━━ HINA ADMIN ━━ ⌬\n\n⚠️ يجب أن أكون أدمن في المجموعة لنزع الأدمن.`,
        threadID,
        messageID
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // تحديد المستهدف (منشن أو رد)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    let targetID;
    let userName = "العضو";

    if (messageReply) {
      targetID = messageReply.senderID;
      try {
        const userInfo = await api.getUserInfo(targetID);
        userName = userInfo[targetID]?.name || "العضو";
      } catch (e) {}
    } else if (Object.keys(mentions).length > 0) {
      targetID = Object.keys(mentions)[0];
      userName = mentions[targetID].replace("@", "");
    } else {
      return api.sendMessage(
        `⌬ ━━ HINA ADMIN ━━ ⌬\n\n📝 الاستخدام:\n• اقهريه @منشن\n• أو رد على رسالة العضو`,
        threadID,
        messageID
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // منع نزع الأدمن من البوت أو المطور
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (targetID === api.getCurrentUserID()) {
      return api.sendMessage(
        `⌬ ━━ HINA ADMIN ━━ ⌬\n\n😅 لا يمكنني نزع الأدمن من نفسي!`,
        threadID,
        messageID
      );
    }

    // التحقق من المطور
    const fs = require("fs");
    const config = JSON.parse(fs.readFileSync("./config.json"));
    const devID = config.KIRA_CONF?.dev || config.ADMINBOT?.[0];
    
    if (targetID === devID) {
      return api.sendMessage(
        `⌬ ━━ HINA ADMIN ━━ ⌬\n\n🛡️ لا يمكن نزع الأدمن من المطور الأساسي!`,
        threadID,
        messageID
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // التحقق من أن العضو ليس أدمن
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const isAlreadyAdmin = threadInfo.adminIDs.some(admin => admin.id === targetID);
    if (!isAlreadyAdmin) {
      return api.sendMessage(
        `⌬ ━━ HINA ADMIN ━━ ⌬\n\nℹ️ ${userName} ليس أدمن في المجموعة.`,
        threadID,
        messageID
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 👑 نزع الأدمن من العضو
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    await api.changeAdminStatus(threadID, targetID, false);

    // رسائل مضحكة
    const funnyReplies = [
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n💔 تم نزع الأدمن من ${userName}!\n\n🫡 رجع مكانه الطبيعي.`,
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n😈 ${userName} انتهى عهد الأدمن!\n\n🔥 رجع للصفوف الخلفية.`,
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n👑 تم نزع تاج الأدمن عن ${userName}!\n\n😢 مع السلامة يا أدمن.`,
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n⚡️ ${userName} طار من منصب الأدمن!\n\n💨 يلا يا عادي.`
    ];
    const randomReply = funnyReplies[Math.floor(Math.random() * funnyReplies.length)];

    return api.sendMessage(randomReply, threadID, messageID);

  } catch (error) {
    console.error("❌ خطأ في اقهريه:", error);
    return api.sendMessage(
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n❌ حدث خطأ: ${error.message}`,
      threadID,
      messageID
    );
  }
};