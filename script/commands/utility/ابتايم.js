module.exports.config = {
  name: "ابتايم",
  version: "1.2.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "عرض حالة النظام وإحصائيات التشغيل",
  commandCategory: "utility",
  cooldowns: 5
};

module.exports.run = async ({ api, event }) => {
  const { threadID, messageID } = event;

  // حساب وقت التشغيل
  const uptime = process.uptime();
  const days = Math.floor(uptime / (24 * 60 * 60));
  const hours = Math.floor((uptime % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((uptime % (60 * 60)) / 60);
  const seconds = Math.floor(uptime % 60);

  // إحصائيات المجموعات
  const threadList = await api.getThreadList(100, null, ["INBOX"]) || [];
  const groupCount = threadList.filter(thread => thread.isGroup).length;
  
  const timeStr = `${days} يوم، ${hours} ساعة، ${minutes} دقيقة`;
  const header = `⌬ ━━━━━━━━━━━━ ⌬\n      ⚙️ حـالـة الـنـظـام\n⌬ ━━━━━━━━━━━━ ⌬`;

  const statusMsg = `${header}\n\n` +
                   `⏳ مـدة الـتـشـغـيـل:\n» ${timeStr}\n\n` +
                   `📊 الإحـصـائـيـات:\n` +
                   `• المجموعات النشطة: ${groupCount}\n` +
                   `• سرعة الاستجابة: مستقرة\n\n` +
                   `🤖 الحالة: متصل\n` +
                   `👑 المطور: أبو هريرة`;

  return api.sendMessage(statusMsg, threadID, (err, info) => {
      // حذف الرسالة تلقائياً بعد 15 ثانية
      setTimeout(() => api.unsendMessage(info.messageID), 15000);
  }, messageID);
};
