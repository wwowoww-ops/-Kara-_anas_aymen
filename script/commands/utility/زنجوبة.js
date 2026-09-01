const axios = require("axios");

// ==================================================
// الذاكرة
// ==================================================

if (!global.usersNames)
  global.usersNames = new Map();

if (!global.conversationHistory)
  global.conversationHistory = new Map();

// ==================================================
// CONFIG
// ==================================================

module.exports.config = {
  name: "زنجوبة",
  version: "16.0.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "زنجوبة — ذكاء اصطناعي تونسي بجلسة جماعية",
  commandCategory: "utility",
  usages: ".زنجوبة [النص]",
  cooldowns: 3
};

// ==================================================
// إعدادات Groq
// ==================================================

const ADMIN_ID = "61578581225040";

// ==================================================
// 🔑 مفتاح Groq
// ==================================================
// ضع مفتاح Groq هنا
// مثال:
// const GROQ_API_KEY = "gsk_xxxxxxxxxxxxxxxxx";

const GROQ_API_KEY =
  "PUT_YOUR_GROQ_API_KEY_HERE";

// ==================================================
// Groq
// ==================================================

const GROQ_URL =
  "https://api.groq.com/openai/v1/chat/completions";

const GROQ_MODEL =
  "llama-3.3-70b-versatile";

// ==================================================
// التحقق من المفتاح
// ==================================================

function getGroqKey() {

  const key =
    String(
      GROQ_API_KEY || ""
    ).trim();

  if (
    !key ||
    key ===
      "PUT_YOUR_GROQ_API_KEY_HERE"
  ) {

    console.error(
      "❌ لم يتم وضع مفتاح Groq داخل الكود."
    );

    return null;
  }

  return key;
}

// ==================================================
// طلب Groq
// ==================================================

async function askGroq(
  messages,
  maxTokens
) {

  const apiKey =
    getGroqKey();

  if (!apiKey) {

    throw new Error(
      "MODEL_API_KEY_MISSING"
    );
  }

  const response =
    await axios.post(
      GROQ_URL,
      {

        model:
          GROQ_MODEL,

        messages,

        temperature:
          0.7,

        max_completion_tokens:
          maxTokens,

        top_p:
          0.95,

        stream:
          false

      },
      {

        headers: {

          Authorization:
            `Bearer ${apiKey}`,

          "Content-Type":
            "application/json"

        },

        timeout:
          60000

      }
    );

  const answer =
    response
      ?.data
      ?.choices?.[0]
      ?.message
      ?.content
      ?.trim();

  if (!answer) {

    throw new Error(
      "EMPTY_GROQ_RESPONSE"
    );

  }

  return answer;
}

// ==================================================
// 🐿️ تفاعل زنجوبة
// ==================================================

function reactSquirrel(
  api,
  messageID
) {

  try {

    if (
      !api ||
      typeof api.setMessageReaction !==
        "function"
    ) {

      console.error(
        "❌ setMessageReaction غير متوفرة في API"
      );

      return;
    }

    api.setMessageReaction(
      "🐿️",
      messageID,
      () => {},
      true
    );

  } catch (error) {

    console.error(
      "❌ Reaction Error:",
      error
    );

  }
}

// ==================================================
// 🇹🇳 اللهجة التونسية
// ==================================================

function detectDialect(text) {

  if (
    /شنوة|شنيا|شبيك|كيفاش|علاش|وينك|وين|برشا|باهي|باهي برشا|توا|تو|مانيش|موش|موش لازم|نحب|تحب|تحبّ|نمشي|نمشيوا|ياخي|هاو|هاني|راهو|راهي|خاطر|خاطرش|زعمة|يزي|يعطيك الصحة|صحيت/i
      .test(text)
  ) {

    return "تونسية";
  }

  if (
    /شلونك|شكو|ماكو|يابة|زين/i
      .test(text)
  ) {

    return "عراقية";
  }

  if (
    /هلق|شو|لسا|كيفك|وينك/i
      .test(text)
  ) {

    return "شامية";
  }

  if (
    /ازيك|عامل ايه|يسطا|بتاع/i
      .test(text)
  ) {

    return "مصرية";
  }

  if (
    /واش|علاه|بصح|برك|بزاف|ماكانش|راني|راكي|راك|دروك|هكا|صح|نورمال|نتي|نتا|خويا|يخي/i
      .test(text)
  ) {

    return "جزائرية";
  }

  if (
    /[a-zA-Z]{3,}/
      .test(text)
  ) {

    return "إنجليزية";
  }

  return "تونسية";
}

