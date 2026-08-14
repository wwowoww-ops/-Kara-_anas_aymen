module.exports.config = {
  name: "بروفايل",
  version: "1.0.0",
  hasPermssion: 1, // ← للمطورين فقط
  credits: "أبو هريرة",
  description: "تغيير صورة بروفايل البوت (للمطور فقط)",
  commandCategory: "إدارة",
  usages: "بروفايل [رد على صورة]",
  cooldowns: 5
};

module.exports.run = async ({ api, event }) => {
  const { threadID, messageID, messageReply, senderID } = event;

  // ===== التحقق من المطور =====
  const ADMIN_ID = "61578581225040"; // ابو هريرة

  if (senderID !== ADMIN_ID) {
    return api.sendMessage(
      "🐿️ هذا الأمر للمطور فقط •-•",
      threadID,
      messageID
    );
  }

  // التحقق من وجود رد على صورة
  if (!messageReply || !messageReply.attachments || messageReply.attachments.length === 0) {
    return api.sendMessage(
      "🐿️ يرجى الرد على صورة لتغيير بروفايل البوت •-•",
      threadID,
      messageID
    );
  }

  // التحقق من أن المرفق صورة
  const attachment = messageReply.attachments[0];
  if (attachment.type !== "photo") {
    return api.sendMessage(
      "🐿️ يرجى الرد على صورة فقط، ليس فيديو أو ملف •-•",
      threadID,
      messageID
    );
  }

  try {
    // جلب رابط الصورة
    const imageUrl = attachment.url;

    // تحميل الصورة كـ Buffer
    const axios = require("axios");
    const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
    const imageBuffer = Buffer.from(response.data, "binary");

    // تغيير صورة بروفايل البوت
    await api.changeAvatar(imageBuffer);

    return api.sendMessage(
      "🐿️ تم تغيير صورة البروفايل بنجاح ✅",
      threadID,
      messageID
    );

  } catch (error) {
    console.error("❌ خطأ في تغيير البروفايل:", error);
    return api.sendMessage(
      "🐿️ فشل تغيير صورة البروفايل •-•",
      threadID,
      messageID
    );
  }
};