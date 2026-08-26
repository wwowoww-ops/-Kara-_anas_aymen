const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const jimp = require("jimp");

module.exports.config = {
  name: "بوسة",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "تركيب صورتي شخصين على القالب",
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
// ⚙️ إعدادات القالب
// ==================================================

const BACKGROUND_URL =
  "https://files.catbox.moe/15lf0l.jpg";

const AVATAR_SIZE = 130;

const AVATAR_1_X = 200;
const AVATAR_1_Y = 70;

const AVATAR_2_X = 350;
const AVATAR_2_Y = 150;


// ==================================================
// 🔵 تحويل الصورة إلى دائرة
// ==================================================

async function makeCircle(filePath) {

  const image =
    await jimp.read(filePath);

  image.circle();

  return image;
}


// ==================================================
// 👤 الحصول على رابط صورة البروفايل
// بدون Access Token
// ==================================================

async function getAvatarURL(api, uid) {

  const id = String(uid);

  // الطريقة الأولى: getUserInfo
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

        const avatarURL =
          user.thumbSrc ||
          user.imageSrc ||
          user.profilePic ||
          user.profilePicture ||
          user.avatar;

        if (avatarURL) {
          return avatarURL;
        }
      }
    }

  } catch (error) {

    console.log(
      "[BOSA] getUserInfo:",
      error.message
    );

  }


  // الطريقة الثانية: getUserInfo مع Array
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

        const avatarURL =
          user.thumbSrc ||
          user.imageSrc ||
          user.profilePic ||
          user.profilePicture ||
          user.avatar;

        if (avatarURL) {
          return avatarURL;
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
    `تعذر الحصول على صورة البروفايل للعضو ${id}`
  );
}


// ==================================================
// 👤 تحميل صورة البروفايل
// ==================================================

async function getAvatar(
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

        headers: {
          "User-Agent":
            "Mozilla/5.0"
        },

        maxContentLength:
          20 * 1024 * 1024,

        maxBodyLength:
          20 * 1024 * 1024
      }
    );


  if (
    !response.data ||
    !response.data.length
  ) {

    throw new Error(
      "صورة البروفايل فارغة"
    );

  }


  await fs.writeFile(
    filePath,
    Buffer.from(
      response.data
    )
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

        headers: {
          "User-Agent":
            "Mozilla/5.0"
        }
      }
    );


  if (
    !response.data ||
    !response.data.length
  ) {

    throw new Error(
      "تعذر تحميل قالب الصورة"
    );

  }


  await fs.writeFile(
    filePath,
    Buffer.from(
      response.data
    )
  );


  return filePath;
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

مثال:
↪️ رد على رسالة شخص
ثم اكتب: بوسة`,

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
  // 📂 الملفات
  // ==================================================

  const time =
    Date.now();


  const avatarOnePath =
    path.join(
      cacheDir,
      `bosa_${senderID}_${time}.jpg`
    );


  const avatarTwoPath =
    path.join(
      cacheDir,
      `bosa_${targetID}_${time}.jpg`
    );


  const backgroundPath =
    path.join(
      cacheDir,
      `bosa_background_${time}.jpg`
    );


  const outputPath =
    path.join(
      cacheDir,
      `bosa_${time}.png`
    );


  try {

    // ==================================================
    // ⏳ تحميل الصور والقالب
    // ==================================================

    await Promise.all([

      getAvatar(
        api,
        senderID,
        avatarOnePath
      ),

      getAvatar(
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


    // ==================================================
    // 👤 تجهيز الصورة الأولى
    // ==================================================

    const avatarOne =
      await makeCircle(
        avatarOnePath
      );


    avatarOne.resize(
      AVATAR_SIZE,
      AVATAR_SIZE,
      jimp.RESIZE_BICUBIC
    );


    // ==================================================
    // 👤 تجهيز الصورة الثانية
    // ==================================================

    const avatarTwo =
      await makeCircle(
        avatarTwoPath
      );


    avatarTwo.resize(
      AVATAR_SIZE,
      AVATAR_SIZE,
      jimp.RESIZE_BICUBIC
    );


    // ==================================================
    // 🎨 تركيب الصور
    // ==================================================

    background.composite(
      avatarOne,
      AVATAR_1_X,
      AVATAR_1_Y
    );


    background.composite(
      avatarTwo,
      AVATAR_2_X,
      AVATAR_2_Y
    );


    // ==================================================
    // 💾 إنشاء الصورة النهائية
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
      async () => {

        const files = [

          avatarOnePath,
          avatarTwoPath,
          backgroundPath,
          outputPath

        ];


        for (
          const file of files
        ) {

          try {

            if (
              await fs.pathExists(
                file
              )
            ) {

              await fs.remove(
                file
              );

            }

          } catch (_) {}

        }

      },
      10000
    );

  }

};