// ==================================================
// تحديد طول الرد
// ==================================================

function getResponseLength(
  text
) {

  const words =
    text
      .trim()
      .split(/\s+/);

  if (
    words.length <= 3
  ) {

    return {

      maxTokens:
        100,

      instruction:
        "جاوبي بجملة أو جملتين فقط وبطريقة طبيعية."

    };
  }

  if (
    /اشرح|فسر|وضح|كيفاش|كيف|شنوة|شنيا|نصيحة/i
      .test(text)
  ) {

    return {

      maxTokens:
        250,

      instruction:
        "جاوبي بإيجاز ووضوح وباللهجة التونسية."

    };
  }

  if (
    /حلل|قارن|احسب|معادلة|ترجم|فسر بالتفصيل/i
      .test(text)
  ) {

    return {

      maxTokens:
        450,

      instruction:
        "قدمي شرحًا مفصلًا وواضحًا لكن بدون حشو."

    };
  }

  return {

    maxTokens:
      250,

    instruction:
      "جاوبي بشكل واضح ومباشر وباللهجة التونسية."

  };
}

// ==================================================
// شخصية زنجوبة
// ==================================================

function buildSystemRole(
  dialect,
  userName,
  isAdmin
) {

  return `
أنتِ فتاة اسمها "زنجوبة" 🐿️.

أنتِ فتاة تونسية ذكية وسريعة الفهم وعندك شخصية مرحة وساخرة بطريقة خفيفة.

━━━━━━━━━━━━━━━━━━
🇹🇳 طريقة الكلام
━━━━━━━━━━━━━━━━━━

- لهجتك الأساسية تونسية.
- تكلمي بطريقة طبيعية مثل محادثة Messenger بين تونسيين.
- استعملي الدارجة التونسية بشكل طبيعي.
- لا تبالغي في استعمال الكلمات التونسية.
- لا تتكلمي بلهجة جزائرية أو شامية أو مصرية إلا إذا كان ذلك مناسبًا لسياق المستخدم.
- يمكنك فهم اللهجات العربية المختلفة والرد عليها.
- استعملي كلمات تونسية مثل:
  شنوة
  شنية
  كيفاش
  علاش
  وين
  توا
  برشا
  باهي
  موش
  مانيش
  نحب
  تحب
  خاطر
  ياخي
  يزي
  هاو
  هاني

━━━━━━━━━━━━━━━━━━
الشخصية
━━━━━━━━━━━━━━━━━━

- ذكية.
- مباشرة.
- سريعة الفهم.
- مرحة.
- ساخرة بشكل خفيف.
- تحب المزاح.
- لا تستعمل إهانات جارحة.
- تحب السناجب 🐿️.
- يمكنك استعمال •-• أحيانًا.
- لا تكثري من الإيموجيات.
- السؤال البسيط = جواب قصير.
- السؤال المعقد = شرح واضح.
- لا تكرري نفس الجملة كثيرًا.
- لا تقولي إنك روبوت في كل رد.
- لا تبدئي كل جواب بنفس العبارة.

━━━━━━━━━━━━━━━━━━
الجلسة الجماعية
━━━━━━━━━━━━━━━━━━

هذه المحادثة داخل مجموعة.

أي شخص يرد على رسالة زنجوبة يمكنه متابعة الحوار.

لا تفترضي أن الشخص الذي بدأ المحادثة هو الشخص الوحيد المسموح له بالرد.

حاولي فهم سياق الكلام من المحادثة السابقة.

إذا انتقل شخص آخر إلى الحوار، تابعي الحديث بشكل طبيعي.

لا تقولي للمستخدم:
"هذه ليست محادثتك"

ولا تطلبي منه بدء جلسة جديدة فقط لأنه شخص مختلف.

━━━━━━━━━━━━━━━━━━
أبو هريرة
━━━━━━━━━━━━━━━━━━

المطور هو "أبو هريرة".

إذا كان المستخدم هو أبو هريرة:

- احترميه.
- كلميه بلطف.
- يمكنك مناداته:
"حبيبي أبو هريرة 🐿️"

إذا سألك من طورك:

"أبو هريرة هو المطور تاعي 🐿️"

━━━━━━━━━━━━━━━━━━
القدرات
━━━━━━━━━━━━━━━━━━

يمكنك المساعدة في:

JavaScript
Python
Node.js
APIs
REST
Webhooks
تصحيح الأخطاء
الرياضيات
الترجمة
التحليل
الشرح

إذا لم تعرفي الإجابة:
لا تخترعي معلومات.

━━━━━━━━━━━━━━━━━━
الدين
━━━━━━━━━━━━━━━━━━

كوني محترمة للدين.

إذا سُئلتِ عن دينك:

"أنا مسلمة ومؤمنة بالله 🐿️"

━━━━━━━━━━━━━━━━━━
المستخدم الحالي
━━━━━━━━━━━━━━━━━━

${
  userName
    ? `اسم المستخدم: ${userName}`
    : "لا يوجد اسم محفوظ."
}

━━━━━━━━━━━━━━━━━━
اللهجة المطلوبة
━━━━━━━━━━━━━━━━━━

${dialect}

${
  isAdmin
    ? `
المستخدم الحالي هو أبو هريرة.
كوني أكثر احترامًا ولطفًا معه.
`
    : ""
}
`;
}

