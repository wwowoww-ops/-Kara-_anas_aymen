const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

module.exports.config = {
  name: "غادري",
  version: "1.2.8",
  hasPermssion: 2,
  credits: "أبو هريرة",
  description: "مغادرة البوت للمجموعة",
  commandCategory: "developer",
  usages: "غادري [ID]",
  cooldowns: 5,
  devID: "61578581225040"
};

module.exports.run = async ({ api, event, args }) => {

  const {
    threadID,
    senderID
  } = event;

  const {
    devID
  } = module.exports.config;


  // ═══════════════════════════════════════
  // 🔐 التحقق من المطور
  // ═══════════════════════════════════════

  if (
    String(senderID) !==
    String(devID)
  ) {

    return api.sendMessage(
      "! ماني قاعدة فبيت اهلك انا",
      threadID
    );
  }


  // ═══════════════════════════════════════
  // 🆔 تحديد المجموعة
  // ═══════════════════════════════════════

  const targetID =
    args &&
    args[0]
      ? String(args[0]).trim()
      : threadID;


  // ═══════════════════════════════════════
  // 📁 إعداد الكاش
  // ═══════════════════════════════════════

  const cacheDir =
    path.join(
      __dirname,
      "cache"
    );

  const pathGif =
    path.join(
      cacheDir,
      "bye.gif"
    );


  // ═══════════════════════════════════════
  // 🚪 مغادرة المجموعة
  // ═══════════════════════════════════════

  const leaveGroup =
    target => {

      try {

        const botID =
          api.getCurrentUserID();

        api.removeUserFromGroup(
          botID,
          target
        );

      } catch (err) {

        console.error(
          "خطأ أثناء المغادرة:",
          err
        );
      }
    };


  // ═══════════════════════════════════════
  // 🧹 حذف ملف GIF
  // ═══════════════════════════════════════

  const cleanUp =
    () => {

      try {

        if (
          fs.existsSync(
            pathGif
          )
        ) {

          fs.unlinkSync(
            pathGif
          );
        }

      } catch (_) {}
    };


  // ═══════════════════════════════════════
  // 🚀 التنفيذ
  // ═══════════════════════════════════════

  try {

    fs.ensureDirSync(
      cacheDir
    );


    // ═════════════════════════════════════
    // 🎞️ تحميل GIF
    // ═════════════════════════════════════

    const response =
      await axios.get(
        "https://media.giphy.com/media/kaBU6pgv0OsPHz2yxy/giphy.gif",
        {
          responseType:
            "arraybuffer",
          timeout: 10000
        }
      );


    fs.writeFileSync(
      pathGif,
      Buffer.from(
        response.data
      )
    );


    // ═════════════════════════════════════
    // 💬 رسالة المغادرة
    // ═════════════════════════════════════

    await api.sendMessage(
      `⌬ ━━ HINA ━━ ⌬\n\n` +
      `أنا في خدمتك دائماً يا سيدي 💖\n\n` +
      `نغادر الآن بكل احترام.. إلى اللقاء 👋`,
      targetID
    );


    // ═════════════════════════════════════
    // 🎞️ إرسال GIF
    // ═════════════════════════════════════

    await api.sendMessage(
      {
        attachment:
          fs.createReadStream(
            pathGif
          )
      },
      targetID
    );


    // ═════════════════════════════════════
    // ⏳ المغادرة بعد 1.5 ثانية
    // ═════════════════════════════════════

    setTimeout(
      () => {

        leaveGroup(
          targetID
        );

        cleanUp();

      },
      1500
    );


  } catch (e) {

    console.error(
      "خطأ في أمر غادري:",
      e
    );

    cleanUp();

    leaveGroup(
      targetID
    );
  }
};