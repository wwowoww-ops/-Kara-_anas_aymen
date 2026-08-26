const axios = require("axios");

module.exports.config = {
  name: "فحص",
  version: "1.1.0",
  hasPermssion: 1,
  credits: "أبو هريرة",
  description: "فحص حساب Facebook",
  commandCategory: "admin",
  usages: "فحص رابط الحساب أو الرد على رسالة تحتوي رابط",
  cooldowns: 5
};


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
// 🔗 استخراج روابط Facebook من النص
// ═══════════════════════════════════════════════

function extractFacebookLinks(text) {

  if (!text) {
    return [];
  }

  const links =
    String(text).match(
      /https?:\/\/(?:www\.|m\.|mbasic\.)?(?:facebook\.com|fb\.com)\/[^\s<>"']+/gi
    ) || [];

  return links.map(link =>
    link.replace(
      /[)\]}>,"'،؛.!؟]+$/g,
      ""
    )
  );
}


// ═══════════════════════════════════════════════
// 🆔 استخراج UID المباشر
// ═══════════════════════════════════════════════

function getDirectUID(url) {

  try {

    const parsed =
      new URL(url);

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


  const numericPath =
    String(url).match(
      /facebook\.com\/(\d{5,})(?:[/?#]|$)/i
    );

  if (numericPath) {
    return String(numericPath[1]);
  }

  return null;
}


// ═══════════════════════════════════════════════
// 🆔 استخراج UID
// ═══════════════════════════════════════════════

async function extractUID(api, url) {

  const directUID =
    getDirectUID(url);

  if (directUID) {
    return directUID;
  }


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
      "HINA UID ERROR:",
      error.message
    );
  }


  return null;
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
        exists: false,
        picture: null
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
        picture: false
      };
    }


    const user =
      info[uid];


    const picture =
      Boolean(
        user.thumbSrc ||
        user.imageSrc ||
        user.profilePic ||
        user.avatar
      );


    return {
      success: true,
      exists: true,
      picture
    };

  } catch (error) {

    console.log(
      "HINA ACCOUNT ERROR:",
      error.message
    );

    return {
      success: false,
      exists: false,
      picture: null
    };
  }
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
    senderID,
    messageReply
  } = event;


  try {

    // ═══════════════════════════════════════════
    // 🔐 التحقق من الأدمن
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
    // 🔗 البحث عن الرابط
    // ═══════════════════════════════════════════

    let profileURL = null;


    // ───────────────────────────────────────────
    // 1️⃣ الرابط المكتوب مع الأمر
    // ───────────────────────────────────────────

    if (
      args &&
      args.length
    ) {

      const text =
        args.join(" ").trim();

      const links =
        extractFacebookLinks(text);


      if (links.length) {

        profileURL =
          links[0];

      } else if (
        isFacebookURL(text)
      ) {

        profileURL =
          text;
      }
    }


    // ───────────────────────────────────────────
    // 2️⃣ الرابط الموجود في الرسالة المردود عليها
    // ───────────────────────────────────────────

    if (
      !profileURL &&
      messageReply
    ) {

      let replyText =
        messageReply.body || "";


      // النص الأساسي للرسالة
      const replyLinks =
        extractFacebookLinks(
          replyText
        );


      if (replyLinks.length) {

        profileURL =
          replyLinks[0];
      }


      // في حال كان الرابط موجودًا داخل attachment
      if (
        !profileURL &&
        Array.isArray(
          messageReply.attachments
        )
      ) {

        for (
          const attachment
          of messageReply.attachments
        ) {

          if (!attachment) {
            continue;
          }


          const possibleURLs = [
            attachment.url,
            attachment.href,
            attachment.target
          ];


          for (
            const possibleURL
            of possibleURLs
          ) {

            if (
              typeof possibleURL ===
              "string" &&
              isFacebookURL(
                possibleURL
              )
            ) {

              profileURL =
                possibleURL;

              break;
            }
          }


          if (profileURL) {
            break;
          }
        }
      }
    }


    // ═══════════════════════════════════════════
    // ❌ لا يوجد رابط
    // ═══════════════════════════════════════════

    if (!profileURL) {

      return api.sendMessage(
        `⌬ ━━ HINA CHECK ━━ ⌬\n\n` +
        `❌ لم يتم العثور على رابط Facebook.\n\n` +
        `📝 الاستخدام:\n` +
        `.فحص رابط الحساب\n\n` +
        `أو:\n` +
        `↩️ قم بالرد على رسالة تحتوي رابط Facebook ثم اكتب:\n` +
        `.فحص`,
        threadID,
        messageID
      );
    }


    // ═══════════════════════════════════════════
    // 🔗 التحقق النهائي
    // ═══════════════════════════════════════════

    if (
      !isFacebookURL(
        profileURL
      )
    ) {

      return api.sendMessage(
        `⌬ ━━ HINA CHECK ━━ ⌬\n\n` +
        `❌ الرابط المستخرج ليس رابط Facebook صالح.`,
        threadID,
        messageID
      );
    }


    // ═══════════════════════════════════════════
    // ⏳ بدء الفحص
    // ═══════════════════════════════════════════

    await api.sendMessage(
      `⌬ ━━ HINA CHECK ━━ ⌬\n\n` +
      `⏳ جارٍ فحص الحساب...\n\n` +
      `🔗 تحليل الرابط ✓\n` +
      `🆔 استخراج UID ⏳\n` +
      `👤 فحص الحساب\n` +
      `🖼️ فحص صورة الحساب`,
      threadID
    );


    // ═══════════════════════════════════════════
    // 🆔 استخراج UID
    // ═══════════════════════════════════════════

    const uid =
      await extractUID(
        api,
        profileURL
      );


    if (!uid) {

      return api.sendMessage(
        `⌬ ━━ HINA CHECK ━━ ⌬\n\n` +
        `❌ لم أتمكن من استخراج UID من الرابط.\n\n` +
        `🔗 الرابط:\n` +
        `${profileURL}`,
        threadID
      );
    }


    // ═══════════════════════════════════════════
    // 👤 فحص الحساب
    // ═══════════════════════════════════════════

    const account =
      await checkAccount(
        api,
        uid
      );


    if (!account.success) {

      return api.sendMessage(
        `⌬ ━━ HINA CHECK ━━ ⌬\n\n` +
        `🆔 UID: ${uid}\n\n` +
        `⚠️ تعذر الحصول على معلومات الحساب.`,
        threadID
      );
    }


    // ═══════════════════════════════════════════
    // ❌ الحساب غير متاح
    // ═══════════════════════════════════════════

    if (!account.exists) {

      return api.sendMessage(
        `⌬ ━━ HINA CHECK ━━ ⌬\n\n` +
        `📋 تقرير الفحص\n\n` +
        `🔗 رابط Facebook: ✓ صالح\n` +
        `🆔 UID: ${uid}\n` +
        `👤 الحساب: ✗ غير متاح\n` +
        `🖼️ صورة الحساب: ✗\n` +
        `📅 آخر تغيير للصورة: ⚠️ غير متاح\n\n` +
        `━━━━━━━━━━━━━━\n` +
        `❌ النتيجة: مرفوض\n` +
        `━━━━━━━━━━━━━━`,
        threadID
      );
    }


    // ═══════════════════════════════════════════
    // 🖼️ حالة الصورة
    // ═══════════════════════════════════════════

    let pictureStatus;

    if (
      account.picture === true
    ) {

      pictureStatus =
        "✓ موجودة";

    } else if (
      account.picture === false
    ) {

      pictureStatus =
        "⚠️ لم يتم العثور عليها";

    } else {

      pictureStatus =
        "⚠️ تعذر التحقق";
    }


    // ═══════════════════════════════════════════
    // 🟢 النتيجة
    // ═══════════════════════════════════════════

    return api.sendMessage(
      `⌬ ━━ HINA CHECK ━━ ⌬\n\n` +
      `📋 تقرير فحص الحساب\n\n` +

      `🔗 رابط Facebook: ✓ صالح\n` +

      `🆔 UID:\n` +
      `${uid}\n\n` +

      `👤 الحساب: ✓ متاح\n` +

      `🖼️ صورة الحساب: ` +
      `${pictureStatus}\n` +

      `📅 آخر تغيير للصورة:\n` +
      `⚠️ غير متاح عبر FCA\n\n` +

      `━━━━━━━━━━━━━━\n` +
      `🟢 النتيجة: مقبول مبدئيًا\n` +
      `━━━━━━━━━━━━━━\n\n` +

      `ملاحظة: اسم الحساب لا يدخل ضمن معايير الفحص.`,
      threadID
    );


  } catch (error) {

    console.error(
      "HINA CHECK ERROR:",
      error?.message || error
    );


    if (error?.stack) {
      console.error(error.stack);
    }


    try {

      return api.sendMessage(
        `⌬ ━━ HINA CHECK ━━ ⌬\n\n` +
        `❌ حدث خطأ أثناء الفحص.\n\n` +
        `📝 ${error?.message || "خطأ غير معروف"}`,
        threadID,
        messageID
      );

    } catch (_) {}
  }
};