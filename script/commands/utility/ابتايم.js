module.exports.config = {
  name: "ابتايم",
  version: "1.3.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "عرض حالة النظام وإحصائيات التشغيل",
  commandCategory: "utility",
  usages: "ابتايم",
  cooldowns: 5
};

// ==================================================
// حساب عدد المجموعات التي يعرفها البوت
// بدون getThreadList
// ==================================================

function getKnownGroups() {
  const ids = new Set();

  try {
    // global.data.allThreadID
    if (
      global.data &&
      Array.isArray(global.data.allThreadID)
    ) {
      for (const id of global.data.allThreadID) {
        if (id) ids.add(String(id));
      }
    }
  } catch (e) {}

  try {
    // global.data.threadData
    if (
      global.data &&
      global.data.threadData
    ) {
      const data = global.data.threadData;

      if (data instanceof Map) {
        for (const id of data.keys()) {
          if (id) ids.add(String(id));
        }
      } else if (typeof data === "object") {
        for (const id of Object.keys(data)) {
          if (id) ids.add(String(id));
        }
      }
    }
  } catch (e) {}

  return ids.size;
}

// ==================================================
// RUN
// ==================================================

module.exports.run = async function({ api, event }) {

  const {
    threadID,
    messageID
  } = event;

  try {

    // ==================================================
    // مدة التشغيل
    // ==================================================

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

    const timeStr =
      `${days} يوم، ${hours} ساعة، ${minutes} دقيقة، ${seconds} ثانية`;

    // ==================================================
    // عدد المجموعات
    // ==================================================

    const groupCount =
      getKnownGroups();

    // ==================================================
    // زخرفة HINA
    // ==================================================

    const header =
`⌬ ━━ 𝗛𝗜𝗡𝗔 DEVELOPER ━━ ⌬`;

    const statusMsg =
`${header}

⚙️ حـالـة الـنـظـام

⏳ مـدة الـتـشـغـيـل:
» ${timeStr}

📊 الإحـصـائـيـات:
• المجموعات المعروفة: ${groupCount}
• سرعة الاستجابة: مستقرة

🤖 الحالة: متصل
👑 المطور: أبو هريرة

⌬ ━━━━━━━━━━━━ ⌬`;

    // ==================================================
    // إرسال الرسالة
    // ==================================================

    return api.sendMessage(
      statusMsg,
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
            } catch (e) {}

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
`⌬ ━━ 𝗛𝗜𝗡𝗔 DEVELOPER ━━ ⌬

❌ حدث خطأ أثناء تنفيذ الأمر

${error.message}

⌬ ━━━━━━━━━━━━ ⌬`,
      threadID,
      messageID
    );
  }
};

هذا الإصدار لا يستخدم "getThreadList()" نهائيًا، وبالتالي خطأ:

"Cannot read properties of undefined (reading 'uri')"

لن يأتي من هذا الأمر. كما أنه يعرض الثواني ويحتفظ برسالة HINA والخروج التلقائي بعد 15 ثانية.