const axios = require("axios");
const { Readable } = require("stream");

module.exports.config = {
  name: "بروفايل",
  version: "2.2.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "تغيير صورة بروفايل البوت بالرد على صورة",
  commandCategory: "إدارة",
  usages: "بروفايل [بالرد على صورة]",
  cooldowns: 5
};

const HINA = "⌬ ━━ 𝗛𝗜𝗡𝗔 ━━ ⌬";

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID, messageReply, senderID } = event;

  const admins = Array.isArray(global.config.ADMINBOT)
    ? global.config.ADMINBOT.map(String)
    : [];

  if (!admins.includes(String(senderID))) {
    return api.sendMessage(
      `${HINA}\n\n❌ هذا الأمر للمطور فقط`,
      threadID,
      messageID
    );
  }

  if (
    !messageReply ||
    !Array.isArray(messageReply.attachments) ||
    messageReply.attachments.length === 0
  ) {
    return api.sendMessage(
      `${HINA}\n\n⚠️ قم بالرد على صورة لاستخدام الأمر`,
      threadID,
      messageID
    );
  }

  const attachment = messageReply.attachments.find(
    item =>
      item &&
      item.type === "photo" &&
      (item.url || item.previewUrl)
  );

  if (!attachment) {
    return api.sendMessage(
      `${HINA}\n\n❌ لم أجد صورة صالحة في الرسالة التي رددت عليها`,
      threadID,
      messageID
    );
  }

  const imageUrl = attachment.url || attachment.previewUrl;

  try {
    const response = await axios.get(imageUrl, {
      responseType: "arraybuffer",
      timeout: 30000,
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    const imageBuffer = Buffer.from(response.data);

    if (!imageBuffer.length) {
      throw new Error("تعذر تحميل الصورة");
    }

    const imageStream = new Readable({
      read() {
        this.push(imageBuffer);
        this.push(null);
      }
    });

    if (typeof api.changeAvatar !== "function") {
      throw new Error(
        "دالة changeAvatar غير موجودة في hut-chat-api"
      );
    }

    api.changeAvatar(imageStream, (err) => {
      if (err) {
        console.error(
          "[PROFILE] changeAvatar ERROR:",
          err
        );

        return api.sendMessage(
          `${HINA}\n\n❌ فشل تغيير صورة البروفايل\n\nالخطأ: ${
            err.message || String(err)
          }`,
          threadID,
          messageID
        );
      }

      return api.sendMessage(
        `${HINA}\n\n✅ تم تغيير صورة بروفايل البوت بنجاح`,
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
      `${HINA}\n\n❌ حدث خطأ أثناء تغيير صورة البروفايل\n\n${
        error.message || String(error)
      }`,
      threadID,
      messageID
    );
  }
};