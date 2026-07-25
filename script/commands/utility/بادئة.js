module.exports.config = {
  name: "بادئة",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "عرض بادئة البوت",
  commandCategory: "utility",
  usages: "بادئة",
  cooldowns: 5
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID } = event;

  const prefix = global.config.PREFIX || ".";
  const botName = global.config.BOTNAME || "هينا";

  return api.sendMessage(
    `⌬ ━━ HINA ━━ ⌬\n\n🤖 اسم البوت: ${botName}\n🔑 البادئة: ${prefix}\n\n💡 استخدم: ${prefix}مساعدة للحصول على قائمة الأوامر`,
    threadID,
    messageID
  );
};
