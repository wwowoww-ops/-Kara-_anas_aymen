const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const jimp = require("jimp");

module.exports.config = {
  name: "بوسة",
  version: "3.0.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "تركيب صورتي شخصين على قالب",
  commandCategory: "Utility",
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
// 🖼️ إعدادات القالب
// ==================================================

const BACKGROUND_URL =
  "https://files.catbox.moe/cbb7zy.jpg";


// أبعاد القالب
const CANVAS_WIDTH = 473;
const CANVAS_HEIGHT = 500;


// حجم صور البروفايل
const AVATAR_SIZE = 132;


// ==================================================
// 📍 إحداثيات البروفايل
// ==================================================

// الشخص الأول
const AVATAR_1_X = 89;
const AVATAR_1_Y = 22;


// الشخص الثاني
const AVATAR_2_X = 258;
const AVATAR_2_Y = 22;


// ==================================================
// 🔵 تحويل الصورة إلى دائرة
// ==================================================

async function makeCircle(filePath) {

  const image =
    await jimp.read(filePath);

  image
    .cover(
      AVATAR_SIZE,
      AVATAR_SIZE,
      jimp.HORIZONTAL_ALIGN_CENTER,
      jimp.VERTICAL_ALIGN_MIDDLE
    )
    .circle();

  return image;
}


// ==================================================
// 👤 استخراج رابط صورة البروفايل
// ==================================================

async function getAvatarURL(api, uid) {

  const id =
    String(uid);


  // الطريقة الأولى
  try {

    if (
      api &&
      typeof api.getUserInfo === "function"
    ) {

      const info =
        await api.getUserInfo(id);


      const user =
        info &&
        info[id];


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


        for (
          const url of possibleURLs
        ) {

          if (
            typeof url === "string" &&
            url.startsWith("http")
          ) {

            return url;

          }

        }

      }

    }

  } catch (error) {

    console.log(
      "[BOSA] getUserInfo:",
      error.message
    );

  }


  // الطريقة الثانية
  try {

    if (
      api &&
      typeof api.getUserInfo === "function"
    ) {

      const info =
        await api.getUserInfo([id]);


      const user =
        info &&
        info[id];


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


        for (
          const url of possibleURLs
        ) {

          if (
            typeof url === "string" &&
            url.startsWith("http")
          ) {

            return url;

          }

        }

      }

    }

  } catch (error) {

    console.log(
      "[BOSA] getUserInfo array:",
      error.message
    );

  }


  throw new Error(
    `تعذر الحصول على رابط صورة البروفايل للعضو ${id}`
  );
}


// ==================================================
// 📥 تحميل صورة البروفايل بجودة عالية
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
      "تم الحصول على صورة فارغة"
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
      "تعذر تحميل القالب"
    );

  }


  await fs.writeFile(
    filePath,
    Buffer.from(response.data)
  );


  return filePath;
}


// ==================================================
// 🧹 حذف الملفات
// ==================================================

async function removeFiles(files) {

  for (
    const file of files
  ) {

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
  // 📌 التأكد من وجود رد
  // ==================================================

  if (!messageReply) {

    return api.sendMessage(

      `⌬ ━━ 𝗛𝗜𝗡𝗔 FUN ━━ ⌬

❌ يجب الرد على رسالة الشخص أولًا.

مثال:

↪️ رد على رسالة شخص
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
    String(targetID) ===
    String(senderID)
  ) {

    return api.sendMessage(

      `⌬ ━━ 𝗛𝗜𝗡𝗔 FUN ━━ ⌬

❌ لا يمكنك استخدام الأمر على نفسك.`,

      threadID,
      messageID

    );

  }


  // ==================================================
  // 📁 مجلد FUN
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


  const avatarOnePath =
    path.join(
      cacheDir,
      `bosa_sender_${senderID}_${time}.jpg`
    );


  const avatarTwoPath =
    path.join(
      cacheDir,
      `bosa_target_${targetID}_${time}.jpg`
    );


  const backgroundPath =
    path.join(
      cacheDir,
      `bosa_bg_${time}.jpg`
    );


  const outputPath =
    path.join(
      cacheDir,
      `bosa_final_${time}.png`
    );


  const temporaryFiles = [

    avatarOnePath,
    avatarTwoPath,
    backgroundPath,
    outputPath

  ];


  try {

    // ==================================================
    // 📥 تحميل الصور بالتوازي
    // ==================================================

    await Promise.all([

      downloadAvatar(
        api,
        senderID,
        avatarOnePath
      ),

      downloadAvatar(
        api,
        targetID,
        avatarTwoPath
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


    // التأكد من أبعاد القالب
    background.resize(
      CANVAS_WIDTH,
      CANVAS_HEIGHT,
      jimp.RESIZE_BICUBIC
    );


    // ==================================================
    // 👤 تجهيز البروفايل الأول
    // ==================================================

    const avatarOne =
      await makeCircle(
        avatarOnePath
      );


    // ==================================================
    // 👤 تجهيز البروفايل الثاني
    // ==================================================

    const avatarTwo =
      await makeCircle(
        avatarTwoPath
      );


    // ==================================================
    // 🎨 تركيب الصور
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
    // 💾 حفظ PNG بدون ضغط JPG
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
    // 🧹 تنظيف بعد الإرسال
    // ==================================================

    setTimeout(
      () => {

        removeFiles(
          temporaryFiles
        );

      },
      15000
    );

  }

};