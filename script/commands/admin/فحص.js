const axios = require("axios");

module.exports.config = {
  name: "فحص",
  version: "5.0.0",
  hasPermssion: 1,
  credits: "أبو هريرة",
  description: "فحص الحساب والتحقق من وجوده في مجموعة النفي",
  commandCategory: "admin",
  usages: "فحص رابط الحساب",
  cooldowns: 5
};

// ═══════════════════════════════════════════════
// 🚫 مجموعة النفي
// ═══════════════════════════════════════════════

const NAFY_GROUP_NAME = "| شات حࢪس البوابة |";
const NAFY_THREAD_ID = "1722791398974114";

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
// 🆔 استخراج UID من الرابط
// ═══════════════════════════════════════════════

async function extractUID(api, profileURL) {

  try {

    const url = decodeURIComponent(
      String(profileURL).trim()
    );

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // profile.php?id=100...
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
    // احتياط للروابط غير القياسية
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const idMatch = url.match(
      /[?&]id=(\d+)/i
    );

    if (idMatch) {
      return String(idMatch[1]);
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // UID داخل المسار
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const numericPath = url.match(
      /facebook\.com\/(\d{5,})(?:[/?#]|$)/i
    );

    if (numericPath) {
      return String(numericPath[1]);
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // رابط username
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

    // FCA قد يرجع Array
    if (Array.isArray(result)) {

      if (!result.length) {
        return null;
      }

      for (const item of result) {

        if (!item) continue;

        if (item.userID) {
          return String(item.userID);
        }

        if (item.id) {
          return String(item.id);
        }

        if (item.uid) {
          return String(item.uid);
        }
      }
    }

    // Object
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

    // String
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
// 🚫 فحص UID في مجموعة النفي
// ═══════════════════════════════════════════════

async function checkNafy(api, targetID) {

  try {

    const info =
      await api.getThreadInfo(
        NAFY_THREAD_ID
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
      "❌ خطأ فحص مجموعة النفي:",
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
        `📝 الاستخدام:\n\n` +
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
      `3. فحص قائمة النفي`,
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
    // 🚫 فحص مجموعة النفي بالـID مباشرة
    // ═══════════════════════════════════════════════

    const nafy =
      await checkNafy(
        api,
        targetID
      );

    if (!nafy.success) {

      return api.sendMessage(
        `⌬ ━━ HINA CHECK ━━ ⌬\n\n` +
        `🆔 UID:\n` +
        `${targetID}\n\n` +
        `الحساب: ✓ موجود\n` +
        `النفي: ⚠️ تعذر الفحص\n\n` +
        `مجموعة النفي:\n` +
        `「 ${NAFY_GROUP_NAME} 」\n\n` +
        `🆔 ${NAFY_THREAD_ID}\n\n` +
        `━━━━━━━━━━━━━━\n` +
        `⚠️ الحالة: غير محددة\n` +
        `━━━━━━━━━━━━━━`,
        threadID
      );
    }

    // ═══════════════════════════════════════════════
    // ❌ الحساب موجود في مجموعة النفي
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
    // ✅ غير موجود في النفي
    // ═══════════════════════════════════════════════

    return api.sendMessage(
      `⌬ ━━ HINA CHECK ━━ ⌬\n\n` +
      `🆔 UID:\n` +
      `${targetID}\n\n` +
      `الحساب: ✓ موجود\n` +
      `النفي: ✓ غير موجود\n\n` +
      `🚫 مجموعة النفي:\n` +
      `「 ${NAFY_GROUP_NAME} 」\n\n` +
      `━━━━━━━━━━━━━━\n` +
      `🟢 الحالة: مقبول مبدئيًا\n` +
      `━━━━━━━━━━━━━━`,
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