const fs = require("fs-extra");

module.exports.config = {
name: "حيوان",
version: "1.0.0",
credits: "أبو هريرة",
description: "نظام الحيوانات الأليفة",
commandCategory: "Fun",
hasPermssion: 0,
usages: "حيوان",
cooldowns: 3
};

// ============================================================
// الحيوانات المتاحة
// ============================================================

const PETS = [
{
id: 1,
type: "قطة",
name: "قطة",
price: 0,
emoji: "🐱"
},
{
id: 2,
type: "كلب",
name: "كلب",
price: 0,
emoji: "🐶"
},
{
id: 3,
type: "أرنب",
name: "أرنب",
price: 0,
emoji: "🐰"
},
{
id: 4,
type: "هامستر",
name: "هامستر",
price: 0,
emoji: "🐹"
},
{
id: 5,
type: "ثعلب",
name: "ثعلب",
price: 500,
emoji: "🦊"
},
{
id: 6,
type: "ذئب",
name: "ذئب",
price: 1000,
emoji: "🐺"
},
{
id: 7,
type: "باندا",
name: "باندا",
price: 1500,
emoji: "🐼"
},
{
id: 8,
type: "نمر",
name: "نمر",
price: 2500,
emoji: "🐯"
},
{
id: 9,
type: "أسد",
name: "أسد",
price: 3500,
emoji: "🦁"
},
{
id: 10,
type: "دب",
name: "دب",
price: 4000,
emoji: "🐻"
},
{
id: 11,
type: "غزال",
name: "غزال",
price: 5000,
emoji: "🦌"
},
{
id: 12,
type: "نسر",
name: "نسر",
price: 6000,
emoji: "🦅"
},
{
id: 13,
type: "تنين",
name: "تنين",
price: 10000,
emoji: "🐉"
}
];

// ============================================================
// الحالات
// ============================================================

const STATES = [
"سعيد",
"حزين",
"غاضب",
"جائع",
"متعب",
"طبيعي"
];

// ============================================================
// جلب مودل الحيوانات
// ============================================================

function getPetsModel(models) {

try {

if (
  models &&
  typeof models.use === "function"
) {

  const Pets =
    models.use("Pets");

  if (Pets) {
    return Pets;
  }
}

} catch (error) {

console.error(
  "[PET MODEL USE ERROR]",
  error
);

}

try {

if (
  models &&
  models.Pets
) {

  return models.Pets;

}

} catch (error) {}

try {

if (
  global.models &&
  global.models.Pets
) {

  return global.models.Pets;

}

} catch (error) {}

return null;
}

// ============================================================
// رسالة القائمة
// ============================================================

function getPetList() {

let text =
"⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n";

text +=
"اختر حيوانك الأول بالرد على هذه الرسالة برقم الحيوان\n\n";

for (const pet of PETS) {

const price =
  pet.price === 0
    ? "مجاني"
    : `${pet.price} عملة`;

text +=
  `${pet.id}. ${pet.emoji} ${pet.name} — ${price}\n`;

}

text +=
"\n↪️ رد برقم الحيوان لإنشائه";

return text;
}

// ============================================================
// معلومات الحيوان
// ============================================================

function getPetInfo(pet) {

const found =
PETS.find(
item =>
String(item.type) ===
String(pet.type)
);

const emoji =
found?.emoji || "🐾";

const state =
pet.state ||
"طبيعي";

const xp =
Number(pet.xp || 0);

const level =
Number(pet.level || 1);

const health =
Number(pet.health ?? 100);

const hunger =
Number(pet.hunger ?? 100);

return (
"⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n" +

`${emoji} حيوانك: ${pet.name}\n` +

`النوع: ${pet.type}\n` +

`المستوى: ${level}\n` +

`XP: ${xp}\n` +

`الحالة: ${state}\n` +

`الصحة: ${health}/100\n` +

`الشبع: ${hunger}/100\n\n` +

`يمكنك تطوير حيوانك والعناية به لرفع مستواه.`

);
}

// ============================================================
// الأمر
// ============================================================

