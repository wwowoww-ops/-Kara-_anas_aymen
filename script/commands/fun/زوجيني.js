const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const jimp = require("jimp");

module.exports.config = {
  name: "زوجيني",
  version: "6.0.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "زواج عشوائي مع صور الطرفين ونسبة التوافق",
  commandCategory: "fun",
  usages: "زوجيني",
  cooldowns: 5,
  dependencies: {
    axios: "",
    "fs-extra": "",
    path: "",
    jimp: ""
  }
};

// ==================================================
// قالب التصميم
// ==================================================

const TEMPLATE_URL =
  "https://files.catbox.moe/8zlvjg.jpg";


// ==================================================
// تحويل الصورة إلى دائرة
// ==================================================

async function circle(image) {
  const img = await jimp.read(image);
  img.circle();

  return await img.getBufferAsync("image/png");
}


// ==================================================
// تحميل صورة البروفايل بنفس طريقة أمر زواج
// للحصول على أفضل جودة متاحة
// ==================================================

async function downloadAvatar(uid, savePath) {

  const url =
    `https://graph.facebook.com/${uid}/picture` +
    `?width=512&height=512` +
    `&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

  const response = await axios.get(
    url,
    {
      responseType: "arraybuffer",
      timeout: 20000,
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    }
  );

  fs.writeFileSync(
    savePath,
    Buffer.from(response.data)
  );

  return savePath;
}


// ==================================================
// الأمر
// ==================================================

module.exports.run = async function({
  api,
  event,
  Users
}) {

  const {
    threadID,
    messageID,
    senderID
  } = event;

  const cacheDir = path.join(
    __dirname,
    "cache",
    "canvas"
  );

  await fs.ensureDir(cacheDir);

  const time = Date.now();

  const finalPath = path.join(
    cacheDir,
    `زوجيني_${senderID}_${time}.png`
  );

  const senderAvatarPath = path.join(
    cacheDir,
    `زوجيني_sender_${senderID}_${time}.jpg`
  );

  const partnerAvatarPath = path.join(
    cacheDir,
    `زوجيني_partner_${time}.jpg`
  );

  const backgroundPath = path.join(
    cacheDir,
    "زوجيني_background.jpg"
  );


  try {

    // ==================================================
    // جلب أعضاء المجموعة
    // ==================================================

    const threadInfo =
      await api.getThreadInfo(threadID);

    const participants =
      threadInfo.participantIDs || [];

    const botID =
      String(api.getCurrentUserID());

    const currentUserID =
      String(senderID);


    // ==================================================
    // استبعاد البوت وصاحب الأمر
    // ==================================================

    const members =
      participants.filter(id => {

        const uid = String(id);

        return (
          uid !== botID &&
          uid !== currentUserID
        );

      });


    if (members.length === 0) {

      return api.sendMessage(
        `⌬ ━━ HINA FUN ━━ ⌬\n\n` +
        `❌ لا يوجد أعضاء كافيين في المجموعة!`,
        threadID,
        messageID
      );

    }


    // ==================================================
    // اختيار شخص عشوائي
    // ==================================================

    const partnerID =
      String(
        members[
          Math.floor(
            Math.random() *
            members.length
          )
        ]
      );


    // ==================================================
    // أسماء الأعضاء
    // ==================================================

    let senderName = "المستخدم";
    let partnerName = "العضو المختار";


    try {

      senderName =
        await Users.getNameUser(senderID);

    } catch (e) {

      try {

        const info =
          await api.getUserInfo(senderID);

        senderName =
          info[senderID]?.name ||
          "المستخدم";

      } catch (e2) {}

    }


    try {

      partnerName =
        await Users.getNameUser(partnerID);

    } catch (e) {

      try {

        const info =
          await api.getUserInfo(partnerID);

        partnerName =
          info[partnerID]?.name ||
          "العضو المختار";

      } catch (e2) {}

    }


    // ==================================================
    // تحميل الصور بجودة 512
    // نفس نظام أمر زواج
    // ==================================================

    await Promise.all([

      downloadAvatar(
        senderID,
        senderAvatarPath
      ),

      downloadAvatar(
        partnerID,
        partnerAvatarPath
      )

    ]);


    // ==================================================
    // تحميل القالب
    // ==================================================

    if (!fs.existsSync(backgroundPath)) {

      const response =
        await axios.get(
          TEMPLATE_URL,
          {
            responseType: "arraybuffer",
            timeout: 20000,
            headers: {
              "User-Agent": "Mozilla/5.0"
            }
          }
        );

      fs.writeFileSync(
        backgroundPath,
        Buffer.from(response.data)
      );

    }


    // ==================================================
    // قراءة القالب
    // ==================================================

    const baseImage =
      await jimp.read(
        backgroundPath
      );


    // ==================================================
    // قراءة الصور الأصلية
    // ==================================================

    const senderImage =
      await jimp.read(
        senderAvatarPath
      );

    const partnerImage =
      await jimp.read(
        partnerAvatarPath
      );


    // ==================================================
    // تحويل الصور إلى دوائر
    // ==================================================

    senderImage.circle();
    partnerImage.circle();


    // ==================================================
    // تحسين جودة التصغير
    // ==================================================

    senderImage.resize(
      153,
      153,
      jimp.RESIZE_BICUBIC
    );

    partnerImage.resize(
      153,
      153,
      jimp.RESIZE_BICUBIC
    );


    // ==================================================
    // إحداثيات قالبك
    // ==================================================

    baseImage.composite(
      senderImage,
      69,
      163
    );


    baseImage.composite(
      partnerImage,
      619,
      163
    );


    // ==================================================
    // نسبة التوافق
    // ==================================================

    const lovePercent =
      Math.floor(
        Math.random() * 51
      ) + 50;


    // ==================================================
    // رسالة حسب النسبة
    // ==================================================

    let loveMessage;

    if (lovePercent >= 90) {

      loveMessage =
        "💖 توافق خيالي!";

    } else if (lovePercent >= 75) {

      loveMessage =
        "❤️ توافق رائع!";

    } else if (lovePercent >= 60) {

      loveMessage =
        "💕 توافق جيد!";

    } else {

      loveMessage =
        "💔 توافق متوسط!";

    }


    // ==================================================
    // الخط
    // ==================================================

    const font =
      await jimp.loadFont(
        jimp.FONT_SANS_32_WHITE
      );


    const percentText =
      `${lovePercent}%`;


    // ==================================================
    // قياس النسبة
    // ==================================================

    const textWidth =
      jimp.measureText(
        font,
        percentText
      );

    const textHeight =
      jimp.measureTextHeight(
        font,
        percentText,
        200
      );


    // ==================================================
    // مركز القلب في القالب
    // ==================================================

    const heartCenterX = 425;
    const heartCenterY = 239;


    const textX =
      heartCenterX -
      Math.floor(
        textWidth / 2
      );

    const textY =
      heartCenterY -
      Math.floor(
        textHeight / 2
      );


    // ==================================================
    // وضع النسبة داخل القلب
    // ==================================================

    baseImage.print(
      font,
      textX,
      textY,
      percentText
    );


    // ==================================================
    // حفظ الصورة PNG بدون ضغط JPEG
    // ==================================================

    const buffer =
      await baseImage.getBufferAsync(
        "image/png"
      );

    fs.writeFileSync(
      finalPath,
      buffer
    );


    // ==================================================
    // الردود
    // ==================================================

    const funnyReplies = [

      `💍 ألف مبروك الزواج لـ ${senderName} و ${partnerName}! 🎉`,

      `💕 تم الزواج! ${senderName} و ${partnerName} أصبحا زوجين!`,

      `🌸 مبارك للعروسين ${senderName} و ${partnerName}! 💐`,

      `💖 زواج سعيد لـ ${senderName} و ${partnerName}! 🎊`

    ];


    const randomReply =
      funnyReplies[
        Math.floor(
          Math.random() *
          funnyReplies.length
        )
      ];


    // ==================================================
    // الرسالة
    // ==================================================

    const message =
      `⌬ ━━ HINA FUN ━━ ⌬\n\n` +

      `${randomReply}\n\n` +

      `👤 ${senderName}\n` +

      `💍 ${partnerName}\n\n` +

      `❤️ نسبة التوافق: ${lovePercent}%\n` +

      `${loveMessage}\n\n` +

      `✦ المطور: أبو هريرة`;


    // ==================================================
    // إرسال الصورة
    // ==================================================

    return api.sendMessage(
      {
        body: message,

        attachment:
          fs.createReadStream(
            finalPath
          )
      },

      threadID,

      () => {

        try {

          if (
            fs.existsSync(finalPath)
          ) {
            fs.unlinkSync(finalPath);
          }

          if (
            fs.existsSync(senderAvatarPath)
          ) {
            fs.unlinkSync(senderAvatarPath);
          }

          if (
            fs.existsSync(partnerAvatarPath)
          ) {
            fs.unlinkSync(partnerAvatarPath);
          }

        } catch (error) {

          console.error(
            "خطأ في حذف الملفات:",
            error.message
          );

        }

      },

      messageID
    );


  } catch (error) {

    console.error(
      "❌ خطأ في زوجيني:",
      error
    );


    // ==================================================
    // تنظيف الملفات
    // ==================================================

    try {

      if (
        fs.existsSync(finalPath)
      ) {
        fs.unlinkSync(finalPath);
      }

      if (
        fs.existsSync(senderAvatarPath)
      ) {
        fs.unlinkSync(senderAvatarPath);
      }

      if (
        fs.existsSync(partnerAvatarPath)
      ) {
        fs.unlinkSync(partnerAvatarPath);
      }

    } catch (e) {}


    return api.sendMessage(
      `⌬ ━━ HINA FUN ━━ ⌬\n\n` +
      `❌ حدث خطأ أثناء إنشاء الصورة.\n\n` +
      `📝 ${error.message}`,

      threadID,
      messageID
    );

  }
};