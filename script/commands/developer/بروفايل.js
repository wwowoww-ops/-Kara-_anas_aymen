module.exports.config = {
  name: "بروفايل",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "تغيير صورة بروفايل البوت بالرد على صورة",
  commandCategory: "إدارة",
  usages: "بروفايل [بالرد على صورة]",
  cooldowns: 5
};

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID, messageReply, senderID } = event;

  // ═══════════════════════════════════════
  // التحقق من ADMINBOT
  // ═══════════════════════════════════════

  const admins = Array.isArray(global.config.ADMINBOT)
    ? global.config.ADMINBOT.map(String)
    : [];

  if (!admins.includes(String(senderID))) {
    return api.sendMessage(
      "🐿️ هذا الأمر للمطور فقط •-•",
      threadID,
      messageID
    );
  }

  // ═══════════════════════════════════════
  // التحقق من الرد على صورة
  // ═══════════════════════════════════════

  if (
    !messageReply ||
    !Array.isArray(messageReply.attachments) ||
    messageReply.attachments.length === 0
  ) {
    return api.sendMessage(
      "🐿️ قم بالرد على صورة لاستخدام الأمر •-•",
      threadID,
      messageID
    );
  }

  const attachment = messageReply.attachments.find(
    item => item.type === "photo" && item.url
  );

  if (!attachment) {
    return api.sendMessage(
      "🐿️ الرسالة التي رددت عليها لا تحتوي على صورة صالحة •-•",
      threadID,
      messageID
    );
  }

  try {
    const axios = require("axios");
    const FormData = require("form-data");

    // ═══════════════════════════════════════
    // تحميل الصورة
    // ═══════════════════════════════════════

    const response = await axios.get(attachment.url, {
      responseType: "arraybuffer",
      timeout: 30000,
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    const imageBuffer = Buffer.from(response.data);

    if (!imageBuffer.length) {
      throw new Error("الصورة فارغة");
    }

    // ═══════════════════════════════════════
    // تجهيز الطلب
    // ═══════════════════════════════════════

    const form = new FormData();

    form.append(
      "avatar",
      imageBuffer,
      {
        filename: "profile.jpg",
        contentType:
          response.headers["content-type"] || "image/jpeg"
      }
    );

    // ═══════════════════════════════════════
    // تغيير صورة البروفايل
    // ═══════════════════════════════════════

    if (typeof api.changeAvatar !== "function") {
      throw new Error(
        "دالة changeAvatar غير موجودة في hut-chat-api"
      );
    }

    api.changeAvatar(form, function (err) {
      if (err) {
        console.error(
          "[PROFILE] changeAvatar ERROR:",
          err
        );

        return api.sendMessage(
          "🐿️ فشل تغيير صورة البروفايل\n\nالخطأ: " +
            (err.message || String(err)),
          threadID,
          messageID
        );
      }

      return api.sendMessage(
        "🐿️ تم تغيير صورة بروفايل البوت بنجاح ✅",
        threadID,
        messageID
      );
    });

  } catch (error) {
    console.error(
      "[PROFILE] ERROR:",
      error
    );

    return api.sendMessage(
      "🐿️ حدث خطأ أثناء تغيير صورة البروفايل\n\n" +
        (error.message || String(error)),
      threadID,
      messageID
    );
  }
};