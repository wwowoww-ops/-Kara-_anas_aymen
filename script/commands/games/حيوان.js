module.exports.config = {
  name: "حيوان",
  version: "11.0.0",
  credits: "أبو هريرة",
  description: "نظام الحيوانات الأليفة والعملات والمتجر والسرقة والمتصدرين",
  commandCategory: "Games",
  hasPermssion: 0,
  usages: "حيوان | حيوان قائمة | حيوان متجر | حيوان رصيد | حيوان عمل | حيوان يومي | حيوان تصدر | حيوان سرقة",
  cooldowns: 3
};

// ============================================================
// الإعدادات
// ============================================================

const TRAIN_COOLDOWN = 30 * 60 * 1000;
const WORK_COOLDOWN = 30 * 60 * 1000;
const DAILY_COOLDOWN = 24 * 60 * 60 * 1000;
const STEAL_COOLDOWN = 60 * 60 * 1000;

const TRAIN_XP = 20;
const POWER_PER_LEVEL = 5;

const STEAL_SUCCESS_CHANCE = 0.55;
const STEAL_PERCENT_MIN = 0.10;
const STEAL_PERCENT_MAX = 0.25;
const STEAL_FAIL_LOSS = 100;

// ============================================================
// الحيوانات
// ============================================================

const PETS = [
  { id: 1, type: "قطة", name: "قطة", price: 0, rarity: "شائع", power: 10, emoji: "🐱" },
  { id: 2, type: "كلب", name: "كلب", price: 0, rarity: "شائع", power: 12, emoji: "🐶" },
  { id: 3, type: "أرنب", name: "أرنب", price: 0, rarity: "شائع", power: 8, emoji: "🐰" },
  { id: 4, type: "هامستر", name: "هامستر", price: 0, rarity: "شائع", power: 7, emoji: "🐹" },
  { id: 5, type: "سنجاب", name: "سنجاب", price: 0, rarity: "شائع", power: 9, emoji: "🐿️" },
  { id: 6, type: "فراشة", name: "فراشة", price: 0, rarity: "شائع", power: 6, emoji: "🦋" },
  { id: 7, type: "حلزون", name: "حلزون", price: 0, rarity: "شائع", power: 5, emoji: "🐌" },
  { id: 8, type: "سمكة", name: "سمكة", price: 0, rarity: "شائع", power: 7, emoji: "🐟" },

  { id: 9, type: "ثعلب", name: "ثعلب", price: 500, rarity: "غير شائع", power: 25, emoji: "🦊" },
  { id: 10, type: "باندا", name: "باندا", price: 1500, rarity: "غير شائع", power: 30, emoji: "🐼" },
  { id: 11, type: "ببغاء", name: "ببغاء", price: 2500, rarity: "غير شائع", power: 32, emoji: "🦜" },
  { id: 12, type: "سلحفاة", name: "سلحفاة", price: 1800, rarity: "غير شائع", power: 28, emoji: "🐢" },
  { id: 13, type: "بطريق", name: "بطريق", price: 2200, rarity: "غير شائع", power: 25, emoji: "🐧" },
  { id: 14, type: "كوالا", name: "كوالا", price: 2800, rarity: "غير شائع", power: 27, emoji: "🐨" },
  { id: 15, type: "غراب", name: "غراب", price: 3000, rarity: "غير شائع", power: 35, emoji: "🐦‍⬛" },

  { id: 16, type: "ذئب", name: "ذئب", price: 4000, rarity: "نادر", power: 35, emoji: "🐺" },
  { id: 17, type: "حصان", name: "حصان", price: 5000, rarity: "نادر", power: 55, emoji: "🐴" },
  { id: 18, type: "نمر", name: "نمر", price: 6000, rarity: "نادر", power: 50, emoji: "🐯" },
  { id: 19, type: "أسد", name: "أسد", price: 7000, rarity: "نادر", power: 60, emoji: "🦁" },
  { id: 20, type: "دب", name: "دب", price: 7500, rarity: "نادر", power: 65, emoji: "🐻" },

  { id: 21, type: "غزال", name: "غزال", price: 8000, rarity: "ملحمي", power: 45, emoji: "🦌" },
  { id: 22, type: "نسر", name: "نسر", price: 9000, rarity: "ملحمي", power: 70, emoji: "🦅" },
  { id: 23, type: "بومة", name: "بومة", price: 9500, rarity: "ملحمي", power: 58, emoji: "🦉" },
  { id: 24, type: "غوريلا", name: "غوريلا", price: 10000, rarity: "ملحمي", power: 85, emoji: "🦍" },
  { id: 25, type: "فهد", name: "فهد", price: 11000, rarity: "ملحمي", power: 88, emoji: "🐆" },
  { id: 26, type: "تمساح", name: "تمساح", price: 10500, rarity: "ملحمي", power: 78, emoji: "🐊" },
  { id: 27, type: "قرش", name: "قرش", price: 12000, rarity: "ملحمي", power: 82, emoji: "🦈" },
  { id: 28, type: "حوت", name: "حوت", price: 13000, rarity: "ملحمي", power: 90, emoji: "🐋" },
  { id: 29, type: "زرافة", name: "زرافة", price: 11500, rarity: "ملحمي", power: 65, emoji: "🦒" },
  { id: 30, type: "شمبانزي", name: "شمبانزي", price: 8500, rarity: "ملحمي", power: 55, emoji: "🐒" },

  { id: 31, type: "وحيد القرن", name: "وحيد القرن", price: 15000, rarity: "أسطوري", power: 105, emoji: "🦏" },
  { id: 32, type: "فيل", name: "فيل", price: 16000, rarity: "أسطوري", power: 110, emoji: "🐘" },
  { id: 33, type: "صقر", name: "صقر", price: 14000, rarity: "أسطوري", power: 95, emoji: "🦅" },
  { id: 34, type: "وحش أسطوري", name: "وحش أسطوري", price: 20000, rarity: "أسطوري", power: 150, emoji: "👹" },

  { id: 35, type: "تنين", name: "تنين", price: 30000, rarity: "خرافي", power: 150, emoji: "🐉" },
  { id: 36, type: "يونيكورن", name: "يونيكورن", price: 25000, rarity: "خرافي", power: 140, emoji: "🦄" },
  { id: 37, type: "كراكن", name: "كراكن", price: 40000, rarity: "خرافي", power: 180, emoji: "🐙" }
];

