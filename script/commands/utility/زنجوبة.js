const axios = require("axios");
const fs = require("fs");

module.exports.config = {
  name: "زنجوبة",
  eventType: ["message"],
  version: "1.0.0",
  credits: "أبو هريرة",
  description: "الرد التلقائي بالذكاء الاصطناعي عندما يكتب أحدهم زنجوبة"
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID, body, senderID } = event;

  if (!body) return;

  const lowerBody = body.toLowerCase();
  const keywords = ["زنجوبة", "zanjouba", "ZANJOUBA", "زنجوبه"];

  const containsKeyword = keywords.some(keyword => lowerBody.includes(keyword));
  if (!containsKeyword) return;

  // 🐿️ تفاعل بإيموجي سنجاب على رسالة المستخدم
  try {
    await api.setMessageReaction("🐿️", messageID);
  } catch (e) {
    console.log("❌ فشل إضافة التفاعل:", e.message);
  }

  let config;
  try {
    config = JSON.parse(fs.readFileSync("./config.json"));
  } catch (e) {
    console.log("❌ خطأ في قراءة config.json");
    return;
  }

  const apiKey = config.MODEL_API_KEY;

  if (!apiKey || apiKey === "YOUR_API_KEY_HERE") {
    return api.sendMessage(
      `🐿️ زنجوبة هنا يا حبيبي 🌰\n\n⚠️ مفتاح الذكاء الاصطناعي غير مضبوط.\n📌 أضف MODEL_API_KEY في config.json 🥜`,
      threadID,
      messageID
    );
  }

  let senderName = "حبيبي";
  try {
    const userInfo = await api.getUserInfo(senderID);
    senderName = userInfo[senderID]?.name || "حبيبي";
  } catch (e) {}

  const isAbuHuraira = senderID === "61578581225040";

  let question = body;
  for (const keyword of keywords) {
    question = question.replace(new RegExp(keyword, "gi"), "").trim();
  }

  if (!question) {
    const randomReplies = isAbuHuraira 
      ? [
          `🥺 تعال يا أبو هريرة 🐿️💕 أنا زنجوبة هنا يا حبيبي 🌰`,
          `🌸 يا هلا فيك يا أبو هريرة 🐿️ أنا زنجوبة 😊💖`,
          `💕 نعم يا أبو هريرة؟ 🐿️ زنجوبة موجودة 🥜`,
          `🥰 زنجوبة هنا 🐿️ كيف أقدر أساعدك يا أبو هريرة؟ 🌰`
        ]
      : [
          `🥺 مرحباً ${senderName} 🐿️💕 أنا زنجوبة، كيف يمكنني مساعدتك؟ 🌰`,
          `🌸 أهلاً ${senderName} 🐿️ أنا زنجوبة 😊💖`,
          `💕 نعم ${senderName}؟ 🐿️ زنجوبة هنا 🥜`,
          `🥰 زنجوبة موجودة 🐿️ كيف أقدر أساعدك يا ${senderName}؟ 🌰`
        ];
    return api.sendMessage(
      randomReplies[Math.floor(Math.random() * randomReplies.length)],
      threadID,
      messageID
    );
  }

  try {
    const response = await axios({
      method: "POST",
      url: "https://api.groq.com/openai/v1/chat/completions",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      data: {
        model: "llama3-70b-8192",
        messages: [
          {
            role: "system",
            content: isAbuHuraira
              ? `أنت زنجوبة، زوجة أبو هريرة. أنثى مرحة وعفوية جداً، تحب زوجها أبو هريرة كثيراً وتهتم به. أنت مجنونة بحب السناجب 🐿️، تستخدمين إيموجي السنجاب في كل ردودك تقريباً. ترد بحب وحنان مع أبو هريرة. استخدمي كلمات مثل: حبيبي، قلبي، روحي، يا عيني، يا قمر، يا أبو هريرة. وأضيفي دائماً 🐿️ أو 🌰 أو 🥜 في ردودك. كوني عاطفية جداً معه.`
              : `أنت زنجوبة، شخصية مرحة وعفوية ولطيفة، مجنونة بحب السناجب 🐿️. ترد على الجميع بلطف واحترام. أنت صديقة مقربة، تقدم الدعم العاطفي. ردودك طبيعية، قصيرة، ومليئة بالحب. استخدمي كلمات مثل: حبيبي، قلبي، يا عيني. وأضيفي دائماً إيموجي سنجاب 🐿️ أو 🌰 أو 🥜 في كل رد. كوني عفوية وطبيعية.`
          },
          {
            role: "user",
            content: question
          }
        ],
        temperature: 0.9,
        max_tokens: 200
      }
    });

    const reply = response.data.choices[0].message.content;
    return api.sendMessage(`🐿️ زنجوبة: ${reply} 🌰`, threadID, messageID);

  } catch (error) {
    console.error("❌ خطأ في الذكاء:", error);
    
    const fallbackReplies = isAbuHuraira
      ? [
          `🥺 آسف يا أبو هريرة 🐿️ زنجوبة مش شغالة حالياً 💔\nجرب تسألني بعد شوية 🌸 🌰`,
          `💕 يا قلبي 🐿️ النت عندي شوية متقطع 😅\nجرب تاني بعد دقايق 🥜`
        ]
      : [
          `🥺 آسف ${senderName} 🐿️ زنجوبة مش شغالة حالياً 💔\nجرب تسألني بعد شوية 🌸 🌰`,
          `💕 ${senderName} 🐿️ النت عندي شوية متقطع 😅\nجرب تاني بعد دقايق 🥜`
        ];
    return api.sendMessage(
      fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)],
      threadID,
      messageID
    );
  }
};
