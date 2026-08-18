const fs = require("fs-extra");

module.exports.config = {
  name: "فعالية",
  version: "7.0.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "نظام فعاليات وتحديات جماعية متكامل",
  commandCategory: "Fun",
  usages: "فعالية إنشاء | انضمام | بدء | حالة | نتيجة | إنهاء",
  cooldowns: 3
};

// =====================================================
// الإعدادات
// =====================================================

const DATA_PATH = "./data/events.json";

if (!fs.existsSync("./data")) {
  fs.ensureDirSync("./data");
}

if (!fs.existsSync(DATA_PATH)) {
  fs.writeFileSync(DATA_PATH, "{}");
}


// =====================================================
// قراءة وحفظ البيانات
// =====================================================

function loadData() {
  try {
    return JSON.parse(
      fs.readFileSync(DATA_PATH, "utf8")
    );
  } catch (e) {
    return {};
  }
}

function saveData(data) {
  fs.writeFileSync(
    DATA_PATH,
    JSON.stringify(data, null, 2)
  );
}


// =====================================================
// تنظيف الإجابات
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
// إنشاء فعالية
// =====================================================

function createEvent(senderID) {
  return {
    active: true,
    started: false,

    creator: String(senderID),

    participants: [],
    scores: {},

    gameType: null,

    currentChallenge: null,
    currentAnswer: [],

    answered: [],

    rounds: 0,
    maxRounds: 10,

    challengeMessageID: null,

    createdAt: Date.now()
  };
}


// =====================================================
// اسم المستخدم
// =====================================================

async function getUserName(api, id) {
  try {
    const info = await api.getUserInfo(
      String(id)
    );

    return (
      info?.[id]?.name ||
      info?.[String(id)]?.name ||
      "عضو"
    );

  } catch (e) {
    return "عضو";
  }
}


// =====================================================
// قائمة المشاركين
// =====================================================

async function getParticipantsList(
  api,
  participants,
  scores
) {
  let text = "";

  for (
    let i = 0;
    i < participants.length;
    i++
  ) {

    const id =
      String(participants[i]);

    const name =
      await getUserName(
        api,
        id
      );

    const score =
      scores[id] || 0;

    text +=
      `${i + 1}. ${name} — ${score} نقطة\n`;
  }

  return text || "لا يوجد مشاركون";
}


// =====================================================
// الألعاب
// =====================================================

