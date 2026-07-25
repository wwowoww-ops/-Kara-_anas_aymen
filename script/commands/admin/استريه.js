module.exports.config = {
  name: "استريه",
  version: "1.0.0",
  hasPermssion: 1,
  credits: "أبو هريرة",
  description: "ترقية شخص إلى أدمن في المجموعة (بالرد أو المنشن)",
  commandCategory: "admin",
  usages: "استريه [@منشن] أو رد على رسالة العضو",
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
        `⌬ ━━ HINA ADMIN ━━ ⌬\n\n⚠️ يجب أن أكون أدمن في المجموعة لترقية الأعضاء.`,
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
        `⌬ ━━ HINA ADMIN ━━ ⌬\n\n📝 الاستخدام:\n• استريه @منشن\n• أو رد على رسالة العضو`,
        threadID,
        messageID
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // منع ترقية البوت أو المطور
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (targetID === api.getCurrentUserID()) {
      return api.sendMessage(
        `⌬ ━━ HINA ADMIN ━━ ⌬\n\n😅 أنا بالفعل أدمن!`,
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
        `⌬ ━━ HINA ADMIN ━━ ⌬\n\n🛡️ المطور الأساسي لا يحتاج إلى ترقية!`,
        threadID,
        messageID
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // التحقق من أن العضو ليس أدمن بالفعل
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const isAlreadyAdmin = threadInfo.adminIDs.some(admin => admin.id === targetID);
    if (isAlreadyAdmin) {
      return api.sendMessage(
        `⌬ ━━ HINA ADMIN ━━ ⌬\n\nℹ️ ${userName} هو بالفعل أدمن في المجموعة.`,
        threadID,
        messageID
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🔑 ترقية العضو إلى أدمن
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    await api.changeAdminStatus(threadID, targetID, true);

    // رسائل مضحكة
    const funnyReplies = [
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n👑 تمت ترقية ${userName} إلى أدمن!\n\n🎉 ألف مبروك!`,
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n🌟 استاهل ${userName} وأكثر!\n\n✅ تمت الترقية بنجاح.`,
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n💪 ${userName} أصبح أدمن!\n\n🔥 استعد للسلطة!`,
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n👑 ${userName} انضم إلى نادي الأدمن!\n\n🥳 مبروك!`
    ];
    const randomReply = funnyReplies[Math.floor(Math.random() * funnyReplies.length)];

    return api.sendMessage(randomReply, threadID, messageID);

  } catch (error) {
    console.error("❌ خطأ في استريه:", error);
    return api.sendMessage(
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n❌ حدث خطأ: ${error.message}`,
      threadID,
      messageID
    );
  }
};