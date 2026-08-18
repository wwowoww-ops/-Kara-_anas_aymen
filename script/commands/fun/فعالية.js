const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "فعالية",
  version: "6.0.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "نظام فعاليات متنوعة بالنقاط والتحديات",
  commandCategory: "fun",
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
// الذاكرة
// ======================================================

if (!global.zanjoubaEvents) {
  global.zanjoubaEvents = new Map();
}


// ======================================================
// قراءة البيانات
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


// ======================================================
// حفظ البيانات
// ======================================================

function saveData(data) {
  try {
    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify(data, null, 2)
    );
  } catch (e) {
    console.error("EVENT SAVE ERROR:", e);
  }
}


// ======================================================
// إنشاء بيانات فعالية
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

    maxRounds: 0,

    currentChallenge: null,

    currentQuestionMessageID: null,

    currentListMessageID: null,

    currentPreviewMessageID: null,

    questionStartedAt: 0,

    answered: false,

    timeoutID: null,

    nextTimer: null
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


// ======================================================
// التحقق من الإجابة
// ======================================================

function checkAnswer(input, answers) {

  const normalized =
    normalizeAnswer(input);

  return answers.some(answer => {

    return normalized ===
      normalizeAnswer(answer);
  });
}


// ======================================================
// التحديات
// ======================================================

const CHALLENGES = [

  // =========================
  // ثقافة
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
    question: "ما هي أكبر قارة في العالم؟",
    answers: ["اسيا", "آسيا"]
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
    question: "كم عدد قارات العالم؟",
    answers: ["7", "سبع", "سبعة"]
  },

  {
    type: "سؤال ثقافي",
    question: "ما هو أكبر محيط في العالم؟",
    answers: ["المحيط الهادئ", "الهادئ"]
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
    answers: ["6", "ستة", "سته"]
  },

  {
    type: "سؤال ديني",
    question: "ما أول سورة في القرآن؟",
    answers: ["الفاتحه", "الفاتحة"]
  },

  {
    type: "سؤال ديني",
    question: "ما آخر سورة في القرآن؟",
    answers: ["الناس"]
  },

  {
    type: "سؤال ديني",
    question: "كم عدد الصلوات المفروضة في اليوم؟",
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
      "محمد صلى الله عليه وسلم",
      "النبي محمد"
    ]
  },

  {
    type: "سؤال ديني",
    question: "ما هي قبلة المسلمين؟",
    answers: ["الكعبة", "الكعبه"]
  },


  // =========================
  // أنمي
  // =========================

  {
    type: "سؤال أنمي",
    question: "ما اسم بطل أنمي One Piece؟",
    answers: ["لوفي", "مونكي دي لوفي", "مونكي دي. لوفي"]
  },

  {
    type: "سؤال أنمي",
    question: "ما اسم بطل Dragon Ball؟",
    answers: ["غوكو", "جوكو"]
  },

  {
    type: "سؤال أنمي",
    question: "ما اسم أخ ناروتو؟",
    answers: ["لا يوجد"]
  },

  {
    type: "سؤال أنمي",
    question: "ما اسم القرية التي ينتمي إليها ناروتو؟",
    answers: [
      "كونوها",
      "قرية الورق",
      "قرية كونوها"
    ]
  },

  {
    type: "سؤال أنمي",
    question: "ما اسم سيف إيتشيغو الشهير؟",
    answers: ["زангتسو", "زانغيتسو", "زانجيتسو"]
  },

  {
    type: "سؤال أنمي",
    question: "ما اسم قائد فرقة الاستطلاع في هجوم العمالقة؟",
    answers: ["إروين", "إروين سميث", "اروين", "اروين سميث"]
  },

  {
    type: "سؤال أنمي",
    question: "ما اسم بطل Solo Leveling؟",
    answers: [
      "سونغ جين وو",
      "سونغ جين ووو",
      "جين وو"
    ]
  },

  {
    type: "سؤال أنمي",
    question: "ما اسم أخ زورو؟",
    answers: ["لا يوجد"]
  },


  // =========================
  // رياضيات
  // =========================

  {
    type: "سؤال رياضي",
    question: "كم يساوي 5 + 5؟",
    answers: ["10", "عشرة"]
  },

  {
    type: "سؤال رياضي",
    question: "كم يساوي 10 × 2؟",
    answers: ["20", "عشرون"]
  },

  {
    type: "سؤال رياضي",
    question: "كم يساوي 100 ÷ 10؟",
    answers: ["10", "عشرة"]
  },

  {
    type: "سؤال رياضي",
    question: "كم يساوي 9 × 9؟",
    answers: ["81", "واحد وثمانون"]
  },

  {
    type: "سؤال رياضي",
    question: "كم يساوي 50 - 20؟",
    answers: ["30", "ثلاثون"]
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
      "💗",
      "💓"
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


  // =========================
  // تجميع كلمات
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
    question: "ما هو الحيوان المعروف بسفينة الصحراء؟",
    answers: ["الجمل"]
  },

  {
    type: "معلومات عامة",
    question: "ما هو أسرع حيوان بري؟",
    answers: ["الفهد"]
  },

  {
    type: "معلومات عامة",
    question: "ما هو أكبر حيوان على الأرض؟",
    answers: ["الحوت الأزرق", "الحوت الازرق"]
  },

  {
    type: "معلومات عامة",
    question: "كم عدد أيام الأسبوع؟",
    answers: ["7", "سبعة"]
  }
];


