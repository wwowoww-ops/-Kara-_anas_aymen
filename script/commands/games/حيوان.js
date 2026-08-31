module.exports.config = {
  name: "حيوان",
  version: "3.0.0",
  credits: "أبو هريرة",
  description: "نظام الحيوانات الأليفة",
  commandCategory: "games",
  hasPermssion: 0,
  usages: "حيوان",
  cooldowns: 3
};

// ============================================================
// الحيوانات
// ============================================================

const PETS = [
  { id: 1,  type: "قطة",       name: "قطة",       price: 0,     rarity: "شائع",      power: 10,  emoji: "🐱" },
  { id: 2,  type: "كلب",       name: "كلب",       price: 0,     rarity: "شائع",      power: 12,  emoji: "🐶" },
  { id: 3,  type: "أرنب",      name: "أرنب",      price: 0,     rarity: "شائع",      power: 8,   emoji: "🐰" },
  { id: 4,  type: "هامستر",    name: "هامستر",    price: 0,     rarity: "شائع",      power: 7,   emoji: "🐹" },

  { id: 5,  type: "ثعلب",      name: "ثعلب",      price: 500,   rarity: "نادر",      power: 25,  emoji: "🦊" },
  { id: 6,  type: "ذئب",       name: "ذئب",       price: 1000,  rarity: "نادر",      power: 35,  emoji: "🐺" },
  { id: 7,  type: "باندا",     name: "باندا",     price: 1500,  rarity: "نادر",      power: 30,  emoji: "🐼" },
  { id: 8,  type: "نمر",       name: "نمر",       price: 2500,  rarity: "نادر",      power: 50,  emoji: "🐯" },
  { id: 9,  type: "أسد",       name: "أسد",       price: 3500,  rarity: "نادر",      power: 60,  emoji: "🦁" },
  { id: 10, type: "دب",        name: "دب",        price: 4000,  rarity: "نادر",      power: 65,  emoji: "🐻" },

  { id: 11, type: "غزال",      name: "غزال",      price: 5000,  rarity: "ملحمي",     power: 45,  emoji: "🦌" },
  { id: 12, type: "نسر",       name: "نسر",       price: 6000,  rarity: "ملحمي",     power: 70,  emoji: "🦅" },
  { id: 13, type: "تنين",      name: "تنين",      price: 10000, rarity: "أسطوري",    power: 100, emoji: "🐉" },

  { id: 14, type: "حصان",      name: "حصان",      price: 3000,  rarity: "نادر",      power: 55,  emoji: "🐴" },
  { id: 15, type: "بومة",      name: "بومة",      price: 4500,  rarity: "ملحمي",     power: 58,  emoji: "🦉" },
  { id: 16, type: "ببغاء",     name: "ببغاء",     price: 2500,  rarity: "نادر",      power: 32,  emoji: "🦜" },
  { id: 17, type: "سلحفاة",   name: "سلحفاة",   price: 1800,  rarity: "نادر",      power: 28,  emoji: "🐢" },
  { id: 18, type: "بطريق",     name: "بطريق",     price: 2200,  rarity: "نادر",      power: 25,  emoji: "🐧" },
  { id: 19, type: "كوالا",     name: "كوالا",     price: 2800,  rarity: "نادر",      power: 27,  emoji: "🐨" },
  { id: 20, type: "غوريلا",    name: "غوريلا",    price: 7000,  rarity: "ملحمي",     power: 85,  emoji: "🦍" },

  { id: 21, type: "فهد",       name: "فهد",       price: 7500,  rarity: "ملحمي",     power: 88,  emoji: "🐆" },
  { id: 22, type: "تمساح",     name: "تمساح",     price: 6500,  rarity: "ملحمي",     power: 78,  emoji: "🐊" },
  { id: 23, type: "قرش",       name: "قرش",       price: 8000,  rarity: "ملحمي",     power: 82,  emoji: "🦈" },
  { id: 24, type: "حوت",       name: "حوت",       price: 9000,  rarity: "ملحمي",     power: 90,  emoji: "🐋" },
  { id: 25, type: "وحيد القرن", name: "وحيد القرن", price: 11000, rarity: "أسطوري", power: 105, emoji: "🦏" },

  { id: 26, type: "فيل",       name: "فيل",       price: 12000, rarity: "أسطوري",    power: 110, emoji: "🐘" },
  { id: 27, type: "زرافة",     name: "زرافة",     price: 8500,  rarity: "ملحمي",     power: 65,  emoji: "🦒" },
  { id: 28, type: "شمبانزي",   name: "شمبانزي",   price: 5500,  rarity: "ملحمي",     power: 55,  emoji: "🐒" },
  { id: 29, type: "صقر",       name: "صقر",       price: 9500,  rarity: "أسطوري",    power: 95,  emoji: "🦅" },
  { id: 30, type: "وحش أسطوري", name: "وحش أسطوري", price: 20000, rarity: "أسطوري", power: 150, emoji: "👹" }
];

