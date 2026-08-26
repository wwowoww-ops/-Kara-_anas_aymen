const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "وين",
  version: "1.0.0",
  hasPermssion: 2,
  credits: "أبو هريرة",
  description: "تحديد مسار أمر داخل ملفات البوت",
  commandCategory: "Developer",
  usages: "وين [اسم الأمر]",
  cooldowns: 3,
  devID: "61578581225040"
};


// ═══════════════════════════════════════════════
// ⚙️ إعدادات
// ═══════════════════════════════════════════════

const DEV_ID = "61578581225040";


// ═══════════════════════════════════════════════
// 📁 العثور على مجلد commands
// ═══════════════════════════════════════════════

function findCommandsDirectory() {

  const possiblePaths = [

    path.join(process.cwd(), "commands"),

    path.join(__dirname, "..", "commands"),

    path.join(__dirname, "commands")

  ];


  for (const dir of possiblePaths) {

    try {

      if (
        fs.existsSync(dir) &&
        fs.statSync(dir).isDirectory()
      ) {

        return path.resolve(dir);

      }

    } catch (_) {}

  }


  return null;
}


// ═══════════════════════════════════════════════
// 📂 قراءة جميع ملفات JS بشكل Recursive
// ═══════════════════════════════════════════════

function getJSFiles(directory) {

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

      console.error(
        "[HINA FIND] READ ERROR:",
        currentDir,
        error.message
      );

      return;
    }


    for (const entry of entries) {

      const fullPath =
        path.join(
          currentDir,
          entry.name
        );


      // مجلد
      if (entry.isDirectory()) {

        scan(fullPath);

        continue;
      }


      // ملف JavaScript فقط
      if (
        entry.isFile() &&
        entry.name.toLowerCase().endsWith(".js")
      ) {

        files.push(
          fullPath
        );

      }

    }

  }


  scan(directory);


  return files;
}


// ═══════════════════════════════════════════════
// 🔎 استخراج config.name من الأمر
// ═══════════════════════════════════════════════

function getCommandName(filePath) {

  try {

    /*
     * نحاول تحميل الملف
     */
    delete require.cache[
      require.resolve(filePath)
    ];


    const command =
      require(filePath);


    if (
      !command ||
      !command.config
    ) {

      return null;
    }


    const name =
      command.config.name;


    if (
      typeof name !== "string"
    ) {

      return null;
    }


    return name.trim();

  } catch (error) {

    console.log(
      "[HINA FIND] LOAD ERROR:",
      filePath,
      error.message
    );

    return null;
  }
}


// ═══════════════════════════════════════════════
// 🔍 البحث عن الأمر
// ═══════════════════════════════════════════════

function findCommands(
  commandsDir,
  targetName
) {

  const files =
    getJSFiles(
      commandsDir
    );


  const results = [];


  for (const file of files) {

    const commandName =
      getCommandName(
        file
      );


    if (!commandName) {
      continue;
    }


    /*
     * مطابقة الاسم من config.name
     *
     * لا نعتمد على اسم الملف
     */
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


  return results;
}


// ═══════════════════════════════════════════════
// 📌 تحويل المسار إلى مسار نسبي
// ═══════════════════════════════════════════════

function getRelativePath(filePath) {

  return path.relative(
    process.cwd(),
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
    // 🔐 التحقق من المطور
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
    // 📝 قراءة اسم الأمر
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
    // 📁 تحديد مجلد commands
    // ═══════════════════════════════════════════

    const commandsDir =
      findCommandsDirectory();


    if (!commandsDir) {

      return api.sendMessage(
        `⌬ ━━ 𝗛𝗜𝗡𝗔 FIND ━━ ⌬\n\n` +

        `❌ لم يتم العثور على مجلد commands.\n\n` +

        `📂 تأكد أن مجلد الأوامر موجود داخل مجلد البوت.`,
        
        threadID,
        messageID
      );

    }


    // ═══════════════════════════════════════════
    // 🔎 البحث
    // ═══════════════════════════════════════════

    const results =
      findCommands(
        commandsDir,
        targetName
      );


    // ═══════════════════════════════════════════
    // ❌ لم يتم العثور
    // ═══════════════════════════════════════════

    if (!results.length) {

      return api.sendMessage(
        `⌬ ━━ 𝗛𝗜𝗡𝗔 FIND ━━ ⌬\n\n` +

        `🔎 الأمر: ${targetName}\n\n` +

        `❌ لم يتم العثور على هذا الأمر.\n\n` +

        `📂 تم البحث داخل:\n` +
        `${commandsDir}`,
        
        threadID,
        messageID
      );

    }


    // ═══════════════════════════════════════════
    // 📋 تجهيز النتائج
    // ═══════════════════════════════════════════

    let output =
      `⌬ ━━ 𝗛𝗜𝗡𝗔 FIND ━━ ⌬\n\n` +

      `🔎 الأمر: ${targetName}\n` +

      `📁 مجلد البحث:\n` +
      `${commandsDir}\n\n` +

      `✓ تم العثور على ${results.length} نتيجة\n\n`;


    results.forEach(
      (result, index) => {

        const absolutePath =
          path.resolve(
            result.file
          );


        const relativePath =
          getRelativePath(
            result.file
          );


        output +=
          `━━━━━━━━━━━━━━\n` +

          `📌 النتيجة ${index + 1}\n\n` +

          `⚙️ config.name:\n` +
          `${result.name}\n\n` +

          `📄 الملف:\n` +
          `${path.basename(result.file)}\n\n` +

          `📂 المسار النسبي:\n` +
          `${relativePath || "."}\n\n` +

          `📍 المسار الكامل:\n` +
          `${absolutePath}\n`;

      }
    );


    output +=
      `━━━━━━━━━━━━━━`;


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

      `📝 ${error?.message || "خطأ غير معروف"}`,
      
      threadID,
      messageID
    );

  }

};