module.exports.config = {
  name: "فحص",
  version: "2.0.0",
  hasPermssion: 1,
  credits: "أبو هريرة",
  description: "فحص حساب Facebook والتحقق من بوابة النفي",
  commandCategory: "admin",
  usages: "فحص رابط الحساب أو الرد على رسالة تحتوي رابط",
  cooldowns: 5
};


// ═══════════════════════════════════════════════
// ⚙️ الإعدادات
// ═══════════════════════════════════════════════

const NAFY_THREAD_ID = "1722791398974114";
const NAFY_GROUP_NAME = "| شات حࢪس البوابة |";
const NAFY_MESSAGE_LIMIT = 100;


// ═══════════════════════════════════════════════
// 🔗 التحقق من رابط Facebook
// ═══════════════════════════════════════════════

function isFacebookURL(url) {

  try {

    const parsed = new URL(
      String(url).trim()
    );

    const host =
      parsed.hostname
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
// 🔗 تنظيف الرابط
// ═══════════════════════════════════════════════

function cleanURL(url) {

  return String(url)
    .trim()
    .replace(
      /[)\]}>,"'،؛.!؟]+$/g,
      ""
    );
}


// ═══════════════════════════════════════════════
// 🔗 استخراج روابط Facebook من نص
// ═══════════════════════════════════════════════

