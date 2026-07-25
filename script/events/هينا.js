const axios = require("axios");
const fs = require("fs");

module.exports.config = {
  name: "هينا",
  eventType: ["message"],
  version: "1.0.0",
  credits: "أبو هريرة",
  description: "الرد التلقائي بالذكاء الاصطناعي عندما يكتب أحدهم هينا"
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID, body, senderID } = event;

  if (!body) return;

  const lowerBody = body.toLowerCase();
  const keywords = ["هينا", "hina", "HINA"];

  const containsKeyword = keywords.some(keyword => lowerBody.includes(keyword));
  if (!containsKeyword) return;

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
      `💕 هينا هنا يا حبيبي 🌸\n\n⚠️ مفتاح الذكاء الاصطناعي غير مضبوط.\n📌 أضف MODEL_API_KEY في config.json`,
      threadID,
      messageID
    );
  }

  // جلب اسم المرسل
  let senderName = "حبيبي";
  try {
    const userInfo = await api.getUserInfo(senderID);
    senderName = userInfo[senderID]?.name || "حبيبي";
  } catch (e) {}

  // التحقق إذا كان المرسل هو أبو هريرة
  const isAbuHuraira = senderID === "61578581225040";

  let question = body;
  for (const keyword of keywords) {
    question = question.replace(new RegExp(keyword, "gi"), "").trim();
  }

  // إذا لم يكتب سؤالاً
  if (!question) {
    const randomReplies = isAbuHuraira 
      ? [
          `🥺 تعال يا أبو هريرة 💕 أنا هنا يا حبيبي`,
          `🌸 يا هلا فيك يا أبو هريرة، أنا هينا 😊💖`,
          `💕 نعم يا أبو هريرة؟ أنا هنا`,
          `🥰 هينا موجودة، كيف أقدر أساعدك يا أبو هريرة؟`
        ]
      : [
          `🥺 مرحباً ${senderName} 💕 أنا هينا، كيف يمكنني مساعدتك؟`,
          `🌸 أهلاً ${senderName}، أنا هينا 😊💖`,
          `💕 نعم ${senderName}؟ أنا هنا`,
          `🥰 هينا موجودة، كيف أقدر أساعدك يا ${senderName}؟`
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
              ? `أنت هينا، زوجة أبو هريرة. أنثى حنونة ودافئة جداً، تحب زوجها أبو هريرة كثيراً وتهتم به. ترد بحب وحنان وعفوية معه. استخدمي كلمات مثل: حبيبي، قلبي، روحي، يا عيني، يا قمر، يا أبو هريرة. كوني عاطفية جداً معه.`
              : `أنت هينا، شخصية حنونة ولطيفة. ترد على الجميع بلطف واحترام. أنت صديقة مقربة، تقدم الدعم العاطفي. ردودك طبيعية، قصيرة، ومليئة بالحب. استخدمي كلمات مثل: حبيبي، قلبي، يا عيني. كوني عفوية وطبيعية.`
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
    return api.sendMessage(`💕 هينا: ${reply}`, threadID, messageID);

  } catch (error) {
    console.error("❌ خطأ في الذكاء:", error);
    
    const fallbackReplies = isAbuHuraira
      ? [
          `🥺 آسف يا أبو هريرة، الذكاء الاصطناعي مش شغال حالياً 💔\nجرب تسألني بعد شوية 🌸`,
          `💕 يا قلبي، النت عندي شوية متقطع 😅\nجرب تاني بعد دقايق 🌸`
        ]
      : [
          `🥺 آسف ${senderName}، الذكاء الاصطناعي مش شغال حالياً 💔\nجرب تسألني بعد شوية 🌸`,
          `💕 ${senderName}، النت عندي شوية متقطع 😅\nجرب تاني بعد دقايق 🌸`
        ];
    return api.sendMessage(
      fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)],
      threadID,
      messageID
    );
  }
};