// ======================================================
// جلب تحدي عشوائي
// ======================================================

function getRandomChallenge(previous = null) {

  let available =
    CHALLENGES.filter(
      challenge =>
        challenge.question !== previous
    );

  if (!available.length) {
    available = CHALLENGES;
  }

  const challenge =
    available[
      Math.floor(
        Math.random() *
        available.length
      )
    ];

  return {
    type: challenge.type,
    question: challenge.question,
    answers: challenge.answers
  };
}


// ======================================================
// اسم المستخدم
// ======================================================

async function getName(api, id) {

  try {

    const info =
      await api.getUserInfo(String(id));

    return (
      info?.[id]?.name ||
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

  return [...eventData.participants]
    .sort(
      (a, b) =>
        (eventData.scores[b] || 0) -
        (eventData.scores[a] || 0)
    );
}


// ======================================================
// إنشاء قائمة المشاركين
// ======================================================

async function buildParticipantsList(api, eventData) {

  const sorted =
    getSortedParticipants(eventData);

  let list = "";

  for (let i = 0; i < sorted.length; i++) {

    const id = sorted[i];

    const name =
      await getName(api, id);

    const score =
      eventData.scores[id] || 0;

    list +=
      `❖- ${name} : ${score} نقطة\n`;
  }

  return list;
}


// ======================================================
// قائمة الفعالية
// ======================================================

async function buildEventList(api, eventData) {

  const list =
    await buildParticipantsList(
      api,
      eventData
    );

  return (
`فــعـالـيـة زنـجـوبة
••••••••••••••••••••••••••

${list}
✹✹✹✹✹✹✹✹✹✹✹✹✹✹
❇ الـحـكـم : زنجوبة ✪
☯ نقاط الفوز : ${eventData.winPoints} ✪
✳ نـوع الـفـعـالـيـة : متنوع ✪
✹✹✹✹✹✹✹✹✹✹✹✹✹✹

- الـمـركـز الـذهـبـي 🥇 : ${await getWinnerName(api, eventData, 0)}
- الـمـركـز الـفـضـي 🥈 : ${await getWinnerName(api, eventData, 1)}
- الـمـركـز الـبـرونـزي 🥉 : ${await getWinnerName(api, eventData, 2)}`
  );
}


// ======================================================
// أسماء المراكز الحالية
// ======================================================

async function getWinnerName(api, eventData, index) {

  const sorted =
    getSortedParticipants(eventData);

  if (!sorted[index]) {
    return "";
  }

  return await getName(
    api,
    sorted[index]
  );
}


// ======================================================
// حذف رسالة
// ======================================================

async function deleteMessage(api, messageID) {

  if (!messageID) {
    return;
  }

  try {
    await api.unsendMessage(
      messageID
    );
  } catch (e) {}
}


// ======================================================
// حذف قائمة قديمة وسؤال قديم
// ======================================================

async function deleteOldMessages(api, eventData) {

  await deleteMessage(
    api,
    eventData.currentListMessageID
  );

  await deleteMessage(
    api,
    eventData.currentQuestionMessageID
  );

  await deleteMessage(
    api,
    eventData.currentPreviewMessageID
  );

  eventData.currentListMessageID = null;
  eventData.currentQuestionMessageID = null;
  eventData.currentPreviewMessageID = null;
}


// ======================================================
// إرسال قائمة المشاركين
// ======================================================

async function sendParticipantsList(
  api,
  threadID,
  eventData
) {

  const message =
    await buildEventList(
      api,
      eventData
    );

  return new Promise(resolve => {

    api.sendMessage(
      message,
      threadID,
      (err, info) => {

        if (
          !err &&
          info?.messageID
        ) {

          eventData.currentListMessageID =
            String(info.messageID);

        }

        resolve(info);
      }
    );

  });
}


// ======================================================
// إرسال التحدي بعد 3 ثوانٍ
// ======================================================

function scheduleNextChallenge(
  api,
  threadID,
  eventData,
  data
) {

  if (!eventData.active) {
    return;
  }

  if (eventData.nextTimer) {
    clearTimeout(
      eventData.nextTimer
    );
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
      3000
    );
}


// ======================================================
// إرسال التحدي
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

  eventData.round++;

  const challenge =
    getRandomChallenge(
      eventData.currentChallenge?.question
    );

  eventData.currentChallenge =
    challenge;

  eventData.answered = false;

  eventData.questionStartedAt =
    Date.now();

  saveData(data);


  // ----------------------------------------------------
  // رسالة الإعلان عن التحدي
  // ----------------------------------------------------

  const preview =
`فــعـالـيـة زنـجـوبة

✳ التحدي القادم
🎮 النوع : ${challenge.type}

⏳ سيظهر السؤال بعد 3 ثوانٍ...`;

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
            String(info.messageID);

        }

        resolve();
      }
    );

  });


  // ----------------------------------------------------
  // الانتظار 3 ثوانٍ
  // ----------------------------------------------------

  await new Promise(
    resolve =>
      setTimeout(resolve, 3000)
  );


  if (
    !eventData.active ||
    !eventData.started ||
    eventData.answered
  ) {
    return;
  }


  // ----------------------------------------------------
  // حذف الإعلان فقط
  // ----------------------------------------------------

  await deleteMessage(
    api,
    eventData.currentPreviewMessageID
  );

  eventData.currentPreviewMessageID =
    null;


  // ----------------------------------------------------
  // إرسال السؤال
  // ----------------------------------------------------

  const questionMessage =
