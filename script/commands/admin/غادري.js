module.exports.config = {
  name: "غادري",
  version: "1.0.0",
  hasPermssion: 2,
  credits: "أبو هريرة",
  description: "يجعل البوت يغادر المجموعة",
  commandCategory: "admin",
  usages: "",
  cooldowns: 5
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID, senderID } = event;

  const adminBot = global.config.ADMINBOT || [];

  if (!adminBot.includes(senderID)) {
    return api.sendMessage(
      "⌬ ━━ ABU HURAIRA ADMIN ━━ ⌬\n\n🚫 هذا الأمر خاص بمطور البوت فقط.",
      threadID,
      messageID
    );
  }

  try {
    await api.sendMessage(
      "⌬ ━━ ABU HURAIRA ADMIN ━━ ⌬\n\n👋 إلى اللقاء، سأغادر المجموعة الآن.",
      threadID
    );

    return api.removeUserFromGroup(api.getCurrentUserID(), threadID);

  } catch (error) {
    return api.sendMessage(
      `❌