module.exports.config = {
  name: "المطور",
  version: "1.2.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "عرض معلومات مطور البوت",
  commandCategory: "utility",
  usages: "المطور",
  cooldowns: 5
};

module.exports.run = async function ({ api, event }) {

  const { threadID, messageID } = event;

  const developerLink =
    "https://www.facebook.com/profile.php?id=61578581225040";

  const message =
`⌬ ━━ 𝗛𝗜𝗡𝗔 𝗗𝗘𝗩𝗘𝗟𝗢𝗣𝗘𝗥 ━━ ⌬

👤 المطور: أبو هريرة
🤖 البوت: زنجوبة
⚙️ النظام: Facebook Messenger Bot
💻 التطوير: Node.js

🔗 حساب المطور:
${developerLink}

━━━━━━━━━━━━━━━━━━
✦ جميع الحقوق محفوظة للمطور
✦ أبو هريرة`;

  return api.sendMessage(
    message,
    threadID,
    messageID
  );
};