`فــعـالـيـة زنـجـوبة

━━━━━━━━━━━━━━
🎮 النوع : ${challenge.type}
📊 الجولة : ${eventData.round}
━━━━━━━━━━━━━━

❖ ${challenge.question}

⏳ لديك 10 ثوانٍ للإجابة
↩️ يجب الرد على هذه الرسالة`;

  await new Promise(resolve => {

    api.sendMessage(
      questionMessage,
      threadID,
      (err, info) => {

        if (
          !err &&
          info?.messageID
        ) {

          eventData.currentQuestionMessageID =
            String(info.messageID);

          registerQuestionReply(
            api,
            eventData,
            threadID
          );

        }

        resolve();
      }
    );

  });

  saveData(data);


  // ----------------------------------------------------
  // مؤقت 10 ثوانٍ
  // ----------------------------------------------------

  if (eventData.timeoutID) {

    clearTimeout(
      eventData.timeoutID
    );
  }

  eventData.timeoutID =
    setTimeout(
      async () => {

        if (
          !eventData.active ||
          eventData.answered
        ) {
          return;
        }

        eventData.answered = true;

        await deleteMessage(
          api,
          eventData.currentQuestionMessageID
        );

        eventData.currentQuestionMessageID =
          null;

        saveData(data);

        scheduleNextChallenge(
          api,
          threadID,
          eventData,
          data
        );

      },
      10000
    );
}