// ==================================================
// توليد الرد
// ==================================================

async function generateReply(
  prompt,
  conversationKey,
  senderID
) {

  if (
    !global.conversationHistory.has(
      conversationKey
    )
  ) {

    global.conversationHistory.set(
      conversationKey,
      []
    );

  }

  const history =
    global.conversationHistory.get(
      conversationKey
    );

  const dialect =
    detectDialect(
      prompt
    );

  const responseConfig =
    getResponseLength(
      prompt
    );

  const userName =
    global.usersNames.get(
      String(senderID)
    ) || null;

  const systemRole =
    buildSystemRole(
      dialect,
      userName,
      String(senderID) ===
        ADMIN_ID
    );

  const messages = [

    {
      role:
        "system",

      content:
        systemRole +
        "\n\n" +
        responseConfig.instruction
    },

    ...history.slice(-10),

    {
      role:
        "user",

      content:
        prompt
    }

  ];

  const answer =
    await askGroq(
      messages,
      responseConfig.maxTokens
    );

  history.push(

    {
      role:
        "user",

      content:
        prompt
    },

    {
      role:
        "assistant",

      content:
        answer
    }

  );

  // الاحتفاظ بآخر 20 رسالة
  if (
    history.length > 20
  ) {

    history.splice(
      0,
      history.length - 20
    );

  }

  return answer;
}

// ==================================================
// إرسال خطأ Groq
// ==================================================

function sendGroqError(
  api,
  event,
  error
) {

  console.error(
    "❌ ZANJOUBA GROQ ERROR:",
    error.response?.data ||
    error.message
  );

  let message =
    "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗨𝗧𝗜𝗟𝗜𝗧𝗬 ━━ ⌬\n\n" +
    "🐿️ صارت مشكلة صغيرة... استنى شوية ونرجعلك •-•";

  const status =
    error.response?.status;

  if (
    error.message ===
    "MODEL_API_KEY_MISSING"
  ) {

    message =
      "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗨𝗧𝗜𝗟𝗜𝗧𝗬 ━━ ⌬\n\n" +
      "🐿️ حط مفتاح Groq داخل الكود أولًا •-•";

  }

  else if (
    status === 401
  ) {

    message =
      "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗨𝗧𝗜𝗟𝗜𝗧𝗬 ━━ ⌬\n\n" +
      "🐿️ مفتاح Groq موش صالح.";

  }

  else if (
    status === 429
  ) {

    message =
      "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗨𝗧𝗜𝗟𝗜𝗧𝗬 ━━ ⌬\n\n" +
      "🐿️ وصلنا للحد المؤقت متاع الطلبات، جرب بعد شوية •-•";

  }

  else if (
    status === 400
  ) {

    message =
      "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗨𝗧𝗜𝗟𝗜𝗧𝗬 ━━ ⌬\n\n" +
      "🐿️ Groq رفض الطلب، ثبّت إعدادات النموذج •-•";

  }

  else if (
    error.code ===
    "ECONNABORTED"
  ) {

    message =
      "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗨𝗧𝗜𝗟𝗜𝗧𝗬 ━━ ⌬\n\n" +
      "🐿️ Groq تأخر في الرد، عاود جرب •-•";

  }

  return api.sendMessage(
    message,
    event.threadID,
    event.messageID
  );
}

// ==================================================
// حفظ رد زنجوبة
// ==================================================

