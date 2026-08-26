const moduleName = "فحص";

module.exports.config = {
  name: moduleName,
  version: "6.0.0",
  hasPermssion: 1,
  credits: "أبو هريرة",
  description: "فحص حساب Facebook ومقارنته بروابط مجموعة النفي",
  commandCategory: "admin",
  usages: "فحص رابط الحساب",
  cooldowns: 5
};

// ═══════════════════════════════════════════════
// 🚫 مجموعة النفي
// ═══════════════════════════════════════════════

const NAFY_GROUP_NAME = "| شات حࢪس البوابة |";
const NAFY_THREAD_ID = "1722791398974114";

// عدد الرسائل التي سيتم فحصها
const NAFY_MESSAGES_LIMIT = 1000;


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
// 🆔 استخراج UID من رابط Facebook
// ═══════════════════════════════════════════════

function extractUIDFromURL(url) {

  try {

    const cleanURL = decodeURIComponent(
      String(url).trim()
    );

    // profile.php?id=100...
    try {

      const parsed = new URL(cleanURL);

      const id =
        parsed.searchParams.get("id");

      if (
        id &&
        /^\d+$/.test(id)
      ) {
        return String(id);
      }

    } catch (_) {}

    // احتياط
    const idMatch = cleanURL.match(
      /[?&]id=(\d+)/i
    );

    if (idMatch) {
      return String(idMatch[1]);
    }

    // UID في المسار
    const pathMatch = cleanURL.match(
      /facebook\.com\/(\d{5,})(?:[/?#]|$)/i
    );

    if (pathMatch) {
      return String(pathMatch[1]);
    }

    return null;

  } catch (_) {
    return null;
  }
}


// ═══════════════════════════════════════════════
// 🔗 استخراج روابط Facebook من نص الرسالة
// ═══════════════════════════════════════════════

function extractFacebookLinks(text) {

  if (!text) {
    return [];
  }

  const links = [];

  const regex =
    /https?:\/\/(?:www\.|m\.|mbasic\.)?(?:facebook\.com|fb\.com)\/[^\s<>"']+/gi;

  const matches =
    String(text).match(regex) || [];

  for (let link of matches) {

    // إزالة علامات الترقيم التي قد تكون بعد الرابط
    link = link.replace(
      /[)\]}>,"'،؛.!؟]+$/g,
      ""
    );

    if (!links.includes(link)) {
      links.push(link);
    }
  }

  return links;
}


// ═══════════════════════════════════════════════
// 🆔 استخراج جميع الـUIDات من نص الرسالة
// ═══════════════════════════════════════════════

function extractUIDsFromText(text) {

  const links =
    extractFacebookLinks(text);

  const results = [];

  for (const link of links) {

    const uid =
      extractUIDFromURL(link);

    if (
      uid &&
      !results.includes(uid)
    ) {
      results.push(uid);
    }
  }

  return {
    links,
    uids: results
  };
}


// ═══════════════════════════════════════════════
// 🚫 قراءة رسائل مجموعة النفي
// ═══════════════════════════════════════════════

async function getNafyMessages(api) {

  try {

    if (
      typeof api.getThreadHistory !== "function"
    ) {

      return {
        success: false,
        messages: [],
        error:
          "getThreadHistory غير موجود في API"
      };
    }

    const messages =
      await api.getThreadHistory(
        NAFY_THREAD_ID,
        NAFY_MESSAGES_LIMIT,
        null
      );

    if (!Array.isArray(messages)) {

      return {
        success: false,
        messages: [],
        error:
          "لم يتم إرجاع سجل الرسائل"
      };
    }

    return {
      success: true,
      messages
    };

  } catch (error) {

    console.error(
      "❌ خطأ قراءة رسائل النفي:",
      error.message
    );

    return {
      success: false,
      messages: [],
      error: error.message
    };
  }
}


// ═══════════════════════════════════════════════
// 🔎 البحث عن الحساب داخل روابط النفي
// ═══════════════════════════════════════════════

async function checkNafyLinks(api, targetID) {

  const history =
    await getNafyMessages(api);

  if (!history.success) {

    return {
      success: false,
      denied: false,
      linksChecked: 0,
      messagesChecked: 0,
      error: history.error
    };
  }

  const foundLinks = [];

  let linksChecked = 0;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // قراءة كل الرسائل
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  for (const message of history.messages) {

    if (!message) {
      continue;
    }

    // النص الأساسي
    let text =
      message.body || "";

    // بعض الرسائل قد تحتوي على روابط
    // داخل attachments
    if (
      Array.isArray(message.attachments)
    ) {

      for (
        const attachment
        of message.attachments
      ) {

        if (!attachment) {
          continue;
        }

        if (attachment.url) {
          text += " " + attachment.url;
        }

        if (attachment.href) {
          text += " " + attachment.href;
        }
      }
    }

    const result =
      extractUIDsFromText(text);

    linksChecked +=
      result.links.length;

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // مقارنة UID
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    for (
      let i = 0;
      i < result.uids.length;
      i++
    ) {

      const uid =
        result.uids[i];

      if (
        String(uid) ===
        String(targetID)
      ) {

        foundLinks.push(
          result.links[i]
        );
      }
    }
  }

  return {
    success: true,
    denied: foundLinks.length > 0,
    foundLinks,
    linksChecked,
    messagesChecked:
      history.messages.length
  };
}


// ═══════════════════════════════════════════════
// 🆔 استخراج UID من رابط الحساب المفحوص
// ═══════════════════════════════════════════════

async function extractTargetUID(api, profileURL) {

  // أولًا: استخراج مباشر من الرابط
  const directUID =
    extractUIDFromURL(profileURL);

  if (directUID) {
    return directUID;
  }

  // إذا كان username نستخدم FCA
  if (
    typeof api.getUserID !== "function"
  ) {
    return null;
  }

  try {

    const result =
      await api.getUserID(profileURL);

    if (!result) {
      return null;
    }

    if (Array.isArray(result)) {

      for (
        const item
        of result
      ) {

        if (!item) {
          continue;
        }

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
      "❌ خطأ getUserID:",
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
        `⌬ ━━ HINA CHECK ━━ ⌬\n\n` +
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
        `⌬ ━━ HINA CHECK ━━ ⌬\n\n` +
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
      !isFacebookURL(profileURL)
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
      `🔗 تحليل الرابط\n` +
      `🆔 استخراج UID\n` +
      `👤 التحقق من الحساب\n` +
      `🚫 فحص روابط مجموعة النفي`,
      threadID
    );

    // ═══════════════════════════════════════════════
    // 🆔 UID
    // ═══════════════════════════════════════════════

    const targetID =
      await extractTargetUID(
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
        `⚠️ تعذر فحص الحساب.\n\n` +
        `الحالة: غير محددة`,
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
    // 🚫 فحص روابط النفي
    // ═══════════════════════════════════════════════

    const nafy =
      await checkNafyLinks(
        api,
        targetID
      );

    if (!nafy.success) {

      return api.sendMessage(
        `⌬ ━━ HINA CHECK ━━ ⌬\n\n` +
        `🆔 UID:\n` +
        `${targetID}\n\n` +
        `الحساب: ✓ موجود\n` +
        `روابط النفي: ⚠️ تعذر الفحص\n\n` +
        `🚫 المصدر:\n` +
        `「 ${NAFY_GROUP_NAME} 」\n\n` +
        `🆔 ${NAFY_THREAD_ID}\n\n` +
        `📨 الرسائل المفحوصة: ` +
        `${nafy.messagesChecked}\n\n` +
        `━━━━━━━━━━━━━━\n` +
        `⚠️ الحالة: غير محددة\n` +
        `━━━━━━━━━━━━━━`,
        threadID
      );
    }

    // ═══════════════════════════════════════════════
    // ❌ الرابط موجود في النفي
    // ═══════════════════════════════════════════════

    if (nafy.denied) {

      let foundText = "";

      if (
        nafy.foundLinks &&
        nafy.foundLinks.length
      ) {

        foundText =
          `\n\n🔗 الرابط الموجود في النفي:\n` +
          `${nafy.foundLinks[0]}`;
      }

      return api.sendMessage(
        `⌬ ━━ HINA CHECK ━━ ⌬\n\n` +
        `🆔 UID:\n` +
        `${targetID}\n\n` +
        `الحساب: ✓ موجود\n` +
        `روابط النفي: ✗ موجود\n\n` +
        `🚫 المصدر:\n` +
        `「 ${NAFY_GROUP_NAME} 」\n\n` +
        `📨 تم فحص: ` +
        `${nafy.messagesChecked} رسالة\n` +
        `🔗 تم فحص: ` +
        `${nafy.linksChecked} رابط` +
        foundText +
        `\n\n` +
        `━━━━━━━━━━━━━━\n` +
        `❌ الحالة: مرفوض\n` +
        `━━━━━━━━━━━━━━`,
        threadID
      );
    }

    // ═══════════════════════════════════════════════
    // ✅ غير موجود في روابط النفي
    // ═══════════════════════════════════════════════

    return api.sendMessage(
      `⌬ ━━ HINA CHECK ━━ ⌬\n\n` +
      `🆔 UID:\n` +
      `${targetID}\n\n` +
      `الحساب: ✓ موجود\n` +
      `روابط النفي: ✓ غير موجود\n\n` +
      `🚫 المصدر:\n` +
      `「 ${NAFY_GROUP_NAME} 」\n\n` +
      `📨 الرسائل المفحوصة: ` +
      `${nafy.messagesChecked}\n` +
      `🔗 الروابط المفحوصة: ` +
      `${nafy.linksChecked}\n\n` +
      `━━━━━━━━━━━━━━\n` +
      `🟢 الحالة: مقبول مبدئيًا\n` +
      `━━━━━━━━━━━━━━\n\n` +
      `ملاحظة: اسم الحساب لا يدخل في عملية الفحص.`,
      threadID
    );

  } catch (error) {

    console.error(
      "❌ خطأ في أمر فحص:",
      error
    );

    return api.sendMessage(
      `⌬ ━━ HINA CHECK ━━ ⌬\n\n` +
      `❌ حدث خطأ أثناء تنفيذ الفحص.\n\n` +
      `📝 ${error.message || "خطأ غير معروف"}`,
      threadID,
      messageID
    );
  }
};