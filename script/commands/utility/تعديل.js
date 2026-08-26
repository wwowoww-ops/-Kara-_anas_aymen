const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const Jimp = require("jimp");

module.exports.config = {
  name: "تعديل",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "تعديل الصور وتحسينها",
  commandCategory: "utility",
  usages: "تعديل [التأثير] بالرد على صورة",
  cooldowns: 5
};

// ==================================================
// الإعدادات
// ==================================================

const effects = {
  "ابيض واسود": "grayscale",
  "ابيض و اسود": "grayscale",
  "اسود وابيض": "grayscale",
  "سينمائي": "cinematic",
  "زيادة اضاءة": "brighten",
  "اضاءة": "brighten",
  "تقليل اضاءة": "darken",
  "تعتيم": "darken",
  "تشويش": "noise",
  "تمويه": "noise",
  "ضبابية": "blur",
  "جودة": "quality",
  "تحسين جودة": "quality"
};

// ==================================================
// الحصول على رابط الصورة
// ==================================================

function getImageURL(event) {
  const reply = event.messageReply;

  if (!reply) return null;

  if (Array.isArray(reply.attachments)) {
    for (const attachment of reply.attachments) {
      if (!attachment) continue;

      if (
        attachment.type === "photo" ||
        attachment.type === "image"
      ) {
        return (
          attachment.url ||
          attachment.largePreviewUrl ||
          attachment.previewUrl
        );
      }
    }
  }

  return null;
}

// ==================================================
// تطبيق التأثير
// ==================================================

async function applyEffect(image, effect) {

  switch (effect) {

    // أبيض وأسود
    case "grayscale":
      image.grayscale();
      break;

    // زيادة الإضاءة
    case "brighten":
      image.brightness(0.25);
      break;

    // تقليل الإضاءة
    case "darken":
      image.brightness(-0.25);
      break;

    // ضبابية
    case "blur":
      image.blur(8);
      break;

    // تشويش / تمويه خفيف
    case "noise":
      image.noise(15);
      break;

    // تحسين الجودة
    case "quality":
      image
        .contrast(0.15)
        .brightness(0.05)
        .normalize();

      break;

    // سينمائي
    case "cinematic":

      image
        .contrast(0.25)
        .brightness(-0.05)
        .color([
          { apply: "hue", params: [-8] },
          { apply: "saturate", params: [8] }
        ]);

      break;

    default:
      throw new Error("تأثير غير معروف");
  }

  return image;
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
    messageID
  } = event;

  try {

    // ----------------------------------------------
    // التحقق من الرد على صورة
    // ----------------------------------------------

    const imageURL =
      getImageURL(event);

    if (!imageURL) {

      return api.sendMessage(
        `⌬ ━━ 𝗛𝗜𝗡𝗔 EDIT ━━ ⌬\n\n` +
        `❌ يجب أن ترد على رسالة تحتوي صورة.\n\n` +
        `مثال:\n` +
        `تعديل ابيض واسود`,
        threadID,
        messageID
      );
    }

    // ----------------------------------------------
    // التأثير
    // ----------------------------------------------

    const effectName =
      Array.isArray(args)
        ? args.join(" ").trim().toLowerCase()
        : "";

    const effect =
      effects[effectName];

    if (!effect) {

      return api.sendMessage(
        `⌬ ━━ 𝗛𝗜𝗡𝗔 EDIT ━━ ⌬\n\n` +
        `❌ التأثير غير معروف.\n\n` +
        `التأثيرات المتاحة:\n\n` +
        `• تعديل جودة\n` +
        `• تعديل ابيض واسود\n` +
        `• تعديل سينمائي\n` +
        `• تعديل زيادة اضاءة\n` +
        `• تعديل تقليل اضاءة\n` +
        `• تعديل تشويش\n` +
        `• تعديل ضبابية`,
        threadID,
        messageID
      );
    }

    // ----------------------------------------------
    // مجلد الكاش
    // ----------------------------------------------

    const cacheDir =
      path.join(
        __dirname,
        "cache",
        "edit"
      );

    await fs.ensureDir(cacheDir);

    const inputPath =
      path.join(
        cacheDir,
        `input_${Date.now()}_${Math.random()
          .toString(36)
          .slice(2)}.jpg`
      );

    const outputPath =
      path.join(
        cacheDir,
        `output_${Date.now()}_${Math.random()
          .toString(36)
          .slice(2)}.jpg`
      );

    // ----------------------------------------------
    // تحميل الصورة
    // ----------------------------------------------

    const response =
      await axios.get(
        imageURL,
        {
          responseType: "arraybuffer",
          timeout: 30000,
          maxContentLength:
            20 * 1024 * 1024,
          maxBodyLength:
            20 * 1024 * 1024,
          headers: {
            "User-Agent":
              "Mozilla/5.0"
          }
        }
      );

    await fs.writeFile(
      inputPath,
      Buffer.from(response.data)
    );

    // ----------------------------------------------
    // قراءة الصورة بـ Jimp
    // ----------------------------------------------

    let image =
      await Jimp.read(inputPath);

    // ----------------------------------------------
    // تطبيق التأثير
    // ----------------------------------------------

    image =
      await applyEffect(
        image,
        effect
      );

    // ----------------------------------------------
    // حفظ الصورة
    // ----------------------------------------------

    await image
      .quality(95)
      .writeAsync(outputPath);

    // ----------------------------------------------
    // إرسال النتيجة
    // ----------------------------------------------

    const effectDisplay =
      effectName;

    await new Promise(
      (resolve, reject) => {

        api.sendMessage(
          {
            body:
              `⌬ ━━ 𝗛𝗜𝗡𝗔 EDIT ━━ ⌬\n\n` +
              `✓ تم تعديل الصورة بنجاح\n\n` +
              `🎨 التأثير: ${effectDisplay}`,
            attachment:
              fs.createReadStream(
                outputPath
              )
          },

          threadID,

          error => {
            if (error) reject(error);
            else resolve();
          },

          messageID
        );

      }
    );

    // ----------------------------------------------
    // تنظيف الملفات
    // ----------------------------------------------

    setTimeout(
      async () => {

        try {
          await fs.remove(inputPath);
          await fs.remove(outputPath);
        } catch (_) {}

      },
      30000
    );

  } catch (error) {

    console.error(
      "[HINA EDIT ERROR]",
      error
    );

    return api.sendMessage(
      `⌬ ━━ 𝗛𝗜𝗡𝗔 EDIT ━━ ⌬\n\n` +
      `❌ حدث خطأ أثناء تعديل الصورة.\n\n` +
      `📝 ${error?.message || "خطأ غير معروف"}`,
      threadID,
      messageID
    );
  }
};