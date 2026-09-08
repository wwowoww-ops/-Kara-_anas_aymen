const fs = require("fs");

const path = "./data/silence.json";

// ==================================================
// ID المطور
// ==================================================

const DEVELOPER_ID = "61578581225040";


module.exports.config = {
  name: "هدوء",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "وضع هدوء للمطور فقط وطرد أي شخص يتكلم",
  commandCategory: "developer",
  usages: "هدوء / هدوء إيقاف",
  cooldowns: 3
};


/* ==================================================
   أدوات مساعدة
================================================== */

function ensureDataFile() {

  try {

    if (!fs.existsSync("./data")) {

      fs.mkdirSync("./data", {
        recursive: true
      });

    }

    if (!fs.existsSync(path)) {

      fs.writeFileSync(
        path,
        JSON.stringify({}, null, 2),
        "utf8"
      );

    }

  } catch (error) {

    console.error(
      "[هدوء] فشل تجهيز ملف البيانات:",
      error
    );

  }

}


/* ==================================================
   قراءة JSON
================================================== */

function readJSON(file, fallback = {}) {

  try {

    if (!fs.existsSync(file)) {
      return fallback;
    }

    const content =
      fs.readFileSync(
        file,
        "utf8"
      );

    if (!content.trim()) {
      return fallback;
    }

    const data =
      JSON.parse(content);

    return data || fallback;

  } catch (error) {

    console.error(
      `[هدوء] فشل قراءة ${file}:`,
      error
    );

    return fallback;

  }

}


/* ==================================================
   حفظ JSON
================================================== */

function writeJSON(file, data) {

  try {

    fs.writeFileSync(
      file,
      JSON.stringify(
        data,
        null,
        2
      ),
      "utf8"
    );

    return true;

  } catch (error) {

    console.error(
      `[هدوء] فشل حفظ ${file}:`,
      error
    );

    return false;

  }

}


/* ==================================================
   التحقق من المطور
================================================== */

function isDeveloper(userID) {

  return (
    String(userID) ===
    String(DEVELOPER_ID)
  );

}


/* ==================================================
   الحصول على ID البوت
================================================== */

function getBotID(api) {

  try {

    return String(
      api.getCurrentUserID()
    );

  } catch (error) {

    console.error(
      "[هدوء] فشل الحصول على ID البوت:",
      error
    );

    return "";

  }

}


/* ==================================================
   الحصول على معلومات المجموعة
================================================== */

function getThreadInfo(api, threadID) {

  return new Promise(
    (resolve, reject) => {

      try {

        api.getThreadInfo(
          threadID,
          (error, info) => {

            if (error) {
              return reject(error);
            }

            resolve(info);

          }
        );

      } catch (error) {

        reject(error);

      }

    }
  );

}


/* ==================================================
   الطرد
================================================== */

function removeUser(
  api,
  userID,
  threadID
) {

  return new Promise(
    (resolve, reject) => {

      try {

        api.removeUserFromGroup(
          String(userID),
          String(threadID),
          error => {

            if (error) {
              return reject(error);
            }

            resolve();

          }
        );

      } catch (error) {

        reject(error);

      }

    }
  );

}


/* ==================================================
   الأمر الرئيسي
================================================== */

module.exports.run = async function({
  api,
  event,
  args
}) {

  const {
    threadID,
    messageID,
    senderID
  } = event;


  if (
    !threadID ||
    !senderID
  ) {

    return;

  }


  /* ==================================================
     المطور فقط
  ================================================== */

  if (
    !isDeveloper(senderID)
  ) {

    return api.sendMessage(
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n⛔ هذا الأمر خاص بالمطور فقط.`,
      threadID,
      messageID
    );

  }


  ensureDataFile();


  /* ==================================================
     قراءة البيانات
  ================================================== */

  let data =
    readJSON(
      path,
      {}
    );


  const action =
    String(
      args?.[0] || ""
    )
    .trim()
    .toLowerCase();


  /* ==================================================
     🔊 إيقاف الهدوء
  ================================================== */

  if (
    action === "إيقاف" ||
    action === "ايقاف" ||
    action === "off" ||
    action === "stop"
  ) {

    delete data[
      threadID
    ];


    if (
      !writeJSON(
        path,
        data
      )
    ) {

      return api.sendMessage(
        `⌬ ━━ HINA ADMIN ━━ ⌬\n\n❌ حدث خطأ أثناء إيقاف وضع الهدوء.`,
        threadID,
        messageID
      );

    }


    return api.sendMessage(
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n🔊 تم إيقاف وضع الهدوء.\n\n✅ أصبح بإمكان الجميع التحدث.`,
      threadID,
      messageID
    );

  }


  /* ==================================================
     🔇 تفعيل الهدوء
  ================================================== */

  let threadInfo;

  try {

    threadInfo =
      await getThreadInfo(
        api,
        threadID
      );

  } catch (error) {

    console.error(
      "[هدوء] فشل الحصول على معلومات المجموعة:",
      error
    );

    return api.sendMessage(
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n❌ تعذر الحصول على معلومات المجموعة.`,
      threadID,
      messageID
    );

  }


  if (!threadInfo) {

    return api.sendMessage(
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n❌ لم أستطع الحصول على معلومات المجموعة.`,
      threadID,
      messageID
    );

  }


  /* ==================================================
     التأكد أن البوت موجود كأدمن
  ================================================== */

  const botID =
    getBotID(api);


  const adminIDs =
    Array.isArray(
      threadInfo.adminIDs
    )
      ? threadInfo.adminIDs
          .map(admin => {

            if (
              admin &&
              typeof admin === "object"
            ) {

              return (
                admin.id ||
                admin.userID ||
                admin.uid ||
                ""
              );

            }

            return admin || "";

          })
          .filter(Boolean)
          .map(id => String(id))
      : [];


  if (
    !botID ||
    !adminIDs.includes(
      String(botID)
    )
  ) {

    return api.sendMessage(
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n⚠️ يجب أن أكون أدمن حتى أتمكن من طرد الأشخاص.`,
      threadID,
      messageID
    );

  }


  /* ==================================================
     تفعيل الهدوء
  ================================================== */

  data[
    threadID
  ] = {

    enabled: true,

    developerID:
      DEVELOPER_ID,

    time:
      Date.now()

  };


  if (
    !writeJSON(
      path,
      data
    )
  ) {

    return api.sendMessage(
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n❌ حدث خطأ أثناء حفظ وضع الهدوء.`,
      threadID,
      messageID
    );

  }


  return api.sendMessage(
    `⌬ ━━ HINA ADMIN ━━ ⌬\n\n🔇 تم تفعيل وضع الهدوء.\n\n👑 المطور فقط يستطيع التحدث.\n🚫 أي شخص آخر يتكلم سيتم طرده مباشرة.\n\n🔊 لإيقاف الوضع:\nهدوء إيقاف`,
    threadID,
    messageID
  );

};


