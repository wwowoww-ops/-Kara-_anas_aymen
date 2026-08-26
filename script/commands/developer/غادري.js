const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

module.exports.config = {
  name: "غادري",
  version: "1.3.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "مغادرة البوت للمجموعة",
  commandCategory: "developer",
  usages: "غادري [ID]",
  cooldowns: 5,
  devID: "61578581225040"
};

module.exports.run = async function ({ api, event, args }) {

  const {
    threadID,
    senderID
  } = event;

  const DEV_ID = String(module.exports.config.devID);

  // ═══════════════════════════════════════
  // 🔐 المطور فقط
  // ═══════════════════════════════════════

  if (String(senderID) !== DEV_ID) {

    return api.sendMessage(
      "ماني قاعدة فبيت اهلك انا",
      threadID
    );
  }

  // ═══════════════════════════════════════
  // 🎯 المجموعة المستهدفة
  // ═══════════════════════════════════════

  const targetID =
    args &&
    args[0]
      ? String(args[0]).trim()
      : String(threadID);

  // ═══════════════════════════════════════
  // 📁 الكاش
  // ═══════════════════════════════════════

  const cacheDir =
    path.join(__dirname, "cache");

  const pathGif =
    path.join(cacheDir, "bye.gif");

  // ═══════════════════════════════════════
  // 🚪 المغادرة
  // ═══════════════════════════════════════

  const leaveGroup = target => {

    try {

      const botID =
        api.getCurrentUserID();

      if (!botID) {
        return;
      }

      api.removeUserFromGroup(
        botID,
        String(target)
      );

    } catch (err) {

      console.error(
        "[غادري] خطأ أثناء المغادرة:",
        err?.message || err
      );
    }
  };

  // ═══════════════════════════════════════
  // 🧹 حذف الملف
  // ═══════════════════════════════════════

  const cleanUp = () => {

    try {

      if (fs.existsSync(pathGif)) {
        fs.unlinkSync(pathGif);
      }

    } catch (_) {}
  };

  try {

    fs.ensureDirSync(cacheDir);

    // ═══════════════════════════════════════
    // 🎞️ تحميل GIF
    // ═══════════════════════════════════════

    try {

      const response =
        await axios.get(
          "https://media.giphy.com/media/kaBU6pgv0OsPHz2yxy/giphy.gif",
          {
            responseType: "arraybuffer",
            timeout: 10000
          }
        );

      fs.writeFileSync(
        pathGif,
        Buffer.from(response.data)
      );

    } catch (gifError) {

      console.error(
        "[غادري] فشل تحميل GIF:",
        gifError?.message || gifError
      );
    }

    // ═══════════════════════════════════════
    // 💬 رسالة المغادرة
    // ═══════════════════════════════════════

    await api.sendMessage(
      `⌬ ━━ HINA ━━ ⌬\n\n` +
      `أنا في خدمتك دائماً يا سيدي 💖\n\n` +
      `نغادر الآن بكل احترام.. إلى اللقاء 👋`,
      targetID
    );

    // ═══════════════════════════════════════
    // 🎞️ إرسال GIF إذا تم تحميله
    // ═══════════════════════════════════════

    if (fs.existsSync(pathGif)) {

      await api.sendMessage(
        {
          attachment:
            fs.createReadStream(pathGif)
        },
        targetID
      );
    }

    // ═══════════════════════════════════════
    // ⏳ المغادرة بعد الإرسال
    // ═══════════════════════════════════════

    setTimeout(() => {

      leaveGroup(targetID);
      cleanUp();

    }, 1500);

  } catch (error) {

    console.error(
      "[غادري] ERROR:",
      error?.message || error
    );

    cleanUp();

    // إذا فشل الإرسال، نحاول المغادرة مباشرة
    leaveGroup(targetID);
  }
};