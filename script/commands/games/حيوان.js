const fs = require("fs-extra");

module.exports.config = {
  name: "حيوان",
  version: "2.0.0",
  credits: "أبو هريرة",
  description: "نظام الحيوانات الأليفة",
  commandCategory: "games",
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
    rarity: "عادي",
    power: 5,
    price: 0,
    emoji: "🐱"
  },
  {
    id: 2,
    type: "كلب",
    name: "كلب",
    rarity: "عادي",
    power: 7,
    price: 0,
    emoji: "🐶"
  },
  {
    id: 3,
    type: "أرنب",
    name: "أرنب",
    rarity: "عادي",
    power: 4,
    price: 0,
    emoji: "🐰"
  },
  {
    id: 4,
    type: "هامستر",
    name: "هامستر",
    rarity: "عادي",
    power: 3,
    price: 0,
    emoji: "🐹"
  },
  {
    id: 5,
    type: "فأر",
    name: "فأر",
    rarity: "عادي",
    power: 2,
    price: 0,
    emoji: "🐭"
  },
  {
    id: 6,
    type: "بقرة",
    name: "بقرة",
    rarity: "عادي",
    power: 8,
    price: 0,
    emoji: "🐮"
  },
  {
    id: 7,
    type: "خنزير",
    name: "خنزير",
    rarity: "عادي",
    power: 6,
    price: 0,
    emoji: "🐷"
  },
  {
    id: 8,
    type: "دجاجة",
    name: "دجاجة",
    rarity: "عادي",
    power: 3,
    price: 0,
    emoji: "🐔"
  },

  {
    id: 9,
    type: "بطة",
    name: "بطة",
    rarity: "غير شائع",
    power: 9,
    price: 250,
    emoji: "🦆"
  },
  {
    id: 10,
    type: "ماعز",
    name: "ماعز",
    rarity: "غير شائع",
    power: 11,
    price: 300,
    emoji: "🐐"
  },
  {
    id: 11,
    type: "حصان",
    name: "حصان",
    rarity: "غير شائع",
    power: 14,
    price: 400,
    emoji: "🐴"
  },
  {
    id: 12,
    type: "خروف",
    name: "خروف",
    rarity: "غير شائع",
    power: 10,
    price: 450,
    emoji: "🐑"
  },

  {
    id: 13,
    type: "ثعلب",
    name: "ثعلب",
    rarity: "نادر",
    power: 18,
    price: 700,
    emoji: "🦊"
  },
  {
    id: 14,
    type: "ذئب",
    name: "ذئب",
    rarity: "نادر",
    power: 23,
    price: 1200,
    emoji: "🐺"
  },
  {
    id: 15,
    type: "باندا",
    name: "باندا",
    rarity: "نادر",
    power: 20,
    price: 1500,
    emoji: "🐼"
  },
  {
    id: 16,
    type: "كوالا",
    name: "كوالا",
    rarity: "نادر",
    power: 16,
    price: 1300,
    emoji: "🐨"
  },
  {
    id: 17,
    type: "راكون",
    name: "راكون",
    rarity: "نادر",
    power: 19,
    price: 1400,
    emoji: "🦝"
  },

  {
    id: 18,
    type: "غوريلا",
    name: "غوريلا",
    rarity: "نادر جدًا",
    power: 35,
    price: 2500,
    emoji: "🦍"
  },
  {
    id: 19,
    type: "فهد",
    name: "فهد",
    rarity: "نادر جدًا",
    power: 40,
    price: 3200,
    emoji: "🐆"
  },
  {
    id: 20,
    type: "نمر",
    name: "نمر",
    rarity: "نادر جدًا",
    power: 45,
    price: 4000,
    emoji: "🐯"
  },
  {
    id: 21,
    type: "دب",
    name: "دب",
    rarity: "نادر جدًا",
    power: 48,
    price: 4500,
    emoji: "🐻"
  },

  {
    id: 22,
    type: "أسد",
    name: "أسد",
    rarity: "ملحمي",
    power: 55,
    price: 5500,
    emoji: "🦁"
  },
  {
    id: 23,
    type: "غزال",
    name: "غزال",
    rarity: "ملحمي",
    power: 50,
    price: 5000,
    emoji: "🦌"
  },
  {
    id: 24,
    type: "تمساح",
    name: "تمساح",
    rarity: "ملحمي",
    power: 65,
    price: 6500,
    emoji: "🐊"
  },
  {
    id: 25,
    type: "قرش",
    name: "قرش",
    rarity: "ملحمي",
    power: 70,
    price: 7500,
    emoji: "🦈"
  },

  {
    id: 26,
    type: "نسر",
    name: "نسر",
    rarity: "أسطوري",
    power: 75,
    price: 8500,
    emoji: "🦅"
  },
  {
    id: 27,
    type: "دب قطبي",
    name: "دب قطبي",
    rarity: "أسطوري",
    power: 80,
    price: 9000,
    emoji: "🐻‍❄️"
  },
  {
    id: 28,
    type: "حوت",
    name: "حوت",
    rarity: "أسطوري",
    power: 90,
    price: 12000,
    emoji: "🐋"
  },

  {
    id: 29,
    type: "تنين",
    name: "تنين",
    rarity: "أسطوري نادر",
    power: 120,
    price: 20000,
    emoji: "🐉"
  },
  {
    id: 30,
    type: "كراكن",
    name: "كراكن",
    rarity: "أسطوري نادر",
    power: 150,
    price: 30000,
    emoji: "🐙"
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
      const Pets = models.use("Pets");

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
  } catch {}

  try {
    if (
      global.models &&
      global.models.Pets
    ) {
      return global.models.Pets;
    }
  } catch {}

  return null;
}

