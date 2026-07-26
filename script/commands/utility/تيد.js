const fs = require("fs");

module.exports.config = {
  name: "تيد",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "معرفة آيدي المجموعة أو المستخدم",
  commandCategory: "utility",
  usages: "تيد [@منشن] أو رد على رسالة",
  cooldowns: 2
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID, senderID, type, messageReply, mentions } = event;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 1️⃣ إذا كان هناك منشن
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (Object.keys(mentions).length > 0) {
    const targetID = Object.keys(mentions)[0];
    const targetName = mentions[targetID].replace("@", "");
    return api.sendMessage(
      `⌬ ━━ HINA UTILITY ━━ ⌬\n\n👤 آيدي المستخدم: ${targetName}\n🆔 ${targetID}`,
      threadID,
      messageID
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 2️⃣ إذا كان رد على رسالة
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (type === "message_reply") {
    const targetID = messageReply.senderID;
    let targetName = "المستخدم";
    try {
      const userInfo = await api.getUserInfo(targetID);
      targetName = userInfo[targetID]?.name || "المستخدم";
    } catch (e) {}
    return api.sendMessage(
      `⌬ ━━ HINA UTILITY ━━ ⌬\n\n👤 آيدي المستخدم: ${targetName}\n🆔 ${targetID}`,
      threadID,
      messageID
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 3️⃣ عرض آيدي المجموعة
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // جلب اسم المجموعة
  let groupName = "المجموعة";
  try {
    const threadInfo = await api.getThreadInfo(threadID);
    groupName = threadInfo.name || "المجموعة";
  } catch (e) {}

  return api.sendMessage(
    `⌬ ━━ HINA UTILITY ━━ ⌬\n\n📌 آيدي المجموعة: ${groupName}\n🆔 ${threadID}`,
    threadID,
    messageID
  );
};