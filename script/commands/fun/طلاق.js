const fs = require("fs-extra");

module.exports.config = {
  name: "طلاق",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "إنهاء الزواج الحالي",
  commandCategory: "fun",
  usages: "طلاق",
  cooldowns: 5
};

module.exports.run = async function({ api, event }) {

  const { threadID, messageID, senderID } = event;
  const marriagePath = "./data/marriages.json";


  if (!fs.existsSync(marriagePath)) {
    return api.sendMessage(
      "💔 لا يوجد زواج مسجل.",
      threadID,
      messageID
    );
  }


  let marriages = JSON.parse(fs.readFileSync(marriagePath));


  if (!marriages[threadID]) {
    return api.sendMessage(
      "💔 أنت غير متزوج حالياً.",
      threadID,
      messageID
    );
  }


  const index = marriages[threadID].findIndex(
    m => m.user1 === senderID || m.user2 === senderID
  );


  if (index === -1) {
    return api.sendMessage(
      "💔 أنت غير متزوج حالياً.",
      threadID,
      messageID
    );
  }


  const marriage = marriages[threadID][index];


  let partnerID =
    marriage.user1 === senderID
      ? marriage.user2
      : marriage.user1;


  let partnerName = "الشريك";

  try {
    const info = await api.getUserInfo(partnerID);
    partnerName = info[partnerID]?.name || "الشريك";
  } catch {}



  // حذف الزواج
  marriages[threadID].splice(index, 1);


  fs.writeFileSync(
    marriagePath,
    JSON.stringify(marriages, null, 2)
  );


  const replies = [
    `💔 تم الطلاق بينك وبين ${partnerName}.`,
    `🥀 انتهت قصة الحب بينك وبين ${partnerName}.`,
    `📜 تم تسجيل الطلاق بنجاح من ${partnerName}.`,
    `⚖️ تم إنهاء الزواج، نتمنى لكما حياة أفضل.`,
    `💫 انتهى الزواج بينك وبين ${partnerName}.`
  ];


  const randomReply =
    replies[Math.floor(Math.random() * replies.length)];


  return api.sendMessage(
    `⌬ ━━ HINA FUN ━━ ⌗\n\n${randomReply}`,
    threadID,
    messageID
  );

};