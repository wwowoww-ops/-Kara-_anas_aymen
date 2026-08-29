const axios = require("axios");
const fs = require("fs-extra");

module.exports.config = {
  name: "اوامر",
  version: "12.0.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "قائمة أوامر HINA بنظام تفاعلي",
  commandCategory: "utility",
  usages: "اوامر",
  cooldowns: 5
};

const IMAGE_URL =
  "https://files.catbox.moe/01t0g7.jpg";

// ============================================================
// الزخرفة
// ============================================================

const TOP =
  "╭──────────────╮";

const BOTTOM =
  "╰──────────────╯";

// ============================================================
// الفئات
// ============================================================

const categories = {

  "1": {
    id: "fun",
    name: "الـتـرفـيـه"
  },

  "2": {
    id: "admin",
    name: "الإدارة"
  },

  "3": {
    id: "developer",
    name: "الـمـطـور"
  },

  "4": {
    id: "games",
    name: "الألـعـاب"
  },

  "5": {
    id: "media",
    name: "الـوسـائـط"
  },

  "6": {
    id: "pic",
    name: "الـصـور"
  },

  "7": {
    id: "utility",
    name: "الـخـدمـات"
  }

};

// ============================================================
// القائمة الرئيسية
// ============================================================

function createMainMenu() {

  return `${TOP}
│ 𝗛𝗜𝗡𝗔 〢 الأوامر │
${BOTTOM}

╞❯ ❶ الترفيه
╞❯ ❷ الإدارة
╞❯ ❸ المطور
╞❯ ❹ الألعاب
╞❯ ❺ الوسائط
╞❯ ❻ الصور
╘❯ ❼ الخدمات

${TOP}
│ ↳ رد برقم الفئة للعرض │
${BOTTOM}`;

}

// ============================================================
// قائمة الفئة
// ============================================================

function createCategoryMenu(
  category,
  commands
) {

  let commandList = "";

  commands.forEach(
    (command, index) => {

      const symbol =
        index === commands.length - 1
          ? "╘❯"
          : "╞❯";

      commandList +=
        `${symbol} ${command}\n`;

    }
  );

  return `${TOP}
│ 𝗛𝗜𝗡𝗔 〢 ${category.name} │
${BOTTOM}

${commandList}
${TOP}
│ ↳ عدد الأوامر: ${commands.length} │
│ ↳ أرسل رجوع للقائمة الرئيسية │
${BOTTOM}`;

}

// ============================================================
// جلب أوامر الفئة
// ============================================================

function getCategoryCommands(
  categoryID
) {

  if (
    !global.client ||
    !global.client.commands
  ) {
    return [];
  }

  return Array.from(
    global.client.commands.values()
  )

    .filter(command => {

      if (
        !command ||
        !command.config
      ) {
        return false;
      }

      const commandCategory =
        String(
          command.config.commandCategory || ""
        )
          .trim()
          .toLowerCase();

      return (
        commandCategory ===
        String(categoryID)
          .trim()
          .toLowerCase()
      );

    })

    .map(
      command =>
        String(
          command.config.name || ""
        ).trim()
    )

    .filter(Boolean)

    .sort(
      (a, b) =>
        a.localeCompare(
          b,
          "ar"
        )
    );

}

// ============================================================
// حذف جلسات المستخدم القديمة فقط
// ============================================================

function removeUserReplies(
  senderID
) {

  if (
    !global.client
  ) {
    return;
  }

  if (
    !Array.isArray(
      global.client.handleReply
    )
  ) {
    global.client.handleReply = [];
    return;
  }

  global.client.handleReply =
    global.client.handleReply.filter(
      item => {

        if (
          item.name !==
          module.exports.config.name
        ) {
          return true;
        }

        return (
          String(item.author) !==
          String(senderID)
        );

      }
    );

}

// ============================================================
// تسجيل جلسة المستخدم
// ============================================================

function saveReply(
  messageID,
  author,
  type
) {

  if (
    !global.client.handleReply
  ) {
    global.client.handleReply = [];
  }

  // حذف جلسة هذا المستخدم فقط
  removeUserReplies(
    author
  );

  global.client.handleReply.push({

    name:
      module.exports.config.name,

    messageID:

      String(messageID),

    author:

      String(author),

    type

  });

}

// ============================================================
// التحقق من صاحب القائمة
// ============================================================

function isOwner(
  senderID,
  handleReply
) {

  return (
    String(senderID) ===
    String(handleReply.author)
  );

}

// ============================================================
// رسالة القائمة ليست لك
// ============================================================

function notYourMenu(
  api,
  event
) {

  return api.sendMessage(

`${TOP}
│ 𝗛𝗜𝗡𝗔 〢 تنبيه │
${BOTTOM}

⚠️ هذه ليست قائمتك

↳ اكتب اوامر لإظهار قائمة خاصة بك

${BOTTOM}`,

    event.threadID,
    event.messageID

  );

}

// ============================================================
// تشغيل الأمر
// ============================================================

