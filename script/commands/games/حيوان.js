module.exports.config = {
  name: "حيوان",
  version: "1.1.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "نظام الحيوانات",
  commandCategory: "Games",
  usages: "حيوان",
  cooldowns: 3
};


// ==================================================
// الحيوانات
// ==================================================

const PETS = [
  {
    id: 1,
    type: "أرنب",
    name: "أرنب"
  },

  {
    id: 2,
    type: "قطة",
    name: "قطة"
  },

  {
    id: 3,
    type: "كلب",
    name: "كلب"
  },

  {
    id: 4,
    type: "ببغاء",
    name: "ببغاء"
  },

  {
    id: 5,
    type: "هامستر",
    name: "هامستر"
  },

  {
    id: 6,
    type: "ثعلب",
    name: "ثعلب"
  },

  {
    id: 7,
    type: "ذئب",
    name: "ذئب"
  },

  {
    id: 8,
    type: "نمر",
    name: "نمر"
  },

  {
    id: 9,
    type: "أسد",
    name: "أسد"
  },

  {
    id: 10,
    type: "تنين",
    name: "تنين"
  }
];


// ==================================================
// الحصول على مودل Pets
// ==================================================

function getPetsModel(models) {

  let Pets = null;

  try {

    if (
      models &&
      typeof models.use === "function"
    ) {

      Pets = models.use("Pets");

    }

  } catch (error) {

    console.error(
      "[PETS MODEL USE ERROR]",
      error.message
    );

  }


  if (!Pets) {

    Pets =
      models?.Pets ||
      global.models?.Pets ||
      global.data?.Pets ||
      null;

  }

  return Pets;

}


// ==================================================
// تنسيق معلومات الحيوان
// ==================================================

function formatPet(pet) {

  return (
`⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬

حيوانك: ${pet.type}

الاسم: ${pet.name}

المستوى: ${pet.level}
الخبرة: ${pet.exp}

الصحة: ${pet.health}/100
الجوع: ${pet.hunger}/100

الحالة: ${pet.status}`
  );

}


// ==================================================
// إرسال القائمة
// ==================================================

function sendPetList({
  api,
  threadID,
  messageID,
  senderID
}) {

  let message =
`⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬

لم تقم بإنشاء حيوان بعد.

اختر حيوانك:

`;


  for (const pet of PETS) {

    message +=
      `${pet.id} ─ ${pet.name}\n`;

  }


  message +=
`
رد على هذه الرسالة برقم الحيوان لإنشائه.`;


  return new Promise(resolve => {

    api.sendMessage(
      message,
      threadID,
      (error, info) => {

        if (
          error ||
          !info?.messageID
        ) {

          console.error(
            "[PET LIST SEND ERROR]",
            error
          );

          resolve(null);
          return;
        }


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
// الأمر الأساسي
// ==================================================

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


  // ==================================================
  // الحصول على Pets
  // ==================================================

  const Pets =
    getPetsModel(models);


  if (!Pets) {

    console.error(
      "[PETS] Model not loaded"
    );

    return api.sendMessage(
`⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬

❌ مودل الحيوانات غير محمّل.`,
      threadID,
      messageID
    );

  }


  try {

    // ==================================================
    // البحث عن حيوان المستخدم
    // ==================================================

    const existingPet =
      await Pets.findOne({
        where: {
          userID: String(senderID)
        }
      });


    // ==================================================
    // لديه حيوان
    // ==================================================

    if (existingPet) {

      return api.sendMessage(
        formatPet(existingPet),
        threadID,
        messageID
      );

    }


    // ==================================================
    // لا يملك حيوان
    // ==================================================

    return sendPetList({
      api,
      threadID,
      messageID,
      senderID
    });

  } catch (error) {

    console.error(
      "[PET COMMAND ERROR]",
      error
    );

    return api.sendMessage(
`⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬

❌ حدث خطأ أثناء فحص حيوانك.`,
      threadID,
      messageID
    );

  }

};


// ==================================================
// اختيار الحيوان
// ==================================================

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


  // ==================================================
  // التحقق من صاحب القائمة
  // ==================================================

  if (
    String(handleReply.author) !==
    String(senderID)
  ) {

    return;

  }


  // ==================================================
  // التحقق من نوع الرد
  // ==================================================

  if (
    handleReply.type !==
    "createPet"
  ) {

    return;

  }


  // ==================================================
  // قراءة الرقم
  // ==================================================

  const choice =
    parseInt(
      String(body || "").trim(),
      10
    );


  if (
    Number.isNaN(choice)
  ) {

    return api.sendMessage(
`⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬

أرسل رقم الحيوان فقط.`,
      threadID,
      messageID
    );

  }


  // ==================================================
  // البحث عن الحيوان
  // ==================================================

  const selectedPet =
    PETS.find(
      pet =>
        pet.id === choice
    );


  if (!selectedPet) {

    return api.sendMessage(
`⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬

رقم الحيوان غير صحيح.

اختر رقمًا من القائمة.`,
      threadID,
      messageID
    );

  }


  // ==================================================
  // الحصول على المودل
  // ==================================================

  const Pets =
    getPetsModel(models);


  if (!Pets) {

    console.error(
      "[PETS] Model not loaded in handleReply"
    );

    return api.sendMessage(
`⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬

❌ مودل الحيوانات غير محمّل.`,
      threadID,
      messageID
    );

  }


  try {

    // ==================================================
    // التأكد أن المستخدم لا يملك حيوانًا
    // ==================================================

    const alreadyHasPet =
      await Pets.findOne({
        where: {
          userID: String(senderID)
        }
      });


    if (alreadyHasPet) {

      return api.sendMessage(
`⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬

لديك حيوان بالفعل.

حيوانك: ${alreadyHasPet.type}`,
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
          selectedPet.type,

        name:
          selectedPet.name,

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


    // ==================================================
    // حذف جلسة الاختيار
    // ==================================================

    if (
      Array.isArray(
        global.client.handleReply
      )
    ) {

      global.client.handleReply =
        global.client.handleReply.filter(
          item =>
            !(
              item.name ===
                module.exports.config.name &&
              String(item.messageID) ===
                String(handleReply.messageID)
            )
        );

    }


    // ==================================================
    // النتيجة
    // ==================================================

    return api.sendMessage(
`⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬

تم إنشاء حيوانك بنجاح.

الحيوان: ${pet.type}
الاسم: ${pet.name}

المستوى: ${pet.level}
الخبرة: ${pet.exp}

الصحة: ${pet.health}/100
الجوع: ${pet.hunger}/100

الحالة: ${pet.status}`,
      threadID,
      messageID
    );

  } catch (error) {

    console.error(
      "[PET CREATE ERROR]",
      error
    );

    return api.sendMessage(
`⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬

❌ تعذر إنشاء الحيوان.

${error.message || ""}`,
      threadID,
      messageID
    );

  }

};