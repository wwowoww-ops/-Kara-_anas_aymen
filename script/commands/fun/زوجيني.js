const axios = require("axios");

module.exports.config = {
  name: "زوجيني",
  version: "3.2.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "اختيار شريك عشوائي أو الزواج بالرد",
  commandCategory: "fun",
  usages: "زوجيني",
  cooldowns: 5
};

module.exports.run = async function({ api, event }) {

  const { threadID, messageID, senderID, type, messageReply } = event;

  try {

    let user1 = senderID;
    let user2;

    // إذا كان ردًا على شخص
    if (type === "message_reply") {

      user2 = messageReply.senderID;

    } else {

      // اختيار شريك عشوائي
      const threadInfo = await api.getThreadInfo(threadID);

      let members = threadInfo.participantIDs.filter(
        id => id !== senderID && id !== api.getCurrentUserID()
      );


      if (members.length === 0) {
        return api.sendMessage(
          "❌ لا يوجد أعضاء آخرون للزواج.",
          threadID,
          messageID
        );
      }


      user2 = members[Math.floor(Math.random() * members.length)];
    }


    if (user1 === user2) {
      return api.sendMessage(
        "😂 لا يمكنك الزواج من نفسك.",
        threadID,
        messageID
      );
    }


    // جلب الأسماء
    let name1 = "مستخدم";
    let name2 = "مستخدم";

    try {

      const info = await api.getUserInfo([
        user1,
        user2
      ]);

      name1 = info[user1]?.name || "مستخدم";
      name2 = info[user2]?.name || "مستخدم";

    } catch (e) {
      console.log("خطأ الأسماء:", e);
    }



    // حساب التوافق
    let love = Math.floor(Math.random() * 101);


    let message;

    if (love >= 90) {
      message = "💖 توافق أسطوري! أنتما مناسبين لبعضكما.";
    } 
    else if (love >= 70) {
      message = "❤️ توافق رائع! بداية جميلة.";
    } 
    else if (love >= 50) {
      message = "💕 توافق جيد، تحتاجان لبعض الوقت.";
    } 
    else if (love >= 30) {
      message = "💔 توافق متوسط، حاولوا التفاهم.";
    } 
    else {
      message = "😂 يبدو أن الحظ لم يكن معكما.";
    }



    return api.sendMessage(
`⌬ ━━ HINA FUN ━━ ⌬

💍 تم العثور على شريكك!

👤 ${name1}
❤️ 💍 ❤️
👤 ${name2}

📊 نسبة التوافق: ${love}%

${message}

🎉 مبروك!`,
      threadID,
      messageID
    );


  } catch (err) {

    console.log("زوجيني ERROR:", err);

    return api.sendMessage(
`⌬ ━━ HINA FUN ━━ ⌬

❌ حدث خطأ أثناء الزواج:
${err.message}`,
      threadID,
      messageID
    );

  }
};
