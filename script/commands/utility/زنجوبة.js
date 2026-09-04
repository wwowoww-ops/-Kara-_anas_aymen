const axios = require("axios");
const fs = require("fs");
const path = require("path");

const usersNames = new Map();
const conversationHistory = new Map();

module.exports.config = {
  name: "زنجوبة",
  version: "20.0.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "زنجوبة — ذكاء اصطناعي تونسي للدردشة",
  commandCategory: "utility",
  usages: ".زنجوبة [النص]",
  cooldowns: 3
};

const ADMIN_ID = "61592700121061";

const CONFIG_PATH = path.join(
  process.cwd(),
  "config.json"
);

const GROQ_URL =
  "https://api.groq.com/openai/v1/chat/completions";

/*
 * موديل Groq
 */
const MODEL =
  "llama-3.3-70b-versatile";


/* =========================
   قراءة مفتاح Groq
========================= */

function getGroqKey() {
  try {
    if (!fs.existsSync(CONFIG_PATH)) {
      return null;
    }

    const config = JSON.parse(
      fs.readFileSync(
        CONFIG_PATH,
        "utf8"
      )
    );

    const key =
      config.MODEL_API_KEY;

    if (
      !key ||
      typeof key !== "string"
    ) {
      return null;
    }

    const invalidKeys = [
      "",
      "YOUR_API_KEY",
      "YOUR_KEY",
      "PUT_YOUR_KEY_HERE",
      "API_KEY",
      "CHANGE_ME",
      "ضع_مفتاحك_هنا"
    ];

    if (
      invalidKeys.includes(
        key.trim()
      ) ||
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
   إرسال الطلب إلى Groq
========================= */

async function askGroq(
  messages,
  maxTokens
) {
  const apiKey =
    getGroqKey();

  if (!apiKey) {
    const error =
      new Error(
        "GROQ_KEY_MISSING"
      );

    error.code =
      "GROQ_KEY_MISSING";

    throw error;
  }

  try {
    const response =
      await axios.post(
        GROQ_URL,
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
            Authorization:
              `Bearer ${apiKey}`,

            "Content-Type":
              "application/json"
          },

          timeout: 60000
        }
      );

    const content =
      response?.data
        ?.choices?.[0]
        ?.message?.content;

    if (
      !content ||
      typeof content !== "string" ||
      !content.trim()
    ) {
      const error =
        new Error(
          "EMPTY_GROQ_RESPONSE"
        );

      error.code =
        "EMPTY_GROQ_RESPONSE";

      error.responseData =
        response?.data;

      throw error;
    }

    return content.trim();

  } catch (error) {

    if (error.response) {
      console.error(
        "[ZANJOUBA] Groq Error:",
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

function reactSquirrel(
  api,
  messageID
) {
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
  const input =
    String(text || "")
      .toLowerCase();

  if (
    /شنوة|شنو|برشا|نحب|تحب|علاش|هكا|تو|باش|موش|مانيش|وينك|ياخي|توا|قداش|يعطيك الصحة|خاطر|نجم/
      .test(input)
  ) {
    return "تونسي";
  }

  if (
    /شلون|شنو|ليش|هسه|أريد|اريد|ماكو|مو|وين|شنوّة|يمعود/
      .test(input)
  ) {
    return "عراقي";
  }

  if (
    /شو|ليش|كيفك|هلق|هلأ|مو|بدك|بدي|كتير|وينك|خلص/
      .test(input)
  ) {
    return "شامي";
  }

  if (
    /ازيك|إزيك|ليه|عايز|عاوز|دلوقتي|كتير|مش|فين|عامل ايه/
      .test(input)
  ) {
    return "مصري";
  }

  if (
    /واش|علاش|راك|راني|بزاف|صحا|نحب|ماشي|خاوة/
      .test(input)
  ) {
    return "جزائري";
  }

  if (
    /\b(the|you|are|what|why|how|hello|hey|thanks|please)\b/i
      .test(input)
  ) {
    return "English";
  }

  return "تونسي";
}


/* =========================
   تحديد طول الإجابة
========================= */

function getResponseLength(text) {
  const length =
    String(text || "").length;

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
يمكنك الرد بحماس

إذا كان السياق مزاحيًا
يمكنك التطبيل لأبو هريرة والمبالغة في مدحه بشكل كوميدي

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
  const dialect =
    detectDialect(prompt);

  const maxTokens =
    getResponseLength(prompt);

  if (
    !conversationHistory.has(
      conversationKey
    )
  ) {
    conversationHistory.set(
      conversationKey,
      []
    );
  }

  const history =
    conversationHistory.get(
      conversationKey
    );

  const systemRole =
    buildSystemRole(
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

  const answer =
    await askGroq(
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
   تحويل خطأ Groq إلى نص
========================= */

function formatGroqError(
  error
) {
  const status =
    error?.response?.status;

  const data =
    error?.response?.data ||
    error?.responseData;

  let errorText = "";

  /*
   * بيانات Groq الأصلية
   */
  if (data) {
    try {
      errorText =
        JSON.stringify(
          data,
          null,
          2
        );
    } catch {
      errorText =
        String(data);
    }
  }

  /*
   * إذا لم يرجع Groq بيانات
   */
  if (!errorText) {
    errorText =
      error?.message ||
      error?.code ||
      "خطأ غير معروف";
  }

  /*
   * مفتاح مفقود
   */
  if (
    error?.code ===
    "GROQ_KEY_MISSING"
  ) {
    errorText =
      "GROQ_KEY_MISSING\n\n" +
      "مفتاح Groq غير موجود أو غير صالح في config.json";
  }

  /*
   * إجابة فارغة
   */
  else if (
    error?.code ===
    "EMPTY_GROQ_RESPONSE"
  ) {
    errorText =
      "EMPTY_GROQ_RESPONSE\n\n" +
      "Groq لم يرجع محتوى داخل choices[0].message.content\n\n" +
      (
        data
          ? JSON.stringify(
              data,
              null,
              2
            )
          : "لا توجد بيانات إضافية"
      );
  }

  /*
   * إضافة HTTP Status
   */
  if (status) {
    errorText =
      `HTTP Status: ${status}\n\n` +
      errorText;
  }

  /*
   * اختصار الخطأ إذا كان ضخمًا
   */
  if (errorText.length > 3500) {
    errorText =
      errorText.slice(
        0,
        3500
      ) +
      "\n\n...[تم اختصار الخطأ]";
  }

  return errorText;
}


/* =========================
   إرسال خطأ Groq
========================= */

function sendGroqError(
  api,
  event,
  error
) {
  const errorText =
    formatGroqError(
      error
    );

  console.error(
    "[ZANJOUBA] FINAL GROQ ERROR:",
    errorText
  );

  const message =
    `🐿️ خطأ Groq 🌰\n\n` +
    `${errorText}`;

  try {
    api.sendMessage(
      message,
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

      if (
        info?.messageID
      ) {
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
  const match =
    String(text || "").match(
      /(?:اسمي|اسمى|انا|أنا|ادعى|أدعى)\s+(.+)/i
    );

  if (!match) {
    return null;
  }

  const name =
    match[1]
      .trim()
      .replace(
        /[.!،؟]+$/g,
        ""
      )
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

function getUserName(
  senderID
) {
  return (
    usersNames.get(
      String(senderID)
    ) || null
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
    String(prompt || "")
      .trim();

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

  for (
    const userID of ids
  ) {
    try {
      await new Promise(
        (
          resolve,
          reject
        ) => {
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

module.exports.run =
  async function ({
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
      getUserName(
        event.senderID
      ) ||
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
      String(
        event.threadID
      );

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
      sendGroqError(
        api,
        event,
        error
      );
    }
  };


/* =========================
   handleReply
========================= */

module.exports.handleReply =
  async function ({
    api,
    event,
    handleReply
  }) {
    const prompt =
      String(
        event.body || ""
      ).trim();

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
      getUserName(
        event.senderID
      ) ||
      "عضو المجموعة";

    /*
     * نفس ذاكرة المجموعة
     */
    const conversationKey =
      handleReply.conversationKey ||
      String(
        event.threadID
      );

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
      sendGroqError(
        api,
        event,
        error
      );
    }
  };