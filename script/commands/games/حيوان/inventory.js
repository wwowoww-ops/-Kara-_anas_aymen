/**
 * inventory.js
 * حقيبة موارد نظام الحيوانات
 *
 * يعرض جميع الموارد التي يمتلكها اللاعب
 *
 * لا ينشئ قاعدة بيانات
 * ولا يغير أسماء الحقول الموجودة
 */

"use strict";

const Pdata = require("./Pdata");

// =========================================================
// الإعدادات
// =========================================================

const INVENTORY_HEADER = "⌬ ━━ 𝗛𝗜𝗡𝗔 BAG ━━ ⌬";

// =========================================================
// الموارد
// =========================================================

const INVENTORY_ITEMS = [
  {
    id: "food",
    name: "طعام الحيوان",
    emoji: "🍖",
    field: "food",
    description: "يستخدم لإطعام الحيوان"
  },

  {
    id: "medicine",
    name: "دواء الحيوان",
    emoji: "💊",
    field: "medicine",
    description: "يستخدم لعلاج الحيوان"
  },

  {
    id: "shields",
    name: "درع الحماية",
    emoji: "🛡️",
    field: "shields",
    description: "يحمي من عمليات السرقة"
  },

  {
    id: "investmentCards",
    name: "بطاقة الاستثمار",
    emoji: "🎫",
    field: "investmentCards",
    description: "تستخدم في نظام الاستثمار"
  },

  {
    id: "xpCards",
    name: "بطاقة مضاعفة XP",
    emoji: "⚡",
    field: "xpCards",
    description: "تضاعف XP لتدريب واحد"
  },

  {
    id: "trainingBoosters",
    name: "منشّط التدريب",
    emoji: "🧪",
    field: "trainingBoosters",
    description: "يزيد XP التدريب بنسبة 50%"
  },

  {
    id: "developmentStones",
    name: "حجر التطوير",
    emoji: "💎",
    field: "developmentStones",
    description: "يستخدم لاحقًا في الدمج والتطوير"
  }
];

// =========================================================
// تنسيق الأرقام
// =========================================================

function formatNumber(number) {
  return Number(number || 0).toLocaleString("en-US");
}

// =========================================================
// قراءة كمية مورد
// =========================================================

function getItemAmount(data, field) {
  const amount = Number(data?.[field]);

  if (!Number.isFinite(amount) || amount < 0) {
    return 0;
  }

  return amount;
}

// =========================================================
// الحصول على بيانات الحقيبة
// =========================================================

function getInventoryData(currency) {
  const data = Pdata.getCurrencyData(currency);

  const inventory = {};

  for (const item of INVENTORY_ITEMS) {
    inventory[item.field] =
      getItemAmount(data, item.field);
  }

  return inventory;
}

// =========================================================
// الحصول على مورد معين
// =========================================================

function getInventoryItem(field) {
  return INVENTORY_ITEMS.find(
    item => item.field === field
  );
}

// =========================================================
// عدد الموارد الكلي
// =========================================================

function getTotalItems(currency) {
  const inventory =
    getInventoryData(currency);

  return INVENTORY_ITEMS.reduce(
    (total, item) => {
      return total + (
        Number(inventory[item.field]) || 0
      );
    },
    0
  );
}

// =========================================================
// بناء رسالة الحقيبة
// =========================================================

function buildInventoryMessage(currency) {
  const inventory =
    getInventoryData(currency);

  const money =
    Pdata.getMoney(currency);

  let message =
    `${INVENTORY_HEADER}\n\n`;

  message +=
    "🎒 حقيبة موارد الحيوانات\n\n";

  for (const item of INVENTORY_ITEMS) {
    const amount =
      inventory[item.field];

    message +=
      `${item.emoji} ${item.name}\n`;

    message +=
      `   الكمية: ×${formatNumber(amount)}\n`;

    message +=
      `   └ ${item.description}\n\n`;
  }

  message +=
    "━━━━━━━━━━━━━━━━━━\n";

  message +=
    `💰 الرصيد: ${formatNumber(money)} عملة\n`;

  message +=
    `📦 مجموع الموارد: ${formatNumber(
      getTotalItems(currency)
    )}`;

  return message;
}

