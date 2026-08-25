const axios = require("axios");

module.exports.config = {
  name: "فحص",
  version: "3.0.0",
  hasPermssion: 1,
  credits: "أبو هريرة",
  description: "فحص الحساب والتحقق من مجموعة النفي ومعايير القبول",
  commandCategory: "admin",
  usages: "فحص رابط الحساب",
  cooldowns: 5
};

// ═══════════════════════════════════════════════
// 🚫 مجموعة النفي - الاسم مطابق تمامًا
// ═══════════════════════════════════════════════

const NAFY_GROUP_NAME = "| شات حࢪس البوابة |";

// ═══════════════════════════════════════════════
// 🔎 تنظيف اسم المجموعة للمقارنة فقط
// ملاحظة: لا نغير الاسم الأصلي المخزن
// ═══════════════════════════════════════════════

function normalizeGroupName(name) {
  if (!name) return "";

  return String(name)
    .replace(/\s+/g, " ")
    .trim();
}

// ═══════════════════════════════════════════════
// 🔎 البحث عن مجموعة النفي
// ═══════════════════════════════════════════════

async function findNafyGroup(api) {
  try {

    if (typeof api.getThreadList !== "function") {
      return null;
    }

    const threadList = await api.getThreadList(
      1000,
      null,
      ["INBOX"]
    );

    if (!Array.isArray(threadList)) {
      return null;
    }

    const wantedName =
      normalizeGroupName(NAFY_GROUP_NAME);

    const group = threadList.find(thread => {

      if (!thread) return false;

      if (!thread.threadID) return false;

      if (thread.isGroup === false) {
        return false;
      }

      const currentName =
        normalizeGroupName(thread.name);

      return currentName === wantedName;
    });

    return group || null;

  } catch (error) {

    console.error(
      "❌ خطأ في البحث عن مجموعة النفي:",
      error.message
    );

    return null;
  }
}

// ═══════════════════════════════════════════════
// 🆔 استخراج UID من الرابط
// ═══════════════════════════════════════════════

async function extractUID(api, url) {

  try {

    if (typeof api.getUserID !== "function") {
      return null;
    }

    const result =
      await api.getUserID(url);

    if (!result) {
      return null;
    }

    if (typeof result === "string") {
      return result;
    }

    if (result.id) {
      return String(result.id);
    }

    if (result.uid) {
      return String(result.uid);
    }

    return null;

  } catch (error) {

    console.error(
      "❌ خطأ في استخراج UID:",
      error.message
    );

    return null;
  }
}

// ═══════════════════════════════════════════════
// 👤 فحص الحساب
// ═══════════════════════════════════════════════

async function checkAccount(api, uid) {

  try {

    const info =
      await api.getUserInfo(uid);

    if (
      !info ||
      !info[uid]
    ) {
      return {
        exists: false,
        accessible: false,
        data: false
      };
    }

    return {
      exists: true,
      accessible: true,
      data: true
    };

  } catch (error) {

    console.log(
      "⚠️ تعذر الحصول على معلومات الحساب:",
      error.message
    );

    return {
      exists: false,
      accessible: false,
      data: false
    };
  }
}

// ═══════════════════════════════════════════════
// 🚫 فحص UID داخل مجموعة النفي
// ═══════════════════════════════════════════════

async function checkNafy(api, threadID, uid) {

  try {

    const info =
      await api.getThreadInfo(threadID);

    if (
      !info ||
      !Array.isArray(info.participantIDs)
    ) {
      return {
        success: false,
        denied: false
      };
    }

    const members =
      info.participantIDs.map(String);

    const denied =
      members.includes(String(uid));

    return {
      success: true,
      denied
    };

  } catch (error) {

    console.error(
      "❌ خطأ في فحص مجموعة النفي:",
      error.message
    );

    return {
      success: false,
      denied: false
    };
  }
}

