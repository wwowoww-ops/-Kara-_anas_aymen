module.exports.config = {
  name: "قبول",
  version: "2.0.0",
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

    let requests = [];

    // محاولة جلب الطلبات من أكثر من مكان
    try {
      const info = await api.getThreadInfo(threadID);

      requests =
        info.approvalRequests ||
        info.pendingRequests ||
        info.approvalQueue ||
        info.pendingParticipants ||
        [];

    } catch (e) {}

    // إذا لم يجدها
    if (!Array.isArray(requests) || requests.length === 0) {

      return api.sendMessage(
        "ℹ️ لم أجد طلبات انضمام معلقة.\n\nتأكد أن هناك طلبات معلقة فعلًا وأن البوت لديه صلاحيات.",
        threadID,
        messageID
      );
    }


    // عرض القائمة
    if (!args[0]) {

      let msg = "📋 طلبات الانضمام:\n\n";

      requests.forEach((user, i) => {
        msg += `${i + 1}- ${user.name || user.id || user.userFbId}\n`;
      });

      msg += "\n━━━━━━━━━━━━━━\n";
      msg += "✅ قبول طلب:\n";
      msg += ".قبول رقم\n\n";
      msg += "✅ قبول الجميع:\n";
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

        const id = user.id || user.userFbId;

        if (!id) continue;

        try {

          if (api.addUserToGroup) {
            await api.addUserToGroup(id, threadID);
          }

          count++;

        } catch (e) {}
      }


      return api.sendMessage(
        `✅ تم قبول ${count} من الطلبات.`,
        threadID,
        messageID
      );
    }


    // قبول رقم معين
    let num = parseInt(args[0]);

    if (isNaN(num) || !requests[num - 1]) {

      return api.sendMessage(
        "❌ رقم الطلب غير موجود.",
        threadID,
        messageID
      );
    }


    const user = requests[num - 1];
    const id = user.id || user.userFbId;


    try {

      if (api.addUserToGroup) {
        await api.addUserToGroup(id, threadID);
      }

      return api.sendMessage(
        `✅ تم قبول الطلب رقم ${num}.`,
        threadID,
        messageID
      );

    } catch (e) {

      return api.sendMessage(
        `❌ فشل قبول الطلب:\n${e.message}`,
        threadID,
        messageID
      );
    }


  } catch (error) {

    return api.sendMessage(
      `❌ حدث خطأ:\n${error.message}`,
      threadID,
      messageID
    );

  }
};
