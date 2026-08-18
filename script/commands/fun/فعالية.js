const fs = require("fs-extra");
const path = "./data/events.json";

module.exports.config = {
  name: "فعالية",
  version: "6.0.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "نظام فعاليات عشوائية بالنقاط",
  commandCategory: "Fun",
  usages: "فعالية إنشاء [النقاط]",
  cooldowns: 3
};


// =====================================================
// إنشاء ملف البيانات
// =====================================================

if (!fs.existsSync("./data")) {
  fs.ensureDirSync("./data");
}

if (!fs.existsSync(path)) {
  fs.writeFileSync(path, JSON.stringify({}, null, 2));
}


// =====================================================
// قراءة البيانات
// =====================================================

function loadData() {
  try {
    return JSON.parse(
      fs.readFileSync(path, "utf8")
    );
  } catch {
    return {};
  }
}


// =====================================================
// حفظ البيانات
// =====================================================

function saveData(data) {
  fs.writeFileSync(
    path,
    JSON.stringify(data, null, 2)
  );
}


// =====================================================
// تطبيع الإجابة
// =====================================================

function normalizeAnswer(text) {

  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[إأآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ـ/g, "")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[؟?!.,،؛:]/g, "")
    .replace(/\s+/g, " ");
}


// =====================================================
// التحقق من الإجابة
// =====================================================

function checkAnswer(input, answers) {

  const normalized =
    normalizeAnswer(input);

  return answers.some(answer =>
    normalizeAnswer(answer) === normalized
  );
}


// =====================================================
// الحصول على اسم المستخدم
// =====================================================

async function getUserName(api, id) {

  try {

    const info =
      await api.getUserInfo(String(id));

    return (
      info?.[id]?.name ||
      info?.[String(id)]?.name ||
      "عضو"
    );

  } catch {

    return "عضو";
  }
}


// =====================================================
// التحديات
// =====================================================

