module.exports.config = {
  name: "مساعدة",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "أبو هريرة", 
  description: "عرض قائمة الأوامر",
  commandCategory: "utility",
  usages: "[اسم الأمر] أو [الفئة]",
  cooldowns: 5
};

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

  const commandsMap = new Map();
  commands.forEach((cmd, name) => {
    commandsMap.set(name, cmd);
  });

  if (args.length === 0) {
    const categories = {};
    
    commandsMap.forEach((cmd, name) => {
      const category = cmd.config.commandCategory || "utility";
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(name);
    });

    let message = "⌬ ━━ HINA UTILITY ━━ ⌬\n\n";
    message += `🤖 البوت: زنجزوبة\n`;
    message += `🔑 البادئة: ${prefix}\n`;
    message += `📊 عدد الأوامر: ${commandsMap.size}\n\n`;
    message += `📂 الفئات:\n\n`;

    for (const [category, cmds] of Object.entries(categories)) {
      message += `「 ${category.toUpperCase()} 」\n`;
      message += `${cmds.join(", ")}\n\n`;
    }

    message += `💡 استخدم: ${prefix}مساعدة [اسم الأمر] لمعرفة التفاصيل`;

    return api.sendMessage(message, threadID, messageID);
  }

  const cmdName = args[0].toLowerCase();
  const command = commandsMap.get(cmdName);

  if (!command) {
    const category = cmdName;
    const cmdsInCategory = [];
    
    commandsMap.forEach((cmd, name) => {
      if (cmd.config.commandCategory === category) {
        cmdsInCategory.push(name);
      }
    });

    if (cmdsInCategory.length > 0) {
      let message = `⌬ ━━ SOMI ${category.toUpperCase()} ━━ ⌬\n\n`;
      message += `📂 الأوامر (${cmdsInCategory.length}):\n\n`;
      message += cmdsInCategory.join(", ");
      
      return api.sendMessage(message, threadID, messageID);
    }

    return api.sendMessage(
      `⌬ ━━ HINA UTILITY ━━ ⌬\n\n❌ الأمر "${cmdName}" غير موجود`,
      threadID,
      messageID
    );
  }

  const config = command.config;
  let message = `⌬ ━━ SOMI ${(config.commandCategory || "UTILITY").toUpperCase()} ━━ ⌬\n\n`;
  message += `📝 الاسم: ${config.name}\n`;
  message += `📄 الوصف: ${config.description}\n`;
  message += `🔰 الفئة: ${config.commandCategory || "utility"}\n`;
  message += `⚙️ الاستخدام: ${prefix}${config.usages}\n`;
  message += `⏱️ الانتظار: ${config.cooldowns} ثانية\n`;
  message += `👤 الصلاحية: ${config.hasPermssion === 0 ? "الجميع" : config.hasPermssion === 1 ? "المشرفين" : "المطور"}\n`;
  message += `✍️ المطور: ${config.credits}`;

  return api.sendMessage(message, threadID, messageID);
};
