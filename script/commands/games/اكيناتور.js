const { Aki } = require("aki-api");
const axios = require("axios");

module.exports.config = {
  name: "اكيناتور",
  version: "3.0.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "لعبة اكيناتور يخمن الشخصية",
  commandCategory: "Games",
  usages: "اكيناتور",
  cooldowns: 5
};

// ============================================================
// زخرفة HINA
// ============================================================

const HEADER = "⌬ ━━ 𝗛𝗜𝗡𝗔 〢 اكيناتور ━━ ⌬";

const FOOTER = "╰━━━━━━━━━━━━━━━━╯";

// ============================================================
// الإجابات
// ============================================================

const ANSWERS = {
  "نعم": 0,
  "لا": 1,
  "لا اعلم": 2,
  "لا أعلم": 2,
  "من الممكن": 3,
  "الظاهر لا": 4,
  "الضاهر لا": 4
};

const ANSWER_TEXT =
  "نعم | لا | لا اعلم | من الممكن | الظاهر لا | رجوع";

// ============================================================
// إنشاء لعبة جديدة
// ============================================================

async function createGame() {
  const aki = new Aki({
    region: "ar",
    childMode: true
  });

  await aki.start();

  return aki;
}

// ============================================================
// رسالة السؤال
// ============================================================

function questionMessage(aki) {
  return `${HEADER}

${aki.question} 👀

الرجاء الرد ب:

${ANSWER_TEXT}

${FOOTER}`;
}

// ============================================================
// رسالة الخطأ
// ============================================================

function errorMessage(text) {
  return `${HEADER}

❌ حدث خطأ أثناء تشغيل اكيناتور

${text}

${FOOTER}`;
}

// ============================================================
// RUN
// ============================================================

module.exports.run = async function({
  api,
  event
}) {
  const {
    threadID,
    messageID,
    senderID
  } = event;

  try {

    if (
      api.setMessageReaction
    ) {
      api.setMessageReaction(
        "🧞",
        messageID,
        () => {},
        true
      );
    }

    const aki = await createGame();

    return api.sendMessage(
      questionMessage(aki),
      threadID,
      (err, info) => {

        if (err || !info) {
          return;
        }

        global.client.handleReply.push({
          name: this.config.name,
          messageID: info.messageID,
          author: senderID,
          aki: aki
        });

      },
      messageID
    );

  } catch (error) {

    console.error(
      "[AKINATOR START ERROR]",
      error
    );

    return api.sendMessage(
      errorMessage(
        "المارد دايخ شوية.. أعد المحاولة"
      ),
      threadID,
      messageID
    );
  }
};

// ============================================================
// HANDLE REPLY
// ============================================================

module.exports.handleReply = async function({
  api,
  event,
  handleReply
}) {

  const {
    threadID,
    messageID,
    senderID
  } = event;

  // ----------------------------------------------------------
  // صاحب اللعبة فقط يستطيع الإجابة
  // ----------------------------------------------------------

  if (
    String(senderID) !==
    String(handleReply.author)
  ) {
    return;
  }

  if (!handleReply.aki) {

    return api.sendMessage(
      `${HEADER}

❌ انتهت جلسة اكيناتور

اكتب:
.اكيناتور

لبدء لعبة جديدة

${FOOTER}`,
      threadID,
      messageID
    );

  }

  const input = String(
    event.body || ""
  )
    .trim()
    .toLowerCase();

  // ==========================================================
  // الرجوع
  // ==========================================================

  if (input === "رجوع") {

    try {

      await handleReply.aki.back();

      return api.sendMessage(
        questionMessage(
          handleReply.aki
        ),
        threadID,
        (err, info) => {

          if (err || !info) {
            return;
          }

          global.client.handleReply.push({
            name: this.config.name,
            messageID: info.messageID,
            author: senderID,
            aki: handleReply.aki
          });

        },
        messageID
      );

    } catch (error) {

      console.error(
        "[AKINATOR BACK ERROR]",
        error
      );

      return api.sendMessage(
        `${HEADER}

❌ لا يمكن الرجوع في هذه المرحلة

${FOOTER}`,
        threadID,
        messageID
      );

    }
  }

  // ==========================================================
  // التحقق من الإجابة
  // ==========================================================

  if (
    !Object.prototype.hasOwnProperty.call(
      ANSWERS,
      input
    )
  ) {

    return api.sendMessage(
      `${HEADER}

⚠️ إجابة غير صحيحة

الرجاء الرد ب:

${ANSWER_TEXT}

${FOOTER}`,
      threadID,
      messageID
    );

  }

  const answer =
    ANSWERS[input];

  // ==========================================================
  // إرسال الإجابة إلى Akinator
  // ==========================================================

  try {

    await handleReply.aki.step(
      answer
    );

    // ========================================================
    // فحص هل أصبح هناك تخمين
    // ========================================================

    let result = null;

    try {

      if (
        typeof handleReply.aki.answer ===
        "function"
      ) {

        result =
          await handleReply.aki.answer();

      } else if (
        handleReply.aki.currentStep >= 0 &&
        handleReply.aki.progression >= 80
      ) {

        result =
          handleReply.aki;

      }

    } catch (answerError) {

      console.log(
        "[AKINATOR ANSWER CHECK]",
        answerError.message
      );

    }

    // ========================================================
    // استخراج بيانات الشخصية
    // ========================================================

    const character =
      result ||
      handleReply.aki;

    const name =
      character.name ||
      character.name_proposition ||
      character.nameProposition ||
      null;

    const description =
      character.description ||
      character.description_proposition ||
      character.descriptionProposition ||
      "لا توجد نبذة متاحة";

    const photo =
      character.photo ||
      character.photo_url ||
      character.photoUrl ||
      null;

    // ========================================================
    // إذا وجد التخمين
    // ========================================================

    if (name) {

      let body = `${HEADER}

🪄 ┃ إســم الشـخصـية
❨ ${name} ❩

⌯↢ نبــــذة عنها
${description}

━━━━━━━━━━━━━━━━━━

اكتب:
.اكيناتور

للعب مرة أخرى

${FOOTER}`;

      // ------------------------------------------------------
      // إرسال الصورة
      // ------------------------------------------------------

      if (photo) {

        try {

          const response =
            await axios.get(
              photo,
              {
                responseType: "stream",
                timeout: 15000
              }
            );

          return api.sendMessage(
            {
              body: body,
              attachment:
                response.data
            },
            threadID,
            messageID
          );

        } catch (imageError) {

          console.log(
            "[AKINATOR IMAGE ERROR]",
            imageError.message
          );

        }

      }

      return api.sendMessage(
        body,
        threadID,
        messageID
      );

    }

    // ========================================================
    // سؤال جديد
    // ========================================================

    return api.sendMessage(
      questionMessage(
        handleReply.aki
      ),
      threadID,
      (err, info) => {

        if (err || !info) {
          return;
        }

        global.client.handleReply.push({
          name: this.config.name,
          messageID: info.messageID,
          author: senderID,
          aki: handleReply.aki
        });

      },
      messageID
    );

  } catch (error) {

    console.error(
      "[AKINATOR STEP ERROR]",
      error
    );

    return api.sendMessage(
      errorMessage(
        "المارد دايخ شوية.. أعد المحاولة\n\n" +
        `السبب: ${error.message || error}`
      ),
      threadID,
      messageID
    );

  }
};