const challenges = {

  "تفكيك": [

    {
      question: "🔹 فكك كلمة «مدرسة» إلى حروفها",
      answers: [
        "م د ر س ة",
        "م، د، ر، س، ة",
        "م د ر س ه"
      ]
    },

    {
      question: "🔹 فكك كلمة «كتاب» إلى حروفها",
      answers: [
        "ك ت ا ب",
        "ك، ت، ا، ب"
      ]
    },

    {
      question: "🔹 فكك كلمة «مكتبة» إلى حروفها",
      answers: [
        "م ك ت ب ة",
        "م، ك، ت، ب، ة"
      ]
    },

    {
      question: "🔹 فكك كلمة «سيارة» إلى حروفها",
      answers: [
        "س ي ا ر ة",
        "س، ي، ا، ر، ة"
      ]
    },

    {
      question: "🔹 فكك كلمة «حديقة» إلى حروفها",
      answers: [
        "ح د ي ق ة",
        "ح، د، ي، ق، ة"
      ]
    }

  ],


  "تجميع": [

    {
      question: "🔹 جمّع الحروف: (م، د، ر، س، ة)",
      answers: ["مدرسة"]
    },

    {
      question: "🔹 جمّع الحروف: (ك، ت، ا، ب)",
      answers: ["كتاب"]
    },

    {
      question: "🔹 جمّع الحروف: (س، ي، ا، ر، ة)",
      answers: ["سيارة"]
    },

    {
      question: "🔹 جمّع الحروف: (ح، د، ي، ق، ة)",
      answers: ["حديقة"]
    },

    {
      question: "🔹 جمّع الحروف: (م، ك، ت، ب، ة)",
      answers: ["مكتبة"]
    },

    {
      question: "🔹 جمّع الحروف: (ج، ا، م، ع، ة)",
      answers: ["جامعة"]
    }

  ],


  "اسم ايموجي": [

    {
      question: "🔹 ما اسم هذا الإيموجي؟ 🌙",
      answers: ["قمر", "الهلال"]
    },

    {
      question: "🔹 ما اسم هذا الإيموجي؟ ☀️",
      answers: ["شمس", "الشمس"]
    },

    {
      question: "🔹 ما اسم هذا الإيموجي؟ 🌸",
      answers: ["زهرة", "وردة"]
    },

    {
      question: "🔹 ما اسم هذا الإيموجي؟ 🍎",
      answers: ["تفاحة", "تفاح"]
    },

    {
      question: "🔹 ما اسم هذا الإيموجي؟ 🚗",
      answers: ["سيارة"]
    },

    {
      question: "🔹 ما اسم هذا الإيموجي؟ 🌊",
      answers: ["موجة", "بحر"]
    },

    {
      question: "🔹 ما اسم هذا الإيموجي؟ 🦋",
      answers: ["فراشة"]
    },

    {
      question: "🔹 ما اسم هذا الإيموجي؟ 🐱",
      answers: ["قطة", "قط"]
    },

    {
      question: "🔹 ما اسم هذا الإيموجي؟ 🐶",
      answers: ["كلب"]
    },

    {
      question: "🔹 ما اسم هذا الإيموجي؟ 🍉",
      answers: ["بطيخ"]
    }

  ],


  "ثقافي": [

    {
      question: "🔹 ما عاصمة مصر؟",
      answers: ["القاهرة"]
    },

    {
      question: "🔹 ما عاصمة تونس؟",
      answers: ["تونس"]
    },

    {
      question: "🔹 ما عاصمة فرنسا؟",
      answers: ["باريس"]
    },

    {
      question: "🔹 ما عاصمة اليابان؟",
      answers: ["طوكيو"]
    },

    {
      question: "🔹 كم عدد قارات العالم؟",
      answers: ["7", "سبع", "سبعة"]
    },

    {
      question: "🔹 ما أكبر قارة في العالم؟",
      answers: ["اسيا", "آسيا"]
    },

    {
      question: "🔹 ما أعلى جبل في العالم؟",
      answers: ["ايفرست", "إيفرست"]
    },

    {
      question: "🔹 ما أكبر محيط في العالم؟",
      answers: ["المحيط الهادئ", "الهادئ"]
    },

    {
      question: "🔹 كم عدد ألوان قوس قزح؟",
      answers: ["7", "سبعة"]
    },

    {
      question: "🔹 ما الكوكب المعروف بالكوكب الأحمر؟",
      answers: ["المريخ"]
    },

    {
      question: "🔹 ما أسرع حيوان بري؟",
      answers: ["الفهد"]
    },

    {
      question: "🔹 ما اللغة الأكثر انتشارًا من حيث عدد المتحدثين الأصليين؟",
      answers: ["الصينية", "الصينية المندرينية", "الماندرين"]
    }

  ],


  "ديني": [

    {
      question: "🔹 كم عدد أركان الإسلام؟",
      answers: ["5", "خمسة"]
    },

    {
      question: "🔹 كم عدد أركان الإيمان؟",
      answers: ["6", "ستة"]
    },

    {
      question: "🔹 ما أول سورة في القرآن؟",
      answers: ["الفاتحة"]
    },

    {
      question: "🔹 كم عدد الصلوات المفروضة؟",
      answers: ["5", "خمسة"]
    },

    {
      question: "🔹 ما شهر الصيام؟",
      answers: ["رمضان"]
    },

    {
      question: "🔹 من هو خاتم الأنبياء؟",
      answers: ["محمد", "محمد صلى الله عليه وسلم"]
    },

    {
      question: "🔹 ما القبلة الأولى للمسلمين؟",
      answers: ["المسجد الاقصى", "الأقصى", "بيت المقدس"]
    },

    {
      question: "🔹 كم عدد سور القرآن الكريم؟",
      answers: ["114", "١١٤"]
    },

    {
      question: "🔹 ما أطول سورة في القرآن؟",
      answers: ["البقرة"]
    },

    {
      question: "🔹 ما أقصر سورة في القرآن؟",
      answers: ["الكوثر"]
    }

  ],


  "سرعة": [

    {
      question: "🔹 اكتب اسم أول شهر في السنة",
      answers: ["يناير", "جانفي"]
    },

    {
      question: "🔹 اكتب عكس كلمة «كبير»",
      answers: ["صغير"]
    },

    {
      question: "🔹 اكتب عكس كلمة «ليل»",
      answers: ["نهار"]
    },

    {
      question: "🔹 اكتب لون السماء في يوم صافٍ",
      answers: ["ازرق", "أزرق"]
    },

    {
      question: "🔹 اكتب عدد أصابع اليد الواحدة",
      answers: ["5", "خمسة"]
    },

    {
      question: "🔹 اكتب اسم الحيوان الذي يقول «مواء»",
      answers: ["قطة", "قط"]
    },

    {
      question: "🔹 اكتب اسم الحيوان الذي يقول «نباح»",
      answers: ["كلب"]
    }

  ],


  "أنمي": [

    {
      question: "🔹 ما اسم بطل أنمي One Piece؟",
      answers: ["لوفي", "مونكي دي لوفي", "مونكي دي لوفي"]
    },

    {
      question: "🔹 ما اسم بطل Dragon Ball؟",
      answers: ["غوكو", "جوكو", "سون غوكو"]
    },

    {
      question: "🔹 ما اسم بطل Naruto؟",
      answers: ["ناروتو", "ناروتو اوزوماكي"]
    },

    {
      question: "🔹 ما اسم السيف الشهير في Demon Slayer الذي يستخدمه تانجيرو؟",
      answers: ["نيتشيرين", "سيف نيتشيرين"]
    },

    {
      question: "🔹 ما اسم أخ ناروتو بالتبني في بعض أحداث القصة؟",
      answers: ["ساسكي"]
    },

    {
      question: "🔹 من هو قائد قبعة القش؟",
      answers: ["لوفي"]
    },

    {
      question: "🔹 ما اسم عين ساسكي الشهيرة؟",
      answers: ["شارينغان", "الشارينغان"]
    }

  ]

};