module.exports.run =
async function ({
  api,
  event
}) {

  try {

    if (
      !event
    ) {
      return;
    }

    const {
      threadID,
      messageID,
      senderID
    } = event;

    const menu =
      createMainMenu();

    let imagePath =
      null;

    // ========================================================
    // تحميل صورة القائمة
    // ========================================================

    try {

      const response =
        await axios.get(
          IMAGE_URL,
          {
            responseType:
              "arraybuffer",

            timeout:
              15000
          }
        );

      imagePath =
        `${process.cwd()}/hina_commands_${Date.now()}_${Math.random()
          .toString(36)
          .slice(2)}.jpg`;

      await fs.writeFile(
        imagePath,
        Buffer.from(
          response.data
        )
      );

    } catch (error) {

      console.error(
        "[HINA MENU] IMAGE ERROR:",
        error.message
      );

    }

    // ========================================================
    // إرسال القائمة
    // ========================================================

    return api.sendMessage(

      imagePath

        ? {
            body:
              menu,

            attachment:
              fs.createReadStream(
                imagePath
              )
          }

        : menu,

      threadID,

      (err, info) => {

        // ----------------------------------------------------
        // حذف الصورة المؤقتة
        // ----------------------------------------------------

        if (
          imagePath
        ) {

          setTimeout(
            async () => {

              try {

                if (
                  await fs.pathExists(
                    imagePath
                  )
                ) {

                  await fs.remove(
                    imagePath
                  );

                }

              } catch (e) {}

            },

            10000
          );

        }

        if (
          err ||
          !info
        ) {

          console.error(
            "[HINA MENU] SEND ERROR:",
            err
          );

          return;
        }

        // ----------------------------------------------------
        // إنشاء جلسة خاصة بالمستخدم
        // ----------------------------------------------------

        saveReply(
          info.messageID,
          senderID,
          "main"
        );

      },

      messageID
    );

  } catch (error) {

    console.error(
      "❌ HINA COMMAND MENU ERROR:",
      error
    );

    return api.sendMessage(
      "❌ حدث خطأ أثناء فتح قائمة الأوامر",
      event.threadID,
      event.messageID
    );

  }

};

// ============================================================
// التعامل مع الردود
// ============================================================

module.exports.handleReply =
async function ({
  api,
  event,
  handleReply
}) {

  try {

    if (
      !event ||
      !handleReply
    ) {
      return;
    }

    const {
      threadID,
      messageID,
      senderID,
      body
    } = event;

    // ========================================================
    // الشخص ليس صاحب القائمة
    // ========================================================

    if (
      !isOwner(
        senderID,
        handleReply
      )
    ) {

      return notYourMenu(
        api,
        event
      );

    }

    // ========================================================
    // تنظيف الإدخال
    // ========================================================

    const input =
      String(
        body || ""
      )
        .trim()
        .replace(
          /[٠-٩]/g,
          digit =>
            String(
              "٠١٢٣٤٥٦٧٨٩"
                .indexOf(
                  digit
                )
            )
        );

    if (
      !input
    ) {
      return;
    }

    // ========================================================
    // رجوع
    // ========================================================

    if (
      input === "رجوع" ||
      input === "رجـوع" ||
      input === "عودة" ||
      input.toLowerCase() === "back"
    ) {

      try {

        await api.unsendMessage(
          handleReply.messageID
        );

      } catch (e) {}

      return module.exports.run({
        api,
        event
      });

    }

    // ========================================================
    // إذا كانت القائمة فئة
    // ========================================================

    if (
      handleReply.type !==
      "main"
    ) {

      return;

    }

    // ========================================================
    // اختيار الفئة
    // ========================================================

    const category =
      categories[input];

    if (
      !category
    ) {

      return;

    }

    // ========================================================
    // جلب أوامر الفئة
    // ========================================================

    const commandList =
      getCategoryCommands(
        category.id
      );

    // ========================================================
    // حذف القائمة الرئيسية
    // ========================================================

    try {

      await api.unsendMessage(
        handleReply.messageID
      );

    } catch (e) {}

    // ========================================================
    // لا توجد أوامر
    // ========================================================

    if (
      commandList.length === 0
    ) {

      const emptyMessage =
`${TOP}
│ 𝗛𝗜𝗡𝗔 〢 ${category.name} │
${BOTTOM}

⚠️ لا توجد أوامر في هذه الفئة حاليًا

${TOP}
│ ↳ أرسل رجوع للقائمة الرئيسية │
${BOTTOM}`;

      return api.sendMessage(
        emptyMessage,
        threadID,

        (err, info) => {

          if (
            err ||
            !info
          ) {
            return;
          }

          saveReply(
            info.messageID,
            senderID,
            "category"
          );

        },

        messageID
      );

    }

    // ========================================================
    // إنشاء قائمة الفئة
    // ========================================================

    const categoryMessage =
      createCategoryMenu(
        category,
        commandList
      );

    // ========================================================
    // إرسال قائمة الفئة
    // ========================================================

    return api.sendMessage(

      categoryMessage,

      threadID,

      (err, info) => {

        if (
          err ||
          !info
        ) {
          return;
        }

        saveReply(
          info.messageID,
          senderID,
          "category"
        );

      },

      messageID
    );

  } catch (error) {

    console.error(
      "❌ HINA MENU REPLY ERROR:",
      error
    );

  }

};