// ═══════════════════════════════════════════════
// 🚀 أمر الفحص
// ═══════════════════════════════════════════════

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

  try {

    // ═══════════════════════════════════════════════
    // 🔐 التحقق من الأدمن
    // ═══════════════════════════════════════════════

    const threadInfo =
      await api.getThreadInfo(threadID);

    if (!threadInfo) {

      return api.sendMessage(
        `⌬ ━━ HINA ━━ ⌬\n\n` +
        `❌ تعذر الحصول على معلومات المجموعة.`,
        threadID,
        messageID
      );
    }

    const isAdmin =
      Array.isArray(threadInfo.adminIDs) &&
      threadInfo.adminIDs.some(
        admin =>
          String(admin.id) === String(senderID)
      );

    if (!isAdmin) {

      return api.sendMessage(
        `⌬ ━━ HINA ━━ ⌬\n\n` +
        `⛔ هذا الأمر للأدمن فقط!`,
        threadID,
        messageID
      );
    }

    // ═══════════════════════════════════════════════
    // 🔗 التحقق من الرابط
    // ═══════════════════════════════════════════════

    if (!args || args.length === 0) {

      return api.sendMessage(
        `⌬ ━━ HINA CHECK ━━ ⌬\n\n` +
        `📝 الاستخدام:\n\n` +
        `.فحص رابط الحساب\n\n` +
        `مثال:\n` +
        `.فحص https://facebook.com/example`,
        threadID,
        messageID
      );
    }

    const profileURL =
      args.join(" ").trim();

    if (
      !profileURL.includes("facebook.com") &&
      !profileURL.includes("fb.com")
    ) {

      return api.sendMessage(
        `⌬ ━━ HINA CHECK ━━ ⌬\n\n` +
        `❌ الرابط ليس رابط Facebook صالح.`,
        threadID,
        messageID
      );
    }

    // ═══════════════════════════════════════════════
    // ⏳ رسالة الفحص
    // ═══════════════════════════════════════════════

    await api.sendMessage(
      `⌬ ━━ HINA CHECK ━━ ⌬\n\n` +
      `⏳ جارٍ فحص الحساب...\n` +
      `🔎 يتم التحقق من الحساب وقائمة النفي.`,
      threadID
    );

    // ═══════════════════════════════════════════════
    // 🆔 استخراج UID
    // ═══════════════════════════════════════════════

    const targetID =
      await extractUID(
        api,
        profileURL
      );

    if (!targetID) {

      return api.sendMessage(
        `⌬ ━━ HINA CHECK ━━ ⌬\n\n` +
        `❌ لم أتمكن من استخراج UID من الرابط.\n\n` +
        `تأكد من أن الرابط صحيح ويمكن الوصول إليه.`,
        threadID
      );
    }

    // ═══════════════════════════════════════════════
    // 👤 فحص الحساب
    // ═══════════════════════════════════════════════

    const account =
      await checkAccount(
        api,
        targetID
      );

    if (!account.exists) {

      return api.sendMessage(
        `⌬ ━━ HINA CHECK ━━ ⌬\n\n` +
        `🆔 UID: ${targetID}\n\n` +
        `الحساب: ✗ غير متاح\n\n` +
        `━━━━━━━━━━━━━━\n` +
        `❌ الحالة: مرفوض\n` +
        `━━━━━━━━━━━━━━`,
        threadID
      );
    }

    // ═══════════════════════════════════════════════
    // 🔎 العثور على مجموعة النفي
    // ═══════════════════════════════════════════════

    const nafyGroup =
      await findNafyGroup(api);

    if (
      !nafyGroup ||
      !nafyGroup.threadID
    ) {

      return api.sendMessage(
        `⌬ ━━ HINA CHECK ━━ ⌬\n\n` +
        `🆔 UID: ${targetID}\n\n` +
        `الحساب: ✓ موجود\n\n` +
        `🚫 مجموعة النفي:\n` +
        `「 ${NAFY_GROUP_NAME} 」\n\n` +
        `❌ لم أتمكن من العثور على المجموعة.\n\n` +
        `⚠️ لن يتم إصدار قرار قبول بدون فحص النفي.`,
        threadID
      );
    }

    // ═══════════════════════════════════════════════
    // 🚫 فحص مجموعة النفي
    // ═══════════════════════════════════════════════

    const nafy =
      await checkNafy(
        api,
        nafyGroup.threadID,
        targetID
      );

    if (!nafy.success) {

      return api.sendMessage(
        `⌬ ━━ HINA CHECK ━━ ⌬\n\n` +
        `🆔 UID: ${targetID}\n\n` +
        `الحساب: ✓ موجود\n` +
        `مجموعة النفي: ⚠️ تعذر الفحص\n\n` +
        `━━━━━━━━━━━━━━\n` +
        `⚠️ الحالة: غير محددة\n` +
        `━━━━━━━━━━━━━━`,
        threadID
      );
    }

    // ═══════════════════════════════════════════════
    // ❌ موجود في النفي
    // ═══════════════════════════════════════════════

    if (nafy.denied) {

      return api.sendMessage(
        `⌬ ━━ HINA CHECK ━━ ⌬\n\n` +
        `🆔 UID: ${targetID}\n\n` +
        `الحساب: ✓ موجود\n` +
        `مجموعة النفي: ✗ موجود\n\n` +
        `🚫 المجموعة:\n` +
        `「 ${NAFY_GROUP_NAME} 」\n\n` +
        `━━━━━━━━━━━━━━\n` +
        `❌ الحالة: مرفوض\n` +
        `━━━━━━━━━━━━━━`,
        threadID
      );
    }

    // ═══════════════════════════════════════════════
    // 📊 التقييم المبدئي
    // ═══════════════════════════════════════════════

    let score = 0;
    const maxScore = 3;

    if (account.exists) {
      score++;
    }

    if (account.accessible) {
      score++;
    }

    if (account.data) {
      score++;
    }

    let risk = "";

    if (score === 3) {
      risk = "🟢 منخفضة";
    } else if (score === 2) {
      risk = "🟡 متوسطة";
    } else {
      risk = "🔴 مرتفعة";
    }

    // ═══════════════════════════════════════════════
    // ✅ النتيجة
    // ═══════════════════════════════════════════════

    return api.sendMessage(

      `⌬ ━━ HINA CHECK ━━ ⌬\n\n` +

      `🆔 UID:\n` +
      `${targetID}\n\n` +

      `الحساب: ✓ موجود\n` +
      `الوصول: ✓ متاح\n` +
      `البيانات: ✓ متاحة\n` +
      `النفي: ✓ غير موجود\n\n` +

      `🚫 مجموعة النفي:\n` +
      `「 ${NAFY_GROUP_NAME} 」\n\n` +

      `━━━━━━━━━━━━━━\n` +
      `📊 النقاط: ${score}/${maxScore}\n` +
      `⚠️ المخاطرة: ${risk}\n` +
      `━━━━━━━━━━━━━━\n\n` +

      `✅ الحالة: مقبول مبدئيًا\n\n` +

      `ملاحظة:\n` +
      `هذا الفحص يعتمد على البيانات التي يستطيع البوت الوصول إليها، ` +
      `ولا يمثل قرار Facebook الداخلي.`,

      threadID
    );

  } catch (error) {

    console.error(
      "❌ خطأ في أمر فحص:",
      error
    );

    return api.sendMessage(
      `⌬ ━━ HINA ━━ ⌬\n\n` +
      `❌ حدث خطأ أثناء فحص الحساب.`,
      threadID,
      messageID
    );
  }
};