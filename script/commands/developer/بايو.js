module.exports.config = {
  name: "بايو",
  version: "1.2.0",
  hasPermssion: 2,
  credits: "أبو هريرة",
  description: "تغيير السيرة الذاتية (Bio) لحساب البوت",
  commandCategory: "developer",
  usages: "[النص الجديد]",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const header = `⌬ ━━━━━━━━━━━━ ⌬\n      ⚙️ إعـدادات الـنـظـام\n⌬ ━━━━━━━━━━━━ ⌬`;
  
  // التحقق من صلاحية المطور عبر الـ Config
  const adminConfig = global.config.ADMINBOT || [];
  if (!adminConfig.includes(senderID)) {
    return api.sendMessage(`${header}\n\n⚠️ عـذراً، هـذا الأمـر سـيادي لـلـمطور فـقـط.`, threadID, messageID);
  }

  const content = args.join(" ");
  if (!content) {
    return api.sendMessage(`${header}\n\n⪼ يـرجـى كـتـابـة الـنـص الـجديد لـلـبايو.`, threadID, messageID);
  }

  api.changeBio(content, (err) => {
    if (err) {
      return api.sendMessage(`${header}\n\n❌ فـشل الـتحديث، قـد تـكون هـناك قـيود مـن فـيسـبوك.`, threadID, messageID);
    }
    return api.sendMessage(`${header}\n\n✅ تـم تـحـديـث الـبـايـو بـنـجـاح:\n⪼ "${content}"`, threadID, messageID);
  });
};