// ============================================================
// جلب المودلات
// ============================================================

function getPetsModel(models) {
  try {
    if (models && typeof models.use === "function") {
      const Pets = models.use("Pets");
      if (Pets) return Pets;
    }
  } catch (error) {
    console.error("[PET MODEL ERROR]", error);
  }

  try {
    if (models?.Pets) return models.Pets;
  } catch {}

  return null;
}

function getCurrenciesModel(models) {
  try {
    if (models && typeof models.use === "function") {
      const Currencies = models.use("Currencies");
      if (Currencies) return Currencies;
    }
  } catch (error) {
    console.error("[CURRENCY MODEL ERROR]", error);
  }

  try {
    if (models?.Currencies) return models.Currencies;
  } catch {}

  return null;
}

// ============================================================
// البحث
// ============================================================

function getPetByID(id) {
  return PETS.find(pet => pet.id === Number(id));
}

function getPetByType(type) {
  return PETS.find(
    pet => String(pet.type) === String(type)
  );
}

// ============================================================
// إضافة جلسة Reply
// ============================================================

function addReply(data) {
  if (!global.client.handleReply) {
    global.client.handleReply = [];
  }

  global.client.handleReply.push(data);
}

// ============================================================
// حذف جلسة Reply
// ============================================================

function removeReply(handleReply) {
  try {
    const list = global.client.handleReply;

    if (!Array.isArray(list)) return;

    const index = list.indexOf(handleReply);

    if (index !== -1) {
      list.splice(index, 1);
    }
  } catch {}
}

// ============================================================
// القائمة
// ============================================================

function getPetList() {

  let text =
    "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n";

  text +=
    "🐾 اختر حيوانك بالرد على هذه الرسالة برقم الحيوان\n\n";

  for (const pet of PETS) {

    const price =
      pet.price === 0
        ? "مجاني"
        : `${pet.price} عملة`;

    text +=
      `${pet.id}. ${pet.emoji} ${pet.name}\n` +
      `   الندرة: ${pet.rarity} | القوة: ${pet.power} | السعر: ${price}\n`;
  }

  text +=
    "\n↪️ رد برقم الحيوان";

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
    found?.rarity || "غير معروف";

  const power =
    found?.power || 0;

  const level =
    Number(pet.level || 1);

  const exp =
    Number(pet.exp || 0);

  const health =
    Number(pet.health ?? 100);

  const hunger =
    Number(pet.hunger ?? 100);

  const status =
    pet.status || "طبيعي";

  return (
    "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n" +

    `${emoji} ${pet.name}\n\n` +

    `النوع: ${pet.type}\n` +
    `الندرة: ${rarity}\n` +
    `القوة: ${power}\n` +
    `المستوى: ${level}\n` +
    `XP: ${exp}\n` +
    `الحالة: ${status}\n` +
    `الصحة: ${health}/100\n` +
    `الشبع: ${hunger}/100\n\n` +

    "↪️ رد على هذه الرسالة بأحد الأرقام:\n" +
    "1. بيع الحيوان\n" +
    "2. إطعام\n" +
    "3. تدريب"
  );
}

// ============================================================
// إنشاء الحيوان
// ============================================================

