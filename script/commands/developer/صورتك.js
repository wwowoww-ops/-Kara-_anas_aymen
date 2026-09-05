module.exports.config = {
  name: "صورتك",
  version: "1.0.0",
  hasPermssion: 2,
  credits: "هرهور",
  description: "تغيير بروفايل البوت من صورة ترد عليها",
  commandCategory: "developer",
  usages: "رد على صورة",
  cooldowns: 5
};

module.exports.run = async function({ api, event }) {
  const att = event.messageReply?.attachments?.[0];
  if (!att || att.type!== "photo")
    return api.sendMessage("❌ رد على صورة عشان احطها بروفايل", event.threadID, event.messageID);

  const axios = require("axios");
  try {
    const res = await axios.get(att.url, { responseType: "stream" });
    api.changeAvatar(res.data, (err) => {
      if (err) api.sendMessage("❌ فشل: " + err, event.threadID, event.messageID);
      else api.sendMessage("✅ تم تغيير بروفايل البوت بنجاح", event.threadID, event.messageID);
    });
  } catch (e) {
    api.sendMessage("❌ خطأ: " + e.message, event.threadID, event.messageID);
  }
}