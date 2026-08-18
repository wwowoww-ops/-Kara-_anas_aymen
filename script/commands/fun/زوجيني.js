const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const Jimp = require("jimp");

module.exports.config = {
  name: "زوجيني",
  version: "3.2.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "زواج عشوائي مع دمج صور الطرفين ونسبة التوافق",
  commandCategory: "fun",
  usages: "زوجيني",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, Users }) {
  const { threadID, messageID, senderID } = event;

  const cacheDir = path.join(__dirname, "cache");

  await fs.ensureDir(cacheDir);

  const senderPath = path.join(
    cacheDir,
    `marry_sender_${senderID}.jpg`
  );

  let partnerID;
  let senderName = "المستخدم";
  let partnerName = "العضو المختار";

  try {

    // ==========================================
    // جلب أعضاء المجموعة
    // ==========================================

    const threadInfo = await api.getThreadInfo(threadID);

    const botID = String(api.getCurrentUserID());

    const members = (threadInfo.participantIDs || []).filter(
      id =>
        String(id) !== botID &&
        String(id) !== String(senderID)
    );

    if (members.length === 0) {
      return api.sendMessage(
        `⌬ ━━ 𝗛𝗜𝗡𝗔 FUN ━━ ⌬

❌ لا يوجد أعضاء كافيين في المجموعة للزواج!`,
        threadID,
        messageID
      );
    }

    // ==========================================
    // اختيار الشريك
    // ==========================================

    partnerID =
      members[Math.floor(Math.random() * members.length)];

    const partnerPath = path.join(
      cacheDir,
      `marry_partner_${partnerID}.jpg`
    );

    const finalPath = path.join(
      cacheDir,
      `marry_${senderID}_${partnerID}_${Date.now()}.jpg`
    );

    // ==========================================
    // معلومات المستخدمين
    // ==========================================

    const [senderData, partnerData] = await Promise.all([
      api.getUserInfo(senderID),
      api.getUserInfo(partnerID)
    ]);

    const senderInfo = senderData[senderID] || {};
    const partnerInfo = partnerData[partnerID] || {};

    senderName =
      senderInfo.name ||
      "المستخدم";

    partnerName =
      partnerInfo.name ||
      "العضو المختار";

    // ==========================================
    // روابط الصور
    // ==========================================

    const senderImage =
      senderInfo.thumbSrc ||
      senderInfo.profilePicture ||
      senderInfo.profileUrl;

    const partnerImage =
      partnerInfo.thumbSrc ||
      partnerInfo.profilePicture ||
      partnerInfo.profileUrl;

    if (!senderImage || !partnerImage) {
      return api.sendMessage(
        `⌬ ━━ 𝗛𝗜𝗡𝗔 FUN ━━ ⌬

❌ لم أتمكن من الحصول على صور الطرفين.`,
        threadID,
        messageID
      );
    }

    // ==========================================
    // تحميل الصور
    // ==========================================

    async function download(url, file) {
      const response = await axios.get(url, {
        responseType: "arraybuffer",
        timeout: 20000,
        headers: {
          "User-Agent":
            "Mozilla/5.0"
        }
      });

      await fs.writeFile(
        file,
        response.data
      );
    }

    await Promise.all([
      download(senderImage, senderPath),
      download(partnerImage, partnerPath)
    ]);

    // ==========================================
    // قراءة الصور
    // ==========================================

    const img1 =
      await Jimp.read(senderPath);

    const img2 =
      await Jimp.read(partnerPath);

    // ==========================================
    // حجم الصور
    // ==========================================

    const SIZE = 700;

    // قص الصور إلى مربع
    function square(image) {

      const w = image.bitmap.width;
      const h = image.bitmap.height;

      if (w > h) {
        image.crop(
          Math.floor((w - h) / 2),
          0,
          h,
          h
        );
      } else if (h > w) {
        image.crop(
          0,
          Math.floor((h - w) / 2),
          w,
          w
        );
      }

      return image;
    }

    square(img1);
    square(img2);

    // تصغير الصور
    img1.resize(SIZE, SIZE);
    img2.resize(SIZE, SIZE);

    // ==========================================
    // Canvas
    // ==========================================

    const GAP = 180;

    const canvasWidth =
      SIZE * 2 + GAP;

    const canvasHeight =
      SIZE;

    const canvas =
      new Jimp(
        canvasWidth,
        canvasHeight,
        0xffffffff
      );

    // ==========================================
    // وضع الصورة الأولى
    // ==========================================

    canvas.composite(
      img1,
      0,
      0
    );

    // ==========================================
    // وضع الصورة الثانية
    // ==========================================

    canvas.composite(
      img2,
      SIZE + GAP,
      0
    );

    // ==========================================
    // إنشاء القلب
    // ==========================================

    const heart = new Jimp(
      120,
      120,
      0x00000000
    );

    // قلب بسيط باستخدام مربعات
    const RED = 0xff1744ff;

    const blocks = [
      [20, 10],
      [60, 10],

      [10, 20],
      [20, 20],
      [30, 20],
      [50, 20],
      [60, 20],
      [70, 20],

      [10, 30],
      [20, 30],
      [30, 30],
      [40, 30],
      [50, 30],
      [60, 30],
      [70, 30],

      [20, 40],
      [30, 40],
      [40, 40],
      [50, 40],
      [60, 40],

      [30, 50],
      [40, 50],
      [50, 50],

      [40, 60]
    ];

    for (const [x, y] of blocks) {

      for (let px = x; px < x + 10; px++) {

        for (let py = y; py < y + 10; py++) {

          heart.setPixelColor(
            RED,
            px,
            py
          );

        }
      }
    }

    // ==========================================
    // وضع القلب في المنتصف
    // ==========================================

    canvas.composite(
      heart,
      SIZE + Math.floor((GAP - 120) / 2),
      Math.floor((SIZE - 120) / 2)
    );

    // ==========================================
    // حفظ الصورة
    // ==========================================

    canvas.quality(100);

    await canvas.writeAsync(
      finalPath
    );

    // ==========================================
    // نسبة التوافق
    // ==========================================

    const base =
      Math.floor(
        Math.random() * 41
      ) + 50;

    const lovePercent =
      Math.min(base, 100);

    let loveMessage;

    if (lovePercent >= 90) {
      loveMessage =
        "💖 توافق خيالي! أنتما مثاليان لبعضكما!";
    } else if (lovePercent >= 70) {
      loveMessage =
        "❤️ توافق رائع!";
    } else if (lovePercent >= 50) {
      loveMessage =
        "💕 توافق جيد!";
    } else {
      loveMessage =
        "💔 توافق ضعيف!";
    }

    // ==========================================
    // الرسالة
    // ==========================================

    const message =
      `⌬ ━━ 𝗛𝗜𝗡𝗔 FUN ━━ ⌬\n\n` +
      `💍 تم الزواج بنجاح!\n\n` +
      `👤 ${senderName}\n` +
      `❤️\n` +
      `💍 ${partnerName}\n\n` +
      `📊 نسبة التوافق: ${lovePercent}%\n` +
      `${loveMessage}\n\n` +
      `✍️ المطور: أبو هريرة`;

    // ==========================================
    // إرسال الصورة المدمجة
    // ==========================================

    return api.sendMessage(
      {
        body: message,
        attachment:
          fs.createReadStream(finalPath)
      },
      threadID,
      async () => {

        try {

          if (
            await fs.pathExists(finalPath)
          ) {
            await fs.remove(finalPath);
          }

          if (
            await fs.pathExists(senderPath)
          ) {
            await fs.remove(senderPath);
          }

          if (
            await fs.pathExists(partnerPath)
          ) {
            await fs.remove(partnerPath);
          }

        } catch (err) {
          console.error(
            "خطأ في حذف ملفات الكاش:",
            err.message
          );
        }

      },
      messageID
    );

  } catch (error) {

    console.error(
      "خطأ في أمر زوجيني:",
      error
    );

    // تنظيف الملفات
    try {
      if (await fs.pathExists(senderPath)) {
        await fs.remove(senderPath);
      }
    } catch {}

    return api.sendMessage(
      `⌬ ━━ 𝗛𝗜𝗡𝗔 FUN ━━ ⌬

❌ حدث خطأ أثناء إنشاء صورة الزواج.

${error.message}

✍️ المطور: أبو هريرة`,
      threadID,
      messageID
    );
  }
};