const RARITY_ORDER = [
  "شائع",
  "غير شائع",
  "نادر",
  "ملحمي",
  "أسطوري",
  "خرافي"
];

// ============================================================
// الموديلات
// ============================================================

function getModel(models, name) {
  try {
    if (models && typeof models.use === "function") {
      const model = models.use(name);
      if (model) return model;
    }
  } catch (e) {
    console.error(`[PET MODEL ERROR] ${name}`, e);
  }

  if (models && models[name]) return models[name];

  if (global.models && global.models[name]) {
    return global.models[name];
  }

  return null;
}

// ============================================================
// الردود
// ============================================================

function addReply(data) {
  if (!global.client.handleReply) {
    global.client.handleReply = [];
  }

  global.client.handleReply.push(data);
}

function removeReply(handleReply) {
  try {
    if (!Array.isArray(global.client.handleReply)) return;

    const index =
      global.client.handleReply.indexOf(handleReply);

    if (index !== -1) {
      global.client.handleReply.splice(index, 1);
    }
  } catch {}
}

function sendReply(api, message, threadID, messageID) {
  return new Promise(resolve => {
    api.sendMessage(
      message,
      threadID,
      (error, info) => {
        if (error) {
          console.error("[PET SEND ERROR]", error);
          return resolve(null);
        }

        resolve(info);
      },
      messageID
    );
  });
}

// ============================================================
// البحث عن الحيوانات
// ============================================================

function getPetByID(id) {
  return PETS.find(pet => pet.id === Number(id));
}

function getPetByType(type) {
  return PETS.find(
    pet => String(pet.type) === String(type)
  );
}

// ============================================================
// الحالة
// ============================================================

function calculatePetState(health, hunger) {
  health = Math.max(0, Math.min(100, Number(health)));
  hunger = Math.max(0, Math.min(100, Number(hunger)));

  if (health < 20) return "مريض";
  if (hunger < 20) return "جائع";
  if (health < 50) return "متعب";
  if (hunger < 50) return "حزين";

  if (health >= 80 && hunger >= 80) {
    return "سعيد";
  }

  return "طبيعي";
}

// ============================================================
// تحديث الحيوان مع الوقت
// ============================================================

async function updatePetOverTime(pet) {
  const now = Date.now();

  const updatedAt = pet.updatedAt
    ? new Date(pet.updatedAt).getTime()
    : now;

  const hoursPassed = Math.floor(
    (now - updatedAt) / (1000 * 60 * 60)
  );

  if (hoursPassed <= 0) {
    return pet;
  }

  const hunger = Math.max(
    0,
    Math.min(100, Number(pet.hunger ?? 100))
  );

  const health = Math.max(
    0,
    Math.min(100, Number(pet.health ?? 100))
  );

  const newHunger = Math.max(
    0,
    hunger - hoursPassed * 5
  );

  let healthLoss = 0;

  if (newHunger < 20) {
    healthLoss = hoursPassed * 4;
  } else if (newHunger < 50) {
    healthLoss = hoursPassed * 2;
  }

  const newHealth = Math.max(
    0,
    health - healthLoss
  );

  const status = calculatePetState(
    newHealth,
    newHunger
  );

  await pet.update({
    hunger: newHunger,
    health: newHealth,
    status,
    updatedAt: new Date()
  });

  return pet;
}

// ============================================================
// PetCurrency
// ============================================================

async function getPetCurrency(PetCurrency, userID) {
  if (!PetCurrency) {
    throw new Error("مودل PetCurrency غير محمّل.");
  }

  let currency = await PetCurrency.findOne({
    where: {
      userID: String(userID)
    }
  });

  if (!currency) {
    currency = await PetCurrency.create({
      userID: String(userID),
      money: 0,
      data: {}
    });
  }

  return currency;
}

function getCurrencyData(currency) {
  let data = currency.data;

  if (
    !data ||
    typeof data !== "object" ||
    Array.isArray(data)
  ) {
    data = {};
  }

  return data;
}

async function updateCurrencyData(currency, changes) {
  const data = getCurrencyData(currency);

  Object.assign(data, changes);

  await currency.update({
    data
  });

  return data;
}

// ============================================================
// الوقت
// ============================================================

function getRemainingCooldown(lastTime, cooldown) {
  if (!lastTime) return 0;

  const last = new Date(lastTime).getTime();

  if (!Number.isFinite(last)) return 0;

  return Math.max(
    0,
    cooldown - (Date.now() - last)
  );
}

