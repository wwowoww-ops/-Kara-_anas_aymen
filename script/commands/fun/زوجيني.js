const fs = require("fs-extra");

module.exports.config = {
  name: "زوجيني",
  version: "3.0.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "زواج عشوائي أو بالرد على شخص",
  commandCategory: "fun",
  usages: "زوجيني",
  cooldowns: 5
};

module.exports.run = async function({ api, event, Users }) {
  const { threadID, messageID, senderID, type, messageReply } = event;

  try {

    let user1 = senderID;
    let user2;

    // الزواج بالرد
    if (type === "message_reply") {
      user2 = messageReply.senderID;
    }

    // زواج عشوائي
    else {
      const info = await api.getThreadInfo(threadID);

      let members = info.participantIDs.filter(
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


    // جلب الأسماء بأمان
    const data1 = await Users.getData(user1) || {};
    const data2 = await Users.getData(user2) || {};

    const name1 = data1.name || "عضو";
    const name2 = data2.name || "عضو";


    // نسبة الحب
    const love = Math.floor(Math.random() * 101);


    let result;

    if (love >= 90) {
      result = "💖 توافق أسطوري! ثنائي لا يُهزم.";
    } 
    else if (love >= 70) {
      result = "❤️ توافق رائع!";
    } 
    else if (love >= 50) {
      result = "💕 علاقة مقبولة.";
    } 
    else if (love >= 30) {
      result = "💔 يحتاجان إلى التفاهم.";
    } 
    else {
      result = "😂 يبدو أن الزواج كان خطأ!";
    }


    return api.sendMessage(
`⌬ ━━ HINA FUN ━━ ⌬

💍 تم اختيار زوجين جديدين!

👤 ${name1}
❤️ 💍 ❤️
👤 ${name2}

📊 نسبة التوافق: ${love}%

${result}

🎉 مبروك للعروسين!`,
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
