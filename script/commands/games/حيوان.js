module.exports.config = {
  name: "حيوان",
  version: "4.0.0",
  credits: "أبو هريرة",
  description: "نظام الحيوانات الأليفة",
  commandCategory: "Games",
  hasPermssion: 0,
  usages: "حيوان | حيوان قائمة",
  cooldowns: 3
};

// ============================================================
// الحيوانات
// ============================================================

const PETS = [

  // ==================== شائع ====================

  {
    id: 1,
    type: "قطة",
    name: "قطة",
    price: 0,
    rarity: "شائع",
    power: 10,
    emoji: "🐱"
  },

  {
    id: 2,
    type: "كلب",
    name: "كلب",
    price: 0,
    rarity: "شائع",
    power: 12,
    emoji: "🐶"
  },

  {
    id: 3,
    type: "أرنب",
    name: "أرنب",
    price: 0,
    rarity: "شائع",
    power: 8,
    emoji: "🐰"
  },

  {
    id: 4,
    type: "هامستر",
    name: "هامستر",
    price: 0,
    rarity: "شائع",
    power: 7,
    emoji: "🐹"
  },
  
  {
    id: 5,
    type: "سنجاب",
    name: "سنجاب",
    price: 0,
    rarity: "شائع",
    power: 9,
    emoji: "🐿️"
  },

  // ==================== غير شائع ====================

  {
    id: 5,
    type: "ثعلب",
    name: "ثعلب",
    price: 500,
    rarity: "غير شائع",
    power: 25,
    emoji: "🦊"
  },

  {
    id: 6,
    type: "باندا",
    name: "باندا",
    price: 1500,
    rarity: "غير شائع",
    power: 30,
    emoji: "🐼"
  },

  {
    id: 7,
    type: "ببغاء",
    name: "ببغاء",
    price: 2500,
    rarity: "غير شائع",
    power: 32,
    emoji: "🦜"
  },

  {
    id: 8,
    type: "سلحفاة",
    name: "سلحفاة",
    price: 1800,
    rarity: "غير شائع",
    power: 28,
    emoji: "🐢"
  },

  {
    id: 9,
    type: "بطريق",
    name: "بطريق",
    price: 2200,
    rarity: "غير شائع",
    power: 25,
    emoji: "🐧"
  },

  {
    id: 10,
    type: "كوالا",
    name: "كوالا",
    price: 2800,
    rarity: "غير شائع",
    power: 27,
    emoji: "🐨"
  },

  // ==================== نادر ====================

  {
    id: 11,
    type: "ذئب",
    name: "ذئب",
    price: 1000,
    rarity: "نادر",
    power: 35,
    emoji: "🐺"
  },

  {
    id: 12,
    type: "حصان",
    name: "حصان",
    price: 3000,
    rarity: "نادر",
    power: 55,
    emoji: "🐴"
  },

  {
    id: 13,
    type: "نمر",
    name: "نمر",
    price: 2500,
    rarity: "نادر",
    power: 50,
    emoji: "🐯"
  },

  {
    id: 14,
    type: "أسد",
    name: "أسد",
    price: 3500,
    rarity: "نادر",
    power: 60,
    emoji: "🦁"
  },

  {
    id: 15,
    type: "دب",
    name: "دب",
    price: 4000,
    rarity: "نادر",
    power: 65,
    emoji: "🐻"
  },

  // ==================== ملحمي ====================

  {
    id: 16,
    type: "غزال",
    name: "غزال",
    price: 5000,
    rarity: "ملحمي",
    power: 45,
    emoji: "🦌"
  },

  {
    id: 17,
    type: "نسر",
    name: "نسر",
    price: 6000,
    rarity: "ملحمي",
    power: 70,
    emoji: "🦅"
  },

  {
    id: 18,
    type: "بومة",
    name: "بومة",
    price: 4500,
    rarity: "ملحمي",
    power: 58,
    emoji: "🦉"
  },

  {
    id: 19,
    type: "غوريلا",
    name: "غوريلا",
    price: 7000,
    rarity: "ملحمي",
    power: 85,
    emoji: "🦍"
  },

  {
    id: 20,
    type: "فهد",
    name: "فهد",
    price: 7500,
    rarity: "ملحمي",
    power: 88,
    emoji: "🐆"
  },

  {
    id: 21,
    type: "تمساح",
    name: "تمساح",
    price: 6500,
    rarity: "ملحمي",
    power: 78,
    emoji: "🐊"
  },

  {
    id: 22,
    type: "قرش",
    name: "قرش",
    price: 8000,
    rarity: "ملحمي",
    power: 82,
    emoji: "🦈"
  },

  {
    id: 23,
    type: "حوت",
    name: "حوت",
    price: 9000,
    rarity: "ملحمي",
    power: 90,
    emoji: "🐋"
  },

  {
    id: 24,
    type: "زرافة",
    name: "زرافة",
    price: 8500,
    rarity: "ملحمي",
    power: 65,
    emoji: "🦒"
  },

  {
    id: 25,
    type: "شمبانزي",
    name: "شمبانزي",
    price: 5500,
    rarity: "ملحمي",
    power: 55,
    emoji: "🐒"
  },

  // ==================== أسطوري ====================

  {
    id: 26,
    type: "تنين",
    name: "تنين",
    price: 10000,
    rarity: "أسطوري",
    power: 100,
    emoji: "🐉"
  },

  {
    id: 27,
    type: "وحيد القرن",
    name: "وحيد القرن",
    price: 11000,
    rarity: "أسطوري",
    power: 105,
    emoji: "🦏"
  },

  {
    id: 28,
    type: "فيل",
    name: "فيل",
    price: 12000,
    rarity: "أسطوري",
    power: 110,
    emoji: "🐘"
  },

  {
    id: 29,
    type: "صقر",
    name: "صقر",
    price: 9500,
    rarity: "أسطوري",
    power: 95,
    emoji: "🦅"
  },

  // ==================== خرافي ====================

  {
    id: 30,
    type: "يونيكورن",
    name: "يونيكورن",
    price: 18000,
    rarity: "خرافي",
    power: 140,
    emoji: "🦄"
  },

  {
    id: 31,
    type: "وحش أسطوري",
    name: "وحش أسطوري",
    price: 20000,
    rarity: "خرافي",
    power: 150,
    emoji: "👹"
  }
];

