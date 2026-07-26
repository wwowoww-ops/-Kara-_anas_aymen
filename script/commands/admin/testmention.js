module.exports.config = {
  name: "منشن",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "اختبار المنشن",
  commandCategory: "admin",
  usages: "منشن [@منشن]",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, mentions, messageReply, senderID } = event;
  
  let msg = "✅ الأمر يعمل!\n\n";
  
  // التحقق من المنشن
  if (Object.keys(mentions).length > 0) {
    const targetID = Object.keys(mentions)[0];
    const targetName = mentions[targetID].replace("@", "");
    msg += `📌 منشن: ${targetID}\n`;
    msg += `👤 الاسم: ${targetName}\n`;
  } else {
    msg += "❌ لا يوجد منشن\n";
  }
  
  // التحقق من الرد
  if (messageReply) {
    msg += `📌 رد على: ${messageReply.senderID}\n`;
  }
  
  // عرض جميع المفاتيح في event
  msg += `\n📋 مفاتيح event:\n`;
  msg += Object.keys(event).join(", ");
  
  return api.sendMessage(msg, threadID, messageID);
};