function registerReply(
  info,
  event
) {

  if (
    !info ||
    !info.messageID
  ) {

    return;
  }

  if (
    !global.client.handleReply
  ) {

    global.client.handleReply =
      [];

  }

  const conversationKey =
    `group_${String(
      event.threadID
    )}`;

  global.client.handleReply.push({

    name:
      module.exports.config.name,

    messageID:
      info.messageID,

    threadID:
      String(event.threadID),

    conversationKey

  });

}

// ==================================================
// إرسال رد زنجوبة
// ==================================================

function sendZanjoobaReply(
  api,
  event,
  answer
) {

  return api.sendMessage(

    `🐿️ ${answer} 🌰`,

    event.threadID,

    (err, info) => {

      if (err) {

        console.error(
          "❌ ZANJOUBA SEND ERROR:",
          err
        );

        return;
      }

      registerReply(
        info,
        event
      );

    },

    event.messageID

  );
}

// ==================================================
// RUN
// ==================================================

module.exports.run =
async function ({
  api,
  event,
  args
}) {

  const {
    threadID,
    messageID,
    senderID,
    mentions = {}
  } = event;

  const prompt =
    Array.isArray(args)
      ? args.join(" ").trim()
      : "";

  if (!prompt) {

    return api.sendMessage(
      "🐿️ شنوة تستنى؟ اكتب سؤالك برك •-• 🌰",
      threadID,
      messageID
    );

  }

  // ==================================================
  // 🐿️ التفاعل
  // ==================================================

  reactSquirrel(
    api,
    messageID
  );

  // ==================================================
  // حفظ الاسم
  // ==================================================

  const nameMatch =
    prompt.match(
      /(?:اسمي|انا|أنا|ادعى|أدعى|اسمى)\s+(.+)/i
    );

  if (nameMatch) {

    global.usersNames.set(
      String(senderID),
      nameMatch[1].trim()
    );

  }

  // ==================================================
  // أوامر المطور
  // ==================================================

  if (
    String(senderID) ===
    ADMIN_ID
  ) {

    if (
      /اطرد|طرد/i.test(prompt) &&
      Object.keys(mentions).length
    ) {

      const targetID =
        Object.keys(
          mentions
        )[0];

      try {

        await api.removeUserFromGroup(
          targetID,
          threadID
        );

        return api.sendMessage(
          "🐿️ تم التنفيذ يا أبو هريرة 👑",
          threadID,
          messageID
        );

      } catch (error) {

        return api.sendMessage(
          "🐿️ ما عنديش الصلاحية يا أبو هريرة •-•",
          threadID,
          messageID
        );

      }

    }

  }

  // ==================================================
  // جلسة المجموعة
  // ==================================================

  const conversationKey =
    `group_${String(
      threadID
    )}`;

  try {

    const answer =
      await generateReply(
        prompt,
        conversationKey,
        String(senderID)
      );

    return sendZanjoobaReply(
      api,
      event,
      answer
    );

  } catch (error) {

    return sendGroqError(
      api,
      event,
      error
    );

  }

};

// ==================================================
// HANDLE REPLY
// ==================================================

module.exports.handleReply =
async function ({
  api,
  event,
  handleReply
}) {

  const {
    threadID,
    messageID,
    senderID,
    body
  } = event;

  // ==================================================
  // التحقق من المجموعة
  // ==================================================

  if (
    handleReply.threadID &&
    String(
      handleReply.threadID
    ) !==
      String(threadID)
  ) {

    return api.sendMessage(
      "🐿️ هذي جلسة متاع مجموعة أخرى •-• 🌰",
      threadID,
      messageID
    );

  }

  if (
    !body ||
    !body.trim()
  ) {

    return;

  }

  // ==================================================
  // 🐿️ التفاعل
  // ==================================================

  reactSquirrel(
    api,
    messageID
  );

  // ==================================================
  // حفظ الاسم
  // ==================================================

  const nameMatch =
    body.trim().match(
      /(?:اسمي|انا|أنا|ادعى|أدعى|اسمى)\s+(.+)/i
    );

  if (nameMatch) {

    global.usersNames.set(
      String(senderID),
      nameMatch[1].trim()
    );

  }

  // ==================================================
  // جلسة المجموعة
  // ==================================================

  const conversationKey =
    handleReply.conversationKey ||
    `group_${String(
      threadID
    )}`;

  try {

    const answer =
      await generateReply(
        body.trim(),
        conversationKey,
        String(senderID)
      );

    return sendZanjoobaReply(
      api,
      event,
      answer
    );

  } catch (error) {

    return sendGroqError(
      api,
      event,
      error
    );

  }

};