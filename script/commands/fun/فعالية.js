const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "فعالية",
  version: "8.0.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "نظام فعاليات زنجوبة المتنوعة بالنقاط والتحديات",
  commandCategory: "Fun",
  usages: "فعالية إنشاء 10",
  cooldowns: 3
};

// ======================================================
// الملفات
// ======================================================

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "events.json");

fs.ensureDirSync(DATA_DIR);

if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, "{}");
}

// ======================================================
// إعدادات الفعالية
// ======================================================

const ANSWER_TIME = 15000;
const NEXT_ROUND_DELAY = 3000;
const PREVIEW_TIME = 3000;

// ======================================================
// أدوات البيانات
// ======================================================

function loadData() {
  try {
    return JSON.parse(
      fs.readFileSync(DATA_FILE, "utf8")
    );
  } catch (e) {
    return {};
  }
}

function saveData(data) {
  try {
    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify(data, null, 2)
    );
  } catch (e) {
    console.error(
      "ZANJOUBA EVENT SAVE ERROR:",
      e
    );
  }
}

// ======================================================
// إنشاء فعالية
// ======================================================

function createEvent(creator, winPoints) {
  return {
    active: true,
    started: false,

    creator: String(creator),
    winPoints: Number(winPoints),

    gameType: "متنوع",

    participants: [],
    scores: {},

    round: 0,

    currentChallenge: null,

    currentListMessageID: null,
    currentPreviewMessageID: null,
    currentQuestionMessageID: null,

    roundToken: null,

    waitingForAnswer: false,
    answered: false,

    timeoutID: null,
    nextTimer: null,

    processingRound: false
  };
}

// ======================================================
// تطبيع الإجابات
// ======================================================

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
    .replace(/[؟?!.,،:؛]/g, "")
    .replace(/\s+/g, " ");
}

function checkAnswer(input, answers) {
  const normalized = normalizeAnswer(input);

  return answers.some(answer =>
    normalized === normalizeAnswer(answer)
  );
}

// ======================================================
// تحدي القلب
// ======================================================

const HEART_COLORS = [
  {
    color: "الأحمر",
    emoji: "❤️"
  },
  {
    color: "البرتقالي",
    emoji: "🧡"
  },
  {
    color: "الأصفر",
    emoji: "💛"
  },
  {
    color: "الأخضر",
    emoji: "💚"
  },
  {
    color: "الأزرق",
    emoji: "💙"
  },
  {
    color: "البنفسجي",
    emoji: "💜"
  },
  {
    color: "الأسود",
    emoji: "🖤"
  },
  {
    color: "الأبيض",
    emoji: "🤍"
  },
  {
    color: "البني",
    emoji: "🤎"
  },
  {
    color: "الوردي",
    emoji: "🩷"
  },
  {
    color: "السماوي",
    emoji: "🩵"
  },
  {
    color: "الرمادي",
    emoji: "🩶"
  }
];

function getHeartChallenge() {
  const selected =
    HEART_COLORS[
      Math.floor(
        Math.random() *
        HEART_COLORS.length
      )
    ];

  return {
    type: "جلب قلب",
    question:
      `أرسل قلبًا باللون ${selected.color}\n\n` +
      `المطلوب: ${selected.color} فقط`,
    answers: [selected.emoji],
    targetColor: selected.color,
    targetEmoji: selected.emoji
  };
}

// ======================================================
// التحديات
// ======================================================

