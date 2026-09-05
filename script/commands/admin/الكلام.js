const fs = require("fs");

const path = "./data/noTalk.json";
const warningsPath = "./warnings.json";

module.exports.config = {
  name: "الكلام",
  version: "5.0.0",
  hasPermssion: 1,
  credits: "أبو هريرة",
  description: "منع أو السماح بالكلام في المجموعة مع تحذير المخالفين",
  commandCategory: "admin",
  usages: "الكلام ممنوع / الكلام مسموح",
  cooldowns: 3
};


/* ==================================================
   أدوات مساعدة
================================================== */

function ensureDataFiles() {

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
      "[الكلام] فشل تجهيز ملفات البيانات:",
      error
    );

  }

}


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
      `[الكلام] فشل قراءة ${file}:`,
      error
    );

    return fallback;

  }

}


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
      `[الكلام] فشل حفظ ${file}:`,
      error
    );

    return false;

  }

}


/* ==================================================
   استخراج IDs الأدمن
================================================== */

function getAdminIDs(threadInfo) {

  if (
    !threadInfo ||
    !Array.isArray(threadInfo.adminIDs)
  ) {

    return [];

  }

  return threadInfo.adminIDs
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
    .map(id => String(id));

}


function isAdmin(threadInfo, userID) {

  if (
    !threadInfo ||
    !userID
  ) {

    return false;

  }

  const admins =
    getAdminIDs(
      threadInfo
    );

  return admins.includes(
    String(userID)
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


  ensureDataFiles();


  /* ==================================================
     الحصول على معلومات المجموعة
  ================================================== */

  let threadInfo;

  try {

    threadInfo =
      await new Promise(
        (resolve, reject) => {

          api.getThreadInfo(
            threadID,
            (error, info) => {

              if (error) {
                return reject(error);
              }

              resolve(info);

            }
          );

        }
      );

  } catch (error) {

    console.error(
      "[الكلام] فشل الحصول على معلومات المجموعة:",
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
     التحقق من صلاحية الأدمن
  ================================================== */

  const senderIsAdmin =
    isAdmin(
      threadInfo,
      senderID
    );


  if (!senderIsAdmin) {

    return api.sendMessage(
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n⛔ هذا الأمر للأدمن فقط!`,
      threadID,
      messageID
    );

  }


  /* ==================================================
     قراءة البيانات
  ================================================== */

  let data =
    readJSON(
      path,
      {}
    );


  /* ==================================================
     🔇 منع الكلام
  ================================================== */

  if (
    args[0] === "ممنوع" ||
    args[0] === "منع"
  ) {

    /* ==================================================
       التأكد أن البوت أدمن
    ================================================== */

    let botID = "";

    try {

      botID =
        String(
          api.getCurrentUserID()
        );

    } catch (error) {

      console.error(
        "[الكلام] فشل الحصول على ID البوت:",
        error
      );

    }


    const botIsAdmin =
      isAdmin(
        threadInfo,
        botID
      );


    if (!botIsAdmin) {

      return api.sendMessage(
        `⌬ ━━ HINA ADMIN ━━ ⌬\n\n⚠️ يجب أن أكون أدمن في المجموعة لمنع الكلام.`,
        threadID,
        messageID
      );

    }


    data[threadID] = {

      enabled: true,

      time: Date.now(),

      warnings: {}

    };


    if (
      !writeJSON(
        path,
        data
      )
    ) {

      return api.sendMessage(
        `⌬ ━━ HINA ADMIN ━━ ⌬\n\n❌ حدث خطأ أثناء حفظ حالة منع الكلام.`,
        threadID,
        messageID
      );

    }


    return api.sendMessage(
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n🔇 تم منع الكلام في المجموعة!\n\n🚫 أي عضو يرسل رسالة سيتم تحذيره.\n📌 الأدمن فقط يستطيع الكلام.\n⚠️ التحذير الثاني = طرد فوري.\n\n🔓 للسماح: الكلام مسموح`,
      threadID,
      messageID
    );

  }


  /* ==================================================
     🔊 السماح بالكلام
  ================================================== */

  else if (
    args[0] === "مسموح" ||
    args[0] === "سماح"
  ) {

    const warningsData =
      readJSON(
        warningsPath,
        {}
      );


    if (
      warningsData[threadID]
    ) {

      delete warningsData[
        threadID
      ];

      writeJSON(
        warningsPath,
        warningsData
      );

    }


    delete data[
      threadID
    ];


    writeJSON(
      path,
      data
    );


    return api.sendMessage(
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n🔊 تم السماح بالكلام في المجموعة!\n\n✅ يمكن للأعضاء التحدث الآن.\n📝 تم حذف جميع التحذيرات.`,
      threadID,
      messageID
    );

  }


  /* ==================================================
     📊 عرض الحالة
  ================================================== */

  else {

    const status =
      data[threadID] &&
      data[threadID].enabled
        ? "🔇 ممنوع"
        : "🔊 مسموح";


    return api.sendMessage(
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n📊 حالة الكلام: ${status}\n\n📝 الاستخدام:\n• الكلام ممنوع (لمنع الكلام)\n• الكلام مسموح (للسماح بالكلام)`,
      threadID,
      messageID
    );

  }

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
       التأكد من أن الحدث رسالة
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
       قراءة حالة منع الكلام
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
       معلومات المجموعة
    ================================================== */

    let threadInfo;

    try {

      threadInfo =
        await new Promise(
          (resolve, reject) => {

            api.getThreadInfo(
              threadID,
              (error, info) => {

                if (error) {
                  return reject(error);
                }

                resolve(info);

              }
            );

          }
        );

    } catch (error) {

      console.error(
        `[الكلام] فشل الحصول على معلومات المجموعة ${threadID}:`,
        error
      );

      return;

    }


    if (!threadInfo) {

      console.error(
        `[الكلام] getThreadInfo رجع null للمجموعة ${threadID}`
      );

      return;

    }


    /* ==================================================
       IDs الأدمن
    ================================================== */

    const adminIDs =
      getAdminIDs(
        threadInfo
      );


    /* ==================================================
       ID البوت
    ================================================== */

    let botID = "";

    try {

      botID =
        String(
          api.getCurrentUserID()
        );

    } catch (error) {

      console.error(
        "[الكلام] فشل الحصول على ID البوت:",
        error
      );

    }


    /* ==================================================
       التأكد أن البوت أدمن
    ================================================== */

    if (
      !botID ||
      !adminIDs.includes(
        String(botID)
      )
    ) {

      console.log(
        `❌ [الكلام] البوت ليس أدمن في ${threadID}`
      );

      return;

    }


    /* ==================================================
       الأدمن يستطيع الكلام
    ================================================== */

    if (
      adminIDs.includes(
        String(senderID)
      )
    ) {

      console.log(
        `👑 [الكلام] تم تجاهل رسالة الأدمن ${senderID}`
      );

      return;

    }


    /* ==================================================
       حذف رسالة العضو
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

        console.log(
          `🗑️ [الكلام] تم حذف رسالة ${senderID} في ${threadID}`
        );

      } catch (error) {

        console.error(
          `❌ [الكلام] فشل حذف رسالة ${senderID}:`,
          error
        );

      }

    }


    /* ==================================================
       قراءة التحذيرات
    ================================================== */

    const warningsData =
      readJSON(
        warningsPath,
        {}
      );


    if (
      !warningsData[threadID]
    ) {

      warningsData[threadID] = {};

    }


    if (
      !warningsData[threadID][senderID]
    ) {

      warningsData[threadID][senderID] = [];

    }


    /* ==================================================
       جلب اسم العضو
    ================================================== */

    let userName =
      "العضو";


    try {

      const userInfo =
        await new Promise(
          (resolve, reject) => {

            api.getUserInfo(
              String(senderID),
              (error, info) => {

                if (error) {
                  return reject(error);
                }

                resolve(info);

              }
            );

          }
        );


      userName =
        userInfo?.[
          senderID
        ]?.name ||
        userInfo?.[
          String(senderID)
        ]?.name ||
        "العضو";

    } catch (error) {

      console.log(
        `[الكلام] تعذر الحصول على اسم ${senderID}`
      );

    }


    /* ==================================================
       إضافة التحذير
    ================================================== */

    warningsData[
      threadID
    ][
      senderID
    ].push({

      reason:
        "🔇 مخالفة منع الكلام",

      time:
        new Date().toLocaleString("ar")

    });


    const warningCount =
      warningsData[
        threadID
      ][
        senderID
      ].length;


    console.log(
      `⚠️ [الكلام] ${userName} (${senderID}) لديه ${warningCount} تحذير`
    );


    /* ==================================================
       🚨 التحذير الثاني = طرد
    ================================================== */

    if (
      warningCount >= 2
    ) {

      /* ==================================================
         حفظ البيانات قبل الطرد
      ================================================== */

      delete warningsData[
        threadID
      ][
        senderID
      ];


      writeJSON(
        warningsPath,
        warningsData
      );


      console.log(
        `🚨 [الكلام] محاولة طرد ${userName} (${senderID}) من ${threadID}`
      );


      /* ==================================================
         تنفيذ الطرد
      ================================================== */

      try {

        await new Promise(
          (resolve, reject) => {

            api.removeUserFromGroup(
              String(senderID),
              String(threadID),
              error => {

                if (error) {

                  return reject(
                    error
                  );

                }

                resolve();

              }
            );

          }
        );


        console.log(
          `✅ [الكلام] تم طرد ${userName} (${senderID}) بنجاح`
        );


        try {

          await api.sendMessage(
            `⌬ ━━ HINA ADMIN ━━ ⌬\n\n🚫 تم طرد ${userName} من المجموعة!\n\n📌 سبب الطرد: مخالفة منع الكلام (التحذير الثاني).`,
            threadID
          );

        } catch (error) {

          console.error(
            "[الكلام] تم الطرد لكن فشل إرسال رسالة التأكيد:",
            error
          );

        }


        return;

      } catch (error) {

        console.error(
          `❌ [الكلام] فشل طرد ${userName} (${senderID}):`,
          error
        );


        try {

          await api.sendMessage(
            `⌬ ━━ HINA ADMIN ━━ ⌬\n\n⚠️ تم تسجيل المخالفة الثانية لـ ${userName}\n\n❌ لكن تعذر طرده من المجموعة.\n\n📌 الخطأ:\n${error?.message || error}`,
            threadID
          );

        } catch {}

        return;

      }

    }


    /* ==================================================
       حفظ التحذير الأول
    ================================================== */

    writeJSON(
      warningsPath,
      warningsData
    );


    /* ==================================================
       ⚠️ التحذير الأول
    ================================================== */

    try {

      await api.sendMessage(
        `⌬ ━━ HINA ADMIN ━━ ⌬\n\n🔇 تم حذف رسالتك لأن الكلام ممنوع!\n\n👤 ${userName}\n📌 السبب: التحدث أثناء منع الكلام\n🔢 هذا تحذيرك الأول والأخير!\n\n⚠️ المرة القادمة = طرد فوري.`,
        threadID
      );

    } catch (error) {

      console.error(
        "[الكلام] فشل إرسال التحذير:",
        error
      );

    }


  } catch (error) {

    console.error(
      "❌ [الكلام] خطأ عام في handleEvent:",
      error
    );

  }

};