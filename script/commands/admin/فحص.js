const axios = require("axios");

module.exports.config = {
  name: "فحص",
  version: "4.0.0",
  hasPermssion: 1,
  credits: "أبو هريرة",
  description: "فحص حساب Facebook والتحقق من مجموعة النفي",
  commandCategory: "admin",
  usages: "فحص رابط الحساب",
  cooldowns: 5
};

// ═══════════════════════════════════════════════
// 🚫 مجموعة النفي
// الاسم محفوظ حرفيًا
// ═══════════════════════════════════════════════

const NAFY_GROUP_NAME = "| شات حࢪس البوابة |";

// ═══════════════════════════════════════════════
// 🔎 تنظيف الاسم للمقارنة
// لا يحذف | ولا يغير الاسم الأصلي
// ═══════════════════════════════════════════════

function normalizeGroupName(name) {
  if (!name) return "";

  return String(name)
    .replace(/\s+/g, " ")
    .trim();
}

// ═══════════════════════════════════════════════
// 🔗 التحقق من رابط Facebook
// ═══════════════════════════════════════════════

function isFacebookURL(url) {
  try {
    const parsed = new URL(url);

    const host = parsed.hostname
      .toLowerCase()
      .replace(/^www\./, "");

    return (
      host === "facebook.com" ||
      host === "m.facebook.com" ||
      host === "mbasic.facebook.com" ||
      host === "fb.com"
    );

  } catch (_) {
    return false;
  }
}

// ═══════════════════════════════════════════════
// 🆔 استخراج UID
// ═══════════════════════════════════════════════