const CHALLENGES = [

  // =========================
  // ثقافة عامة
  // =========================

  {
    type: "سؤال ثقافي",
    question: "ما هي عاصمة فرنسا؟",
    answers: ["باريس"]
  },
  {
    type: "سؤال ثقافي",
    question: "ما هي عاصمة اليابان؟",
    answers: ["طوكيو"]
  },
  {
    type: "سؤال ثقافي",
    question: "ما هي عاصمة إيطاليا؟",
    answers: ["روما"]
  },
  {
    type: "سؤال ثقافي",
    question: "ما هي عاصمة ألمانيا؟",
    answers: ["برلين"]
  },
  {
    type: "سؤال ثقافي",
    question: "ما هي عاصمة تونس؟",
    answers: ["تونس"]
  },
  {
    type: "سؤال ثقافي",
    question: "ما هي عاصمة الجزائر؟",
    answers: ["الجزائر"]
  },
  {
    type: "سؤال ثقافي",
    question: "ما هي عاصمة المغرب؟",
    answers: ["الرباط"]
  },
  {
    type: "سؤال ثقافي",
    question: "كم عدد قارات العالم؟",
    answers: ["7", "سبعة", "سبع"]
  },
  {
    type: "سؤال ثقافي",
    question: "ما هي أكبر قارة في العالم؟",
    answers: ["اسيا", "آسيا"]
  },
  {
    type: "سؤال ثقافي",
    question: "ما هو أكبر محيط في العالم؟",
    answers: [
      "المحيط الهادئ",
      "الهادئ"
    ]
  },
  {
    type: "سؤال ثقافي",
    question: "ما هو أعلى جبل في العالم؟",
    answers: [
      "ايفرست",
      "إيفرست"
    ]
  },
  {
    type: "سؤال ثقافي",
    question: "كم عدد أيام الأسبوع؟",
    answers: ["7", "سبعة"]
  },

  // =========================
  // ديني
  // =========================

  {
    type: "سؤال ديني",
    question: "كم عدد أركان الإسلام؟",
    answers: ["5", "خمسة"]
  },
  {
    type: "سؤال ديني",
    question: "كم عدد أركان الإيمان؟",
    answers: [
      "6",
      "ستة",
      "سته"
    ]
  },
  {
    type: "سؤال ديني",
    question: "ما أول سورة في القرآن؟",
    answers: [
      "الفاتحة",
      "الفاتحه"
    ]
  },
  {
    type: "سؤال ديني",
    question: "ما آخر سورة في القرآن؟",
    answers: ["الناس"]
  },
  {
    type: "سؤال ديني",
    question: "كم عدد الصلوات المفروضة؟",
    answers: ["5", "خمسة"]
  },
  {
    type: "سؤال ديني",
    question: "ما هو شهر الصيام؟",
    answers: ["رمضان"]
  },
  {
    type: "سؤال ديني",
    question: "من هو خاتم الأنبياء؟",
    answers: [
      "محمد",
      "النبي محمد",
      "محمد صلى الله عليه وسلم"
    ]
  },
  {
    type: "سؤال ديني",
    question: "ما قبلة المسلمين؟",
    answers: [
      "الكعبة",
      "الكعبه"
    ]
  },
  {
    type: "سؤال ديني",
    question: "كم عدد أشهر السنة الهجرية؟",
    answers: [
      "12",
      "اثنا عشر",
      "اثني عشر"
    ]
  },

  // =========================
  // أنمي
  // =========================

  {
    type: "سؤال أنمي",
    question: "ما اسم بطل One Piece؟",
    answers: [
      "لوفي",
      "مونكي دي لوفي",
      "مونكي دي. لوفي"
    ]
  },
  {
    type: "سؤال أنمي",
    question: "ما اسم بطل Dragon Ball؟",
    answers: [
      "غوكو",
      "جوكو"
    ]
  },
  {
    type: "سؤال أنمي",
    question: "ما اسم قرية ناروتو؟",
    answers: [
      "كونوها",
      "قرية الورق",
      "قرية كونوها"
    ]
  },
  {
    type: "سؤال أنمي",
    question: "ما اسم بطل Solo Leveling؟",
    answers: [
      "سونغ جين وو",
      "جين وو"
    ]
  },
  {
    type: "سؤال أنمي",
    question: "ما اسم قائد فرقة الاستطلاع في هجوم العمالقة؟",
    answers: [
      "إروين",
      "إروين سميث",
      "اروين",
      "اروين سميث"
    ]
  },
  {
    type: "سؤال أنمي",
    question: "ما اسم بطل Bleach؟",
    answers: [
      "إيتشيغو",
      "ايتشيغو",
      "إيتشيغو كوروساكي"
    ]
  },
  {
    type: "سؤال أنمي",
    question: "ما اسم أخ ساسكي؟",
    answers: [
      "إيتاتشي",
      "ايتاتشي"
    ]
  },
  {
    type: "سؤال أنمي",
    question: "ما اسم سيف إيتشيغو؟",
    answers: [
      "زانغيتسو",
      "زانجيتسو",
      "زангتسو"
    ]
  },

  // =========================
  // رياضيات
  // =========================

  {
    type: "سؤال رياضي",
    question: "كم يساوي 5 + 5؟",
    answers: [
      "10",
      "عشرة"
    ]
  },
  {
    type: "سؤال رياضي",
    question: "كم يساوي 10 × 2؟",
    answers: [
      "20",
      "عشرون"
    ]
  },
  {
    type: "سؤال رياضي",
    question: "كم يساوي 100 ÷ 10؟",
    answers: [
      "10",
      "عشرة"
    ]
  },
  {
    type: "سؤال رياضي",
    question: "كم يساوي 9 × 9؟",
    answers: [
      "81",
      "واحد وثمانون"
    ]
  },
  {
    type: "سؤال رياضي",
    question: "كم يساوي 50 - 20؟",
    answers: [
      "30",
      "ثلاثون"
    ]
  },
  {
    type: "سؤال رياضي",
    question: "كم يساوي 12 × 3؟",
    answers: [
      "36",
      "ستة وثلاثون"
    ]
  },
  {
    type: "سؤال رياضي",
    question: "كم يساوي 100 - 25؟",
    answers: [
      "75",
      "خمسة وسبعون"
    ]
  },

  // =========================
  // إيموجي
  // =========================

  {
    type: "تحدي إيموجي",
    question: "أرسل إيموجي يعبر عن الحب.",
    answers: [
      "❤️",
      "❤",
      "🩷",
      "💕",
      "💖",
      "💗"
    ]
  },
  {
    type: "تحدي إيموجي",
    question: "أرسل إيموجي يعبر عن الضحك.",
    answers: [
      "😂",
      "🤣"
    ]
  },
  {
    type: "تحدي إيموجي",
    question: "أرسل إيموجي يعبر عن الغضب.",
    answers: [
      "😡",
      "😠",
      "🤬"
    ]
  },
  {
    type: "تحدي إيموجي",
    question: "أرسل إيموجي يعبر عن النوم.",
    answers: [
      "😴",
      "💤"
    ]
  },
  {
    type: "تحدي إيموجي",
    question: "أرسل إيموجي يعبر عن البرد.",
    answers: [
      "🥶",
      "❄️",
      "🧊"
    ]
  },
  {
    type: "تحدي إيموجي",
    question: "أرسل إيموجي يعبر عن الحزن.",
    answers: [
      "😢",
      "😭",
      "☹️"
    ]
  },

  // =========================
  // تجميع
  // =========================

  {
    type: "تجميع",
    question: "جمّع الحروف: م - د - ر - س - ة",
    answers: ["مدرسة"]
  },
  {
    type: "تجميع",
    question: "جمّع الحروف: ك - ت - ا - ب",
    answers: ["كتاب"]
  },
  {
    type: "تجميع",
    question: "جمّع الحروف: ش - م - س",
    answers: ["شمس"]
  },
  {
    type: "تجميع",
    question: "جمّع الحروف: ق - م - ر",
    answers: ["قمر"]
  },
  {
    type: "تجميع",
    question: "جمّع الحروف: ب - ح - ر",
    answers: ["بحر"]
  },
  {
    type: "تجميع",
    question: "جمّع الحروف: ن - ج - م",
    answers: ["نجم"]
  },
  {
    type: "تجميع",
    question: "جمّع الحروف: س - ح - ا - ب",
    answers: ["سحاب"]
  },

  // =========================
  // تفكيك
  // =========================

  {
    type: "تفكيك",
    question: "فكك كلمة: مدرسة",
    answers: [
      "م د ر س ة",
      "م-د-ر-س-ة",
      "م د ر س ه"
    ]
  },
  {
    type: "تفكيك",
    question: "فكك كلمة: كتاب",
    answers: [
      "ك ت ا ب",
      "ك-ت-ا-ب"
    ]
  },
  {
    type: "تفكيك",
    question: "فكك كلمة: قمر",
    answers: [
      "ق م ر",
      "ق-م-ر"
    ]
  },
  {
    type: "تفكيك",
    question: "فكك كلمة: شمس",
    answers: [
      "ش م س",
      "ش-م-س"
    ]
  },
  {
    type: "تفكيك",
    question: "فكك كلمة: بحر",
    answers: [
      "ب ح ر",
      "ب-ح-ر"
    ]
  },

  // =========================
  // معلومات عامة
  // =========================

  {
    type: "معلومات عامة",
    question: "ما هو الكوكب الأحمر؟",
    answers: ["المريخ"]
  },
  {
    type: "معلومات عامة",
    question: "ما الحيوان المعروف بسفينة الصحراء؟",
    answers: ["الجمل"]
  },
  {
    type: "معلومات عامة",
    question: "ما أسرع حيوان بري؟",
    answers: ["الفهد"]
  },
  {
    type: "معلومات عامة",
    question: "ما أكبر حيوان على الأرض؟",
    answers: [
      "الحوت الأزرق",
      "الحوت الازرق"
    ]
  },
  {
    type: "معلومات عامة",
    question: "ما الغاز الذي يحتاجه الإنسان للتنفس؟",
    answers: [
      "الأكسجين",
      "الاكسجين"
    ]
  },
  {
    type: "معلومات عامة",
    question: "كم عدد ألوان قوس قزح؟",
    answers: [
      "7",
      "سبعة"
    ]
  }
];

