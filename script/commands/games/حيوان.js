module.exports.config = {
  name: "حيوان",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "نظام الحيوانات الأليفة",
  commandCategory: "Games",
  usages: "حيوان",
  cooldowns: 3
};

const PETS = [
  {
    type: "قطة",
    name: "قطة",
    price: 0
  },
  {
    type: "كلب",
    name: "كلب",
    price: 0
  },
  {
    type: "أرنب",
    name: "أرنب",
    price: 0
  },
  {
    type: "هامستر",
    name: "هامستر",
    price: 0
  },
  {
    type: "ببغاء",
    name: "ببغاء",
    price: 0
  },
  {
    type: "سلحفاة",
    name: "سلحفاة",
    price: 0
  },
  {
    type: "ثعلب",
    name: "ثعلب",
    price: 5000
  },
  {
    type: "ذئب",
    name: "ذئب",
    price: 8000
  },
  {
    type: "نمر",
    name: "نمر",
    price: 15000
  },
  {
    type: "أسد",
    name: "أسد",
    price: 20000
  },
  {
    type: "تنين",
    name: "تنين",
    price: 50000
  }
];

const STATES = [
  "سعيد",
  "حزين",
  "غاضب",
  "جائع",
  "نعسان",
  "نشيط"
];

module.exports.run = async function ({
  api,
  event,
  args,
  Currencies,
  models
}) {

  const {
    threadID,
    messageID,
    senderID
  } = event;

  try {

    // ==================================================
    // الحصول على Pets
    // ==================================================

    let Pets = null;

    /*
     * أولًا نحاول الحصول عليه من models
     */

    if (
      models &&
      models.Pets
    ) {
      Pets = models.Pets;
    }

    /*
     * ثم نحاول الحصول عليه من Currencies
     * في حال كان النظام يضع المودلز داخله
     */

    if (
      !Pets &&
      Currencies &&
      Currencies.Pets
    ) {
      Pets = Currencies.Pets;
    }

    /*
     * ثم global.models
     */

    if (
      !Pets &&
      global.models &&
      global.models.Pets
    ) {
      Pets = global.models.Pets;
    }

    // ==================================================
    // التحقق
    // ==================================================

    if (
      !Pets ||
      typeof Pets.findOne !== "function"
    ) {

      console.error(
        "[PET COMMAND ERROR] Pets model is not available"
      );

      return api.sendMessage(
        `⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬

❌ مودل الحيوانات غير محمّل

تأكد أن Pets موجود داخل models.`,
        threadID,
        messageID
      );
    }

    // ==================================================
    // البحث عن الحيوان
    // ==================================================

    const pet = await Pets.findOne({
      where: {
        userID: String(senderID)
      }
    });

    // ==================================================
    // لديه حيوان
    // ==================================================

    if (pet) {

      const state =
        pet.state ||
        pet.status ||
        "سعيد";

      const level =
        Number(pet.level) || 1;

      const health =
        Number(pet.health) || 100;

      const hunger =
        Number(pet.hunger) || 100;

      const xp =
        Number(pet.xp) || 0;

      return api.sendMessage(

`⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬

🐾 حيوانك

النوع: ${pet.type}
الاسم: ${pet.name}

الحالة: ${state}

المستوى: ${level}
الخبرة: ${xp} XP

الصحة: ${health}/100
الجوع: ${hunger}/100`,

        threadID,
        messageID
      );
    }

    // ==================================================
    // لا يملك حيوان
    // ==================================================

    let message =
`⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬

🐾 لم تقم بامتلاك حيوان بعد

اختر الحيوان الذي تريد إنشاءه:

`;

    PETS.forEach(
      (pet, index) => {

        const price =
          pet.price === 0
            ? "مجاني"
            : `${pet.price} عملة`;

        message +=
          `${index + 1}. ${pet.name} — ${price}\n`;
      }
    );

    message +=
`

↪️ رد على هذه الرسالة برقم الحيوان لإنشائه`;

    // ==================================================
    // إرسال القائمة
    // ==================================================

    return new Promise(resolve => {

      api.sendMessage(
        message,
        threadID,
        async (error, info) => {

          if (error) {

            console.error(
              "[PET SEND ERROR]",
              error
            );

            resolve();
            return;
          }

          if (!info?.messageID) {
            resolve();
            return;
          }

          // ==================================================
          // حفظ جلسة الاختيار
          // ==================================================

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
              "pet_create"

          });

          resolve();
        },

        messageID
      );

    });

  } catch (error) {

    console.error(
      "[PET COMMAND ERROR]",
      error
    );

    return api.sendMessage(

`⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬

❌ حدث خطأ أثناء فحص حيوانك.

${error?.message || "خطأ غير معروف"}`,

      threadID,
      messageID
    );
  }
};


