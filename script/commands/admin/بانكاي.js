const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

module.exports.config = {
  name: "بانكاي",
  version: "3.0.0",
  hasPermssion: 1,
  credits: "أبو هريرة",
  description: "طرد عضو مع صورة بانكاي أونوهانا",
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

// ═══════════════════════════════════════════════
// 🩸 GIF أونوهانا
// ═══════════════════════════════════════════════

const IMAGE_URL = "https://files.catbox.moe/ne6qn5.bin";

// نحفظ الـGIF في الذاكرة
let gifBuffer = null;
let loadingGif = null;

// ═══════════════════════════════════════════════
// ⚡ تحميل الـGIF مرة واحدة
// ═══════════════════════════════════════════════

async function loadGif() {
  // موجود بالفعل في الذاكرة
  if (gifBuffer) {
    return gifBuffer;
  }

  // يوجد تحميل جارٍ
  if (loadingGif) {
    return await loadingGif;
  }

  loadingGif = (async () => {
    try {
      // أولًا نحاول استخدام النسخة الموجودة في الكاش
      if (await fs.pathExists(gifPath)) {
        gifBuffer = await fs.readFile(gifPath);

        console.log(
          "[BANKAI] تم تحميل GIF أونوهانا من الكاش"
        );

        return gifBuffer;
      }

      // إذا لم توجد النسخة المحلية نحملها
      console.log(
        "[BANKAI] جاري تحميل GIF أونوهانا..."
      );

      const response = await axios.get(
        IMAGE_URL,
        {
          responseType: "arraybuffer",
          timeout: 15000,
          headers: {
            "User-Agent": "Mozilla/5.0"
          }
        }
      );

      gifBuffer = Buffer.from(response.data);

      // حفظ نسخة محلية
      await fs.writeFile(
        gifPath,
        gifBuffer
      );

      console.log(
        "[BANKAI] تم تحميل GIF أونوهانا وحفظه في الكاش"
      );

      return gifBuffer;

    } catch (error) {
      console.error(
        "[BANKAI] فشل تحميل GIF:",
        error.message
      );

      gifBuffer = null;

      return null;

    } finally {
      loadingGif = null;
    }
  })();

  return await loadingGif;
}

// ═══════════════════════════════════════════════
// 🚀 تجهيز GIF عند تحميل الأمر
// ═══════════════════════════════════════════════

loadGif().catch(error => {
  console.error(
    "[BANKAI] خطأ أثناء تجهيز GIF:",
    error.message
  );
});

// ═══════════════════════════════════════════════
// ⚔️ الأمر
// ═══════════════════════════════════════════════

module.exports.run = async function({
  api,
  event
}) {
  const {
    threadID,
    messageID,
    senderID,
    messageReply
  } = event;

  try {

    // ═══════════════════════════════════════════════
    // 🛡️ معلومات المجموعة
    // ═══════════════════════════════════════════════

    const threadInfo =
      await api.getThreadInfo(threadID);

    const admins =
      threadInfo.adminIDs || [];

    const botID =
      api.getCurrentUserID();

    const isAdmin =
      admins.some(
        admin => admin.id === senderID
      );

    const isBotAdmin =
      admins.some(
        admin => admin.id === botID
      );

    if (!isAdmin) {
      return api.sendMessage(
        `⌬ ━━ HINA ━━ ⌬

⛔ هذا الأمر للأدمن فقط!`,
        threadID,
        messageID
      );
    }

    if (!isBotAdmin) {
      return api.sendMessage(
        `⌬ ━━ HINA ━━ ⌬

⚠️ يجب أن أكون أدمن في المجموعة لاستخدام هذا الأمر`,
        threadID,
        messageID
      );
    }

    // ═══════════════════════════════════════════════
    // 🎯 تحديد العضو
    // ═══════════════════════════════════════════════

    if (!messageReply) {
      return api.sendMessage(
        `⌬ ━━ HINA ━━ ⌬

📝 الاستخدام:
• قم بالرد على رسالة العضو ثم اكتب .بانكاي`,
        threadID,
        messageID
      );
    }

    const targetID =
      messageReply.senderID;

    if (!targetID) {
      return api.sendMessage(
        `⌬ ━━ HINA ━━ ⌬

❌ لم يتم تحديد العضو المستهدف.`,
        threadID,
        messageID
      );
    }

    // ═══════════════════════════════════════════════
    // 🛡️ حماية المطور
    // ═══════════════════════════════════════════════

    const DEV_ID =
      "61578581225040";

    if (targetID === DEV_ID) {
      return api.sendMessage(
        `⌬ ━━ HINA ━━ ⌬

🛡️ لا يمكن طرد المطور!`,
        threadID,
        messageID
      );
    }

    if (targetID === botID) {
      return api.sendMessage(
        `⌬ ━━ HINA ━━ ⌬

😅 لا يمكنني طرد نفسي!`,
        threadID,
        messageID
      );
    }

    // ═══════════════════════════════════════════════
    // 👤 جلب اسم العضو
    // ═══════════════════════════════════════════════

    let userName = "العضو";

    try {
      const userInfo =
        await api.getUserInfo(targetID);

      userName =
        userInfo[targetID]?.name ||
        "العضو";

    } catch (_) {}

    // ═══════════════════════════════════════════════
    // 🖼️ الحصول على GIF الجاهز
    // ═══════════════════════════════════════════════

    const gif = await loadGif();

    // ═══════════════════════════════════════════════
    // 🩸 رسالة أونوهانا
    // ═══════════════════════════════════════════════

    const messageBody =
      `⌬ ━━ HINA ━━ ⌬

🩸 BANKAI — MINAZUKI 🩸

⚔️ Unohana Retsu

✅ تم طرد العضو:
📌 ${userName}
🆔 ${targetID}`;

    // ═══════════════════════════════════════════════
    // 📤 إرسال GIF أولًا
    // ═══════════════════════════════════════════════

    if (gif) {

      try {

        await api.sendMessage(
          {
            body: messageBody,
            attachment: gif
          },
          threadID
        );

        console.log(
          "[BANKAI] تم إرسال GIF أونوهانا"
        );

      } catch (sendError) {

        console.error(
          "[BANKAI] فشل إرسال GIF:",
          sendError.message
        );

        // إذا فشل الـGIF نرسل النص فقط
        await api.sendMessage(
          messageBody,
          threadID
        );
      }

    } else {

      // ═══════════════════════════════════════════
      // 📝 في حال عدم توفر GIF
      // ═══════════════════════════════════════════

      await api.sendMessage(
        messageBody,
        threadID
      );
    }

    // ═══════════════════════════════════════════════
    // ⚡ الطرد بعد الإرسال
    // ═══════════════════════════════════════════════

    try {

      await api.removeUserFromGroup(
        targetID,
        threadID
      );

      console.log(
        `[BANKAI] تم طرد ${targetID}`
      );

    } catch (removeError) {

      console.error(
        "[BANKAI] فشل الطرد:",
        removeError.message
      );

      try {
        await api.sendMessage(
          `⌬ ━━ HINA ━━ ⌬

❌ تعذر طرد العضو`,
          threadID
        );
      } catch (_) {}
    }

  } catch (error) {

    console.error(
      "❌ خطأ في بانكاي:",
      error
    );

    try {

      await api.sendMessage(
        `⌬ ━━ HINA ━━ ⌬

❌ حدث خطأ أثناء تنفيذ البانكاي.`,
        threadID,
        messageID
      );

    } catch (e) {

      console.error(
        "❌ فشل إرسال رسالة الخطأ:",
        e
      );
    }
  }
};