// ======================================================
// اختيار تحدي
// ======================================================

function getRandomChallenge(previousQuestion = null) {

  // احتمال ظهور تحدي القلب
  if (Math.random() < 0.25) {
    return getHeartChallenge();
  }

  let available =
    CHALLENGES.filter(
      item =>
        item.question !== previousQuestion
    );

  if (!available.length) {
    available = CHALLENGES;
  }

  const item =
    available[
      Math.floor(
        Math.random() *
        available.length
      )
    ];

  return {
    type: item.type,
    question: item.question,
    answers: item.answers
  };
}

// ======================================================
// اسم العضو
// ======================================================

async function getName(api, id) {
  try {

    const info =
      await api.getUserInfo(
        String(id)
      );

    return (
      info?.[String(id)]?.name ||
      "عضو"
    );

  } catch (e) {
    return "عضو";
  }
}

// ======================================================
// ترتيب المشاركين
// ======================================================

function getSortedParticipants(eventData) {

  return [
    ...eventData.participants
  ].sort(
    (a, b) =>
      (eventData.scores[b] || 0) -
      (eventData.scores[a] || 0)
  );
}

// ======================================================
// اسم المركز
// ======================================================

async function getWinnerName(
  api,
  eventData,
  index
) {

  const sorted =
    getSortedParticipants(
      eventData
    );

  if (!sorted[index]) {
    return "";
  }

  return getName(
    api,
    sorted[index]
  );
}

