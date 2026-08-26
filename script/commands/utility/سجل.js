const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "سجل",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "عرض سجل أحداث المجموعة",
  commandCategory: "Utility",
  usages: "سجل",
  cooldowns: 5,
  dependencies: {
    "fs-extra": ""
  }
};

module.exports.run = async function ({ api, event }) {

  const { threadID, messageID } = event;

  const cacheDir = path.join(__dirname, "cache");
  const logFile = path.join(cacheDir, `groupLog_${threadID}.json`);

  try {

    await fs.ensureDir(cacheDir);

    if (!await fs.pathExists(logFile)) {
      return api.sendMessage(
        `⌬ ━━ 𝗛𝗜𝗡𝗔 UTILITY ━━ ⌬

📋 لا يوجد أي سجل محفوظ لهذه المجموعة حتى الآن.`,
        threadID,
        messageID
      );
    }

    const logs = await fs.readJson(logFile);

    if (!Array.isArray(logs) || logs.length === 0) {
      return api.sendMessage(
        `⌬ ━━ 𝗛𝗜𝗡𝗔 UTILITY ━━ ⌬

📋 سجل المجموعة فارغ.`,
        threadID,
        messageID
      );
    }

    // آخر 20 حدث فقط
    const latestLogs = logs.slice(-20).reverse();

    let text =
      `⌬ ━━ 𝗛𝗜𝗡𝗔 UTILITY ━━ ⌬\n\n` +
      `📋 سجل أحداث المجموعة\n` +
      `━━━━━━━━━━━━━━━━━━\n\n`;

    latestLogs.forEach((log, index) => {

      text +=
        `${index + 1}. ${log.event || "حدث"}\n` +
        `👤 ${log.name || "غير معروف"}\n` +
        `🕒 ${log.time || "غير معروف"}\n\n`;

    });

    text +=
      `━━━━━━━━━━━━━━━━━━\n` +
      `📊 المعروض: ${latestLogs.length} من ${logs.length} حدث`;

    return api.sendMessage(
      text,
      threadID,
      messageID
    );

  } catch (error) {

    console.error("[سجل ERROR]", error);

    return api.sendMessage(
      `⌬ ━━ 𝗛𝗜𝗡𝗔 UTILITY ━━ ⌬

❌ حدث خطأ أثناء قراءة سجل المجموعة.`,
      threadID,
      messageID
    );
  }
};