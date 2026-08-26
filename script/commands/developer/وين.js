const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "وين",
  version: "2.0.0",
  hasPermssion: 2,
  credits: "أبو هريرة",
  description: "البحث عن مكان أمر داخل البوت",
  commandCategory: "Developer",
  usages: "وين [اسم الأمر]",
  cooldowns: 3,
  devID: "61578581225040"
};


// ═══════════════════════════════════════════════
// ⚙️ الإعدادات
// ═══════════════════════════════════════════════

const DEV_ID = "61578581225040";


// ═══════════════════════════════════════════════
// 🚫 مجلدات يتم تجاهلها
// ═══════════════════════════════════════════════

const IGNORED_DIRS = new Set([
  "node_modules",
  ".git",
  ".github",
  "cache",
  "caches",
  "logs",
  "log",
  "tmp",
  "temp",
  "uploads",
  "downloads"
]);


// ═══════════════════════════════════════════════
// 📁 تحديد جذر البوت
// ═══════════════════════════════════════════════

function getBotRoot() {

  /*
   * process.cwd()
   * هو المكان الذي تم منه تشغيل البوت
   */

  try {

    return path.resolve(
      process.cwd()
    );

  } catch (_) {

    return path.resolve(
      __dirname,
      ".."
    );

  }
}


// ═══════════════════════════════════════════════
// 📂 البحث عن ملفات JavaScript
// ═══════════════════════════════════════════════

function getJSFiles(rootDir) {

  const files = [];


  function scan(currentDir) {

    let entries;

    try {

      entries =
        fs.readdirSync(
          currentDir,
          {
            withFileTypes: true
          }
        );

    } catch (error) {

      console.log(
        "[HINA FIND] READ ERROR:",
        currentDir,
        error.message
      );

      return;
    }


    for (const entry of entries) {

      const name =
        entry.name;


      // ═══════════════════════════════════════
      // تجاهل المجلدات
      // ═══════════════════════════════════════

      if (
        entry.isDirectory()
      ) {

        if (
          IGNORED_DIRS.has(
            name.toLowerCase()
          )
        ) {

          continue;
        }


        /*
         * تجاهل المجلدات المخفية
         * باستثناء المجلدات المهمة
         */

        if (
          name.startsWith(".")
        ) {

          continue;
        }


        scan(
          path.join(
            currentDir,
            name
          )
        );

        continue;
      }


      // ═══════════════════════════════════════
      // ملفات JavaScript
      // ═══════════════════════════════════════

      if (
        entry.isFile() &&
        (
          name.toLowerCase().endsWith(".js") ||
          name.toLowerCase().endsWith(".cjs")
        )
      ) {

        files.push(
          path.join(
            currentDir,
            name
          )
        );

      }

    }

  }


  scan(
    rootDir
  );


  return files;
}


// ═══════════════════════════════════════════════
// 🔎 قراءة config.name
// ═══════════════════════════════════════════════

function getCommandConfig(filePath) {

  try {

    /*
     * إزالة النسخة القديمة من الكاش
     */
    try {

      delete require.cache[
        require.resolve(
          filePath
        )
      ];

    } catch (_) {}


    const command =
      require(
        filePath
      );


    if (
      !command ||
      !command.config
    ) {

      return null;
    }


    const config =
      command.config;


    if (
      typeof config.name !==
      "string"
    ) {

      return null;
    }


    const name =
      config.name.trim();


    if (!name) {

      return null;
    }


    return {

      name,

      version:
        config.version || "غير محدد",

      category:
        config.commandCategory ||
        "غير محدد",

      file:
        filePath

    };

  } catch (error) {

    /*
     * بعض ملفات البوت قد تحتوي على
     * أكواد لا يمكن require لها مباشرة
     *
     * نتجاهلها بدل إيقاف البحث
     */

    return null;
  }
}


// ═══════════════════════════════════════════════
// 🔍 البحث عن الأمر
// ═══════════════════════════════════════════════

function findCommand(
  rootDir,
  targetName
) {

  const files =
    getJSFiles(
      rootDir
    );


  const results = [];


  for (
    const file
    of files
  ) {

    const config =
      getCommandConfig(
        file
      );


    if (!config) {

      continue;
    }


    if (
      String(config.name)
        .trim()
        .toLowerCase() ===
      String(targetName)
        .trim()
        .toLowerCase()
    ) {

      results.push(
        config
      );

    }

  }


  return {
    scanned:
      files.length,

    results

  };
}


