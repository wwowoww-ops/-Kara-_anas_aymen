const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

module.exports.config = {
  name: "بانكاي",
  version: "3.0.0",
  hasPermssion: 1,
  credits: "أبو هريرة",
  description: "طرد عضو مع بانكاي أونوهانا",
  commandCategory: "admin",
  usages: "بانكاي (رد على رسالة العضو)",
  cooldowns: 5
};

// ═══════════════════════════════════════════════
// 📁 إعداد الكاش
// ═══════════════════════════════════════════════

const cacheDir = path.join(__dirname, "cache");
fs.ensureDirSync(cacheDir);

const gifPath = path.join(cacheDir, "unohana_bankai.gif");

// رابط GIF أونوهانا
const IMAGE_URL = "https://files.catbox.moe/ne6qn5.bin";

// تحميل الصورة مرة واحدة فقط
let downloadPromise = null;

async function prepareGif() {
  if (fs.existsSync(gifPath)) {
    return true;
  }

  if (!downloadPromise) {
    downloadPromise = (async () => {
      try {
        console.log("[BANKAI] جاري تحميل GIF أونوهانا...");

        const response = await axios.get(IMAGE_URL, {
          responseType: "arraybuffer",
          timeout: 15000,
          headers: {
            "User-Agent": "Mozilla/5.0"
          }
        });

        await fs.writeFile(gifPath, Buffer.from(response.data));

        console.log("[BANKAI] تم حفظ GIF أونوهانا في الكاش");
        return true;

      } catch (error) {
        console.error(
          "[BANKAI] فشل تحميل GIF:",
          error.message
        );

        return false;
      } finally {
        downloadPromise = null;
      }
    })();
  }

  return await downloadPromise;
}

// تجهيز الصورة عند تشغيل البوت
prepareGif().catch(() => {});

module.exports.run = async function({ api, event }) {
  const {
    threadID,
    messageID,
    senderID,
    messageReply
  } = event;

  try {

    // ═══════════════════════════════════════════════
    // 🛡️ فحص المجموعة
    // ═══════════════════════════════════════════════

    const threadInfo = await api.getThreadInfo(threadID);

    const admins = threadInfo.adminIDs || [];

    const isAdmin = admins.some(
      admin => admin.id === senderID
    );

    const botID = api.getCurrentUserID();

    const isBotAdmin = admins.some(
      admin => admin.id === botID
    );

    if (!isAdmin) {
      return api.sendMessage(
        "⌬ ━━ HINA ━━ ⌬\n\n⛔ هذا الأمر للأدمن فقط!",
        threadID,
        messageID
      );
    }

    if (!isBotAdmin) {
      return api.sendMessage(
        "⌬ ━━ HINA ━━ ⌬\n\n⚠️ يجب أن أكون أدمن في المجموعة لاستخدام هذا الأمر",
        threadID,
        messageID
      );
    }

    // ═══════════════════════════════════════════════
    // 🎯 تحديد العضو
    // ═══════════════════════════════════════════════

    if (!messageReply) {
      return api.sendMessage(
        "⌬ ━━ HINA ━━ ⌬\n\n📝 قم بالرد على رسالة العضو ثم اكتب .بانكاي",
        threadID,
        messageID
      );
    }

    const targetID = messageReply.senderID;

    if (!targetID) {
      return api.sendMessage(
        "⌬ ━━ HINA ━━ ⌬\n\n❌ لم يتم تحديد العضو المستهدف.",
        threadID,
        messageID
      );
    }

    // ═══════════════════════════════════════════════
    // 🛡️ حماية المطور
    // ═══════════════════════════════════════════════

    const DEV_ID = "61578581225040";

    if (targetID === DEV_ID) {
      return api.sendMessage(
        "⌬ ━━ HINA ━━ ⌬\n\n🛡️ لا يمكن طرد المطور!",
        threadID,
        messageID
      );
    }

    if (targetID === botID) {
      return api.sendMessage(
        "⌬ ━━ HINA ━━ ⌬\n\n😅 لا يمكنني طرد نفسي!",
        threadID,
        messageID
      );
    }

    // ═══════════════════════════════════════════════
    // 👤 اسم العضو
    // ═══════════════════════════════════════════════

    let userName = "العضو";

    try {
      const userInfo = await api.getUserInfo(targetID);

      userName =
        userInfo[targetID]?.name ||
        "العضو";

    } catch (_) {}

    // ═══════════════════════════════════════════════
    // 🖼️ تجهيز GIF
    // ═══════════════════════════════════════════════

    let imageAttachment = null;

    const gifReady = await prepareGif();

    if (gifReady && fs.existsSync(gifPath)) {
      imageAttachment = fs.createReadStream(gifPath);
    }

    // ═══════════════════════════════════════════════
    // 🔥 رسالة بانكاي أونوهانا
    // ═══════════════════════════════════════════════

    const messageBody =
      `⌬ ━━ HINA ━━ ⌬\n\n` +
      `🩸 BANKAI — MINAZUKI 🩸\n\n` +
      `⚔️ Unohana Retsu\n\n` +
      `✅ تم طرد العضو:\n` +
      `📌 ${userName}\n` +
      `🆔 ${targetID}`;

    // ═══════════════════════════════════════════════
    // ⚡ الطرد + إرسال الصورة
    // ═══════════════════════════════════════════════

    const removePromise =
      api.removeUserFromGroup(
        targetID,
        threadID
      );

    const sendPromise = imageAttachment
      ? api.sendMessage(
          {
            body: messageBody,
            attachment: imageAttachment
          },
          threadID
        )
      : api.sendMessage(
          messageBody,
          threadID
        );

    // تنفيذ العمليتين معًا
    const results = await Promise.allSettled([
      removePromise,
      sendPromise
    ]);

    // ═══════════════════════════════════════════════
    // 📊 تسجيل الأخطاء فقط
    // ═══════════════════════════════════════════════

    if (results[0].status === "rejected") {
      console.error(
        "[BANKAI] فشل الطرد:",
        results[0].reason?.message
      );
    }

    if (results[1].status === "rejected") {
      console.error(
        "[BANKAI] فشل إرسال GIF:",
        results[1].reason?.message
      );

      // محاولة إرسال النص إذا فشل الـGIF
      try {
        await api.sendMessage(
          messageBody,
          threadID
        );
      } catch (_) {}
    }

  } catch (error) {

    console.error(
      "[BANKAI] خطأ:",
      error
    );

    try {
      await api.sendMessage(
        "⌬ ━━ HINA ━━ ⌬\n\n❌ حدث خطأ أثناء تنفيذ البانكاي.",
        threadID,
        messageID
      );
    } catch (_) {}
  }
};