// ======================================================
// حذف رسالة بأمان
// ======================================================

async function deleteMessage(
  api,
  messageID
) {

  if (!messageID) {
    return;
  }

  try {
    await api.unsendMessage(
      String(messageID)
    );
  } catch (e) {}
}

// ======================================================
// إزالة Reply الخاص بالفعالية
// ======================================================

function removeEventReply(threadID) {

  if (!global.client.handleReply) {
    return;
  }

  global.client.handleReply =
    global.client.handleReply.filter(
      item => {

        return !(
          item.name === "فعالية" &&
          item.type === "eventQuestion" &&
          String(item.threadID) ===
            String(threadID)
        );
      }
    );
}

// ======================================================
// تسجيل Reply
// ======================================================

function registerQuestionReply(
  eventData,
  threadID
) {

  if (!global.client.handleReply) {
    global.client.handleReply = [];
  }

  removeEventReply(threadID);

  global.client.handleReply.push({

    name: "فعالية",

    type: "eventQuestion",

    threadID:
      String(threadID),

    messageID:
      String(
        eventData.currentQuestionMessageID
      ),

    roundToken:
      String(
        eventData.roundToken
      )
  });
}

// ======================================================
// قائمة المشاركين
// ======================================================

async function buildParticipants(
  api,
  eventData
) {

  const sorted =
    getSortedParticipants(
      eventData
    );

  let result = "";

  for (
    let i = 0;
    i < sorted.length;
    i++
  ) {

    const id = sorted[i];

    const name =
      await getName(
        api,
        id
      );

    const score =
      eventData.scores[id] || 0;

    result +=
      `❖- ${name} : ${score} نقطة\n`;
  }

  return result;
}

// ======================================================
// قائمة الفعالية
// ======================================================

async function buildEventList(
  api,
  eventData
) {

  const participants =
    await buildParticipants(
      api,
      eventData
    );

  const first =
    await getWinnerName(
      api,
      eventData,
      0
    );

  const second =
    await getWinnerName(
      api,
      eventData,
      1
    );

  const third =
    await getWinnerName(
      api,
      eventData,
      2
    );

  return `فــعـالـيـة زنـجـوبة
••••••••••••••••••••••••••

${participants}

✹✹✹✹✹✹✹✹✹✹✹✹✹✹
❇ الـحـكـم : زنجوبة ✪
☯ نقاط الفوز : ${eventData.winPoints} ✪
✳ نـوع الـفـعـالـيـة : متنوع ✪
✹✹✹✹✹✹✹✹✹✹✹✹✹✹

- الـمـركـز الـذهـبـي 🥇 : ${first}
- الـمـركـز الـفـضـي 🥈 : ${second}
- الـمـركـز الـبـرونـزي 🥉 : ${third}`;
}

