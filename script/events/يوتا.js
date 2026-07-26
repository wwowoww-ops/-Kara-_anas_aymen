module.exports.config = {
  name: "يوتا",
  eventType: ["message"],
  version: "1.0.0",
  credits: "أبو هريرة",
  description: "الرد التلقائي عندما يرسل أحدهم 🦧"
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID, body } = event;

  // التأكد من وجود النص
  if (!body) return;

  // التحقق من وجود الإيموجي 🦧
  if (body.includes("🦧")) {
    // ردود عشوائية
    const replies = [
      "يوتااا 🦧",
      "🦧 يوتااا!",
      "يوتا يوتا 🦧",
      "🦧🔥 يوتاااا!",
      "يوتا 😎🦧",
      "🦧✨ يوتااا!"
    ];
    const randomReply = replies[Math.floor(Math.random() * replies.length)];
    
    return api.sendMessage(randomReply, threadID, messageID);
  }
};