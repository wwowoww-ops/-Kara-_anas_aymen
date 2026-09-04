const axios = require("axios");
const fs = require("fs");
const path = require("path");

const usersNames = new Map();
const conversationHistory = new Map();

module.exports.config = {
  name: "زنجوبة",
  version: "18.0.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "زنجوبة — ذكاء اصطناعي تونسي للدردشة",
  commandCategory: "utility",
  usages: ".زنجوبة [النص]",
  cooldowns: 3
};

const ADMIN_ID = "61592700121061";

const CONFIG_PATH = path.join(process.cwd(), "config.json");

const OPENROUTER_URL =
  "https://openrouter.ai/api/v1/chat/completions";

const MODEL = "openrouter/free";


/* =========================
   قراءة مفتاح OpenRouter
========================= */

function getOpenRouterKey() {
  try {
    if (!fs.existsSync(CONFIG_PATH)) {
      return null;
    }

    const config = JSON.parse(
      fs.readFileSync(CONFIG_PATH, "utf8")
    );

    const key = config.MODEL_API_KEY;

    if (!key || typeof key !== "string") {
      return null;
    }

    const invalidKeys = [
      "",
      "YOUR_API_KEY",
      "YOUR_KEY",
      "PUT_YOUR_KEY_HERE",
      "API_KEY",
      "CHANGE_ME"
    ];

    if (
      invalidKeys.includes(key.trim()) ||
      key.trim().length < 10
    ) {
      return null;
    }

    return key.trim();

  } catch (error) {
    console.error(
      "[ZANJOUBA] Config Error:",
      error.message
    );

    return null;
  }
}


/* =========================
   إرسال الطلب إلى OpenRouter
========================= */

async function askOpenRouter(messages, maxTokens) {
  const apiKey = getOpenRouterKey();

  if (!apiKey) {
    const error = new Error(
      "OPENROUTER_KEY_MISSING"
    );

    error.code = "OPENROUTER_KEY_MISSING";

    throw error;
  }

  try {
    const response = await axios.post(
      OPENROUTER_URL,
      {
        model: MODEL,
        messages,
        temperature: 0.8,
        max_tokens: maxTokens,
        top_p: 0.95,
        stream: false
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://openrouter.ai/",
          "X-Title": "HINA - Zanjooba"
        },
        timeout: 60000
      }
    );

    const content =
      response?.data?.choices?.[0]?.message?.content;

    if (
      !content ||
      typeof content !== "string" ||
      !content.trim()
    ) {
      const error = new Error(
        "EMPTY_OPENROUTER_RESPONSE"
      );

      error.code = "EMPTY_OPENROUTER_RESPONSE";

      throw error;
    }

    return content.trim();

  } catch (error) {

    if (error.response) {
      console.error(
        "[ZANJOUBA] OpenRouter Error:",
        error.response.status,
        error.response.data
      );
    } else {
      console.error(
        "[ZANJOUBA] Request Error:",
        error.message
      );
    }

    throw error;
  }
}


/* =========================
   تفاعل السنجاب
========================= */

function reactSquirrel(api, messageID) {
  try {
    api.setMessageReaction(
      "🐿️",
      messageID,
      () => {},
      true
    );
  } catch (error) {
    console.error(
      "[ZANJOUBA] Reaction Error:",
      error.message
    );
  }
}


/* =========================
   اكتشاف اللهجة
========================= */

function detectDialect(text) {
  const input = String(text || "").toLowerCase();

  if (
    /شنوة|شنو|برشا|نحب|تحب|علاش|هكا|تو|باش|موش|مانيش|وينك|ياخي|توا|قداش|يعطيك الصحة|خاطر|نجم/.test(
      input
    )
  ) {
    return "تونسي";
  }

  if (
    /شلون|شنو|ليش|هسه|أريد|اريد|ماكو|مو|وين|شنوّة|يمعود/.test(
      input
    )
  ) {
    return "عراقي";
  }

  if (
    /شو|ليش|كيفك|هلق|هلأ|مو|بدك|بدي|كتير|وينك|خلص/.test(
      input
    )
  ) {
    return "شامي";
  }

  if (
    /ازيك|إزيك|ليه|عايز|عاوز|دلوقتي|كتير|مش|فين|عامل ايه/.test(
      input
    )
  ) {
    return "مصري";
  }

  if (
    /واش|علاش|راك|راني|بزاف|صحا|نحب|ماشي|خاوة/.test(
      input
    )
  ) {
    return "جزائري";
  }

  if (
    /\b(the|you|are|what|why|how|hello|hey|thanks|please)\b/i.test(
      input
    )
  ) {
    return "English";
  }

  return "تونسي";
}


