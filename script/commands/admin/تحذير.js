module.exports.config = {
  name: "تحذير",
  version: "1.0.0",
  hasPermssion: 1,
  credits: "أبو هريرة",
  description: "إعطاء تحذير لعضو مع حفظ دائم",
  commandCategory: "admin",
  usages: "تحذير [@منشن] [السبب]",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, mentions, messageReply } = event;

  let targetID;

  if (messageReply) {
    targetID = messageReply.senderID;
  } else if (Object.keys(mentions).length > 0) {
    targetID = Object.keys(mentions)[0];
  } else {
    return api.sendMessage(
      "⚠️ الاستخدام:\nتحذير @منشن [السبب]\nأو الرد على رسالة العضو",
      threadID,
      messageID
    );
  }

  let reason = args.join(" ");
  if (reason.includes("@")) {
    reason = reason.replace(/@\S+/g, "").trim();
  }
  if (!reason) reason = "بدون سبب";

  const fs = require("fs");
  const path = "./warnings.json";

  if (!fs.existsSync(path)) {
    fs.writeFileSync(path, JSON.stringify({}));
  }

  let data = JSON.parse(fs.readFileSync(path));

  if (!data[threadID]) data[threadID] = {};
  if (!data[threadID][targetID]) {
    data[threadID][targetID] = [];
  }

  data[threadID][targetID].push({
    reason: reason,
    time: new Date().toLocaleString("ar")
  });

  fs.writeFileSync(path, JSON.stringify(data, null, 2));

  let count = data[threadID][targetID].length;

  return api.sendMessage(
    `⌬ ━━ 𝗞𝗜𝗥𝗔 ADMIN ━━ ⌬\n\n⚠️ تم إعطاء تحذير للعضو\n\n📌 السبب: ${reason}\n🔢 عدد التحذيرات: ${count}/3`,
    threadID,
    messageID
  );
};