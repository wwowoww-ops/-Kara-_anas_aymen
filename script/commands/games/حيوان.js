const fs = require("fs-extra");

module.exports.config = {
  name: "حيوان",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "اختيار وإنشاء حيوان أليف",
  commandCategory: "Games",
  usages: "حيوان",
  cooldowns: 3
};

// ==================================================
// الحيوانات المتاحة
// ==================================================

const ANIMALS = {
  1: {
    id: "cat",
    name: "قط",
    emoji: "🐱",
    price: 0
  },

  2: {
    id: "dog",
    name: "كلب",
    emoji: "🐶",
    price: 0
  },

  3: {
    id: "rabbit",
    name: "أرنب",
    emoji: "🐰",
    price: 0
  },

  4: {
    id: "hamster",
    name: "هامستر",
    emoji: "🐹",
    price: 0
  },

  5: {
    id: "mouse",
    name: "فأر",
    emoji: "🐭",
    price: 0
  },

  6: {
    id: "bird",
    name: "عصفور",
    emoji: "🐦",
    price: 0
  },

  7: {
    id: "turtle",
    name: "سلحفاة",
    emoji: "🐢",
    price: 0
  },

  8: {
    id: "fish",
    name: "سمكة",
    emoji: "🐠",
    price: 0
  },

  9: {
    id: "fox",
    name: "ثعلب",
    emoji: "🦊",
    price: 500
  },

  10: {
    id: "wolf",
    name: "ذئب",
    emoji: "🐺",
    price: 1000
  },

  11: {
    id: "raccoon",
    name: "راكون",
    emoji: "🦝",
    price: 1200
  },

  12: {
    id: "deer",
    name: "غزال",
    emoji: "🦌",
    price: 1500
  },

  13: {
    id: "monkey",
    name: "قرد",
    emoji: "🐒",
    price: 1800
  },

  14: {
    id: "parrot",
    name: "ببغاء",
    emoji: "🦜",
    price: 2000
  },

  15: {
    id: "eagle",
    name: "نسر",
    emoji: "🦅",
    price: 2500
  },

  16: {
    id: "owl",
    name: "بومة",
    emoji: "🦉",
    price: 2800
  },

  17: {
    id: "snake",
    name: "أفعى",
    emoji: "🐍",
    price: 3000
  },

  18: {
    id: "crocodile",
    name: "تمساح",
    emoji: "🐊",
    price: 3500
  },

  19: {
    id: "lion",
    name: "أسد",
    emoji: "🦁",
    price: 5000
  },

  20: {
    id: "tiger",
    name: "نمر",
    emoji: "🐯",
    price: 6000
  },

  21: {
    id: "leopard",
    name: "فهد",
    emoji: "🐆",
    price: 7000
  },

  22: {
    id: "bear",
    name: "دب",
    emoji: "🐻",
    price: 8000
  },

  23: {
    id: "gorilla",
    name: "غوريلا",
    emoji: "🦍",
    price: 9000
  },

  24: {
    id: "elephant",
    name: "فيل",
    emoji: "🐘",
    price: 10000
  },

  25: {
    id: "rhino",
    name: "وحيد القرن",
    emoji: "🦏",
    price: 12000
  },

  26: {
    id: "hippo",
    name: "فرس النهر",
    emoji: "🦛",
    price: 14000
  },

  27: {
    id: "unicorn",
    name: "وحيد القرن الأسطوري",
    emoji: "🦄",
    price: 25000
  },

  28: {
    id: "dragon",
    name: "تنين",
    emoji: "🐉",
    price: 50000
  },

  29: {
    id: "fire_dragon",
    name: "تنين ناري",
    emoji: "🔥",
    price: 75000
  },

  30: {
    id: "ice_dragon",
    name: "تنين جليدي",
    emoji: "❄️",
    price: 100000
  },

  31: {
    id: "eastern_dragon",
    name: "تنين شرقي",
    emoji: "🐲",
    price: 150000
  },

  32: {
    id: "phoenix",
    name: "طائر العنقاء",
    emoji: "🐦‍🔥",
    price: 200000
  }
};


// ==================================================
// الحصول على بيانات المستخدم
// ==================================================

async function getUserData(Currencies, userID) {

  let user = await Currencies.findOne({
    where: {
      userID: String(userID)
    }
  });

  if (!user) {

    user = await Currencies.create({
      userID: String(userID),
      money: 0,
      exp: 0,
      data: {}
    });

  }

  let data = user.data;

  if (
    !data ||
    typeof data !== "object" ||
    Array.isArray(data)
  ) {
    data = {};
  }

  return {
    user,
    data
  };
}


// ==================================================
// قائمة الحيوانات
// ==================================================

