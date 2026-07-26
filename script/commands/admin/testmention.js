module.exports.config = {
  name: "test",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "اختبار المنشن",
  commandCategory: "admin",
  usages: "test",
  cooldowns: 5
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID, mentions, messageReply } = event;
  
  let msg = "✅ الأمر يعمل!\n\n";
  
  if (messageReply) {
    msg += `📌 رد على: ${messageReply.senderID}\n`;
  }
  
  if (Object.keys(mentions).length > 0) {
    const targetID = Object.keys(mentions)[0];
    msg += `📌 منشن: ${targetID}\n`;
    msg += `👤 الاسم: ${mentions[targetID]}\n`;
  }
  
  if (!messageReply && Object.keys(mentions).length === 0) {
    msg += "❌ لا يوجد منشن ولا رد";
  }
  
  return api.sendMessage(msg, threadID, messageID);
};