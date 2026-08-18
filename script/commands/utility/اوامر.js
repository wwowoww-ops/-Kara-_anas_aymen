const axios = require("axios");
const fs = require("fs-extra");

module.exports.config = {
  name: "اوامر",
  version: "10.7.0",
  hasPermssion: 0,
  credits: "HINA Developer",
  description: "قائمة الأوامر بنظام الرد المباشر مع صورة",
  commandCategory: "utility",
  usages: "اوامر",
  cooldowns: 5
};

const IMAGE_URL = "https://files.catbox.moe/01t0g7.jpg";

module.exports.handleReply = async function({ api, event, handleReply }) {
  const { threadID, messageID, body, senderID } = event;

  if (String(senderID) !== String(handleReply.author)) return;

  const header = `⌬ ━━━━━━━━━━━━ ⌬`;

  const categories = {
    "1": { id: "fun", name: "الـتـرفـيـه" },
    "2": { id: "admin", name: "الإدارة" },
    "3": { id: "developer", name: "الـمـطـور" },
    "4": { id: "games", name: "الألـعـاب" },
    "5": { id: "media", name: "الـوسـائـط" },
    "6": { id: "pic", name: "الـصـور" },
    "7": { id: "utility", name: "الـخـدمـات" }
  };

  const input = String(body || "").trim();

  if (input === "رجوع" || input === "رجـوع") {
    try {
      await api.unsendMessage(handleReply.messageID);
    } catch (e) {}

    return module.exports.run({ api, event });
  }

  const choice = categories[input];

  if (!choice) return;

  const categoryCommands = Array.from(
    global.client.commands.values()
  )
    .filter(cmd =>
      cmd &&
      cmd.config &&
      cmd.config.commandCategory &&
      String(cmd.config.commandCategory).toLowerCase() ===
        choice.id.toLowerCase()
    )
    .map(cmd => cmd.config.name);

  try {
    await api.unsendMessage(handleReply.messageID);
  } catch (e) {}

  if (categoryCommands.length === 0) {
    return api.sendMessage(
      `${header}

⚠️ لا تـوجـد أوامـر فـي فـئـة [ ${choice.name} ]

${header}`,
      threadID,
      messageID
    );
  }

  const msg =
`${header}
      📁 فـئـة: ${choice.name}
${header}

⪼ ${categoryCommands.join(" - ")}

💠 عـدد الأوامـر: ${categoryCommands.length}

💠 لـلـعـودة أرسـل: رجـوع

${header}`;

  return api.sendMessage(
    msg,
    threadID,
    (err, info) => {
      if (err || !info) return;

      if (!global.client.handleReply) {
        global.client.handleReply = [];
      }

      global.client.handleReply.push({
        name: module.exports.config.name,
        messageID: info.messageID,
        author: senderID
      });
    },
    messageID
  );
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID, senderID } = event;

  const header =
`⌬ ━━━━━━━━━━━━ ⌬
      📜 قـائـمـة الأوامـر
⌬ ━━━━━━━━━━━━ ⌬`;

  const menu =
`${header}

1 ≻ الـتـرفـيـه
2 ≻ الإدارة
3 ≻ الـمـطـور
4 ≻ الألـعـاب
5 ≻ الـوسـائـط
6 ≻ الـصـور
7 ≻ الـخـدمـات

⪼ رد بـرقـم الـفـئـة لـلـعـرض.

⌬ ━━━━━━━━━━━━ ⌬`;

  try {
    const response = await axios.get(IMAGE_URL, {
      responseType: "arraybuffer",
      timeout: 15000
    });

    const imagePath = `${process.cwd()}/commands_menu_${Date.now()}.jpg`;

    fs.writeFileSync(
      imagePath,
      Buffer.from(response.data)
    );

    return api.sendMessage(
      {
        body: menu,
        attachment: fs.createReadStream(imagePath)
      },
      threadID,
      (err, info) => {
        // حذف الصورة المؤقتة بعد إرسالها
        setTimeout(() => {
          try {
            if (fs.existsSync(imagePath)) {
              fs.unlinkSync(imagePath);
            }
          } catch (e) {}
        }, 10000);

        if (err || !info) {
          console.error("❌ خطأ إرسال قائمة الأوامر:", err);
          return;
        }

        if (!global.client.handleReply) {
          global.client.handleReply = [];
        }

        global.client.handleReply.push({
          name: module.exports.config.name,
          messageID: info.messageID,
          author: senderID
        });
      },
      messageID
    );

  } catch (error) {
    console.error("❌ خطأ تحميل صورة الأوامر:", error.message);

    // إذا فشل تحميل الصورة، أرسل القائمة بدون صورة
    return api.sendMessage(
      menu,
      threadID,
      (err, info) => {
        if (err || !info) return;

        if (!global.client.handleReply) {
          global.client.handleReply = [];
        }

        global.client.handleReply.push({
          name: module.exports.config.name,
          messageID: info.messageID,
          author: senderID
        });
      },
      messageID
    );
  }
};