// =====================================================
// اختيار لعبة عشوائية
// =====================================================

function getRandomChallenge() {

  const types =
    Object.keys(challenges);

  const type =
    types[
      Math.floor(
        Math.random() * types.length
      )
    ];

  const list =
    challenges[type];

  const challenge =
    list[
      Math.floor(
        Math.random() * list.length
      )
    ];

  return {
    type,
    question: challenge.question,
    answers: challenge.answers
  };
}


// =====================================================
// إنشاء فعالية جديدة
// =====================================================

module.exports.run = async function ({
  api,
  event,
  args
}) {

  const {
    threadID,
    messageID,
    senderID
  } = event;

  const data = loadData();

  if (!data[threadID]) {
    data[threadID] = null;
  }


  const action =
    String(args[0] || "")
      .toLowerCase();


  // ===================================================
  // إنشاء
  // ===================================================

  if (
    action === "إنشاء" ||
    action === "انشاء" ||
    action === "create"
  ) {

    const target =
      Number(args[1]);

    if (
      !Number.isInteger(target) ||
      target <= 0
    ) {

      return api.sendMessage(
        `⌬ ━━ 𝗛𝗜𝗡𝗔 FUN ━━ ⌬

⚠️ حدد عدد النقاط المطلوبة للفوز.

مثال:
فعالية إنشاء 10`,
        threadID,
        messageID
      );
    }


    if (
      data[threadID]?.active
    ) {

      return api.sendMessage(
        `⌬ ━━ 𝗛𝗜𝗡𝗔 FUN ━━ ⌬

⚠️ توجد فعالية نشطة بالفعل.`,
        threadID,
        messageID
      );
    }


    data[threadID] = {

      active: true,

      started: false,

      creator:
        String(senderID),

      targetPoints:
        target,

      participants: [],

      scores: {},

      round: 0,

      currentChallenge: null,

      answered: false,

      winner: null
    };


    saveData(data);


    const creatorName =
      await getUserName(
        api,
        senderID
      );


    return api.sendMessage(
      `⌬ ━━ 𝗛𝗜𝗡𝗔 FUN ━━ ⌬

🎉 تم إنشاء فعالية جديدة!

👑 المنشئ: ${creatorName}
🏆 هدف الفوز: ${target} نقطة

📝 الأوامر:

• فعالية انضمام
• فعالية بدء
• فعالية حالة
• فعالية انهاء

يمكن للأعضاء الانضمام قبل بدء الفعالية.`,
      threadID,
      messageID
    );
  }


  // ===================================================
  // الانضمام
  // ===================================================

  if (
    action === "انضمام" ||
    action === "انضم" ||
    action === "join"
  ) {

    const game =
      data[threadID];

    if (
      !game?.active
    ) {

      return api.sendMessage(
        `⌬ ━━ 𝗛𝗜𝗡𝗔 FUN ━━ ⌬

❌ لا توجد فعالية نشطة.`,
        threadID,
        messageID
      );
    }


    if (game.started) {

      return api.sendMessage(
        `⌬ ━━ 𝗛𝗜𝗡𝗔 FUN ━━ ⌬

⚠️ بدأت الفعالية بالفعل.`,
        threadID,
        messageID
      );
    }


    if (
      game.participants.includes(
        String(senderID)
      )
    ) {

      return api.sendMessage(
        `⌬ ━━ 𝗛𝗜𝗡𝗔 FUN ━━ ⌬

⚠️ أنت مشترك بالفعل.`,
        threadID,
        messageID
      );
    }


    game.participants.push(
      String(senderID)
    );

    game.scores[
      String(senderID)
    ] = 0;


    saveData(data);


    const name =
      await getUserName(
        api,
        senderID
      );


    return api.sendMessage(
      `⌬ ━━ 𝗛𝗜𝗡𝗔 FUN ━━ ⌬

✅ انضم ${name} إلى الفعالية!

👥 عدد المشاركين:
${game.participants.length}`,
      threadID,
      messageID
    );
  }


  // ===================================================
  // بدء الفعالية
  // ===================================================

  if (
    action === "بدء" ||
    action === "ابدأ" ||
    action === "start"
  ) {

    const game =
      data[threadID];

    if (
      !game?.active
    ) {

      return api.sendMessage(
        `⌬ ━━ 𝗛𝗜𝗡𝗔 FUN ━━ ⌬

❌ لا توجد فعالية نشطة.`,
        threadID,
        messageID
      );
    }


    if (
      String(senderID) !==
      String(game.creator)
    ) {

      return api.sendMessage(
        `⌬ ━━ 𝗛𝗜𝗡𝗔 FUN ━━ ⌬

⛔ المنشئ فقط يستطيع بدء الفعالية.`,
        threadID,
        messageID
      );
    }


    if (game.started) {

      return api.sendMessage(
        `⌬ ━━ 𝗛𝗜𝗡𝗔 FUN ━━ ⌬

⚠️ الفعالية بدأت بالفعل.`,
        threadID,
        messageID
      );
    }


    if (
      game.participants.length < 2
    ) {

      return api.sendMessage(
        `⌬ ━━ 𝗛𝗜𝗡𝗔 FUN ━━ ⌬

⚠️ يجب أن يكون هناك مشاركان على الأقل.`,
        threadID,
        messageID
      );
    }


    game.started = true;
    game.round = 1;
    game.answered = false;


    const participants = [];

    for (
      const id of game.participants
    ) {

      const name =
        await getUserName(
          api,
          id
        );

      participants.push(
        `• ${name} — 0 نقطة`
      );
    }


    const challenge =
      getRandomChallenge();

    game.currentChallenge =
      challenge;


    saveData(data);


    const message =
      `⌬ ━━ 𝗛𝗜𝗡𝗔 FUN ━━ ⌬

🏁 بدأت الفعالية!

🏆 هدف الفوز:
${game.targetPoints} نقطة

👥 المشاركون:

${participants.join("\n")}

━━━━━━━━━━━━━━

🎮 اللعبة: ${challenge.type}

📊 الجولة:
1

❓ التحدي:

${challenge.question}

━━━━━━━━━━━━━━

⚡ أسرع إجابة صحيحة تفوز بالنقطة!`;


    return api.sendMessage(
      message,
      threadID,
      (err, info) => {

        if (
          err ||
          !info?.messageID
        ) {
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
            String(game.creator),

          threadID:
            String(threadID),

          type:
            "eventGame"
        });

      },
      messageID
    );
  }


  // ===================================================
  // حالة الفعالية
  // ===================================================

  if (
    action === "حالة" ||
    action === "status"
  ) {

    const game =
      data[threadID];

    if (
      !game?.active
    ) {

      return api.sendMessage(
        `⌬ ━━ 𝗛𝗜𝗡𝗔 FUN ━━ ⌬

❌ لا توجد فعالية نشطة.`,
        threadID,
        messageID
      );
    }


    let list = "";

    for (
      let i = 0;
      i < game.participants.length;
      i++
    ) {

      const id =
        game.participants[i];

      const name =
        await getUserName(
          api,
          id
        );

      list +=
        `${i + 1}. ${name} — ${game.scores[id] || 0} نقطة\n`;
    }


    return api.sendMessage(
      `⌬ ━━ 𝗛𝗜𝗡𝗔 FUN ━━ ⌬

📊 حالة الفعالية

🏆 هدف الفوز:
${game.targetPoints} نقطة

🎮 الجولة:
${game.round}

👥 المشاركون:

${list}`,
      threadID,
      messageID
    );
  }


  // ===================================================
  // إنهاء
  // ===================================================

  if (
    action === "انهاء" ||
    action === "إنهاء" ||
    action === "end"
  ) {

    const game =
      data[threadID];

    if (
      !game?.active
    ) {

      return api.sendMessage(
        `⌬ ━━ 𝗛𝗜𝗡𝗔 FUN ━━ ⌬

❌ لا توجد فعالية.`,
        threadID,
        messageID
      );
    }


    if (
      String(senderID) !==
      String(game.creator)
    ) {

      return api.sendMessage(
        `⌬ ━━ 𝗛𝗜𝗡𝗔 FUN ━━ ⌬

⛔ المنشئ فقط يستطيع إنهاء الفعالية.`,
        threadID,
        messageID
      );
    }


    const sorted =
      Object.entries(
        game.scores
      ).sort(
        (a, b) => b[1] - a[1]
      );


    let results = "";

    for (
      let i = 0;
      i < sorted.length;
      i++
    ) {

      const id =
        sorted[i][0];

      const name =
        await getUserName(
          api,
          id
        );

      results +=
        `${i + 1}. ${name} — ${sorted[i][1]} نقطة\n`;
    }


    data[threadID] = null;

    saveData(data);


    return api.sendMessage(
      `⌬ ━━ 𝗛𝗜𝗡𝗔 FUN ━━ ⌬

🏁 تم إنهاء الفعالية!

🏆 النتائج:

${results || "لا توجد نتائج"}

شكراً للجميع على المشاركة.`,
      threadID,
      messageID
    );
  }


  // ===================================================
  // مساعدة
  // ===================================================

  return api.sendMessage(
    `⌬ ━━ 𝗛𝗜𝗡𝗔 FUN ━━ ⌬

🎮 أوامر الفعالية:

فعالية إنشاء 10
فعالية انضمام
فعالية بدء
فعالية حالة
فعالية انهاء

مثال كامل:

1️⃣ فعالية إنشاء 10
2️⃣ فعالية انضمام
3️⃣ فعالية انضمام
4️⃣ فعالية بدء

🏆 أول مشارك يصل إلى 10 نقاط يفوز.`,
    threadID,
    messageID
  );
};


