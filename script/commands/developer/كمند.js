const fs = require("fs-extra");
const path = require("path");
const util = require("util");

module.exports.config = {
  name: "كمند",
  version: "2.0.0",
  hasPermssion: 2,
  credits: "انس",
  description: "رفع الأكواد وتجربتها برمجياً",
  commandCategory: "developer",
  usages: "[كود] أو [تنفيذ]",
  cooldowns: 0
};

module.exports.run = async function({ api, event, args, Users, Threads, Currencies, models }) {
  const { threadID, messageID, senderID } = event;
  
  // التحقق من المطور
  if (!global.config.ADMINBOT.includes(senderID)) return;

  const tempPath = path.join(__dirname, "cache", "test_code.js");
  fs.ensureDirSync(path.join(__dirname, "cache"));

  // --- الحالة الأولى: تنفيذ الكود المرفوع مسبقاً ---
  if (args[0] === "تنفيذ") {
    if (!fs.existsSync(tempPath)) {
      return api.sendMessage("⌬ ━━ SOMI ━━ ⌬\n\n❌ لا يوجد كود مرفوع لتنفيذه. ارفع الكود أولاً.", threadID, messageID);
    }
    
    const codeToRun = fs.readFileSync(tempPath, "utf-8");
    return executeCode(codeToRun, "تنفيذ");
  }

  // --- الحالة الثانية: رفع كود جديد وتجربته ---
  const code = args.join(" ");
  if (!code) return api.sendMessage("⌬ ━━ SOMI ━━ ⌬\n\n⚠️ أرسل الكود لرفعه أو اكتب 'تيست تنفيذ'.", threadID, messageID);

  // حفظ الكود في الملف المؤقت للرجوع إليه لاحقاً
  fs.writeFileSync(tempPath, code);
  return executeCode(code, "رفع وتجربة");

  // دالة التنفيذ المركزية
  async function executeCode(codeStr, type) {
    try {
      api.setMessageReaction("⏳", messageID, () => {}, true);
      
      // دالة التقييم
      let evalResult = eval(`(async () => { ${codeStr} })()`);
      
      if (evalResult instanceof Promise) evalResult = await evalResult;

      const output = typeof evalResult !== "string" ? util.inspect(evalResult, { depth: 1 }) : evalResult;

      api.setMessageReaction("✅", messageID, () => {}, true);
      return api.sendMessage(`⌬ ━━ SOMI 𝗧𝗘𝗦𝗧 ━━ ⌬\n\n🔹 الحالة: ${type}\n✅ النتيجة:\n\n${output}`, threadID, messageID);

    } catch (error) {
      api.setMessageReaction("❌", messageID, () => {}, true);
      return api.sendMessage(`⌬ ━━ SOMI 𝗧𝗘𝗦𝗧 ━━ ⌬\n\n❌ خطأ في البرمجة:\n\n${error.message}`, threadID, messageID);
    }
  }
};