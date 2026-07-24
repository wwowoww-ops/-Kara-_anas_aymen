module.exports.config = {
  name: "غادري",
  version: "1.0.0",
  hasPermssion: 1,
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

  // قراءة config مع محاولة تصحيح المسار
  let config;
  try {
    config = JSON.parse(fs.readFileSync(path));
  } catch (e) {
    // محاولة مسار آخر
    try {
      config = JSON.parse(fs.readFileSync("../config.json"));
    } catch (e2) {
      return api.sendMessage("❌ لم يتم العثور على config.json", threadID, messageID);
    }
  }

  // جلب معرف المطور
  const devID = config.KIRA_CONF?.dev || config.ADMINBOT?.[0];

  // طباعة للمساعدة في التصحيح (ستظهر في السجلات)
  console.log(`[DEBUG] SenderID: ${senderID}, DevID: ${devID}`);

  if (!devID) {
    return api.sendMessage("❌ لم يتم تعيين معرف المطور في config.json", threadID, messageID);
  }

  if (senderID !== devID) {
    return api.sendMessage(
      `⌬ ━━ ABU HURAIRA ADMIN ━━ ⌬\n\n⛔ هذا الأمر للمطور الأساسي فقط!\nمعرفك: ${senderID}\nمعرف المطور: ${devID}`,
      threadID,
      messageID
    );
  }

  // إرسال رسالة المغادرة
  api.sendMessage(
    `⌬ ━━ ABU HURAIRA ADMIN ━━ ⌬\n\n💔 وداعاً... أنا بخدمتك دائماً 💖\n\nسيتم مغادرتي الآن...`,
    threadID,
    () => {
      api.removeUserFromGroup(api.getCurrentUserID(), threadID);
    }
  );
};