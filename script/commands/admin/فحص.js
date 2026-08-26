module.exports.config = {
  name: "فحص",
  version: "3.0.0",
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

const DEV_ID = "61578581225040";

const NAFY_THREAD_ID = "1722791398974114";

const NAFY_GROUP_NAME = "| شات حࢪس البوابة |";

const NAFY_MESSAGE_LIMIT = 100;


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
// 🔗 التحقق من Facebook
// ═══════════════════════════════════════════════

function isFacebookURL(url) {

  try {

    const parsed =
      new URL(
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
// 🔗 استخراج روابط Facebook
// ═══════════════════════════════════════════════

function extractFacebookLinks(text) {

  if (!text) {
    return [];
  }

  const matches =
    String(text).match(
      /https?:\/\/(?:www\.|m\.|mbasic\.)?(?:facebook\.com|fb\.com)\/[^\s<>"']+/gi
    ) || [];

  return [
    ...new Set(
      matches
        .map(cleanURL)
        .filter(isFacebookURL)
    )
  ];
}


// ═══════════════════════════════════════════════
// 🆔 استخراج UID مباشر
// ═══════════════════════════════════════════════

function getDirectUID(url) {

  url = cleanURL(url);

  // profile.php?id=123
  try {

    const parsed =
      new URL(url);

    const id =
      parsed.searchParams.get("id");

    if (
      id &&
      /^\d{5,}$/.test(
        String(id)
      )
    ) {

      return String(id);
    }

  } catch (_) {}


  // ?id=123
  const idMatch =
    url.match(
      /[?&]id=(\d{5,})/i
    );

  if (idMatch) {

    return String(
      idMatch[1]
    );
  }


  // facebook.com/123456
  const numericPath =
    url.match(
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
// 🔎 استخراج Username من الرابط
// ═══════════════════════════════════════════════

function getUsernameFromURL(url) {

  try {

    const parsed =
      new URL(
        cleanURL(url)
      );

    const parts =
      parsed.pathname
        .split("/")
        .filter(Boolean);


    if (!parts.length) {
      return null;
    }


    const first =
      parts[0];


    // ليست Username
    const ignored = [
      "profile.php",
      "share",
      "sharer",
      "dialog",
      "plugins",
      "groups",
      "pages",
      "events",
      "watch",
      "marketplace",
      "reel",
      "reels",
      "stories",
      "photo",
      "photos",
      "permalink",
      "login",
      "recover"
    ];


    if (
      ignored.includes(
        first.toLowerCase()
      )
    ) {

      return null;
    }


    // رقم = ليس Username
    if (
      /^\d+$/.test(first)
    ) {

      return null;
    }


    return first;

  } catch (_) {

    return null;
  }
}


// ═══════════════════════════════════════════════
// 🧩 تحليل نتيجة getUserID
// ═══════════════════════════════════════════════

function parseUIDResult(result) {

  if (!result) {
    return null;
  }


  // ───────────────────────────────────────────
  // String
  // ───────────────────────────────────────────

  if (
    typeof result === "string"
  ) {

    const value =
      result.trim();


    if (
      /^\d{5,}$/.test(value)
    ) {

      return value;
    }


    // أحيانًا تكون النتيجة نصًا فيها UID
    const match =
      value.match(
        /\b\d{5,}\b/
      );


    if (match) {

      return match[0];
    }


    return null;
  }


  // ───────────────────────────────────────────
  // Number
  // ───────────────────────────────────────────

  if (
    typeof result === "number"
  ) {

    if (
      Number.isSafeInteger(result) &&
      result > 10000
    ) {

      return String(result);
    }

    return null;
  }


  // ───────────────────────────────────────────
  // Array
  // ───────────────────────────────────────────

  if (
    Array.isArray(result)
  ) {

    for (
      const item
      of result
    ) {

      const uid =
        parseUIDResult(item);

      if (uid) {
        return uid;
      }
    }

    return null;
  }


  // ───────────────────────────────────────────
  // Object
  // ───────────────────────────────────────────

  if (
    typeof result === "object"
  ) {

    const keys = [
      "userID",
      "userId",
      "uid",
      "id",
      "authorID",
      "authorId",
      "profileID",
      "profileId"
    ];


    for (
      const key
      of keys
    ) {

      if (
        result[key] !== undefined &&
        result[key] !== null &&
        /^\d{5,}$/.test(
          String(result[key])
        )
      ) {

        return String(
          result[key]
        );
      }
    }


    // data
    if (result.data) {

      const uid =
        parseUIDResult(
          result.data
        );

      if (uid) {
        return uid;
      }
    }


    // user
    if (result.user) {

      const uid =
        parseUIDResult(
          result.user
        );

      if (uid) {
        return uid;
      }
    }


    // result
    if (result.result) {

      const uid =
        parseUIDResult(
          result.result
        );

      if (uid) {
        return uid;
      }
    }
  }


  return null;
}


// ═══════════════════════════════════════════════
// 🆔 استخراج UID
// ═══════════════════════════════════════════════

async function extractUID(api, url) {

  url =
    cleanURL(url);


  // ═══════════════════════════════════════════
  // 1️⃣ UID مباشر
  // ═══════════════════════════════════════════

  const directUID =
    getDirectUID(url);


  if (directUID) {

    console.log(
      "[HINA CHECK] DIRECT UID:",
      directUID
    );

    return directUID;
  }


  // ═══════════════════════════════════════════
  // 2️⃣ التأكد من FCA
  // ═══════════════════════════════════════════

  if (
    typeof api.getUserID !==
    "function"
  ) {

    console.log(
      "[HINA CHECK] getUserID غير موجودة"
    );

    return null;
  }


  // ═══════════════════════════════════════════
  // 3️⃣ تجهيز المحاولات
  // ═══════════════════════════════════════════

  const attempts = [];


  // الرابط الكامل
  attempts.push(url);


  // Username
  const username =
    getUsernameFromURL(url);


  if (username) {

    attempts.push(
      username
    );

    attempts.push(
      `https://www.facebook.com/${username}`
    );

    attempts.push(
      `https://facebook.com/${username}`
    );
  }


  // ═══════════════════════════════════════════
  // 4️⃣ إزالة التكرار
  // ═══════════════════════════════════════════

  const uniqueAttempts =
    [
      ...new Set(
        attempts
      )
    ];


  // ═══════════════════════════════════════════
  // 5️⃣ تجربة FCA
  // ═══════════════════════════════════════════

  for (
    const target
    of uniqueAttempts
  ) {

    try {

      console.log(
        "[HINA CHECK] GET USER ID:",
        target
      );


      const result =
        await api.getUserID(
          target
        );


      const uid =
        parseUIDResult(
          result
        );


      if (uid) {

        console.log(
          "[HINA CHECK] UID FOUND:",
          uid
        );

        return uid;
      }

    } catch (error) {

      console.log(
        "[HINA CHECK] UID ATTEMPT ERROR:",
        target,
        error?.message ||
        error
      );
    }
  }


  // ═══════════════════════════════════════════
  // 6️⃣ فشل
  // ═══════════════════════════════════════════

  console.log(
    "[HINA CHECK] UID NOT FOUND:",
    url
  );


  return null;
}


// ═══════════════════════════════════════════════
// 👤 فحص الحساب
// ═══════════════════════════════════════════════

async function checkAccount(
  api,
  uid
) {

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
      await api.getUserInfo(
        String(uid)
      );


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
      error?.message ||
      error
    );


    return {
      success: false,
      exists: false,
      picture: null
    };
  }
}


// ═══════════════════════════════════════════════
// 📜 قراءة سجل بوابة النفي
// ═══════════════════════════════════════════════

function getThreadHistory(api) {

  return new Promise(
    resolve => {

      if (
        typeof api.getThreadHistory !==
        "function"
      ) {

        resolve({
          success: false,
          history: [],
          error:
            "getThreadHistory غير متوفرة في FCA"
        });

        return;
      }


      let finished =
        false;


      const done =
        (
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
                error?.message ||
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

        const result =
          api.getThreadHistory(
            NAFY_THREAD_ID,
            NAFY_MESSAGE_LIMIT,
            undefined,
            done
          );


        if (
          result &&
          typeof result.then ===
          "function"
        ) {

          result
            .then(
              history => {

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

              }
            )
            .catch(
              error => {

                if (finished) {
                  return;
                }


                finished = true;


                resolve({
                  success: false,
                  history: [],
                  error:
                    error?.message ||
                    String(error)
                });
              }
            );
        }


      } catch (error) {

        if (!finished) {

          finished = true;


          resolve({
            success: false,
            history: [],
            error:
              error?.message ||
              String(error)
          });
        }
      }
    }
  );
}


// ═══════════════════════════════════════════════
// 🔎 استخراج الروابط من الرسائل
// ═══════════════════════════════════════════════

function extractLinksFromMessage(message) {

  const links = [];


  if (!message) {
    return links;
  }


  // النص
  if (message.body) {

    links.push(
      ...extractFacebookLinks(
        message.body
      )
    );
  }


  // Attachments
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


      const values = [
        attachment.url,
        attachment.href,
        attachment.target,
        attachment.facebookUrl,
        attachment.profileUrl
      ];


      for (
        const value
        of values
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


  // Reply
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

async function checkNafy(
  api,
  targetUID
) {

  const result =
    await getThreadHistory(
      api
    );


  if (!result.success) {

    return {
      success: false,
      denied: false,
      checked: 0,
      foundLinks: [],
      error: result.error
    };
  }


  const history =
    result.history;


  const foundLinks = [];


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

      const directUID =
        getDirectUID(
          link
        );


      // UID مباشر
      if (
        directUID &&
        String(directUID) ===
        String(targetUID)
      ) {

        foundLinks.push(
          link
        );

        continue;
      }


      // Username
      if (
        !directUID &&
        typeof api.getUserID ===
        "function"
      ) {

        try {

          const extractedUID =
            await extractUID(
              api,
              link
            );


          if (
            extractedUID &&
            String(extractedUID) ===
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
      [
        ...new Set(
          foundLinks
        )
      ]
  };
}


// ═══════════════════════════════════════════════
// 🔗 الحصول على رابط الحساب
// ═══════════════════════════════════════════════

function getProfileURL(
  event,
  args
) {

  // من الأمر
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


  // من الرد
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

module.exports.run =
async function({
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
    // 🔐 الصلاحيات
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


    const isDeveloper =
      String(senderID) ===
      String(DEV_ID);


    const isAdmin =
      Array.isArray(
        threadInfo.adminIDs
      ) &&
      threadInfo.adminIDs.some(
        admin =>
          String(admin.id) ===
          String(senderID)
      );


    if (
      !isDeveloper &&
      !isAdmin
    ) {

      return api.sendMessage(
        `⌬ ━━ HINA CHECK ━━ ⌬\n\n` +
        `⛔ هذا الأمر للأدمن والمطور فقط.`,
        threadID,
        messageID
      );
    }


    // ═══════════════════════════════════════════
    // 🔗 الرابط
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
        `.فحص https://facebook.com/username\n\n` +
        `أو قم بالرد على رسالة تحتوي رابط Facebook واكتب:\n` +
        `.فحص`,
        threadID,
        messageID
      );
    }


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
    // ⏳ بدء الفحص
    // ═══════════════════════════════════════════

    await api.sendMessage(
      `⌬ ━━ HINA CHECK ━━ ⌬\n\n` +
      `⏳ جارٍ فحص الحساب...\n\n` +
      `🔗 الرابط ✓\n` +
      `🆔 استخراج UID ⏳\n` +
      `👤 الحساب\n` +
      `🖼️ الصورة\n` +
      `🚫 بوابة النفي`,
      threadID
    );


    // ═══════════════════════════════════════════
    // 🆔 UID
    // ═══════════════════════════════════════════

    const uid =
      await extractUID(
        api,
        profileURL
      );


    if (!uid) {

      const username =
        getUsernameFromURL(
          profileURL
        );


      let type =
        "رابط Facebook";


      if (username) {

        type =
          `Username: ${username}`;

      } else if (
        /\/share\//i.test(
          profileURL
        )
      ) {

        type =
          "Facebook Share Link";
      }


      return api.sendMessage(
        `⌬ ━━ HINA CHECK ━━ ⌬\n\n` +

        `📋 تقرير الفحص\n\n` +

        `🔗 الرابط: ✓ صالح\n` +

        `🔎 النوع:\n` +
        `${type}\n\n` +

        `🆔 UID: ✗ تعذر استخراجه\n\n` +

        `⚠️ FCA لم يُرجع UID لهذا الرابط.\n` +
        `❌ لا يمكن إكمال الفحص بدون UID.\n\n` +

        `📌 إذا كان الرابط Username،` +
        ` فالمشكلة في قدرة نسخة FCA الحالية على تحويل Username إلى UID.`,
        threadID,
        messageID
      );
    }


    // ═══════════════════════════════════════════
    // 👤 الحساب
    // ═══════════════════════════════════════════

    const account =
      await checkAccount(
        api,
        uid
      );


    if (!account.success) {

      return api.sendMessage(
        `⌬ ━━ HINA CHECK ━━ ⌬\n\n` +
        `📋 تقرير الفحص\n\n` +
        `🔗 الرابط: ✓ صالح\n` +
        `🆔 UID: ${uid}\n` +
        `👤 الحساب: ⚠️ تعذر التحقق\n\n` +
        `❌ لا يمكن إصدار نتيجة نهائية.`,
        threadID,
        messageID
      );
    }


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
        threadID,
        messageID
      );
    }


    // ═══════════════════════════════════════════
    // 🖼️ الصورة
    // ═══════════════════════════════════════════

    let pictureStatus =
      "⚠️ تعذر التحقق";


    if (
      account.picture === true
    ) {

      pictureStatus =
        "✓ متاحة";

    } else if (
      account.picture === false
    ) {

      pictureStatus =
        "✗ غير متاحة";
    }


    // ═══════════════════════════════════════════
    // 🚫 النفي
    // ═══════════════════════════════════════════

    const nafy =
      await checkNafy(
        api,
        uid
      );


    if (!nafy.success) {

      return api.sendMessage(
        `⌬ ━━ HINA CHECK ━━ ⌬\n\n` +

        `📋 تقرير الفحص\n\n` +

        `🔗 الرابط: ✓ صالح\n` +
        `🆔 UID: ${uid}\n` +
        `👤 الحساب: ✓ موجود\n` +
        `🖼️ صورة الحساب: ${pictureStatus}\n\n` +

        `🚫 بوابة النفي:\n` +
        `⚠️ تعذر قراءة الرسائل\n` +

        `「 ${NAFY_GROUP_NAME} 」\n\n` +

        `📨 المطلوب: آخر ${NAFY_MESSAGE_LIMIT} رسالة\n\n` +

        `━━━━━━━━━━━━━━\n` +
        `⚠️ النتيجة: غير محددة\n` +
        `━━━━━━━━━━━━━━`,
        threadID,
        messageID
      );
    }


    // ═══════════════════════════════════════════
    // ❌ موجود في النفي
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
        `🖼️ صورة الحساب: ${pictureStatus}\n\n` +

        `🚫 بوابة النفي: ✗ موجود\n` +
        `「 ${NAFY_GROUP_NAME} 」\n\n` +

        `📨 تم فحص: ${nafy.checked} رسالة\n\n` +

        `🔎 الرابط المطابق:\n` +
        `${nafy.foundLinks[0] || "غير متاح"}\n\n` +

        `━━━━━━━━━━━━━━\n` +
        `❌ النتيجة: مرفوض\n` +
        `━━━━━━━━━━━━━━`,
        threadID,
        messageID
      );
    }


    // ═══════════════════════════════════════════
    // 🟢 النتيجة
    // ═══════════════════════════════════════════

    return api.sendMessage(
      `⌬ ━━ HINA CHECK ━━ ⌬\n\n` +

      `📋 تقرير فحص الحساب\n\n` +

      `🔗 الرابط: ✓ صالح\n` +
      `🆔 UID:\n${uid}\n\n` +

      `👤 الحساب: ✓ موجود\n` +
      `🖼️ صورة الحساب: ${pictureStatus}\n\n` +

      `🚫 بوابة النفي:\n` +
      `✓ غير موجود\n` +

      `「 ${NAFY_GROUP_NAME} 」\n\n` +

      `📨 تم فحص آخر ${nafy.checked} رسالة\n\n` +

      `━━━━━━━━━━━━━━\n` +
      `🟢 النتيجة: مقبول مبدئيًا\n` +
      `━━━━━━━━━━━━━━\n\n` +

      `📌 معايير الفحص:\n` +
      `✓ رابط Facebook صالح\n` +
      `✓ UID مستخرج\n` +
      `✓ الحساب موجود\n` +
      `${account.picture === true ? "✓" : "⚠️"} صورة الحساب\n` +
      `✓ غير موجود ضمن روابط بوابة النفي\n\n` +

      `ملاحظة: اسم الحساب لا يدخل ضمن معايير الفحص.`,
      threadID,
      messageID
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