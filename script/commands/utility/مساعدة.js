const axios = require("axios");

module.exports.config = {
  name: "مساعدة",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "عرض قائمة الأوامر مع صورة HINA",
  commandCategory: "utility",
  usages: "[اسم الأمر] أو [الفئة]",
  cooldowns: 5
};

const HINA_IMAGE = "https://files.catbox.moe/mezb8y.jpg";

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;
  const { commands } = global.client;
  const prefix = global.config.PREFIX || "/";

  if (!commands) {
    return api.sendMessage(
      "⌬ ━━ HINA UTILITY ━━ ⌬\n\n❌ فشل تحميل قائمة الأوامر",
      threadID,
      messageID
    );
  }

  try {
    // تحميل صورة HINA
    const image = await axios.get(HINA_IMAGE, {
      responseType: "stream"
    });

    const commandsMap = new Map();

    commands.forEach((cmd, name) => {
      if (cmd && cmd.config) {
        commandsMap.set(name, cmd);
      }
    });

    // ==================================================
    // عرض كل الأوامر
    // ==================================================

    if (args.length === 0) {

      const categories = {};

      commandsMap.forEach((cmd, name) => {

        const category =
          cmd.config.commandCategory || "utility";

        if (!categories[category]) {
          categories[category] = [];
        }

        categories[category].push(name);
      });

      let message =
`⌬ ━━ HINA UTILITY ━━ ⌬

🤖 البوت: زنجوبة
🔑 البادئة: ${prefix}
📊 عدد الأوامر: ${commandsMap.size}

━━━━━━━━━━━━━━━━━━
📂 قـائـمـة الأوامـر
━━━━━━━━━━━━━━━━━━

`;

      for (const [category, cmds] of Object.entries(categories)) {

        message +=
`「 ${category.toUpperCase()} 」

`;

        message += cmds
          .sort()
          .map(cmd => `${prefix}${cmd}`)
          .join(" • ");

        message += "\n\n";
      }

      message +=
`━━━━━━━━━━━━━━━━━━

💡 لمعرفة تفاصيل أي أمر:

${prefix}مساعدة [اسم الأمر]

مثال:
${prefix}مساعدة حذف

⌬ ━━ HINA UTILITY ━━ ⌬`;

      return api.sendMessage(
        {
          body: message,
          attachment: image.data
        },
        threadID,
        messageID
      );
    }

    // ==================================================
    // البحث عن أمر
    // ==================================================

    const cmdName = args[0].toLowerCase();

    const command = commandsMap.get(cmdName);

    if (!command) {

      const category = cmdName;
      const cmdsInCategory = [];

      commandsMap.forEach((cmd, name) => {

        if (
          String(cmd.config.commandCategory || "")
            .toLowerCase() === category
        ) {
          cmdsInCategory.push(name);
        }

      });

      if (cmdsInCategory.length > 0) {

        let message =
`⌬ ━━ HINA UTILITY ━━ ⌬

📂 الفئة:
${category.toUpperCase()}

📊 عدد الأوامر:
${cmdsInCategory.length}

━━━━━━━━━━━━━━━━━━

`;

        message += cmdsInCategory
          .sort()
          .map(cmd => `${prefix}${cmd}`)
          .join(" • ");

        return api.sendMessage(
          {
            body: message,
            attachment: image.data
          },
          threadID,
          messageID
        );
      }

      return api.sendMessage(
        {
          body:
`⌬ ━━ HINA UTILITY ━━ ⌬

❌ الأمر "${cmdName}" غير موجود.

💡 استخدم:
${prefix}مساعدة

لعرض جميع الأوامر.`,
          attachment: image.data
        },
        threadID,
        messageID
      );
    }

    // ==================================================
    // تفاصيل الأمر
    // ==================================================

    const config = command.config;

    const permission =
      config.hasPermssion === 0
        ? "الجميع"
        : config.hasPermssion === 1
        ? "المشرفين"
        : "المطور";

    let message =
`⌬ ━━ HINA ${(
  config.commandCategory || "UTILITY"
).toUpperCase()} ━━ ⌬

📝 الاسم:
${config.name}

📄 الوصف:
${config.description || "لا يوجد وصف"}

🔰 الفئة:
${config.commandCategory || "utility"}

⚙️ الاستخدام:
${prefix}${config.usages || config.name}

⏱️ الانتظار:
${config.cooldowns || 0} ثانية

👤 الصلاحية:
${permission}

✍️ المطور:
${config.credits || "غير معروف"}

⌬ ━━━━━━━━━━━━ ⌬`;

    return api.sendMessage(
      {
        body: message,
        attachment: image.data
      },
      threadID,
      messageID
    );

  } catch (error) {

    console.error(
      "❌ مساعدة - خطأ:",
      error
    );

    // إذا فشل تحميل الصورة، لا يتعطل الأمر
    return api.sendMessage(
      `⌬ ━━ HINA UTILITY ━━ ⌬

❌ تعذر تحميل صورة HINA.

📊 عدد الأوامر:
${global.client.commands
  ? global.client.commands.size
  : 0}

💡 استخدم:
${prefix}مساعدة [اسم الأمر]`,
      threadID,
      messageID
    );
  }
};