const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "بنترست",
  version: "2.1.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "جلب 5 صور من Pinterest مع دعم المزيد",
  commandCategory: "fun",
  usages: "بنترست [كلمة البحث]",
  cooldowns: 5
};

// ==================================================
// جلسات Pinterest
// ==================================================

if (!global.pinterestSearches) {
  global.pinterestSearches = new Map();
}

// ==================================================
// تحميل صورة
// ==================================================

async function downloadImage(url, filePath) {
  try {
    const response = await axios.get(url, {
      responseType: "arraybuffer",
      timeout: 30000,

      headers: {
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/131.0.0.0 Mobile Safari/537.36",

        "Referer":
          "https://www.pinterest.com/"
      },

      maxContentLength: 20 * 1024 * 1024,
      maxBodyLength: 20 * 1024 * 1024
    });

    if (!response.data) {
      return false;
    }

    await fs.writeFile(
      filePath,
      Buffer.from(response.data)
    );

    return true;

  } catch (error) {
    console.error(
      "Pinterest image error:",
      error.message
    );

    return false;
  }
}

// ==================================================
// البحث في Pinterest
// ==================================================

async function searchPinterest(query) {

  const url =
    "https://www.pinterest.com/search/pins/?q=" +
    encodeURIComponent(query);

  const response = await axios.get(url, {
    timeout: 30000,

    headers: {
      "User-Agent":
        "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/131.0.0.0 Mobile Safari/537.36",

      "Accept":
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",

      "Accept-Language":
        "ar,en-US;q=0.9,en;q=0.8",

      "Cache-Control":
        "no-cache"
    }
  });

  const html = response.data;

  if (!html || typeof html !== "string") {
    throw new Error("تعذر قراءة نتائج Pinterest");
  }

  const results = [];

  // ==================================================
  // استخراج روابط الصور
  // ==================================================

  const regex =
    /https?:\\?\/\\?\/i\.pinimg\.com\\?\/[^"'\\\s<>]+/gi;

  const matches = html.match(regex) || [];

  for (let imageURL of matches) {

    imageURL = imageURL
      .replace(/\\u002F/g, "/")
      .replace(/\\\//g, "/")
      .replace(/\\/g, "")
      .replace(/["']+$/, "");

    if (!imageURL.includes("i.pinimg.com")) {
      continue;
    }

    // ==================================================
    // محاولة الوصول إلى أعلى جودة
    // ==================================================

    imageURL = imageURL
      .replace("/75x75_RS/", "/originals/")
      .replace("/60x60/", "/originals/")
      .replace("/236x/", "/originals/")
      .replace("/474x/", "/originals/")
      .replace("/564x/", "/originals/")
      .replace("/736x/", "/originals/")
      .replace("/1200x/", "/originals/");

    if (!results.includes(imageURL)) {
      results.push(imageURL);
    }
  }

  return [...new Set(results)];
}

// ==================================================
// الأمر
// ==================================================

module.exports.run = async function ({
  api,
  event,
  args
}) {

  const {
    threadID,
    messageID,
    senderID
  } = event;

  // ==================================================
  // IMPORTANT
  // args تأتي من handleCommand وليس event.args
  // ==================================================

  const searchArgs = Array.isArray(args)
    ? args
    : [];

  const query = searchArgs
    .join(" ")
    .trim();

  // ==================================================
  // التحقق من البحث
  // ==================================================

  if (!query) {

    return api.sendMessage(
      `⌬ ━━ 𝗛𝗜𝗡𝗔 PINTEREST ━━ ⌬\n\n` +
      `اكتب كلمة البحث بعد الأمر.\n\n` +
      `مثال:\n` +
      `بنترست ناروتو`,
      threadID,
      messageID
    );
  }

  // ==================================================
  // مجلد الكاش
  // ==================================================

  const cacheDir = path.join(
    __dirname,
    "cache",
    "pinterest"
  );

  await fs.ensureDir(cacheDir);

  const files = [];

  try {

    // ==================================================
    // البحث
    // ==================================================

    const allImages =
      await searchPinterest(query);

    if (!allImages.length) {

      return api.sendMessage(
        `⌬ ━━ 𝗛𝗜𝗡𝗔 PINTEREST ━━ ⌬\n\n` +
        `❌ لم أجد صورًا لهذا البحث.\n\n` +
        `🔎 ${query}`,
        threadID,
        messageID
      );
    }

    // ==================================================
    // أول 5 صور
    // ==================================================

    const urls = allImages.slice(0, 5);

    // ==================================================
    // تحميل الصور
    // ==================================================

    for (let i = 0; i < urls.length; i++) {

      const filePath = path.join(
        cacheDir,
        `pinterest_${senderID}_${Date.now()}_${i}.jpg`
      );

      const success =
        await downloadImage(
          urls[i],
          filePath
        );

      if (success) {
        files.push(filePath);
      }
    }

    // ==================================================
    // التأكد من وجود صور
    // ==================================================

    if (!files.length) {

      return api.sendMessage(
        `⌬ ━━ 𝗛𝗜𝗡𝗔 PINTEREST ━━ ⌬\n\n` +
        `❌ تعذر تحميل الصور من Pinterest.`,
        threadID,
        messageID
      );
    }

    // ==================================================
    // تجهيز المرفقات
    // ==================================================

    const attachments = files.map(
      file => fs.createReadStream(file)
    );

    // ==================================================
    // الرسالة
    // ==================================================

    const message =
      `⌬ ━━ 𝗛𝗜𝗡𝗔 PINTEREST ━━ ⌬\n\n` +
      `🔎 البحث: ${query}\n\n` +
      `🖼️ تم جلب ${files.length} صور\n\n` +
      `↪️ رد على هذه الرسالة بـ "المزيد" للحصول على 5 صور أخرى`;

    // ==================================================
    // إرسال الصور
    // ==================================================

    return api.sendMessage(
      {
        body: message,
        attachment: attachments
      },

      threadID,

      (error, info) => {

        // ==================================================
        // حذف الملفات بعد 30 ثانية
        // ==================================================

        setTimeout(async () => {

          for (const file of files) {

            try {

              if (await fs.pathExists(file)) {
                await fs.remove(file);
              }

            } catch (e) {}

          }

        }, 30000);

        // ==================================================
        // حفظ جلسة البحث
        // ==================================================

        if (
          !error &&
          info &&
          info.messageID
        ) {

          global.pinterestSearches.set(
            String(info.messageID),
            {
              query: query,

              nextIndex: 5,

              senderID: String(senderID),

              createdAt: Date.now(),

              loading: false,

              usedImages: urls
            }
          );

        }

      },

      messageID
    );

  } catch (error) {

    console.error(
      "❌ Pinterest Error:",
      error
    );

    // ==================================================
    // تنظيف الملفات
    // ==================================================

    for (const file of files) {

      try {

        if (await fs.pathExists(file)) {
          await fs.remove(file);
        }

      } catch (e) {}

    }

    return api.sendMessage(
      `⌬ ━━ 𝗛𝗜𝗡𝗔 PINTEREST ━━ ⌬\n\n` +
      `❌ حدث خطأ أثناء البحث.\n\n` +
      `📝 ${error.message}`,
      threadID,
      messageID
    );
  }
};