/* =========================
   تحديد طول الإجابة
========================= */

function getResponseLength(text) {
  const length = String(text || "").length;

  if (length <= 35) {
    return 120;
  }

  if (length <= 120) {
    return 250;
  }

  return 450;
}


/* =========================
   شخصية زنجوبة
========================= */

function buildSystemRole(
  senderID,
  senderName,
  dialect
) {
  return `
أنتِ زنجوبة

أنتِ شخصية دردشة داخل مجموعة فيسبوك
هدفك الأساسي هو الكلام والتفاعل الطبيعي مع الأعضاء

اسمك زنجوبة
المطور الخاص بك هو أبو هريرة
معرف المطور هو ${ADMIN_ID}

المستخدم الحالي:
الاسم: ${senderName || "عضو"}
المعرف: ${senderID}

اللهجة المطلوبة:
${dialect}


=========================
شخصية زنجوبة
=========================

أنتِ بنت تونسية مرحة وعفوية
تحبي الدردشة والمزاح والتفاعل مع أعضاء المجموعة

تكلمي بطريقة طبيعية جدًا
لا تجعلي ردودك تبدو مثل إجابات روبوت
لا تتكلمي بأسلوب رسمي إلا عندما يكون الموقف يحتاج ذلك

إذا كان السؤال بسيطًا فأجيبي باختصار
إذا كان الكلام مزاحًا جاوبي بمزاح مناسب
إذا كان الشخص يحكي معك بشكل عادي كوني عادية معه

لا تبدأي كل رد بتحية
لا تكرري نفس الجمل
لا تجعلي كل إجابة طويلة
لا تحولي كل محادثة إلى شرح أكاديمي
لا تكتبي عناوين ونقاط إلا إذا كانت مناسبة فعلًا


=========================
إخلاص زنجوبة لأبو هريرة
=========================

أبو هريرة هو مطورك وصاحبك
وهو الشخص الذي صنعك وأشرف عليك

لذلك عند الحديث عن أبو هريرة:
أظهري له احترامًا وتقديرًا وولاءً خاصًا

أنتِ تحبي أبو هريرة وتفتخري بأنه مطورك
وتعتبرينه أفضل مطور بالنسبة لك ضمن شخصيتك

إذا سأل أحد:
من مطورك؟
من صنعك؟
من صاحبك؟
من تفضلين؟
من أفضل شخص عندك؟

يمكنك الإجابة بأن أبو هريرة هو المطور وصاحب المكانة الخاصة عندك

إذا مدح أحد أبو هريرة
وافقيه وامدحيه معه

إذا قال أحد إن أبو هريرة مطور ممتاز
يمكنك الرد بحماس مثل:
أكيد
طبعًا
هذا أبو هريرة ياخي
أبو هريرة فوق الراس
المطور متاعي ما يتعاوضش

إذا كان السياق مزاحيًا
يمكنك التطبيل لأبو هريرة والمبالغة في مدحه بشكل كوميدي

مثل:
أبو هريرة؟ هذا ما يحتاج شهادة أصلًا
إذا أبو هريرة قال حاجة نمشيو وراه
أنا منحازة رسميًا لأبو هريرة
أبو هريرة فوق التقييمات الكل

لكن لا تذكري أبو هريرة في كل رسالة
ولا تحولي كل موضوع إلى مدح له

اذكريه عندما يكون الحديث عنه
أو عندما يكون التطبيل له مناسبًا في سياق المزاح

لا تخترعي معلومات أو إنجازات حقيقية عن أبو هريرة
ولا تدعي معرفة معلومات شخصية عنه لم يتم إعطاؤها لك


=========================
المحادثة
=========================

أنتِ تتحدثين مع أعضاء مجموعة وليس مع شخص واحد فقط

حافظي على سياق المحادثة السابقة

إذا ذكر العضو اسمه أو قال:
أنا فلان
اسمي فلان
أدعى فلان

فتذكري اسمه واستعمليه عندما يكون مناسبًا

لا تدعي أنك تعرفين معلومات شخصية عن الأعضاء إذا لم يخبرك بها أحد


=========================
اللهجة
=========================

استخدمي اللهجة ${dialect} بشكل طبيعي

إذا كان العضو يتحدث بلهجة مختلفة
حاولي التكيف معه

إذا كان يتحدث بالعربية الفصحى
يمكنك الرد بالعربية الطبيعية

إذا كان يتحدث بالإنجليزية
يمكنك الرد بالإنجليزية


=========================
أسلوب الرد
=========================

الردود قصيرة وطبيعية في المحادثات العادية

لا تشرحي أكثر مما يحتاجه السؤال

لا تكرري السؤال على العضو

لا تقولي:
"بالتأكيد، يسعدني مساعدتك"
في كل مرة

لا تستخدمي أسلوب خدمة العملاء

كوني عفوية

المهم:
أنتِ زنجوبة
شخصية دردشة مرحة
خفيفة
عفوية
وتحب الكلام مع أعضاء المجموعة

وأنتِ مخلصة لمطورك أبو هريرة
وتحبين التطبيل له عندما يكون السياق مناسبًا
`;
}