// ======================================================
// تسجيل handleReply للسؤال
// ======================================================

function registerQuestionReply(
  api,
  eventData,
  threadID
) {

  if (!global.client.handleReply) {
    global.client.handleReply = [];
  }

  global.client.handleReply =
    global.client.handleReply.filter(
      item =>
        item.name !== "فعالية"
    );


  global.client.handleReply.push({

    name: "فعالية",

    messageID:
      eventData.currentQuestionMessageID,

    author: null,

    threadID: threadID,

    type: "eventQuestion",

    challenge:
      eventData.currentChallenge,

    eventData: eventData
  });
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


  // حذف السؤال والإعلان فقط
  await deleteMessage(
    api,
    eventData.currentQuestionMessageID
  );

  await deleteMessage(
    api,
    eventData.currentPreviewMessageID
  );


  // القائمة القديمة لن تبقى
  // سيتم استبدالها بالقائمة النهائية

  await deleteMessage(
    api,
    eventData.currentListMessageID
  );


  eventData.currentQuestionMessageID = null;
  eventData.currentPreviewMessageID = null;
  eventData.currentListMessageID = null;


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

    const id = sorted[i];

    const name =
      await getName(api, id);

    const score =
      eventData.scores[id] || 0;

    finalList +=
      `${i + 1}. ${name} — ${score} نقطة\n`;
  }


  const first =
    sorted[0]
      ? await getName(api, sorted[0])
      : "لا يوجد";

  const second =
    sorted[1]
      ? await getName(api, sorted[1])
      : "لا يوجد";

  const third =
    sorted[2]
      ? await getName(api, sorted[2])
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


  // ----------------------------------------------------
  // القائمة النهائية لا يتم حذفها
  // ----------------------------------------------------

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
            String(info.messageID);
        }

        resolve();
      }
    );

  });


  saveData(data);


  // تنظيف handleReply الخاص بهذه الفعالية

  if (global.client.handleReply) {

    global.client.handleReply =
      global.client.handleReply.filter(
        item =>
          item.threadID !== threadID ||
          item.type !== "eventQuestion"
      );
  }
}


// ======================================================
// handleReply
// ======================================================

