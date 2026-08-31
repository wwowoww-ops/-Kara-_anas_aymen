module.exports.config = {
  name: "حيوان",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "إنشاء وعرض الحيوان الأليف",
  commandCategory: "Games",
  usages: "حيوان",
  cooldowns: 3
};

// ==================================================
// الحيوانات المتاحة في البداية
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
    name: "قطة",
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
// الحصول على الحيوان
// ==================================================

function getAnimal(type) {

  return Object.values(ANIMALS).find(
    animal => animal.type === type
  );

}


// ==================================================
// معلومات الحيوان
// ==================================================

function animalInfo(pet) {

  const animal = getAnimal(pet.type);

  const emoji =
    animal?.emoji || "🐾";

  return (
`⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬

${emoji} حيوانك

الاسم: ${pet.name}
المستوى: ${pet.level}
الصحة: ${pet.health}/100
الجوع: ${pet.hunger}/100`
  );

}


// ==================================================
// إرسال القائمة
// ==================================================

function sendAnimalList({
  api,
  threadID,
  messageID,
  senderID
}) {

  return new Promise(resolve => {

    let text =
`⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬

🐾 اختر حيوانك الأول

`;

    for (
      const number of Object.keys(ANIMALS)
    ) {

      const animal =
        ANIMALS[number];

      text +=
`${number} ـ ${animal.emoji} ${animal.name}\n`;
    }

    text +=
`
↪️ رد على هذه الرسالة برقم الحيوان لإنشائه`;

    api.sendMessage(
      text,
      threadID,
      (error, info) => {

        if (
          error ||
          !info?.messageID
        ) {

          console.error(
            "[PET LIST ERROR]",
            error
          );

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
  models
}) {

  try {

    const {
      threadID,
      messageID,
      senderID,
      body
    } = event;

    // ==================================================
    // التحقق من صاحب القائمة
    // ==================================================

    if (
      String(handleReply.author) !==
      String(senderID)
    ) {

      return api.sendMessage(
        `⛔ هذه القائمة ليست لك`,
        threadID,
        messageID
      );

    }


    // ==================================================
    // الحصول على الموديل
    // ==================================================

    const Pets =
      models?.Pets;

    if (!Pets) {

      console.error(
        "[PET ERROR] models.Pets غير موجود"
      );

      return api.sendMessage(
        `❌ مودل الحيوانات غير محمّل`,
        threadID,
        messageID
      );

    }


    // ==================================================
    // قراءة الرقم
    // ==================================================

    const number =
      String(body || "").trim();

    const animal =
      ANIMALS[number];

    if (!animal) {

      return api.sendMessage(
        `❌ اختر رقمًا من 1 إلى ${Object.keys(ANIMALS).length}`,
        threadID,
        messageID
      );

    }


    // ==================================================
    // التأكد مرة أخرى
    // ==================================================

    const existingPet =
      await Pets.findOne({

        where: {
          userID: String(senderID)
        }

      });


    if (existingPet) {

      return api.sendMessage(
        animalInfo(existingPet),
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
    // نجاح
    // ==================================================

    return api.sendMessage(

`⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬

${animal.emoji} تم إنشاء حيوانك

🐾 النوع: ${animal.name}
⭐ المستوى: ${pet.level}
❤️ الصحة: ${pet.health}/100
🍖 الجوع: ${pet.hunger}/100

اكتب "حيوان" مرة أخرى لرؤية معلوماته`,

      threadID,
      messageID
    );


  } catch (error) {

    console.error(
      "[PET HANDLE REPLY ERROR]",
      error
    );

    return api.sendMessage(
      `❌ حدث خطأ أثناء إنشاء الحيوان\n\n${error.message}`,
      event.threadID,
      event.messageID
    );

  }

};


// ==================================================
// الأمر الأساسي
// ==================================================

module.exports.run = async function ({
  api,
  event,
  models
}) {

  try {

    const {
      threadID,
      messageID,
      senderID
    } = event;


    // ==================================================
    // الموديل
    // ==================================================

    const Pets =
      models?.Pets;

    if (!Pets) {

      console.error(
        "[PET ERROR] models.Pets غير موجود"
      );

      return api.sendMessage(
        `❌ مودل الحيوانات غير محمّل`,
        threadID,
        messageID
      );

    }


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

        animalInfo(pet),

        threadID,
        messageID

      );

    }


    // ==================================================
    // لا يملك حيوانًا
    // ==================================================

    return sendAnimalList({

      api,

      threadID,

      messageID,

      senderID

    });


  } catch (error) {

    console.error(
      "[PET RUN ERROR]",
      error
    );

    return api.sendMessage(
      `❌ خطأ الحيوان: ${error.message}`,
      event.threadID,
      event.messageID
    );

  }

};