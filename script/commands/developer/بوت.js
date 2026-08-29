const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "بوت",
  version: "2.0.0",
  hasPermssion: 2,
  credits: "أبو هريرة",
  description: "تشغيل أو إيقاف استجابة البوت للعامة",
  commandCategory: "Developer",
  usages: "اون / اوف",
  cooldowns: 2
};

// ============================================================
// زخرفة HINA
// ============================================================

const HEADER = "⌬ ━━ 𝗛𝗜𝗡𝗔 〢 بوت ━━ ⌬";
const FOOTER = "╰━━━━━━━━━━━━━━━━╯";

// ============================================================
// مسار config.json
// ============================================================

const configPath = path.join(
  global.client.mainPath,
  "config.json"
);

// ============================================================
// RUN
// ============================================================

module.exports.run = async function({
  api,
  event,
  args
}) {

  const {
    threadID,
    messageID
  } = event;

  try {

    // ========================================================
    // التأكد من وجود config.json
    // ========================================================

    if (!fs.existsSync(configPath)) {

      return api.sendMessage(
        `${HEADER}

❌ لم يتم العثور على ملف config.json

${FOOTER}`,
        threadID,
        messageID
      );

    }

    // ========================================================
    // قراءة config.json
    // ========================================================

    let config;

    try {

      config = JSON.parse(
        fs.readFileSync(
          configPath,
          "utf8"
        )
      );

    } catch (error) {

      console.error(
        "[BOT MODE] CONFIG ERROR:",
        error
      );

      return api.sendMessage(
        `${HEADER}

❌ تعذر قراءة config.json

تأكد أن الملف بصيغة JSON صحيحة.

${FOOTER}`,
        threadID,
        messageID
      );

    }

    // ========================================================
    // قراءة الأمر
    // ========================================================

    const action = String(
      args && args[0]
        ? args[0]
        : ""
    )
      .trim()
      .toLowerCase();

    // ========================================================
    // BOT ON
    // ========================================================

    if (
      action === "اون" ||
      action === "on"
    ) {

      config.DeveloperMode = false;

      fs.writeFileSync(
        configPath,
        JSON.stringify(
          config,
          null,
          "\t"
        ),
        "utf8"
      );

      // تحديث الإعداد الحالي مباشرة
      global.config.DeveloperMode = false;

      return api.sendMessage(
        `${HEADER}

✅ تـم تـشـغـيـل الـبـوت

البوت الآن يستجيب للجميع بشكل طبيعي.

✦ DeveloperMode:
OFF

${FOOTER}`,
        threadID,
        messageID
      );

    }

    // ========================================================
    // BOT OFF
    // ========================================================

    if (
      action === "اوف" ||
      action === "off"
    ) {

      config.DeveloperMode = true;

      fs.writeFileSync(
        configPath,
        JSON.stringify(
          config,
          null,
          "\t"
        ),
        "utf8"
      );

      // تحديث الإعداد الحالي مباشرة
      global.config.DeveloperMode = true;

      return api.sendMessage(
        `${HEADER}

🛑 تـم إيـقـاف الـبـوت

البوت الآن في وضع المطور ولن يستجيب للعامة.

✦ DeveloperMode:
ON

${FOOTER}`,
        threadID,
        messageID
      );

    }

    // ========================================================
    // عرض الحالة
    // ========================================================

    const isDeveloperMode =
      config.DeveloperMode === true;

    const status =
      isDeveloperMode
        ? "🛑 اوف — وضع المطور"
        : "✅ اون — يعمل للجميع";

    return api.sendMessage(
      `${HEADER}

✦ حالة البوت

${status}

✦ DeveloperMode:
${isDeveloperMode ? "ON" : "OFF"}

━━━━━━━━━━━━━━━━━━

للتشغيل:
.بوت اون

للإيقاف:
.بوت اوف

${FOOTER}`,
      threadID,
      messageID
    );

  } catch (error) {

    console.error(
      "[BOT MODE ERROR]",
      error
    );

    return api.sendMessage(
      `${HEADER}

❌ حدث خطأ أثناء تغيير حالة البوت

${error.message || error}

${FOOTER}`,
      threadID,
      messageID
    );

  }
};