module.exports.run = async function ({
api,
event,
models
}) {

const {
threadID,
messageID,
senderID
} = event;

try {

// ========================================================
// تحميل المودل
// ========================================================

const Pets =
  getPetsModel(models);

if (!Pets) {

  console.error(
    "[PET COMMAND] Pets model not found",
    {
      hasModels:
        Boolean(models),

      modelKeys:
        models
          ? Object.keys(models)
          : []
    }
  );

  return api.sendMessage(
    `⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n` +
    `❌ مودل الحيوانات غير محمّل\n\n` +
    `تأكد أن Pets مسجل في نظام قاعدة البيانات.`,
    threadID,
    messageID
  );

}


// ========================================================
// البحث عن حيوان المستخدم
// ========================================================

const pet =
  await Pets.findOne({
    where: {
      userID: String(senderID)
    }
  });


// ========================================================
// لديه حيوان
// ========================================================

if (pet) {

  return api.sendMessage(
    getPetInfo(
      pet.toJSON
        ? pet.toJSON()
        : pet
    ),

    threadID,
    messageID
  );

}


// ========================================================
// ليس لديه حيوان
// ========================================================

const message =
  await new Promise(
    resolve => {

      api.sendMessage(
        getPetList(),

        threadID,

        (error, info) => {

          if (error) {

            console.error(
              "[PET MENU SEND ERROR]",
              error
            );

            resolve(null);
            return;
          }

          resolve(info);

        },

        messageID
      );

    }
  );


if (
  !message ||
  !message.messageID
) {

  return;

}


// ========================================================
// حفظ جلسة الاختيار
// ========================================================

if (
  !global.client.handleReply
) {

  global.client.handleReply = [];

}


global.client.handleReply.push({

  name:
    module.exports.config.name,

  messageID:
    message.messageID,

  author:
    String(senderID),

  type:
    "pet_create"

});

} catch (error) {

console.error(
  "[PET COMMAND ERROR]",
  error
);

return api.sendMessage(
  `⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n` +
  `❌ حدث خطأ أثناء فحص حيوانك.\n\n` +
  `📝 ${error.message}`,

  threadID,
  messageID
);

}

};

// ============================================================
// الرد على القائمة
// ============================================================

module.exports.handleReply = async function ({
api,
event,
handleReply,
models
}) {

const {
threadID,
messageID,
senderID,
body
} = event;

try {

// ========================================================
// التأكد أن الرد لصاحب القائمة
// ========================================================

if (
  handleReply.author &&
  String(handleReply.author) !==
  String(senderID)
) {

  return;

}


// ========================================================
// التحقق من نوع الرد
// ========================================================

if (
  handleReply.type !==
  "pet_create"
) {

  return;

}


// ========================================================
// الرقم
// ========================================================

const number =
  Number(
    String(body || "")
      .trim()
  );


if (
  !Number.isInteger(number)
) {

  return api.sendMessage(
    `⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n` +
    `❌ أرسل رقم الحيوان فقط.`,

    threadID,
    messageID
  );

}


// ========================================================
// البحث عن الحيوان
// ========================================================

const selected =
  PETS.find(
    pet =>
      pet.id === number
  );


if (!selected) {

  return api.sendMessage(
    `⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n` +
    `❌ رقم الحيوان غير صحيح.\n\n` +
    `أرسل رقمًا من 1 إلى ${PETS.length}.`,

    threadID,
    messageID
  );

}


// ========================================================
// مودل الحيوانات
// ========================================================

const Pets =
  getPetsModel(models);


if (!Pets) {

  console.error(
    "[PET REPLY] Pets model not found"
  );

  return api.sendMessage(
    `⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n` +
    `❌ مودل الحيوانات غير محمّل.`,

    threadID,
    messageID
  );

}


// ========================================================
// التأكد مرة أخرى
// ========================================================

const existing =
  await Pets.findOne({
    where: {
      userID: String(senderID)
    }
  });


if (existing) {

  return api.sendMessage(
    `⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n` +
    `❌ لديك حيوان بالفعل.`,

    threadID,
    messageID
  );

}


// ========================================================
// إنشاء الحيوان
// ========================================================

const pet =
  await Pets.create({

    userID:
      String(senderID),

    type:
      selected.type,

    name:
      selected.name,

    level:
      1,

    health:
      100,

    hunger:
      100,

    state:
      "سعيد",

    xp:
      0

  });


// ========================================================
// الرسالة
// ========================================================

return api.sendMessage(

  `⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n` +

  `${selected.emoji} تم إنشاء حيوانك بنجاح\n\n` +

  `الحيوان: ${selected.name}\n` +

  `المستوى: 1\n` +

  `XP: 0\n` +

  `الحالة: سعيد\n` +

  `الصحة: 100/100\n` +

  `الشبع: 100/100`,

  threadID,
  messageID

);

} catch (error) {

console.error(
  "[PET REPLY ERROR]",
  error
);

return api.sendMessage(
  `⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n` +
  `❌ حدث خطأ أثناء إنشاء الحيوان.\n\n` +
  `📝 ${error.message}`,

  threadID,
  messageID
);

}

};