async function createPet(Pets, senderID, selected) {

  const existing =
    await Pets.findOne({
      where: {
        userID: String(senderID)
      }
    });

  if (existing) {
    return {
      success: false,
      message: "❌ لديك حيوان بالفعل."
    };
  }

  await Pets.create({
    userID: String(senderID),
    type: selected.type,
    name: selected.name,
    level: 1,
    health: 100,
    hunger: 100,
    status: "سعيد",
    exp: 0
  });

  return {
    success: true,
    message:
      "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n" +
      `${selected.emoji} تم إنشاء حيوانك بنجاح\n\n` +
      `الحيوان: ${selected.name}\n` +
      `الندرة: ${selected.rarity}\n` +
      `القوة: ${selected.power}\n` +
      `المستوى: 1\n` +
      `XP: 0\n` +
      `الحالة: سعيد`
  };
}

// ============================================================
// سعر البيع
// ============================================================

function getSellPrice(pet) {

  const found =
    getPetByType(pet.type);

  if (!found) return 0;

  const level =
    Number(pet.level || 1);

  const base =
    Math.floor(found.price / 2);

  const levelBonus =
    Math.max(
      0,
      (level - 1) * 100
    );

  return base + levelBonus;
}

// ============================================================
// الأمر الأساسي
// ============================================================

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

  try {

    const Pets =
      getPetsModel(models);

    const Currencies =
      getCurrenciesModel(models);

    if (!Pets) {
      return api.sendMessage(
        "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n" +
        "❌ مودل الحيوانات غير محمّل.",
        threadID,
        messageID
      );
    }

    if (!Currencies) {
      return api.sendMessage(
        "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n" +
        "❌ مودل العملات غير محمّل.",
        threadID,
        messageID
      );
    }

    const pet =
      await Pets.findOne({
        where: {
          userID: String(senderID)
        }
      });

    // ========================================================
    // لديه حيوان
    // ========================================================

    if (pet) {

      const info =
        await new Promise(resolve => {

          api.sendMessage(
            getPetInfo(
              pet.toJSON
                ? pet.toJSON()
                : pet
            ),
            threadID,
            (error, sent) => {

              if (error) {
                console.error(
                  "[PET INFO SEND ERROR]",
                  error
                );

                resolve(null);
                return;
              }

              resolve(sent);
            },
            messageID
          );
        });

      if (info?.messageID) {

        addReply({

          name:
            module.exports.config.name,

          messageID:
            info.messageID,

          author:
            String(senderID),

          type:
            "pet_actions"
        });
      }

      return;
    }

    // ========================================================
    // لا يملك حيوان
    // ========================================================

    const sent =
      await new Promise(resolve => {

        api.sendMessage(
          getPetList(),
          threadID,
          (error, info) => {

            if (error) {
              console.error(
                "[PET LIST ERROR]",
                error
              );

              resolve(null);
              return;
            }

            resolve(info);
          },
          messageID
        );
      });

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
      "❌ حدث خطأ أثناء فحص حيوانك.\n\n" +
      `📝 ${error.message}`,
      threadID,
      messageID
    );
  }
};

