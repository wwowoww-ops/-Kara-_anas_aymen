module.exports.config = {
  name: "ابتايم",
  version: "1.4.0",
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

    const uptime = getUptime();

    const timeStr =
      `${uptime.days} يوم، ` +
      `${uptime.hours} ساعة، ` +
      `${uptime.minutes} دقيقة، ` +
      `${uptime.seconds} ثانية`;

    const groupCount =
      getKnownGroups();

    // ==================================================
    // زخرفة HINA
    // ==================================================

    const header =
`⌬ ━━ 𝗛𝗜𝗡𝗔 DEVELOPER ━━ ⌬`;

    const footer =
`⌬ ━━━━━━━━━━━━ ⌬`;

    const message =
`${header}

⚙️ حـالـة الـنـظـام

⏳ مـدة الـتـشـغـيـل:
» ${timeStr}

📊 الإحـصـائـيـات:
• المجموعات المعروفة: ${groupCount}
• سرعة الاستجابة: مستقرة

🤖 الحالة: متصل
👑 المطور: أبو هريرة

${footer}`;

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

        // حذف الرسالة بعد 15 ثانية
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