module.exports.config = {
  name: "بروفايل",
  version: "1.0.0",
  hasPermssion: 1,
  credits: "أبو هريرة",
  description: "تغيير صورة بروفايل البوت (للمطور فقط) 🐿️",
  commandCategory: "إدارة",
  usages: "بروفايل [رد على صورة]",
  cooldowns: 5
};

module.exports.run = async ({ api, event }) => {
  const { threadID, messageID, messageReply, senderID } = event;

  // ===== التحقق من المطور =====
  const ADMIN_ID = "61578581225040";

  if (senderID !== ADMIN_ID) {
    return api.sendMessage("🐿️ هذا الأمر للمطور فقط •-•", threadID, messageID);
  }

  // التحقق من وجود رد على صورة
  if (!messageReply || !messageReply.attachments || messageReply.attachments.length === 0) {
    return api.sendMessage("🐿️ يرجى الرد على صورة لتغيير بروفايل البوت •-•", threadID, messageID);
  }

  const attachment = messageReply.attachments[0];
  if (attachment.type !== "photo") {
    return api.sendMessage("🐿️ يرجى الرد على صورة فقط •-•", threadID, messageID);
  }

  try {
    const axios = require("axios");
    const imageUrl = attachment.url;
    const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
    const imageBuffer = Buffer.from(response.data, "binary");

    // ✅ استخدم api.changeAvatarImage بدلاً من changeAvatar
    const form = {
      avatar: imageBuffer
    };

    api.changeAvatar(form, (err) => {
      if (err) {
        console.error("❌ خطأ تغيير الصورة:", err);
        return api.sendMessage("🐿️ فشل تغيير الصورة •-•", threadID, messageID);
      }
      return api.sendMessage("🐿️ تم تغيير صورة البروفايل بنجاح ✅", threadID, messageID);
    });

  } catch (error) {
    console.error("❌ خطأ:", error);
    return api.sendMessage("🐿️ حدث خطأ أثناء التغيير •-•", threadID, messageID);
  }
};