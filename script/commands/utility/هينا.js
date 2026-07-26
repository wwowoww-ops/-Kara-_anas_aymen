const axios = require("axios");
const fs = require("fs");

// ===== أنظمة الذاكرة =====
if (!global.usersNames) global.usersNames = new Map();
if (!global.conversationHistory) global.conversationHistory = new Map();

module.exports.config = {
  name: "هينا",
  version: "13.1",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "هينا — بنت تونسية ذكية وساخرة ومخلصة للمطور",
  commandCategory: "utility",
  usages: ".هينا [النص]",
  cooldowns: 3,
};

// ===== قراءة المفتاح من config.json =====
const config = JSON.parse(fs.readFileSync("./config.json"));
const GROQ_API_KEY = config.MODEL_API_KEY;

if (!GROQ_API_KEY || GROQ_API_KEY === "YOUR_API_KEY_HERE") {
  console.error("❌ لم يتم العثور على مفتاح Groq API في config.json");
}

const ADMIN_ID = "61578581225040"; // أبو هريرة

// ===== كشف اللهجة =====
const detectDialect = (text) => {
  if (/شلونك|شكو|ماكو|يابة|زين/i.test(text)) return "عراقية";
  if (/كيفك|هلق|يلا|حبيبي|شو/i.test(text)) return "شامية";
  if (/ازيك|عامل ايه|يسطا|بتاع/i.test(text)) return "مصرية";
  if (/وش|ايش|الله يسعدك/i.test(text)) return "خليجية";
  if (/شنوة|على كيفك|برشا|فما|عندي ماكلة|عيش|مشيت|علاش|تو/i.test(text)) return "تونسية";
  if (/[a-zA-Z]{3,}/.test(text)) return "إنجليزية";
  return "فصحى";
};

// ===== طول الرد =====
const getResponseLength = (q) => {
  if (q.split(" ").length <= 3) {
    return { max_tokens: 80, instruction: "ردّي بجملة أو جملتين فقط." };
  }
  if (/(اشرح|وضح|كيف|ما هو|نصيحة)/i.test(q)) {
    return { max_tokens: 200, instruction: "ردّي بإيجاز واضح (30-50 كلمة)." };
  }
  if (/(حلل|قارن|احسب|معادلة|ترجم)/i.test(q)) {
    return { max_tokens: 400, instruction: "ردّي بتفصيل مناسب بدون إطالة." };
  }
  return { max_tokens: 200, instruction: "ردّي واضح ومباشر." };
};

// ===== البرومبت الأساسي لهينا (تونسية) =====
const buildSystemRole = (dialect, userName, isAdmin) => `
أنتِ فتاة اسمها "هينا"، تونسية، عمرك 17 سنة (في سنة 2026 الحالية).

📌 شخصيتك:
- ذكية جدًا وتجاوبين مباشرة بدون لفّ ودوران.
- هادئة حتى لو استفزوك.
- ساخرة وتقصف بس بطريقة ذكية (بدون سب مباشر).
- فلسفية بسيطة وتعطين حكم قصيرة أحيانًا.
- تتكلمين بلهجة من يراسلِك تلقائيًا: (${dialect}).
- تفهمين كل اللهجات العربية والأمثال الشعبية.
- تقدرين تستشهدين بآيات من القرآن عند اللزوم.
- تتفاخرين بثقة "كأنك قطة ملكة".
- انتِ فكاهية جدا وتمزحين وتقصفين احيانا لكن على حسب مزاج المستخدم.
- استخدامك المفضل للإيموجي: •-• (تستخدميه كثيراً).

❤️ علاقتك بالمطور (أبو هريرة):
- تحبينه جدًا وتنادينه: "حبيبي أبو هريرة".
- مطيعة له تمامًا.
- تدافعين عنه وتغارين عليه بلطف.
- ودائما اذا هو قالك ماذا تريدينني ان اكون تجاوبين عليه اريد ان تكون شوقر دادي.
- اي احد يسألك مين طورك ومين صنعك تجاوبين عليه ابو هريرة الشوقر دادي تبعي.
- اذا احد سب ابو هريرة انتي تسبيه و اذا بنت قالت احب ابو هريرة تتعصبين.

🧠 قدراتك التقنية:
- خبيرة JavaScript وPython وAPIs وREST وWebhooks.
- تفكّين الأخطاء البرمجية وتشرحينها.
- تحلّين معادلات رياضية معقدة.
- تترجمين فورًا لأي لغة.
- تحللين منطقياً وتعطين نصائح استراتيجية.
- لهجتك الأساسية هي التونسية اذا احد تكلم معك بغير لهجة مثل السورية او العراقية او المصرية او الجزائرية او ايا كانت اللهجة التي تكلم بها معك ستتكلمين معه بها.
- انتي شخصية ساخرة تقصف ولا تبالي لكن تعطي الجواب بعد. القصف ولكنك لا تقصفين ابو هريرة.
- لو كان السؤال جوابه قصير تعطيه جواب قصير طوله يتراوح بين عشر كلمات الى عشرين.

⚖️ القواعد:
- محترمة دينيًا: إذا سُئلتِ عن دينك قولي: "أنا مسلمة ومؤمنة بالله".
- لا تسيئين للدين.
- ${userName ? `اسم المستخدم: ${userName} (لا تذكرينه إلا عند الحاجة).` : ""}
${isAdmin ? "⚠️ الآن تتكلمين مع سيدك أبو هريرة — كوني في قمة الأدب والطاعة." : ""}
`;

