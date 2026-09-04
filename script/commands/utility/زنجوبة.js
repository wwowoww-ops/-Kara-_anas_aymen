const axios = require("axios");
const fs = require("fs");
const path = require("path");

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
  version: "17.0.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "زنجوبة — ذكاء اصطناعي تونسي بجلسة جماعية",
  commandCategory: "utility",
  usages: ".زنجوبة [النص]",
  cooldowns: 3
};

// ==================================================
// Gemini
// ==================================================

const ADMIN_ID = "61578581225040";

const CONFIG_PATH = path.join(
  process.cwd(),
  "config.json"
);

// ==================================================
// إعدادات Gemini
// ==================================================

const GEMINI_MODEL =
  "gemini-3-flash-preview";

const GEMINI_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// ==================================================
// قراءة مفتاح Gemini من config.json
// ==================================================

function getGeminiKey() {

  try {

    if (!fs.existsSync(CONFIG_PATH)) {

      console.error(
        "❌ config.json غير موجود."
      );

      return null;

    }

    const config =
      JSON.parse(
        fs.readFileSync(
          CONFIG_PATH,
          "utf8"
        )
      );

    const key =
      String(
        config.MODEL_API_KEY || ""
      ).trim();

    if (
      !key ||
      key === "PUT_YOUR_GEMINI_API_KEY_HERE" ||
      key === "PUT_YOUR_GROQ_API_KEY_HERE" ||
      key === "ضع_مفتاح_Gemini_هنا" ||
      key === "ضع_مفتاح_Groq_هنا"
    ) {

      console.error(
        "❌ لم يتم وضع مفتاح Gemini داخل config.json."
      );

      return null;

    }

    return key;

  } catch (error) {

    console.error(
      "❌ خطأ في قراءة config.json:",
      error.message
    );

    return null;

  }

}

// ==================================================
// تحويل رسائل النظام القديم إلى صيغة Gemini
// ==================================================

function convertHistoryToGemini(messages) {

  const contents = [];

  for (const message of messages) {

    if (!message || !message.content)
      continue;

    const role =
      message.role === "assistant"
        ? "model"
        : "user";

    contents.push({

      role,

      parts: [
        {
          text:
            String(
              message.content
            )
        }
      ]

    });

  }

  return contents;

}

// ==================================================
// طلب Gemini
// ==================================================

async function askGemini(
  messages,
  maxTokens
) {

  const apiKey =
    getGeminiKey();

  if (!apiKey) {

    throw new Error(
      "MODEL_API_KEY_MISSING"
    );

  }

  const systemMessage =
    messages.find(
      message =>
        message &&
        message.role === "system"
    );

  const normalMessages =
    messages.filter(
      message =>
        message &&
        message.role !== "system"
    );

  const contents =
    convertHistoryToGemini(
      normalMessages
    );

  const body = {

    contents,

    generationConfig: {

      temperature: 0.7,

      topP: 0.95,

      maxOutputTokens:
        maxTokens

    }

  };

  if (systemMessage) {

    body.systemInstruction = {

      parts: [
        {
          text:
            String(
              systemMessage.content
            )
        }
      ]

    };

  }

  const response =
    await axios.post(
      GEMINI_URL,
      body,
      {

        headers: {

          "x-goog-api-key":
            apiKey,

          "Content-Type":
            "application/json"

        },

        timeout:
          60000

      }
    );

  const candidates =
    response
      ?.data
      ?.candidates;

  if (
    !Array.isArray(candidates) ||
    !candidates.length
  ) {

    throw new Error(
      "EMPTY_GEMINI_RESPONSE"
    );

  }

  const parts =
    candidates[0]
      ?.content
      ?.parts;

  if (
    !Array.isArray(parts)
  ) {

    throw new Error(
      "EMPTY_GEMINI_RESPONSE"
    );

  }

  const answer =
    parts
      .filter(
        part =>
          part &&
          typeof part.text ===
            "string"
      )
      .map(
        part =>
          part.text
      )
      .join("")
      .trim();

  if (!answer) {

    throw new Error(
      "EMPTY_GEMINI_RESPONSE"
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
    /شنوة|شنيا|شبيك|كيفاش|علاش|وينك|وين|برشا|باهي|توا|تو|مانيش|موش|نحب|تحب|نمشي|ياخي|هاو|هاني|راهو|راهي|خاطر|خاطرش|زعمة|يزي|يعطيك الصحة|صحيت|فما|ما فماش|قداش|شنية|هكا/i
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
فما
ما فماش
قداش

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
    await askGemini(
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
// إرسال خطأ Gemini
// ==================================================

function sendGeminiError(
  api,
  event,
  error
) {

  console.error(
    "❌ ZANJOUBA GEMINI ERROR:",
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
      "🐿️ حط مفتاح Gemini في config.json أولًا •-•";

  }

  else if (
    status === 400
  ) {

    message =
      "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗨𝗧𝗜𝗟𝗜𝗧𝗬 ━━ ⌬\n\n" +
      "🐿️ Gemini رفض الطلب، ثبّت إعدادات النموذج •-•";

  }

  else if (
    status === 401 ||
    status === 403
  ) {

    message =
      "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗨𝗧𝗜𝗟𝗜𝗧𝗬 ━━ ⌬\n\n" +
      "🐿️ مفتاح Gemini موش صالح أو ما عندوش الصلاحية اللازمة.";

  }

  else if (
    status === 429
  ) {

    message =
      "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗨𝗧𝗜𝗟𝗜𝗧𝗬 ━━ ⌬\n\n" +
      "🐿️ وصلنا للحد المؤقت متاع Gemini، جرب بعد شوية •-•";

  }

  else if (
    error.code ===
    "ECONNABORTED"
  ) {

    message =
      "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗨𝗧𝗜𝗟𝗜𝗧𝗬 ━━ ⌬\n\n" +
      "🐿️ Gemini تأخر في الرد، عاود جرب •-•";

  }

  else if (
    error.message ===
    "EMPTY_GEMINI_RESPONSE"
  ) {

    message =
      "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗨𝗧𝗜𝗟𝗜𝗧𝗬 ━━ ⌬\n\n" +
      "🐿️ Gemini ما رجعش إجابة هالمرة، عاود جرب •-•";

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

    return sendGeminiError(
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

    return sendGeminiError(
      api,
      event,
      error
    );

  }

};