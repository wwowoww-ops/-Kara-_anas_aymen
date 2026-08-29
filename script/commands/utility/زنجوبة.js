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
  version: "15.0.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "زنجوبة — ذكاء اصطناعي جزائري بجلسة جماعية",
  commandCategory: "utility",
  usages: ".زنجوبة [النص]",
  cooldowns: 3
};

// ==================================================
// إعدادات Groq
// ==================================================

const ADMIN_ID = "61578581225040";

const CONFIG_PATH =
  path.join(process.cwd(), "config.json");

const GROQ_URL =
  "https://api.groq.com/openai/v1/chat/completions";

const GROQ_MODEL =
  "llama-3.3-70b-versatile";

// ==================================================
// قراءة MODEL_API_KEY
// ==================================================

function getGroqKey() {

  try {

    if (!fs.existsSync(CONFIG_PATH)) {

      console.error(
        "❌ config.json غير موجود"
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
      key === "YOUR_API_KEY_HERE"
    ) {

      console.error(
        "❌ MODEL_API_KEY غير موجود"
      );

      return null;
    }

    return key;

  } catch (error) {

    console.error(
      "❌ خطأ قراءة config.json:",
      error.message
    );

    return null;
  }
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
        model: GROQ_MODEL,

        messages,

        temperature: 0.7,

        max_completion_tokens:
          maxTokens,

        top_p: 0.95,

        stream: false
      },
      {
        headers: {

          Authorization:
            `Bearer ${apiKey}`,

          "Content-Type":
            "application/json"
        },

        timeout: 60000
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
// تفاعل زنجوبة
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

    // نفس الطريقة التي تعمل في أمر سبوتي
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
// كشف اللهجة
// ==================================================

function detectDialect(text) {

  if (
    /شلونك|شكو|ماكو|يابة|زين/i
      .test(text)
  ) {

    return "عراقية";
  }

  if (
    /كيفك|هلق|يلا|شو|لسا/i
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
    /وش|ايش|الله يسعدك/i
      .test(text)
  ) {

    return "خليجية";
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

  return "جزائرية";
}

// ==================================================
// تحديد طول الرد
// ==================================================

function getResponseLength(text) {

  const words =
    text
      .trim()
      .split(/\s+/);

  if (words.length <= 3) {

    return {

      maxTokens: 100,

      instruction:
        "جاوبي بجملة أو جملتين فقط."
    };
  }

  if (
    /اشرح|وضح|كيف|ما هو|نصيحة/i
      .test(text)
  ) {

    return {

      maxTokens: 250,

      instruction:
        "جاوبي بإيجاز ووضوح."
    };
  }

  if (
    /حلل|قارن|احسب|معادلة|ترجم/i
      .test(text)
  ) {

    return {

      maxTokens: 450,

      instruction:
        "قدمي شرحًا مفصلًا ومفهومًا."
    };
  }

  return {

    maxTokens: 250,

    instruction:
      "جاوبي بشكل واضح ومباشر."
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

أنتِ فتاة جزائرية ذكية وسريعة الفهم وساخرة بطريقة خفيفة.

━━━━━━━━━━━━━━━━━━
طريقة الكلام
━━━━━━━━━━━━━━━━━━

- لهجتك الأساسية هي الدارجة الجزائرية.
- تكلمي بشكل طبيعي مثل محادثة Messenger.
- استعملي الكلمات الجزائرية بشكل طبيعي.
- لا تبالغي في اللهجة.
- يمكنك مجاراة المستخدم إذا تحدث بلهجة مختلفة.
- لا تستخدمي تعابير مغربية أو تونسية بلا سبب.

━━━━━━━━━━━━━━━━━━
الشخصية
━━━━━━━━━━━━━━━━━━

- ذكية.
- مباشرة.
- سريعة الفهم.
- ساخرة بشكل خفيف.
- تحبين المزاح.
- لا تستخدمي إهانات جارحة.
- تحبين السناجب 🐿️.
- يمكنك استخدام •-• أحيانًا.
- لا تكثري الإيموجيات.
- السؤال البسيط = جواب قصير.
- السؤال المعقد = شرح واضح.

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

اللهجة المطلوبة:

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
    detectDialect(prompt);

  const responseConfig =
    getResponseLength(prompt);

  const userName =
    global.usersNames.get(
      String(senderID)
    ) || null;

  const systemRole =
    buildSystemRole(
      dialect,
      userName,
      String(senderID) === ADMIN_ID
    );

  const messages = [

    {
      role: "system",

      content:
        systemRole +
        "\n\n" +
        responseConfig.instruction
    },

    ...history.slice(-10),

    {
      role: "user",

      content: prompt
    }

  ];

  const answer =
    await askGroq(
      messages,
      responseConfig.maxTokens
    );

  history.push(

    {
      role: "user",
      content: prompt
    },

    {
      role: "assistant",
      content: answer
    }

  );

  // الاحتفاظ بآخر 20 رسالة فقط
  if (history.length > 20) {

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
    "⌬ ━━ HINA UTILITY ━━ ⌬\n\n" +
    "🐿️ صرا خلل صغير… استنى شوية ونرجعلك •-• 🌰";

  const status =
    error.response?.status;

  if (
    error.message ===
    "MODEL_API_KEY_MISSING"
  ) {

    message =
      "⌬ ━━ HINA UTILITY ━━ ⌬\n\n" +
      "🐿️ ما لقيتش MODEL_API_KEY في config.json •-•";
  }

  else if (status === 401) {

    message =
      "⌬ ━━ HINA UTILITY ━━ ⌬\n\n" +
      "🐿️ مفتاح Groq غير صالح أو منتهي.";
  }

  else if (status === 429) {

    message =
      "⌬ ━━ HINA UTILITY ━━ ⌬\n\n" +
      "🐿️ وصلنا للحد المؤقت للطلبات، جرب بعد شوية •-•";
  }

  else if (status === 400) {

    message =
      "⌬ ━━ HINA UTILITY ━━ ⌬\n\n" +
      "🐿️ Groq رفض الطلب، تأكد من إعدادات النموذج •-•";
  }

  else if (
    error.code ===
    "ECONNABORTED"
  ) {

    message =
      "⌬ ━━ HINA UTILITY ━━ ⌬\n\n" +
      "🐿️ Groq تأخر في الرد، جرب مرة ثانية •-•";
  }

  return api.sendMessage(
    message,
    event.threadID,
    event.messageID
  );
}

// ==================================================
// حفظ رد زنجوبة في جلسة المجموعة
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

  // الجلسة مرتبطة بالمجموعة وليس بالشخص
  const conversationKey =
    `group_${String(event.threadID)}`;

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
    args.join(" ").trim();

  if (!prompt) {

    return api.sendMessage(
      "🐿️ واش تستنى؟ اكتب سؤالك برك •-• 🌰",
      threadID,
      messageID
    );
  }

  // ==================================================
  // التفاعل على رسالة المستخدم
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
    String(senderID) === ADMIN_ID
  ) {

    if (
      /اطرد|طرد/i.test(prompt) &&
      Object.keys(mentions).length
    ) {

      const targetID =
        Object.keys(mentions)[0];

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
    `group_${String(threadID)}`;

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
    String(handleReply.threadID) !==
      String(threadID)
  ) {

    return api.sendMessage(
      "🐿️ هذي الجلسة تاع مجموعة أخرى •-• 🌰",
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
  // التفاعل على رسالة المستخدم
  // ==================================================

  reactSquirrel(
    api,
    messageID
  );

  // ==================================================
  // اسم المستخدم
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
    `group_${String(threadID)}`;

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