// ============================================================
// ترتيب الندرة
// ============================================================

const RARITY_ORDER = [
  "شائع",
  "غير شائع",
  "نادر",
  "ملحمي",
  "أسطوري",
  "خرافي"
];

// ============================================================
// جلب Pets
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
// جلب العملات
// ============================================================

function getCurrenciesModel(models) {

  try {

    if (
      models &&
      typeof models.use === "function"
    ) {

      const Currencies =
        models.use("Currencies");

      if (Currencies) {
        return Currencies;
      }
    }

  } catch (error) {

    console.error(
      "[CURRENCY MODEL USE ERROR]",
      error
    );
  }

  try {

    if (
      models &&
      models.Currencies
    ) {

      return models.Currencies;
    }

  } catch {}

  try {

    if (
      global.models &&
      global.models.Currencies
    ) {

      return global.models.Currencies;
    }

  } catch {}

  return null;
}

// ============================================================
// البحث عن حيوان
// ============================================================

function getPetByID(id) {

  return PETS.find(
    pet =>
      pet.id === Number(id)
  );
}

function getPetByType(type) {

  return PETS.find(
    pet =>
      String(pet.type) ===
      String(type)
  );
}

// ============================================================
// Reply
// ============================================================

function addReply(data) {

  if (
    !global.client.handleReply
  ) {

    global.client.handleReply = [];
  }

  global.client.handleReply.push(data);
}