function createAnimalList() {

  let text =
    `⌬ ━━ 𝗛𝗜𝗡𝗔 ANIMALS ━━ ⌬\n\n`;

  text +=
    `اختر حيوانك الأول\n\n`;

  for (
    const [number, animal]
    of Object.entries(ANIMALS)
  ) {

    // الحيوانات المجانية فقط في البداية
    if (animal.price !== 0) {
      continue;
    }

    text +=
      `${animal.emoji} ${number} ـ ${animal.name}\n`;
  }

  text +=
    `\n↪️ رد على هذه الرسالة برقم الحيوان لإنشائه`;

  return text;
}


// ==================================================
// معلومات الحيوان
// ==================================================

function createAnimalInfo(animalData) {

  const animal =
    Object.values(ANIMALS)
      .find(
        item =>
          item.id === animalData.id
      );

  if (!animal) {
    return null;
  }

  return (
    `⌬ ━━ 𝗛𝗜𝗡𝗔 ANIMAL ━━ ⌬\n\n` +

    `${animal.emoji} حيوانك: ${animal.name}\n\n` +

    `⭐ المستوى: ${animalData.level || 1}\n` +

    `✨ الخبرة: ${animalData.exp || 0}\n` +

    `❤️ الصحة: ${animalData.health || 100}`
  );
}


// ==================================================
// حفظ الحيوان
// ==================================================

async function saveAnimal(
  user,
  data,
  animal
) {

  data.animal = {
    id: animal.id,
    name: animal.name,
    level: 1,
    exp: 0,
    health: 100,
    createdAt: Date.now()
  };

  user.data = data;

  await user.save();
}


// ==================================================
// التعامل مع الرد
// ==================================================

module.exports.handleReply = async function ({
  api,
  event,
  handleReply,
  Currencies
}) {

  const {
    threadID,
    messageID,
    senderID,
    body
  } = event;

  // ----------------------------------------------
  // التأكد من صاحب القائمة
  // ----------------------------------------------

  if (
    String(handleReply.author) !==
    String(senderID)
  ) {

    return api.sendMessage(
      `⌬ ━━ 𝗛𝗜𝗡𝗔 ANIMALS ━━ ⌬\n\n` +
      `⛔ هذه القائمة ليست لك`,
      threadID,
      messageID
    );
  }


  // ----------------------------------------------
  // الرقم
  // ----------------------------------------------

  const number =
    String(body || "")
      .trim();

  const animal =
    ANIMALS[number];

  if (!animal) {

    return api.sendMessage(
      `❌ اختر رقمًا صحيحًا من القائمة`,
      threadID,
      messageID
    );
  }


  // ----------------------------------------------
  // الحصول على المستخدم
  // ----------------------------------------------

  const {
    user,
    data
  } = await getUserData(
    Currencies,
    senderID
  );


  // ----------------------------------------------
  // التأكد أنه لا يملك حيوانًا
  // ----------------------------------------------

  if (data.animal) {

    return api.sendMessage(
      createAnimalInfo(
        data.animal
      ) || `❌ حدث خطأ في بيانات حيوانك`,
      threadID,
      messageID
    );
  }


  // ----------------------------------------------
  // إنشاء الحيوان
  // ----------------------------------------------

  await saveAnimal(
    user,
    data,
    animal
  );


  // ----------------------------------------------
  // رسالة النجاح
  // ----------------------------------------------

  return api.sendMessage(

    `⌬ ━━ 𝗛𝗜𝗡𝗔 ANIMAL ━━ ⌬\n\n` +

    `${animal.emoji} تم إنشاء حيوانك بنجاح\n\n` +

    `🐾 الحيوان: ${animal.name}\n` +

    `⭐ المستوى: 1\n` +

    `✨ الخبرة: 0\n` +

    `❤️ الصحة: 100\n\n` +

    `يمكنك الآن الاعتناء بحيوانك وتطويره`,

    threadID,
    messageID
  );
};


// ==================================================
// الأمر الأساسي
// ==================================================

module.exports.run = async function ({
  api,
  event,
  Currencies
}) {

  const {
    threadID,
    messageID,
    senderID
  } = event;


  // ==================================================
  // بيانات المستخدم
  // ==================================================

  const {
    data
  } = await getUserData(
    Currencies,
    senderID
  );


  // ==================================================
  // لديه حيوان
  // ==================================================

  if (data.animal) {

    const info =
      createAnimalInfo(
        data.animal
      );

    return api.sendMessage(
      info ||
      `❌ بيانات الحيوان غير صالحة`,
      threadID,
      messageID
    );
  }


  // ==================================================
  // لا يملك حيوان
  // ==================================================

  return new Promise(resolve => {

    api.sendMessage(
      createAnimalList(),

      threadID,

      (error, info) => {

        if (
          error ||
          !info?.messageID
        ) {

          resolve();
          return;
        }


        // ------------------------------------------
        // حفظ جلسة الرد
        // ------------------------------------------

        if (
          !global.client.handleReply
        ) {

          global.client.handleReply =
            [];
        }

        global.client.handleReply.push({

          name:
            module.exports.config.name,

          messageID:
            info.messageID,

          author:
            String(senderID)

        });

        resolve();

      },

      messageID
    );

  });
};