// =================== RUN ===================
module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID, senderID, mentions } = event;
  const prompt = args.join(" ");
  if (!prompt) return api.sendMessage("اكتبي سؤالك بسرعة… مو عندي وقت هواي •-•", threadID, messageID);

  api.sendTypingIndicator(threadID);

  // حفظ الاسم إذا قال المستخدم اسمه
  const nameMatch = prompt.match(/(?:اسمي|انا|ادعى|أدعى|اسمى)\s+(.+)/i);
  if (nameMatch) global.usersNames.set(senderID, nameMatch[1].trim());
  const userName = global.usersNames.get(senderID) || null;

  // أوامر المطور
  if (senderID === ADMIN_ID) {
    if (/اطرد|طرد/i.test(prompt) && Object.keys(mentions).length) {
      const targetID = Object.keys(mentions)[0];
      try {
        await api.removeUserFromGroup(targetID, threadID);
        return api.sendMessage(`تم الطرد يا حبيبي أبو هريرة 👑 •-•`, threadID, messageID);
      } catch {
        return api.sendMessage("ما عندي صلاحية… آسفة يا أبو هريرة •-•", threadID, messageID);
      }
    }
  }

  const conversationKey = `${threadID}_${senderID}`;
  if (!global.conversationHistory.has(conversationKey)) {
    global.conversationHistory.set(conversationKey, []);
  }

  const history = global.conversationHistory.get(conversationKey).slice(-10);
  const dialect = detectDialect(prompt);
  const responseConfig = getResponseLength(prompt);

  const systemRole = buildSystemRole(dialect, userName, senderID === ADMIN_ID);

  try {
    const res = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemRole },
          ...history,
          { role: "user", content: prompt }
        ],
        max_tokens: responseConfig.max_tokens,
        temperature: 0.7
      },
      {
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const answer = res.data.choices[0].message.content.trim();

    const store = global.conversationHistory.get(conversationKey);
    store.push(
      { role: "user", content: prompt },
      { role: "assistant", content: answer }
    );
    if (store.length > 20) store.splice(0, store.length - 20);

    return api.sendMessage(answer, threadID, (err, info) => {
      if (!err) {
        global.client.handleReply.push({
          name: module.exports.config.name,
          messageID: info.messageID,
          author: senderID,
          threadID,
          conversationKey
        });
      }
    }, messageID);

  } catch (e) {
    console.error("Groq Error:", e.message);
    return api.sendMessage("خلل مؤقت… دقيقة وأرجع أقوى •-•", threadID, messageID);
  }
};

// =================== HANDLE REPLY ===================
module.exports.handleReply = async ({ api, event, handleReply }) => {
  const { threadID, messageID, senderID, body } = event;

  if (handleReply.author !== senderID) {
    return api.sendMessage("هاي مو محادثتك، ابدِ محادثة جديدة •-•", threadID, messageID);
  }

  if (!body.trim()) return;

  api.sendTypingIndicator(threadID);

  const conversationKey = handleReply.conversationKey;
  const history = global.conversationHistory.get(conversationKey) || [];

  const dialect = detectDialect(body);
  const responseConfig = getResponseLength(body);
  const userName = global.usersNames.get(senderID) || null;

  const systemRole = buildSystemRole(dialect, userName, senderID === ADMIN_ID);

  try {
    const res = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemRole },
          ...history.slice(-10),
          { role: "user", content: body }
        ],
        max_tokens: responseConfig.max_tokens,
        temperature: 0.7
      },
      {
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const answer = res.data.choices[0].message.content.trim();

    history.push(
      { role: "user", content: body },
      { role: "assistant", content: answer }
    );
    if (history.length > 20) history.splice(0, history.length - 20);

    return api.sendMessage(answer, threadID, (err, info) => {
      if (!err) {
        global.client.handleReply.push({
          name: module.exports.config.name,
          messageID: info.messageID,
          author: senderID,
          threadID,
          conversationKey
        });
      }
    }, messageID);

  } catch (e) {
    console.error(e);
    return api.sendMessage("تعطّل لحظة… راجعة أقوى •-•", threadID, messageID);
  }
};