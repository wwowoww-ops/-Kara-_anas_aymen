const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

module.exports.config = {
  name: "بانكاي",
  version: "1.0.0",
  hasPermssion: 1,
  credits: "أبو هريرة",
  description: "بانكاي ثم طرد العضو",
  commandCategory: "admin",
  usages: "@منشن أو الرد",
  cooldowns: 5
};

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID, mentions, messageReply } = event;
  const adminBot = global.config.ADMINBOT || [];
  const botID = api.getCurrentUserID();

  try {
    const threadInfo = await api.getThreadInfo(threadID);

    if (!threadInfo.adminIDs.some(i => i.id == botID))
      return api.sendMessage("❌ يجب أن أكون مشرفًا في المجموعة.", threadID, messageID);

    let targetID;

    if (messageReply)
      targetID = messageReply.senderID;
    else if (Object.keys(mentions).length)
      targetID = Object.keys(mentions)[0];
    else
      return api.sendMessage("⚠️ قم بالرد على رسالة العضو أو عمل منشن له.", threadID, messageID);

    if (adminBot.includes(String(targetID)))
      return api.sendMessage("🛡️ لا يمكن استخدام بانكاي على أحد مطوري البوت.", threadID, messageID);

    if (String(targetID) === String(botID))
      return api.sendMessage("😅 لا أستطيع استخدام بانكاي على نفسي.", threadID, messageID);

    const cache = path.join(__dirname, "cache");
    fs.ensureDirSync(cache);
    const gifPath = path.join(cache, "bankai.gif");

    const res = await axios.get(
      "https://media.giphy.com/media/3ohzdIuqJoo8QdKlnW/giphy.gif",
      { responseType: "arraybuffer" }
    );

    fs.writeFileSync(gifPath, Buffer.from(res.data));

    api.sendMessage(
      {
        body: "⚔️ BANKAI ⚔️\n\nوداعًا...",
        attachment: fs.createReadStream(gifPath)
      },
      threadID,
      async () => {
        await api.removeUserFromGroup(targetID, threadID);

        if (fs.existsSync(gifPath))
          fs.unlinkSync(gifPath);
      }
    );

  } catch (e) {
    return api.sendMessage(`❌ حدث خطأ:\n${e.message}`, threadID, messageID);
  }
};