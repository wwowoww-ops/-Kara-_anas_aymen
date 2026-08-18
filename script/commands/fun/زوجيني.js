const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const Jimp = require("jimp");

module.exports.config = {
  name: "زوجيني",
  version: "3.1.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "زواج عشوائي مع صورة عالية الجودة تجمع الطرفين ونسبة التوافق",
  commandCategory: "fun",
  usages: "زوجيني",
  cooldowns: 5,

  dependencies: {
    axios: "",
    "fs-extra": "",
    jimp: ""
  }
};


/**
 * قص الصورة إلى مربع بدون تشويه
 */
function cropToSquare(image) {
  const width = image.bitmap.width;
  const height = image.bitmap.height;

  const size = Math.min(width, height);

  const x = Math.floor((width - size) / 2);
  const y = Math.floor((height - size) / 2);

  return image.crop(
    x,
    y,
    size,
    size
  );
}


/**
 * إنشاء قلب عالي الجودة
 */
function createHeart(width, height) {
  const heartCanvas = new Jimp(
    width,
    height,
    0x00000000
  );

  const red = {
    r: 255,
    g: 23,
    b: 68,
    a: 255
  };

  // قلب Pixel Art أكبر وأنعم بصريًا
  const pattern = [
    "  XX  XX  ",
    " XXXXXXXXX ",
    "XXXXXXXXXXX",
    "XXXXXXXXXXX",
    " XXXXXXXXX ",
    "  XXXXXXX  ",
    "   XXXXX   ",
    "    XXX    ",
    "     X     "
  ];

  const blockSize = 28;

  const patternWidth =
    11 * blockSize;

  const patternHeight =
    pattern.length * blockSize;

  const startX =
    Math.floor(
      (width - patternWidth) / 2
    );

  const startY =
    Math.floor(
      (height - patternHeight) / 2
    );

  for (let y = 0; y < pattern.length; y++) {

    for (let x = 0; x < pattern[y].length; x++) {

      if (pattern[y][x] !== "X") {
        continue;
      }

      heartCanvas.scan(
        startX + x * blockSize,
        startY + y * blockSize,
        blockSize,
        blockSize,
        function(px, py) {

          const index =
            this.bitmap.index(
              px,
              py
            );

          this.bitmap.data[index] =
            red.r;

          this.bitmap.data[index + 1] =
            red.g;

          this.bitmap.data[index + 2] =
            red.b;

          this.bitmap.data[index + 3] =
            red.a;
        }
      );
    }
  }

  return heartCanvas;
}


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

  const tempDir =
    path.join(
      __dirname,
      "cache"
    );

  try {

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // جلب أعضاء المجموعة
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const threadInfo =
      await api.getThreadInfo(
        threadID
      );

    const participants =
      threadInfo.participantIDs || [];

    const botID =
      api.getCurrentUserID();

    const members =
      participants.filter(
        id =>
          String(id) !== String(botID) &&
          String(id) !== String(senderID)
      );


    if (members.length === 0) {

      return api.sendMessage(
        `⌬ ━━ 𝗛𝗜𝗡𝗔 FUN ━━ ⌬\n\n` +
        `❌ لا يوجد أعضاء كافيين في المجموعة للزواج!`,
        threadID,
        messageID
      );
    }


    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // اختيار شخص عشوائي
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const randomIndex =
      Math.floor(
        Math.random() *
        members.length
      );

    const partnerID =
      members[randomIndex];


    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // جلب بيانات الطرفين
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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
          await Users.getData(
            senderID
          );

        senderName =
          data?.name;
      } catch {}
    }


    if (!partnerName) {
      try {
        const data =
          await Users.getData(
            partnerID
          );

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


    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // حساب نسبة التوافق
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const getCompatibility =
      (name1, name2) => {

        const base =
          Math.floor(
            Math.random() * 41
          ) + 30;

        const len1 =
          name1.length;

        const len2 =
          name2.length;

        const maxLen =
          Math.max(
            len1,
            len2
          );

        const lenFactor =
          maxLen > 0
            ? Math.min(
                len1,
                len2
              ) / maxLen
            : 0;

        const commonLetters =
          [
            ...new Set(
              name1.split("")
            )
          ].filter(
            c =>
              name2.includes(c)
          ).length;

        const uniqueLetters =
          [
            ...new Set(
              name1 + name2
            )
          ].length;

        const letterFactor =
          commonLetters /
          Math.max(
            uniqueLetters,
            1
          );

        const finalPercent =
          Math.round(
            (
              base +
              lenFactor * 15 +
              letterFactor * 15
            ) / 1.3
          );

        return Math.min(
          Math.max(
            finalPercent,
            0
          ),
          100
        );
      };


    const lovePercent =
      getCompatibility(
        senderName,
        partnerName
      );


    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // رسالة حسب النسبة
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    let loveMessage = "";

    if (lovePercent >= 90) {

      loveMessage =
        "💖 توافق خيالي! أنتما مثاليان لبعضكما!";

    } else if (lovePercent >= 70) {

      loveMessage =
        "❤️ توافق رائع! علاقة قوية بإذن الله!";

    } else if (lovePercent >= 50) {

      loveMessage =
        "💕 توافق جيد! مع الوقت ستزداد المحبة!";

    } else if (lovePercent >= 30) {

      loveMessage =
        "💔 توافق متوسط... تحتاجون إلى عمل على العلاقة!";

    } else {

      loveMessage =
        "💔 توافق ضعيف... الله يعينكم على بعض!";
    }


    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // الرد العشوائي
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const funnyReplies = [

      `💍 ألف مبروك الزواج لـ ${senderName} و ${partnerName}! 🎉`,

      `💕 تم الزواج! ${senderName} و ${partnerName} أصبحا زوجين!`,

      `🌸 مبارك للعروسين ${senderName} و ${partnerName}!`,

      `💖 زواج سعيد لـ ${senderName} و ${partnerName}!`
    ];


    const randomReply =
      funnyReplies[
        Math.floor(
          Math.random() *
          funnyReplies.length
        )
      ];


    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // إنشاء مجلد الكاش
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    await fs.ensureDir(
      tempDir
    );


    const senderImagePath =
      path.join(
        tempDir,
        `زوجيني_sender_${senderID}.jpg`
      );


    const partnerImagePath =
      path.join(
        tempDir,
        `زوجيني_partner_${partnerID}.jpg`
      );


    const finalImagePath =
      path.join(
        tempDir,
        `زوجيني_final_${senderID}_${partnerID}_${Date.now()}.jpg`
      );


    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // روابط الصور
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const senderImage =
      senderInfo.thumbSrc ||
      senderInfo.profilePicture ||
      senderInfo.profileUrl;


    const partnerImage =
      partnerInfo.thumbSrc ||
      partnerInfo.profilePicture ||
      partnerInfo.profileUrl;


    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // تحميل الصور بأفضل جودة متاحة
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const downloadImage =
      async (
        url,
        filePath
      ) => {

        if (!url) {
          return false;
        }

        try {

          const response =
            await axios({
              method: "GET",
              url: url,
              responseType:
                "arraybuffer",
              timeout: 20000,
              headers: {
                "User-Agent":
                  "Mozilla/5.0"
              }
            });


          await fs.writeFile(
            filePath,
            response.data
          );


          return true;

        } catch (error) {

          console.error(
            "فشل تحميل الصورة:",
            error.message
          );

          return false;
        }
      };


    const [
      senderImageExists,
      partnerImageExists
    ] = await Promise.all([

      downloadImage(
        senderImage,
        senderImagePath
      ),

      downloadImage(
        partnerImage,
        partnerImagePath
      )
    ]);


    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // إنشاء الصورة عالية الجودة
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    let finalImageCreated =
      false;


    if (
      senderImageExists &&
      partnerImageExists
    ) {

      try {

        const senderImg =
          await Jimp.read(
            senderImagePath
          );


        const partnerImg =
          await Jimp.read(
            partnerImagePath
          );


        // حجم الصور النهائي
        const photoSize =
          800;


        // المساحة بين الصورتين
        const heartSpace =
          220;


        const finalWidth =
          photoSize +
          heartSpace +
          photoSize;


        const finalHeight =
          photoSize;


        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // قص بدون تشويه
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

        cropToSquare(
          senderImg
        );

        cropToSquare(
          partnerImg
        );


        // تصغير/تكبير بجودة أفضل
        senderImg.resize(
          photoSize,
          photoSize,
          Jimp.RESIZE_BICUBIC
        );


        partnerImg.resize(
          photoSize,
          photoSize,
          Jimp.RESIZE_BICUBIC
        );


        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // إنشاء Canvas
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

        const canvas =
          new Jimp(
            finalWidth,
            finalHeight,
            0xffffffff
          );


        // الصورة الأولى
        canvas.composite(
          senderImg,
          0,
          0
        );


        // الصورة الثانية
        canvas.composite(
          partnerImg,
          photoSize +
          heartSpace,
          0
        );


        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // إنشاء القلب
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

        const heart =
          createHeart(
            heartSpace,
            photoSize
          );


        canvas.composite(
          heart,
          photoSize,
          0
        );


        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // جودة JPEG القصوى
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

        canvas.quality(100);

        canvas.deflateLevel(0);

        canvas.deflateStrategy(0);


        await canvas.writeAsync(
          finalImagePath
        );


        finalImageCreated =
          true;


      } catch (imageError) {

        console.error(
          "خطأ أثناء إنشاء الصورة:",
          imageError
        );

        finalImageCreated =
          false;
      }
    }


    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // حفظ الزواج
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const marriagePath =
      "./data/marriages.json";


    await fs.ensureDir(
      "./data"
    );


    if (
      !fs.existsSync(
        marriagePath
      )
    ) {

      await fs.writeFile(
        marriagePath,
        JSON.stringify({})
      );
    }


    let marriages;


    try {

      marriages =
        JSON.parse(
          await fs.readFile(
            marriagePath,
            "utf8"
          )
        );

    } catch {

      marriages = {};
    }


    if (
      !marriages[threadID]
    ) {

      marriages[threadID] = [];
    }


    const existingMarriage =
      marriages[threadID].find(
        m =>
          String(m.user1) ===
            String(senderID) ||
          String(m.user2) ===
            String(senderID)
      );


    if (
      !existingMarriage
    ) {

      marriages[threadID].push({

        user1:
          String(senderID),

        user2:
          String(partnerID),

        date:
          new Date()
            .toLocaleString("ar"),

        timestamp:
          Date.now()
      });


      await fs.writeFile(
        marriagePath,
        JSON.stringify(
          marriages,
          null,
          2
        )
      );
    }


    const totalMarriages =
      marriages[threadID].length;


    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // الرسالة
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const message =
      `⌬ ━━ 𝗛𝗜𝗡𝗔 FUN ━━ ⌬\n\n` +
      `${randomReply}\n\n` +
      `👤 ${senderName}\n` +
      `❤️\n` +
      `💍 ${partnerName}\n\n` +
      `📊 نسبة التوافق: ${lovePercent}%\n` +
      `${loveMessage}\n\n` +
      `📅 تاريخ الزواج: ${new Date().toLocaleString("ar")}\n` +
      `📊 عدد الزيجات في المجموعة: ${totalMarriages}\n\n` +
      `✍️ المطور: أبو هريرة`;


    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // إرسال الصورة
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    if (
      finalImageCreated
    ) {

      return api.sendMessage(
        {
          body:
            message,

          attachment:
            fs.createReadStream(
              finalImagePath
            )
        },

        threadID,

        async () => {

          try {

            if (
              await fs.pathExists(
                finalImagePath
              )
            ) {

              await fs.remove(
                finalImagePath
              );
            }


            if (
              await fs.pathExists(
                senderImagePath
              )
            ) {

              await fs.remove(
                senderImagePath
              );
            }


            if (
              await fs.pathExists(
                partnerImagePath
              )
            ) {

              await fs.remove(
                partnerImagePath
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
    }


    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // في حال فشل دمج الصور
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const attachments = [];


    if (
      senderImageExists
    ) {

      attachments.push(
        fs.createReadStream(
          senderImagePath
        )
      );
    }


    if (
      partnerImageExists
    ) {

      attachments.push(
        fs.createReadStream(
          partnerImagePath
        )
      );
    }


    if (
      attachments.length > 0
    ) {

      return api.sendMessage(
        {
          body:
            message,

          attachment:
            attachments
        },

        threadID,

        messageID
      );
    }


    return api.sendMessage(
      message,
      threadID,
      messageID
    );


  } catch (error) {

    console.error(
      "❌ خطأ في أمر زوجيني:",
      error
    );


    return api.sendMessage(
      `⌬ ━━ 𝗛𝗜𝗡𝗔 FUN ━━ ⌬\n\n` +
      `❌ حدث خطأ أثناء تنفيذ الأمر:\n` +
      `${error.message}\n\n` +
      `✍️ المطور: أبو هريرة`,
      threadID,
      messageID
    );
  }
};