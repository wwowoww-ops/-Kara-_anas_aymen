const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

module.exports.config = {
  name: "فحص",
  version: "7.0.0",
  hasPermssion: 1,
  credits: "أبو هريرة",
  description: "فحص حساب Facebook وفق معايير القبول والنفي",
  commandCategory: "admin",
  usages: "فحص رابط الحساب",
  cooldowns: 5
};

// ═══════════════════════════════════════════════
// 🚫 مجموعة النفي
// ═══════════════════════════════════════════════

const NAFY_GROUP_NAME = "| شات حࢪس البوابة |";
const NAFY_THREAD_ID = "1722791398974114";

const MAX_NAFY_MESSAGES = 1000;


// ═══════════════════════════════════════════════
// 🔗 التحقق من رابط Facebook
// ═══════════════════════════════════════════════

function isFacebookURL(url) {

  try {

    const parsed = new URL(url);

    const host = parsed.hostname
      .toLowerCase()
      .replace(/^www\./, "");

    return [
      "facebook.com",
      "m.facebook.com",
      "mbasic.facebook.com",
      "fb.com"
    ].includes(host);

  } catch (_) {

    return false;
  }
}


// ═══════════════════════════════════════════════
// 🆔 استخراج UID من الرابط
// ═══════════════════════════════════════════════

