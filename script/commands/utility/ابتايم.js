module.exports.config = {
  name: "ابتايم",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "عرض حالة النظام وإحصائيات التشغيل",
  commandCategory: "utility",
  usages: "ابتايم",
  cooldowns: 5
};

// ==================================================
// حساب المجموعات المعروفة
// ==================================================

function getKnownGroups() {
  const ids = new Set();

  try {
    if (
      global.data &&
      Array.isArray(global.data.allThreadID)
    ) {
      for (const id of global.data.allThreadID) {
        if (id) {
          ids.add(String(id));
        }
      }
    }
  } catch (e) {
    console.log("HINA: خطأ allThreadID:", e.message);
  }

  try {
    if (
      global.data &&
      global.data.threadData
    ) {
      const threadData = global.data.threadData;

      if (threadData instanceof Map) {
        for (const id of threadData.keys()) {
          if (id) {
            ids.add(String(id));
          }
        }
      } else if (
        typeof threadData === "object"
      ) {
        for (const id of Object.keys(threadData)) {
          if (id) {
            ids.add(String(id));
          }
        }
      }
    }
  } catch (e) {
    console.log("HINA: خطأ threadData:", e.message);
  }

  return ids.size;
}

// ==================================================
// حساب مدة التشغيل
// ==================================================

function getUptime() {
  const uptime = process.uptime();

  const days = Math.floor(
    uptime / 86400
  );

  const hours = Math.floor(
    (uptime % 86400) / 3600
  );

  const minutes = Math.floor(
    (uptime % 3600) / 60
  );

  const seconds = Math.floor(
    uptime % 60
  );

  return {
    days,
    hours,
    minutes,
    seconds
  };
}

// ==================================================
// تنسيق الذاكرة
// ==================================================

function formatMB(bytes) {
  return (bytes / 1024 / 1024).toFixed(1);
}

// ==================================================
// شريط الذاكرة
// ==================================================

function createMemoryBar(percent, length = 18) {
  percent = Math.max(
    0,
    Math.min(100, percent)
  );

  const filled = Math.round(
    (percent / 100) * length
  );

  const empty = length - filled;

  return (
    "█".repeat(filled) +
    "░".repeat(empty)
  );
}

// ==================================================
// إحصائيات المستخدمين
// ==================================================

function getKnownUsers() {
  try {
    if (
      global.data &&
      global.data.allUserID &&
      Array.isArray(global.data.allUserID)
    ) {
      return global.data.allUserID.length;
    }
  } catch (e) {
    console.log("HINA: خطأ allUserID:", e.message);
  }

  return null;
}

// ==================================================
// إحصائيات الأوامر
// ==================================================

function getCommandCount() {
  try {
    if (
      global.client &&
      typeof global.client.commandUsage === "number"
    ) {
      return global.client.commandUsage;
    }

    if (
      global.client &&
      typeof global.client.commandCount === "number"
    ) {
      return global.client.commandCount;
    }

    if (
      global.commandUsage &&
      typeof global.commandUsage === "number"
    ) {
      return global.commandUsage;
    }

    if (
      global.commandCount &&
      typeof global.commandCount === "number"
    ) {
      return global.commandCount;
    }
  } catch (e) {
    console.log("HINA: خطأ command count:", e.message);
  }

  return null;
}

// ==================================================
// RUN
// ==================================================