function removeReply(handleReply) {

  try {

    if (
      !global.client.handleReply
    ) {
      return;
    }

    const index =
      global.client.handleReply.indexOf(
        handleReply
      );

    if (index !== -1) {

      global.client.handleReply.splice(
        index,
        1
      );
    }

  } catch {}
}

// ============================================================
// القائمة المجانية
// ============================================================

function getFreePetsList() {

  let text =
    "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n";

  text +=
    "اختر حيوانك الأول\n" +
    "رد على هذه الرسالة برقم الحيوان\n\n";

  const freePets =
    PETS.filter(
      pet =>
        pet.price === 0
    );

  for (
    const pet of freePets
  ) {

    text +=
      `${pet.id}. ${pet.emoji} ${pet.name}\n` +
      `   الندرة: ${pet.rarity} | القوة: ${pet.power}\n`;
  }

  text +=
    "\n↪️ رد برقم الحيوان لإنشائه\n" +
    "لرؤية الحيوانات الأخرى استخدم: حيوان قائمة";

  return text;
}

// ============================================================
// قائمة الحيوانات المدفوعة
// ============================================================

function getShopList() {

  let text =
    "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n";

  text +=
    "🛒 قائمة الحيوانات المتاحة للشراء\n\n";

  for (
    const rarity of RARITY_ORDER
  ) {

    const pets =
      PETS.filter(
        pet =>
          pet.price > 0 &&
          pet.rarity === rarity
      );

    if (!pets.length) {
      continue;
    }

    text +=
      `【 ${rarity} 】\n\n`;

    for (
      const pet of pets
    ) {

      text +=
        `${pet.id}. ${pet.emoji} ${pet.name}\n` +
        `   القوة: ${pet.power} | السعر: ${pet.price} عملة\n`;
    }

    text += "\n";
  }

  text +=
    "↪️ رد برقم الحيوان لبدء الشراء";

  return text;
}

// ============================================================
// معلومات الحيوان
// ============================================================

function getPetInfo(pet) {

  const found =
    getPetByType(
      pet.type
    );

  const emoji =
    found?.emoji ||
    "🐾";

  const rarity =
    found?.rarity ||
    "غير معروف";

  const power =
    found?.power ||
    0;

  const level =
    Number(
      pet.level || 1
    );

  const exp =
    Number(
      pet.exp || 0
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
    "طبيعي";

  return (

    "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n" +

    `${emoji} ${pet.name}\n\n` +

    `النوع: ${pet.type}\n` +
    `الندرة: ${rarity}\n` +
    `القوة: ${power}\n` +
    `المستوى: ${level}\n` +
    `XP: ${exp}\n` +
    `الحالة: ${status}\n` +
    `الصحة: ${health}/100\n` +
    `الشبع: ${hunger}/100\n\n` +

    "اختر العملية بالرد برقم:\n\n" +

    "1. بيع الحيوان\n" +
    "2. إطعام الحيوان\n" +
    "3. تدريب الحيوان"

  );
}

// ============================================================
// إنشاء الحيوان
// ============================================================

async function createPet(
  Pets,
  senderID,
  selected
) {

  const existing =
    await Pets.findOne({
      where: {
        userID:
          String(senderID)
      }
    });

  if (existing) {

    return {
      success: false,
      message:
        "❌ لديك حيوان بالفعل."
    };
  }

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

    status:
      "سعيد",

    exp:
      0
  });

  return {

    success: true,

    message:

      "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n" +

      `${selected.emoji} تم إنشاء حيوانك بنجاح\n\n` +

      `الحيوان: ${selected.name}\n` +
      `الندرة: ${selected.rarity}\n` +
      `القوة: ${selected.power}\n` +
      `المستوى: 1\n` +
      `XP: 0\n` +
      `الحالة: سعيد`
  };
}

// ============================================================
// حساب سعر البيع
// القوة تؤثر على السعر
// ============================================================

