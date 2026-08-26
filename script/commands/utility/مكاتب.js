const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "مكاتب",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "عرض مكتبات البوت ووظيفة كل مكتبة",
  commandCategory: "utility",
  usages: "مكاتب",
  cooldowns: 5
};

// ==================================================
// 📚 معلومات المكتبات المعروفة
// ==================================================

const libraryInfo = {

  axios:
    "إرسال واستقبال طلبات HTTP والتعامل مع APIs",

  "fs-extra":
    "إدارة الملفات والمجلدات والقراءة والكتابة",

  fs:
    "إدارة الملفات في Node.js",

  path:
    "التعامل مع مسارات الملفات والمجلدات",

  jimp:
    "معالجة الصور وتعديلها وتركيب الصور",

  sharp:
    "معالجة الصور وضغطها وتحويل صيغها",

  express:
    "إنشاء Web Server وواجهات HTTP",

  "groq-sdk":
    "التعامل مع واجهة Groq والذكاء الاصطناعي",

  mongoose:
    "التعامل مع MongoDB باستخدام Mongoose",

  mongodb:
    "الاتصال بقاعدة بيانات MongoDB",

  "form-data":
    "إنشاء وإرسال بيانات Form عبر HTTP",

  moment:
    "التعامل مع التاريخ والوقت",

  "moment-timezone":
    "التعامل مع التاريخ والوقت والمناطق الزمنية",

  cheerio:
    "تحليل HTML واستخراج البيانات منه",

  "node-fetch":
    "إرسال طلبات HTTP من Node.js",

  canvas:
    "إنشاء ومعالجة الصور باستخدام Canvas",

  "yt-search":
    "البحث عن الفيديوهات في YouTube",

  "string-similarity":
    "حساب درجة التشابه بين النصوص",

  lodash:
    "أدوات مساعدة لمعالجة المصفوفات والبيانات",

  uuid:
    "إنشاء معرفات فريدة وعشوائية",

  "crypto-js":
    "التشفير وإنشاء الهاش",

  "node-cron":
    "تشغيل مهام تلقائية في أوقات محددة",

  chalk:
    "تنسيق وتلوين النصوص في Console",

  ora:
    "عرض مؤشرات التحميل في Console",

  readline:
    "التعامل مع الإدخال من Console",

  dotenv:
    "قراءة المتغيرات السرية من ملف البيئة .env"

};


// ==================================================
// 🚀 الأمر
// ==================================================

module.exports.run = async function ({
  api,
  event
}) {

  const {
    threadID,
    messageID
  } = event;

  try {

    const packagePath =
      path.join(
        process.cwd(),
        "package.json"
      );


    // ==================================================
    // التأكد من وجود package.json
    // ==================================================

    if (
      !fs.existsSync(
        packagePath
      )
    ) {

      return api.sendMessage(

        `⌬ ━━ 𝗛𝗜𝗡𝗔 UTILITY ━━ ⌬

❌ لم يتم العثور على package.json

تأكد أن الأمر يعمل من مجلد البوت.`,

        threadID,
        messageID

      );

    }


    // ==================================================
    // قراءة package.json
    // ==================================================

    const packageData =
      JSON.parse(
        fs.readFileSync(
          packagePath,
          "utf8"
        )
      );


    // ==================================================
    // جلب المكتبات
    // ==================================================

    const dependencies =
      packageData.dependencies || {};

    const devDependencies =
      packageData.devDependencies || {};


    const libraries = {
      ...dependencies,
      ...devDependencies
    };


    const names =
      Object.keys(
        libraries
      );


    if (
      names.length === 0
    ) {

      return api.sendMessage(

        `⌬ ━━ 𝗛𝗜𝗡𝗔 UTILITY ━━ ⌬

❌ لم يتم العثور على مكتبات في package.json.`,

        threadID,
        messageID

      );

    }


    // ==================================================
    // إنشاء الرسالة
    // ==================================================

    let message =
      `⌬ ━━ 𝗛𝗜𝗡𝗔 UTILITY ━━ ⌬\n\n`;

    message +=
      `📚 مـكـتـبـات الـبـوت\n`;

    message +=
      `━━━━━━━━━━━━━━━━━━\n\n`;


    names.forEach(
      (name, index) => {

        const version =
          libraries[name];


        const description =
          libraryInfo[name] ||
          "مكتبة خارجية مستخدمة من أحد أنظمة البوت.";


        message +=
          `${index + 1} ┃ ${name}\n`;

        message +=
          `   الإصدار: ${version}\n`;

        message +=
          `   الوظيفة: ${description}\n\n`;

      }
    );


    // ==================================================
    // الإحصائيات
    // ==================================================

    const dependencyCount =
      Object.keys(
        dependencies
      ).length;


    const devCount =
      Object.keys(
        devDependencies
      ).length;


    message +=
      `━━━━━━━━━━━━━━━━━━\n`;

    message +=
      `📊 إجمالي المكتبات: ${names.length}\n`;

    message +=
      `📦 Dependencies: ${dependencyCount}\n`;

    message +=
      `🛠️ Dev Dependencies: ${devCount}`;


    // ==================================================
    // إرسال
    // ==================================================

    return api.sendMessage(
      message,
      threadID,
      messageID
    );


  } catch (error) {

    console.error(
      "[HINA مكاتب ERROR]",
      error
    );


    return api.sendMessage(

      `⌬ ━━ 𝗛𝗜𝗡𝗔 UTILITY ━━ ⌬

❌ حدث خطأ أثناء قراءة مكتبات البوت.

📝 ${error.message}`,

      threadID,
      messageID

    );

  }

};