// ============================================================
// HANDLE REPLY
// ============================================================

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
    body = ""
  } = event;

  try {

    // ========================================================
    // صاحب الجلسة
    // ========================================================

    if (
      handleReply.author &&
      String(handleReply.author) !==
      String(senderID)
    ) {
      return;
    }

    const Pets =
      getPetsModel(models);

    const Currencies =
      getCurrenciesModel(models);

    if (!Pets || !Currencies) {
      return api.sendMessage(
        "❌ تعذر تحميل مودلات الحيوانات أو العملات.",
        threadID,
        messageID
      );
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
          `❌ الحيوان رقم ${number} غير موجود.\n` +
          `اختر رقمًا من 1 إلى ${PETS.length}.`,
          threadID,
          messageID
        );
      }

      // ------------------------------------------------------
      // التأكد من عدم امتلاك حيوان
      // ------------------------------------------------------

      const existing =
        await Pets.findOne({
          where: {
            userID: String(senderID)
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

      // ------------------------------------------------------
      // مجاني
      // ------------------------------------------------------

      if (selected.price === 0) {

        const result =
          await createPet(
            Pets,
            senderID,
            selected
          );

        removeReply(handleReply);

        return api.sendMessage(
          result.message,
          threadID,
          messageID
        );
      }

      // ------------------------------------------------------
      // مدفوع
      // ------------------------------------------------------

      const sent =
        await new Promise(resolve => {

          api.sendMessage(

            "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n" +

            `${selected.emoji} ${selected.name}\n\n` +

            `الندرة: ${selected.rarity}\n` +
            `القوة: ${selected.power}\n` +
            `السعر: ${selected.price} عملة\n\n` +

            "هل تريد شراء هذا الحيوان؟\n\n" +

            "↪️ رد بـ نعم للتأكيد\n" +
            "↪️ رد بـ لا للإلغاء",

            threadID,

            (error, info) => {

              if (error) {
                resolve(null);
                return;
              }

              resolve(info);
            },

            messageID
          );

        });

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
            "pet_purchase",

          petID:
            selected.id
        });
      }

      return;
    }

    // ========================================================
    // تأكيد الشراء
    // ========================================================

    if (
      handleReply.type ===
      "pet_purchase"
    ) {

      const answer =
        input.toLowerCase();

      if (
        answer === "لا" ||
        answer === "لا شراء" ||
        answer === "الغاء" ||
        answer === "إلغاء"
      ) {

        removeReply(handleReply);

        return api.sendMessage(
          "تم إلغاء عملية الشراء.",
          threadID,
          messageID
        );
      }

      if (
        answer !== "نعم" &&
        answer !== "نعم شراء"
      ) {
        return api.sendMessage(
          "↪️ رد بـ نعم للشراء أو لا للإلغاء.",
          threadID,
          messageID
        );
      }

      const selected =
        getPetByID(
          handleReply.petID
        );

      if (!selected) {
        removeReply(handleReply);

        return api.sendMessage(
          "❌ الحيوان غير موجود.",
          threadID,
          messageID
        );
      }

      // ------------------------------------------------------
      // التأكد من الحيوان
      // ------------------------------------------------------

      const existing =
        await Pets.findOne({
          where: {
            userID: String(senderID)
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

      // ------------------------------------------------------
      // حساب العملات
      // ------------------------------------------------------

      let currency =
        await Currencies.findOne({
          where: {
            userID: String(senderID)
          }
        });

      if (!currency) {

        currency =
          await Currencies.create({
            userID: String(senderID),
            money: 0,
            exp: 0
          });
      }

      const money =
        Number(currency.money || 0);

      if (
        money <
        selected.price
      ) {

        return api.sendMessage(
          "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n" +

          "❌ لا تملك عملات كافية.\n\n" +

          `السعر: ${selected.price}\n` +
          `رصيدك: ${money}\n` +
          `ينقصك: ${selected.price - money}`,

          threadID,
          messageID
        );
      }

      // ------------------------------------------------------
      // خصم العملات
      // ------------------------------------------------------

      await currency.update({
        money:
          money - selected.price
      });

      try {

        // ----------------------------------------------------
        // إنشاء الحيوان
        // ----------------------------------------------------

        await Pets.create({

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

          status:
            "سعيد",

          exp:
            0
        });

      } catch (error) {

        // ----------------------------------------------------
        // إرجاع المال في حالة فشل إنشاء الحيوان
        // ----------------------------------------------------

        try {
          await currency.update({
            money
          });
        } catch {}

        throw error;
      }

      removeReply(handleReply);

      return api.sendMessage(

        "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n" +

        `${selected.emoji} تم شراء حيوانك بنجاح\n\n` +

        `الحيوان: ${selected.name}\n` +
        `الندرة: ${selected.rarity}\n` +
        `القوة: ${selected.power}\n` +
        `السعر: ${selected.price}\n` +
        `المتبقي: ${money - selected.price}\n\n` +

        `المستوى: 1\n` +
        `XP: 0\n` +
        `الحالة: سعيد`,

        threadID,
        messageID
      );
    }

    // ========================================================
    // إجراءات الحيوان
    // ========================================================

    if (
      handleReply.type ===
      "pet_actions"
    ) {

      const choice =
        Number(input);

      const pet =
        await Pets.findOne({
          where: {
            userID: String(senderID)
          }
        });

      if (!pet) {

        removeReply(handleReply);

        return api.sendMessage(
          "❌ لم تعد تملك حيوانًا.",
          threadID,
          messageID
        );
      }

      // ------------------------------------------------------
      // بيع
      // ------------------------------------------------------

      if (choice === 1) {

        const data =
          pet.toJSON
            ? pet.toJSON()
            : pet;

        const price =
          getSellPrice(data);

        const sent =
          await new Promise(resolve => {

            api.sendMessage(

              "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n" +

              `هل تريد بيع ${data.name}؟\n\n` +

              `قيمة البيع: ${price} عملة\n\n` +

              "↪️ رد بـ نعم للتأكيد\n" +
              "↪️ رد بـ لا للإلغاء",

              threadID,

              (error, info) => {

                if (error) {
                  resolve(null);
                  return;
                }

                resolve(info);
              },

              messageID
            );

          });

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
              "pet_sell_confirm",

            sellPrice:
              price
          });
        }

        return;
      }

      // ------------------------------------------------------
      // إطعام
      // ------------------------------------------------------

      if (choice === 2) {

        const hunger =
          Number(pet.hunger ?? 100);

        const newHunger =
          Math.min(
            100,
            hunger + 20
          );

        await pet.update({

          hunger:
            newHunger,

          status:
            newHunger >= 70
              ? "سعيد"
              : "طبيعي"
        });

        removeReply(handleReply);

        return api.sendMessage(

          "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n" +

          `🍖 تم إطعام ${pet.name}\n\n` +

          `الشبع: ${newHunger}/100\n` +
          `الحالة: ${newHunger >= 70 ? "سعيد" : "طبيعي"}`,

          threadID,
          messageID
        );
      }

      // ------------------------------------------------------
      // تدريب
      // ------------------------------------------------------

      if (choice === 3) {

        const currentExp =
          Number(pet.exp || 0);

        const currentLevel =
          Number(pet.level || 1);

        const newExp =
          currentExp + 20;

        const required =
          currentLevel * 100;

        let level =
          currentLevel;

        let exp =
          newExp;

        if (newExp >= required) {

          level =
            currentLevel + 1;

          exp =
            newExp - required;
        }

        await pet.update({

          exp,

          level,

          status:
            "سعيد"
        });

        removeReply(handleReply);

        return api.sendMessage(

          "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n" +

          `🏋️ تم تدريب ${pet.name}\n\n` +

          `XP: ${exp}\n` +
          `المستوى: ${level}` +
          (
            level > currentLevel
              ? "\n\n🎉 ارتفع مستوى حيوانك!"
              : ""
          ),

          threadID,
          messageID
        );
      }

      return api.sendMessage(
        "❌ اختر رقمًا من 1 إلى 3.",
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

      if (answer !== "نعم") {

        return api.sendMessage(
          "↪️ رد بـ نعم للبيع أو لا للإلغاء.",
          threadID,
          messageID
        );
      }

      const pet =
        await Pets.findOne({
          where: {
            userID: String(senderID)
          }
        });

      if (!pet) {

        removeReply(handleReply);

        return api.sendMessage(
          "❌ لم تعد تملك حيوانًا.",
          threadID,
          messageID
        );
      }

      const price =
        getSellPrice(
          pet.toJSON
            ? pet.toJSON()
            : pet
        );

      let currency =
        await Currencies.findOne({
          where: {
            userID: String(senderID)
          }
        });

      if (!currency) {

        currency =
          await Currencies.create({
            userID: String(senderID),
            money: 0,
            exp: 0
          });
      }

      const money =
        Number(currency.money || 0);

      await currency.update({

        money:
          money + price
      });

      const petName =
        pet.name;

      await pet.destroy();

      removeReply(handleReply);

      return api.sendMessage(

        "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n" +

        `💰 تم بيع ${petName} بنجاح\n\n` +

        `قيمة البيع: ${price} عملة\n` +
        `رصيدك الجديد: ${money + price}`,

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