// ============================================================
// قائمة الحيوانات
// ============================================================

function getPetList() {
  let text =
    "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n";

  text +=
    "🐾 اختر حيوانك الأول بالرد على الرسالة برقم الحيوان\n\n";

  for (const pet of PETS) {
    const price =
      pet.price === 0
        ? "مجاني"
        : `${pet.price} عملة`;

    text +=
      `${pet.id}. ${pet.emoji} ${pet.name}\n` +
      `   الندرة: ${pet.rarity}\n` +
      `   القوة: ${pet.power}\n` +
      `   السعر: ${price}\n\n`;
  }

  text +=
    "↪️ رد برقم الحيوان لإنشائه";

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

  const rarity =
    pet.rarity ||
    found?.rarity ||
    "عادي";

  const power =
    Number(
      pet.power ??
      found?.power ??
      5
    );

  const level =
    Number(
      pet.level ?? 1
    );

  const exp =
    Number(
      pet.exp ?? 0
    );

  const health =
    Number(
      pet.health ?? 100
    );

  const hunger =
    Number(
      pet.hunger ?? 100
    );

  const status =
    pet.status ||
    "سعيد";

  return (
    "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n" +

    `${emoji} حيوانك: ${pet.name}\n` +

    `النوع: ${pet.type}\n` +

    `الندرة: ${rarity}\n` +

    `القوة: ${power}\n` +

    `المستوى: ${level}\n` +

    `XP: ${exp}\n` +

    `الحالة: ${status}\n` +

    `الصحة: ${health}/100\n` +

    `الشبع: ${hunger}/100`
  );
}

// ============================================================
// الأمر الأساسي
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

    const Pets =
      getPetsModel(models);

    if (!Pets) {
      console.error(
        "[PET COMMAND] Pets model not found"
      );

      return api.sendMessage(
        `⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n` +
        `❌ مودل الحيوانات غير محمّل.\n\n` +
        `تأكد أن Pets مسجل في نظام قاعدة البيانات.`,
        threadID,
        messageID
      );
    }

    // ========================================================
    // البحث عن الحيوان
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
    // لا يملك حيوان
    // ========================================================

    const message =
      await new Promise(resolve => {

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

      });

    if (
      !message ||
      !message.messageID
    ) {
      return;
    }

    // ========================================================
    // حفظ جلسة الرد
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
    // صاحب القائمة
    // ========================================================

    if (
      handleReply.author &&
      String(handleReply.author) !==
      String(senderID)
    ) {
      return;
    }

    if (
      handleReply.type !==
      "pet_create"
    ) {
      return;
    }

    // ========================================================
    // قراءة الرقم
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
    // اختيار الحيوان
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
    // المودل
    // ========================================================

    const Pets =
      getPetsModel(models);

    if (!Pets) {
      return api.sendMessage(
        `⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n` +
        `❌ مودل الحيوانات غير محمّل.`,
        threadID,
        messageID
      );
    }

    // ========================================================
    // التأكد من عدم وجود حيوان
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

    await Pets.create({

      userID:
        String(senderID),

      type:
        selected.type,

      name:
        selected.name,

      rarity:
        selected.rarity,

      power:
        selected.power,

      level:
        1,

      exp:
        0,

      health:
        100,

      hunger:
        100,

      status:
        "سعيد"

    });

    // ========================================================
    // رسالة النجاح
    // ========================================================

    return api.sendMessage(

      `⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n` +

      `${selected.emoji} تم إنشاء حيوانك بنجاح\n\n` +

      `الحيوان: ${selected.name}\n` +

      `الندرة: ${selected.rarity}\n` +

      `القوة: ${selected.power}\n` +

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