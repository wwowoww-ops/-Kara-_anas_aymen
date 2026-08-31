module.exports.config = {
  name: "حيوان",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "نظام الحيوانات",
  commandCategory: "Games",
  usages: "حيوان",
  cooldowns: 3
};


// ==================================================
// الحيوانات المتاحة
// ==================================================

const PETS = [
  {
    id: 1,
    type: "أرنب",
    name: "أرنب",
    price: 0
  },

  {
    id: 2,
    type: "قطة",
    name: "قطة",
    price: 0
  },

  {
    id: 3,
    type: "كلب",
    name: "كلب",
    price: 0
  },

  {
    id: 4,
    type: "ببغاء",
    name: "ببغاء",
    price: 0
  },

  {
    id: 5,
    type: "هامستر",
    name: "هامستر",
    price: 0
  },

  {
    id: 6,
    type: "ثعلب",
    name: "ثعلب",
    price: 0
  },

  {
    id: 7,
    type: "ذئب",
    name: "ذئب",
    price: 0
  },

  {
    id: 8,
    type: "نمر",
    name: "نمر",
    price: 0
  },

  {
    id: 9,
    type: "أسد",
    name: "أسد",
    price: 0
  },

  {
    id: 10,
    type: "تنين",
    name: "تنين",
    price: 0
  }
];


// ==================================================
// البحث عن الحيوان
// ==================================================

function getPet(type) {

  return PETS.find(
    pet => pet.type === type
  );

}


// ==================================================
// عرض معلومات الحيوان
// ==================================================

function formatPet(pet) {

  return (
`⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬

🐾 حيوانك: ${pet.type}

❤️ الصحة: ${pet.health}/100
🍖 الجوع: ${pet.hunger}/100

⭐ المستوى: ${pet.level}
✨ الخبرة: ${pet.exp}

😊 الحالة: ${pet.status}`
  );

}


// ==================================================
// الأمر
// ==================================================

module.exports.run = async function ({
  api,
  event,
  Currencies,
  models
}) {

  const {
    threadID,
    messageID,
    senderID
  } = event;


  // ==================================================
  // الحصول على مودل الحيوانات
  // ==================================================

  const Pets =
    models?.Pets ||
    global.models?.Pets;


  if (!Pets) {

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
          userID: senderID
        }
      });


    // ==================================================
    // لديه حيوان
    // ==================================================

    if (existingPet) {

      return api.sendMessage(
        formatPet(
          existingPet
        ),
        threadID,
        messageID
      );

    }


    // ==================================================
    // لا يملك حيوان
    // ==================================================

    let message =
`⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬

🐾 لم تقم بإنشاء حيوان بعد.

اختر حيوانك:

`;


    for (
      const pet of PETS
    ) {

      message +=
`\n${pet.id} ─ ${pet.name}`;

    }


    message +=
`

↪️ رد على هذه الرسالة برقم الحيوان لإنشائه.`;


    // ==================================================
    // إرسال القائمة
    // ==================================================

    return new Promise(
      resolve => {

        api.sendMessage(
          message,
          threadID,
          (
            error,
            info
          ) => {

            if (
              error ||
              !info?.messageID
            ) {

              resolve();
              return;
            }


            // ==================================================
            // حفظ جلسة الاختيار
            // ==================================================

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


            resolve();

          },

          messageID
        );

      }
    );

  } catch (error) {

    console.error(
      "[PET ERROR]",
      error
    );

    return api.sendMessage(
`⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬

❌ حدث خطأ أثناء تنفيذ الأمر.`,
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
    String(
      handleReply.author
    ) !==
    String(senderID)
  ) {

    return;

  }


  // ==================================================
  // قراءة الرقم
  // ==================================================

  const choice =
    parseInt(
      String(body).trim()
    );


  if (
    isNaN(choice)
  ) {

    return api.sendMessage(
`⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬

❌ أرسل رقم الحيوان فقط.`,
      threadID,
      messageID
    );

  }


  // ==================================================
  // البحث عن الاختيار
  // ==================================================

  const selectedPet =
    PETS.find(
      pet =>
        pet.id === choice
    );


  if (!selectedPet) {

    return api.sendMessage(
`⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬

❌ رقم الحيوان غير صحيح.

↪️ اختر رقمًا من القائمة.`,
      threadID,
      messageID
    );

  }


  // ==================================================
  // الحصول على مودل الحيوانات
  // ==================================================

  const Pets =
    models?.Pets ||
    global.models?.Pets;


  if (!Pets) {

    return api.sendMessage(
`⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬

❌ مودل الحيوانات غير محمّل.`,
      threadID,
      messageID
    );

  }


  try {

    // ==================================================
    // التأكد مرة أخرى
    // ==================================================

    const alreadyHasPet =
      await Pets.findOne({
        where: {
          userID: senderID
        }
      });


    if (alreadyHasPet) {

      return api.sendMessage(
`⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬

⚠️ لديك حيوان بالفعل.

🐾 ${alreadyHasPet.type}`,
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
          senderID,

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
    // إرسال النتيجة
    // ==================================================

    return api.sendMessage(
`⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬

🎉 تم إنشاء حيوانك بنجاح.

🐾 الحيوان: ${pet.type}

⭐ المستوى: ${pet.level}
✨ الخبرة: ${pet.exp}

❤️ الصحة: ${pet.health}/100
🍖 الجوع: ${pet.hunger}/100

😊 الحالة: ${pet.status}`,
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

❌ تعذر إنشاء الحيوان.`,
      threadID,
      messageID
    );

  }

};