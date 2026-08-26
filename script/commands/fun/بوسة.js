const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const jimp = require("jimp");

module.exports.config = {
  name: "بوسة",
  version: "4.0.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "تركيب صور بروفايل شخصين على القالب",
  commandCategory: "Fun",
  usages: "بوسة بالرد على رسالة",
  cooldowns: 5,

  dependencies: {
    axios: "",
    "fs-extra": "",
    path: "",
    jimp: ""
  }
};


// ==================================================
// 🖼️ القالب
// ==================================================

const BACKGROUND_URL =
  "https://files.catbox.moe/cbb7zy.jpg";


// ==================================================
// 📐 أبعاد القالب
// ==================================================

const CANVAS_WIDTH = 473;
const CANVAS_HEIGHT = 500;


// ==================================================
// 👤 حجم صور البروفايل
// ==================================================

const AVATAR_SIZE = 132;


// ==================================================
// 📍 إحداثيات الصور
// ==================================================

const AVATAR_1_X = 89;
const AVATAR_1_Y = 22;

const AVATAR_2_X = 258;
const AVATAR_2_Y = 22;


// ==================================================
// 📥 الحصول على رابط صورة المستخدم
// ==================================================

async function getAvatarURL(api, uid) {

  const id = String(uid);

  try {

    const info =
      await api.getUserInfo(id);

    const user =
      info && info[id];

    if (user) {

      const possibleURLs = [
        user.thumbSrc,
        user.imageSrc,
        user.profilePic,
        user.profilePicture,
        user.avatar,
        user.avatarUrl,
        user.picture
      ];

      for (const url of possibleURLs) {

        if (
          typeof url === "string" &&
          /^https?:\/\//i.test(url)
        ) {
          return url;
        }

      }
    }

  } catch (error) {

    console.log(
      "[BOSA] getUserInfo error:",
      error.message
    );

  }

  throw new Error(
    "تعذر الحصول على صورة البروفايل."
  );
}


// ==================================================
// 📥 تحميل صورة البروفايل
// ==================================================

async function downloadAvatar(
  api,
  uid,
  filePath
) {

  const avatarURL =
    await getAvatarURL(
      api,
      uid
    );

  const response =
    await axios.get(
      avatarURL,
      {
        responseType:
          "arraybuffer",

        timeout:
          30000,

        maxContentLength:
          30 * 1024 * 1024,

        maxBodyLength:
          30 * 1024 * 1024,

        headers: {
          "User-Agent":
            "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/131.0.0.0 Mobile Safari/537.36",

          "Accept":
            "image/avif,image/webp,image/apng,image/*,*/*;q=0.8"
        }
      }
    );


  if (
    !response.data ||
    !response.data.length
  ) {

    throw new Error(
      "صورة البروفايل فارغة."
    );

  }


  await fs.writeFile(
    filePath,
    Buffer.from(response.data)
  );

  return filePath;
}


// ==================================================
// 🖼️ تحميل القالب
// ==================================================

async function downloadBackground(
  filePath
) {

  const response =
    await axios.get(
      BACKGROUND_URL,
      {
        responseType:
          "arraybuffer",

        timeout:
          30000,

        maxContentLength:
          30 * 1024 * 1024,

        maxBodyLength:
          30 * 1024 * 1024,

        headers: {
          "User-Agent":
            "Mozilla/5.0",

          "Accept":
            "image/jpeg,image/png,image/*"
        }
      }
    );


  if (
    !response.data ||
    !response.data.length
  ) {

    throw new Error(
      "تعذر تحميل القالب."
    );

  }


  await fs.writeFile(
    filePath,
    Buffer.from(response.data)
  );

  return filePath;
}


// ==================================================
// 🔵 تجهيز صورة البروفايل
// ==================================================

async function prepareAvatar(
  filePath
) {

  const image =
    await jimp.read(
      filePath
    );


  // --------------------------------------------------
  // توحيد الحجم قبل القص
  // --------------------------------------------------

  image.cover(
    AVATAR_SIZE,
    AVATAR_SIZE,
    jimp.HORIZONTAL_ALIGN_CENTER,
    jimp.VERTICAL_ALIGN_MIDDLE
  );


  // --------------------------------------------------
  // تحويل إلى دائرة
  // --------------------------------------------------

  image.circle();


  return image;
}


// ==================================================
// 🧹 حذف الملفات
// ==================================================

async function cleanFiles(files) {

  for (const file of files) {

    try {

      if (
        file &&
        await fs.pathExists(file)
      ) {

        await fs.remove(file);

      }

    } catch (_) {}

  }

}


// ==================================================
// 🚀 الأمر الرئيسي
// ==================================================