/* ==================================================
   🎯 معالج الأحداث
================================================== */

module.exports.handleEvent =
async function({
  api,
  event
}) {

  try {

    if (!event) {
      return;
    }


    const {
      threadID,
      senderID,
      type,
      messageID
    } = event;


    /* ==================================================
       التأكد أن الحدث رسالة
    ================================================== */

    if (
      type !== "message" &&
      type !== "message_reply"
    ) {

      return;

    }


    if (
      !threadID ||
      !senderID
    ) {

      return;

    }


    /* ==================================================
       قراءة حالة الهدوء
    ================================================== */

    if (
      !fs.existsSync(path)
    ) {

      return;

    }


    const data =
      readJSON(
        path,
        {}
      );


    if (
      !data[threadID] ||
      !data[threadID].enabled
    ) {

      return;

    }


    /* ==================================================
       المطور مستثنى
    ================================================== */

    if (
      isDeveloper(senderID)
    ) {

      console.log(
        `[هدوء] تم السماح للمطور ${senderID}`
      );

      return;

    }


    /* ==================================================
       البوت مستثنى
    ================================================== */

    const botID =
      getBotID(api);


    if (
      botID &&
      String(senderID) ===
      String(botID)
    ) {

      return;

    }


    /* ==================================================
       الحصول على معلومات المجموعة
    ================================================== */

    let threadInfo;

    try {

      threadInfo =
        await getThreadInfo(
          api,
          threadID
        );

    } catch (error) {

      console.error(
        `[هدوء] فشل الحصول على معلومات المجموعة ${threadID}:`,
        error
      );

      return;

    }


    if (!threadInfo) {

      return;

    }


    /* ==================================================
       التأكد أن البوت أدمن
    ================================================== */

    const adminIDs =
      Array.isArray(
        threadInfo.adminIDs
      )
        ? threadInfo.adminIDs
            .map(admin => {

              if (
                admin &&
                typeof admin === "object"
              ) {

                return (
                  admin.id ||
                  admin.userID ||
                  admin.uid ||
                  ""
                );

              }

              return admin || "";

            })
            .filter(Boolean)
            .map(id => String(id))
        : [];


    if (
      !botID ||
      !adminIDs.includes(
        String(botID)
      )
    ) {

      console.log(
        `❌ [هدوء] البوت ليس أدمن في ${threadID}`
      );

      return;

    }


    /* ==================================================
       🚫 أي شخص غير المطور
       يتم طرده مباشرة
    ================================================== */

    console.log(
      `🚨 [هدوء] محاولة طرد ${senderID} من ${threadID}`
    );


    /* ==================================================
       حذف الرسالة
    ================================================== */

    if (messageID) {

      try {

        await new Promise(
          resolve => {

            api.unsendMessage(
              messageID,
              () => resolve()
            );

          }
        );

      } catch (error) {

        console.error(
          `[هدوء] فشل حذف رسالة ${senderID}:`,
          error
        );

      }

    }


    /* ==================================================
       🚨 الطرد المباشر
    ================================================== */

    try {

      await removeUser(
        api,
        senderID,
        threadID
      );


      console.log(
        `✅ [هدوء] تم طرد ${senderID} مباشرة من ${threadID}`
      );


      /* ==================================================
         رسالة التأكيد
      ================================================== */

      try {

        await api.sendMessage(
          `⌬ ━━ HINA ADMIN ━━ ⌬\n\n🚫 تم طرد عضو من المجموعة.\n\n📌 السبب: التحدث أثناء وضع الهدوء.\n👑 المسموح له بالكلام: المطور فقط.`,
          threadID
        );

      } catch (error) {

        console.error(
          "[هدوء] تم الطرد لكن فشل إرسال رسالة التأكيد:",
          error
        );

      }


    } catch (error) {

      console.error(
        `❌ [هدوء] فشل طرد ${senderID} من ${threadID}:`,
        error
      );

    }

  } catch (error) {

    console.error(
      "❌ [هدوء] خطأ عام في handleEvent:",
      error
    );

  }

};