const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "زوجي",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "عرض الزوج/ة الحالي مع تاريخ الزواج",
  commandCategory: "fun",
  usages: "زوجي [@منشن]",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID, mentions } = event;
  const marriagePath = "./data/marriages.json";

  if (!fs.existsSync(marriagePath)) {
    return api.sendMessage(
      `⌬ ━━ HINA FUN ━━ ⌬\n\n💔 لا يوجد زيجات مسجلة في هذه المجموعة.`,
      threadID,
      messageID
    );
  }

  let marriages = JSON.parse(fs.readFileSync(marriagePath));

  if (!marriages[threadID] || marriages[threadID].length === 0) {
    return api.sendMessage(
      `⌬ ━━ HINA FUN ━━ ⌬\n\n💔 لا يوجد زيجات مسجلة في هذه المجموعة.`,
      threadID,
      messageID
    );
  }

  // تحديد المستخدم المطلوب
  let userID = senderID;
  let userName = "أنت";

  if (Object.keys(mentions).length > 0) {
    userID = Object.keys(mentions)[0];
    userName = mentions[userID].replace("@", "");
  } else if (args[0] && !isNaN(args[0])) {
    userID = args[0];
    try {
      const info = await api.getUserInfo(userID);
      userName = info[userID]?.name || "الشخص";
    } catch (e) {}
  }

  // البحث عن زواج المستخدم
  const marriage = marriages[threadID].find(
    m => m.user1 === userID || m.user2 === userID
  );

  if (!marriage) {
    return api.sendMessage(
      `⌬ ━━ HINA FUN ━━ ⌬\n\n💔 ${userName} ليس متزوجاً حالياً.`,
      threadID,
      messageID
    );
  }

  // جلب اسم الشريك
  const partnerID = marriage.user1 === userID ? marriage.user2 : marriage.user1;
  let partnerName = "شخص";
  try {
    const info = await api.getUserInfo(partnerID);
    partnerName = info[partnerID]?.name || "شخص";
  } catch (e) {}

  return api.sendMessage(
    `⌬ ━━ HINA FUN ━━ ⌬\n\n💕 ${userName} متزوج بـ ${partnerName} 💕\n📅 تاريخ الزواج: ${marriage.date}`,
    threadID,
    messageID
  );
};