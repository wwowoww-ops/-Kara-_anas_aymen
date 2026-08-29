const axios = require("axios");
const fs = require("fs-extra");

module.exports.config = {
name: "اوامر",
version: "13.0.0",
hasPermssion: 0,
credits: "أبو هريرة",
description: "قائمة أوامر HINA بنظام تفاعلي",
commandCategory: "utility",
usages: ".اوامر",
cooldowns: 5
};

// ============================================================
// صورة القائمة
// ============================================================

const IMAGE_URL =
"https://files.catbox.moe/01t0g7.jpg";

// ============================================================
// الزخرفة المعتمدة
// ============================================================

const TOP =
"╭━━━━━━━━━━━━━━━━╮";

const BOTTOM =
"╰━━━━━━━━━━━━━━━━╯";

// ============================================================
// الفئات
// ============================================================

const categories = {

"1": {
id: "fun",
name: "الـتـرفـيـه",
aliases: [
"الترفيه",
"الـتـرفـيـه",
"ترفيه"
]
},

"2": {
id: "admin",
name: "الإدارة",
aliases: [
"الإدارة",
"الادارة",
"إدارة",
"ادارة"
]
},

"3": {
id: "developer",
name: "الـمـطـور",
aliases: [
"المطور",
"الـمـطـور",
"مطوّر",
"مطور"
]
},

"4": {
id: "games",
name: "الألـعـاب",
aliases: [
"الألعاب",
"الالعاب",
"الألـعـاب",
"العاب",
"ألعاب"
]
},

"5": {
id: "media",
name: "الـوسـائـط",
aliases: [
"الوسائط",
"الـوسـائـط",
"وسائط"
]
},

"6": {
id: "pic",
name: "الـصـور",
aliases: [
"الصور",
"الـصـور",
"صور"
]
},

"7": {
id: "utility",
name: "الـخـدمات",
aliases: [
"الخدمات",
"الـخـدمات",
"خدمات"
]
}

};

// ============================================================
// تحويل الأرقام العربية
// ============================================================

function normalizeDigits(text) {

return String(text || "")
.replace(
/[٠-٩]/g,
digit =>
String(
"٠١٢٣٤٥٦٧٨٩".indexOf(digit)
)
);

}

// ============================================================
// تنظيف النص
// ============================================================

function normalizeText(text) {

return normalizeDigits(text)
.trim()
.replace(/\s+/g, " ")
.toLowerCase();

}

// ============================================================
// البحث عن الفئة
// ============================================================

function findCategory(input) {

const value =
normalizeText(input);

// الرقم
if (
categories[value]
) {
return categories[value];
}

// الاسم
for (
const key of Object.keys(categories)
) {

const category =
  categories[key];

if (
  category.aliases.some(
    alias =>
      normalizeText(alias) === value
  )
) {

  return category;

}

}

return null;

}

// ============================================================
// القائمة الرئيسية
// ============================================================

function createMainMenu() {

return `${TOP}
𝗛𝗜𝗡𝗔          〢       الأوامر
${BOTTOM}

❶ الـتـرفـيـه
❷ الإدارة
❸ الـمـطـور
❹ الألـعـاب
❺ الـوسـائـط
❻ الـصـور
❼ الـخـدمات

${TOP}
رد برقم الفئة أو اسمها
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
𝗛𝗜𝗡𝗔          〢       ${category.name}
${BOTTOM}

${commandList}
${TOP}
عدد الأوامر: ${commands.length}
رد بـ رجوع للقائمة
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
// حذف جلسات المستخدم
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
      !item ||
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
// حفظ جلسة
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
// إرسال رسالة تنبيه
// ============================================================

function sendInvalidChoice(
api,
event
) {

return api.sendMessage(

`${TOP}
𝗛𝗜𝗡𝗔          〢       تنبيه
${BOTTOM}

⚠️ الاختيار غير صحيح

↳ رد برقم الفئة من ❶ إلى ❼
↳ أو اكتب اسم الفئة

${TOP}
حاول مرة أخرى
${BOTTOM}`,

event.threadID,
event.messageID

);

}

// ============================================================
// رسالة ليست قائمتك
// ============================================================

function sendNotYourMenu(
api,
event
) {

return api.sendMessage(

`${TOP}
𝗛𝗜𝗡𝗔          〢       تنبيه
${BOTTOM}

⚠️ هذه ليست قائمتك

↳ اكتب .اوامر لفتح قائمة خاصة بك

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

if (!event) {
  return;
}

const {
  threadID,
  messageID,
  senderID
} = event;

const menu =
  createMainMenu();

let imagePath = null;

// ========================================================
// تحميل الصورة
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
        body: menu,
        attachment:
          fs.createReadStream(
            imagePath
          )
      }

    : menu,

  threadID,

  (err, info) => {

    // ====================================================
    // حذف الصورة
    // ====================================================

    if (imagePath) {

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
      !info ||
      !info.messageID
    ) {

      console.error(
        "[HINA MENU] SEND ERROR:",
        err
      );

      return;

    }

    // ====================================================
    // حفظ جلسة المستخدم
    // ====================================================

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
  "❌ HINA MENU ERROR:",
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
// HANDLE REPLY
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
// التأكد من صاحب القائمة
// ========================================================

if (
  String(senderID) !==
  String(handleReply.author)
) {

  return sendNotYourMenu(
    api,
    event
  );

}

// ========================================================
// تنظيف الإدخال
// ========================================================

const input =
  normalizeText(body);

if (!input) {
  return;
}

// ========================================================
// رجوع
// ========================================================

if (
  input === "رجوع" ||
  input === "عودة" ||
  input === "back"
) {

  try {

    await api.unsendMessage(
      handleReply.messageID
    );

  } catch (error) {}

  return module.exports.run({
    api,
    event
  });

}

// ========================================================
// يجب أن تكون الجلسة الرئيسية
// ========================================================

if (
  handleReply.type !==
  "main"
) {

  // إذا كان داخل الفئة
  // لا نقوم بأي شيء عند كتابة
  // نص غير متعلق بالقائمة

  return;

}

// ========================================================
// البحث عن الفئة
// ========================================================

const category =
  findCategory(input);

// ========================================================
// اختيار غير صحيح
// ========================================================

if (!category) {

  return sendInvalidChoice(
    api,
    event
  );

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

} catch (error) {}

// ========================================================
// لا توجد أوامر
// ========================================================

if (
  commandList.length === 0
) {

  const emptyMessage =

`${TOP}
𝗛𝗜𝗡𝗔          〢       ${category.name}
${BOTTOM}

⚠️ لا توجد أوامر في هذه الفئة حاليًا

${TOP}
رد بـ رجوع للقائمة
${BOTTOM}`;

  return api.sendMessage(
    emptyMessage,
    threadID,

    (err, info) => {

      if (
        err ||
        !info ||
        !info.messageID
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
// إنشاء القائمة
// ========================================================

const categoryMessage =
  createCategoryMenu(
    category,
    commandList
  );

// ========================================================
// إرسال القائمة
// ========================================================

return api.sendMessage(

  categoryMessage,

  threadID,

  (err, info) => {

    if (
      err ||
      !info ||
      !info.messageID
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