// ============================================================
// الرد على قائمة الحيوانات
// ============================================================

module.exports.handleReply = async function ({
  api,
  event,
  handleReply,
  Currencies,
  models
}) {

  const {
    threadID,
    messageID,
    senderID,
    body
  } = event;

  try {

    // ==================================================
    // التحقق من صاحب القائمة
    // ==================================================

    if (
      String(handleReply.author) !==
      String(senderID)
    ) {

      return api.sendMessage(
        `⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬

⛔ هذه القائمة ليست خاصة بك.`,
        threadID,
        messageID
      );
    }

    // ==================================================
    // قراءة الرقم
    // ==================================================

    const choice =
      Number(
        String(body || "").trim()
      );

    if (
      !Number.isInteger(choice) ||
      choice < 1 ||
      choice > PETS.length
    ) {

      return api.sendMessage(
        `⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬

❌ اختر رقمًا صحيحًا من القائمة.`,
        threadID,
        messageID
      );
    }

    const selected =
      PETS[choice - 1];

    // ==================================================
    // الحصول على Pets
    // ==================================================

    let Pets = null;

    if (
      models &&
      models.Pets
    ) {
      Pets = models.Pets;
    }

    if (
      !Pets &&
      global.models &&
      global.models.Pets
    ) {
      Pets = global.models.Pets;
    }

    if (
      !Pets ||
      typeof Pets.findOne !== "function"
    ) {

      console.error(
        "[PET REPLY ERROR] Pets model unavailable"
      );

      return api.sendMessage(
        `⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬

❌ مودل الحيوانات غير محمّل.`,
        threadID,
        messageID
      );
    }

    // ==================================================
    // التأكد مرة أخرى أنه لا يملك حيوان
    // ==================================================

    const existing =
      await Pets.findOne({
        where: {
          userID: String(senderID)
        }
      });

    if (existing) {

      return api.sendMessage(
        `⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬

❌ لديك حيوان بالفعل:

🐾 ${existing.name}

لا يمكنك إنشاء حيوان آخر الآن.`,
        threadID,
        messageID
      );
    }

    // ==================================================
    // إنشاء الحيوان
    // ==================================================

    const petData = {

      userID:
        String(senderID),

      type:
        selected.type,

      name:
        selected.name,

      level:
        1,

      health:
        100,

      hunger:
        100,

      state:
        "سعيد",

      xp:
        0

    };

    const newPet =
      await Pets.create(
        petData
      );

    // ==================================================
    // النجاح
    // ==================================================

    return api.sendMessage(

`⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬

🎉 تم إنشاء حيوانك بنجاح

🐾 النوع: ${newPet.type}
📝 الاسم: ${newPet.name}

الحالة: سعيد

المستوى: 1
الخبرة: 0 XP

الصحة: 100/100
الجوع: 100/100`,

      threadID,
      messageID
    );

  } catch (error) {

    console.error(
      "[PET REPLY ERROR]",
      error
    );

    return api.sendMessage(

`⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬

❌ حدث خطأ أثناء إنشاء الحيوان.

${error?.message || "خطأ غير معروف"}`,

      threadID,
      messageID
    );
  }
};