function getSellPrice(pet) {

  const found =
    getPetByType(
      pet.type
    );

  if (!found) {
    return 0;
  }

  const level =
    Number(
      pet.level || 1
    );

  const power =
    Number(
      found.power || 0
    );

  const basePrice =
    Number(
      found.price || 0
    );

  // نصف السعر الأساسي
  const halfPrice =
    Math.floor(
      basePrice / 2
    );

  // زيادة حسب القوة
  const powerBonus =
    power * 10;

  // زيادة حسب المستوى
  const levelBonus =
    Math.max(
      0,
      level - 1
    ) * 100;

  return (
    halfPrice +
    powerBonus +
    levelBonus
  );
}

// ============================================================
// إرسال رسالة مع Reply
// ============================================================

function sendReply(
  api,
  message,
  threadID,
  messageID
) {

  return new Promise(
    resolve => {

      api.sendMessage(
        message,
        threadID,
        (error, info) => {

          if (error) {

            console.error(
              "[PET SEND ERROR]",
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
}

// ============================================================
// الأمر الرئيسي
// ============================================================

module.exports.run =
async function ({
  api,
  event,
  models,
  args
}) {

  const {
    threadID,
    messageID,
    senderID
  } = event;

  try {

    const Pets =
      getPetsModel(
        models
      );

    const Currencies =
      getCurrenciesModel(
        models
      );

    if (!Pets) {

      return api.sendMessage(

        "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n" +

        "❌ مودل الحيوانات غير محمّل.\n\n" +

        "تأكد أن Pets موجود داخل models ومسجل في نظام قاعدة البيانات.",

        threadID,
        messageID
      );
    }

    if (!Currencies) {

      return api.sendMessage(

        "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n" +

        "❌ مودل العملات غير محمّل.",

        threadID,
        messageID
      );
    }

    const subCommand =
      Array.isArray(args)
        ? args
            .join(" ")
            .trim()
            .toLowerCase()
        : "";

    // ========================================================
    // حيوان قائمة
    // ========================================================

    if (
      subCommand === "قائمة" ||
      subCommand === "list" ||
      subCommand === "shop"
    ) {

      const sent =
        await sendReply(
          api,
          getShopList(),
          threadID,
          messageID
        );

      if (
        sent &&
        sent.messageID
      ) {

        addReply({

          name:
            module.exports.config.name,

          messageID:
            sent.messageID,

          author:
            String(senderID),

          type:
            "pet_select"
        });
      }

      return;
    }

    // ========================================================
    // البحث عن حيوان المستخدم
    // ========================================================

    const pet =
      await Pets.findOne({

        where: {
          userID:
            String(senderID)
        }

      });

    // ========================================================
    // لديه حيوان
    // ========================================================

    if (pet) {

      const sent =
        await sendReply(
          api,
          getPetInfo(
            pet.toJSON
              ? pet.toJSON()
              : pet
          ),
          threadID,
          messageID
        );

      if (
        sent &&
        sent.messageID
      ) {

        addReply({

          name:
            module.exports.config.name,

          messageID:
            sent.messageID,

          author:
            String(senderID),

          type:
            "pet_actions"
        });
      }

      return;
    }

    // ========================================================
    // لا يملك حيوان
    // ========================================================

    const sent =
      await sendReply(
        api,
        getFreePetsList(),
        threadID,
        messageID
      );

    if (
      sent &&
      sent.messageID
    ) {

      addReply({

        name:
          module.exports.config.name,

        messageID:
          sent.messageID,

        author:
          String(senderID),

        type:
          "pet_select"
      });
    }

  } catch (error) {

    console.error(
      "[PET COMMAND ERROR]",
      error
    );

    return api.sendMessage(

      "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n" +

      "❌ حدث خطأ أثناء تنفيذ الأمر.\n\n" +

      `📝 ${error.message}`,

      threadID,
      messageID
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
  handleReply,
  models
}) {

  const {
    threadID,
    messageID,
    senderID,
    body = ""
  } = event;

  try {

    // ========================================================
    // التأكد من صاحب القائمة
    // ========================================================

    if (
      handleReply.author &&
      String(handleReply.author) !==
      String(senderID)
    ) {

      return;
    }

    const Pets =
      getPetsModel(
        models
      );

    const Currencies =
      getCurrenciesModel(
        models
      );

    if (!Pets) {

      return api.sendMessage(
        "❌ مودل الحيوانات غير محمّل.",
        threadID,
        messageID
      );
    }

    if (!Currencies) {

      return api.sendMessage(
        "❌ مودل العملات غير محمّل.",
        threadID,
        messageID
      );
    }

    const input =
      String(body)
        .trim();

    // ========================================================
    // اختيار حيوان
    // ========================================================

    if (
      handleReply.type ===
      "pet_select"
    ) {

      const number =
        Number(input);

      if (
        !Number.isInteger(number)
      ) {

        return api.sendMessage(
          "❌ أرسل رقم الحيوان فقط.",
          threadID,
          messageID
        );
      }

      const selected =
        getPetByID(
          number
        );

      if (!selected) {

        return api.sendMessage(

          "❌ رقم الحيوان غير صحيح.\n\n" +

          `اختر رقمًا من 1 إلى ${PETS.length}.`,

          threadID,
          messageID
        );
      }

      // ------------------------------------------------------
      // التأكد من عدم وجود حيوان
      // ------------------------------------------------------

      const existing =
        await Pets.findOne({

          where: {
            userID:
              String(senderID)
          }

        });

      if (existing) {

        removeReply(
          handleReply
        );

        return api.sendMessage(
          "❌ لديك حيوان بالفعل.",
          threadID,
          messageID
        );
      }

      // ------------------------------------------------------
      // الحيوان المجاني
      // ------------------------------------------------------

      if (
        selected.price === 0
      ) {

        const result =
          await createPet(
            Pets,
            senderID,
            selected
          );

        removeReply(
          handleReply
        );

        return api.sendMessage(
          result.message,
          threadID,
          messageID
        );
      }

      // ------------------------------------------------------
      // الحيوان المدفوع
      // ------------------------------------------------------

      const sent =
        await sendReply(

          api,

          "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n" +

          `${selected.emoji} ${selected.name}\n\n` +

          `الندرة: ${selected.rarity}\n` +
          `القوة: ${selected.power}\n` +
          `السعر: ${selected.price} عملة\n\n` +

          "هل تريد شراء هذا الحيوان؟\n\n" +

          "↪️ نعم\n" +
          "↪️ لا",

          threadID,
          messageID
        );

      if (
        sent &&
        sent.messageID
      ) {

        removeReply(
          handleReply
        );

        addReply({

          name:
            module.exports.config.name,

          messageID:
            sent.messageID,

          author:
            String(senderID),

          type:
            "pet_purchase",

          petID:
            selected.id
        });
      }

      return;
    }

    // ========================================================
    // تأكيد الشراء
    // ========================================================

    if (
      handleReply.type ===
      "pet_purchase"
    ) {

      const answer =
        input.toLowerCase();

      if (
        answer === "لا" ||
        answer === "الغاء" ||
        answer === "إلغاء"
      ) {

        removeReply(
          handleReply
        );

        return api.sendMessage(
          "تم إلغاء عملية الشراء.",
          threadID,
          messageID
        );
      }

      if (
        answer !== "نعم"
      ) {

        return api.sendMessage(
          "↪️ رد بـ نعم للشراء أو لا للإلغاء.",
          threadID,
          messageID
        );
      }

      const selected =
        getPetByID(
          handleReply.petID
        );

      if (!selected) {

        removeReply(
          handleReply
        );

        return api.sendMessage(
          "❌ الحيوان غير موجود.",
          threadID,
          messageID
        );
      }

      // ------------------------------------------------------
      // التأكد من عدم امتلاك حيوان
      // ------------------------------------------------------

      const existing =
        await Pets.findOne({

          where: {
            userID:
              String(senderID)
          }

        });

      if (existing) {

        removeReply(
          handleReply
        );

        return api.sendMessage(
          "❌ لديك حيوان بالفعل.",
          threadID,
          messageID
        );
      }

      // ------------------------------------------------------
      // جلب الحساب
      // ------------------------------------------------------

      let currency =
        await Currencies.findOne({

          where: {
            userID:
              String(senderID)
          }

        });

      if (!currency) {

        return api.sendMessage(

          "❌ لم يتم العثور على حساب العملات الخاص بك.",

          threadID,
          messageID
        );
      }

      const money =
        Number(
          currency.money || 0
        );

      if (
        money <
        selected.price
      ) {

        return api.sendMessage(

          "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n" +

          "❌ لا تملك عملات كافية.\n\n" +

          `السعر: ${selected.price}\n` +
          `رصيدك: ${money}\n` +
          `ينقصك: ${selected.price - money}`,

          threadID,
          messageID
        );
      }

      // ------------------------------------------------------
      // خصم السعر
      // ------------------------------------------------------

      await currency.update({

        money:
          money -
          selected.price
      });

      try {

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

          status:
            "سعيد",

          exp:
            0
        });

      } catch (error) {

        // إرجاع المال إذا فشل إنشاء الحيوان

        try {

          await currency.update({
            money
          });

        } catch {}

        throw error;
      }

      removeReply(
        handleReply
      );

      return api.sendMessage(

        "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n" +

        `${selected.emoji} تم شراء حيوانك بنجاح\n\n` +

        `الحيوان: ${selected.name}\n` +
        `الندرة: ${selected.rarity}\n` +
        `القوة: ${selected.power}\n` +
        `السعر: ${selected.price} عملة\n` +
        `المتبقي: ${money - selected.price} عملة\n\n` +

        "المستوى: 1\n" +
        "XP: 0\n" +
        "الحالة: سعيد",

        threadID,
        messageID
      );
    }

    // ========================================================
    // إجراءات الحيوان
    // ========================================================

    if (
      handleReply.type ===
      "pet_actions"
    ) {

      const choice =
        Number(input);

      const pet =
        await Pets.findOne({

          where: {
            userID:
              String(senderID)
          }

        });

      if (!pet) {

        removeReply(
          handleReply
        );

        return api.sendMessage(
          "❌ لا تملك حيوانًا.",
          threadID,
          messageID
        );
      }

      // ======================================================
      // بيع
      // ======================================================

      if (
        choice === 1
      ) {

        const data =
          pet.toJSON
            ? pet.toJSON()
            : pet;

        const sellPrice =
          getSellPrice(
            data
          );

        const found =
          getPetByType(
            data.type
          );

        const sent =
          await sendReply(

            api,

            "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n" +

            `${found?.emoji || "🐾"} ${data.name}\n\n` +

            `القوة: ${found?.power || 0}\n` +
            `المستوى: ${data.level || 1}\n\n` +

            `قيمة البيع: ${sellPrice} عملة\n\n` +

            "هل تريد بيع حيوانك؟\n\n" +

            "↪️ نعم\n" +
            "↪️ لا",

            threadID,
            messageID
          );

        if (
          sent &&
          sent.messageID
        ) {

          removeReply(
            handleReply
          );

          addReply({

            name:
              module.exports.config.name,

            messageID:
              sent.messageID,

            author:
              String(senderID),

            type:
              "pet_sell_confirm"
          });
        }

        return;
      }

      // ======================================================
      // إطعام
      // ======================================================

      if (
        choice === 2
      ) {

        const hunger =
          Number(
            pet.hunger ?? 100
          );

        const newHunger =
          Math.min(
            100,
            hunger + 20
          );

        await pet.update({

          hunger:
            newHunger,

          status:
            newHunger >= 80
              ? "سعيد"
              : newHunger >= 40
                ? "طبيعي"
                : "جائع"
        });

        removeReply(
          handleReply
        );

        return api.sendMessage(

          "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n" +

          `تم إطعام ${pet.name}\n\n` +

          `الشبع: ${newHunger}/100\n` +

          `الحالة: ${
            newHunger >= 80
              ? "سعيد"
              : newHunger >= 40
                ? "طبيعي"
                : "جائع"
          }`,

          threadID,
          messageID
        );
      }

      // ======================================================
      // تدريب
      // ======================================================

      if (
        choice === 3
      ) {

        const currentExp =
          Number(
            pet.exp || 0
          );

        const currentLevel =
          Number(
            pet.level || 1
          );

        const gainedExp =
          20;

        const totalExp =
          currentExp +
          gainedExp;

        const requiredExp =
          currentLevel *
          100;

        let newLevel =
          currentLevel;

        let newExp =
          totalExp;

        if (
          totalExp >=
          requiredExp
        ) {

          newLevel =
            currentLevel + 1;

          newExp =
            totalExp -
            requiredExp;
        }

        await pet.update({

          exp:
            newExp,

          level:
            newLevel,

          status:
            "سعيد"
        });

        removeReply(
          handleReply
        );

        let message =

          "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n" +

          `تم تدريب ${pet.name}\n\n` +

          `+${gainedExp} XP\n` +
          `XP: ${newExp}\n` +
          `المستوى: ${newLevel}`;

        if (
          newLevel >
          currentLevel
        ) {

          message +=
            "\n\nارتفع مستوى حيوانك!";
        }

        return api.sendMessage(
          message,
          threadID,
          messageID
        );
      }

      return api.sendMessage(

        "❌ الاختيار غير صحيح.\n\n" +

        "1. بيع\n" +
        "2. إطعام\n" +
        "3. تدريب",

        threadID,
        messageID
      );
    }

    // ========================================================
    // تأكيد البيع
    // ========================================================

    if (
      handleReply.type ===
      "pet_sell_confirm"
    ) {

      const answer =
        input.toLowerCase();

      if (
        answer === "لا" ||
        answer === "الغاء" ||
        answer === "إلغاء"
      ) {

        removeReply(
          handleReply
        );

        return api.sendMessage(
          "تم إلغاء عملية البيع.",
          threadID,
          messageID
        );
      }

      if (
        answer !== "نعم"
      ) {

        return api.sendMessage(
          "↪️ رد بـ نعم للبيع أو لا للإلغاء.",
          threadID,
          messageID
        );
      }

      const pet =
        await Pets.findOne({

          where: {
            userID:
              String(senderID)
          }

        });

      if (!pet) {

        removeReply(
          handleReply
        );

        return api.sendMessage(
          "❌ لا تملك حيوانًا.",
          threadID,
          messageID
        );
      }

      const data =
        pet.toJSON
          ? pet.toJSON()
          : pet;

      const sellPrice =
        getSellPrice(
          data
        );

      let currency =
        await Currencies.findOne({

          where: {
            userID:
              String(senderID)
          }

        });

      if (!currency) {

        removeReply(
          handleReply
        );

        return api.sendMessage(
          "❌ لم يتم العثور على حساب العملات.",
          threadID,
          messageID
        );
      }

      const money =
        Number(
          currency.money || 0
        );

      await currency.update({

        money:
          money +
          sellPrice
      });

      const petName =
        pet.name;

      await pet.destroy();

      removeReply(
        handleReply
      );

      return api.sendMessage(

        "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n" +

        `تم بيع ${petName} بنجاح\n\n` +

        `قيمة البيع: ${sellPrice} عملة\n` +
        `رصيدك الجديد: ${money + sellPrice} عملة`,

        threadID,
        messageID
      );
    }

  } catch (error) {

    console.error(
      "[PET REPLY ERROR]",
      error
    );

    return api.sendMessage(

      "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n" +

      "❌ حدث خطأ أثناء تنفيذ العملية.\n\n" +

      `📝 ${error.message}`,

      threadID,
      messageID
    );
  }
};