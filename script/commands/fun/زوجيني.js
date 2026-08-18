const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const jimp = require("jimp");

module.exports.config = {
  name: "زوجيني",
  version: "5.2.0",
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
// رابط القالب
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
// تحميل صورة العضو بدون Token
// ==================================================

async function downloadAvatar(api, uid, savePath) {

  const info = await api.getUserInfo(uid);
  const user = info[uid];

  if (!user) {
    throw new Error("تعذر الحصول على معلومات العضو");
  }

  const imageUrl =
    user.thumbSrc ||
    user.profilePicture ||
    user.profileUrl;

  if (!imageUrl) {
    throw new Error("تعذر الحصول على صورة البروفايل");
  }

  const response = await axios.get(
    imageUrl,
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

  return user.name || "المستخدم";
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

  const cacheDir =
    path.join(
      __dirname,
      "cache",
      "canvas"
    );

  await fs.ensureDir(cacheDir);

  const time = Date.now();

  const finalPath =
    path.join(
      cacheDir,
      `زوجيني_${senderID}_${time}.png`
    );

  const senderAvatarPath =
    path.join(
      cacheDir,
      `زوجيني_sender_${senderID}_${time}.png`
    );

  const partnerAvatarPath =
    path.join(
      cacheDir,
      `زوجيني_partner_${time}.png`
    );

  const backgroundPath =
    path.join(
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

    const senderIDString =
      String(senderID);


    // ==================================================
    // استبعاد البوت وصاحب الأمر
    // ==================================================

    const members =
      participants.filter(
        id => {

          const uid =
            String(id);

          return (
            uid !== botID &&
            uid !== senderIDString
          );

        }
      );


    if (members.length === 0) {

      return api.sendMessage(
        `⌬ ━━ HINA FUN ━━ ⌬\n\n` +
        `❌ لا يوجد أعضاء كافيين في المجموعة!`,
        threadID,
        messageID
      );

    }


    // ==================================================
    // اختيار عضو عشوائي
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
    // تحميل صور الطرفين
    // ==================================================

    let senderName;
    let partnerName;


    try {

      senderName =
        await downloadAvatar(
          api,
          senderID,
          senderAvatarPath
        );

    } catch (error) {

      try {
        senderName =
          await Users.getNameUser(senderID);
      } catch {
        senderName = "المستخدم";
      }

      throw new Error(
        `تعذر تحميل صورة ${senderName}: ${error.message}`
      );

    }


    try {

      partnerName =
        await downloadAvatar(
          api,
          partnerID,
          partnerAvatarPath
        );

    } catch (error) {

      try {
        partnerName =
          await Users.getNameUser(partnerID);
      } catch {
        partnerName = "العضو المختار";
      }

      throw new Error(
        `تعذر تحميل صورة ${partnerName}: ${error.message}`
      );

    }


    // ==================================================
    // تحميل القالب
    // ==================================================

    if (
      !fs.existsSync(backgroundPath)
    ) {

      const response =
        await axios.get(
          TEMPLATE_URL,
          {
            responseType:
              "arraybuffer",

            timeout:
              20000,

            headers: {
              "User-Agent":
                "Mozilla/5.0"
            }
          }
        );

      fs.writeFileSync(
        backgroundPath,
        Buffer.from(
          response.data
        )
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
    // تحويل الصور إلى دوائر
    // ==================================================

    const circleOne =
      await jimp.read(
        await circle(
          senderAvatarPath
        )
      );

    const circleTwo =
      await jimp.read(
        await circle(
          partnerAvatarPath
        )
      );


    // ==================================================
    // إحداثيات القالب القديم
    // لا يتم تغييرها
    // ==================================================

    baseImage
      .composite(
        circleOne.resize(
          150,
          150,
          jimp.RESIZE_BICUBIC
        ),
        320,
        100
      )
      .composite(
        circleTwo.resize(
          130,
          130,
          jimp.RESIZE_BICUBIC
        ),
        280,
        280
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
    // كتابة النسبة داخل القلب
    // ==================================================

    const font =
      await jimp.loadFont(
        jimp.FONT_SANS_32_WHITE
      );

    const percentText =
      `${lovePercent}%`;


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
    // مركز القلب
    // ==================================================

    const heartCenterX =
      Math.floor(
        baseImage.bitmap.width / 2
      );

    const heartCenterY =
      Math.floor(
        baseImage.bitmap.height / 2
      );


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
    // وضع النسبة
    // ==================================================

    baseImage.print(
      font,
      textX,
      textY,
      percentText
    );


    // ==================================================
    // حفظ الصورة بصيغة PNG
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
    // الرسالة النهائية
    // ==================================================

    const message =
      `⌬ ━━ HINA FUN ━━ ⌬\n\n` +

      `${randomReply}\n\n` +

      `👤 ${senderName}\n` +

      `❤️ ${lovePercent}%\n` +

      `💍 ${partnerName}\n\n` +

      `📊 ${loveMessage}\n\n` +

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
            fs.existsSync(
              finalPath
            )
          ) {
            fs.unlinkSync(
              finalPath
            );
          }

          if (
            fs.existsSync(
              senderAvatarPath
            )
          ) {
            fs.unlinkSync(
              senderAvatarPath
            );
          }

          if (
            fs.existsSync(
              partnerAvatarPath
            )
          ) {
            fs.unlinkSync(
              partnerAvatarPath
            );
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


    try {

      if (
        fs.existsSync(finalPath)
      ) {
        fs.unlinkSync(
          finalPath
        );
      }

      if (
        fs.existsSync(senderAvatarPath)
      ) {
        fs.unlinkSync(
          senderAvatarPath
        );
      }

      if (
        fs.existsSync(partnerAvatarPath)
      ) {
        fs.unlinkSync(
          partnerAvatarPath
        );
      }

    } catch {}


    return api.sendMessage(
      `⌬ ━━ HINA FUN ━━ ⌬\n\n` +
      `❌ حدث خطأ أثناء إنشاء الصورة.\n\n` +
      `📝 ${error.message}`,

      threadID,
      messageID
    );

  }
};