function formatTime(milliseconds) {
  const totalSeconds =
    Math.ceil(milliseconds / 1000);

  const days =
    Math.floor(totalSeconds / 86400);

  const hours =
    Math.floor((totalSeconds % 86400) / 3600);

  const minutes =
    Math.floor((totalSeconds % 3600) / 60);

  const seconds =
    totalSeconds % 60;

  if (days > 0) {
    return `${days} يوم و ${hours} ساعة`;
  }

  if (hours > 0) {
    return `${hours} ساعة و ${minutes} دقيقة`;
  }

  return `${minutes} دقيقة و ${seconds} ثانية`;
}

// ============================================================
// استخراج الشخص المستهدف
// ============================================================

function getTargetUserID(event) {
  // أولاً: الرد على رسالة
  if (
    event.messageReply &&
    event.messageReply.senderID
  ) {
    return String(event.messageReply.senderID);
  }

  // ثانياً: المنشن
  if (
    event.mentions &&
    typeof event.mentions === "object"
  ) {
    const ids = Object.keys(event.mentions);

    if (ids.length > 0) {
      return String(ids[0]);
    }
  }

  return null;
}

function getTargetName(event, targetID) {
  if (
    event.mentions &&
    event.mentions[targetID]
  ) {
    return event.mentions[targetID]
      .replace("@", "")
      .trim();
  }

  return `المستخدم ${targetID}`;
}

// ============================================================
// القائمة الكاملة
// ============================================================

function getFullPetsList() {
  let text =
    "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n" +
    "🐾 قائمة جميع الحيوانات\n\n";

  for (const rarity of RARITY_ORDER) {
    const pets = PETS.filter(
      pet => pet.rarity === rarity
    );

    if (!pets.length) continue;

    text += `【 ${rarity} 】\n\n`;

    for (const pet of pets) {
      text +=
        `${pet.id}. ${pet.emoji} ${pet.name}\n` +
        `   القوة: ${pet.power}`;

      if (pet.price === 0) {
        text += " | مجاني";
      } else {
        text += ` | السعر: ${pet.price} عملة`;
      }

      text += "\n";
    }

    text += "\n";
  }

  text +=
    "↪️ حيوان متجر لعرض الحيوانات القابلة للشراء.";

  return text;
}

// ============================================================
// المتجر
// ============================================================

function getShopList() {
  let text =
    "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n" +
    "🛒 متجر الحيوانات\n\n";

  for (const rarity of RARITY_ORDER) {
    const pets = PETS.filter(
      pet =>
        pet.price > 0 &&
        pet.rarity === rarity
    );

    if (!pets.length) continue;

    text += `【 ${rarity} 】\n\n`;

    for (const pet of pets) {
      text +=
        `${pet.id}. ${pet.emoji} ${pet.name}\n` +
        `   القوة: ${pet.power}\n` +
        `   السعر: ${pet.price} عملة\n\n`;
    }
  }

  text +=
    "↪️ رد برقم الحيوان لبدء الشراء.";

  return text;
}

// ============================================================
// معلومات الحيوان
// ============================================================

