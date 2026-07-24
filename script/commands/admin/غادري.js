module.exports.config = {
  name: "غادري",
  version: "1.0.0",
  hasPermssion: 2,
  credits: "أبو هريرة",
  description: "يأمر البوت بمغادرة المجموعة (للمطور فقط)",
  commandCategory: "admin",
  usages: "غادري",
  cooldowns: 5
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID, senderID } = event;
  const fs = require("fs");
  const path = "./config.json";

  // التحقق من أن المستخدم هو المطور الأساسي
  const config = JSON.parse(fs.readFileSync(path));
  const devID = config.KIRA_CONF?.dev || config.ADMINBOT?.[0];

  if (senderID !== devID) {
    return api.sendMessage(
      `⌬ ━━ ABU HURAIRA ADMIN ━━ ⌬\n\n⛔ هذا الأمر للمطور الأساسي فقط!\nأنت لست مخولاً لاستخدامه.`,
      threadID,
      messageID
    );
  }

  // إرسال رسالة المغادرة
  api.sendMessage(
    `⌬ ━━ ABU HURAIRA ADMIN ━━ ⌬\n\n💔 وداعاً يا أبا هريرة... أنا بخدمتك دائماً 💖\n\nسيتم مغادرتي الآن...`,
    threadID,
    () => {
      // مغادرة المجموعة
      api.removeUserFromGroup(api.getCurrentUserID(), threadID);
    }
  );
};