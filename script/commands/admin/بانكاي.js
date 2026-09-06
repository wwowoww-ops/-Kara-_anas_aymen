const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

module.exports.config = {
  name: "بانكاي",
  version: "3.1.0",
  hasPermssion: 1,
  credits: "أبو هريرة",
  description: "طرد عضو مع صورة بانكاي أونوهانا",
  commandCategory: "admin",
  usages: "بانكاي (رد على رسالة العضو)",
  cooldowns: 5
};

// ═══════════════════════════════════════════════
// 📁 الكاش
// ═══════════════════════════════════════════════

const cacheDir = path.join(__dirname, "cache");
fs.ensureDirSync(cacheDir);

const gifPath = path.join(
  cacheDir,
  "unohana_bankai.gif"
);

// رابط GIF أونوهانا
const IMAGE_URL =
  "https://files.catbox.moe/ne6qn5.bin";

let preparingGif = null;

// ═══════════════════════════════════════════════
// 🩸 تجهيز الـGIF
// ═══════════════════════════════════════════════

async function prepareGif() {

  // إذا موجود بالفعل لا نحمله مرة ثانية
  if (
    await fs.pathExists(gifPath) &&
    (await fs.stat(gifPath)).size > 0
  ) {
    return true;
  }

  // منع تحميله أكثر من مرة في نفس الوقت
  if (preparingGif) {
    return await preparingGif;
  }

  preparingGif = (async () => {
    try {

      console.log(
        "[BANKAI] جاري تحميل GIF أونوهانا..."
      );

      const response = await axios.get(
        IMAGE_URL,
        {
          responseType: "arraybuffer",
          timeout: 20000,
          headers: {
            "User-Agent": "Mozilla/5.0"
          }
        }
      );

      const data = Buffer.from(response.data);

      if (!data || data.length === 0) {
        throw new Error(
          "ملف GIF فارغ"
        );
      }

      await fs.writeFile(
        gifPath,
        data
      );

      console.log(
        `[BANKAI] تم حفظ GIF أونوهانا (${data.length} bytes)`
      );

      return true;

    } catch (error) {

      console.error(
        "[BANKAI] فشل تحميل GIF:",
        error.message
      );

      return false;

    } finally {
      preparingGif = null;
    }
  })();

  return await preparingGif;
}

// تجهيز الصورة عند تشغيل الأمر
prepareGif().catch(() => {});

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
    // 🛡️ فحص الأدمن
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
قم بالرد على رسالة العضو ثم اكتب .بانكاي`,
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
    // 👤 اسم العضو
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
    // 🖼️ التأكد من وجود GIF
    // ═══════════════════════════════════════════════

    let gifReady =
      await prepareGif();

    // ═══════════════════════════════════════════════
    // 🔥 الرسالة
    // ═══════════════════════════════════════════════

    const messageBody =
      `⌬ ━━ HINA ━━ ⌬

🩸 BANKAI — MINAZUKI 🩸

⚔️ Unohana Retsu

✅ تم طرد العضو:
📌 ${userName}
🆔 ${targetID}`;

    // ═══════════════════════════════════════════════
    // 📤 إرسال الـGIF
    // ═══════════════════════════════════════════════

    if (
      gifReady &&
      await fs.pathExists(gifPath)
    ) {

      try {

        const attachment =
          fs.createReadStream(gifPath);

        await api.sendMessage(
          {
            body: messageBody,
            attachment: attachment
          },
          threadID
        );

        console.log(
          "[BANKAI] تم إرسال GIF أونوهانا بنجاح"
        );

      } catch (error) {

        console.error(
          "[BANKAI] فشل إرسال GIF:",
          error.message
        );

        // إرسال النص فقط في حالة فشل المرفق
        await api.sendMessage(
          messageBody,
          threadID
        );
      }

    } else {

      console.log(
        "[BANKAI] GIF غير متوفر، سيتم إرسال النص"
      );

      await api.sendMessage(
        messageBody,
        threadID
      );
    }

    // ═══════════════════════════════════════════════
    // ⚡ الطرد
    // ═══════════════════════════════════════════════

    try {

      await api.removeUserFromGroup(
        targetID,
        threadID
      );

      console.log(
        `[BANKAI] تم طرد ${targetID}`
      );

    } catch (error) {

      console.error(
        "[BANKAI] فشل الطرد:",
        error.message
      );

    }

  } catch (error) {

    console.error(
      "[BANKAI] خطأ:",
      error
    );

    try {

      await api.sendMessage(
        `⌬ ━━ HINA ━━ ⌬

❌ حدث خطأ أثناء تنفيذ البانكاي.`,
        threadID,
        messageID
      );

    } catch (_) {}
  }
};