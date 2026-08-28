const axios = require("axios");

module.exports.config = {
  name: "وايفو",
  version: "4.0.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "إرسال صور أنمي متنوعة",
  commandCategory: "Pic",
  usages: "<النوع>",
  cooldowns: 5
};

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

  const typesMap = {
    "وايفو": "waifu",
    "نيكو": "neko",
    "شينوبو": "shinobu",
    "ميغومين": "megumin",
    "مزاح": "bully",
    "حضن": "cuddle",
    "بكاء": "cry",
    "قبلة": "kiss",
    "عناق": "hug",
    "ربت": "pat",
    "خجل": "blush",
    "ابتسامة": "smile",
    "رقصة": "dance",
    "صفعة": "slap",
    "قتل": "kill",
    "ركلة": "kick",
    "أكل": "nom",
    "عضة": "bite",
    "غمزة": "wink",
    "نغز": "poke"
  };

  const name = args.join(" ").trim();

  // ==================================================
  // القائمة
  // ==================================================

  if (!name) {

    const keys =
      Object.keys(typesMap);

    let list =
      "⌬ ━━━ HINA 𝗔𝗡𝗜𝗠𝗘 ━━━ ⌬\n\n";

    list +=
      "✨ الأنواع المتاحة:\n";

    list +=
      "│ " +
      keys.join(" ، ") +
      "\n\n";

    list +=
      "💡 مثال: وايفو حضن\n";

    list +=
      "⌬ ━━━━━━━━━━━━━━ ⌬";

    return api.sendMessage(
      list,
      threadID,
      messageID
    );
  }

  const engName =
    typesMap[name];

  if (!engName) {

    return api.sendMessage(
      `⚠️ النوع "${name}" غير موجود في القائمة.`,
      threadID,
      messageID
    );
  }

  try {

    // ==================================================
    // جلب رابط الصورة
    // ==================================================

    const response =
      await axios.get(
        `https://api.waifu.pics/sfw/${engName}`,
        {
          timeout: 15000,
          headers: {
            "User-Agent":
              "Mozilla/5.0"
          }
        }
      );

    const imageURL =
      response?.data?.url;

    if (!imageURL) {
      throw new Error(
        "API returned no image URL"
      );
    }

    // ==================================================
    // تحميل الصورة
    // ==================================================

    const imageResponse =
      await axios.get(
        imageURL,
        {
          responseType: "stream",
          timeout: 20000,
          maxRedirects: 5,
          headers: {
            "User-Agent":
              "Mozilla/5.0"
          }
        }
      );

    // ==================================================
    // الرسالة
    // ==================================================

    const message = {
      body:
`⌬ ━━━ HINA 𝗪𝗔𝗜𝗙𝗨 ━━━ ⌬

🖼️ النوع: ${name}

🔄 اضغط 👍 للحصول على صورة أخرى

⌬ ━━━━━━━━━━━━━━ ⌬`,
      attachment:
        imageResponse.data
    };

    // ==================================================
    // إرسال الصورة
    // ==================================================

    return api.sendMessage(
      message,
      threadID,
      (err, info) => {

        if (err) {
          console.error(
            "[وايفو] SEND ERROR:",
            err
          );
          return;
        }

        if (
          global.client &&
          Array.isArray(
            global.client.handleReaction
          )
        ) {

          global.client.handleReaction.push({
            name: "وايفو",
            messageID:
              info.messageID,
            author: String(senderID),
            engName,
            typeName: name
          });

        }

      },
      messageID
    );

  } catch (error) {

    console.error(
      "[وايفو] API ERROR:",
      error.message
    );

    return api.sendMessage(
      `⌬ ━━━ HINA 𝗪𝗔𝗜𝗙𝗨 ━━━ ⌬

❌ تعذر جلب صورة الأنمي حاليًا

🔄 حاول مرة أخرى بعد قليل

⌬ ━━━━━━━━━━━━━━ ⌬`,
      threadID,
      messageID
    );
  }
};


// ============================================================
// نظام التفاعل
// ============================================================

module.exports.handleReaction =
async function ({
  api,
  event,
  handleReaction
}) {

  try {

    if (!handleReaction) {
      return;
    }

    if (
      String(event.userID) !==
      String(handleReaction.author)
    ) {
      return;
    }

    if (
      event.reaction !== "👍"
    ) {
      return;
    }

    const response =
      await axios.get(
        `https://api.waifu.pics/sfw/${handleReaction.engName}`,
        {
          timeout: 15000,
          headers: {
            "User-Agent":
              "Mozilla/5.0"
          }
        }
      );

    const imageURL =
      response?.data?.url;

    if (!imageURL) {
      throw new Error(
        "No image URL"
      );
    }

    const imageResponse =
      await axios.get(
        imageURL,
        {
          responseType: "stream",
          timeout: 20000,
          maxRedirects: 5,
          headers: {
            "User-Agent":
              "Mozilla/5.0"
          }
        }
      );

    return api.sendMessage(
      {
        body:
`⌬ ━━━ HINA 𝗪𝗔𝗜𝗙𝗨 ━━━ ⌬

🔄 صورة جديدة
🖼️ النوع: ${handleReaction.typeName}

⌬ ━━━━━━━━━━━━━━ ⌬`,
        attachment:
          imageResponse.data
      },
      event.threadID
    );

  } catch (error) {

    console.error(
      "[وايفو] REACTION ERROR:",
      error.message
    );

    return api.sendMessage(
      "❌ تعذر جلب صورة جديدة حاليًا.",
      event.threadID
    );
  }
};