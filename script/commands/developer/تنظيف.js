const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "تنظيف",
  version: "1.0.0",
  credits: "أبو هريرة",
  hasPermssion: 2,
  description: "حذف المحادثات التي خرج منها البوت أو تم طرده منها",
  commandCategory: "developer",
  usages: "تنظيف",
  cooldowns: 5
};

// ======================================================
// الإعدادات
// ======================================================

const DEV_ID = "61578581225040";

const DATA_DIR = path.join(process.cwd(), "data");
const LEFT_THREADS_FILE = path.join(
  DATA_DIR,
  "leftThreads.json"
);

fs.ensureDirSync(DATA_DIR);

// ======================================================
// JSON
// ======================================================

function readJSON(file, fallback = {}) {
  try {
    if (!fs.existsSync(file)) {
      return fallback;
    }

    const content = fs
      .readFileSync(file, "utf8")
      .trim();

    if (!content) {
      return fallback;
    }

    return JSON.parse(content);

  } catch (error) {

    console.error(
      "CLEAN READ JSON ERROR:",
      error
    );

    return fallback;
  }
}

function writeJSON(file, data) {
  try {

    fs.writeFileSync(
      file,
      JSON.stringify(data, null, 2),
      "utf8"
    );

    return true;

  } catch (error) {

    console.error(
      "CLEAN WRITE JSON ERROR:",
      error
    );

    return false;
  }
}

// ======================================================
// المطور
// ======================================================

function isDeveloper(senderID) {
  return String(senderID) === DEV_ID;
}

// ======================================================
// الحصول على المجموعات المسجلة
// ======================================================

function getLeftThreads() {

  const data =
    readJSON(
      LEFT_THREADS_FILE,
      {}
    );

  if (
    !data ||
    typeof data !== "object" ||
    Array.isArray(data)
  ) {
    return {};
  }

  return data;
}

// ======================================================
// حذف مجموعة من الملف
// ======================================================

function removeLeftThread(threadID) {

  const id =
    String(threadID);

  const data =
    getLeftThreads();

  if (
    Object.prototype.hasOwnProperty.call(
      data,
      id
    )
  ) {
    delete data[id];
  }

  return writeJSON(
    LEFT_THREADS_FILE,
    data
  );
}

// ======================================================
// حذف المحادثة من حساب البوت
// ======================================================

async function deleteThread(api, threadID) {

  if (
    !api ||
    typeof api.deleteThread !== "function"
  ) {
    return {
      success: false,
      error: "api.deleteThread غير متوفرة في نسخة API الحالية"
    };
  }

  try {

    const id =
      String(threadID);

    await new Promise((resolve, reject) => {

      api.deleteThread(
        id,
        error => {

          if (error) {
            reject(error);
            return;
          }

          resolve();
        }
      );

    });

    return {
      success: true
    };

  } catch (error) {

    /*
     * بعض نسخ الـ API قد تعيد Promise
     * بدل callback
     */

    try {

      await api.deleteThread(
        String(threadID)
      );

      return {
        success: true
      };

    } catch (secondError) {

      return {
        success: false,
        error:
          secondError?.message ||
          error?.message ||
          String(secondError || error)
      };
    }
  }
}

// ======================================================
// RUN
// ======================================================

module.exports.run = async function ({
  api,
  event
}) {

  try {

    // ==================================================
    // حماية المطور
    // ==================================================

    if (
      !isDeveloper(
        event.senderID
      )
    ) {
      return;
    }

    const header =
`⌬ ━━━━━━━━━━━━ ⌬
        🧹 تـنـظـيـف
⌬ ━━━━━━━━━━━━ ⌬`;

    const leftThreads =
      getLeftThreads();

    const threadIDs =
      Object.keys(leftThreads);

    // ==================================================
    // لا توجد محادثات
    // ==================================================

    if (!threadIDs.length) {

      return api.sendMessage(
`${header}

✅ لا توجد محادثات قديمة تحتاج إلى تنظيف.

البوت لا يملك حاليًا محادثات مسجلة لمجموعات خرج منها أو طُرد منها.

⌬ ━━━━━━━━━━━━ ⌬`,
        event.threadID,
        event.messageID
      );
    }

    // ==================================================
    // بدء التنظيف
    // ==================================================

    await api.sendMessage(
`${header}

⏳ جاري تنظيف المحادثات القديمة...

عدد المحادثات:
${threadIDs.length}`,
      event.threadID,
      event.messageID
    );

    let successCount = 0;
    let failedCount = 0;

    const failed = [];

    // ==================================================
    // حذف المحادثات واحدة واحدة
    // ==================================================

    for (
      const threadID of threadIDs
    ) {

      const result =
        await deleteThread(
          api,
          threadID
        );

      if (result.success) {

        successCount++;

        /*
         * تم حذف المحادثة بنجاح
         * لذلك نحذفها من سجل leftThreads
         */

        removeLeftThread(
          threadID
        );

      } else {

        failedCount++;

        failed.push({
          id: threadID,
          error: result.error
        });
      }

      /*
       * تأخير صغير حتى لا يتم إرسال
       * عدد كبير من الطلبات بسرعة
       */

      await new Promise(
        resolve =>
          setTimeout(
            resolve,
            300
          )
      );
    }

    // ==================================================
    // النتيجة
    // ==================================================

    let resultMessage =
`${header}

✅ انتهى التنظيف.

🗑️ تم حذف:
${successCount}

❌ فشل حذف:
${failedCount}`;

    // ==================================================
    // عرض الأخطاء
    // ==================================================

    if (failed.length) {

      resultMessage +=
`

⌬ ━━━━━━━━━━━━ ⌬
المحادثات التي تعذر حذفها:

`;

      for (
        const item of failed
      ) {

        resultMessage +=
`⪼ ${item.id}
${item.error || "خطأ غير معروف"}

`;
      }
    }

    resultMessage +=
`
⌬ ━━━━━━━━━━━━ ⌬`;

    return api.sendMessage(
      resultMessage,
      event.threadID
    );

  } catch (error) {

    console.error(
      "CLEAN ERROR:",
      error
    );

    return api.sendMessage(
`⌬ ━━━━━━━━━━━━ ⌬

❌ حدث خطأ أثناء التنظيف.

${error.message}

⌬ ━━━━━━━━━━━━ ⌃`,
      event.threadID
    );
  }
};