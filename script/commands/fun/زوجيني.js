const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const Jimp = require("jimp");

module.exports.config = {
  name: "زوجيني",
  version: "4.1.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "زواج عشوائي مع دمج صور الطرفين ونسبة التوافق داخل القلب",
  commandCategory: "fun",
  usages: "زوجيني",
  cooldowns: 5,

  dependencies: {
    axios: "",
    "fs-extra": "",
    jimp: ""
  }
};

// ==========================================
// رابط قالب الزواج
// ==========================================

const TEMPLATE_URL =
  "https://files.catbox.moe/8zlvjg.jpg";


// ==========================================
// الأمر
// ==========================================

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

  const cacheDir =
    path.join(__dirname, "cache");

  await fs.ensureDir(cacheDir);

  const time = Date.now();

  const templatePath =
    path.join(
      cacheDir,
      "marry_template.jpg"
    );

  const senderPath =
    path.join(
      cacheDir,
      `marry_sender_${senderID}_${time}.jpg`
    );

  const partnerPath =
    path.join(
      cacheDir,
      `marry_partner_${time}.jpg`
    );

  const finalPath =
    path.join(
      cacheDir,
      `marry_final_${senderID}_${time}.jpg`
    );

  try {

    // ========================================
    // جلب أعضاء المجموعة
    // ========================================

    const threadInfo =
      await api.getThreadInfo(threadID);

    const botID =
      String(api.getCurrentUserID());

    const members =
      (threadInfo.participantIDs || []).filter(
        id =>
          String(id) !== botID &&
          String(id) !== String(senderID)
      );

    if (members.length === 0) {

      return api.sendMessage(
        `⌬ ━━ 𝗛𝗜𝗡𝗔 FUN ━━ ⌬\n\n` +
        `❌ لا يوجد أعضاء كافيين في المجموعة!`,
        threadID,
        messageID
      );
    }


    // ========================================
    // اختيار الشخص العشوائي
    // ========================================

    const partnerID =
      members[
        Math.floor(
          Math.random() *
          members.length
        )
      ];


    // ========================================
    // جلب معلومات الطرفين
    // ========================================

    const [
      senderData,
      partnerData
    ] = await Promise.all([
      api.getUserInfo(senderID),
      api.getUserInfo(partnerID)
    ]);

    const senderInfo =
      senderData[senderID] || {};

    const partnerInfo =
      partnerData[partnerID] || {};


    let senderName =
      senderInfo.name;

    let partnerName =
      partnerInfo.name;


    if (!senderName) {

      try {

        const data =
          await Users.getData(senderID);

        senderName =
          data?.name;

      } catch {}
    }


    if (!partnerName) {

      try {

        const data =
          await Users.getData(partnerID);

        partnerName =
          data?.name;

      } catch {}
    }


    senderName =
      senderName ||
      "المستخدم";

    partnerName =
      partnerName ||
      "العضو المختار";


    // ========================================
    // روابط صور البروفايل
    // ========================================

    const senderImage =
      senderInfo.thumbSrc ||
      senderInfo.profilePicture ||
      senderInfo.profileUrl;

    const partnerImage =
      partnerInfo.thumbSrc ||
      partnerInfo.profilePicture ||
      partnerInfo.profileUrl;


    if (
      !senderImage ||
      !partnerImage
    ) {

      return api.sendMessage(
        `⌬ ━━ 𝗛𝗜𝗡𝗔 FUN ━━ ⌬\n\n` +
        `❌ تعذر الحصول على صورة أحد الطرفين.`,
        threadID,
        messageID
      );
    }


    // ========================================
    // تحميل الملفات
    // ========================================

    async function downloadFile(
      url,
      filePath
    ) {

      const response =
        await axios.get(
          url,
          {
            responseType:
              "arraybuffer",

            timeout: 20000,

            headers: {
              "User-Agent":
                "Mozilla/5.0"
            }
          }
        );

      await fs.writeFile(
        filePath,
        response.data
      );
    }


    // ========================================
    // تحميل القالب
    // ========================================

    if (
      !fs.existsSync(
        templatePath
      )
    ) {

      await downloadFile(
        TEMPLATE_URL,
        templatePath
      );
    }


    // ========================================
    // تحميل صور الطرفين
    // ========================================

    await Promise.all([

      downloadFile(
        senderImage,
        senderPath
      ),

      downloadFile(
        partnerImage,
        partnerPath
      )

    ]);


    // ========================================
    // قراءة الصور
    // ========================================

    const template =
      await Jimp.read(
        templatePath
      );

    const senderAvatar =
      await Jimp.read(
        senderPath
      );

    const partnerAvatar =
      await Jimp.read(
        partnerPath
      );


    // ========================================
    // قص الصورة إلى مربع
    // ========================================

    function cropSquare(image) {

      const width =
        image.bitmap.width;

      const height =
        image.bitmap.height;

      const size =
        Math.min(
          width,
          height
        );

      const x =
        Math.floor(
          (width - size) / 2
        );

      const y =
        Math.floor(
          (height - size) / 2
        );

      image.crop(
        x,
        y,
        size,
        size
      );

      return image;
    }


    cropSquare(
      senderAvatar
    );

    cropSquare(
      partnerAvatar
    );


    // ========================================
    // حجم صور البروفايل
    // ========================================

    const AVATAR_SIZE =
      153;


    senderAvatar.resize(
      AVATAR_SIZE,
      AVATAR_SIZE,
      Jimp.RESIZE_BICUBIC
    );

    partnerAvatar.resize(
      AVATAR_SIZE,
      AVATAR_SIZE,
      Jimp.RESIZE_BICUBIC
    );


    // ========================================
    // تحويل الصور إلى دوائر
    // ========================================

    senderAvatar.circle();

    partnerAvatar.circle();


    // ========================================
    // إحداثيات الصور داخل القالب
    // ========================================

    const leftX =
      67;

    const leftY =
      163;

    const rightX =
      619;

    const rightY =
      163;


    // ========================================
    // وضع صور البروفايل
    // ========================================

    template.composite(
      senderAvatar,
      leftX,
      leftY
    );

    template.composite(
      partnerAvatar,
      rightX,
      rightY
    );


    // ========================================
    // حساب نسبة التوافق
    // ========================================

    const lovePercent =
      Math.floor(
        Math.random() * 51
      ) + 50;


    // ========================================
    // اختيار الرسالة
    // ========================================

    let loveMessage;

    if (lovePercent >= 90) {

      loveMessage =
        "💖 توافق خيالي! أنتما مثاليان لبعضكما!";

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


    // ========================================
    // تحميل خط النسبة
    // ========================================

    const font =
      await Jimp.loadFont(
        Jimp.FONT_SANS_32_WHITE
      );


    // ========================================
    // نص النسبة
    // ========================================

    const percentText =
      `${lovePercent}%`;


    // ========================================
    // أبعاد النص
    // ========================================

    const textWidth =
      Jimp.measureText(
        font,
        percentText
      );

    const textHeight =
      Jimp.measureTextHeight(
        font,
        percentText,
        200
      );


    // ========================================
    // مركز القلب
    //
    // القالب 850×478 تقريبًا
    // القلب في المنتصف تقريبًا
    // ========================================

    const heartCenterX =
      Math.floor(
        template.bitmap.width / 2
      );

    const heartCenterY =
      Math.floor(
        template.bitmap.height / 2
      );


    // ========================================
    // وضع النسبة داخل القلب
    // ========================================

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


    template.print(
      font,
      textX,
      textY,
      percentText
    );


    // ========================================
    // جودة الصورة
    // ========================================

    template.quality(100);


    // ========================================
    // حفظ الصورة النهائية
    // ========================================

    await template.writeAsync(
      finalPath
    );


    // ========================================
    // الرسالة النهائية
    // ========================================

    const message =
      `⌬ ━━ 𝗛𝗜𝗡𝗔 FUN ━━ ⌬\n\n` +

      `💍 تم الزواج بنجاح!\n\n` +

      `👤 ${senderName}\n` +

      `❤️\n` +

      `💍 ${partnerName}\n\n` +

      `📊 نسبة التوافق: ${lovePercent}%\n` +

      `${loveMessage}\n\n` +

      `✍️ المطور: أبو هريرة`;


    // ========================================
    // إرسال الصورة المدمجة
    // ========================================

    return api.sendMessage(
      {
        body:
          message,

        attachment:
          fs.createReadStream(
            finalPath
          )
      },

      threadID,

      async () => {

        try {

          if (
            await fs.pathExists(
              finalPath
            )
          ) {

            await fs.remove(
              finalPath
            );
          }


          if (
            await fs.pathExists(
              senderPath
            )
          ) {

            await fs.remove(
              senderPath
            );
          }


          if (
            await fs.pathExists(
              partnerPath
            )
          ) {

            await fs.remove(
              partnerPath
            );
          }

        } catch (error) {

          console.error(
            "خطأ في حذف ملفات الكاش:",
            error.message
          );
        }
      },

      messageID
    );


  } catch (error) {

    console.error(
      "❌ خطأ في أمر زوجيني:",
      error
    );


    // ========================================
    // تنظيف الملفات عند حدوث خطأ
    // ========================================

    try {

      if (
        await fs.pathExists(
          senderPath
        )
      ) {

        await fs.remove(
          senderPath
        );
      }


      if (
        await fs.pathExists(
          partnerPath
        )
      ) {

        await fs.remove(
          partnerPath
        );
      }


      if (
        await fs.pathExists(
          finalPath
        )
      ) {

        await fs.remove(
          finalPath
        );
      }

    } catch {}


    return api.sendMessage(
      `⌬ ━━ 𝗛𝗜𝗡𝗔 FUN ━━ ⌬\n\n` +

      `❌ حدث خطأ أثناء إنشاء صورة الزواج.\n\n` +

      `${error.message}\n\n` +

      `✍️ المطور: أبو هريرة`,

      threadID,
      messageID
    );
  }
};