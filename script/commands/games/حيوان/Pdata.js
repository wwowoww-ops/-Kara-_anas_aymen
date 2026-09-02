/**
 * Pdata.js
 * طبقة التعامل مع بيانات نظام الحيوانات
 *
 * لا ينشئ قاعدة بيانات جديدة
 * ولا يغير أسماء الحقول الموجودة في النظام الحالي
 */

"use strict";

/**
 * تحويل userID إلى قيمة مناسبة للبحث في PostgreSQL
 */
function normalizeUserID(userID) {
  if (userID === undefined || userID === null) {
    throw new Error("userID is required");
  }

  return String(userID);
}

/**
 * الحصول على موديل Pets
 */
function getPetsModel(models) {
  if (!models) {
    throw new Error("Database models are required");
  }

  if (typeof models.use === "function") {
    const Pets = models.use("Pets");
    if (Pets) return Pets;
  }

  if (models.Pets) return models.Pets;

  throw new Error("Pets model not found");
}

/**
 * الحصول على موديل PetCurrency
 */
function getPetCurrencyModel(models) {
  if (!models) {
    throw new Error("Database models are required");
  }

  if (typeof models.use === "function") {
    const PetCurrency = models.use("PetCurrency");
    if (PetCurrency) return PetCurrency;
  }

  if (models.PetCurrency) return models.PetCurrency;

  throw new Error("PetCurrency model not found");
}

/* =========================================================
   PET
========================================================= */

/**
 * جلب حيوان المستخدم
 */
async function getPet(Pets, userID) {
  const id = normalizeUserID(userID);

  return await Pets.findOne({
    where: {
      userID: id
    }
  });
}

/**
 * التحقق من امتلاك المستخدم لحيوان
 */
async function hasPet(Pets, userID) {
  const pet = await getPet(Pets, userID);
  return !!pet;
}

/**
 * إنشاء حيوان جديد
 */
async function createPet(Pets, userID, petData = {}) {
  const id = normalizeUserID(userID);

  const existingPet = await getPet(Pets, id);

  if (existingPet) {
    throw new Error("USER_ALREADY_HAS_PET");
  }

  const level = Number.isFinite(Number(petData.level))
    ? Number(petData.level)
    : 0;

  const stars = Number.isFinite(Number(petData.stars))
    ? Number(petData.stars)
    : 0;

  if (level < 0 || level > 60) {
    throw new Error("INVALID_LEVEL");
  }

  if (stars < 0 || stars > 5) {
    throw new Error("INVALID_STARS");
  }

  return await Pets.create({
    userID: id,

    type: petData.type,
    name: petData.name,
    rarity: petData.rarity || "شائع",

    power: Number.isFinite(Number(petData.power))
      ? Number(petData.power)
      : 5,

    level,

    stars,

    exp: Number.isFinite(Number(petData.exp))
      ? Number(petData.exp)
      : 0,

    health: Number.isFinite(Number(petData.health))
      ? Number(petData.health)
      : 100,

    hunger: Number.isFinite(Number(petData.hunger))
      ? Number(petData.hunger)
      : 100,

    status: petData.status || "سعيد",

    lastTrain: petData.lastTrain || null
  });
}

/**
 * تحديث بيانات الحيوان
 */
async function updatePet(pet, changes = {}) {
  if (!pet) {
    throw new Error("PET_NOT_FOUND");
  }

  const allowedFields = [
    "type",
    "name",
    "rarity",
    "power",
    "level",
    "stars",
    "exp",
    "health",
    "hunger",
    "status",
    "lastTrain"
  ];

  const safeChanges = {};

  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(changes, field)) {
      safeChanges[field] = changes[field];
    }
  }

  if (
    Object.prototype.hasOwnProperty.call(safeChanges, "level")
  ) {
    const level = Number(safeChanges.level);

    if (
      !Number.isFinite(level) ||
      level < 0 ||
      level > 60
    ) {
      throw new Error("INVALID_LEVEL");
    }

    safeChanges.level = level;
  }

  if (
    Object.prototype.hasOwnProperty.call(safeChanges, "stars")
  ) {
    const stars = Number(safeChanges.stars);

    if (
      !Number.isFinite(stars) ||
      stars < 0 ||
      stars > 5
    ) {
      throw new Error("INVALID_STARS");
    }

    safeChanges.stars = stars;
  }

  if (
    Object.prototype.hasOwnProperty.call(safeChanges, "exp")
  ) {
    const exp = Number(safeChanges.exp);

    if (!Number.isFinite(exp) || exp < 0) {
      throw new Error("INVALID_EXP");
    }

    safeChanges.exp = exp;
  }

  if (Object.keys(safeChanges).length > 0) {
    await pet.update(safeChanges);
  }

  return pet;
}

/**
 * حذف حيوان
 */
async function deletePet(pet) {
  if (!pet) {
    throw new Error("PET_NOT_FOUND");
  }

  await pet.destroy();

  return true;
}

/**
 * حفظ الحيوان بعد تعديل الخصائص مباشرة
 */
