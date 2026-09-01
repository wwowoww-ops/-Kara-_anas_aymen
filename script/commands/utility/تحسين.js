const axios = require("axios");

const HEADER = "╭───〔 𓆩 𝐒𝐎𝐌𝐈 𓆪 〕───╮\n";

let cachedBase = null;
let cachedAt = 0;

async function mahmud() {
  // كاش لمدة 10 دقايق عشان ما نضرب GitHub بكل استخدام للأمر
  if (cachedBase && Date.now() - cachedAt < 10 * 60 * 1000) return cachedBase;
  const base = await axios.get(
    "https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json",
    { timeout: 15000 }
  );
  cachedBase = base.data.mahmud;
  cachedAt = Date.now();
  return cachedBase;
}

function sendMessageAsync(api, msg, threadID, messageID) {
  return new Promise((resolve, reject) => {
    api.sendMessage(msg, threadID, (err, info) => {
      if (err) return reject(err);
      resolve(info);
    }, messageID);
  });
}

function unsendAsync(api, messageID) {
  return new Promise((resolve) => {
    if (!api.unsendMessage) return resolve();
    api.unsendMessage(messageID, () => resolve());
  });
}

function reactAsync(api, messageID, emoji) {
  try {
    if (api.setMessageReaction) api.setMessageReaction(emoji, messageID, () => {}, true);
  } catch (_) {}
}

module.exports.config = {
  name: "4k",
  version: "1.7.1",
  hasPermssion: 0,
  credits: "MahMUD (الأصل) + تعديل SOMI",
  description: "تحسين جودة الصورة إلى 4K بالذكاء الاصطناعي",
  commandCategory: "ai",
  usages: "4k [رابط الصورة] أو رد على صورة",
  cooldowns: 10
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const startTime = Date.now();
  let imgUrl;

  if (event.messageReply?.attachments?.[0]?.type === "photo") {
    imgUrl = event.messageReply.attachments[0].url;
  } else if (args[0]) {
    imgUrl = args.join(" ");
  }

  if (!imgUrl) {
    return api.sendMessage(HEADER + "⚠️ | لازم تسوي رد على صورة أو تعطيني رابط صورة.", threadID, messageID);
  }

  let waitMsg;
  try {
    waitMsg = await sendMessageAsync(api, HEADER + "⏳ | جاري تحسين الصورة إلى 4K... استنى شوي.", threadID, messageID);
  } catch (_) {}

  reactAsync(api, messageID, "⏳");

  try {
    const base = await mahmud();
    if (!base) throw new Error("تعذّر الحصول على رابط الـ API.");

    const apiUrl = `${base}/api/hd?imgUrl=${encodeURIComponent(imgUrl)}`;
    const res = await axios.get(apiUrl, { responseType: "stream", timeout: 60000 });

    // ── تحقق إن الرد فعلاً صورة قبل ما نحاول نرسله كمرفق ──
    const contentType = res.headers?.["content-type"] || "";
    if (!contentType.startsWith("image/")) {
      throw new Error(`الخدمة رجّعت محتوى غير صالح (${contentType || "غير معروف"})`);
    }

    if (waitMsg?.messageID) await unsendAsync(api, waitMsg.messageID);
    reactAsync(api, messageID, "✅");

    const processTime = ((Date.now() - startTime) / 1000).toFixed(2);

    api.sendMessage(
      { body: HEADER + `✅ | هذي صورتك بجودة 4K (${processTime} ثانية)`, attachment: res.data },
      threadID,
      (err) => {
        if (err) {
          console.error("[4k] فشل إرسال المرفق:", err?.message || err);
          api.sendMessage(HEADER + "❌ | فشل إرسال الصورة، جرّب مرة ثانية.", threadID, messageID);
        }
      },
      messageID
    );

  } catch (error) {
    console.error("[4k] خطأ:", error?.message || error);
    if (waitMsg?.messageID) await unsendAsync(api, waitMsg.messageID);
    reactAsync(api, messageID, "❌");
    api.sendMessage(
      HEADER + `❌ | صار خطأ أثناء تحسين الصورة: ${error?.message || "غير معروف"}\n💡 | جرّب صورة أو رابط آخر.`,
      threadID, messageID
    );
  }
};