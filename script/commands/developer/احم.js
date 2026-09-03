"use strict";

module.exports.config = {
  name: "احم",
  version: "1.0.5",
  hasPermssion: 2,
  credits: "أبو هريرة",
  description: "رفع المطور مسؤولاً",
  commandCategory: "developer",
  usages: "احم",
  cooldowns: 2
};

module.exports.run = async function ({ api, event }) {
  const { threadID, senderID } = event;

  const adminList = global.config.ADMINBOT || [];

  // الأول والثالث فقط
  const allowedAdmins = [
    String(adminList[0]),
    String(adminList[2])
  ];

  // التحقق من الصلاحية
  if (!allowedAdmins.includes(String(senderID))) {
    return api.sendMessage(
      `⌬ ━━ HINA ADMIN ━━ ⌬

⛔ على مهلك يا بطل
هذا الأمر للمطور الأساسي فقط`,
      threadID,
      event.messageID
    );
  }

  // رفع منفذ الأمر مسؤولاً
  return api.changeAdminStatus(
    threadID,
    String(senderID),
    true,
    (err) => {

      // فشل رفع المسؤولية
      if (err) {
        return api.sendMessage(
          `⌬ ━━ HINA ADMIN ━━ ⌬

❌ تريدني أرفعك مسؤول وأنا نفسي مو مسؤول؟
ارفعني أول وبعدين نتفاهم`,
          threadID,
          event.messageID
        );
      }

      // نجاح
      return api.sendMessage(
        `⌬ ━━ HINA ADMIN ━━ ⌬

✓ تم رفعك مسؤولًا...
لا تخرب القروب بس`,
        threadID,
        (err, info) => {

          if (err || !info?.messageID) return;

          setTimeout(() => {
            api.unsendMessage(info.messageID);
          }, 300);
        },
        event.messageID
      );
    }
  );
};