// ======================================================
// إرسال القائمة
// ======================================================

async function sendParticipantsList(
  api,
  threadID,
  eventData
) {

  const text =
    await buildEventList(
      api,
      eventData
    );

  return new Promise(resolve => {

    api.sendMessage(
      text,
      threadID,
      (err, info) => {

        if (
          !err &&
          info?.messageID
        ) {

          eventData.currentListMessageID =
            String(
              info.messageID
            );
        }

        resolve(info);
      }
    );
  });
}

// ======================================================
// تنظيف المؤقتات
// ======================================================

function clearEventTimers(
  eventData
) {

  if (eventData.timeoutID) {

    clearTimeout(
      eventData.timeoutID
    );

    eventData.timeoutID = null;
  }

  if (eventData.nextTimer) {

    clearTimeout(
      eventData.nextTimer
    );

    eventData.nextTimer = null;
  }
}

// ======================================================
// جدولة الجولة القادمة
// ======================================================

function scheduleNextChallenge(
  api,
  threadID,
  eventData,
  data
) {

  if (
    !eventData.active ||
    !eventData.started
  ) {
    return;
  }

  if (eventData.nextTimer) {

    clearTimeout(
      eventData.nextTimer
    );

    eventData.nextTimer = null;
  }

  eventData.nextTimer =
    setTimeout(
      async () => {

        eventData.nextTimer = null;

        if (
          !eventData.active ||
          !eventData.started
        ) {
          return;
        }

        await sendChallenge(
          api,
          threadID,
          eventData,
          data
        );

      },
      NEXT_ROUND_DELAY
    );
}

// ======================================================
// إرسال تحدي
// ======================================================

async function sendChallenge(
  api,
  threadID,
  eventData,
  data
) {

  if (
    !eventData.active ||
    !eventData.started
  ) {
    return;
  }

  if (eventData.processingRound) {
    return;
  }

  eventData.processingRound = true;

  removeEventReply(threadID);

  eventData.currentQuestionMessageID =
    null;

  eventData.currentPreviewMessageID =
    null;

  eventData.answered = false;

  eventData.waitingForAnswer = false;

  eventData.round++;

  const challenge =
    getRandomChallenge(
      eventData.currentChallenge?.question
    );

  eventData.currentChallenge =
    challenge;

  eventData.roundToken =
    String(Date.now()) +
    "_" +
    Math.random();

  saveData(data);

  // ====================================================
  // إعلان نوع التحدي
  // ====================================================

  const preview =
    `فــعـالـيـة زنـجـوبة

✳ التحدي القادم
🎮 النوع : ${challenge.type}

⏳ السؤال سيظهر بعد 3 ثوانٍ...`;

  await new Promise(resolve => {

    api.sendMessage(
      preview,
      threadID,
      (err, info) => {

        if (
          !err &&
          info?.messageID
        ) {

          eventData.currentPreviewMessageID =
            String(
              info.messageID
            );
        }

        resolve();
      }
    );
  });

  await new Promise(
    resolve =>
      setTimeout(
        resolve,
        PREVIEW_TIME
      )
  );

  if (
    !eventData.active ||
    !eventData.started ||
    eventData.answered
  ) {

    eventData.processingRound =
      false;

    return;
  }

  await deleteMessage(
    api,
    eventData.currentPreviewMessageID
  );

  eventData.currentPreviewMessageID =
    null;

  // ====================================================
  // نص السؤال
  // ====================================================

  let questionText =
    `فــعـالـيـة زنـجـوبة

━━━━━━━━━━━━━━
🎮 النوع : ${challenge.type}
📊 الجولة : ${eventData.round}
━━━━━━━━━━━━━━

❖ ${challenge.question}

⏳ لديك 15 ثانية للإجابة
↩️ يجب الرد على هذه الرسالة`;

  // إظهار الإيموجي المطلوب بشكل أوضح
  if (
    challenge.type === "جلب قلب"
  ) {

    questionText =
      `فــعـالـيـة زنـجـوبة

━━━━━━━━━━━━━━
💗 تـحـدي جـلـب الـقـلـب
📊 الجولة : ${eventData.round}
━━━━━━━━━━━━━━

🎯 اللون المطلوب:
${challenge.targetColor}

❖ أرسل القلب باللون المطلوب فقط

⏳ لديك 15 ثانية
↩️ يجب الرد على هذه الرسالة`;
  }

  // ====================================================
  // إرسال السؤال
  // ====================================================

  await new Promise(resolve => {

    api.sendMessage(
      questionText,
      threadID,
      (err, info) => {

        if (
          !err &&
          info?.messageID
        ) {

          eventData.currentQuestionMessageID =
            String(
              info.messageID
            );

          eventData.waitingForAnswer =
            true;

          registerQuestionReply(
            eventData,
            threadID
          );
        }

        resolve();
      }
    );
  });

  eventData.processingRound =
    false;

  saveData(data);

  // ====================================================
  // مؤقت 15 ثانية
  // ====================================================

  if (eventData.timeoutID) {

    clearTimeout(
      eventData.timeoutID
    );

    eventData.timeoutID = null;
  }

  const roundToken =
    String(
      eventData.roundToken
    );

  eventData.timeoutID =
    setTimeout(
      async () => {

        const currentData =
          loadData();

        const currentEvent =
          currentData[
            String(threadID)
          ];

        if (
          !currentEvent ||
          !currentEvent.active ||
          !currentEvent.started ||
          String(
            currentEvent.roundToken
          ) !== roundToken
        ) {
          return;
        }

        if (
          currentEvent.answered === true
        ) {
          return;
        }

        currentEvent.answered = true;

        currentEvent.waitingForAnswer =
          false;

        clearEventTimers(
          currentEvent
        );

        removeEventReply(
          threadID
        );

        await deleteMessage(
          api,
          currentEvent.currentQuestionMessageID
        );

        currentEvent.currentQuestionMessageID =
          null;

        saveData(currentData);

        if (
          currentEvent.active &&
          currentEvent.started
        ) {

          await sendParticipantsList(
            api,
            threadID,
            currentEvent
          );

          saveData(currentData);

          scheduleNextChallenge(
            api,
            threadID,
            currentEvent,
            currentData
          );
        }

      },
      ANSWER_TIME
    );
}

