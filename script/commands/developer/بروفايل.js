const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { Readable } = require("stream");
const Jimp = require("jimp");

// ============================================================
// CONFIG
// ============================================================

module.exports.config = {
name: "بروفايل",
version: "3.0.0",
hasPermssion: 2,
credits: "أبو هريرة",
description: "تغيير صورة بروفايل البوت بواسطة الرد على صورة",
commandCategory: "admin",
usages: "بروفايل [رد على صورة]",
cooldowns: 5
};

// ============================================================
// ADMINBOT
// ============================================================

function isDeveloper(senderID) {
const admins = global.config?.ADMINBOT || [];

return admins
.map(id => String(id))
.includes(String(senderID));
}

// ============================================================
// SEND
// ============================================================

function send(api, message, threadID, messageID) {
return api.sendMessage(
"⌬ ━━ 𝗛𝗜𝗡𝗔 ━━ ⌬\n\n${message}",
threadID,
messageID
);
}

// ============================================================
// DOWNLOAD IMAGE
// ============================================================

async function downloadImage(url) {
const response = await axios.get(url, {
responseType: "arraybuffer",
maxContentLength: 10 * 1024 * 1024,
maxBodyLength: 10 * 1024 * 1024,
headers: {
"User-Agent":
"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
},
timeout: 30000
});

if (!response.data || !response.data.length) {
throw new Error("الصورة فارغة");
}

return Buffer.from(response.data);
}

// ============================================================
// CONVERT TO JPG
// ============================================================

async function convertToJPG(buffer) {
const image = await Jimp.read(buffer);

// تصغير الصور الكبيرة مع الحفاظ على النسبة
if (image.bitmap.width > 2000 || image.bitmap.height > 2000) {
image.scaleToFit(2000, 2000);
}

image.background(0xffffffff);

// جودة مناسبة لصورة البروفايل
image.quality(85);

const jpgBuffer = await image.getBufferAsync(
Jimp.MIME_JPEG
);

if (!jpgBuffer || !jpgBuffer.length) {
throw new Error("فشل تحويل الصورة إلى JPG");
}

return jpgBuffer;
}

// ============================================================
// ENSURE UNDER 4MB
// ============================================================

async function makeUnder4MB(buffer) {
let image = await Jimp.read(buffer);

if (
image.bitmap.width > 1600 ||
image.bitmap.height > 1600
) {
image.scaleToFit(1600, 1600);
}

let quality = 85;
let result;

while (quality >= 35) {
image.quality(quality);

result = await image.getBufferAsync(
  Jimp.MIME_JPEG
);

if (result.length < 4 * 1024 * 1024) {
  return result;
}

quality -= 10;

}

throw new Error(
"تعذر ضغط الصورة إلى أقل من 4MB"
);
}

// ============================================================
// UPLOAD TO CATBOX
// ============================================================

async function uploadToCatbox(buffer) {
const FormData = require("form-data");

const form = new FormData();

form.append(
"reqtype",
"fileupload"
);

form.append(
"fileToUpload",
buffer,
{
filename: "hina-profile.jpg",
contentType: "image/jpeg"
}
);

const response = await axios.post(
"https://catbox.moe/user/api.php",
form,
{
headers: {
...form.getHeaders()
},
timeout: 60000,
maxBodyLength: 10 * 1024 * 1024,
maxContentLength: 10 * 1024 * 1024
}
);

const url =
String(response.data || "").trim();

if (
!url ||
!url.startsWith("http")
) {
throw new Error(
"فشل رفع الصورة إلى Catbox"
);
}

return url;
}

// ============================================================
// GET READABLE STREAM
// ============================================================

async function getImageStream(url) {
const buffer =
await downloadImage(url);

const jpgBuffer =
await makeUnder4MB(buffer);

return {
buffer: jpgBuffer,
stream: Readable.from(jpgBuffer)
};
}

// ============================================================
// RUN
// ============================================================

module.exports.run = async function ({
api,
event
}) {
const {
threadID,
messageID,
senderID,
messageReply
} = event;

// ==========================================================
// DEVELOPER CHECK
// ==========================================================

if (!isDeveloper(senderID)) {
return send(
api,
"❌ هذا الأمر للمطور فقط",
threadID,
messageID
);
}

// ==========================================================
// REPLY CHECK
// ==========================================================

if (
!messageReply ||
!Array.isArray(messageReply.attachments) ||
!messageReply.attachments.length
) {
return send(
api,
"🐿️ قم بالرد على صورة ثم استخدم الأمر\n\nمثال:\nبروفايل",
threadID,
messageID
);
}

const attachment =
messageReply.attachments[0];

if (
attachment.type !== "photo" &&
attachment.type !== "image"
) {
return send(
api,
"❌ المرفق يجب أن يكون صورة",
threadID,
messageID
);
}

const imageURL =
attachment.url ||
attachment.largePreviewUrl ||
attachment.previewUrl;

if (!imageURL) {
return send(
api,
"❌ لم أستطع الحصول على رابط الصورة",
threadID,
messageID
);
}

try {
// ========================================================
// DOWNLOAD ORIGINAL
// ========================================================

const originalBuffer =
  await downloadImage(imageURL);

// ========================================================
// CONVERT + COMPRESS
// ========================================================

const jpgBuffer =
  await makeUnder4MB(
    originalBuffer
  );

// ========================================================
// CATBOX UPLOAD
// ========================================================

const catboxURL =
  await uploadToCatbox(
    jpgBuffer
  );

console.log(
  "[HINA PROFILE] Catbox:",
  catboxURL
);

// ========================================================
// DOWNLOAD FROM CATBOX
// ========================================================

const {
  buffer,
  stream
} =
  await getImageStream(
    catboxURL
  );

// ========================================================
// FINAL SIZE CHECK
// ========================================================

if (
  buffer.length >=
  4 * 1024 * 1024
) {
  throw new Error(
    "الصورة أكبر من 4MB"
  );
}

console.log(
  "[HINA PROFILE] Final size:",
  buffer.length,
  "bytes"
);

// ========================================================
// CHANGE AVATAR
// ========================================================

await new Promise(
  (resolve, reject) => {

    api.changeAvatar(
      stream,
      "",
      null,
      (err, result) => {

        if (err) {
          console.error(
            "[HINA changeAvatar ERROR]",
            err
          );

          return reject(err);
        }

        resolve(result);
      }
    );

  }
);

// ========================================================
// SUCCESS
// ========================================================

return send(
  api,

  "✅ تم تغيير صورة بروفايل البوت بنجاح\n\n" +
  "📦 تم تجهيز الصورة بصيغة JPG\n" +
  "📤 تم رفعها وإعادة تحميلها\n" +
  "🐿️ HINA",

  threadID,
  messageID
);

} catch (error) {

console.error(
  "[HINA PROFILE ERROR]",
  error
);

let errorMessage =
  error?.message ||
  String(error);

if (
  typeof error === "object"
) {
  try {
    if (error.errorDescription) {
      errorMessage =
        error.errorDescription;
    } else if (
      error.message
    ) {
      errorMessage =
        error.message;
    } else {
      errorMessage =
        JSON.stringify(error);
    }
  } catch (e) {}
}

return send(
  api,

  "❌ فشل تغيير صورة البروفايل\n\n" +
  "الخطأ:\n" +
  errorMessage,

  threadID,
  messageID
);

}
};