function extractDirectUID(url) {

  try {

    const parsed = new URL(url);

    const id =
      parsed.searchParams.get("id");

    if (
      id &&
      /^\d+$/.test(id)
    ) {

      return String(id);
    }

  } catch (_) {}

  const idMatch =
    String(url).match(
      /[?&]id=(\d+)/i
    );

  if (idMatch) {

    return String(idMatch[1]);
  }

  const numericMatch =
    String(url).match(
      /facebook\.com\/(\d{5,})(?:[/?#]|$)/i
    );

  if (numericMatch) {

    return String(numericMatch[1]);
  }

  return null;
}


// ═══════════════════════════════════════════════
// 🆔 استخراج UID من أي رابط Facebook
// ═══════════════════════════════════════════════

async function extractUID(api, url) {

  // أولًا نحاول الاستخراج المباشر
  const directUID =
    extractDirectUID(url);

  if (directUID) {

    return directUID;
  }

  // روابط username
  if (
    typeof api.getUserID !== "function"
  ) {

    return null;
  }

  try {

    const result =
      await api.getUserID(url);

    if (Array.isArray(result)) {

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
      result &&
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

  } catch (error) {

    console.log(
      "❌ خطأ استخراج UID:",
      error.message
    );
  }

  return null;
}


// ═══════════════════════════════════════════════
// 👤 فحص الحساب + الصورة
// ═══════════════════════════════════════════════

async function checkAccount(api, uid) {

  try {

    if (
      typeof api.getUserInfo !== "function"
    ) {

      return {
        success: false,
        exists: false,
        hasProfilePicture: null,
        name: null
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
        exists: false,
        hasProfilePicture: false,
        name: null
      };
    }

    const user =
      info[uid];

    // لا نستخدم الاسم في قرار القبول
    const name =
      user.name || null;

    // محاولة معرفة صورة الحساب
    let hasProfilePicture = null;

    if (
      user.thumbSrc ||
      user.profileUrl ||
      user.imageSrc ||
      user.avatar
    ) {

      hasProfilePicture = true;

    } else {

      hasProfilePicture = false;
    }

    return {
      success: true,
      exists: true,
      hasProfilePicture,
      name
    };

  } catch (error) {

    console.error(
      "❌ خطأ فحص الحساب:",
      error.message
    );

    return {
      success: false,
      exists: false,
      hasProfilePicture: null,
      name: null
    };
  }
}


// ═══════════════════════════════════════════════
// 🖼️ محاولة الحصول على رابط صورة الحساب
// ═══════════════════════════════════════════════

async function getProfilePicture(api, uid) {

  try {

    if (
      typeof api.getUserInfo !== "function"
    ) {

      return null;
    }

    const info =
      await api.getUserInfo(uid);

    if (
      !info ||
      !info[uid]
    ) {

      return null;
    }

    const user =
      info[uid];

    return (
      user.thumbSrc ||
      user.imageSrc ||
      user.profilePic ||
      user.avatar ||
      null
    );

  } catch (_) {

    return null;
  }
}


// ═══════════════════════════════════════════════
// 🔗 استخراج روابط Facebook من الرسالة
// ═══════════════════════════════════════════════

function extractFacebookLinks(text) {

  if (!text) {

    return [];
  }

  const regex =
    /https?:\/\/(?:www\.|m\.|mbasic\.)?(?:facebook\.com|fb\.com)\/[^\s<>"']+/gi;

  const matches =
    String(text).match(regex) || [];

  return matches.map(link => {

    return link.replace(
      /[)\]}>,"'،؛.!؟]+$/g,
      ""
    );

  });
}


// ═══════════════════════════════════════════════
// 🚫 قراءة روابط مجموعة النفي
// ═══════════════════════════════════════════════

async function checkNafy(api, targetID) {

  try {

    if (
      typeof api.getThreadHistory !== "function"
    ) {

      return {
        success: false,
        denied: false,
        messagesChecked: 0,
        linksChecked: 0
      };
    }

    const messages =
      await api.getThreadHistory(
        NAFY_THREAD_ID,
        MAX_NAFY_MESSAGES,
        null
      );

    if (
      !Array.isArray(messages)
    ) {

      return {
        success: false,
        denied: false,
        messagesChecked: 0,
        linksChecked: 0
      };
    }

    let linksChecked = 0;

    // ═══════════════════════════════════════════
    // 🔍 فحص الرسائل
    // ═══════════════════════════════════════════

    for (
      const message
      of messages
    ) {

      if (!message) {
        continue;
      }

      let text =
        message.body || "";

      // الروابط الموجودة داخل attachments
      if (
        Array.isArray(
          message.attachments
        )
      ) {

        for (
          const attachment
          of message.attachments
        ) {

          if (!attachment) {
            continue;
          }

          if (attachment.url) {

            text +=
              " " +
              attachment.url;
          }

          if (attachment.href) {

            text +=
              " " +
              attachment.href;
          }
        }
      }

      const links =
        extractFacebookLinks(text);

      // ═════════════════════════════════════════
      // 🔗 فحص كل رابط
      // ═════════════════════════════════════════

      for (
        const link
        of links
      ) {

        linksChecked++;

        const uid =
          await extractUID(
            api,
            link
          );

        if (!uid) {
          continue;
        }

        // ═══════════════════════════════════════
        // 🎯 المطابقة
        // ═══════════════════════════════════════

        if (
          String(uid) ===
          String(targetID)
        ) {

          return {
            success: true,
            denied: true,
            foundLink: link,
            messagesChecked:
              messages.length,
            linksChecked
          };
        }
      }
    }

    return {
      success: true,
      denied: false,
      foundLink: null,
      messagesChecked:
        messages.length,
      linksChecked
    };

  } catch (error) {

    console.error(
      "❌ خطأ قراءة مجموعة النفي:",
      error.message
    );

    return {
      success: false,
      denied: false,
      foundLink: null,
      messagesChecked: 0,
      linksChecked: 0
    };
  }
}


// ═══════════════════════════════════════════════
// 📋 تقرير المعايير
// ═══════════════════════════════════════════════

function buildCriteria(
  account,
  nafy,
  uid
) {

  const criteria = [];

  criteria.push(
    "🔗 رابط Facebook: ✓ صالح"
  );

  criteria.push(
    `🆔 استخراج UID: ✓ ${uid}`
  );

  if (account.exists) {

    criteria.push(
      "👤 الحساب قابل للوصول: ✓"
    );

  } else {

    criteria.push(
      "👤 الحساب قابل للوصول: ✗"
    );
  }

  // ═══════════════════════════════════════════
  // 🖼️ صورة الحساب
  // ═══════════════════════════════════════════

  if (
    account.hasProfilePicture === true
  ) {

    criteria.push(
      "🖼️ صورة الحساب: ✓ موجودة"
    );

  } else if (
    account.hasProfilePicture === false
  ) {

    criteria.push(
      "🖼️ صورة الحساب: ✗ غير موجودة"
    );

  } else {

    criteria.push(
      "🖼️ صورة الحساب: ⚠️ تعذر التحقق"
    );
  }

  // ═══════════════════════════════════════════
  // 📅 تاريخ الصورة
  // ═══════════════════════════════════════════

  criteria.push(
    "📅 آخر تغيير لصورة الحساب: ⚠️ غير متاح عبر FCA"
  );

  // ═══════════════════════════════════════════
  // 🚫 النفي
  // ═══════════════════════════════════════════

  if (nafy.success) {

    if (nafy.denied) {

      criteria.push(
        "🚫 موجود في روابط النفي: ✗"
      );

    } else {

      criteria.push(
        "🚫 موجود في روابط النفي: ✓ غير موجود"
      );
    }

  } else {

    criteria.push(
      "🚫 فحص روابط النفي: ⚠️ تعذر التحقق"
    );
  }

  return criteria.join("\n");
}


// ═══════════════════════════════════════════════
// 🚀 الأمر الرئيسي
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

    // ═══════════════════════════════════════════
    // 🔐 صلاحيات الأدمن
    // ═══════════════════════════════════════════

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
        `⛔ هذا الأمر للأدمن فقط.`,
        threadID,
        messageID
      );
    }

    // ═══════════════════════════════════════════
    // 🔗 التحقق من الرابط
    // ═══════════════════════════════════════════

    if (
      !args ||
      !args.length
    ) {

      return api.sendMessage(
        `⌬ ━━ HINA CHECK ━━ ⌬\n\n` +
        `📝 الاستخدام:\n\n` +
        `.فحص رابط الحساب`,
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

    // ═══════════════════════════════════════════
    // ⏳ بداية الفحص
    // ═══════════════════════════════════════════

    await api.sendMessage(
      `⌬ ━━ HINA CHECK ━━ ⌬\n\n` +
      `⏳ جارٍ فحص الحساب...\n\n` +
      `🔗 تحليل الرابط\n` +
      `🆔 استخراج UID\n` +
      `👤 فحص الحساب\n` +
      `🖼️ فحص صورة الحساب\n` +
      `🚫 فحص روابط النفي\n\n` +
      `يرجى الانتظار...`,
      threadID
    );

    // ═══════════════════════════════════════════
    // 🆔 UID
    // ═══════════════════════════════════════════

    const targetID =
      await extractUID(
        api,
        profileURL
      );

    if (!targetID) {

      return api.sendMessage(
        `⌬ ━━ HINA CHECK ━━ ⌬\n\n` +
        `❌ لم أتمكن من استخراج UID من الرابط.`,
        threadID
      );
    }

    // ═══════════════════════════════════════════
    // 👤 الحساب
    // ═══════════════════════════════════════════

    const account =
      await checkAccount(
        api,
        targetID
      );

    if (!account.success) {

      return api.sendMessage(
        `⌬ ━━ HINA CHECK ━━ ⌬\n\n` +
        `🆔 UID: ${targetID}\n\n` +
        `❌ تعذر التحقق من بيانات الحساب.`,
        threadID
      );
    }

    // ═══════════════════════════════════════════
    // 🚫 النفي
    // ═══════════════════════════════════════════

    const nafy =
      await checkNafy(
        api,
        targetID
      );

    // ═══════════════════════════════════════════
    // 📋 التقرير
    // ═══════════════════════════════════════════

    const criteria =
      buildCriteria(
        account,
        nafy,
        targetID
      );

    // ═══════════════════════════════════════════
    // ❌ موجود في النفي
    // ═══════════════════════════════════════════

    if (
      nafy.success &&
      nafy.denied
    ) {

      return api.sendMessage(
        `⌬ ━━ HINA CHECK ━━ ⌬\n\n` +
        `📋 تقرير فحص الحساب\n\n` +
        `${criteria}\n\n` +
        `🚫 مجموعة النفي:\n` +
        `「 ${NAFY_GROUP_NAME} 」\n\n` +
        `🔗 الرابط المطابق:\n` +
        `${nafy.foundLink}\n\n` +
        `━━━━━━━━━━━━━━\n` +
        `❌ النتيجة: مرفوض\n` +
        `━━━━━━━━━━━━━━`,
        threadID
      );
    }

    // ═══════════════════════════════════════════
    // ⚠️ تعذر فحص النفي
    // ═══════════════════════════════════════════

    if (!nafy.success) {

      return api.sendMessage(
        `⌬ ━━ HINA CHECK ━━ ⌬\n\n` +
        `📋 تقرير فحص الحساب\n\n` +
        `${criteria}\n\n` +
        `🚫 المصدر:\n` +
        `「 ${NAFY_GROUP_NAME} 」\n\n` +
        `🆔 ${NAFY_THREAD_ID}\n\n` +
        `━━━━━━━━━━━━━━\n` +
        `⚠️ النتيجة: غير محددة\n` +
        `━━━━━━━━━━━━━━`,
        threadID
      );
    }

    // ═══════════════════════════════════════════
    // ❌ الحساب غير متاح
    // ═══════════════════════════════════════════

    if (!account.exists) {

      return api.sendMessage(
        `⌬ ━━ HINA CHECK ━━ ⌬\n\n` +
        `📋 تقرير فحص الحساب\n\n` +
        `${criteria}\n\n` +
        `━━━━━━━━━━━━━━\n` +
        `❌ النتيجة: مرفوض\n` +
        `━━━━━━━━━━━━━━`,
        threadID
      );
    }

    // ═══════════════════════════════════════════
    // 🖼️ لا توجد صورة
    // ═══════════════════════════════════════════

    if (
      account.hasProfilePicture === false
    ) {

      return api.sendMessage(
        `⌬ ━━ HINA CHECK ━━ ⌬\n\n` +
        `📋 تقرير فحص الحساب\n\n` +
        `${criteria}\n\n` +
        `━━━━━━━━━━━━━━\n` +
        `❌ النتيجة: مرفوض\n` +
        `السبب: لا توجد صورة حساب قابلة للتحقق\n` +
        `━━━━━━━━━━━━━━`,
        threadID
      );
    }

    // ═══════════════════════════════════════════
    // 🟢 مقبول مبدئيًا
    // ═══════════════════════════════════════════

    return api.sendMessage(
      `⌬ ━━ HINA CHECK ━━ ⌬\n\n` +
      `📋 تقرير فحص الحساب\n\n` +
      `${criteria}\n\n` +
      `🚫 مصدر النفي:\n` +
      `「 ${NAFY_GROUP_NAME} 」\n\n` +
      `📨 الرسائل المفحوصة: ` +
      `${nafy.messagesChecked || 0}\n` +
      `🔗 الروابط المفحوصة: ` +
      `${nafy.linksChecked || 0}\n\n` +
      `━━━━━━━━━━━━━━\n` +
      `🟢 النتيجة: مقبول مبدئيًا\n` +
      `━━━━━━━━━━━━━━\n\n` +
      `ملاحظة: اسم الحساب لا يدخل ضمن معايير القبول.`,
      threadID
    );

  } catch (error) {

    console.error(
      "❌ HINA CHECK ERROR:",
      error
    );

    return api.sendMessage(
      `⌬ ━━ HINA CHECK ━━ ⌬\n\n` +
      `❌ حدث خطأ أثناء الفحص.\n\n` +
      `📝 ${error.message || "خطأ غير معروف"}`,
      threadID,
      messageID
    );
  }
};