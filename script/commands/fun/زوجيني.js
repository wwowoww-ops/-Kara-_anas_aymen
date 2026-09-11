const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const jimp = require("jimp");

module.exports.config = {
  name: "زوجيني",
  version: "7.2.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
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


// ==================================================
// تحميل صورة البروفايل
// ==================================================

async function downloadAvatar(uid, savePath) {

  const url =
    `https://graph.facebook.com/${uid}/picture` +
    `?width=512&height=512` +
    `&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

  const response =
    await axios.get(
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
// الحصول على معلومات المجموعة
// ==================================================

async function getGroupInfo(api, Threads, threadID) {

  let info = null;

  // ----------------------------------------------
  // الطريقة الأولى: Threads
  // ----------------------------------------------

  try {

    if (
      Threads &&
      typeof Threads.getInfo === "function"
    ) {

      info =
        await Threads.getInfo(
          String(threadID)
        );

    }

  } catch (error) {

    console.log(
      "زوجيني Threads.getInfo:",
      error.message
    );

  }


  // ----------------------------------------------
  // الطريقة الثانية: API
  // ----------------------------------------------

  if (!info) {

    try {

      if (
        api &&
        typeof api.getThreadInfo === "function"
      ) {

        info =
          await api.getThreadInfo(
            String(threadID)
          );

      }

    } catch (error) {

      console.log(
        "زوجيني api.getThreadInfo:",
        error.message
      );

    }

  }


  // ----------------------------------------------
  // التأكد من البيانات
  // ----------------------------------------------

  if (
    !info ||
    typeof info !== "object"
  ) {

    return null;

  }

  return info;
}


// ==================================================
// استخراج IDs الأعضاء من جميع الصيغ المحتملة
// ==================================================

function getParticipantIDs(info) {

  if (!info) {
    return [];
  }


  // الصيغة الأساسية
  if (
    Array.isArray(
      info.participantIDs
    )
  ) {

    return info.participantIDs
      .map(id => String(id))
      .filter(Boolean);

  }


  // صيغة participants
  if (
    Array.isArray(
      info.participants
    )
  ) {

    return info.participants
      .map(user => {

        if (
          typeof user === "string" ||
          typeof user === "number"
        ) {

          return String(user);

        }

        if (
          user &&
          user.id
        ) {

          return String(user.id);

        }

        if (
          user &&
          user.userID
        ) {

          return String(user.userID);

        }

        return null;

      })
      .filter(Boolean);

  }


  // صيغة userInfo
  if (
    Array.isArray(
      info.userInfo
    )
  ) {

    return info.userInfo
      .map(user => {

        if (
          user &&
          user.id
        ) {

          return String(user.id);

        }

        if (
          user &&
          user.userID
        ) {

          return String(user.userID);

        }

        return null;

      })
      .filter(Boolean);

  }


  return [];
}


// ==================================================
// الحصول على اسم المستخدم
// ==================================================

async function getUserName(
  api,
  Users,
  uid,
  fallback
) {

  try {

    if (
      Users &&
      typeof Users.getNameUser === "function"
    ) {

      const name =
        await Users.getNameUser(
          String(uid)
        );

      if (name) {
        return name;
      }

    }

  } catch (e) {}


  try {

    if (
      api &&
      typeof api.getUserInfo === "function"
    ) {

      const info =
        await api.getUserInfo(
          String(uid)
        );

      if (
        info &&
        info[String(uid)] &&
        info[String(uid)].name
      ) {

        return info[String(uid)].name;

      }

    }

  } catch (e) {}


  return fallback;
}


// ==================================================
// الحصول على جنس المستخدم
//
// 1 = بنت
// 2 = ولد
//
// null = غير معروف
// ==================================================

async function getUserGender(api, uid) {

  try {

    if (
      !api ||
      typeof api.getUserInfo !== "function"
    ) {

      return null;

    }


    const info =
      await api.getUserInfo(
        String(uid)
      );


    const user =
      info &&
      info[String(uid)];


    if (
      !user ||
      user.gender === undefined ||
      user.gender === null
    ) {

      return null;

    }


    const gender =
      Number(user.gender);


    if (
      gender === 1 ||
      gender === 2
    ) {

      return gender;

    }


    return null;

  } catch (error) {

    console.log(
      "زوجيني getUserGender:",
      error.message
    );

    return null;

  }
}


// ==================================================
// الأمر
// ==================================================

module.exports.run = async function ({
  api,
  event,
  Users,
  Threads
}) {

  const threadID =
    String(event.threadID);

  const messageID =
    event.messageID;

  const senderID =
    String(event.senderID);


  const cacheDir =
    path.join(
      __dirname,
      "cache",
      "canvas"
    );


  await fs.ensureDir(
    cacheDir
  );


  const time =
    Date.now();


  const finalPath =
    path.join(
      cacheDir,
      `زوجيني_${senderID}_${time}.png`
    );


  const senderAvatarPath =
    path.join(
      cacheDir,
      `زوجيني_sender_${senderID}_${time}.jpg`
    );


  const partnerAvatarPath =
    path.join(
      cacheDir,
      `زوجيني_partner_${time}.jpg`
    );


  const backgroundPath =
    path.join(
      cacheDir,
      "زوجيني_background.jpg"
    );


  try {

    // ==================================================
    // جلب معلومات المجموعة
    // ==================================================

    const threadInfo =
      await getGroupInfo(
        api,
        Threads,
        threadID
      );


    if (!threadInfo) {

      return api.sendMessage(

        `⌬ ━━ HINA FUN ━━ ⌬

❌ تعذر الحصول على معلومات المجموعة.

📝 لم يتمكن البوت من قراءة أعضاء المجموعة.
حاول استخدام الأمر مرة أخرى.`,

        threadID,
        messageID

      );

    }


    // ==================================================
    // استخراج الأعضاء
    // ==================================================

    const participants =
      getParticipantIDs(
        threadInfo
      );


    if (
      !Array.isArray(participants) ||
      participants.length === 0
    ) {

      return api.sendMessage(

        `⌬ ━━ HINA FUN ━━ ⌬

❌ لا أستطيع العثور على أعضاء المجموعة.

📝 تأكد أن البوت يستطيع قراءة معلومات المجموعة.`,

        threadID,
        messageID

      );

    }


    // ==================================================
    // IDs
    // ==================================================

    const botID =
      String(
        api.getCurrentUserID()
      );


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
            uid !== senderID
          );

        }
      );


    if (
      members.length === 0
    ) {

      return api.sendMessage(

        `⌬ ━━ HINA FUN ━━ ⌬

❌ لا يوجد عضو آخر متاح للاختيار العشوائي.`,

        threadID,
        messageID

      );

    }


    // ==================================================
    // معرفة جنس صاحب الأمر
    //
    // 1 = بنت
    // 2 = ولد
    // null = غير معروف
    // ==================================================

    const senderGender =
      await getUserGender(
        api,
        senderID
      );


    // ==================================================
    // اختيار الشريك
    // ==================================================

    let compatibleMembers = [];


    // --------------------------------------------------
    // إذا كان جنس صاحب الأمر معروفًا
    // --------------------------------------------------

    if (senderGender) {

      // بنت → ولد
      // ولد → بنت

      const requiredGender =
        senderGender === 1
          ? 2
          : 1;


      // ----------------------------------------------
      // فحص جنس الأعضاء
      // ----------------------------------------------

      const genderResults =
        await Promise.all(

          members.map(
            async uid => {

              const gender =
                await getUserGender(
                  api,
                  uid
                );

              return {
                uid: String(uid),
                gender
              };

            }
          )

        );


      // ----------------------------------------------
      // اختيار الجنس الآخر فقط
      // ----------------------------------------------

      compatibleMembers =
        genderResults
          .filter(
            user =>
              user.gender === requiredGender
          )
          .map(
            user =>
              user.uid
          );


      // ----------------------------------------------
      // إذا لم نجد الجنس الآخر
      //
      // نرجع للاختيار العشوائي
      // ----------------------------------------------

      if (
        compatibleMembers.length === 0
      ) {

        compatibleMembers =
          members;

      }

    }


    // --------------------------------------------------
    // إذا لم يتم التعرف على جنس صاحب الأمر
    //
    // اختيار عشوائي من جميع الأعضاء
    // --------------------------------------------------

    else {

      compatibleMembers =
        members;

    }


    // ==================================================
    // التأكد من وجود شخص للاختيار
    // ==================================================

    if (
      compatibleMembers.length === 0
    ) {

      return api.sendMessage(

        `⌬ ━━ HINA FUN ━━ ⌬

❌ لا يوجد شخص متاح للزواج.`,

        threadID,
        messageID

      );

    }


    // ==================================================
    // اختيار الشريك عشوائيًا
    // ==================================================

    const partnerID =
      String(
        compatibleMembers[
          Math.floor(
            Math.random() *
            compatibleMembers.length
          )
        ]
      );


    // ==================================================
    // الأسماء
    // ==================================================

    const senderName =
      await getUserName(
        api,
        Users,
        senderID,
        "المستخدم"
      );


    const partnerName =
      await getUserName(
        api,
        Users,
        partnerID,
        "العضو المختار"
      );


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
    // قراءة الصور
    // ==================================================

    const baseImage =
      await jimp.read(
        backgroundPath
      );


    const senderImage =
      await jimp.read(
        senderAvatarPath
      );


    const partnerImage =
      await jimp.read(
        partnerAvatarPath
      );


    // ==================================================
    // الدائرة
    // ==================================================

    senderImage.circle();

    partnerImage.circle();


    // ==================================================
    // الحجم
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

    }

    else if (
      lovePercent >= 75
    ) {

      loveMessage =
        "❤️ توافق رائع!";

    }

    else if (
      lovePercent >= 60
    ) {

      loveMessage =
        "💕 توافق جيد!";

    }

    else {

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


    // ==================================================
    // مركز القلب
    // ==================================================

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
    // الردود
    // ==================================================

    const funnyReplies = [

      `ألف مبروك الزواج لـ ${senderName} و ${partnerName}!`,

      `تم الزواج! ${senderName} و ${partnerName} أصبحا زوجين!`,

      `مبارك للعروسين ${senderName} و ${partnerName}!`,

      `زواج سعيد لـ ${senderName} و ${partnerName}!`

    ];


    const randomReply =
      funnyReplies[
        Math.floor(
          Math.random() *
          funnyReplies.length
        )
      ];


    const message =
      `⌬ ━━ HINA FUN ━━ ⌬

${randomReply}

👤 ${senderName}

💍 ${partnerName}

❤️ نسبة التوافق:
${lovePercent}%

${loveMessage}

✦ المطور: أبو هريرة`;


    // ==================================================
    // إرسال الصورة
    // ==================================================

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

        } catch (e) {}

      },

      messageID

    );


  } catch (error) {

    console.error(
      "❌ زوجيني ERROR:",
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

      `⌬ ━━ HINA FUN ━━ ⌬

❌ حدث خطأ أثناء إنشاء الصورة.

📝 ${
        error?.message ||
        "خطأ غير معروف"
      }`,

      threadID,
      messageID

    );

  }

};