const games = {

  "تفكيك": [

    {
      question:
        "فكك كلمة: مدرسة\n\nاكتب الحروف مفصولة بمسافات.",
      answers: [
        "م د ر س ة",
        "م د ر س ه"
      ]
    },

    {
      question:
        "فكك كلمة: مستشفى\n\nاكتب الحروف مفصولة بمسافات.",
      answers: [
        "م س ت ش ف ى",
        "م س ت ش ف ي"
      ]
    },

    {
      question:
        "فكك كلمة: مكتبة\n\nاكتب الحروف مفصولة بمسافات.",
      answers: [
        "م ك ت ب ة",
        "م ك ت ب ه"
      ]
    },

    {
      question:
        "فكك كلمة: حاسوب\n\nاكتب الحروف مفصولة بمسافات.",
      answers: [
        "ح ا س و ب"
      ]
    },

    {
      question:
        "فكك كلمة: تنين\n\nاكتب الحروف مفصولة بمسافات.",
      answers: [
        "ت ن ي ن"
      ]
    },

    {
      question:
        "فكك كلمة: إمبراطورية\n\nاكتب الحروف مفصولة بمسافات.",
      answers: [
        "ا م ب ر ا ط و ر ي ة",
        "ا م ب ر ا ط و ر ي ه"
      ]
    },

    {
      question:
        "فكك كلمة: مغامرة\n\nاكتب الحروف مفصولة بمسافات.",
      answers: [
        "م غ ا م ر ة",
        "م غ ا م ر ه"
      ]
    },

    {
      question:
        "فكك كلمة: صداقة\n\nاكتب الحروف مفصولة بمسافات.",
      answers: [
        "ص د ا ق ة",
        "ص د ا ق ه"
      ]
    }

  ],


  "تجميع": [

    {
      question:
        "جمّع الحروف:\nم — د — ر — س — ة",
      answers: [
        "مدرسة",
        "مدرسه"
      ]
    },

    {
      question:
        "جمّع الحروف:\nك — ت — ا — ب",
      answers: [
        "كتاب"
      ]
    },

    {
      question:
        "جمّع الحروف:\nش — م — س",
      answers: [
        "شمس"
      ]
    },

    {
      question:
        "جمّع الحروف:\nق — م — ر",
      answers: [
        "قمر"
      ]
    },

    {
      question:
        "جمّع الحروف:\nب — ح — ر",
      answers: [
        "بحر"
      ]
    },

    {
      question:
        "جمّع الحروف:\nن — ج — م",
      answers: [
        "نجم"
      ]
    },

    {
      question:
        "جمّع الحروف:\nت — ن — ي — ن",
      answers: [
        "تنين"
      ]
    },

    {
      question:
        "جمّع الحروف:\nم — غ — ا — م — ر — ة",
      answers: [
        "مغامرة",
        "مغامره"
      ]
    }

  ],


  "احضار ايموجي": [

    {
      question:
        "أحضر إيموجي يعبر عن السعادة.",
      answers: [
        "😀", "😃", "😄", "😁",
        "😆", "😅", "😂", "🤣",
        "😊", "🥰"
      ]
    },

    {
      question:
        "أحضر إيموجي يعبر عن الحزن.",
      answers: [
        "😢", "😭", "😞",
        "😔", "🥺", "☹️"
      ]
    },

    {
      question:
        "أحضر إيموجي يعبر عن الغضب.",
      answers: [
        "😡", "😠", "🤬",
        "😤"
      ]
    },

    {
      question:
        "أحضر إيموجي يعبر عن الحب.",
      answers: [
        "❤️", "❤", "💕",
        "💖", "💗", "💓",
        "💞", "😍"
      ]
    },

    {
      question:
        "أحضر إيموجي يعبر عن الخوف.",
      answers: [
        "😨", "😰", "😱",
        "🫣"
      ]
    },

    {
      question:
        "أحضر إيموجي يعبر عن النوم.",
      answers: [
        "😴", "💤"
      ]
    },

    {
      question:
        "أحضر إيموجي يعبر عن النار.",
      answers: [
        "🔥"
      ]
    },

    {
      question:
        "أحضر إيموجي يعبر عن الماء.",
      answers: [
        "💧", "💦", "🌊"
      ]
    },

    {
      question:
        "أحضر إيموجي يعبر عن الطبيعة.",
      answers: [
        "🌳", "🌲", "🌿",
        "🌱", "🌴", "🍀"
      ]
    },

    {
      question:
        "أحضر إيموجي لحيوان.",
      answers: [
        "🐱", "🐶", "🐭",
        "🐹", "🐰", "🦊",
        "🐻", "🐼", "🐨",
        "🐯", "🦁"
      ]
    },

    {
      question:
        "أحضر إيموجي رياضي.",
      answers: [
        "⚽", "🏀", "🏈",
        "⚾", "🎾", "🏐"
      ]
    },

    {
      question:
        "أحضر إيموجي موسيقى.",
      answers: [
        "🎵", "🎶", "🎼",
        "🎸", "🎹", "🎤"
      ]
    }

  ],


  "اسم ايموجي": [

    {
      question:
        "ما اسم هذا الإيموجي؟\n\n🌙",
      answers: [
        "قمر",
        "القمر",
        "هلال",
        "الهلال"
      ]
    },

    {
      question:
        "ما اسم هذا الإيموجي؟\n\n☀️",
      answers: [
        "شمس",
        "الشمس"
      ]
    },

    {
      question:
        "ما اسم هذا الإيموجي؟\n\n🌹",
      answers: [
        "وردة",
        "ورده",
        "ورد"
      ]
    },

    {
      question:
        "ما اسم هذا الإيموجي؟\n\n🍎",
      answers: [
        "تفاحة",
        "تفاحه",
        "تفاح"
      ]
    },

    {
      question:
        "ما اسم هذا الإيموجي؟\n\n🐱",
      answers: [
        "قطة",
        "قطه",
        "قط"
      ]
    },

    {
      question:
        "ما اسم هذا الإيموجي؟\n\n🐶",
      answers: [
        "كلب"
      ]
    },

    {
      question:
        "ما اسم هذا الإيموجي؟\n\n🦋",
      answers: [
        "فراشة",
        "فراشه"
      ]
    },

    {
      question:
        "ما اسم هذا الإيموجي؟\n\n🌈",
      answers: [
        "قوس قزح"
      ]
    },

    {
      question:
        "ما اسم هذا الإيموجي؟\n\n🍉",
      answers: [
        "بطيخ"
      ]
    },

    {
      question:
        "ما اسم هذا الإيموجي؟\n\n⭐",
      answers: [
        "نجمة",
        "نجمه",
        "نجم"
      ]
    }

  ],


  "سؤال ديني": [

    {
      question:
        "كم عدد أركان الإسلام؟",
      answers: [
        "5",
        "خمسة",
        "خمس"
      ]
    },

    {
      question:
        "كم عدد أركان الإيمان؟",
      answers: [
        "6",
        "ستة",
        "سته",
        "ست"
      ]
    },

    {
      question:
        "ما أول سورة في القرآن؟",
      answers: [
        "الفاتحة",
        "سورة الفاتحة"
      ]
    },

    {
      question:
        "كم عدد الصلوات المفروضة في اليوم؟",
      answers: [
        "5",
        "خمسة",
        "خمس"
      ]
    },

    {
      question:
        "ما شهر الصيام؟",
      answers: [
        "رمضان",
        "شهر رمضان"
      ]
    },

    {
      question:
        "ما قبلة المسلمين؟",
      answers: [
        "الكعبة",
        "الكعبة المشرفة"
      ]
    },

    {
      question:
        "ما اسم أول مسجد وضع للناس؟",
      answers: [
        "المسجد الحرام"
      ]
    },

    {
      question:
        "من هو خاتم الأنبياء؟",
      answers: [
        "محمد",
        "محمد صلى الله عليه وسلم",
        "النبي محمد"
      ]
    },

    {
      question:
        "كم عدد سور القرآن الكريم؟",
      answers: [
        "114",
        "مئة واربعة عشر",
        "مائة وأربع عشرة"
      ]
    },

    {
      question:
        "ما السورة التي تبدأ بـ الحمد لله رب العالمين؟",
      answers: [
        "الفاتحة",
        "سورة الفاتحة"
      ]
    },

    {
      question:
        "ما اسم الليلة التي هي خير من ألف شهر؟",
      answers: [
        "ليلة القدر"
      ]
    },

    {
      question:
        "في أي شهر نزل القرآن؟",
      answers: [
        "رمضان",
        "شهر رمضان"
      ]
    }

  ],


  "سؤال ثقافي": [

    {
      question:
        "ما عاصمة مصر؟",
      answers: [
        "القاهرة"
      ]
    },

    {
      question:
        "ما عاصمة السعودية؟",
      answers: [
        "الرياض"
      ]
    },

    {
      question:
        "ما عاصمة الإمارات؟",
      answers: [
        "ابوظبي",
        "أبوظبي"
      ]
    },

    {
      question:
        "ما عاصمة فرنسا؟",
      answers: [
        "باريس"
      ]
    },

    {
      question:
        "ما عاصمة ألمانيا؟",
      answers: [
        "برلين"
      ]
    },

    {
      question:
        "ما عاصمة إيطاليا؟",
      answers: [
        "روما"
      ]
    },

    {
      question:
        "كم عدد قارات العالم؟",
      answers: [
        "7",
        "سبعة",
        "سبع"
      ]
    },

    {
      question:
        "ما أكبر قارة في العالم؟",
      answers: [
        "آسيا",
        "اسيا"
      ]
    },

    {
      question:
        "ما أكبر محيط في العالم؟",
      answers: [
        "المحيط الهادئ",
        "الهادئ"
      ]
    },

    {
      question:
        "ما أعلى جبل في العالم؟",
      answers: [
        "إيفرست",
        "ايفرست",
        "جبل ايفرست",
        "جبل إيفرست"
      ]
    },

    {
      question:
        "كم عدد ألوان قوس قزح؟",
      answers: [
        "7",
        "سبعة",
        "سبع"
      ]
    },

    {
      question:
        "ما أسرع حيوان بري؟",
      answers: [
        "الفهد",
        "فهد"
      ]
    },

    {
      question:
        "ما أكبر حيوان على الأرض؟",
      answers: [
        "الحوت الأزرق",
        "الحوت الازرق"
      ]
    },

    {
      question:
        "ما الكوكب المعروف بالكوكب الأحمر؟",
      answers: [
        "المريخ"
      ]
    },

    {
      question:
        "ما أقرب كوكب إلى الشمس؟",
      answers: [
        "عطارد"
      ]
    }

  ],


  "صح او خطأ": [

    {
      question:
        "هل الشمس نجم؟\n\nأجب: صح أو خطأ",
      answers: [
        "صح",
        "صحيح"
      ]
    },

    {
      question:
        "هل الأرض أكبر من الشمس؟\n\nأجب: صح أو خطأ",
      answers: [
        "خطا",
        "خطأ"
      ]
    },

    {
      question:
        "هل الماء يتجمد عند درجة صفر مئوية تقريباً؟\n\nأجب: صح أو خطأ",
      answers: [
        "صح",
        "صحيح"
      ]
    },

    {
      question:
        "هل القمر كوكب؟\n\nأجب: صح أو خطأ",
      answers: [
        "خطا",
        "خطأ"
      ]
    },

    {
      question:
        "هل باريس عاصمة فرنسا؟\n\nأجب: صح أو خطأ",
      answers: [
        "صح",
        "صحيح"
      ]
    },

    {
      question:
        "هل عدد قارات العالم 5؟\n\nأجب: صح أو خطأ",
      answers: [
        "خطا",
        "خطأ"
      ]
    },

    {
      question:
        "هل المريخ هو الكوكب الأحمر؟\n\nأجب: صح أو خطأ",
      answers: [
        "صح",
        "صحيح"
      ]
    },

    {
      question:
        "هل القطط من الحيوانات الثديية؟\n\nأجب: صح أو خطأ",
      answers: [
        "صح",
        "صحيح"
      ]
    }

  ],


  "اسرع اجابة": [

    {
      question:
        "ما ناتج: 5 + 7 ؟",
      answers: [
        "12",
        "اثنا عشر",
        "اثني عشر"
      ]
    },

    {
      question:
        "ما ناتج: 10 - 3 ؟",
      answers: [
        "7",
        "سبعة"
      ]
    },

    {
      question:
        "ما ناتج: 4 × 5 ؟",
      answers: [
        "20",
        "عشرون"
      ]
    },

    {
      question:
        "ما ناتج: 30 ÷ 5 ؟",
      answers: [
        "6",
        "ستة"
      ]
    },

    {
      question:
        "ما العدد الذي يأتي بعد 99؟",
      answers: [
        "100",
        "مئة",
        "مائة"
      ]
    },

    {
      question:
        "ما العدد الذي يأتي قبل 50؟",
      answers: [
        "49",
        "تسعة واربعون",
        "تسعة وأربعون"
      ]
    }

  ]

};