// ======================================================
// إنهاء الفعالية
// ======================================================

async function finishEvent(
  api,
  eventData,
  threadID,
  data
) {

  if (!eventData.active) {
    return;
  }

  eventData.active = false;
  eventData.started = false;

  eventData.answered = true;

  eventData.waitingForAnswer =
    false;

  clearEventTimers(
    eventData
  );

  removeEventReply(
    threadID
  );

  await deleteMessage(
    api,
    eventData.currentQuestionMessageID
  );

  await deleteMessage(
    api,
    eventData.currentPreviewMessageID
  );

  await deleteMessage(
    api,
    eventData.currentListMessageID
  );

  eventData.currentQuestionMessageID =
    null;

  eventData.currentPreviewMessageID =
    null;

  eventData.currentListMessageID =
    null;

  const sorted =
    getSortedParticipants(
      eventData
    );

  let finalList = "";

  for (
    let i = 0;
    i < sorted.length;
    i++
  ) {

    const id =
      sorted[i];

    const name =
      await getName(
        api,
        id
      );

    const score =
      eventData.scores[id] || 0;

    finalList +=
      `${i + 1}. ${name} — ${score} نقطة\n`;
  }

  const first =
    sorted[0]
      ? await getName(
          api,
          sorted[0]
        )
      : "لا يوجد";

  const second =
    sorted[1]
      ? await getName(
          api,
          sorted[1]
        )
      : "لا يوجد";

  const third =
    sorted[2]
      ? await getName(
          api,
          sorted[2]
        )
      : "لا يوجد";

  const finalMessage =
`فــعـالـيـة زنـجـوبة
••••••••••••••••••••••••••

📊 الـنـتـائـج الـنـهـائـيـة

${finalList}

✹✹✹✹✹✹✹✹✹✹✹✹✹✹
❇ الـحـكـم : زنجوبة ✪
☯ نقاط الفوز : ${eventData.winPoints} ✪
✳ نـوع الـفـعـالـيـة : متنوع ✪
✹✹✹✹✹✹✹✹✹✹✹✹✹✹

- الـمـركـز الـذهـبـي 🥇 : ${first}
- الـمـركـز الـفـضـي 🥈 : ${second}
- الـمـركـز الـبـرونـزي 🥉 : ${third}

🏆 انتهت الفعالية!`;

  await new Promise(resolve => {

    api.sendMessage(
      finalMessage,
      threadID,
      (err, info) => {

        if (
          !err &&
          info?.messageID
        ) {

          eventData.currentListMessageID =
            String(
              info.messageID
            );
        }

        resolve();
      }
    );
  });

  saveData(data);
}

// ======================================================
// HANDLE REPLY
// ======================================================