async function savePet(pet) {
  if (!pet) {
    throw new Error("PET_NOT_FOUND");
  }

  await pet.save();

  return pet;
}

/* =========================================================
   CURRENCY
========================================================= */

/**
 * جلب محفظة نظام الحيوانات
 * وإذا لم تكن موجودة يتم إنشاؤها
 */
async function getPetCurrency(PetCurrency, userID) {
  const id = normalizeUserID(userID);

  let currency = await PetCurrency.findOne({
    where: {
      userID: id
    }
  });

  if (!currency) {
    currency = await PetCurrency.create({
      userID: id,
      money: 0,
      data: {}
    });
  }

  return currency;
}

/**
 * قراءة data بأمان
 */
function getCurrencyData(currency) {
  if (!currency) {
    throw new Error("CURRENCY_NOT_FOUND");
  }

  let data = currency.data;

  if (!data) {
    return {};
  }

  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch {
      return {};
    }
  }

  if (
    typeof data !== "object" ||
    Array.isArray(data)
  ) {
    return {};
  }

  return {
    ...data
  };
}

/**
 * تحديث جزء من data بدون حذف البيانات القديمة
 */
async function updateCurrencyData(currency, changes = {}) {
  if (!currency) {
    throw new Error("CURRENCY_NOT_FOUND");
  }

  const oldData = getCurrencyData(currency);

  const newData = {
    ...oldData,
    ...changes
  };

  currency.set("data", newData);

  await currency.save();

  return newData;
}

/* =========================================================
   MONEY
========================================================= */

/**
 * الحصول على الرصيد
 */
function getMoney(currency) {
  if (!currency) {
    return 0;
  }

  const money = Number(currency.money);

  return Number.isFinite(money) ? money : 0;
}

/**
 * إضافة أموال
 */
async function addMoney(currency, amount) {
  if (!currency) {
    throw new Error("CURRENCY_NOT_FOUND");
  }

  amount = Number(amount);

  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("INVALID_AMOUNT");
  }

  const newMoney = getMoney(currency) + amount;

  currency.set("money", newMoney);

  await currency.save();

  return newMoney;
}

/**
 * خصم أموال
 */
async function removeMoney(currency, amount) {
  if (!currency) {
    throw new Error("CURRENCY_NOT_FOUND");
  }

  amount = Number(amount);

  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("INVALID_AMOUNT");
  }

  const currentMoney = getMoney(currency);

  if (currentMoney < amount) {
    throw new Error("INSUFFICIENT_FUNDS");
  }

  const newMoney = currentMoney - amount;

  currency.set("money", newMoney);

  await currency.save();

  return newMoney;
}

/**
 * التحقق من امتلاك مبلغ معين
 */
function hasMoney(currency, amount) {
  amount = Number(amount);

  if (!Number.isFinite(amount) || amount < 0) {
    return false;
  }

  return getMoney(currency) >= amount;
}

/* =========================================================
   BAG
========================================================= */

/**
 * الحصول على محتويات حقيبة الحيوان
 */
function getBag(currency) {
  const data = getCurrencyData(currency);

  return {
    food: Number(data.food) || 0,
    medicine: Number(data.medicine) || 0,
    shields: Number(data.shields) || 0,
    investmentCards: Number(data.investmentCards) || 0
  };
}

/**
 * تعديل عنصر في الحقيبة
 */
async function updateBagItem(currency, item, amount) {
  const validItems = [
    "food",
    "medicine",
    "shields",
    "investmentCards"
  ];

  if (!validItems.includes(item)) {
    throw new Error("INVALID_BAG_ITEM");
  }

  amount = Number(amount);

  if (!Number.isFinite(amount)) {
    throw new Error("INVALID_AMOUNT");
  }

  const data = getCurrencyData(currency);

  const current = Number(data[item]) || 0;

  const newValue = current + amount;

  if (newValue < 0) {
    throw new Error("INSUFFICIENT_ITEM");
  }

  data[item] = newValue;

  currency.set("data", data);

  await currency.save();

  return newValue;
}

/* =========================================================
   COMBINED
========================================================= */

/**
 * جلب الحيوان والمحفظة معًا
 */
async function getPlayerData(models, userID) {
  const Pets = getPetsModel(models);
  const PetCurrency = getPetCurrencyModel(models);

  const id = normalizeUserID(userID);

  const [pet, currency] = await Promise.all([
    getPet(Pets, id),
    getPetCurrency(PetCurrency, id)
  ]);

  return {
    pet,
    currency,
    data: getCurrencyData(currency),
    bag: getBag(currency),
    money: getMoney(currency)
  };
}

/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
  // Models
  getPetsModel,
  getPetCurrencyModel,

  // Pet
  getPet,
  hasPet,
  createPet,
  updatePet,
  deletePet,
  savePet,

  // Currency
  getPetCurrency,
  getCurrencyData,
  updateCurrencyData,

  // Money
  getMoney,
  addMoney,
  removeMoney,
  hasMoney,

  // Bag
  getBag,
  updateBagItem,

  // Combined
  getPlayerData
};