// =====================================================
// اختيار لعبة
// =====================================================

function randomGame() {

  const names =
    Object.keys(games);

  return names[
    Math.floor(
      Math.random() * names.length
    )
  ];
}


// =====================================================
// اختيار تحدي
// =====================================================

function randomChallenge(gameType) {

  const list =
    games[gameType] ||
    games["سؤال ثقافي"];

  return list[
    Math.floor(
      Math.random() * list.length
    )
  ];
}


// =====================================================
// إرسال تحدي
// =====================================================

async function sendChallenge(
  api,
  threadID
) {

  const data =
    loadData();

  const eventData =
    data[threadID];

  if (
    !eventData ||
    !eventData.active ||
    !eventData.started
  ) {
    return;
  }


  eventData.rounds++;

  eventData.answered = [];


  const challenge =
    randomChallenge(
      eventData.gameType
    );


  eventData.currentChallenge =
    challenge.question;

  eventData.currentAnswer =
    challenge.answers;


  saveData(data);


  const text =
    `⌬ ━━ 𝗛𝗜𝗡𝗔 𝗙𝗨𝗡 ━━ ⌬\n\n` +

    `🎮 اللعبة: ${eventData.gameType}\n` +

    `🏆 الجولة: ${eventData.rounds}/${eventData.maxRounds}\n\n` +

    `━━━━━━━━━━━━━━\n\n` +

    `🎯 التحدي:\n\n` +

    `${challenge.question}\n\n` +

    `━━━━━━━━━━━━━━\n\n` +

    `⚡ أول إجابة صحيحة تحصل على نقطة\n` +

    `↩️ قم بالرد على هذه الرسالة بإجابتك`;


  return new Promise(resolve => {

    api.sendMessage(
      text,
      threadID,
      (error, info) => {

        if (
          !error &&
          info?.messageID
        ) {

          const latest =
            loadData();

          if (
            latest[threadID]
          ) {

            latest[threadID]
              .challengeMessageID =
              String(
                info.messageID
              );

            saveData(latest);
          }
        }

        resolve(info);
      }
    );

  });
}