module.exports.handleReply =
async function ({
  api,
  event,
  handleReply
}) {

  try {

    const {
      body = "",
      threadID,
      senderID
    } = event;

    if (
      !handleReply ||
      handleReply.name !== "فعالية" ||
      handleReply.type !== "eventQuestion"
    ) {
      return;
    }

    const replyTo =
      event.messageReply?.messageID;

    if (!replyTo) {
      return;
    }

    if (
      String(replyTo) !==
      String(handleReply.messageID)
    ) {
      return;
    }

    const data =
      loadData();

    const id =
      String(threadID);

    const eventData =
      data[id];

    if (
      !eventData ||
      !eventData.active ||
      !eventData.started
    ) {
      return;
    }

    if (
      String(
        eventData.currentQuestionMessageID
      ) !==
      String(
        handleReply.messageID
      )
    ) {
      return;
    }

    if (
      String(
        eventData.roundToken
      ) !==
      String(
        handleReply.roundToken
      )
    ) {
      return;
    }

    if (
      eventData.answered ||
      !eventData.waitingForAnswer
    ) {
      return;
    }

    const userID =
      String(senderID);

    if (
      !eventData.participants.includes(
        userID
      )
    ) {
      return;
    }

    const challenge =
      eventData.currentChallenge;

    if (!challenge) {
      return;
    }

    const correct =
      checkAnswer(
        body,
        challenge.answers
      );

    if (!correct) {
      return;
    }

    // ==================================================
    // قفل الجولة فورًا
    // ==================================================

    eventData.answered = true;

    eventData.waitingForAnswer =
      false;

    clearEventTimers(
      eventData
    );

    removeEventReply(
      threadID
    );

    // ==================================================
    // إضافة النقطة
    // ==================================================

    eventData.scores[userID] =
      (
        eventData.scores[userID] ||
        0
      ) + 1;

    saveData(data);

    // ==================================================
    // حذف السؤال والقائمة
    // ==================================================

    await deleteMessage(
      api,
      eventData.currentQuestionMessageID
    );

    await deleteMessage(
      api,
      eventData.currentListMessageID
    );

    eventData.currentQuestionMessageID =
      null;

    eventData.currentListMessageID =
      null;

    saveData(data);

    // ==================================================
    // تحقق من الفوز
    // ==================================================

    if (
      eventData.scores[userID] >=
      eventData.winPoints
    ) {

      await finishEvent(
        api,
        eventData,
        threadID,
        data
      );

      return;
    }

    // ==================================================
    // قائمة جديدة
    // ==================================================

    await sendParticipantsList(
      api,
      threadID,
      eventData
    );

    saveData(data);

    // ==================================================
    // تحدي جديد
    // ==================================================

    scheduleNextChallenge(
      api,
      threadID,
      eventData,
      data
    );

  } catch (error) {

    console.error(
      "❌ ZANJOUBA EVENT HANDLE REPLY ERROR:",
      error
    );
  }
};

// ======================================================
// RUN
// ======================================================