function extractFacebookLinks(text) {

  if (!text) {
    return [];
  }

  const matches =
    String(text).match(
      /https?:\/\/(?:www\.|m\.|mbasic\.)?(?:facebook\.com|fb\.com)\/[^\s<>"']+/gi
    ) || [];

  return matches
    .map(cleanURL)
    .filter(isFacebookURL);
}


// ═══════════════════════════════════════════════
// 🆔 استخراج UID من الرابط مباشرة
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

    return String(
      idMatch[1]
    );
  }


  const numericPath =
    String(url).match(
      /(?:facebook\.com|fb\.com)\/(\d{5,})(?:[/?#]|$)/i
    );

  if (numericPath) {

    return String(
      numericPath[1]
    );
  }


  return null;
}


// ═══════════════════════════════════════════════
// 🆔 استخراج UID
// ═══════════════════════════════════════════════

async function extractUID(api, url) {

  // الروابط التي تحتوي UID مباشرة
  const directUID =
    getDirectUID(url);

  if (directUID) {

    return directUID;
  }


  // روابط username
  if (
    typeof api.getUserID !==
    "function"
  ) {

    return null;
  }


  try {

    const result =
      await api.getUserID(url);


    if (Array.isArray(result)) {

      for (
        const item of result
      ) {

        if (!item) {
          continue;
        }

        if (item.userID) {
          return String(
            item.userID
          );
        }

        if (item.id) {
          return String(
            item.id
          );
        }

        if (item.uid) {
          return String(
            item.uid
          );
        }
      }
    }


    if (
      result &&
      typeof result === "object"
    ) {

      if (result.userID) {
        return String(
          result.userID
        );
      }

      if (result.id) {
        return String(
          result.id
        );
      }

      if (result.uid) {
        return String(
          result.uid
        );
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
      "[HINA CHECK] UID ERROR:",
      error.message
    );
  }


  return null;
}


// ═══════════════════════════════════════════════
// 👤 فحص الحساب والصورة
// ═══════════════════════════════════════════════

async function checkAccount(api, uid) {

  try {

    if (
      typeof api.getUserInfo !==
      "function"
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
        user.profilePicture ||
        user.avatar
      );


    return {
      success: true,
      exists: true,
      picture
    };

  } catch (error) {

    console.log(
      "[HINA CHECK] ACCOUNT ERROR:",
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
// 📜 قراءة آخر 100 رسالة من بوابة النفي
// ═══════════════════════════════════════════════

function getThreadHistory(api) {

  return new Promise(
    (resolve) => {

      if (
        typeof api.getThreadHistory !==
        "function"
      ) {

        resolve({
          success: false,
          history: [],
          error:
            "getThreadHistory غير متوفرة"
        });

        return;
      }


      let finished = false;


      const done = (
        error,
        history
      ) => {

        if (finished) {
          return;
        }

        finished = true;


        if (error) {

          resolve({
            success: false,
            history: [],
            error:
              error.message ||
              String(error)
          });

          return;
        }


        resolve({
          success: true,
          history:
            Array.isArray(history)
              ? history
              : []
        });
      };


      try {

        /*
         * getThreadHistory:
         * threadID
         * amount = 100
         * timestamp = undefined
         * callback
         */

        const result =
          api.getThreadHistory(
            NAFY_THREAD_ID,
            NAFY_MESSAGE_LIMIT,
            undefined,
            done
          );


        // دعم بعض إصدارات FCA التي ترجع Promise
        if (
          result &&
          typeof result.then ===
          "function"
        ) {

          result
            .then(history => {

              if (finished) {
                return;
              }

              finished = true;

              resolve({
                success: true,
                history:
                  Array.isArray(history)
                    ? history
                    : []
              });

            })
            .catch(error => {

              if (finished) {
                return;
              }

              finished = true;

              resolve({
                success: false,
                history: [],
                error:
                  error.message ||
                  String(error)
              });

            });
        }

      } catch (error) {

        if (!finished) {

          finished = true;

          resolve({
            success: false,
            history: [],
            error:
              error.message ||
              String(error)
          });
        }
      }
    }
  );
}


// ═══════════════════════════════════════════════
// 🔎 البحث عن روابط داخل رسالة
// ═══════════════════════════════════════════════

function extractLinksFromMessage(message) {

  const links = [];


  if (!message) {
    return links;
  }


  // نص الرسالة
  if (message.body) {

    links.push(
      ...extractFacebookLinks(
        message.body
      )
    );
  }


  // بعض نسخ FCA تضع الرابط في attachment
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


      const possibleValues = [
        attachment.url,
        attachment.href,
        attachment.target,
        attachment.facebookUrl,
        attachment.profileUrl
      ];


      for (
        const value
        of possibleValues
      ) {

        if (
          typeof value ===
          "string"
        ) {

          links.push(
            ...extractFacebookLinks(
              value
            )
          );
        }
      }
    }
  }


  // دعم أي رسالة مقتبسة/مرتبطة
  if (
    message.messageReply
  ) {

    links.push(
      ...extractLinksFromMessage(
        message.messageReply
      )
    );
  }


  if (
    message.replyToMessage
  ) {

    links.push(
      ...extractLinksFromMessage(
        message.replyToMessage
      )
    );
  }


  return [
    ...new Set(
      links.map(cleanURL)
    )
  ];
}


// ═══════════════════════════════════════════════
// 🚫 فحص بوابة النفي
// ═══════════════════════════════════════════════

async function checkNafy(api, targetUID) {

  const result =
    await getThreadHistory(api);


  if (!result.success) {

    return {
      success: false,
      denied: false,
      checked: 0,
      error: result.error
    };
  }


  const history =
    result.history;


  const foundLinks = [];


  // ───────────────────────────────────────────
  // قراءة الرسائل
  // ───────────────────────────────────────────

  for (
    const message
    of history
  ) {

    const links =
      extractLinksFromMessage(
        message
      );


    for (
      const link
      of links
    ) {

      const uid =
        getDirectUID(link);


      // إذا كان الرابط يحتوي UID مباشرة
      if (
        uid &&
        String(uid) ===
        String(targetUID)
      ) {

        foundLinks.push(
          link
        );

        continue;
      }


      /*
       * إذا كان الرابط username
       * نحاول استخراج UID منه.
       *
       * يتم التعامل مع الأخطاء
       * بدون إيقاف أمر الفحص.
       */

      if (
        !uid &&
        typeof api.getUserID ===
        "function"
      ) {

        try {

          const extracted =
            await extractUID(
              api,
              link
            );


          if (
            extracted &&
            String(extracted) ===
            String(targetUID)
          ) {

            foundLinks.push(
              link
            );
          }

        } catch (_) {}
      }
    }
  }


  return {
    success: true,
    denied:
      foundLinks.length > 0,
    checked:
      history.length,
    foundLinks:
      [...new Set(foundLinks)]
  };
}


// ═══════════════════════════════════════════════
// 🔗 الحصول على الرابط من الأمر أو الرد
// ═══════════════════════════════════════════════

function getProfileURL(event, args) {

  // ───────────────────────────────────────────
  // الرابط مع الأمر
  // ───────────────────────────────────────────

  if (
    args &&
    args.length
  ) {

    const text =
      args.join(" ").trim();


    const links =
      extractFacebookLinks(
        text
      );


    if (links.length) {

      return links[0];
    }


    if (
      isFacebookURL(text)
    ) {

      return cleanURL(text);
    }
  }


  // ───────────────────────────────────────────
  // الرابط داخل الرسالة المردود عليها
  // ───────────────────────────────────────────

  if (
    event.messageReply
  ) {

    const links =
      extractLinksFromMessage(
        event.messageReply
      );


    if (links.length) {

      return links[0];
    }
  }


  return null;
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
    // 🔗 الحصول على الرابط
    // ═══════════════════════════════════════════

    const profileURL =
      getProfileURL(
        event,
        args
      );


    if (!profileURL) {

      return api.sendMessage(
        `⌬ ━━ HINA CHECK ━━ ⌬\n\n` +
        `❌ لم يتم العثور على رابط Facebook.\n\n` +

        `📝 الاستخدام:\n` +
        `.فحص https://facebook.com/profile.php?id=...\n\n` +

        `أو قم بالرد على رسالة تحتوي رابط Facebook واكتب:\n` +
        `.فحص`,
        threadID,
        messageID
      );
    }


    // ═══════════════════════════════════════════
    // 🔗 صلاحية الرابط
    // ═══════════════════════════════════════════

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
    // ⏳ رسالة الفحص
    // ═══════════════════════════════════════════

    await api.sendMessage(
      `⌬ ━━ HINA CHECK ━━ ⌬\n\n` +
      `⏳ جارٍ فحص الحساب...\n\n` +

      `🔗 صلاحية الرابط ✓\n` +
      `🆔 استخراج UID ⏳\n` +
      `👤 وجود الحساب\n` +
      `🖼️ صورة الحساب\n` +
      `🚫 آخر 100 رسالة من بوابة النفي`,
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

        `🔗 الرابط: ✓ صالح\n` +
        `🆔 UID: ✗ تعذر استخراجه\n\n` +

        `❌ لا يمكن إكمال الفحص.`,
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

        `🔗 الرابط: ✓ صالح\n` +
        `🆔 UID: ${uid}\n` +
        `👤 الحساب: ⚠️ تعذر التحقق\n\n` +

        `❌ لا يمكن إصدار نتيجة نهائية.`,
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

        `🔗 الرابط: ✓ صالح\n` +
        `🆔 UID: ${uid}\n` +
        `👤 الحساب: ✗ غير متاح\n` +
        `🖼️ صورة الحساب: ✗\n` +
        `🚫 بوابة النفي: —\n\n` +

        `━━━━━━━━━━━━━━\n` +
        `❌ النتيجة: مرفوض\n` +
        `━━━━━━━━━━━━━━`,
        threadID
      );
    }


    // ═══════════════════════════════════════════
    // 🖼️ حالة الصورة
    // ═══════════════════════════════════════════

    let pictureStatus =
      "⚠️ تعذر التحقق";


    if (
      account.picture === true
    ) {

      pictureStatus =
        "✓ موجودة";

    } else if (
      account.picture === false
    ) {

      pictureStatus =
        "✗ غير موجودة";
    }


    // ═══════════════════════════════════════════
    // 🚫 فحص بوابة النفي
    // ═══════════════════════════════════════════

    const nafy =
      await checkNafy(
        api,
        uid
      );


    // ═══════════════════════════════════════════
    // ⚠️ تعذر قراءة بوابة النفي
    // ═══════════════════════════════════════════

    if (!nafy.success) {

      return api.sendMessage(
        `⌬ ━━ HINA CHECK ━━ ⌬\n\n` +

        `📋 تقرير الفحص\n\n` +

        `🔗 الرابط: ✓ صالح\n` +
        `🆔 UID: ${uid}\n` +
        `👤 الحساب: ✓ موجود\n` +
        `🖼️ صورة الحساب: ${pictureStatus}\n` +

        `🚫 بوابة النفي:\n` +
        `⚠️ تعذر قراءة الرسائل\n` +

        `「 ${NAFY_GROUP_NAME} 」\n\n` +

        `📨 المطلوب فحصه: آخر ${NAFY_MESSAGE_LIMIT} رسالة\n\n` +

        `━━━━━━━━━━━━━━\n` +
        `⚠️ النتيجة: غير محددة\n` +
        `━━━━━━━━━━━━━━`,
        threadID
      );
    }


    // ═══════════════════════════════════════════
    // ❌ موجود في بوابة النفي
    // ═══════════════════════════════════════════

    if (
      nafy.denied
    ) {

      return api.sendMessage(
        `⌬ ━━ HINA CHECK ━━ ⌬\n\n` +

        `📋 تقرير الفحص\n\n` +

        `🔗 الرابط: ✓ صالح\n` +
        `🆔 UID: ${uid}\n` +
        `👤 الحساب: ✓ موجود\n` +
        `🖼️ صورة الحساب: ${pictureStatus}\n` +

        `🚫 بوابة النفي: ✗ موجود\n` +

        `「 ${NAFY_GROUP_NAME} 」\n\n` +

        `📨 تم فحص: ${nafy.checked} رسالة\n` +

        `🔎 الرابط المطابق:\n` +
        `${nafy.foundLinks[0] || "غير متاح"}\n\n` +

        `━━━━━━━━━━━━━━\n` +
        `❌ النتيجة: مرفوض\n` +
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

      `🔗 الرابط: ✓ صالح\n` +
      `🆔 UID:\n${uid}\n\n` +

      `👤 الحساب: ✓ موجود\n` +
      `🖼️ صورة الحساب: ${pictureStatus}\n` +

      `🚫 بوابة النفي:\n` +
      `✓ غير موجود\n` +
      `「 ${NAFY_GROUP_NAME} 」\n` +

      `📨 تم فحص آخر ${nafy.checked} رسالة\n\n` +

      `━━━━━━━━━━━━━━\n` +
      `🟢 النتيجة: مقبول مبدئيًا\n` +
      `━━━━━━━━━━━━━━\n\n` +

      `📌 معايير الفحص:\n` +
      `✓ رابط Facebook صالح\n` +
      `✓ الحساب موجود\n` +
      `${account.picture === true ? "✓" : "⚠️"} صورة الحساب\n` +
      `✓ غير موجود في روابط بوابة النفي\n\n` +

      `ملاحظة: اسم الحساب لا يدخل ضمن معايير الفحص.`,
      threadID
    );


  } catch (error) {

    console.error(
      "[HINA CHECK ERROR]",
      error
    );


    try {

      return api.sendMessage(
        `⌬ ━━ HINA CHECK ━━ ⌬\n\n` +
        `❌ حدث خطأ أثناء الفحص.\n\n` +
        `📝 ${
          error?.message ||
          "خطأ غير معروف"
        }`,
        threadID,
        messageID
      );

    } catch (_) {}
  }
};