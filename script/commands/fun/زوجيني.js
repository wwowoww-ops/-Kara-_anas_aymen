const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const jimp = require("jimp");

module.exports.config = {
  name: "زوجيني",
  version: "6.1.0",
  credits: "أبو هريرة",
  hasPermssion: 0,
  description: "زواج عشوائي مع صور الطرفين ونسبة التوافق",
  commandCategory: "Fun",
  usages: "زوجيني",
  cooldowns: 5,
  dependencies: {
    axios: "",
    "fs-extra": "",
    path: "",
    jimp: ""
  }
};

const TEMPLATE_URL =
  "https://files.catbox.moe/8zlvjg.jpg";

async function downloadAvatar(uid, savePath) {
  const url =
    `https://graph.facebook.com/${uid}/picture` +
    `?width=512&height=512` +
    `&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

  const response = await axios.get(url, {
    responseType: "arraybuffer",
    timeout: 20000,
    headers: {
      "User-Agent": "Mozilla/5.0"
    }
  });

  fs.writeFileSync(savePath, Buffer.from(response.data));

  return savePath;
}

module.exports.run = async function ({
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
    // جلب معلومات المجموعة
    // ==================================================

    const threadInfo =
      await api.getThreadInfo(String(threadID));

    // ==================================================
    // التحقق من أن معلومات المجموعة موجودة
    // ==================================================

    if (
      !threadInfo ||
      typeof threadInfo !== "object"
    ) {

      return api.sendMessage(
        `⌬ ━━ HINA FUN ━━ ⌬\n\n` +
        `❌ تعذر الحصول على معلومات أعضاء المجموعة.\n\n` +
        `📝 حاول استخدام الأمر مرة أخرى.`,
        threadID,
        messageID
      );

    }

    // ==================================================
    // الحصول على المشاركين بأمان
    // ==================================================

    let participants = [];

    if (
      Array.isArray(
        threadInfo.participantIDs
      )
    ) {

      participants =
        threadInfo.participantIDs;

    } else if (
      Array.isArray(
        threadInfo.participants
      )
    ) {

      participants =
        threadInfo.participants
          .map(user => {

            if (
              typeof user === "string" ||
              typeof user === "number"
            ) {
              return String(user);
            }

            return (
              user?.userFbId ||
              user?.id ||
              user?.userID ||
              null
            );

          })
          .filter(Boolean)
          .map(id => String(id));

    }

    // ==================================================
    // التحقق من وجود أعضاء
    // ==================================================

    if (
      !Array.isArray(participants) ||
      participants.length === 0
    ) {

      return api.sendMessage(
        `⌬ ━━ HINA FUN ━━ ⌬\n\n` +
        `❌ لم أستطع العثور على أعضاء المجموعة.`,
        threadID,
        messageID
      );

    }

    const botID =
      String(
        api.getCurrentUserID()
      );

    const currentUserID =
      String(senderID);

    // ==================================================
    // استبعاد البوت وصاحب الأمر
    // ==================================================

    const members =
      participants
        .map(id => String(id))
        .filter(id => {

          return (
            id !== botID &&
            id !== currentUserID
          );

        });

    if (
      members.length === 0
    ) {

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

    let senderName =
      "المستخدم";

    let partnerName =
      "العضو المختار";

    try {

      if (
        Users &&
        typeof Users.getNameUser ===
        "function"
      ) {

        const name =
          await Users.getNameUser(
            senderID
          );

        if (name) {
          senderName = name;
        }

      }

    } catch (e) {

      try {

        const info =
          await api.getUserInfo(
            senderID
          );

        senderName =
          info?.[senderID]?.name ||
          "المستخدم";

      } catch (e2) {}

    }

    try {

      if (
        Users &&
        typeof Users.getNameUser ===
        "function"
      ) {

        const name =
          await Users.getNameUser(
            partnerID
          );

        if (name) {
          partnerName = name;
        }

      }

    } catch (e) {

      try {

        const info =
          await api.getUserInfo(
            partnerID
          );

        partnerName =
          info?.[partnerID]?.name ||
          "العضو المختار";

      } catch (e2) {}

    }

    // ==================================================
    // تحميل الصور
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

    if (
      !fs.existsSync(
        backgroundPath
      )
    ) {

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
    // قراءة الصور
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
    // تصغير الصور
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
    // وضع الصور
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

    let loveMessage;

    if (
      lovePercent >= 90
    ) {

      loveMessage =
        "💖 توافق خيالي!";

    } else if (
      lovePercent >= 75
    ) {

      loveMessage =
        "❤️ توافق رائع!";

    } else if (
      lovePercent >= 60
    ) {

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

    const heartCenterX =
      425;

    const heartCenterY =
      239;

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
    // حفظ الصورة
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
    // الرد
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

    // ==================================================
    // تنظيف الملفات
    // ==================================================

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