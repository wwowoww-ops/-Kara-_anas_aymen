module.exports.config = {
  name: "بروفايل",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "تغيير صورة بروفايل البوت بواسطة الرد على صورة",
  commandCategory: "إدارة",
  usages: "بروفايل [رد على صورة]",
  cooldowns: 5
};

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID, messageReply, senderID } = event;

  const ADMINBOT = global.config.ADMINBOT || [];

  // ==============================
  // التحقق من المطور
  // ==============================

  const isAdmin = ADMINBOT
    .map(id => String(id))
    .includes(String(senderID));

  if (!isAdmin) {
    return api.sendMessage(
      "⌬ ━━ 𝗛𝗜𝗡𝗔 ━━ ⌬\n\n🐿️ هذا الأمر للمطور فقط •-•",
      threadID,
      messageID
    );
  }

  // ==============================
  // التحقق من الرد
  // ==============================

  if (
    !messageReply ||
    !messageReply.attachments ||
    !messageReply.attachments.length
  ) {
    return api.sendMessage(
      "⌬ ━━ 𝗛𝗜𝗡𝗔 ━━ ⌬\n\n🐿️ قم بالرد على صورة ثم استخدم الأمر",
      threadID,
      messageID
    );
  }

  const attachment = messageReply.attachments[0];

  if (attachment.type !== "photo") {
    return api.sendMessage(
      "⌬ ━━ 𝗛𝗜𝗡𝗔 ━━ ⌬\n\n❌ المرفق يجب أن يكون صورة",
      threadID,
      messageID
    );
  }

  if (!attachment.url) {
    return api.sendMessage(
      "⌬ ━━ 𝗛𝗜𝗡𝗔 ━━ ⌬\n\n❌ لم أستطع الحصول على رابط الصورة",
      threadID,
      messageID
    );
  }

  try {
    const axios = require("axios");
    const { Readable } = require("stream");

    // ==============================
    // تحميل الصورة
    // ==============================

    const response = await axios.get(attachment.url, {
      responseType: "arraybuffer",
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    const imageBuffer = Buffer.from(response.data);

    if (!imageBuffer.length) {
      throw new Error("الصورة فارغة");
    }

    // ==============================
    // تحويل Buffer إلى Readable Stream
    // ==============================

    const imageStream = Readable.from(imageBuffer);

    // ==============================
    // تغيير صورة البروفايل
    // ==============================

    await api.changeAvatar(
      imageStream,
      "",
      null,
      function (err) {
        if (err) {
          console.error(
            "❌ changeAvatar error:",
            err
          );

          return api.sendMessage(
            "⌬ ━━ 𝗛𝗜𝗡𝗔 ━━ ⌬\n\n❌ فشل تغيير صورة البروفايل\n\nالخطأ: " +
              (
                typeof err === "string"
                  ? err
                  : err?.message || JSON.stringify(err)
              ),
            threadID,
            messageID
          );
        }

        return api.sendMessage(
          "⌬ ━━ 𝗛𝗜𝗡𝗔 ━━ ⌬\n\n" +
          "🐿️ تم تغيير صورة بروفايل البوت بنجاح\n\n" +
          "✦ بواسطة: المطور",
          threadID,
          messageID
        );
      }
    );

  } catch (error) {
    console.error(
      "❌ Profile command error:",
      error
    );

    return api.sendMessage(
      "⌬ ━━ 𝗛𝗜𝗡𝗔 ━━ ⌬\n\n" +
      "❌ حدث خطأ أثناء تغيير صورة البروفايل\n\n" +
      "الخطأ: " +
      (error?.message || String(error)),
      threadID,
      messageID
    );
  }
};