const axios = require("axios");
const fs = require("fs-extra");

module.exports.config = {
name: "اوامر",
version: "13.0.0",
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
"ترفيه",
"الـتـرفـيـه"
]
},

"2": {
id: "admin",
name: "الإدارة",
aliases: [
"الإدارة",
"الادارة",
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
"العاب",
"الألـعـاب"
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
// تنظيف النص
// ============================================================

function normalizeText(text) {

return String(text || "")
.trim()
.toLowerCase()

// إزالة التشكيل
.replace(
  /[\u064B-\u065F\u0670]/g,
  ""
)

// توحيد الهمزات
.replace(/[أإآ]/g, "ا")

// إزالة التطويل
.replace(/ـ/g, "")

// توحيد بعض الحروف
.replace(/ى/g, "ي")

// إزالة المسافات الزائدة
.replace(/\s+/g, " ")

.trim();

}

// ============================================================
// تحويل الأرقام العربية
// ============================================================

function normalizeNumber(text) {

return String(text || "")
.replace(
/[٠-٩]/g,
digit =>
String(
"٠١٢٣٤٥٦٧٨٩".indexOf(
digit
)
)
);
}

// ============================================================
// البحث عن الفئة
// ============================================================

function findCategory(input) {

const normalized =
normalizeText(
normalizeNumber(input)
);

// --------------------------------------------
// البحث بالرقم
// --------------------------------------------

if (
categories[normalized]
) {

return categories[normalized];

}

// --------------------------------------------
// البحث بالاسم
// --------------------------------------------

for (
const key of Object.keys(categories)
) {

const category =
  categories[key];

const names = [
  category.name,
  ...(category.aliases || [])
];

for (
  const name of names
) {

  if (
    normalizeText(name) ===
    normalized
  ) {

    return category;

  }

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
// حذف جلسات المستخدم القديمة
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
// حفظ جلسة المستخدم
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
// تنبيه شخص ليس صاحب القائمة
// ============================================================

function notYourMenu(
api,
event
) {

return api.sendMessage(

`${TOP}
𝗛𝗜𝗡𝗔          〢       تنبيه
${BOTTOM}

⚠️ هذه ليست قائمتك

↳ اكتب اوامر لإظهار قائمة خاصة بك

${TOP}
HINA
${BOTTOM}`,

event.threadID,
event.messageID

);

}

// ============================================================
// اختيار غير صحيح
// ============================================================

function invalidChoice(
api,
event
) {

return api.sendMessage(

`${TOP}
𝗛𝗜𝗡𝗔          〢       تنبيه
${BOTTOM}

⚠️ الاختيار غير صحيح

↳ رد برقم الفئة من ❶ إلى ❼
أو اكتب اسم الفئة

${TOP}
حاول مرة أخرى
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

let imagePath =
  null;

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
    // تنظيف الصورة
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
    // حفظ الجلسة
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
// التحقق من صاحب القائمة
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
    .trim();

if (
  !input
) {

  return;

}

const normalizedInput =
  normalizeText(
    normalizeNumber(input)
  );

// ========================================================
// رجوع
// ========================================================

if (
  normalizedInput === "رجوع" ||
  normalizedInput === "عودة" ||
  normalizedInput === "back"
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
// القائمة ليست الرئيسية
// ========================================================

if (
  handleReply.type !==
  "main"
) {

  return;

}

// ========================================================
// البحث عن الفئة
// ========================================================

const category =
  findCategory(
    input
  );

// ========================================================
// اختيار غير صحيح
// ========================================================

if (
  !category
) {

  return invalidChoice(
    api,
    event
  );

}

// ========================================================
// جلب الأوامر
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