// =====================================================
// HANDLE REPLY
// =====================================================

module.exports.handleReply = async function ({
  api,
  event,
  handleReply
}) {

  try {

    if (
      handleReply.type !==
      "eventGame"
    ) {
      return;
    }


    const {
      threadID,
      senderID,
      body,
      messageID
    } = event;


    if (!body) {
      return;
    }


    const data =
      loadData();

    const game =
      data[threadID];


    if (
      !game?.active ||
      !game.started
    ) {
      return;
    }


    // يجب أن يكون مشاركاً
    if (
      !game.participants.includes(
        String(senderID)
      )
    ) {

      return;
    }


    // الجولة تم حلها
    if (
      game.answered
    ) {
      return;
    }


    const challenge =
      game.currentChallenge;


    if (
      !challenge
    ) {
      return;
    }


    const answer =
      String(body)
        .trim();


    // =================================================
    // إجابة خاطئة
    // =================================================

    if (
      !checkAnswer(
        answer,
        challenge.answers
      )
    ) {

      return;
    }


    // =================================================
    // منع إجابتين بنفس اللحظة
    // =================================================

    game.answered = true;


    const id =
      String(senderID);


    game.scores[id] =
      (game.scores[id] || 0) + 1;


    const name =
      await getUserName(
        api,
        id
      );


    saveData(data);


    // =================================================
    // الفوز
    // =================================================

    if (
      game.scores[id] >=
      game.targetPoints
    ) {

      game.winner = id;

      saveData(data);


      const sorted =
        Object.entries(
          game.scores
        ).sort(
          (a, b) => b[1] - a[1]
        );


      let results = "";

      for (
        let i = 0;
        i < sorted.length;
        i++
      ) {

        const playerID =
          sorted[i][0];

        const playerName =
          await getUserName(
            api,
            playerID
          );

        results +=
          `${i + 1}. ${playerName} — ${sorted[i][1]} نقطة\n`;
      }


      data[threadID] = null;

      saveData(data);


      return api.sendMessage(
        `⌬ ━━ 𝗛𝗜𝗡𝗔 FUN ━━ ⌬

🏆 انتهت الفعالية!

👑 الفائز:
${name}

🎯 النقاط:
${game.scores[id]}/${game.targetPoints}

━━━━━━━━━━━━━━

📊 النتائج:

${results}

🎉 مبروك للفائز!`,
        threadID,
        messageID
      );
    }


    // =================================================
    // جولة جديدة
    // =================================================

    game.round++;

    game.answered = false;


    const nextChallenge =
      getRandomChallenge();


    game.currentChallenge =
      nextChallenge;


    saveData(data);


    return api.sendMessage(
      `⌬ ━━ 𝗛𝗜𝗡𝗔 FUN ━━ ⌬

✅ إجابة صحيحة!

👑 ${name}
+1 نقطة

🎯 نقاطك:
${game.scores[id]}/${game.targetPoints}

━━━━━━━━━━━━━━

🎮 اللعبة الجديدة:
${nextChallenge.type}

📊 الجولة:
${game.round}

❓ التحدي:

${nextChallenge.question}

━━━━━━━━━━━━━━

⚡ أول إجابة صحيحة تحصل على النقطة!`,
      threadID,
      (err, info) => {

        if (
          err ||
          !info?.messageID
        ) {
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
            String(game.creator),

          threadID:
            String(threadID),

          type:
            "eventGame"
        });

      }
    );

  } catch (error) {

    console.error(
      "❌ فعالية handleReply error:",
      error
    );

  }
};