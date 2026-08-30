const axios = require("axios");
const Jimp = require("jimp");
const { Readable } = require("stream");

module.exports.config = {
  name: "بروفايل",
  version: "3.0.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "تغيير صورة بروفايل البوت بواسطة الرد على صورة",
  commandCategory: "إدارة",
  usages: "بروفايل [رد على صورة]",
  cooldowns: 5
};

module.exports.run = async function ({ api, event }) {

  const {
    threadID,
    messageID,
    messageReply,
    senderID
  } = event;

  // ==================================================
  // ADMINBOT
  // ==================================================

  const ADMINBOT =
    Array.isArray(global.config.ADMINBOT)
      ? global.config.ADMINBOT
      : [];

  const isAdmin =
    ADMINBOT
      .map(id => String(id))
      .includes(String(senderID));

  if (!isAdmin) {

    return api.sendMessage(
      "⌬ ━━ 𝗛𝗜𝗡𝗔 ━━ ⌬\n\n" +
      "🐿️ هذا الأمر للمطور فقط •-•",
      threadID,
      messageID
    );

  }

  // ==================================================
  // التحقق من الرد
  // ==================================================

  if (
    !messageReply ||
    !Array.isArray(messageReply.attachments) ||
    !messageReply.attachments.length
  ) {

    return api.sendMessage(
      "⌬ ━━ 𝗛𝗜𝗡𝗔 ━━ ⌬\n\n" +
      "🐿️ قم بالرد على صورة ثم استخدم الأمر",
      threadID,
      messageID
    );

  }

  const attachment =
    messageReply.attachments[0];

  if (attachment.type !== "photo") {

    return api.sendMessage(
      "⌬ ━━ 𝗛𝗜𝗡𝗔 ━━ ⌬\n\n" +
      "❌ المرفق يجب أن يكون صورة",
      threadID,
      messageID
    );

  }

  const imageUrl =
    attachment.url ||
    attachment.largePreviewUrl ||
    attachment.previewUrl;

  if (!imageUrl) {

    return api.sendMessage(
      "⌬ ━━ 𝗛𝗜𝗡𝗔 ━━ ⌬\n\n" +
      "❌ لم أستطع الحصول على رابط الصورة",
      threadID,
      messageID
    );

  }

  try {

    // ==================================================
    // تحميل الصورة
    // ==================================================

    console.log(
      "[ PROFILE ] تحميل الصورة..."
    );

    const response =
      await axios.get(
        imageUrl,
        {
          responseType: "arraybuffer",
          timeout: 30000,
          maxContentLength: 15 * 1024 * 1024,
          maxBodyLength: 15 * 1024 * 1024,
          headers: {
            "User-Agent":
              "Mozilla/5.0"
          }
        }
      );

    let buffer =
      Buffer.from(response.data);

    if (!buffer.length) {
      throw new Error("الصورة فارغة");
    }

    console.log(
      `[ PROFILE ] الحجم الأصلي: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`
    );

    // ==================================================
    // فتح الصورة باستخدام Jimp
    // ==================================================

    let image;

    try {

      image =
        await Jimp.read(buffer);

    } catch (error) {

      console.error(
        "[ PROFILE ] Jimp read error:",
        error
      );

      throw new Error(
        "تعذر قراءة الصورة الأصلية"
      );

    }

    // ==================================================
    // تحويل الصورة إلى JPEG
    // ==================================================

    image =
      image
        .quality(85)
        .background(0xFFFFFFFF);

    // ==================================================
    // تصغير الصورة إذا كانت كبيرة
    // ==================================================

    const MAX_DIMENSION = 2000;

    if (
      image.bitmap.width > MAX_DIMENSION ||
      image.bitmap.height > MAX_DIMENSION
    ) {

      image =
        image.scaleToFit(
          MAX_DIMENSION,
          MAX_DIMENSION
        );

    }

    // ==================================================
    // إنشاء JPEG
    // ==================================================

    buffer =
      await image.getBufferAsync(
        Jimp.MIME_JPEG
      );

    console.log(
      `[ PROFILE ] الحجم بعد التحويل: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`
    );

    // ==================================================
    // ضغط إضافي إذا تجاوز 4MB
    // ==================================================

    if (
      buffer.length >= 4 * 1024 * 1024
    ) {

      console.log(
        "[ PROFILE ] الصورة أكبر من 4MB، جاري الضغط..."
      );

      let quality = 70;

      while (
        buffer.length >= 4 * 1024 * 1024 &&
        quality >= 30
      ) {

        buffer =
          await image
            .quality(quality)
            .getBufferAsync(
              Jimp.MIME_JPEG
            );

        quality -= 10;

      }

    }

    // ==================================================
    // التحقق النهائي من الحجم
    // ==================================================

    if (
      buffer.length >= 4 * 1024 * 1024
    ) {

      throw new Error(
        "تعذر ضغط الصورة إلى أقل من 4MB"
      );

    }

    console.log(
      `[ PROFILE ] الحجم النهائي: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`
    );

    // ==================================================
    // إنشاء Readable Stream حقيقي
    // ==================================================

    const imageStream =
      new Readable({
        read() {
          this.push(buffer);
          this.push(null);
        }
      });

    // ==================================================
    // رفع الصورة
    // ==================================================

    console.log(
      "[ PROFILE ] رفع الصورة..."
    );

    await new Promise(
      (resolve, reject) => {

        api.changeAvatar(
          imageStream,
          "",
          null,
          function (err, data) {

            if (err) {

              console.error(
                "❌ changeAvatar error:",
                err
              );

              reject(err);
              return;

            }

            resolve(data);

          }
        );

      }
    );

    // ==================================================
    // نجاح
    // ==================================================

    return api.sendMessage(
      "⌬ ━━ 𝗛𝗜𝗡𝗔 ━━ ⌬\n\n" +
      "🐿️ تم تغيير صورة بروفايل البوت بنجاح\n\n" +
      "✦ بواسطة: المطور",
      threadID,
      messageID
    );

  } catch (error) {

    console.error(
      "❌ PROFILE ERROR:",
      error
    );

    let errorText;

    if (typeof error === "string") {

      errorText = error;

    } else if (
      error?.errorDescription
    ) {

      errorText =
        error.errorDescription;

    } else if (
      error?.message
    ) {

      errorText =
        error.message;

    } else {

      try {

        errorText =
          JSON.stringify(error);

      } catch {

        errorText =
          String(error);

      }

    }

    return api.sendMessage(
      "⌬ ━━ 𝗛𝗜𝗡𝗔 ━━ ⌬\n\n" +
      "❌ فشل تغيير صورة البروفايل\n\n" +
      "الخطأ: " +
      errorText,
      threadID,
      messageID
    );

  }

};