module.exports.run = async function({
  api,
  event
}) {

  const {
    threadID,
    messageID
  } = event;

  try {

    // ==================================================
    // مدة التشغيل
    // ==================================================

    const uptime = getUptime();

    const timeStr =
      `${uptime.days} يوم، ` +
      `${uptime.hours} ساعة، ` +
      `${uptime.minutes} دقيقة، ` +
      `${uptime.seconds} ثانية`;

    // ==================================================
    // المجموعات
    // ==================================================

    const groupCount =
      getKnownGroups();

    // ==================================================
    // المستخدمون
    // ==================================================

    const userCount =
      getKnownUsers();

    const userCountStr =
      userCount !== null
        ? userCount.toLocaleString()
        : "غير متوفر";

    // ==================================================
    // الأوامر
    // ==================================================

    const commandCount =
      getCommandCount();

    const commandCountStr =
      commandCount !== null
        ? commandCount.toLocaleString()
        : "غير متوفر";

    // ==================================================
    // الذاكرة
    // ==================================================

    const memory =
      process.memoryUsage();

    const usedMemory =
      memory.rss;

    const heapUsed =
      memory.heapUsed;

    const heapTotal =
      memory.heapTotal;

    const external =
      memory.external;

    // ==================================================
    // نسبة Heap المستخدمة
    // ==================================================

    const memoryPercent =
      heapTotal > 0
        ? Math.round(
            (heapUsed / heapTotal) * 100
          )
        : 0;

    const memoryBar =
      createMemoryBar(
        memoryPercent,
        18
      );

    // ==================================================
    // Ping حقيقي
    // ==================================================

    const pingStart =
      Date.now();

    await new Promise(resolve => {
      api.sendMessage(
        "⌛",
        threadID,
        (err, info) => {
          if (
            info &&
            info.messageID
          ) {
            try {
              api.unsendMessage(
                info.messageID
              );
            } catch (e) {}
          }

          resolve();
        }
      );
    });

    const ping =
      Date.now() - pingStart;

    // ==================================================
    // حالة النظام
    // ==================================================

    let systemStatus =
      "مستقرة";

    if (ping >= 1000) {
      systemStatus =
        "بطيئة";
    } else if (ping >= 500) {
      systemStatus =
        "متوسطة";
    }

    // ==================================================
    // زخرفة HINA
    // ==================================================

    const header =
`⌬ ━━ 𝗛𝗜𝗡𝗔 DEVELOPER ━━ ⌬`;

    const footer =
`⌬ ━━━━━━━━━━━━ ⌬`;

    // ==================================================
    // الرسالة
    // ==================================================

    const message =
`${header}

⚙️ حـالـة الـنـظـام

⏳ مـدة الـتـشـغـيـل:
» ${timeStr}

📊 الإحـصـائـيـات:
• المجموعات المعروفة: ${groupCount}
• المستخدمون: ${userCountStr}
• الأوامر المستخدمة: ${commandCountStr}
• سرعة الاستجابة: ${ping}ms

💾 الذاكرة:
» ${memoryBar} ${memoryPercent}%
» Heap: ${formatMB(heapUsed)} MB / ${formatMB(heapTotal)} MB
» RAM: ${formatMB(usedMemory)} MB
» External: ${formatMB(external)} MB

🤖 الحالة: متصل
⚡ النظام: ${systemStatus}
👑 المطور: أبو هريرة

${footer}`;

    // ==================================================
    // إرسال الرسالة
    // ==================================================

    return api.sendMessage(
      message,
      threadID,
      (err, info) => {

        if (err) {
          console.error(
            "❌ HINA UPTIME SEND ERROR:",
            err
          );
          return;
        }

        // ==================================================
        // حذف الرسالة بعد 15 ثانية
        // ==================================================

        if (
          info &&
          info.messageID
        ) {
          setTimeout(() => {
            try {
              api.unsendMessage(
                info.messageID
              );
            } catch (e) {
              console.log(
                "HINA: تعذر حذف رسالة الابتايم"
              );
            }
          }, 15000);
        }

      },
      messageID
    );

  } catch (error) {

    console.error(
      "❌ HINA UPTIME ERROR:",
      error
    );

    return api.sendMessage(
`${"⌬ ━━ 𝗛𝗜𝗡𝗔 DEVELOPER ━━ ⌬"}

❌ حدث خطأ أثناء تنفيذ الأمر

${error.message}

⌬ ━━━━━━━━━━━━ ⌬`,
      threadID,
      messageID
    );
  }
};