async function extractUID(api, profileURL) {

  try {

    const url = decodeURIComponent(
      String(profileURL).trim()
    );

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // الحالة الأولى:
    // profile.php?id=100xxxxxxxx
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    try {

      const parsedURL = new URL(url);

      const id =
        parsedURL.searchParams.get("id");

      if (
        id &&
        /^\d+$/.test(id)
      ) {
        return String(id);
      }

    } catch (_) {}

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // احتياط إذا كان الرابط فيه صيغة غير قياسية
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const idMatch = url.match(
      /[?&]id=(\d+)/i
    );

    if (idMatch) {
      return String(idMatch[1]);
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // روابط تحتوي UID في المسار
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const numericPath = url.match(
      /facebook\.com\/(\d{5,})(?:[/?#]|$)/i
    );

    if (numericPath) {
      return String(numericPath[1]);
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // روابط username
    // هنا فقط نستخدم getUserID
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    if (
      typeof api.getUserID !== "function"
    ) {
      return null;
    }

    const result =
      await api.getUserID(url);

    if (!result) {
      return null;
    }

    // FCA قد يعيد Array
    if (Array.isArray(result)) {

      if (!result.length) {
        return null;
      }

      const first = result[0];

      if (first) {

        if (first.userID) {
          return String(first.userID);
        }

        if (first.id) {
          return String(first.id);
        }
      }
    }

    // نتيجة object
    if (
      typeof result === "object"
    ) {

      if (result.userID) {
        return String(result.userID);
      }

      if (result.id) {
        return String(result.id);
      }

      if (result.uid) {
        return String(result.uid);
      }
    }

    // نتيجة string
    if (
      typeof result === "string" &&
      /^\d+$/.test(result)
    ) {
      return result;
    }

    return null;

  } catch (error) {

    console.error(
      "❌ خطأ استخراج UID:",
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

    if (
      typeof api.getUserInfo !== "function"
    ) {
      return {
        success: false,
        exists: false
      };
    }

    const info =
      await api.getUserInfo(uid);

    if (
      !info ||
      !info[uid]
    ) {
      return {
        success: true,
        exists: false
      };
    }

    return {
      success: true,
      exists: true
    };

  } catch (error) {

    console.error(
      "❌ خطأ فحص الحساب:",
      error.message
    );

    return {
      success: false,
      exists: false
    };
  }
}

// ═══════════════════════════════════════════════
// 🔎 البحث عن مجموعة النفي
// ═══════════════════════════════════════════════

async function findNafyGroup(api) {

  try {

    if (
      typeof api.getThreadList !== "function"
    ) {
      console.log(
        "❌ getThreadList غير موجود في API"
      );

      return null;
    }

    const threadList =
      await api.getThreadList(
        1000,
        null,
        ["INBOX"]
      );

    if (
      !Array.isArray(threadList)
    ) {
      return null;
    }

    const wantedName =
      normalizeGroupName(
        NAFY_GROUP_NAME
      );

    const group =
      threadList.find(thread => {

        if (!thread) {
          return false;
        }

        if (!thread.threadID) {
          return false;
        }

        const currentName =
          normalizeGroupName(
            thread.name
          );

        return (
          currentName === wantedName
        );
      });

    return group || null;

  } catch (error) {

    console.error(
      "❌ خطأ البحث عن مجموعة النفي:",
      error.message
    );

    return null;
  }
}

// ═══════════════════════════════════════════════
// 🚫 فحص UID داخل مجموعة النفي
// ═══════════════════════════════════════════════

async function checkNafy(
  api,
  nafyThreadID,
  targetID
) {

  try {

    const info =
      await api.getThreadInfo(
        nafyThreadID
      );

    if (
      !info ||
      !Array.isArray(
        info.participantIDs
      )
    ) {
      return {
        success: false,
        denied: false
      };
    }

    const participants =
      info.participantIDs.map(
        String
      );

    const denied =
      participants.includes(
        String(targetID)
      );

    return {
      success: true,
      denied
    };

  } catch (error) {

    console.error(
      "❌ خطأ فحص النفي:",
      error.message
    );

    return {
      success: false,
      denied: false
    };
  }
}

// ═══════════════════════════════════════════════
// 🚀 أمر فحص
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
      await api.getThreadInfo(
        threadID
      );

    if (!threadInfo) {

      return api.sendMessage(
        `⌬ ━━ HINA ━━ ⌬\n\n` +
        `❌ تعذر الحصول على معلومات المجموعة.`,
        threadID,
        messageID
      );
    }

    const isAdmin =
      Array.isArray(
        threadInfo.adminIDs
      ) &&
      threadInfo.adminIDs.some(
        admin =>
          String(admin.id) ===
          String(senderID)
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

    if (
      !args ||
      !args.length
    ) {

      return api.sendMessage(
        `⌬ ━━ HINA CHECK ━━ ⌬\n\n` +
        `📝 الاستخدام:\n` +
        `.فحص رابط الحساب\n\n` +
        `مثال:\n` +
        `.فحص https://facebook.com/profile.php?id=100000000000000`,
        threadID,
        messageID
      );
    }

    const profileURL =
      args.join(" ").trim();

    if (
      !isFacebookURL(
        profileURL
      )
    ) {

      return api.sendMessage(
        `⌬ ━━ HINA CHECK ━━ ⌬\n\n` +
        `❌ الرابط ليس رابط Facebook صالح.`,
        threadID,
        messageID
      );
    }

    // ═══════════════════════════════════════════════
    // ⏳ بدء الفحص
    // ═══════════════════════════════════════════════

    await api.sendMessage(
      `⌬ ━━ HINA CHECK ━━ ⌬\n\n` +
      `⏳ جارٍ فحص الحساب...\n\n` +
      `1. استخراج UID\n` +
      `2. فحص الحساب\n` +
      `3. فحص مجموعة النفي`,
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
        `تأكد أن الرابط صحيح ويمكن الوصول إليه.`,
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

    if (!account.success) {

      return api.sendMessage(
        `⌬ ━━ HINA CHECK ━━ ⌬\n\n` +
        `🆔 UID: ${targetID}\n\n` +
        `❌ تعذر فحص الحساب.`,
        threadID
      );
    }

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
        `⚠️ لا يمكن إصدار قرار قبول قبل فحص النفي.`,
        threadID
      );
    }

    // ═══════════════════════════════════════════════
    // 🚫 فحص النفي
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
        `🆔 UID:\n` +
        `${targetID}\n\n` +
        `الحساب: ✓ موجود\n` +
        `النفي: ✗ موجود\n\n` +
        `🚫 مجموعة النفي:\n` +
        `「 ${NAFY_GROUP_NAME} 」\n\n` +
        `━━━━━━━━━━━━━━\n` +
        `❌ الحالة: مرفوض\n` +
        `━━━━━━━━━━━━━━`,
        threadID
      );
    }

    // ═══════════════════════════════════════════════
    // 📊 النتيجة
    // ═══════════════════════════════════════════════

    return api.sendMessage(
      `⌬ ━━ HINA CHECK ━━ ⌬\n\n` +
      `🆔 UID:\n` +
      `${targetID}\n\n` +
      `الحساب: ✓ موجود\n` +
      `الوصول: ✓ متاح\n` +
      `النفي: ✓ غير موجود\n\n` +
      `🚫 مجموعة النفي:\n` +
      `「 ${NAFY_GROUP_NAME} 」\n\n` +
      `━━━━━━━━━━━━━━\n` +
      `🟢 الحالة: مقبول مبدئيًا\n` +
      `━━━━━━━━━━━━━━\n\n` +
      `⚠️ لم يتم استخدام اسم الحساب في التقييم.`,
      threadID
    );

  } catch (error) {

    console.error(
      "❌ خطأ في أمر فحص:",
      error
    );

    return api.sendMessage(
      `⌬ ━━ HINA ━━ ⌬\n\n` +
      `❌ حدث خطأ أثناء الفحص.\n\n` +
      `📝 ${error.message || "خطأ غير معروف"}`,
      threadID,
      messageID
    );
  }
};