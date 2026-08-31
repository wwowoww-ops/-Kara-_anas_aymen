module.exports.config = {
  name: "حيوان",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "إنشاء وإدارة الحيوانات الأليفة",
  commandCategory: "Games",
  usages: "حيوان",
  cooldowns: 3
};

// ==================================================
// الحيوانات الأولية
// ==================================================

const ANIMALS = {
  1: {
    type: "mouse",
    name: "فأر",
    emoji: "🐭"
  },

  2: {
    type: "hamster",
    name: "هامستر",
    emoji: "🐹"
  },

  3: {
    type: "rabbit",
    name: "أرنب",
    emoji: "🐰"
  },

  4: {
    type: "cat",
    name: "قط",
    emoji: "🐱"
  },

  5: {
    type: "dog",
    name: "كلب",
    emoji: "🐶"
  },

  6: {
    type: "turtle",
    name: "سلحفاة",
    emoji: "🐢"
  },

  7: {
    type: "bird",
    name: "عصفور",
    emoji: "🐦"
  },

  8: {
    type: "fish",
    name: "سمكة",
    emoji: "🐠"
  }
};


// ==================================================
// قائمة الحيوانات
// ==================================================

function getAnimalList() {

  let text =
    `⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n`;

  text +=
    `🐾 اختر الحيوان الذي تريد إنشاءه\n\n`;

  for (const number of Object.keys(ANIMALS)) {

    const animal =
      ANIMALS[number];

    text +=
      `${number} ـ ${animal.emoji} ${animal.name}\n`;
  }

  text +=
    `\n↪️ رد على هذه الرسالة برقم الحيوان لإنشائه`;

  return text;
}


// ==================================================
// معلومات الحيوان
// ==================================================

function getAnimalInfo(pet) {

  const animal =
    Object.values(ANIMALS)
      .find(
        item =>
          item.type === pet.type
      );

  const emoji =
    animal?.emoji || "🐾";

  const name =
    pet.name ||
    animal?.name ||
    pet.type ||
    "حيوان";

  return (
    `⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n` +

    `${emoji} حيوانك: ${name}\n\n` +

    `⭐ المستوى: ${pet.level || 1}\n` +

    `✨ الخبرة: ${pet.exp || 0}\n` +

    `❤️ الصحة: ${pet.health || 100}\n` +

    `🍖 الجوع: ${pet.hunger || 100}`
  );
}


// ==================================================
// إرسال القائمة
// ==================================================

async function sendAnimalList({
  api,
  threadID,
  messageID,
  senderID
}) {

  return new Promise(resolve => {

    api.sendMessage(
      getAnimalList(),

      threadID,

      (error, info) => {

        if (
          error ||
          !info?.messageID
        ) {
          resolve(null);
          return;
        }

        if (
          !global.client.handleReply
        ) {
          global.client.handleReply = [];
        }

        global.client.handleReply.push({

          name:
            module.exports.config.name,

          messageID:
            info.messageID,

          author:
            String(senderID),

          type:
            "createPet"
        });

        resolve(info);
      },

      messageID
    );

  });
}


// ==================================================
// الرد على القائمة
// ==================================================

module.exports.handleReply = async function ({
  api,
  event,
  handleReply,
  Pets
}) {

  const {
    threadID,
    messageID,
    senderID,
    body
  } = event;


  // ==================================================
  // صاحب القائمة فقط
  // ==================================================

  if (
    String(handleReply.author) !==
    String(senderID)
  ) {

    return api.sendMessage(
      `⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n` +
      `⛔ هذه القائمة ليست لك`,
      threadID,
      messageID
    );
  }


  // ==================================================
  // الرقم
  // ==================================================

  const number =
    String(body || "").trim();

  const animal =
    ANIMALS[number];

  if (!animal) {

    return api.sendMessage(
      `❌ اختر رقمًا صحيحًا من القائمة`,
      threadID,
      messageID
    );
  }


  // ==================================================
  // التأكد من عدم امتلاك حيوان
  // ==================================================

  const existingPet =
    await Pets.findOne({
      where: {
        userID: String(senderID)
      }
    });


  if (existingPet) {

    return api.sendMessage(
      getAnimalInfo(
        existingPet
      ),
      threadID,
      messageID
    );
  }


  // ==================================================
  // إنشاء الحيوان
  // ==================================================

  const pet =
    await Pets.create({

      userID:
        String(senderID),

      type:
        animal.type,

      name:
        animal.name,

      level:
        1,

      health:
        100,

      hunger:
        100

    });


  // ==================================================
  // رسالة النجاح
  // ==================================================

  return api.sendMessage(

    `⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n` +

    `${animal.emoji} تم إنشاء حيوانك بنجاح\n\n` +

    `🐾 الحيوان: ${animal.name}\n` +

    `⭐ المستوى: 1\n` +

    `✨ الخبرة: 0\n` +

    `❤️ الصحة: 100\n` +

    `🍖 الجوع: 100`,

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
  Pets
}) {

  const {
    threadID,
    messageID,
    senderID
  } = event;


  // ==================================================
  // البحث عن الحيوان
  // ==================================================

  const pet =
    await Pets.findOne({
      where: {
        userID: String(senderID)
      }
    });


  // ==================================================
  // لديه حيوان
  // ==================================================

  if (pet) {

    return api.sendMessage(
      getAnimalInfo(pet),
      threadID,
      messageID
    );
  }


  // ==================================================
  // لا يملك حيوان
  // ==================================================

  return sendAnimalList({

    api,

    threadID,

    messageID,

    senderID

  });
};