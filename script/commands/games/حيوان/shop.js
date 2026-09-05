"use strict";

/**
 * ============================================================
 * HINA SHOP
 * متجر موارد نظام الحيوانات
 *
 * طريقة الاستخدام:
 * حيوان متجر
 *
 * ثم الرد على رسالة المتجر برقم المورد
 * ثم الرد بالكمية المطلوبة
 *
 * ============================================================
 */

const Pdata = require("./Pdata");

// ============================================================
// الإعدادات
// ============================================================

const SHOP_HEADER = "⌬ ━━ 𝗛𝗜𝗡𝗔 SHOP ━━ ⌬";

const MAX_PURCHASE_QUANTITY = 100;

// ============================================================
// المنتجات
// ============================================================

const SHOP_ITEMS = [
  {
    id: "food",
    number: 1,
    name: "طعام الحيوان",
    price: 2500,
    emoji: "🍖",
    description: "يستخدم لإطعام الحيوان وزيادة الجوع",
    bagField: "food"
  },

  {
    id: "medicine",
    number: 2,
    name: "دواء الحيوان",
    price: 7500,
    emoji: "💊",
    description: "يستخدم لعلاج الحيوان واستعادة حالته",
    bagField: "medicine"
  },

  {
    id: "shield",
    number: 3,
    name: "درع الحماية",
    price: 50000,
    emoji: "🛡️",
    description: "يستخدم لحماية مواردك من بعض عمليات السرقة",
    bagField: "shields"
  },

  {
    id: "investment_card",
    number: 4,
    name: "بطاقة الاستثمار",
    price: 75000,
    emoji: "🎫",
    description: "تستخدم للحصول على أرباح استثمارية",
    bagField: "investmentCards"
  },

  {
    id: "xp_card",
    number: 5,
    name: "بطاقة مضاعفة XP",
    price: 150000,
    emoji: "⚡",
    description: "تضاعف XP من تدريب واحد ×2",
    bagField: "xpCards"
  },

  {
    id: "training_booster",
    number: 6,
    name: "منشّط التدريب",
    price: 300000,
    emoji: "🧪",
    description: "يزيد XP المكتسب من التدريب بنسبة 50%",
    bagField: "trainingBoosters"
  },

  {
    id: "development_stone",
    number: 7,
    name: "حجر التطوير",
    price: 1000000,
    emoji: "💎",
    description: "مورد نادر يستخدم لاحقًا في الدمج والتطوير",
    bagField: "developmentStones"
  }
];

// ============================================================
// تنسيق الأرقام
// ============================================================

function formatNumber(number) {
  return Number(number || 0).toLocaleString("en-US");
}

// ============================================================
// الحصول على المنتج
// ============================================================

function getItemByID(id) {
  return SHOP_ITEMS.find(
    item => item.id === id
  );
}

function getItemByNumber(number) {
  const numericNumber = Number(number);

  if (!Number.isInteger(numericNumber)) {
    return null;
  }

  return SHOP_ITEMS.find(
    item => item.number === numericNumber
  );
}

// ============================================================
// التحقق من الكمية
// ============================================================

function parseQuantity(input) {
  if (!input) {
    return null;
  }

  const text = String(input)
    .trim()
    .replace(/,/g, "");

  if (!/^\d+$/.test(text)) {
    return null;
  }

  const quantity = Number(text);

  if (!Number.isSafeInteger(quantity)) {
    return null;
  }

  if (quantity < 1) {
    return null;
  }

  if (quantity > MAX_PURCHASE_QUANTITY) {
    return null;
  }

  return quantity;
}

// ============================================================
// الحصول على الموديل
// ============================================================

function getModel(models, name) {
  try {
    if (
      models &&
      typeof models.use === "function"
    ) {
      const model = models.use(name);

      if (model) {
        return model;
      }
    }
  } catch (error) {
    console.error(
      `[HINA SHOP] Failed to load model ${name}:`,
      error
    );
  }

  if (
    models &&
    models[name]
  ) {
    return models[name];
  }

  if (
    global.models &&
    global.models[name]
  ) {
    return global.models[name];
  }

  return null;
}

// ============================================================
// إضافة Reply
// ============================================================

function addReply(data) {
  if (!global.client) {
    return;
  }

  if (
    !Array.isArray(
      global.client.handleReply
    )
  ) {
    global.client.handleReply = [];
  }

  global.client.handleReply.push(data);
}

// ============================================================
// حذف Reply
// ============================================================