// =========================================================
// عرض الحقيبة
// =========================================================

async function openInventory({
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
    const PetCurrency =
      Pdata.getPetCurrencyModel(
        models
      );

    const currency =
      await Pdata.getPetCurrency(
        PetCurrency,
        senderID
      );

    const message =
      buildInventoryMessage(
        currency
      );

    return api.sendMessage(
      message,
      threadID,
      messageID
    );
  } catch (error) {
    console.error(
      "[HINA INVENTORY ERROR]",
      error
    );

    return api.sendMessage(
      `${INVENTORY_HEADER}\n\n` +
      "❌ تعذر فتح الحقيبة.\n\n" +
      `📝 ${error.message || "خطأ غير معروف"}`,
      threadID,
      messageID
    );
  }
}

// =========================================================
// التحقق من امتلاك مورد
// =========================================================

function hasItem(
  currency,
  field,
  amount = 1
) {
  const inventory =
    getInventoryData(currency);

  const required =
    Number(amount);

  if (
    !Number.isFinite(required) ||
    required < 0
  ) {
    return false;
  }

  return (
    inventory[field] >= required
  );
}

// =========================================================
// استخدام مورد
// =========================================================

async function useItem(
  currency,
  field,
  amount = 1
) {
  const item =
    getInventoryItem(field);

  if (!item) {
    throw new Error(
      "INVALID_INVENTORY_ITEM"
    );
  }

  amount =
    Number(amount);

  if (
    !Number.isSafeInteger(amount) ||
    amount <= 0
  ) {
    throw new Error(
      "INVALID_AMOUNT"
    );
  }

  const inventory =
    getInventoryData(currency);

  const current =
    inventory[field] || 0;

  if (current < amount) {
    throw new Error(
      "INSUFFICIENT_ITEM"
    );
  }

  await Pdata.updateCurrencyData(
    currency,
    {
      [field]:
        current - amount
    }
  );

  return current - amount;
}

// =========================================================
// إضافة مورد
// =========================================================

async function addItem(
  currency,
  field,
  amount = 1
) {
  const item =
    getInventoryItem(field);

  if (!item) {
    throw new Error(
      "INVALID_INVENTORY_ITEM"
    );
  }

  amount =
    Number(amount);

  if (
    !Number.isSafeInteger(amount) ||
    amount <= 0
  ) {
    throw new Error(
      "INVALID_AMOUNT"
    );
  }

  const inventory =
    getInventoryData(currency);

  const current =
    inventory[field] || 0;

  const newAmount =
    current + amount;

  if (
    !Number.isSafeInteger(newAmount)
  ) {
    throw new Error(
      "ITEM_AMOUNT_TOO_LARGE"
    );
  }

  await Pdata.updateCurrencyData(
    currency,
    {
      [field]:
        newAmount
    }
  );

  return newAmount;
}

// =========================================================
// إزالة مورد
// =========================================================

async function removeItem(
  currency,
  field,
  amount = 1
) {
  return useItem(
    currency,
    field,
    amount
  );
}

// =========================================================
// الحصول على كل الموارد
// =========================================================

function getAllItems() {
  return [
    ...INVENTORY_ITEMS
  ];
}

// =========================================================
// EXPORTS
// =========================================================

module.exports = {
  INVENTORY_HEADER,

  INVENTORY_ITEMS,

  formatNumber,

  getInventoryData,

  getInventoryItem,

  getTotalItems,

  buildInventoryMessage,

  openInventory,

  hasItem,

  useItem,

  addItem,

  removeItem,

  getAllItems
};