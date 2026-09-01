module.exports.config = {
  name: "حيوان",
  version: "11.0.0",
  credits: "أبو هريرة",
  description: "نظام الحيوانات الأليفة والاقتصاد والاستثمار والسرقة",
  commandCategory: "games",
  hasPermssion: 0,
  usages: "حيوان | حيوان قائمة | حيوان متجر | حيوان رصيد | حيوان عمل | حيوان يومي | حيوان استثمار | حيوان سرقة | حيوان تصدر",
  cooldowns: 3
};

// ============================================================
// إعدادات
// ============================================================

const TRAIN_COOLDOWN = 30 * 60 * 1000;
const WORK_COOLDOWN = 30 * 60 * 1000;
const DAILY_COOLDOWN = 24 * 60 * 60 * 1000;
const THEFT_COOLDOWN = 60 * 60 * 1000;
const SHIELD_DURATION = 24 * 60 * 60 * 1000;

const TRAIN_XP = 20;
const POWER_PER_LEVEL = 5;

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
// المتجر
// ============================================================

const SHOP = [
  {
    id: "food",
    name: "طعام الحيوان",
    price: 100,
    description: "يزيد الشبع 30 نقطة",
    emoji: "🍖"
  },
  {
    id: "medicine",
    name: "دواء الحيوان",
    price: 250,
    description: "يزيد الصحة 30 نقطة",
    emoji: "💊"
  },
  {
    id: "shield",
    name: "درع الحماية",
    price: 1500,
    description: "يحميك من السرقة لمدة 24 ساعة",
    emoji: "🛡️"
  },
  {
    id: "investment_card",
    name: "بطاقة الاستثمار",
    price: 2000,
    description: "تضمن 50% استثمار إضافي",
    emoji: "🎫"
  }
];

// ============================================================
// المودلات
// ============================================================

function getModel(models, name) {
  try {
    if (models && typeof models.use === "function") {
      const model = models.use(name);
      if (model) return model;
    }
  } catch (e) {
    console.error(`[PET MODEL] ${name}`, e);
  }

  if (models && models[name]) {
    return models[name];
  }

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
          resolve(null);
          return;
        }

        resolve(info);
      },
      messageID
    );
  });
}

// ============================================================
// الحيوانات
// ============================================================

function getPetByID(id) {
  return PETS.find(
    pet => pet.id === Number(id)
  );
}

function getPetByType(type) {
  return PETS.find(
    pet => String(pet.type) === String(type)
  );
}

// ============================================================
// العملة
// ============================================================

