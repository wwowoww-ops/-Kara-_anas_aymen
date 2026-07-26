const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "تنسيق_اللقب",
  version: "1.0.0",
  hasPermssion: 1,
  credits: "أبو هريرة",
  description: "تفعيل أو تغيير تنسيق اللقب التلقائي في المجموعة",
  commandCategory: "admin",
  usages: "تنسيق_اللقب [تشغيل/إيقاف/تنسيق]",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const settingsPath = "./data/auto_nickname.json";

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔑 التحقق من الصلاحية (أدمن أو مطور)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const threadInfo = await api.getThreadInfo(threadID);
  const isAdmin = threadInfo.adminIDs.some(admin => admin.id === senderID);
  
  // التحقق من المطور
  const config = JSON.parse(fs.readFileSync("./config.json"));
  const devID = config.KIRA_CONF?.dev || config.ADMINBOT?.[0];
  const isDev = senderID === devID;

  if (!isAdmin && !isDev) {
    return api.sendMessage(
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n⛔ هذا الأمر للأدمن أو المطور فقط!`,
      threadID,
      messageID
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📁 التأكد من وجود ملف الإعدادات
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (!fs.existsSync(settingsPath)) {
    fs.writeFileSync(settingsPath, JSON.stringify({}));
  }

  let settings = JSON.parse(fs.readFileSync(settingsPath));

  if (!settings[threadID]) {
    settings[threadID] = {
      enabled: false,
      format: "𖣂 {name} 𖣂"
    };
  }

  const subCommand = args[0]?.toLowerCase();

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔄 تشغيل الميزة
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (subCommand === "تشغيل" || subCommand === "on") {
    settings[threadID].enabled = true;
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));

    return api.sendMessage(
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n✅ تم تفعيل اللقب التلقائي!\n📌 التنسيق الحالي: ${settings[threadID].format}\n\n💡 لتغيير التنسيق: تنسيق_اللقب تنسيق [النمط]`,
      threadID,
      messageID
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔴 إيقاف الميزة
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (subCommand === "إيقاف" || subCommand === "off") {
    settings[threadID].enabled = false;
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));

    return api.sendMessage(
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n❌ تم إيقاف اللقب التلقائي.\n\nلن يتم تغيير ألقاب الأعضاء الجدد.`,
      threadID,
      messageID
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🎨 تغيير تنسيق اللقب
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (subCommand === "تنسيق" || subCommand === "format") {
    const newFormat = args.slice(1).join(" ");

    if (!newFormat) {
      return api.sendMessage(
        `⌬ ━━ HINA ADMIN ━━ ⌬\n\n📝 الاستخدام:\nتنسيق_اللقب تنسيق [النمط]\n\n📌 استخدم {name} مكان اسم العضو\nمثال: تنسيق_اللقب تنسيق ★ {name} ★\n\n🔹 التنسيق الحالي: ${settings[threadID].format}`,
        threadID,
        messageID
      );
    }

    // التحقق من وجود {name} في التنسيق
    if (!newFormat.includes("{name}")) {
      return api.sendMessage(
        `⌬ ━━ HINA ADMIN ━━ ⌬\n\n⚠️ يجب أن يحتوي التنسيق على {name}\nمثال: ★ {name} ★`,
        threadID,
        messageID
      );
    }

    settings[threadID].format = newFormat;
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));

    return api.sendMessage(
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n✅ تم تغيير تنسيق اللقب!\n📌 التنسيق الجديد: ${newFormat}\n\n🔄 سيتم تطبيقه على الأعضاء الجدد فقط.`,
      threadID,
      messageID
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📊 عرض الحالة
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const status = settings[threadID].enabled ? "مفعل ✅" : "معطل ❌";
  return api.sendMessage(
    `⌬ ━━ HINA ADMIN ━━ ⌬\n\n📊 حالة اللقب التلقائي: ${status}\n📌 التنسيق: ${settings[threadID].format}\n\n📝 الأوامر:\n• تنسيق_اللقب تشغيل (لتفعيل)\n• تنسيق_اللقب إيقاف (لإيقاف)\n• تنسيق_اللقب تنسيق [النمط] (لتغيير التنسيق)`,
    threadID,
    messageID
  );
};