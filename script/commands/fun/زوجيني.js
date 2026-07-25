const fs = require("fs-extra");

module.exports.config = {
  name: "زوجيني",
  version: "3.1.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "زواج عشوائي أو بالرد على شخص",
  commandCategory: "fun",
  usages: "زوجيني",
  cooldowns: 5
};

module.exports.run = async function({ api, event }) {

  const { threadID, messageID, senderID, type, messageReply } = event;

  try {

    let user1 = senderID;
    let user2;

    // بالرد على شخص
    if (type === "message_reply") {
      user2 = messageReply.senderID;
    }

    // اختيار عشوائي
    else {

      const threadInfo = await api.getThreadInfo(threadID);

      let members = threadInfo.participantIDs.filter(
        id => id !== api.getCurrentUserID()
      );

      if (members.length < 2) {
        return api.sendMessage(
          "❌ لا يوجد أعضاء كافيين للزواج.",
          threadID,
          messageID
        );
      }

      user1 = members[Math.floor(Math.random() * members.length)];

      members = members.filter(id => id !== user1);

      user2 = members[Math.floor(Math.random() * members.length)];
    }


    if (user1 === user2) {
      return api.sendMessage(
        "😂 لا يمكنك الزواج من نفسك.",
        threadID,
        messageID
      );
    }


    // جلب الأسماء من فيسبوك
    let names = await api.getUserInfo([user1, user2]);

    let name1 = names[user1]?.name || "عضو";
    let name2 = names[user2]?.name || "عضو";


    // نسبة التوافق
    let love = Math.floor(Math.random() * 101);

    let text;

    if (love >= 90) {
      text = "💖 توافق أسطوري! حب لا ينتهي.";
    } 
    else if (love >= 70) {
      text = "❤️ توافق رائع!";
    } 
    else if (love >= 50) {
      text = "💕 بداية جيدة.";
    } 
    else if (love >= 30) {
      text = "💔 يحتاجان للمزيد من التفاهم.";
    } 
    else {
      text = "😂 يبدو أن الزواج كان قرارًا خاطئًا.";
    }


    return api.sendMessage(
`⌬ ━━ HINA FUN ━━ ⌬

💍 تم اختيار زوجين جديدين!

👤 ${name1}
❤️ 💍 ❤️
👤 ${name2}

📊 نسبة التوافق: ${love}%

${text}

🎉 مبروك للعروسين!`,
      threadID,
      messageID
    );


  } catch (err) {

    console.log("زوجيني:", err);

    return api.sendMessage(
`⌬ ━━ HINA FUN ━━ ⌬

❌ حدث خطأ أثناء الزواج:
${err.message}`,
      threadID,
      messageID
    );
  }
};
