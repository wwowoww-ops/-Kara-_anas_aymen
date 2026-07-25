module.exports.config = {
  name: "قبول",
  version: "1.0.0",
  hasPermssion: 1,
  credits: "أبو هريرة",
  description: "عرض وقبول طلبات الانضمام",
  commandCategory: "admin",
  usages: "قبول | قبول رقم | قبول الكل",
  cooldowns: 3
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;

  try {

    // جلب الطلبات
    const info = await api.getThreadInfo(threadID);

    const requests = info.pendingParticipants || [];

    if (!requests.length) {
      return api.sendMessage(
        "ℹ️ لا توجد طلبات انضمام معلقة.",
        threadID,
        messageID
      );
    }


    // عرض القائمة
    if (!args[0]) {

      let msg = "📋 طلبات الانضمام:\n\n";

      requests.forEach((user, index) => {
        msg += `${index + 1}- ${user.name || user.id}\n`;
      });

      msg += "\n✅ للقبول:\n";
      msg += ".قبول رقم\n\n";
      msg += "✅ لقبول الجميع:\n";
      msg += ".قبول الكل";

      return api.sendMessage(
        msg,
        threadID,
        messageID
      );
    }


    // قبول الكل
    if (args[0] === "الكل") {

      let count = 0;

      for (const user of requests) {
        try {
          await api.addUserToGroup(
            user.id,
            threadID
          );
          count++;
        } catch (e) {}
      }

      return api.sendMessage(
        `✅ تم قبول ${count} طلب.`,
        threadID,
        messageID
      );
    }


    // قبول رقم محدد
    const number = parseInt(args[0]);

    if (isNaN(number) || !requests[number - 1]) {
      return api.sendMessage(
        "❌ رقم غير صحيح.",
        threadID,
        messageID
      );
    }

    const user = requests[number - 1];

    await api.addUserToGroup(
      user.id,
      threadID
    );

    return api.sendMessage(
      `✅ تم قبول الطلب رقم ${number}.`,
      threadID,
      messageID
    );


  } catch (error) {

    return api.sendMessage(
      `❌ خطأ:\n${error.message}`,
      threadID,
      messageID
    );

  }
};
