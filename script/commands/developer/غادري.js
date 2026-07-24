const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

module.exports.config = {
  name: "غادري",
  version: "1.2.7",
  hasPermssion: 2,
  credits: "أبو هريرة",
  description: "مغادرة البوت للمجموعة",
  commandCategory: "developer",
  usages: "غادري [ID]",
  cooldowns: 5,
  devID: "61578581225040"
};

module.exports.run = async ({ api, event, args }) => {
  const { threadID, senderID } = event;
  const { devID } = module.exports.config;

  if (String(senderID) !== String(devID)) {
    return api.sendMessage("⛔ هذا الأمر مخصص للمطور فقط.", threadID);
  }

  const targetID = args[0] ? String(args[0]).trim() : threadID;
  const cacheDir = path.join(__dirname, "cache");
  const pathGif = path.join(cacheDir, "bye.gif");

  const leaveGroup = (target) => {
    try {
      api.removeUserFromGroup(api.getCurrentUserID(), target);
    } catch (err) {
      console.error("خطأ أثناء المغادرة:", err);
    }
  };

  const cleanUp = () => {
    try {
      if (fs.existsSync(pathGif)) fs.unlinkSync(pathGif);
    } catch (_) {}
  };

  try {
    fs.ensureDirSync(cacheDir);

    const response = await axios.get(
      "https://media.giphy.com/media/kaBU6pgv0OsPHz2yxy/giphy.gif",
      { responseType: "arraybuffer", timeout: 10000 }
    );

    fs.writeFileSync(pathGif, Buffer.from(response.data));

    await new Promise((resolve, reject) => {
      api.sendMessage(
        {
          body: "⌬ ━━ HINA ━━ ⌬\n\nنغادر الآن بكل هيبة.. وداعاً. 👑",
          attachment: fs.createReadStream(pathGif)
        },
        targetID,
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    setTimeout(() => {
      leaveGroup(targetID);
      cleanUp();
    }, 1500);

  } catch (e) {
    console.error("خطأ في أمر غادري:", e);
    cleanUp();
    leaveGroup(targetID);
  }
};