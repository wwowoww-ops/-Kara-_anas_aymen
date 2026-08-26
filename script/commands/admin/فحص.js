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

const NAFY_GROUP_NAME = "| شات حࢪس البوابة |";
const NAFY_THREAD_ID = "1722791398974114";

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

async function extractUID(api, profileURL) {

  try {

    const url = decodeURIComponent(
      String(profileURL).trim()
    );

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

    const idMatch = url.match(
      /[?&]id=(\d+)/i
    );

    if (idMatch) {
      return String(idMatch[1]);
    }

    const numericPath = url.match(
      /facebook\.com\/(\d{5,})(?:[/?#]|$)/i
    );

    if (numericPath) {
      return String(numericPath[1]);
    }

    if (
      typeof api.getUserID !== "function"
    ) {
      return null;
    }

    const result =
      await api.getUserID(url);

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

    await api.sendMessage(
      `⌬ ━━ HINA CHECK ━━ ⌬\n\n` +
      `⏳ جارٍ فحص الحساب...\n\n` +
      `1. استخراج UID\n` +
      `2. فحص الحساب\n` +
      `3. فحص قائمة النفي`,
      threadID
    );

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

    try {

      return api.sendMessage(
        `⌬ ━━ HINA ━━ ⌬\n\n` +
        `❌ حدث خطأ أثناء الفحص.\n\n` +
        `📝 ${error.message || "خطأ غير معروف"}`,
        threadID,
        messageID
      );

    } catch (_) {}
  }
};