module.exports.run =
async function({
  api,
  event
}) {

  const {
    threadID,
    messageID,
    senderID,
    messageReply
  } = event;


  // ==================================================
  // 📌 يجب الرد على شخص
  // ==================================================

  if (!messageReply) {

    return api.sendMessage(

      `⌬ ━━ 𝗛𝗜𝗡𝗔 FUN ━━ ⌬

❌ يجب الرد على رسالة الشخص أولًا.

↪️ قم بالرد على رسالة الشخص
ثم اكتب:

بوسة`,

      threadID,
      messageID

    );

  }


  const targetID =
    messageReply.senderID;


  if (!targetID) {

    return api.sendMessage(

      `⌬ ━━ 𝗛𝗜𝗡𝗔 FUN ━━ ⌬

❌ تعذر الحصول على معرف الشخص.`,

      threadID,
      messageID

    );

  }


  // ==================================================
  // 🚫 منع استخدام الأمر على النفس
  // ==================================================

  if (
    String(senderID) ===
    String(targetID)
  ) {

    return api.sendMessage(

      `⌬ ━━ 𝗛𝗜𝗡𝗔 FUN ━━ ⌬

❌ لا يمكنك استخدام الأمر على نفسك.`,

      threadID,
      messageID

    );

  }


  // ==================================================
  // 📁 مجلد الكاش
  // ==================================================

  const cacheDir =
    path.join(
      __dirname,
      "cache",
      "fun"
    );


  await fs.ensureDir(
    cacheDir
  );


  // ==================================================
  // 🕐 أسماء الملفات
  // ==================================================

  const time =
    Date.now();


  const senderAvatarPath =
    path.join(
      cacheDir,
      `bosa_sender_${senderID}_${time}.jpg`
    );


  const targetAvatarPath =
    path.join(
      cacheDir,
      `bosa_target_${targetID}_${time}.jpg`
    );


  const backgroundPath =
    path.join(
      cacheDir,
      `bosa_background_${time}.jpg`
    );


  const outputPath =
    path.join(
      cacheDir,
      `bosa_result_${time}.png`
    );


  const filesToClean = [
    senderAvatarPath,
    targetAvatarPath,
    backgroundPath,
    outputPath
  ];


  try {

    // ==================================================
    // 📥 تحميل كل شيء
    // ==================================================

    await Promise.all([

      downloadAvatar(
        api,
        senderID,
        senderAvatarPath
      ),

      downloadAvatar(
        api,
        targetID,
        targetAvatarPath
      ),

      downloadBackground(
        backgroundPath
      )

    ]);


    // ==================================================
    // 🖼️ قراءة القالب
    // ==================================================

    const background =
      await jimp.read(
        backgroundPath
      );


    // ==================================================
    // 📐 ضبط القالب
    // ==================================================

    background.resize(
      CANVAS_WIDTH,
      CANVAS_HEIGHT,
      jimp.RESIZE_BICUBIC
    );


    // ==================================================
    // 👤 تجهيز الصورة الأولى
    // ==================================================

    const avatarOne =
      await prepareAvatar(
        senderAvatarPath
      );


    // ==================================================
    // 👤 تجهيز الصورة الثانية
    // ==================================================

    const avatarTwo =
      await prepareAvatar(
        targetAvatarPath
      );


    // ==================================================
    // 🎨 تركيب البروفايل الأول
    // ==================================================

    background.composite(
      avatarOne,
      AVATAR_1_X,
      AVATAR_1_Y,
      {
        mode:
          jimp.BLEND_SOURCE_OVER,

        opacitySource:
          1,

        opacityDest:
          1
      }
    );


    // ==================================================
    // 🎨 تركيب البروفايل الثاني
    // ==================================================

    background.composite(
      avatarTwo,
      AVATAR_2_X,
      AVATAR_2_Y,
      {
        mode:
          jimp.BLEND_SOURCE_OVER,

        opacitySource:
          1,

        opacityDest:
          1
      }
    );


    // ==================================================
    // 💾 حفظ PNG
    // ==================================================

    await background.writeAsync(
      outputPath
    );


    // ==================================================
    // 📤 إرسال الصورة
    // ==================================================

    await new Promise(
      (resolve, reject) => {

        api.sendMessage(

          {
            body:
              `⌬ ━━ 𝗛𝗜𝗡𝗔 FUN ━━ ⌬

🖼️ تم إنشاء الصورة بنجاح.`,

            attachment:
              fs.createReadStream(
                outputPath
              )
          },

          threadID,

          (error) => {

            if (error) {

              reject(error);

            } else {

              resolve();

            }

          },

          messageID

        );

      }
    );


  } catch (error) {

    console.error(
      "[HINA BOSA ERROR]",
      error
    );


    return api.sendMessage(

      `⌬ ━━ 𝗛𝗜𝗡𝗔 FUN ━━ ⌬

❌ حدث خطأ أثناء إنشاء الصورة.

📝 ${
        error?.message ||
        "خطأ غير معروف"
      }`,

      threadID,
      messageID

    );


  } finally {

    // ==================================================
    // 🧹 تنظيف الملفات
    // ==================================================

    setTimeout(
      () => {

        cleanFiles(
          filesToClean
        );

      },
      15000
    );

  }

};