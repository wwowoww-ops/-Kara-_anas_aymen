module.exports.config = {
  name: "قبول",
  version: "3.0.0",
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

    let info;

    try {
      info = await api.getThreadInfo(threadID);

      // تسجيل البيانات في اللوغز
      console.log(
        "===== JOIN REQUEST LOG ====="
      );
      console.log(
        JSON.stringify(info, null, 2)
      );
      console.log(
        "============================"
      );

    } catch (e) {
      return api.sendMessage(
        "❌ فشل جلب معلومات المجموعة.",
        threadID,
        messageID
      );
    }


    // البحث عن الطلبات
    let requests =
      info.approvalRequests ||
      info.pendingRequests ||
      info.approvalQueue ||
      info.pendingParticipants ||
      info.joinRequests ||
      [];


    if (!Array.isArray(requests) || requests.length === 0) {

      return api.sendMessage(
        "ℹ️ لا توجد طلبات انضمام معلقة.",
        threadID,
        messageID
      );
    }


    // عرض القائمة
    if (!args[0]) {

      let msg =
`📋 طلبات الانضمام:

`;

      requests.forEach((user, index) => {

        const id =
          user.id ||
          user.userFbId ||
          user.userID ||
          user.uid;

        const name =
          user.name ||
          user.fullName ||
          id ||
          "عضو";

        msg += `${index + 1}- ${name}\n`;

      });


      msg +=
`
━━━━━━━━━━━━━━
✅ قبول طلب:
.قبول رقم

✅ قبول الجميع:
.قبول الكل`;

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

        const id =
          user.id ||
          user.userFbId ||
          user.userID ||
          user.uid;

        if (!id) continue;

        try {

          if (api.approvePendingJoinRequest) {
            await api.approvePendingJoinRequest(
              id,
              threadID
            );
          }

          else if (api.approveJoinRequest) {
            await api.approveJoinRequest(
              id,
              threadID
            );
          }

          else if (api.addUserToGroup) {
            await api.addUserToGroup(
              id,
              threadID
            );
          }

          count++;

        } catch (e) {

          console.log(
            "فشل قبول:",
            id,
            e.message
          );

        }
      }


      return api.sendMessage(
        `✅ تم قبول ${count} طلب.`,
        threadID,
        messageID
      );
    }




    // قبول رقم محدد

    const number = parseInt(args[0]);

    if (
      isNaN(number) ||
      !requests[number - 1]
    ) {

      return api.sendMessage(
        "❌ رقم الطلب غير صحيح.",
        threadID,
        messageID
      );

    }


    const user = requests[number - 1];


    const id =
      user.id ||
      user.userFbId ||
      user.userID ||
      user.uid;


    try {

      if (api.approvePendingJoinRequest) {

        await api.approvePendingJoinRequest(
          id,
          threadID
        );

      }

      else if (api.approveJoinRequest) {

        await api.approveJoinRequest(
          id,
          threadID
        );

      }

      else if (api.addUserToGroup) {

        await api.addUserToGroup(
          id,
          threadID
        );

      }


      return api.sendMessage(
        `✅ تم قبول الطلب رقم ${number}.`,
        threadID,
        messageID
      );


    } catch (e) {

      return api.sendMessage(
        `❌ فشل القبول:\n${e.message}`,
        threadID,
        messageID
      );

    }



  } catch (error) {

    console.log(error);

    return api.sendMessage(
      `❌ خطأ:\n${error.message}`,
      threadID,
      messageID
    );

  }

};