function removeReply(handleReply) {
  try {
    if (
      !Array.isArray(
        global.client.handleReply
      )
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
  } catch (error) {
    console.error(
      "[HINA SHOP] Reply remove error:",
      error
    );
  }
}

// ============================================================
// إرسال رسالة
// ============================================================

function sendMessage(
  api,
  message,
  threadID,
  replyTo
) {
  return new Promise(resolve => {
    api.sendMessage(
      message,
      threadID,
      (error, info) => {
        if (error) {
          console.error(
            "[HINA SHOP] Send error:",
            error
          );

          resolve(null);
          return;
        }

        resolve(info);
      },
      replyTo
    );
  });
}

// ============================================================
// عرض المتجر
// ============================================================

function getShopList() {
  let message =
    `${SHOP_HEADER}\n\n`;

  message +=
    "🛒 متجر موارد الحيوانات\n\n";

  SHOP_ITEMS.forEach(item => {
    message +=
      `${item.number}. ${item.emoji} ${item.name}\n`;

    message +=
      `   💰 ${formatNumber(item.price)} عملة\n`;

    message +=
      `   └ ${item.description}\n\n`;
  });

  message +=
    "━━━━━━━━━━━━━━━━━━\n";

  message +=
    `↪️ رد برقم المنتج لاختياره\n`;

  message +=
    `🔢 الحد الأقصى للكمية: ${MAX_PURCHASE_QUANTITY}`;

  return message;
}

// ============================================================
// فتح المتجر
// ============================================================

async function openShop({
  api,
  event
}) {
  const {
    threadID,
    messageID,
    senderID
  } = event;

  const sent =
    await sendMessage(
      api,
      getShopList(),
      threadID,
      messageID
    );

  if (
    !sent ||
    !sent.messageID
  ) {
    return;
  }

  addReply({
    name: "حيوان",

    messageID:
      sent.messageID,

    author:
      String(senderID),

    type:
      "pet_shop"
  });
}

// ============================================================
// رسالة اختيار الكمية
// ============================================================

function getQuantityMessage(item) {
  return (
    `${SHOP_HEADER}\n\n` +

    `${item.emoji} ${item.name}\n\n` +

    `💰 سعر الوحدة: ${formatNumber(item.price)} عملة\n\n` +

    "🔢 أرسل الآن الكمية التي تريد شراءها.\n\n" +

    "مثال:\n" +

    "10\n\n" +

    `الحد الأقصى: ${MAX_PURCHASE_QUANTITY}`
  );
}

// ============================================================
// تنفيذ الشراء
// ============================================================

async function purchaseItem({
  api,
  event,
  models,
  item,
  quantity,
  handleReply
}) {
  const {
    threadID,
    messageID,
    senderID
  } = event;

  const PetCurrency =
    getModel(
      models,
      "PetCurrency"
    );

  if (!PetCurrency) {
    return sendMessage(
      api,
      `${SHOP_HEADER}\n\n` +
      "❌ تعذر الوصول إلى بيانات محفظتك.",
      threadID,
      messageID
    );
  }

  try {
    // ========================================================
    // جلب بيانات اللاعب
    // ========================================================

    const currency =
      await Pdata.getPetCurrency(
        PetCurrency,
        senderID
      );

    if (!currency) {
      return sendMessage(
        api,
        `${SHOP_HEADER}\n\n` +
        "❌ لم يتم العثور على بيانات محفظتك.",
        threadID,
        messageID
      );
    }

    // ========================================================
    // الرصيد الحالي
    // ========================================================

    const money =
      Number(
        Pdata.getMoney(currency)
      );

    // ========================================================
    // السعر الإجمالي
    // ========================================================

    const totalPrice =
      item.price * quantity;

    if (
      !Number.isSafeInteger(
        totalPrice
      )
    ) {
      return sendMessage(
        api,
        `${SHOP_HEADER}\n\n` +
        "❌ قيمة الشراء كبيرة جدًا.",
        threadID,
        messageID
      );
    }

    // ========================================================
    // التحقق من الرصيد
    // ========================================================

    if (
      money < totalPrice
    ) {
      const missing =
        totalPrice - money;

      return sendMessage(
        api,

        `${SHOP_HEADER}\n\n` +

        "❌ رصيدك غير كافٍ.\n\n" +

        `${item.emoji} ${item.name}\n` +

        `🔢 الكمية: ×${formatNumber(quantity)}\n` +

        `💰 سعر الوحدة: ${formatNumber(item.price)}\n` +

        `💵 السعر الإجمالي: ${formatNumber(totalPrice)}\n\n` +

        `💳 رصيدك: ${formatNumber(money)}\n` +

        `❌ ينقصك: ${formatNumber(missing)} عملة`,

        threadID,
        messageID
      );
    }

    // ========================================================
    // قراءة الحقيبة
    // ========================================================

    const data =
      Pdata.getCurrencyData(
        currency
      );

    const currentAmount =
      Number(
        data[item.bagField] || 0
      );

    const newAmount =
      currentAmount + quantity;

    if (
      !Number.isSafeInteger(
        newAmount
      )
    ) {
      return sendMessage(
        api,
        `${SHOP_HEADER}\n\n` +
        "❌ وصلت كمية هذا المورد إلى حد كبير جدًا.",
        threadID,
        messageID
      );
    }

    // ========================================================
    // خصم المال
    // ========================================================

    await Pdata.removeMoney(
      currency,
      totalPrice
    );

    // ========================================================
    // إضافة المورد
    // ========================================================

    await Pdata.updateCurrencyData(
      currency,
      {
        [item.bagField]:
          newAmount
      }
    );

    // ========================================================
    // إزالة حالة الرد
    // ========================================================

    removeReply(handleReply);

    // ========================================================
    // معلومات إضافية
    // ========================================================

    let extra = "";

    if (
      item.id === "xp_card"
    ) {
      extra =
        "\n\n⚡ البطاقة جاهزة للاستخدام في التدريب.";
    }

    if (
      item.id === "training_booster"
    ) {
      extra =
        "\n\n🧪 المنشّط جاهز لرفع XP التدريب بنسبة 50%.";
    }

    if (
      item.id === "development_stone"
    ) {
      extra =
        "\n\n💎 سيتم استخدام حجر التطوير في أنظمة الدمج والتطوير.";
    }

    if (
      item.id === "shield"
    ) {
      extra =
        "\n\n🛡️ يمكنك استخدام الدرع من نظام الحماية.";
    }

    if (
      item.id === "investment_card"
    ) {
      extra =
        "\n\n🎫 البطاقة جاهزة للاستخدام في الاستثمار.";
    }

    // ========================================================
    // رسالة النجاح
    // ========================================================

    return sendMessage(
      api,

      `${SHOP_HEADER}\n\n` +

      "✅ تمت عملية الشراء بنجاح\n\n" +

      `${item.emoji} ${item.name}\n` +

      `🔢 الكمية: ×${formatNumber(quantity)}\n` +

      `💰 سعر الوحدة: ${formatNumber(item.price)} عملة\n` +

      `💵 المبلغ المدفوع: ${formatNumber(totalPrice)} عملة\n\n` +

      `${item.emoji} الكمية لديك الآن: ×${formatNumber(newAmount)}\n` +

      `💳 رصيدك الجديد: ${formatNumber(
        money - totalPrice
      )} عملة` +

      extra,

      threadID,
      messageID
    );
  } catch (error) {
    console.error(
      "[HINA SHOP] Purchase error:",
      error
    );

    return sendMessage(
      api,

      `${SHOP_HEADER}\n\n` +

      "❌ حدث خطأ أثناء عملية الشراء.\n\n" +

      `📝 ${error.message || "خطأ غير معروف"}`,

      threadID,
      messageID
    );
  }
}

// ============================================================
// معالجة الردود
// ============================================================

async function handleReply({
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

  // ==========================================================
  // منع الآخرين من استخدام متجر شخص آخر
  // ==========================================================

  if (
    handleReply.author &&
    String(handleReply.author) !==
      String(senderID)
  ) {
    return;
  }

  const input =
    String(body).trim();

  // ==========================================================
  // اختيار المنتج
  // ==========================================================

  if (
    handleReply.type ===
    "pet_shop"
  ) {
    const item =
      getItemByNumber(input);

    if (!item) {
      return sendMessage(
        api,

        `${SHOP_HEADER}\n\n` +

        "❌ رقم المنتج غير صحيح.\n\n" +

        SHOP_ITEMS
          .map(
            product =>
              `${product.number}. ${product.emoji} ${product.name}`
          )
          .join("\n") +

        "\n\n↪️ أرسل رقم المنتج فقط.",

        threadID,
        messageID
      );
    }

    // إزالة Reply المتجر
    removeReply(handleReply);

    // ========================================================
    // طلب الكمية
    // ========================================================

    const sent =
      await sendMessage(
        api,
        getQuantityMessage(item),
        threadID,
        messageID
      );

    if (
      !sent ||
      !sent.messageID
    ) {
      return;
    }

    addReply({
      name: "حيوان",

      messageID:
        sent.messageID,

      author:
        String(senderID),

      type:
        "pet_shop_quantity",

      itemID:
        item.id
    });

    return;
  }

  // ==========================================================
  // اختيار الكمية
  // ==========================================================

  if (
    handleReply.type ===
    "pet_shop_quantity"
  ) {
    const item =
      getItemByID(
        handleReply.itemID
      );

    if (!item) {
      removeReply(handleReply);

      return sendMessage(
        api,
        `${SHOP_HEADER}\n\n` +
        "❌ هذا المنتج لم يعد متاحًا.",
        threadID,
        messageID
      );
    }

    const quantity =
      parseQuantity(input);

    if (!quantity) {
      return sendMessage(
        api,

        `${SHOP_HEADER}\n\n` +

        "❌ الكمية غير صحيحة.\n\n" +

        `أرسل رقمًا من 1 إلى ${MAX_PURCHASE_QUANTITY}.\n\n` +

        "مثال: 10",

        threadID,
        messageID
      );
    }

    return purchaseItem({
      api,
      event,
      models,
      item,
      quantity,
      handleReply
    });
  }
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  SHOP_HEADER,

  SHOP_ITEMS,

  MAX_PURCHASE_QUANTITY,

  getItemByID,

  getItemByNumber,

  getShopList,

  openShop,

  handleReply
};