module.exports.run =
async function ({
  api,
  event,
  args
}) {

  const {
    threadID,
    messageID,
    senderID
  } = event;

  const id =
    String(threadID);

  const data =
    loadData();

  let eventData =
    data[id];

  const action =
    String(
      args?.[0] || ""
    )
      .trim()
      .toLowerCase();

  // ====================================================
  // إنشاء
  // ====================================================

  if (
    action === "إنشاء" ||
    action === "انشاء" ||
    action === "create"
  ) {

    const winPoints =
      Number(args?.[1]);

    if (
      !Number.isInteger(
        winPoints
      ) ||
      winPoints <= 0
    ) {

      return api.sendMessage(
`فــعـالـيـة زنـجـوبة

⚠️ يجب تحديد نقاط الفوز.

مثال:
فعالية إنشاء 10

☯ نقاط الفوز = 10`,
        threadID,
        messageID
      );
    }

    if (
      eventData?.active
    ) {

      return api.sendMessage(
`فــعـالـيـة زنـجـوبة

⚠️ توجد فعالية نشطة بالفعل.

استخدم:
فعالية إنهاء`,
        threadID,
        messageID
      );
    }

    eventData =
      createEvent(
        senderID,
        winPoints
      );

    data[id] =
      eventData;

    saveData(data);

    const creatorName =
      await getName(
        api,
        senderID
      );

    return api.sendMessage(
`فــعـالـيـة زنـجـوبة
••••••••••••••••••••••••••

✅ تم إنشاء فعالية جديدة!

❇ الـحـكـم : زنجوبة ✪
👤 الـمـنـشـئ : ${creatorName}
☯ نقاط الفوز : ${winPoints} ✪
✳ نـوع الـفـعـالـيـة : متنوع ✪

📝 للانضمام:
فعالية انضمام

🏁 لبدء الفعالية:
فعالية بدء

⚠️ نقاط الفوز يحددها المنشئ عند الإنشاء.`,
      threadID,
      messageID
    );
  }

  // ====================================================
  // لا توجد فعالية
  // ====================================================

  if (!eventData?.active) {

    return api.sendMessage(
`فــعـالـيـة زنـجـوبة

❌ لا توجد فعالية نشطة.

لإنشاء فعالية:
فعالية إنشاء 10`,
      threadID,
      messageID
    );
  }

  // ====================================================
  // الانضمام
  // ====================================================

  if (
    action === "انضمام" ||
    action === "انضم" ||
    action === "join"
  ) {

    if (eventData.started) {

      return api.sendMessage(
`فــعـالـيـة زنـجـوبة

⚠️ الفعالية بدأت بالفعل.`,
        threadID,
        messageID
      );
    }

    const userID =
      String(senderID);

    if (
      eventData.participants.includes(
        userID
      )
    ) {

      return api.sendMessage(
`فــعـالـيـة زنـجـوبة

⚠️ أنت مشترك بالفعل.`,
        threadID,
        messageID
      );
    }

    eventData.participants.push(
      userID
    );

    eventData.scores[userID] =
      0;

    saveData(data);

    const name =
      await getName(
        api,
        userID
      );

    return api.sendMessage(
`فــعـالـيـة زنـجـوبة

✅ انضم ${name} إلى الفعالية.

👥 عدد المشاركين:
${eventData.participants.length}

🏁 عندما يصبح الجميع جاهزًا:
فعالية بدء`,
      threadID,
      messageID
    );
  }

  // ====================================================
  // بدء
  // ====================================================

  if (
    action === "بدء" ||
    action === "ابدأ" ||
    action === "start"
  ) {

    if (
      String(senderID) !==
      String(eventData.creator)
    ) {

      return api.sendMessage(
`فــعـالـيـة زنـجـوبة

⛔ المنشئ فقط يستطيع بدء الفعالية.`,
        threadID,
        messageID
      );
    }

    if (eventData.started) {

      return api.sendMessage(
`فــعـالـيـة زنـجـوبة

⚠️ الفعالية بدأت بالفعل.`,
        threadID,
        messageID
      );
    }

    if (
      eventData.participants.length <
      1
    ) {

      return api.sendMessage(
`فــعـالـيـة زنـجـوبة

⚠️ لا يوجد مشاركون.

يجب على الأعضاء استخدام:
فعالية انضمام`,
        threadID,
        messageID
      );
    }

    clearEventTimers(
      eventData
    );

    removeEventReply(
      threadID
    );

    eventData.started =
      true;

    eventData.round =
      0;

    eventData.answered =
      false;

    eventData.waitingForAnswer =
      false;

    eventData.processingRound =
      false;

    saveData(data);

    await sendParticipantsList(
      api,
      threadID,
      eventData
    );

    saveData(data);

    scheduleNextChallenge(
      api,
      threadID,
      eventData,
      data
    );

    return;
  }

  // ====================================================
  // إنهاء
  // ====================================================

  if (
    action === "إنهاء" ||
    action === "انهاء" ||
    action === "end"
  ) {

    if (
      String(senderID) !==
      String(eventData.creator)
    ) {

      return api.sendMessage(
`فــعـالـيـة زنـجـوبة

⛔ المنشئ فقط يستطيع إنهاء الفعالية.`,
        threadID,
        messageID
      );
    }

    return finishEvent(
      api,
      eventData,
      threadID,
      data
    );
  }

  // ====================================================
  // الحالة
  // ====================================================

  if (
    action === "حالة" ||
    action === "status"
  ) {

    const message =
      await buildEventList(
        api,
        eventData
      );

    return api.sendMessage(
      message,
      threadID,
      messageID
    );
  }

  // ====================================================
  // أمر غير معروف
  // ====================================================

  return api.sendMessage(
`فــعـالـيـة زنـجـوبة

الأوامر:

فعالية إنشاء 10
فعالية انضمام
فعالية بدء
فعالية حالة
فعالية إنهاء

☯ نقاط الفوز يحددها المنشئ.

مثال:
فعالية إنشاء 10`,
    threadID,
    messageID
  );
};