module.exports.handleReply = async function ({
  api,
  event,
  handleReply
}) {

  try {

    const {
      body = "",
      threadID,
      senderID,
      messageID
    } = event;


    // ----------------------------------------------
    // يجب أن يكون الرد على السؤال نفسه
    // ----------------------------------------------

    if (
      handleReply.type !== "eventQuestion"
    ) {
      return;
    }


    if (
      String(messageID) ===
      String(handleReply.messageID)
    ) {
      return;
    }


    const replyTo =
      event.messageReply?.messageID;


    if (
      !replyTo ||
      String(replyTo) !==
      String(handleReply.messageID)
    ) {
      return;
    }


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


    // ----------------------------------------------
    // منع صاحب السؤال من الإجابة بعد انتهاء الوقت
    // ----------------------------------------------

    if (
      eventData.answered
    ) {
      return;
    }


    // ----------------------------------------------
    // يجب أن يكون من المشاركين
    // ----------------------------------------------

    if (
      !eventData.participants.includes(
        String(senderID)
      )
    ) {
      return;
    }


    // ----------------------------------------------
    // التحقق من الإجابة
    // ----------------------------------------------

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


    // ----------------------------------------------
    // قفل السؤال فوراً
    // ----------------------------------------------

    eventData.answered = true;


    if (eventData.timeoutID) {

      clearTimeout(
        eventData.timeoutID
      );

      eventData.timeoutID = null;
    }


    // ----------------------------------------------
    // إضافة النقطة
    // ----------------------------------------------

    const id =
      String(senderID);

    eventData.scores[id] =
      (eventData.scores[id] || 0) + 1;


    // ----------------------------------------------
    // حذف السؤال والقائمة القديمة
    // ----------------------------------------------

    await deleteMessage(
      api,
      eventData.currentQuestionMessageID
    );

    await deleteMessage(
      api,
      eventData.currentListMessageID
    );

    await deleteMessage(
      api,
      eventData.currentPreviewMessageID
    );


    eventData.currentQuestionMessageID = null;
    eventData.currentListMessageID = null;
    eventData.currentPreviewMessageID = null;


    saveData(data);


    // ----------------------------------------------
    // هل وصل إلى نقاط الفوز؟
    // ----------------------------------------------

    if (
      eventData.scores[id] >=
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


    // ----------------------------------------------
    // القائمة الجديدة
    // ----------------------------------------------

    await sendParticipantsList(
      api,
      threadID,
      eventData
    );


    saveData(data);


    // ----------------------------------------------
    // إعلان التحدي القادم بعد 3 ثوانٍ
    // ----------------------------------------------

    scheduleNextChallenge(
      api,
      threadID,
      eventData,
      data
    );

  } catch (error) {

    console.error(
      "❌ ZANJOUBA EVENT REPLY ERROR:",
      error
    );
  }
};


// ======================================================
// الأمر الرئيسي
// ======================================================

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


  const data =
    loadData();


  const id =
    String(threadID);


  let eventData =
    data[id];


  const action =
    String(
      args?.[0] || ""
    )
      .trim()
      .toLowerCase();


  // ====================================================
  // إنشاء فعالية
  // ====================================================

  if (
    action === "إنشاء" ||
    action === "انشاء" ||
    action === "create"
  ) {

    const winPoints =
      Number(args?.[1]);


    if (
      !Number.isInteger(winPoints) ||
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
  // التحقق من وجود فعالية
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
        `فــعـالـيـة زنـجـوبة\n\n⚠️ الفعالية بدأت بالفعل.`,
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
        `فــعـالـيـة زنـجـوبة\n\n⚠️ أنت مشترك بالفعل.`,
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

🏁 عندما يصبح الجميع جاهزاً:
فعالية بدء`,
      threadID,
      messageID
    );
  }


  // ====================================================
  // البدء
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
        `فــعـالـيـة زنـجـوبة\n\n⛔ المنشئ فقط يستطيع بدء الفعالية.`,
        threadID,
        messageID
      );
    }


    if (eventData.started) {

      return api.sendMessage(
        `فــعـالـيـة زنـجـوبة\n\n⚠️ الفعالية بدأت بالفعل.`,
        threadID,
        messageID
      );
    }


    if (
      eventData.participants.length <
      1
    ) {

      return api.sendMessage(
        `فــعـالـيـة زنـجـوبة\n\n⚠️ لا يوجد مشاركون.\n\nيجب على الأعضاء استخدام:\nفعالية انضمام`,
        threadID,
        messageID
      );
    }


    eventData.started = true;
    eventData.round = 0;
    eventData.answered = false;


    saveData(data);


    // ----------------------------------------------
    // إرسال قائمة المشاركين أولاً
    // ----------------------------------------------

    await sendParticipantsList(
      api,
      threadID,
      eventData
    );


    saveData(data);


    // ----------------------------------------------
    // بعدها التحدي بعد 3 ثوانٍ
    // ----------------------------------------------

    scheduleNextChallenge(
      api,
      threadID,
      eventData,
      data
    );


    return;
  }


  // ====================================================
  // إنهاء يدوي
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
        `فــعـالـيـة زنـجـوبة\n\n⛔ المنشئ فقط يستطيع إنهاء الفعالية.`,
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