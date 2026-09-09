const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "ميمز",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "جلب ميم عشوائي وإرساله كصورة",
  commandCategory: "fun",
  usages: "ميمز",
  cooldowns: 5
};

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID } = event;

  try {
    const response = await axios.get("https://meme-api.com/gimme/wholesomememes", {
      timeout: 15000
    });

    const meme = response.data;

    if (!meme || !meme.url) {
      return api.sendMessage(
        "تعذر الحصول على ميم حاليا حاول مرة ثانية",
        threadID,
        messageID
      );
    }

    // منع أي محتوى غير مناسب
    if (meme.nsfw || meme.spoiler) {
      return api.sendMessage(
        "الميم الذي تم اختياره غير مناسب لذلك سأحاول مرة أخرى",
        threadID,
        messageID
      );
    }

    const imageResponse = await axios.get(meme.url, {
      responseType: "arraybuffer",
      timeout: 20000
    });

    const tempDir = path.join(__dirname, "cache");

    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const imagePath = path.join(
      tempDir,
      `meme_${Date.now()}.jpg`
    );

    fs.writeFileSync(imagePath, imageResponse.data);

    await api.sendMessage(
      {
        body: `ميم عشوائي\n\n${meme.title || "ميم"}`,
        attachment: fs.createReadStream(imagePath)
      },
      threadID,
      () => {
        try {
          fs.unlinkSync(imagePath);
        } catch (e) {}
      },
      messageID
    );

  } catch (error) {
    console.error("Meme Error:", error);

    return api.sendMessage(
      "حدث خطأ أثناء جلب الميم حاول مرة أخرى",
      threadID,
      messageID
    );
  }
};