async function getPetCurrency(PetCurrency, userID) {
  if (!PetCurrency) {
    throw new Error("مودل PetCurrency غير محمّل.");
  }

  let currency =
    await PetCurrency.findOne({
      where: {
        userID: String(userID)
      }
    });

  if (!currency) {
    currency =
      await PetCurrency.create({
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

  const last =
    new Date(lastTime).getTime();

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
    Math.floor(
      (totalSeconds % 86400) / 3600
    );

  const minutes =
    Math.floor(
      (totalSeconds % 3600) / 60
    );

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
// حالة الحيوان
// ============================================================

function calculatePetState(health, hunger) {
  health =
    Math.max(
      0,
      Math.min(100, Number(health))
    );

  hunger =
    Math.max(
      0,
      Math.min(100, Number(hunger))
    );

  if (health < 20) return "مريض";
  if (hunger < 20) return "جائع";
  if (health < 50) return "متعب";
  if (hunger < 50) return "حزين";

  if (
    health >= 80 &&
    hunger >= 80
  ) {
    return "سعيد";
  }

  return "طبيعي";
}

// ============================================================
// تحديث الحيوان مع الوقت
// ============================================================

async function updatePetOverTime(pet) {
  const now = Date.now();

  const updatedAt =
    pet.updatedAt
      ? new Date(pet.updatedAt).getTime()
      : now;

  const hoursPassed =
    Math.floor(
      (now - updatedAt) /
      (1000 * 60 * 60)
    );

  if (hoursPassed <= 0) {
    return pet;
  }

  const hunger =
    Math.max(
      0,
      Math.min(
        100,
        Number(pet.hunger ?? 100)
      )
    );

  const health =
    Math.max(
      0,
      Math.min(
        100,
        Number(pet.health ?? 100)
      )
    );

  const newHunger =
    Math.max(
      0,
      hunger - hoursPassed * 5
    );

  let healthLoss = 0;

  if (newHunger < 20) {
    healthLoss = hoursPassed * 4;
  } else if (newHunger < 50) {
    healthLoss = hoursPassed * 2;
  }

  const newHealth =
    Math.max(
      0,
      health - healthLoss
    );

  const status =
    calculatePetState(
      newHealth,
      newHunger
    );

  await pet.update({
    hunger: newHunger,
    health: newHealth,
    status
  });

  return pet;
}

// ============================================================
// اسم المستخدم
// ============================================================

async function getUserName(api, userID) {
  try {
    const info =
      await new Promise(resolve => {
        api.getUserInfo(
          String(userID),
          (error, result) => {
            if (error || !result) {
              resolve(null);
              return;
            }

            resolve(result);
          }
        );
      });

    if (
      info &&
      info[userID] &&
      info[userID].name
    ) {
      return info[userID].name;
    }
  } catch (e) {
    console.error(
      "[PET USER INFO ERROR]",
      e
    );
  }

  return "مستخدم";
}

// ============================================================
// استخراج المستخدم المستهدف
// ============================================================

function getTargetUserID(event) {

  // المنشن له الأولوية
  if (
    event.mentions &&
    Object.keys(event.mentions).length > 0
  ) {
    return String(
      Object.keys(event.mentions)[0]
    );
  }

  // ثم الرد
  if (
    event.messageReply &&
    event.messageReply.senderID
  ) {
    return String(
      event.messageReply.senderID
    );
  }

  return null;
}

// ============================================================
// القائمة الكاملة للحيوانات
// ============================================================

function getFullPetsList() {
  let text =
    "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n";

  text +=
    "🐾 قائمة جميع الحيوانات\n\n";

  for (const rarity of RARITY_ORDER) {

    const pets =
      PETS.filter(
        pet => pet.rarity === rarity
      );

    if (!pets.length) continue;

    text +=
      `【 ${rarity} 】\n\n`;

    for (const pet of pets) {

      text +=
        `${pet.id}. ${pet.emoji} ${pet.name}\n` +
        `   القوة: ${pet.power} | السعر: ${
          pet.price === 0
            ? "مجاني"
            : pet.price + " عملة"
        }\n`;
    }

    text += "\n";
  }

  return text;
}

// ============================================================
// متجر الأدوات والأكل
// ============================================================

function getShopList() {
  let text =
    "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n";

  text +=
    "🛒 متجر الحيوانات\n\n";

  text +=
    "الأكل والأدوات المتاحة:\n\n";

  for (const item of SHOP) {

    text +=
      `${item.emoji} ${item.name}\n` +
      `💰 السعر: ${item.price} عملة\n` +
      `${item.description}\n\n`;
  }

  text +=
    "↪️ للشراء رد على رسالة المتجر باسم الأداة أو الطعام.";

  return text;
}

// ============================================================
// معلومات الحيوان
// ============================================================

function getPetInfo(pet) {

  const found =
    getPetByType(pet.type);

  const emoji =
    found?.emoji || "🐾";

  const rarity =
    pet.rarity ||
    found?.rarity ||
    "شائع";

  const power =
    Number(
      pet.power ??
      found?.power ??
      0
    );

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
// إنشاء حيوان
// ============================================================

async function createPet(
  Pets,
  senderID,
  selected
) {

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
      "سعيد",

    lastTrain:
      null
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

  const found =
    getPetByType(pet.type);

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
  targetID
) {

  const currency =
    await getPetCurrency(
      PetCurrency,
      targetID
    );

  const money =
    Number(currency.money || 0);

  const targetName =
    await getUserName(
      api,
      targetID
    );

  const data =
    getCurrencyData(currency);

  const investmentPoints =
    Number(
      data.investmentPoints || 0
    );

  return api.sendMessage(

    "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n" +

    `👤 ${targetName}\n\n` +

    `💰 رصيد الحيوان: ${money} عملة\n` +
    `📈 نقاط الاستثمار: ${investmentPoints}`,

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

  let pet =
    await Pets.findOne({
      where: {
        userID: String(senderID)
      }
    });

  if (!pet) {
    return api.sendMessage(
      "❌ لا تملك حيوانًا.",
      threadID,
      messageID
    );
  }

  pet =
    await updatePetOverTime(pet);

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
      "❌ لقد أخذت مكافأة اليوم بالفعل.\n\n" +
      `⏳ اليومي القادم بعد: ${formatTime(remaining)}`,
      threadID,
      messageID
    );
  }

  const money =
    Number(currency.money || 0);

  /*
   * كلما زاد الرصيد زادت النسبة
   *
   * 250 حد أدنى
   * 5% من الرصيد كحد أساسي
   * 10,000 حد أقصى
   */

  let percentage =
    0.05;

  if (money >= 100000) {
    percentage = 0.07;
  }

  if (money >= 500000) {
    percentage = 0.09;
  }

  if (money >= 1000000) {
    percentage = 0.10;
  }

  const reward =
    Math.min(
      10000,
      Math.max(
        250,
        Math.floor(
          money * percentage
        )
      )
    );

  await currency.update({
    money:
      money + reward
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
    `📊 نسبة اليومي: ${percentage * 100}%\n` +
    `🎁 المكافأة: +${reward} عملة\n` +
    `💳 رصيدك الجديد: ${money + reward} عملة\n\n` +

    "⏳ يمكنك أخذ اليومي مرة أخرى بعد 24 ساعة.",

    threadID,
    messageID
  );
}

// ============================================================
// الاستثمار
// ============================================================

async function doInvestment(
  api,
  threadID,
  messageID,
  PetCurrency,
  senderID,
  amount
) {

  const currency =
    await getPetCurrency(
      PetCurrency,
      senderID
    );

  const money =
    Number(currency.money || 0);

  const data =
    getCurrencyData(currency);

  if (!amount) {
    return api.sendMessage(

      "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n" +

      "📈 الاستثمار\n\n" +

      `رصيدك: ${money} عملة\n\n` +

      "استخدم:\n" +
      "حيوان استثمار 1000\n\n" +

      "المبلغ المستثمَر يتحول إلى نقاط استثمار فورًا.",

      threadID,
      messageID
    );
  }

  amount =
    Number(
      String(amount)
        .replace(/,/g, "")
    );

  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    return api.sendMessage(
      "❌ مبلغ الاستثمار غير صحيح.",
      threadID,
      messageID
    );
  }

  amount =
    Math.floor(amount);

  if (money < amount) {
    return api.sendMessage(
      "❌ رصيدك غير كافٍ.\n\n" +
      `رصيدك: ${money}\n` +
      `المبلغ المطلوب: ${amount}\n` +
      `ينقصك: ${amount - money}`,
      threadID,
      messageID
    );
  }

  /*
   * كل 100 عملة = نقطة استثمار
   */

  let points =
    Math.max(
      1,
      Math.floor(amount / 100)
    );

  let cardUsed = false;

  if (
    Number(data.investmentCards || 0) > 0
  ) {

    points =
      Math.floor(
        points * 1.5
      );

    data.investmentCards--;

    cardUsed = true;
  }

  const currentPoints =
    Number(
      data.investmentPoints || 0
    );

  await currency.update({
    money:
      money - amount
  });

  await updateCurrencyData(
    currency,
    {
      investmentPoints:
        currentPoints + points,

      investmentCards:
        Number(data.investmentCards || 0),

      lastInvestment:
        new Date().toISOString()
    }
  );

  return api.sendMessage(

    "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n" +

    "📈 تمت عملية الاستثمار\n\n" +

    `💰 المبلغ: ${amount} عملة\n` +
    `📊 نقاط الاستثمار: +${points}\n` +

    (
      cardUsed
        ? "\n🎫 تم استخدام بطاقة الاستثمار\n" +
          "✨ حصلت على زيادة 50%\n"
        : ""
    ) +

    `\n📊 مجموع نقاط الاستثمار: ${
      currentPoints + points
    }\n` +

    `💳 رصيدك الجديد: ${money - amount} عملة`,

    threadID,
    messageID
  );
}

// ============================================================
// الدرع
// ============================================================

async function useShield(
  api,
  threadID,
  messageID,
  PetCurrency,
  senderID
) {

  const currency =
    await getPetCurrency(
      PetCurrency,
      senderID
    );

  const data =
    getCurrencyData(currency);

  if (
    Number(data.shields || 0) <= 0
  ) {

    return api.sendMessage(
      "❌ لا تملك درع حماية.\n\n" +
      "يمكنك شراء الدرع من حيوان متجر.",
      threadID,
      messageID
    );
  }

  const activeUntil =
    data.shieldUntil
      ? new Date(data.shieldUntil).getTime()
      : 0;

  if (
    activeUntil > Date.now()
  ) {

    return api.sendMessage(
      "🛡️ الدرع مفعل بالفعل.\n\n" +
      `⏳ ينتهي بعد: ${formatTime(
        activeUntil - Date.now()
      )}`,
      threadID,
      messageID
    );
  }

  data.shields--;

  const until =
    new Date(
      Date.now() + SHIELD_DURATION
    ).toISOString();

  await updateCurrencyData(
    currency,
    {
      shields:
        Number(data.shields || 0),

      shieldUntil:
        until
    }
  );

  return api.sendMessage(

    "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n" +

    "🛡️ تم تفعيل درع الحماية\n\n" +

    "لن يستطيع أي مستخدم سرقتك لمدة 24 ساعة.\n\n" +

    `⏳ ينتهي بعد: 24 ساعة\n` +
    `🛡️ الدروع المتبقية: ${data.shields}`,

    threadID,
    messageID
  );
}

// ============================================================
// السرقة
// ============================================================

async function doTheft(
  api,
  threadID,
  messageID,
  Pets,
  PetCurrency,
  senderID,
  targetID
) {

  if (!targetID) {
    return api.sendMessage(

      "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n" +

      "🦹 السرقة\n\n" +

      "منشن الشخص أو قم بالرد على رسالته ثم اكتب:\n\n" +

      "حيوان سرقة",

      threadID,
      messageID
    );
  }

  targetID =
    String(targetID);

  if (
    targetID === String(senderID)
  ) {
    return api.sendMessage(
      "❌ لا يمكنك سرقة نفسك.",
      threadID,
      messageID
    );
  }

  const thiefPet =
    await Pets.findOne({
      where: {
        userID:
          String(senderID)
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
        userID:
          targetID
      }
    });

  if (!targetPet) {
    return api.sendMessage(
      "❌ هذا المستخدم لا يملك حيوانًا.",
      threadID,
      messageID
    );
  }

  const thiefCurrency =
    await getPetCurrency(
      PetCurrency,
      senderID
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

  const targetData =
    getCurrencyData(
      targetCurrency
    );

  // ==========================================================
  // كولداون السارق
  // ==========================================================

  const theftRemaining =
    getRemainingCooldown(
      thiefData.petLastTheft,
      THEFT_COOLDOWN
    );

  if (theftRemaining > 0) {
    return api.sendMessage(
      "❌ لا يمكنك السرقة الآن.\n\n" +
      `⏳ المحاولة القادمة بعد: ${
        formatTime(theftRemaining)
      }`,
      threadID,
      messageID
    );
  }

  // ==========================================================
  // الدرع
  // ==========================================================

  const shieldUntil =
    targetData.shieldUntil
      ? new Date(
          targetData.shieldUntil
        ).getTime()
      : 0;

  if (
    shieldUntil > Date.now()
  ) {

    await updateCurrencyData(
      thiefCurrency,
      {
        petLastTheft:
          new Date().toISOString()
      }
    );

    return api.sendMessage(

      "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n" +

      "🛡️ فشلت السرقة\n\n" +

      "هذا المستخدم محمي بدرع الحماية.\n\n" +

      `⏳ الدرع ينتهي بعد: ${
        formatTime(
          shieldUntil - Date.now()
        )
      }`,

      threadID,
      messageID
    );
  }

  const thiefMoney =
    Number(
      thiefCurrency.money || 0
    );

  const targetMoney =
    Number(
      targetCurrency.money || 0
    );

  if (targetMoney <= 0) {
    return api.sendMessage(
      "❌ لا يوجد شيء يمكن سرقته من هذا المستخدم.",
      threadID,
      messageID
    );
  }

  // ==========================================================
  // الغرامة ونسبة السرقة
  // ==========================================================

  /*
   * الغرامة تزيد مع رصيد السارق
   *
   * 5% أساسية
   * 7% عند 10000
   * 10% عند 50000
   * 12% عند 100000
   */

  let fineRate = 0.05;

  if (thiefMoney >= 10000) {
    fineRate = 0.07;
  }

  if (thiefMoney >= 50000) {
    fineRate = 0.10;
  }

  if (thiefMoney >= 100000) {
    fineRate = 0.12;
  }

  /*
   * نسبة المسروقات تزيد مع رصيد الضحية
   *
   * 5% أساسية
   * 7% عند 10000
   * 9% عند 50000
   * 12% عند 100000
   *
   * الحد الأعلى 15%
   */

  let stealRate = 0.05;

  if (targetMoney >= 10000) {
    stealRate = 0.07;
  }

  if (targetMoney >= 50000) {
    stealRate = 0.09;
  }

  if (targetMoney >= 100000) {
    stealRate = 0.12;
  }

  // ==========================================================
  // احتمال النجاح
  // ==========================================================

  let successChance = 55;

  const thiefLevel =
    Number(thiefPet.level || 1);

  const targetLevel =
    Number(targetPet.level || 1);

  const thiefPower =
    Number(thiefPet.power || 0);

  const targetPower =
    Number(targetPet.power || 0);

  successChance +=
    Math.min(
      20,
      thiefLevel * 1.5
    );

  successChance +=
    Math.min(
      15,
      thiefPower / 20
    );

  successChance -=
    Math.min(
      20,
      targetLevel
    );

  successChance -=
    Math.min(
      15,
      targetPower / 20
    );

  successChance =
    Math.max(
      20,
      Math.min(
        80,
        successChance
      )
    );

  const roll =
    Math.random() * 100;

  // ==========================================================
  // تحديد الكولداون
  // ==========================================================

  await updateCurrencyData(
    thiefCurrency,
    {
      petLastTheft:
        new Date().toISOString()
    }
  );

  // ==========================================================
  // فشل السرقة
  // ==========================================================

  if (roll > successChance) {

    const fine =
      Math.max(
        50,
        Math.floor(
          thiefMoney * fineRate
        )
      );

    const actualFine =
      Math.min(
        fine,
        thiefMoney
      );

    await thiefCurrency.update({
      money:
        thiefMoney - actualFine
    });

    const targetName =
      await getUserName(
        api,
        targetID
      );

    return api.sendMessage(

      "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n" +

      "❌ فشلت عملية السرقة\n\n" +

      `👤 الهدف: ${targetName}\n` +
      `🎯 نسبة النجاح: ${successChance.toFixed(1)}%\n\n` +

      `💸 الغرامة: -${actualFine} عملة\n` +
      `💳 رصيدك الجديد: ${
        thiefMoney - actualFine
      } عملة`,

      threadID,
      messageID
    );
  }

  // ==========================================================
  // نجاح السرقة
  // ==========================================================

  let stolen =
    Math.floor(
      targetMoney * stealRate
    );

  stolen =
    Math.max(
      1,
      Math.min(
        stolen,
        targetMoney
      )
    );

  await targetCurrency.update({
    money:
      targetMoney - stolen
  });

  await thiefCurrency.update({
    money:
      thiefMoney + stolen
  });

  const targetName =
    await getUserName(
      api,
      targetID
    );

  return api.sendMessage(

    "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n" +

    "✅ نجحت عملية السرقة\n\n" +

    `👤 الهدف: ${targetName}\n` +

    `🎯 نسبة النجاح: ${successChance.toFixed(1)}%\n` +

    `💰 نسبة المسروقات: ${stealRate * 100}%\n\n` +

    `💸 المسروق: +${stolen} عملة\n` +

    `💳 رصيدك الجديد: ${
      thiefMoney + stolen
    } عملة`,

    threadID,
    messageID
  );
}

// ============================================================
// التصدر
// ============================================================

async function getLeaderboard(
  api,
  Pets,
  PetCurrency
) {

  const pets =
    await Pets.findAll({
      order: [
        ["level", "DESC"],
        ["power", "DESC"]
      ]
    });

  const rows = [];

  for (
    const pet of pets
  ) {

    if (rows.length >= 10) {
      break;
    }

    const currency =
      await PetCurrency.findOne({
        where: {
          userID:
            String(pet.userID)
        }
      });

    const money =
      Number(
        currency?.money || 0
      );

    const name =
      await getUserName(
        api,
        pet.userID
      );

    const found =
      getPetByType(
        pet.type
      );

    rows.push({
      name,
      pet:
        `${found?.emoji || "🐾"} ${
          pet.name
        }`,
      level:
        Number(pet.level || 1),
      money
    });
  }

  let text =
    "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n";

  text +=
    "🏆 أعلى 10 متصدرين\n\n";

  if (!rows.length) {
    text +=
      "لا توجد بيانات حتى الآن.";
    return text;
  }

  rows.forEach(
    (row, index) => {

      text +=
        `${index + 1}. ${row.name}\n` +
        `   الحيوان: ${row.pet}\n` +
        `   المستوى: ${row.level}\n` +
        `   الرصيد: ${row.money} عملة\n\n`;
    }
  );

  return text;
}

// ============================================================
// RUN
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
      getModel(
        models,
        "Pets"
      );

    const PetCurrency =
      getModel(
        models,
        "PetCurrency"
      );

    if (!Pets) {
      return api.sendMessage(
        "❌ مودل الحيوانات غير محمّل.",
        threadID,
        messageID
      );
    }

    if (!PetCurrency) {
      return api.sendMessage(
        "❌ مودل PetCurrency غير محمّل.",
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
    // الرصيد
    // ========================================================

    if (
      subCommand === "رصيد" ||
      subCommand === "balance"
    ) {

      const targetID =
        getTargetUserID(event) ||
        String(senderID);

      return sendPetBalance(
        api,
        threadID,
        messageID,
        PetCurrency,
        targetID
      );
    }

    // ========================================================
    // التصدر
    // ========================================================

    if (
      subCommand === "تصدر" ||
      subCommand === "تصدّر" ||
      subCommand === "leaderboard"
    ) {

      const text =
        await getLeaderboard(
          api,
          Pets,
          PetCurrency
        );

      return api.sendMessage(
        text,
        threadID,
        messageID
      );
    }

    // ========================================================
    // متجر
    // ========================================================

    if (
      subCommand === "متجر" ||
      subCommand === "store"
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

          name:
            module.exports.config.name,

          messageID:
            sent.messageID,

          author:
            String(senderID),

          type:
            "pet_shop"
        });
      }

      return;
    }

    // ========================================================
    // القائمة الكاملة للحيوانات
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
    // العمل
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
    // اليومي
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
    // الاستثمار
    // ========================================================

    if (
      subCommand === "استثمار" ||
      subCommand === "invest"
    ) {

      return doInvestment(
        api,
        threadID,
        messageID,
        PetCurrency,
        senderID,
        null
      );
    }

    // ========================================================
    // الاستثمار + مبلغ
    // ========================================================

    const investmentMatch =
      rawArgs.match(
        /^(?:استثمار|invest)\s+([\d,]+)$/i
      );

    if (investmentMatch) {

      return doInvestment(
        api,
        threadID,
        messageID,
        PetCurrency,
        senderID,
        investmentMatch[1]
      );
    }

    // ========================================================
    // الدرع
    // ========================================================

    if (
      subCommand === "درع" ||
      subCommand === "shield"
    ) {

      return useShield(
        api,
        threadID,
        messageID,
        PetCurrency,
        senderID
      );
    }

    // ========================================================
    // السرقة
    // ========================================================

    if (
      subCommand === "سرقة" ||
      subCommand === "سرق" ||
      subCommand === "theft" ||
      subCommand === "steal"
    ) {

      const targetID =
        getTargetUserID(event);

      return doTheft(
        api,
        threadID,
        messageID,
        Pets,
        PetCurrency,
        senderID,
        targetID
      );
    }

    // ========================================================
    // البحث عن حيوان المستخدم
    // ========================================================

    let pet =
      await Pets.findOne({
        where: {
          userID:
            String(senderID)
        }
      });

    if (pet) {

      pet =
        await updatePetOverTime(
          pet
        );
    }

    // ========================================================
    // لديه حيوان
    // ========================================================

    if (pet) {

      const sent =
        await sendReply(
          api,
          getPetInfo(
            pet.toJSON()
          ),
          threadID,
          messageID
        );

      if (sent?.messageID) {

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
    // لا يملك حيوانًا
    // ========================================================

    let text =
      "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n";

    text +=
      "🐾 مرحبًا بك في نظام الحيوانات\n\n";

    text +=
      "لا تملك حيوانًا حتى الآن.\n\n";

    text +=
      "الحيوانات المجانية:\n\n";

    const freePets =
      PETS.filter(
        pet => pet.price === 0
      );

    for (
      const freePet of freePets
    ) {

      text +=
        `${freePet.id}. ${freePet.emoji} ${freePet.name}\n`;
    }

    text +=
      "\n↪️ رد برقم الحيوان لاختياره";

    const sent =
      await sendReply(
        api,
        text,
        threadID,
        messageID
      );

    if (sent?.messageID) {

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

    if (
      handleReply.author &&
      String(handleReply.author) !==
      String(senderID)
    ) {
      return;
    }

    const Pets =
      getModel(
        models,
        "Pets"
      );

    const PetCurrency =
      getModel(
        models,
        "PetCurrency"
      );

    if (!Pets || !PetCurrency) {
      return;
    }

    const input =
      String(body)
        .trim();

    // ========================================================
    // اختيار الحيوان
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
        getPetByID(number);

      if (!selected) {
        return api.sendMessage(
          `❌ رقم الحيوان غير صحيح.\n\nاختر رقمًا من 1 إلى ${PETS.length}.`,
          threadID,
          messageID
        );
      }

      const existing =
        await Pets.findOne({
          where: {
            userID:
              String(senderID)
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

      if (
        selected.price > 0
      ) {

        return api.sendMessage(
          "❌ هذا الحيوان غير مجاني.\n\n" +
          "يمكنك شراؤه من متجر الحيوانات.",
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

      removeReply(
        handleReply
      );

      return api.sendMessage(
        message,
        threadID,
        messageID
      );
    }

    // ========================================================
    // المتجر
    // ========================================================

    if (
      handleReply.type ===
      "pet_shop"
    ) {

      const answer =
        input.toLowerCase();

      let item =
        SHOP.find(
          shop =>
            answer ===
              shop.name.toLowerCase()
        );

      if (!item) {

        if (
          answer.includes("طعام") ||
          answer.includes("اكل") ||
          answer.includes("أكل")
        ) {
          item = SHOP.find(
            x => x.id === "food"
          );
        }

        else if (
          answer.includes("دواء")
        ) {
          item = SHOP.find(
            x => x.id === "medicine"
          );
        }

        else if (
          answer.includes("درع")
        ) {
          item = SHOP.find(
            x => x.id === "shield"
          );
        }

        else if (
          answer.includes("بطاقة") ||
          answer.includes("استثمار")
        ) {
          item = SHOP.find(
            x => x.id === "investment_card"
          );
        }
      }

      if (!item) {

        return api.sendMessage(

          "❌ المنتج غير موجود.\n\n" +

          "يمكنك شراء:\n" +
          "طعام الحيوان\n" +
          "دواء الحيوان\n" +
          "درع الحماية\n" +
          "بطاقة الاستثمار",

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
        Number(
          currency.money || 0
        );

      if (
        money < item.price
      ) {

        return api.sendMessage(

          "❌ رصيدك غير كافٍ.\n\n" +

          `المنتج: ${item.name}\n` +
          `السعر: ${item.price} عملة\n` +
          `رصيدك: ${money} عملة\n` +
          `ينقصك: ${item.price - money} عملة`,

          threadID,
          messageID
        );
      }

      const data =
        getCurrencyData(
          currency
        );

      // ======================================================
      // الطعام
      // ======================================================

      if (
        item.id === "food"
      ) {

        const pet =
          await Pets.findOne({
            where: {
              userID:
                String(senderID)
            }
          });

        if (!pet) {
          return api.sendMessage(
            "❌ يجب أن تملك حيوانًا لشراء الطعام.",
            threadID,
            messageID
          );
        }

        await currency.update({
          money:
            money - item.price
        });

        data.food =
          Number(data.food || 0) + 1;

        await updateCurrencyData(
          currency,
          {
            food:
              data.food
          }
        );

        removeReply(handleReply);

        return api.sendMessage(

          "🍖 تم شراء طعام الحيوان.\n\n" +

          `💰 السعر: ${item.price} عملة\n` +
          `🍖 الطعام لديك: ${data.food}\n` +
          `💳 رصيدك: ${money - item.price} عملة`,

          threadID,
          messageID
        );
      }

      // ======================================================
      // الدواء
      // ======================================================

      if (
        item.id === "medicine"
      ) {

        const pet =
          await Pets.findOne({
            where: {
              userID:
                String(senderID)
            }
          });

        if (!pet) {
          return api.sendMessage(
            "❌ يجب أن تملك حيوانًا لشراء الدواء.",
            threadID,
            messageID
          );
        }

        await currency.update({
          money:
            money - item.price
        });

        data.medicine =
          Number(data.medicine || 0) + 1;

        await updateCurrencyData(
          currency,
          {
            medicine:
              data.medicine
          }
        );

        removeReply(handleReply);

        return api.sendMessage(

          "💊 تم شراء دواء الحيوان.\n\n" +

          `💰 السعر: ${item.price} عملة\n` +
          `💊 الأدوية لديك: ${data.medicine}\n` +
          `💳 رصيدك: ${money - item.price} عملة`,

          threadID,
          messageID
        );
      }

      // ======================================================
      // الدرع
      // ======================================================

      if (
        item.id === "shield"
      ) {

        await currency.update({
          money:
            money - item.price
        });

        data.shields =
          Number(data.shields || 0) + 1;

        await updateCurrencyData(
          currency,
          {
            shields:
              data.shields
          }
        );

        removeReply(handleReply);

        return api.sendMessage(

          "🛡️ تم شراء درع الحماية.\n\n" +

          `💰 السعر: ${item.price} عملة\n` +
          `🛡️ الدروع لديك: ${data.shields}\n` +
          `💳 رصيدك: ${money - item.price} عملة\n\n` +

          "اكتب حيوان درع لتفعيل الدرع لمدة 24 ساعة.",

          threadID,
          messageID
        );
      }

      // ======================================================
      // بطاقة الاستثمار
      // ======================================================

      if (
        item.id === "investment_card"
      ) {

        await currency.update({
          money:
            money - item.price
        });

        data.investmentCards =
          Number(
            data.investmentCards || 0
          ) + 1;

        await updateCurrencyData(
          currency,
          {
            investmentCards:
              data.investmentCards
          }
        );

        removeReply(handleReply);

        return api.sendMessage(

          "🎫 تم شراء بطاقة الاستثمار.\n\n" +

          `💰 السعر: ${item.price} عملة\n` +
          `🎫 البطاقات لديك: ${data.investmentCards}\n` +
          `💳 رصيدك: ${money - item.price} عملة\n\n` +

          "ستُستخدم تلقائيًا في عملية الاستثمار القادمة وتمنحك +50%.",

          threadID,
          messageID
        );
      }
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
            userID:
              String(senderID)
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
        await updatePetOverTime(
          pet
        );

      const choice =
        Number(input);

      // ======================================================
      // البيع
      // ======================================================

      if (
        choice === 1
      ) {

        const data =
          pet.toJSON();

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

        const currency =
          await getPetCurrency(
            PetCurrency,
            senderID
          );

        const data =
          getCurrencyData(
            currency
          );

        const food =
          Number(
            data.food || 0
          );

        // إذا كان لديه طعام يستخدمه
        if (food > 0) {

          const hunger =
            Number(
              pet.hunger ?? 100
            );

          const newHunger =
            Math.min(
              100,
              hunger + 30
            );

          const health =
            Number(
              pet.health ?? 100
            );

          const status =
            calculatePetState(
              health,
              newHunger
            );

          await pet.update({
            hunger:
              newHunger,
            status
          });

          data.food =
            food - 1;

          await updateCurrencyData(
            currency,
            {
              food:
                data.food
            }
          );

          removeReply(handleReply);

          return api.sendMessage(

            "🍖 تم إطعام الحيوان\n\n" +

            `🐾 الحيوان: ${pet.name}\n` +
            `🍖 الشبع: ${newHunger}/100\n` +
            `❤️ الصحة: ${health}/100\n` +
            `📦 الطعام المتبقي: ${data.food}\n` +
            `الحالة: ${status}`,

            threadID,
            messageID
          );
        }

        return api.sendMessage(

          "❌ لا تملك طعامًا.\n\n" +

          "يمكنك شراء الطعام من:\n" +
          "حيوان متجر",

          threadID,
          messageID
        );
      }

      // ======================================================
      // التدريب
      // ======================================================

      if (
        choice === 3
      ) {

        const remaining =
          getRemainingCooldown(
            pet.lastTrain,
            TRAIN_COOLDOWN
          );

        if (
          remaining > 0
        ) {

          return api.sendMessage(

            "❌ حيوانك يحتاج إلى الراحة.\n\n" +

            `⏳ الوقت المتبقي: ${
              formatTime(remaining)
            }`,

            threadID,
            messageID
          );
        }

        const currentLevel =
          Number(
            pet.level || 1
          );

        const currentExp =
          Number(
            pet.exp || 0
          );

        const currentPower =
          Number(
            pet.power || 0
          );

        let newLevel =
          currentLevel;

        let newExp =
          currentExp + TRAIN_XP;

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

        const newHunger =
          Math.max(
            0,
            Number(
              pet.hunger ?? 100
            ) - 10
          );

        const health =
          Number(
            pet.health ?? 100
          );

        const status =
          calculatePetState(
            health,
            newHunger
          );

        await pet.update({

          exp:
            newExp,

          level:
            newLevel,

          power:
            newPower,

          hunger:
            newHunger,

          status,

          lastTrain:
            new Date()
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

        if (
          levelsGained > 0
        ) {

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

      const answer =
        input.toLowerCase();

      if (
        answer === "لا" ||
        answer === "الغاء" ||
        answer === "إلغاء"
      ) {

        removeReply(handleReply);

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

        removeReply(handleReply);

        return api.sendMessage(
          "❌ لا تملك حيوانًا.",
          threadID,
          messageID
        );
      }

      const sellPrice =
        getSellPrice(
          pet.toJSON()
        );

      const currency =
        await getPetCurrency(
          PetCurrency,
          senderID
        );

      const money =
        Number(
          currency.money || 0
        );

      await currency.update({
        money:
          money + sellPrice
      });

      const petName =
        pet.name;

      await pet.destroy();

      removeReply(handleReply);

      return api.sendMessage(

        "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n" +

        `تم بيع ${petName} بنجاح\n\n` +

        `قيمة البيع: ${sellPrice} عملة\n` +
        `رصيد الحيوانات الجديد: ${
          money + sellPrice
        } عملة`,

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