// =====================================================
// HANDLE REPLY
// =====================================================

module.exports.handleReply =
async function ({
  api,
  event,
  handleReply
}) {

  try {

    const {
      threadID,
      senderID,
      body = "",
      messageReply
    } = event;


    const data =
      loadData();

    const eventData =
      data[threadID];


    if (
      !eventData ||
      !eventData.active ||
      !eventData.started
    ) {
      return;
    }


    // يجب أن يكون العضو مشاركاً

    if (
      !eventData.participants
        .map(String)
        .includes(
          String(senderID)
        )
    ) {
      return;
    }


    // يجب أن يكون الرد على رسالة التحدي

    if (
      !messageReply ||
      String(messageReply.messageID) !==
      String(eventData.challengeMessageID)
    ) {
      return;
    }


    // منع الإجابة مرتين

    if (
      eventData.answered
        .map(String)
        .includes(
          String(senderID)
        )
    ) {
      return;
    }


    const answer =
      normalizeAnswer(body);


    if (!answer) {
      return;
    }


    const correctAnswers =
      (eventData.currentAnswer || [])
        .map(normalizeAnswer);


    if (
      !correctAnswers.includes(answer)
    ) {

      return api.sendMessage(
        `❌ إجابة خاطئة\n\n` +
        `حاول مرة أخرى.`,
        threadID
      );
    }


    // =================================================
    // إجابة صحيحة
    // =================================================

    eventData.answered.push(
      String(senderID)
    );


    eventData.scores[senderID] =
      (eventData.scores[senderID] || 0) + 1;


    saveData(data);


    const name =
      await getUserName(
        api,
        senderID
      );


    // =================================================
    // انتهاء الجولات
    // =================================================

    if (
      eventData.rounds >=
      eventData.maxRounds
    ) {

      const sorted =
        Object.entries(
          eventData.scores
        ).sort(
          (a, b) => b[1] - a[1]
        );


      let ranking = "";

      for (
        let i = 0;
        i < sorted.length;
        i++
      ) {

        const id =
          sorted[i][0];

        const score =
          sorted[i][1];

        const userName =
          await getUserName(
            api,
            id
          );


        let medal = "";

        if (i === 0) medal = "🥇 ";
        else if (i === 1) medal = "🥈 ";
        else if (i === 2) medal = "🥉 ";


        ranking +=
          `${medal}${i + 1}. ${userName} — ${score} نقطة\n`;
      }


      const winner =
        sorted.length
          ? await getUserName(
              api,
              sorted[0][0]
            )
          : "لا يوجد";


      eventData.active = false;
      eventData.started = false;


      saveData(data);


      return api.sendMessage(
        `⌬ ━━ 𝗛𝗜𝗡𝗔 𝗙𝗨𝗡 ━━ ⌬\n\n` +

        `🎉 انتهت الفعالية!\n\n` +

        `🏆 الفائز: ${winner}\n` +

        `⭐ نقاطه: ${sorted[0]?.[1] || 0}\n\n` +

        `━━━━━━━━━━━━━━\n\n` +

        `📊 الترتيب النهائي:\n\n` +

        `${ranking}\n` +

        `━━━━━━━━━━━━━━`,
        threadID
      );
    }


    // =================================================
    // الجولة التالية
    // =================================================

    await api.sendMessage(
      `⌬ ━━ 𝗛𝗜𝗡𝗔 𝗙𝗨𝗡 ━━ ⌬\n\n` +

      `✅ إجابة صحيحة!\n\n` +

      `👤 الفائز بالجولة: ${name}\n` +

      `⭐ +1 نقطة\n\n` +

      `🔄 الجولة التالية...`,
      threadID
    );


    setTimeout(
      async () => {

        try {

          await sendChallenge(
            api,
            threadID
          );

        } catch (error) {

          console.error(
            "❌ Next Challenge Error:",
            error
          );
        }

      },
      1200
    );

  } catch (error) {

    console.error(
      "❌ HINA Event handleReply Error:",
      error
    );
  }
};