function getPetInfo(pet) {
  const found = getPetByType(pet.type);

  const emoji = found?.emoji || "🐾";

  const rarity =
    pet.rarity ||
    found?.rarity ||
    "شائع";

  const power = Number(
    pet.power ??
    found?.power ??
    0
  );

  const level = Number(
    pet.level || 1
  );

  const exp = Number(
    pet.exp || 0
  );

  const health = Number(
    pet.health ?? 100
  );

  const hunger = Number(
    pet.hunger ?? 100
  );

  const status =
    pet.status ||
    calculatePetState(
      health,
      hunger
    );

  return (
    "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n" +

    `${emoji} ${pet.name}\n\n` +

    `النوع: ${pet.type}\n` +
    `الندرة: ${rarity}\n` +
    `القوة: ${power}\n` +
    `المستوى: ${level}\n` +
    `XP: ${exp}/${level * 100}\n` +
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

async function createPet(Pets, senderID, selected) {
  await Pets.create({
    userID: String(senderID),
    type: selected.type,
    name: selected.name,
    rarity: selected.rarity,
    power: selected.power,
    level: 1,
    exp: 0,
    health: 100,
    hunger: 100,
    status: "سعيد",
    lastTrain: null,
    updatedAt: new Date()
  });

  return (
    "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n" +

    `${selected.emoji} تم إنشاء حيوانك بنجاح\n\n` +

    `الحيوان: ${selected.name}\n` +
    `الندرة: ${selected.rarity}\n` +
    `القوة: ${selected.power}\n` +
    `المستوى: 1\n` +
    `XP: 0/100\n` +
    `الحالة: سعيد\n` +
    `الصحة: 100/100\n` +
    `الشبع: 100/100`
  );
}

// ============================================================
// سعر البيع
// ============================================================

function getSellPrice(pet) {
  const found = getPetByType(pet.type);

  if (!found) return 0;

  const basePrice =
    Number(found.price || 0);

  const power =
    Number(
      pet.power ??
      found.power ??
      0
    );

  const level =
    Number(pet.level || 1);

  return (
    Math.floor(basePrice / 2) +
    power * 10 +
    Math.max(0, level - 1) * 100
  );
}

// ============================================================
// الرصيد
// ============================================================

async function sendPetBalance(
  api,
  threadID,
  messageID,
  PetCurrency,
  targetID,
  targetName,
  own
) {
  const currency =
    await getPetCurrency(
      PetCurrency,
      targetID
    );

  const money =
    Number(currency.money || 0);

  let message =
    "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n" +
    "💰 رصيد الحيوانات\n\n";

  if (own) {
    message +=
      `💳 رصيدك: ${money} عملة\n\n`;
  } else {
    message +=
      `👤 ${targetName}\n` +
      `💳 الرصيد: ${money} عملة\n\n`;
  }

  message +=
    "هذا الرصيد مستقل عن رصيد البوت العام.";

  return api.sendMessage(
    message,
    threadID,
    messageID
  );
}

// ============================================================
// العمل
// ============================================================

async function doWork(
  api,
  threadID,
  messageID,
  Pets,
  PetCurrency,
  senderID
) {
  let pet = await Pets.findOne({
    where: {
      userID: String(senderID)
    }
  });

  if (!pet) {
    return api.sendMessage(
      "❌ لا تملك حيوانًا.\n\nأنشئ حيوانًا أولًا باستخدام الأمر حيوان.",
      threadID,
      messageID
    );
  }

  pet = await updatePetOverTime(pet);

  const currency =
    await getPetCurrency(
      PetCurrency,
      senderID
    );

  const data =
    getCurrencyData(currency);

  const remaining =
    getRemainingCooldown(
      data.petLastWork,
      WORK_COOLDOWN
    );

  if (remaining > 0) {
    return api.sendMessage(
      "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n" +
      "❌ حيوانك يحتاج إلى الراحة.\n\n" +
      `⏳ العمل القادم بعد: ${formatTime(remaining)}`,
      threadID,
      messageID
    );
  }

  const power =
    Number(pet.power || 0);

  const level =
    Number(pet.level || 1);

  const reward =
    100 +
    power * 5 +
    (level - 1) * 25;

  const money =
    Number(currency.money || 0);

  await currency.update({
    money: money + reward
  });

  await updateCurrencyData(
    currency,
    {
      petLastWork:
        new Date().toISOString()
    }
  );

  return api.sendMessage(
    "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n" +
    `🐾 ${pet.name} عمل بنجاح\n\n` +
    `💰 المكافأة: +${reward} عملة\n` +
    `💳 رصيدك الجديد: ${money + reward} عملة\n\n` +
    "⏳ يمكنك العمل مرة أخرى بعد 30 دقيقة.",
    threadID,
    messageID
  );
}

// ============================================================
// اليومي
// ============================================================

async function doDaily(
  api,
  threadID,
  messageID,
  Pets,
  PetCurrency,
  senderID
) {
  const pet =
    await Pets.findOne({
      where: {
        userID: String(senderID)
      }
    });

  if (!pet) {
    return api.sendMessage(
      "❌ يجب أن تملك حيوانًا لاستخدام اليومي.",
      threadID,
      messageID
    );
  }

  const currency =
    await getPetCurrency(
      PetCurrency,
      senderID
    );

  const data =
    getCurrencyData(currency);

  const remaining =
    getRemainingCooldown(
      data.petLastDaily,
      DAILY_COOLDOWN
    );

  if (remaining > 0) {
    return api.sendMessage(
      "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n" +
      "❌ لقد أخذت مكافأة اليوم بالفعل.\n\n" +
      `⏳ اليومي القادم بعد: ${formatTime(remaining)}`,
      threadID,
      messageID
    );
  }

  const money =
    Number(currency.money || 0);

  const reward =
    Math.min(
      10000,
      Math.max(
        250,
        Math.floor(money * 0.05)
      )
    );

  await currency.update({
    money: money + reward
  });

  await updateCurrencyData(
    currency,
    {
      petLastDaily:
        new Date().toISOString()
    }
  );

  return api.sendMessage(
    "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n" +
    "🎁 مكافأة اليومي\n\n" +
    `🐾 الحيوان: ${pet.name}\n` +
    `💰 رصيدك قبل المكافأة: ${money}\n` +
    `🎁 المكافأة: +${reward} عملة\n` +
    `💳 رصيدك الجديد: ${money + reward} عملة\n\n` +
    "⏳ يمكنك أخذ اليومي مرة أخرى بعد 24 ساعة.",
    threadID,
    messageID
  );
}

// ============================================================
// المتصدرين
// ============================================================

async function sendLeaderboard(
  api,
  threadID,
  messageID,
  Pets
) {
  const pets =
    await Pets.findAll({
      order: [
        ["power", "DESC"],
        ["level", "DESC"],
        ["exp", "DESC"]
      ],
      limit: 10
    });

  if (!pets.length) {
    return api.sendMessage(
      "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\nلا يوجد متصدرون حتى الآن.",
      threadID,
      messageID
    );
  }

  let text =
    "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n" +
    "🏆 المتصدرون\n\n";

  for (let i = 0; i < pets.length; i++) {
    const pet = pets[i].toJSON();

    const found =
      getPetByType(pet.type);

    text +=
      `${i + 1}. ${pet.userID}\n` +
      `${found?.emoji || "🐾"} ${pet.name}\n` +
      `المستوى: ${pet.level || 1}\n` +
      `القوة: ${pet.power || 0}\n\n`;
  }

  return api.sendMessage(
    text,
    threadID,
    messageID
  );
}

// ============================================================
// السرقة
// ============================================================

async function doSteal(
  api,
  threadID,
  messageID,
  PetCurrency,
  Pets,
  thiefID,
  targetID
) {
  if (!targetID) {
    return api.sendMessage(
      "❌ يجب تحديد الشخص.\n\nاستخدم:\nحيوان سرقة @منشن\nأو قم بالرد على رسالة الشخص ثم اكتب:\nحيوان سرقة",
      threadID,
      messageID
    );
  }

  targetID = String(targetID);
  thiefID = String(thiefID);

  if (targetID === thiefID) {
    return api.sendMessage(
      "❌ لا يمكنك سرقة نفسك.",
      threadID,
      messageID
    );
  }

  const thiefPet =
    await Pets.findOne({
      where: {
        userID: thiefID
      }
    });

  if (!thiefPet) {
    return api.sendMessage(
      "❌ يجب أن تملك حيوانًا حتى تتمكن من السرقة.",
      threadID,
      messageID
    );
  }

  const targetPet =
    await Pets.findOne({
      where: {
        userID: targetID
      }
    });

  if (!targetPet) {
    return api.sendMessage(
      "❌ الشخص المستهدف لا يملك حيوانًا.",
      threadID,
      messageID
    );
  }

  const thiefCurrency =
    await getPetCurrency(
      PetCurrency,
      thiefID
    );

  const targetCurrency =
    await getPetCurrency(
      PetCurrency,
      targetID
    );

  const thiefData =
    getCurrencyData(
      thiefCurrency
    );

  const remaining =
    getRemainingCooldown(
      thiefData.petLastSteal,
      STEAL_COOLDOWN
    );

  if (remaining > 0) {
    return api.sendMessage(
      "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n" +
      "❌ لا يمكنك السرقة الآن.\n\n" +
      `⏳ المحاولة القادمة بعد: ${formatTime(remaining)}`,
      threadID,
      messageID
    );
  }

  const targetMoney =
    Number(targetCurrency.money || 0);

  if (targetMoney <= 0) {
    return api.sendMessage(
      "❌ لا يوجد لدى الشخص أي عملات حيوانات لسرقتها.",
      threadID,
      messageID
    );
  }

  const success =
    Math.random() <
    STEAL_SUCCESS_CHANCE;

  await updateCurrencyData(
    thiefCurrency,
    {
      petLastSteal:
        new Date().toISOString()
    }
  );

  if (!success) {
    const thiefMoney =
      Number(thiefCurrency.money || 0);

    const loss =
      Math.min(
        STEAL_FAIL_LOSS,
        thiefMoney
      );

    await thiefCurrency.update({
      money: thiefMoney - loss
    });

    return api.sendMessage(
      "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n" +
      "❌ فشلت عملية السرقة.\n\n" +
      `🐾 ${thiefPet.name} لم يتمكن من مساعدتك.\n` +
      `💸 خسرت: ${loss} عملة\n\n` +
      "⏳ حاول مرة أخرى بعد ساعة.",
      threadID,
      messageID
    );
  }

  const percentage =
    STEAL_PERCENT_MIN +
    Math.random() *
    (STEAL_PERCENT_MAX - STEAL_PERCENT_MIN);

  const stolen =
    Math.max(
      1,
      Math.floor(
        targetMoney * percentage
      )
    );

  const thiefMoney =
    Number(thiefCurrency.money || 0);

  await targetCurrency.update({
    money:
      Math.max(
        0,
        targetMoney - stolen
      )
  });

  await thiefCurrency.update({
    money:
      thiefMoney + stolen
  });

  return api.sendMessage(
    "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n" +
    "🦹 تمت السرقة بنجاح\n\n" +
    `🐾 حيوانك: ${thiefPet.name}\n` +
    `💰 المبلغ المسروق: ${stolen} عملة\n` +
    `💳 رصيدك الجديد: ${thiefMoney + stolen} عملة\n\n` +
    "⏳ يمكنك محاولة السرقة مرة أخرى بعد ساعة.",
    threadID,
    messageID
  );
}

// ============================================================
// RUN
// ============================================================

module.exports.run = async function ({
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
      getModel(models, "Pets");

    const PetCurrency =
      getModel(models, "PetCurrency");

    if (!Pets) {
      return api.sendMessage(
        "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n❌ مودل الحيوانات غير محمّل.",
        threadID,
        messageID
      );
    }

    if (!PetCurrency) {
      return api.sendMessage(
        "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n❌ مودل PetCurrency غير محمّل.",
        threadID,
        messageID
      );
    }

    const rawArgs =
      Array.isArray(args)
        ? args.join(" ").trim()
        : "";

    const subCommand =
      rawArgs.toLowerCase();

    // ========================================================
    // رصيد
    // ========================================================

    if (
      subCommand === "رصيد" ||
      subCommand === "balance"
    ) {
      const targetID =
        getTargetUserID(event);

      if (targetID) {
        const name =
          getTargetName(
            event,
            targetID
          );

        return sendPetBalance(
          api,
          threadID,
          messageID,
          PetCurrency,
          targetID,
          name,
          false
        );
      }

      return sendPetBalance(
        api,
        threadID,
        messageID,
        PetCurrency,
        senderID,
        null,
        true
      );
    }

    // ========================================================
    // رصيد مع منشن
    // ========================================================

    if (
      subCommand.startsWith("رصيد ") ||
      subCommand.startsWith("balance ")
    ) {
      const targetID =
        getTargetUserID(event);

      if (!targetID) {
        return api.sendMessage(
          "❌ قم بمنشن الشخص أو الرد على رسالته.",
          threadID,
          messageID
        );
      }

      const name =
        getTargetName(
          event,
          targetID
        );

      return sendPetBalance(
        api,
        threadID,
        messageID,
        PetCurrency,
        targetID,
        name,
        false
      );
    }

    // ========================================================
    // عمل
    // ========================================================

    if (
      subCommand === "عمل" ||
      subCommand === "work"
    ) {
      return doWork(
        api,
        threadID,
        messageID,
        Pets,
        PetCurrency,
        senderID
      );
    }

    // ========================================================
    // يومي
    // ========================================================

    if (
      subCommand === "يومي" ||
      subCommand === "daily"
    ) {
      return doDaily(
        api,
        threadID,
        messageID,
        Pets,
        PetCurrency,
        senderID
      );
    }

    // ========================================================
    // القائمة الكاملة
    // ========================================================

    if (
      subCommand === "قائمة" ||
      subCommand === "list"
    ) {
      return api.sendMessage(
        getFullPetsList(),
        threadID,
        messageID
      );
    }

    // ========================================================
    // المتجر
    // ========================================================

    if (
      subCommand === "متجر" ||
      subCommand === "shop"
    ) {
      const sent =
        await sendReply(
          api,
          getShopList(),
          threadID,
          messageID
        );

      if (sent?.messageID) {
        addReply({
          name: module.exports.config.name,
          messageID: sent.messageID,
          author: String(senderID),
          type: "pet_select_shop"
        });
      }

      return;
    }

    // ========================================================
    // المتصدرون
    // ========================================================

    if (
      subCommand === "تصدّر" ||
      subCommand === "تصدر" ||
      subCommand === "متصدرين" ||
      subCommand === "top"
    ) {
      return sendLeaderboard(
        api,
        threadID,
        messageID,
        Pets
      );
    }

    // ========================================================
    // السرقة
    // ========================================================

    if (
      subCommand === "سرقة" ||
      subCommand === "سرقه" ||
      subCommand === "steal"
    ) {
      const targetID =
        getTargetUserID(event);

      return doSteal(
        api,
        threadID,
        messageID,
        PetCurrency,
        Pets,
        senderID,
        targetID
      );
    }

    // ========================================================
    // شراء مباشر برقم
    // ========================================================

    if (/^\d+$/.test(rawArgs)) {
      const selected =
        getPetByID(
          Number(rawArgs)
        );

      if (!selected) {
        return api.sendMessage(
          "❌ رقم الحيوان غير صحيح.",
          threadID,
          messageID
        );
      }

      if (selected.price === 0) {
        return api.sendMessage(
          "❌ هذا الحيوان مجاني ويتم اختياره من خلال حيوان فقط.",
          threadID,
          messageID
        );
      }

      const sent =
        await sendReply(
          api,

          "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n" +

          `${selected.emoji} ${selected.name}\n\n` +

          `الندرة: ${selected.rarity}\n` +
          `القوة: ${selected.power}\n` +
          `السعر: ${selected.price} عملة\n\n` +

          "هل تريد شراء هذا الحيوان؟\n\n" +
          "نعم\n" +
          "لا",

          threadID,
          messageID
        );

      if (sent?.messageID) {
        addReply({
          name: module.exports.config.name,
          messageID: sent.messageID,
          author: String(senderID),
          type: "pet_purchase",
          petID: selected.id
        });
      }

      return;
    }

    // ========================================================
    // الحيوان الخاص بالمستخدم
    // ========================================================

    let pet =
      await Pets.findOne({
        where: {
          userID: String(senderID)
        }
      });

    if (pet) {
      pet =
        await updatePetOverTime(pet);
    }

    // لديه حيوان
    if (pet) {
      const sent =
        await sendReply(
          api,
          getPetInfo(pet.toJSON()),
          threadID,
          messageID
        );

      if (sent?.messageID) {
        addReply({
          name: module.exports.config.name,
          messageID: sent.messageID,
          author: String(senderID),
          type: "pet_actions"
        });
      }

      return;
    }

    // لا يملك حيوان
    const sent =
      await sendReply(
        api,
        getFreePetsList(),
        threadID,
        messageID
      );

    if (sent?.messageID) {
      addReply({
        name: module.exports.config.name,
        messageID: sent.messageID,
        author: String(senderID),
        type: "pet_select_free"
      });
    }

  } catch (error) {
    console.error(
      "[PET RUN ERROR]",
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
    body = ""
  } = event;

  try {
    if (
      handleReply.author &&
      String(handleReply.author) !==
      String(senderID)
    ) {
      return;
    }

    const Pets =
      getModel(models, "Pets");

    const PetCurrency =
      getModel(models, "PetCurrency");

    if (!Pets || !PetCurrency) {
      return api.sendMessage(
        "❌ موديلات نظام الحيوانات غير محمّلة.",
        threadID,
        messageID
      );
    }

    const input =
      String(body)
        .trim()
        .toLowerCase();

    // ========================================================
    // اختيار الحيوان المجاني
    // ========================================================

    if (
      handleReply.type ===
      "pet_select_free"
    ) {
      const number =
        Number(input);

      if (!Number.isInteger(number)) {
        return api.sendMessage(
          "❌ أرسل رقم الحيوان فقط.",
          threadID,
          messageID
        );
      }

      const selected =
        getPetByID(number);

      if (!selected) {
        return api.sendMessage(
          `❌ رقم الحيوان غير صحيح.\n\nاختر رقمًا من 1 إلى ${PETS.length}.`,
          threadID,
          messageID
        );
      }

      if (selected.price !== 0) {
        return api.sendMessage(
          "❌ هذا الحيوان ليس مجانيًا.\n\nاستخدم حيوان متجر لشرائه.",
          threadID,
          messageID
        );
      }

      const existing =
        await Pets.findOne({
          where: {
            userID: String(senderID)
          }
        });

      if (existing) {
        removeReply(handleReply);

        return api.sendMessage(
          "❌ لديك حيوان بالفعل.",
          threadID,
          messageID
        );
      }

      const message =
        await createPet(
          Pets,
          senderID,
          selected
        );

      removeReply(handleReply);

      return api.sendMessage(
        message,
        threadID,
        messageID
      );
    }

    // ========================================================
    // اختيار حيوان من المتجر
    // ========================================================

    if (
      handleReply.type ===
      "pet_select_shop"
    ) {
      const number =
        Number(input);

      if (!Number.isInteger(number)) {
        return api.sendMessage(
          "❌ أرسل رقم الحيوان فقط.",
          threadID,
          messageID
        );
      }

      const selected =
        getPetByID(number);

      if (!selected) {
        return api.sendMessage(
          "❌ رقم الحيوان غير صحيح.",
          threadID,
          messageID
        );
      }

      if (selected.price === 0) {
        return api.sendMessage(
          "❌ هذا الحيوان مجاني ولا يحتاج إلى الشراء.",
          threadID,
          messageID
        );
      }

      const existing =
        await Pets.findOne({
          where: {
            userID: String(senderID)
          }
        });

      if (existing) {
        removeReply(handleReply);

        return api.sendMessage(
          "❌ لديك حيوان بالفعل.",
          threadID,
          messageID
        );
      }

      const sent =
        await sendReply(
          api,

          "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n" +

          `${selected.emoji} ${selected.name}\n\n` +

          `الندرة: ${selected.rarity}\n` +
          `القوة: ${selected.power}\n` +
          `السعر: ${selected.price} عملة\n\n` +

          "هل تريد شراء هذا الحيوان؟\n\n" +
          "نعم\n" +
          "لا",

          threadID,
          messageID
        );

      if (sent?.messageID) {
        removeReply(handleReply);

        addReply({
          name: module.exports.config.name,
          messageID: sent.messageID,
          author: String(senderID),
          type: "pet_purchase",
          petID: selected.id
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
      if (
        input === "لا" ||
        input === "الغاء" ||
        input === "إلغاء"
      ) {
        removeReply(handleReply);

        return api.sendMessage(
          "تم إلغاء عملية الشراء.",
          threadID,
          messageID
        );
      }

      if (input !== "نعم") {
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
        removeReply(handleReply);

        return api.sendMessage(
          "❌ الحيوان غير موجود.",
          threadID,
          messageID
        );
      }

      const existing =
        await Pets.findOne({
          where: {
            userID: String(senderID)
          }
        });

      if (existing) {
        removeReply(handleReply);

        return api.sendMessage(
          "❌ لديك حيوان بالفعل.",
          threadID,
          messageID
        );
      }

      const currency =
        await getPetCurrency(
          PetCurrency,
          senderID
        );

      const money =
        Number(currency.money || 0);

      if (money < selected.price) {
        return api.sendMessage(
          "❌ لا تملك عملات حيوانات كافية.\n\n" +
          `السعر: ${selected.price}\n` +
          `رصيدك: ${money}\n` +
          `ينقصك: ${selected.price - money}`,
          threadID,
          messageID
        );
      }

      await currency.update({
        money:
          money -
          selected.price
      });

      try {
        await Pets.create({
          userID: String(senderID),
          type: selected.type,
          name: selected.name,
          rarity: selected.rarity,
          power: selected.power,
          level: 1,
          exp: 0,
          health: 100,
          hunger: 100,
          status: "سعيد",
          lastTrain: null,
          updatedAt: new Date()
        });
      } catch (error) {
        await currency.update({
          money
        });

        throw error;
      }

      removeReply(handleReply);

      return api.sendMessage(
        "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n" +

        `${selected.emoji} تم شراء حيوانك بنجاح\n\n` +

        `الحيوان: ${selected.name}\n` +
        `الندرة: ${selected.rarity}\n` +
        `القوة: ${selected.power}\n` +
        `السعر: ${selected.price} عملة\n` +
        `المتبقي: ${money - selected.price} عملة\n\n` +

        "المستوى: 1\n" +
        "XP: 0/100\n" +
        "الحالة: سعيد\n" +
        "الصحة: 100/100\n" +
        "الشبع: 100/100",

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
      let pet =
        await Pets.findOne({
          where: {
            userID: String(senderID)
          }
        });

      if (!pet) {
        removeReply(handleReply);

        return api.sendMessage(
          "❌ لا تملك حيوانًا.",
          threadID,
          messageID
        );
      }

      pet =
        await updatePetOverTime(pet);

      const choice =
        Number(input);

      // ------------------------------------------------------
      // بيع
      // ------------------------------------------------------

      if (choice === 1) {
        const data =
          pet.toJSON();

        const sellPrice =
          getSellPrice(data);

        const found =
          getPetByType(data.type);

        const sent =
          await sendReply(
            api,

            "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n" +

            `${found?.emoji || "🐾"} ${data.name}\n\n` +

            `القوة: ${data.power}\n` +
            `المستوى: ${data.level}\n` +
            `قيمة البيع: ${sellPrice} عملة\n\n` +

            "هل تريد بيع حيوانك؟\n\n" +
            "نعم\n" +
            "لا",

            threadID,
            messageID
          );

        if (sent?.messageID) {
          removeReply(handleReply);

          addReply({
            name: module.exports.config.name,
            messageID: sent.messageID,
            author: String(senderID),
            type: "pet_sell_confirm"
          });
        }

        return;
      }

      // ------------------------------------------------------
      // إطعام
      // ------------------------------------------------------

      if (choice === 2) {
        const hunger =
          Number(pet.hunger ?? 100);

        const newHunger =
          Math.min(
            100,
            hunger + 20
          );

        const health =
          Number(pet.health ?? 100);

        const status =
          calculatePetState(
            health,
            newHunger
          );

        await pet.update({
          hunger: newHunger,
          status,
          updatedAt: new Date()
        });

        removeReply(handleReply);

        return api.sendMessage(
          "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n" +

          `تم إطعام ${pet.name}\n\n` +

          `الشبع: ${newHunger}/100\n` +
          `الصحة: ${health}/100\n` +
          `الحالة: ${status}`,

          threadID,
          messageID
        );
      }

      // ------------------------------------------------------
      // تدريب
      // ------------------------------------------------------

      if (choice === 3) {
        const remaining =
          getRemainingCooldown(
            pet.lastTrain,
            TRAIN_COOLDOWN
          );

        if (remaining > 0) {
          return api.sendMessage(
            "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n" +
            "❌ حيوانك يحتاج إلى الراحة.\n\n" +
            `⏳ الوقت المتبقي: ${formatTime(remaining)}`,
            threadID,
            messageID
          );
        }

        const currentLevel =
          Number(pet.level || 1);

        const currentExp =
          Number(pet.exp || 0);

        const currentPower =
          Number(pet.power || 0);

        let newLevel =
          currentLevel;

        let newExp =
          currentExp +
          TRAIN_XP;

        let newPower =
          currentPower;

        let levelsGained = 0;

        while (
          newExp >=
          newLevel * 100
        ) {
          newExp -=
            newLevel * 100;

          newLevel++;
          levelsGained++;

          newPower +=
            POWER_PER_LEVEL;
        }

        const oldHunger =
          Number(pet.hunger ?? 100);

        const newHunger =
          Math.max(
            0,
            oldHunger - 10
          );

        const health =
          Number(pet.health ?? 100);

        const status =
          calculatePetState(
            health,
            newHunger
          );

        await pet.update({
          exp: newExp,
          level: newLevel,
          power: newPower,
          hunger: newHunger,
          status,
          lastTrain: new Date(),
          updatedAt: new Date()
        });

        removeReply(handleReply);

        let message =
          "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n" +

          `تم تدريب ${pet.name}\n\n` +

          `+${TRAIN_XP} XP\n` +
          `XP: ${newExp}/${newLevel * 100}\n` +
          `المستوى: ${newLevel}\n` +
          `القوة: ${newPower}\n` +
          `الشبع: ${newHunger}/100\n` +
          `الحالة: ${status}\n\n` +

          "⏳ التدريب القادم بعد 30 دقيقة.";

        if (levelsGained > 0) {
          message +=
            "\n\n" +
            `ارتفع المستوى إلى ${newLevel}!\n` +
            `+${levelsGained * POWER_PER_LEVEL} قوة`;
        }

        return api.sendMessage(
          message,
          threadID,
          messageID
        );
      }

      return api.sendMessage(
        "❌ الاختيار غير صحيح.\n\n" +
        "1. بيع الحيوان\n" +
        "2. إطعام الحيوان\n" +
        "3. تدريب الحيوان",
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
      if (
        input === "لا" ||
        input === "الغاء" ||
        input === "إلغاء"
      ) {
        removeReply(handleReply);

        return api.sendMessage(
          "تم إلغاء عملية البيع.",
          threadID,
          messageID
        );
      }

      if (input !== "نعم") {
        return api.sendMessage(
          "↪️ رد بـ نعم للبيع أو لا للإلغاء.",
          threadID,
          messageID
        );
      }

      const pet =
        await Pets.findOne({
          where: {
            userID: String(senderID)
          }
        });

      if (!pet) {
        removeReply(handleReply);

        return api.sendMessage(
          "❌ لا تملك حيوانًا.",
          threadID,
          messageID
        );
      }

      const data =
        pet.toJSON();

      const sellPrice =
        getSellPrice(data);

      const currency =
        await getPetCurrency(
          PetCurrency,
          senderID
        );

      const money =
        Number(currency.money || 0);

      await currency.update({
        money:
          money +
          sellPrice
      });

      const petName =
        pet.name;

      await pet.destroy();

      removeReply(handleReply);

      return api.sendMessage(
        "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n" +

        `تم بيع ${petName} بنجاح\n\n` +

        `قيمة البيع: ${sellPrice} عملة\n` +
        `رصيد الحيوانات الجديد: ${money + sellPrice} عملة`,

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