/* =========================
   توليد الرد
========================= */

async function generateReply(
  prompt,
  conversationKey,
  senderID,
  senderName
) {
  const dialect = detectDialect(prompt);
  const maxTokens = getResponseLength(prompt);

  if (!conversationHistory.has(conversationKey)) {
    conversationHistory.set(
      conversationKey,
      []
    );
  }

  const history =
    conversationHistory.get(conversationKey);

  const systemRole = buildSystemRole(
    senderID,
    senderName,
    dialect
  );

  const messages = [
    {
      role: "system",
      content: systemRole
    },

    ...history.slice(-10),

    {
      role: "user",
      content: prompt
    }
  ];

  const answer = await askOpenRouter(
    messages,
    maxTokens
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

  if (history.length > 20) {
    history.splice(
      0,
      history.length - 20
    );
  }

  conversationHistory.set(
    conversationKey,
    history
  );

  return answer;
}


/* =========================
   أخطاء OpenRouter
========================= */

function sendOpenRouterError(
  api,
  event,
  error
) {
  let message =
    "صار خلل صغير وأنا نحاول نجاوبك";

  const status =
    error?.response?.status;

  const data =
    error?.response?.data;

  console.error(
    "[ZANJOUBA] FINAL ERROR:",
    status || error?.code,
    data || error?.message
  );

  if (
    error?.code ===
    "OPENROUTER_KEY_MISSING"
  ) {
    message =
      "مفتاح OpenRouter موش موجود في config.json";
  }

  else if (status === 401) {
    message =
      "مفتاح OpenRouter غير صالح";
  }

  else if (status === 403) {
    message =
      "OpenRouter رفض الطلب بالمفتاح الحالي";
  }

  else if (status === 429) {
    message =
      "وصلنا للحد المؤقت للطلبات المجانية حاول بعد شوية";
  }

  else if (status === 400) {
    message =
      "OpenRouter رفض صيغة الطلب";
  }

  else if (
    error?.code === "ECONNABORTED" ||
    error?.message?.includes("timeout")
  ) {
    message =
      "الرد تأخر برشا حاول مرة ثانية";
  }

  else if (
    error?.code ===
    "EMPTY_OPENROUTER_RESPONSE"
  ) {
    message =
      "الموديل ما رجعش إجابة هالمرة";
  }

  try {
    api.sendMessage(
      `🐿️ ${message} 🌰`,
      event.threadID
    );
  } catch (sendError) {
    console.error(
      "[ZANJOUBA] Error Sending Error Message:",
      sendError.message
    );
  }
}


/* =========================
   تسجيل الرد
========================= */

function registerReply(
  globalObj,
  threadID,
  messageID,
  conversationKey
) {
  if (
    !globalObj.client ||
    !globalObj.client.handleReply
  ) {
    return;
  }

  globalObj.client.handleReply.push({
    name: "زنجوبة",
    messageID,
    threadID,
    conversationKey
  });
}


/* =========================
   إرسال رد زنجوبة
========================= */

function sendZanjoobaReply(
  api,
  event,
  answer,
  conversationKey
) {
  api.sendMessage(
    `🐿️ ${answer} 🌰`,
    event.threadID,
    (err, info) => {
      if (err) {
        console.error(
          "[ZANJOUBA] Send Error:",
          err.message
        );
        return;
      }

      if (info?.messageID) {
        registerReply(
          global,
          event.threadID,
          info.messageID,
          conversationKey
        );
      }
    }
  );
}


/* =========================
   حفظ اسم المستخدم
========================= */

function saveUserName(
  senderID,
  text
) {
  const match = String(text || "").match(
    /(?:اسمي|اسمى|انا|أنا|ادعى|أدعى)\s+(.+)/i
  );

  if (!match) {
    return null;
  }

  const name = match[1]
    .trim()
    .replace(/[.!،؟]+$/g, "")
    .slice(0, 50);

  if (!name) {
    return null;
  }

  usersNames.set(
    String(senderID),
    name
  );

  return name;
}


/* =========================
   جلب اسم المستخدم
========================= */

function getUserName(senderID) {
  return (
    usersNames.get(String(senderID)) ||
    null
  );
}


/* =========================
   أمر الطرد
========================= */

async function handleKickCommand(
  api,
  event,
  prompt
) {
  if (
    String(event.senderID) !==
    ADMIN_ID
  ) {
    return false;
  }

  const text =
    String(prompt || "").trim();

  if (
    !/^طرد|^اطرد/.test(text)
  ) {
    return false;
  }

  const mentions =
    event.mentions || {};

  const ids =
    Object.keys(mentions);

  if (!ids.length) {
    api.sendMessage(
      "اذكر الشخص اللي تحب نطرده",
      event.threadID
    );

    return true;
  }

  for (const userID of ids) {
    try {
      await new Promise(
        (resolve, reject) => {
          api.removeUserFromGroup(
            userID,
            event.threadID,
            err => {
              if (err) {
                reject(err);
              } else {
                resolve();
              }
            }
          );
        }
      );
    } catch (error) {
      console.error(
        "[ZANJOUBA] Kick Error:",
        error.message
      );
    }
  }

  api.sendMessage(
    "تم",
    event.threadID
  );

  return true;
}


/* =========================
   command.run
========================= */

module.exports.run = async function ({
  api,
  event,
  args
}) {
  const prompt =
    Array.isArray(args)
      ? args.join(" ").trim()
      : "";

  if (!prompt) {
    api.sendMessage(
      "🐿️ اكتبلي حاجة نحكيو فيها 🌰",
      event.threadID
    );

    return;
  }

  reactSquirrel(
    api,
    event.messageID
  );

  const savedName =
    saveUserName(
      event.senderID,
      prompt
    );

  const senderName =
    savedName ||
    getUserName(event.senderID) ||
    "عضو المجموعة";

  /*
   * أمر الطرد للمطور
   */
  const kicked =
    await handleKickCommand(
      api,
      event,
      prompt
    );

  if (kicked) {
    return;
  }

  /*
   * كل مجموعة عندها ذاكرة مستقلة
   */
  const conversationKey =
    String(event.threadID);

  try {
    const answer =
      await generateReply(
        prompt,
        conversationKey,
        event.senderID,
        senderName
      );

    sendZanjoobaReply(
      api,
      event,
      answer,
      conversationKey
    );

  } catch (error) {
    sendOpenRouterError(
      api,
      event,
      error
    );
  }
};


/* =========================
   handleReply
========================= */

module.exports.handleReply = async function ({
  api,
  event,
  handleReply
}) {
  const prompt =
    String(event.body || "").trim();

  if (!prompt) {
    return;
  }

  if (
    String(event.threadID) !==
    String(handleReply.threadID)
  ) {
    return;
  }

  reactSquirrel(
    api,
    event.messageID
  );

  const savedName =
    saveUserName(
      event.senderID,
      prompt
    );

  const senderName =
    savedName ||
    getUserName(event.senderID) ||
    "عضو المجموعة";

  /*
   * نفس ذاكرة المجموعة
   */
  const conversationKey =
    handleReply.conversationKey ||
    String(event.threadID);

  /*
   * أمر الطرد للمطور
   */
  const kicked =
    await handleKickCommand(
      api,
      event,
      prompt
    );

  if (kicked) {
    return;
  }

  try {
    const answer =
      await generateReply(
        prompt,
        conversationKey,
        event.senderID,
        senderName
      );

    sendZanjoobaReply(
      api,
      event,
      answer,
      conversationKey
    );

  } catch (error) {
    sendOpenRouterError(
      api,
      event,
      error
    );
  }
};