// =====================================================
// COMMAND
// =====================================================

module.exports.run =
async function ({
  api,
  event,
  args
}) {

  try {

    const {
      threadID,
      messageID,
      senderID
    } = event;


    const data =
      loadData();


    if (
      !data[threadID]
    ) {

      data[threadID] =
        createEvent(
          senderID
        );

      data[threadID].active =
        false;

      saveData(data);
    }


    const eventData =
      data[threadID];


    const sub =
      String(
        args?.[0] || ""
      )
      .toLowerCase()
      .trim();


    // =================================================
    // إنشاء
    // =================================================

    if (
      [
        "إنشاء",
        "انشاء",
        "create"
      ].includes(sub)
    ) {

      if (
        eventData.active
      ) {

        return api.sendMessage(
          `⌬ ━━ 𝗛𝗜𝗡𝗔 𝗙𝗨𝗡 ━━ ⌬\n\n` +
          `⚠️ توجد فعالية نشطة بالفعل.`,
          threadID,
          messageID
        );
      }


      const newEvent =
        createEvent(
          senderID
        );


      newEvent.gameType =
        randomGame();


      data[threadID] =
        newEvent;


      saveData(data);


      const name =
        await getUserName(
          api,
          senderID
        );


      return api.sendMessage(
        `⌬ ━━ 𝗛𝗜𝗡𝗔 𝗙𝗨𝗡 ━━ ⌬\n\n` +

        `🎉 تم إنشاء فعالية جديدة!\n\n` +

        `👤 المنشئ: ${name}\n` +

        `🎮 اللعبة: ${newEvent.gameType}\n\n` +

        `📝 اكتب:\n` +

        `فعالية انضمام\n\n` +

        `🏁 وبعد انضمام المشاركين:\n` +

        `فعالية بدء`,
        threadID,
        messageID
      );
    }


    // =================================================
    // انضمام
    // =================================================

    if (
      [
        "انضمام",
        "انضم",
        "join"
      ].includes(sub)
    ) {

      if (
        !eventData.active
      ) {

        return api.sendMessage(
          `⌬ ━━ 𝗛𝗜𝗡𝗔 𝗙𝗨𝗡 ━━ ⌬\n\n` +
          `❌ لا توجد فعالية نشطة.`,
          threadID,
          messageID
        );
      }


      if (
        eventData.started
      ) {

        return api.sendMessage(
          `⌬ ━━ 𝗛𝗜𝗡𝗔 𝗙𝗨𝗡 ━━ ⌬\n\n` +
          `⚠️ بدأت الفعالية بالفعل.`,
          threadID,
          messageID
        );
      }


      const id =
        String(senderID);


      if (
        eventData.participants
          .map(String)
          .includes(id)
      ) {

        return api.sendMessage(
          `⌬ ━━ 𝗛𝗜𝗡𝗔 𝗙𝗨𝗡 ━━ ⌬\n\n` +
          `⚠️ أنت مشترك بالفعل.`,
          threadID,
          messageID
        );
      }


      eventData.participants.push(id);

      eventData.scores[id] = 0;


      saveData(data);


      const name =
        await getUserName(
          api,
          id
        );


      return api.sendMessage(
        `⌬ ━━ 𝗛𝗜𝗡𝗔 𝗙𝗨𝗡 ━━ ⌬\n\n` +

        `✅ انضم ${name} إلى الفعالية!\n\n` +

        `👥 عدد المشاركين: ${eventData.participants.length}`,
        threadID,
        messageID
      );
    }


    // =================================================
    // بدء
    // =================================================

    if (
      [
        "بدء",
        "ابدأ",
        "start"
      ].includes(sub)
    ) {

      if (
        !eventData.active
      ) {

        return api.sendMessage(
          `⌬ ━━ 𝗛𝗜𝗡𝗔 𝗙𝗨𝗡 ━━ ⌬\n\n` +
          `❌ لا توجد فعالية.`,
          threadID,
          messageID
        );
      }


      if (
        eventData.started
      ) {

        return api.sendMessage(
          `⌬ ━━ 𝗛𝗜𝗡𝗔 𝗙𝗨𝗡 ━━ ⌬\n\n` +
          `⚠️ الفعالية بدأت بالفعل.`,
          threadID,
          messageID
        );
      }


      if (
        eventData.participants.length < 2
      ) {

        return api.sendMessage(
          `⌬ ━━ 𝗛𝗜𝗡𝗔 𝗙𝗨𝗡 ━━ ⌬\n\n` +
          `⚠️ يجب وجود مشاركين اثنين على الأقل.`,
          threadID,
          messageID
        );
      }


      eventData.started =
        true;

      eventData.rounds =
        0;

      eventData.maxRounds =
        10;


      saveData(data);


      const list =
        await getParticipantsList(
          api,
          eventData.participants,
          eventData.scores
        );


      await api.sendMessage(
        `⌬ ━━ 𝗛𝗜𝗡𝗔 𝗙𝗨𝗡 ━━ ⌬\n\n` +

        `🏁 بدأت الفعالية!\n\n` +

        `🎮 اللعبة: ${eventData.gameType}\n` +

        `👥 المشاركون: ${eventData.participants.length}\n` +

        `🔢 الجولات: ${eventData.maxRounds}\n\n` +

        `━━━━━━━━━━━━━━\n\n` +

        `👥 قائمة المشاركين:\n\n` +

        `${list}\n` +

        `━━━━━━━━━━━━━━`,
        threadID
      );


      return sendChallenge(
        api,
        threadID
      );
    }


    // =================================================
    // حالة
    // =================================================

    if (
      [
        "حالة",
        "status"
      ].includes(sub)
    ) {

      if (
        !eventData.active
      ) {

        return api.sendMessage(
          `⌬ ━━ 𝗛𝗜𝗡𝗔 𝗙𝗨𝗡 ━━ ⌬\n\n` +
          `📭 لا توجد فعالية حالياً.`,
          threadID,
          messageID
        );
      }


      const list =
        await getParticipantsList(
          api,
          eventData.participants,
          eventData.scores
        );


      return api.sendMessage(
        `⌬ ━━ 𝗛𝗜𝗡𝗔 𝗙𝗨𝗡 ━━ ⌬\n\n` +

        `📊 حالة الفعالية\n\n` +

        `🎮 اللعبة: ${eventData.gameType}\n` +

        `📌 الحالة: ${
          eventData.started
            ? "جارية"
            : "في الانتظار"
        }\n` +

        `🏆 الجولة: ${eventData.rounds}/${eventData.maxRounds}\n\n` +

        `👥 المشاركون:\n\n` +

        `${list}`,
        threadID,
        messageID
      );
    }


    // =================================================
    // نتيجة
    // =================================================

    if (
      [
        "نتيجة",
        "النتيجة",
        "end"
      ].includes(sub)
    ) {

      if (
        !eventData.active
      ) {

        return api.sendMessage(
          `⌬ ━━ 𝗛𝗜𝗡𝗔 𝗙𝗨𝗡 ━━ ⌬\n\n` +
          `📭 لا توجد فعالية.`,
          threadID,
          messageID
        );
      }


      const sorted =
        Object.entries(
          eventData.scores
        ).sort(
          (a, b) => b[1] - a[1]
        );


      let ranking = "";

      for (
        let i = 0;
        i < sorted.length;
        i++
      ) {

        const id =
          sorted[i][0];

        const score =
          sorted[i][1];

        const name =
          await getUserName(
            api,
            id
          );


        ranking +=
          `${i + 1}. ${name} — ${score} نقطة\n`;
      }


      const winner =
        sorted.length
          ? await getUserName(
              api,
              sorted[0][0]
            )
          : "لا يوجد";


      eventData.active =
        false;

      eventData.started =
        false;


      saveData(data);


      return api.sendMessage(
        `⌬ ━━ 𝗛𝗜𝗡𝗔 𝗙𝗨𝗡 ━━ ⌬\n\n` +

        `🏆 النتائج النهائية\n\n` +

        `🥇 الفائز: ${winner}\n\n` +

        `📊 الترتيب:\n\n` +

        `${ranking}\n` +

        `🎮 اللعبة: ${eventData.gameType}\n` +

        `🔢 عدد الجولات: ${eventData.rounds}`,
        threadID,
        messageID
      );
    }


    // =================================================
    // إنهاء
    // =================================================

    if (
      [
        "إنهاء",
        "انهاء"
      ].includes(sub)
    ) {

      if (
        !eventData.active
      ) {

        return api.sendMessage(
          `⌬ ━━ 𝗛𝗜𝗡𝗔 𝗙𝗨𝗡 ━━ ⌬\n\n` +
          `❌ لا توجد فعالية.`,
          threadID,
          messageID
        );
      }


      eventData.active =
        false;

      eventData.started =
        false;


      saveData(data);


      return api.sendMessage(
        `⌬ ━━ 𝗛𝗜𝗡𝗔 𝗙𝗨𝗡 ━━ ⌬\n\n` +
        `🛑 تم إنهاء الفعالية.`,
        threadID,
        messageID
      );
    }


    // =================================================
    // المساعدة
    // =================================================

    return api.sendMessage(
      `⌬ ━━ 𝗛𝗜𝗡𝗔 𝗙𝗨𝗡 ━━ ⌬\n\n` +

      `📚 أوامر الفعالية:\n\n` +

      `• فعالية إنشاء\n` +
      `• فعالية انضمام\n` +
      `• فعالية بدء\n` +
      `• فعالية حالة\n` +
      `• فعالية نتيجة\n` +
      `• فعالية إنهاء\n\n` +

      `📝 بعد بدء الفعالية:\n` +

      `↩️ قم بالرد على رسالة التحدي بإجابتك.\n\n` +

      `⚡ أول إجابة صحيحة تحصل على نقطة.`,
      threadID,
      messageID
    );

  } catch (error) {

    console.error(
      "❌ HINA Event Error:",
      error
    );

    return api.sendMessage(
      `⌬ ━━ 𝗛𝗜𝗡𝗔 𝗙𝗨𝗡 ━━ ⌬\n\n` +

      `❌ حدث خطأ أثناء تشغيل الفعالية.\n\n` +

      `${error.message}`,
      event.threadID,
      event.messageID
    );
  }
};