// ═══════════════════════════════════════════════
// 📍 الحصول على المسار النسبي
// ═══════════════════════════════════════════════

function getRelativePath(
  rootDir,
  filePath
) {

  const relative =
    path.relative(
      rootDir,
      filePath
    );


  return relative ||
    path.basename(
      filePath
    );
}


// ═══════════════════════════════════════════════
// 🚀 الأمر الرئيسي
// ═══════════════════════════════════════════════

module.exports.run =
async function ({
  api,
  event,
  args
}) {

  const {
    threadID,
    messageID,
    senderID
  } = event;


  try {

    // ═══════════════════════════════════════════
    // 🔐 المطور فقط
    // ═══════════════════════════════════════════

    if (
      String(senderID) !==
      String(DEV_ID)
    ) {

      return api.sendMessage(
        "⛔ هذا الأمر مخصص للمطور فقط.",
        threadID,
        messageID
      );

    }


    // ═══════════════════════════════════════════
    // 📝 اسم الأمر
    // ═══════════════════════════════════════════

    const targetName =
      Array.isArray(args)
        ? args.join(" ").trim()
        : "";


    if (!targetName) {

      return api.sendMessage(
        `⌬ ━━ 𝗛𝗜𝗡𝗔 FIND ━━ ⌬\n\n` +

        `❌ اكتب اسم الأمر.\n\n` +

        `📝 الاستخدام:\n` +
        `.وين [اسم الأمر]\n\n` +

        `مثال:\n` +
        `.وين بنترست`,
        
        threadID,
        messageID
      );

    }


    // ═══════════════════════════════════════════
    // 📁 جذر البوت
    // ═══════════════════════════════════════════

    const rootDir =
      getBotRoot();


    // ═══════════════════════════════════════════
    // 🔎 البحث
    // ═══════════════════════════════════════════

    const search =
      findCommand(
        rootDir,
        targetName
      );


    // ═══════════════════════════════════════════
    // ❌ لم يجد
    // ═══════════════════════════════════════════

    if (
      !search.results.length
    ) {

      return api.sendMessage(
        `⌬ ━━ 𝗛𝗜𝗡𝗔 FIND ━━ ⌬\n\n` +

        `🔎 الأمر:\n` +
        `${targetName}\n\n` +

        `❌ لم يتم العثور على الأمر.\n\n` +

        `📂 تم البحث في كامل مجلد البوت.\n` +

        `📄 ملفات JavaScript المفحوصة:\n` +
        `${search.scanned}`,
        
        threadID,
        messageID
      );

    }


    // ═══════════════════════════════════════════
    // 📋 النتائج
    // ═══════════════════════════════════════════

    let output =
      `⌬ ━━ 𝗛𝗜𝗡𝗔 FIND ━━ ⌬\n\n` +

      `🔎 الأمر:\n` +
      `${targetName}\n\n` +

      `✓ تم العثور على:\n` +
      `${search.results.length} نتيجة\n\n`;


    search.results.forEach(
      (result, index) => {

        const absolutePath =
          path.resolve(
            result.file
          );


        const relativePath =
          getRelativePath(
            rootDir,
            result.file
          );


        output +=
          `━━━━━━━━━━━━━━\n` +

          `📌 النتيجة ${index + 1}\n\n` +

          `⚙️ config.name:\n` +
          `${result.name}\n\n` +

          `📦 الإصدار:\n` +
          `${result.version}\n\n` +

          `🗂️ التصنيف:\n` +
          `${result.category}\n\n` +

          `📄 اسم الملف:\n` +
          `${path.basename(result.file)}\n\n` +

          `📂 المسار النسبي:\n` +
          `${relativePath}\n\n` +

          `📍 المسار الكامل:\n` +
          `${absolutePath}\n\n`;

      }
    );


    output +=
      `━━━━━━━━━━━━━━\n` +

      `📊 تم فحص ${search.scanned} ملف JavaScript`;


    // ═══════════════════════════════════════════
    // 📤 إرسال النتيجة
    // ═══════════════════════════════════════════

    return api.sendMessage(
      output,
      threadID,
      messageID
    );


  } catch (error) {

    console.error(
      "[HINA FIND ERROR]",
      error
    );


    return api.sendMessage(
      `⌬ ━━ 𝗛𝗜𝗡𝗔 FIND ━━ ⌬\n\n` +

      `❌ حدث خطأ أثناء البحث.\n\n` +

      `📝 ${
        error?.message ||
        "خطأ غير معروف"
      }`,
      
      threadID,
      messageID
    );

  }

};