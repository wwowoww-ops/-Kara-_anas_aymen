const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "وين",
  version: "3.0.0",
  hasPermssion: 2,
  credits: "أبو هريرة",
  description: "البحث عن مكان أمر داخل ملفات البوت",
  commandCategory: "Developer",
  usages: "وين [اسم الأمر]",
  cooldowns: 3,
  devID: "61592700121061"
};


// ═══════════════════════════════════════════════
// ⚙️ الإعدادات
// ═══════════════════════════════════════════════

const DEV_ID = "61592700121061";


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
  "downloads",
  ".npm",
  ".cache"
]);


// ═══════════════════════════════════════════════
// 📁 تحديد جذر البوت
// ═══════════════════════════════════════════════

function getBotRoot() {

  return path.resolve(
    process.cwd()
  );

}


// ═══════════════════════════════════════════════
// 📂 البحث عن ملفات JS بدون تشغيلها
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

      const fullPath =
        path.join(
          currentDir,
          name
        );


      // ═══════════════════════════════════════
      // 📁 مجلد
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


        if (
          name.startsWith(".")
        ) {

          continue;
        }


        scan(
          fullPath
        );

        continue;
      }


      // ═══════════════════════════════════════
      // 📄 ملف JavaScript
      // ═══════════════════════════════════════

      if (
        entry.isFile() &&
        (
          name.toLowerCase().endsWith(".js") ||
          name.toLowerCase().endsWith(".cjs")
        )
      ) {

        files.push(
          fullPath
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
// 🔎 استخراج config.name من النص
// ═══════════════════════════════════════════════

function extractConfigName(content) {

  if (
    !content ||
    typeof content !== "string"
  ) {

    return null;
  }


  /*
   * يدعم:
   *
   * name: "بنترست"
   * name: 'بنترست'
   * name : "بنترست"
   *
   * داخل:
   * module.exports.config
   */

  const patterns = [

    /module\s*\.\s*exports\s*\.\s*config\s*=\s*\{[\s\S]{0,5000}?\bname\s*:\s*["'`]([^"'`]+)["'`]/i,

    /exports\s*\.\s*config\s*=\s*\{[\s\S]{0,5000}?\bname\s*:\s*["'`]([^"'`]+)["'`]/i

  ];


  for (
    const regex
    of patterns
  ) {

    const match =
      content.match(
        regex
      );


    if (
      match &&
      match[1]
    ) {

      return match[1].trim();

    }

  }


  return null;
}


// ═══════════════════════════════════════════════
// 🔎 البحث عن الأمر
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

    let content;

    try {

      /*
       * قراءة الملف فقط
       * بدون require
       * بدون تشغيل الكود
       */

      content =
        fs.readFileSync(
          file,
          "utf8"
        );

    } catch (_) {

      continue;
    }


    const commandName =
      extractConfigName(
        content
      );


    if (!commandName) {

      continue;
    }


    if (
      commandName.toLowerCase() ===
      targetName.toLowerCase()
    ) {

      results.push({

        name:
          commandName,

        file:
          file

      });

    }

  }


  return {

    scanned:
      files.length,

    results

  };
}


// ═══════════════════════════════════════════════
// 📍 المسار النسبي
// ═══════════════════════════════════════════════

function getRelativePath(
  rootDir,
  filePath
) {

  return path.relative(
    rootDir,
    filePath
  );

}


// ═══════════════════════════════════════════════
// 🚀 الأمر
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

        `❌ اكتب اسم الأمر الذي تريد البحث عنه.\n\n` +

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
    // ❌ لا توجد نتيجة
    // ═══════════════════════════════════════════

    if (
      !search.results.length
    ) {

      return api.sendMessage(
        `⌬ ━━ 𝗛𝗜𝗡𝗔 FIND ━━ ⌬\n\n` +

        `🔎 الأمر:\n` +
        `${targetName}\n\n` +

        `❌ لم يتم العثور على الأمر.\n\n` +

        `📂 مكان البحث:\n` +
        `${rootDir}\n\n` +

        `📄 تم فحص:\n` +
        `${search.scanned} ملف JavaScript`,

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

      `✓ تم العثور على ${search.results.length} نتيجة\n`;


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
          `\n━━━━━━━━━━━━━━\n` +

          `📌 النتيجة ${index + 1}\n\n` +

          `⚙️ config.name:\n` +
          `${result.name}\n\n` +

          `📄 الملف:\n` +
          `${path.basename(result.file)}\n\n` +

          `📂 المسار النسبي:\n` +
          `${relativePath}\n\n` +

          `📍 المسار الكامل:\n` +
          `${absolutePath}\n`;

      }
    );


    output +=
      `\n━━━━━━━━━━━━━━\n` +
      `📊 تم فحص ${search.scanned} ملف`;


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