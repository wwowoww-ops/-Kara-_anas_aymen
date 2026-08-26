module.exports.config = {
  name: "فحص",
  version: "2.2.0",
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
// 👤 استخراج Username من الرابط
// ═══════════════════════════════════════════════

function getUsernameFromURL(url) {

  try {

    const parsed =
      new URL(url);

    const host =
      parsed.hostname
        .toLowerCase()
        .replace(/^www\./, "");

    if (
      host !== "facebook.com" &&
      host !== "m.facebook.com" &&
      host !== "mbasic.facebook.com" &&
      host !== "fb.com"
    ) {

      return null;
    }

    const parts =
      parsed.pathname
        .split("/")
        .filter(Boolean);

    if (!parts.length) {
      return null;
    }

    const first =
      parts[0];

    const reserved = [
      "profile.php",
      "people",
      "pages",
      "groups",
      "share",
      "sharer",
      "watch",
      "photo",
      "photos",
      "reel",
      "reels",
      "story",
      "stories",
      "marketplace",
      "events",
      "gaming",
      "login",
      "home"
    ];

    if (
      reserved.includes(
        first.toLowerCase()
      )
    ) {

      return null;
    }

    return first;

  } catch (_) {

    return null;
  }
}


// ═══════════════════════════════════════════════
// 🔢 البحث عن UID داخل نتيجة FCA
// ═══════════════════════════════════════════════

function findUIDInResult(result) {

  if (!result) {
    return null;
  }


  // String
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

    return null;
  }


  // Array
  if (
    Array.isArray(result)
  ) {

    for (
      const item
      of result
    ) {

      const found =
        findUIDInResult(item);

      if (found) {
        return found;
      }
    }

    return null;
  }


  // Object
  if (
    typeof result === "object"
  ) {

    const keys = [
      "userID",
      "userId",
      "uid",
      "id",
      "profileID",
      "profileId",
      "entityID",
      "entityId"
    ];


    for (
      const key
      of keys
    ) {

      const value =
        result[key];

      if (
        value !== undefined &&
        value !== null &&
        /^\d{5,}$/.test(
          String(value)
        )
      ) {

        return String(value);
      }
    }


    // بعض إصدارات FCA ترجع كائنًا
    // مفاتيحه نفسها هي الـUID
    for (
      const key
      of Object.keys(result)
    ) {

      if (
        /^\d{5,}$/.test(key)
      ) {

        return key;
      }
    }
  }


  return null;
}


// ═══════════════════════════════════════════════
// 🆔 استخراج UID من جميع أنواع الروابط
// ═══════════════════════════════════════════════

async function extractUID(api, url) {

  const originalURL =
    cleanURL(url);


  // ═══════════════════════════════════════════
  // 1️⃣ UID موجود داخل الرابط
  // ═══════════════════════════════════════════

  const directUID =
    getDirectUID(
      originalURL
    );

  if (directUID) {

    return directUID;
  }


  if (
    typeof api.getUserID !==
    "function"
  ) {

    console.log(
      "[HINA CHECK] api.getUserID غير متوفرة"
    );

    return null;
  }


  // ═══════════════════════════════════════════
  // 2️⃣ تجهيز روابط متعددة للتجربة
  // ═══════════════════════════════════════════

  const attempts = [];

  const addAttempt = value => {

    if (
      !value ||
      typeof value !== "string"
    ) {

      return;
    }

    const cleaned =
      cleanURL(value);

    if (
      !attempts.includes(cleaned)
    ) {

      attempts.push(cleaned);
    }
  };


  // الرابط الأصلي
  addAttempt(
    originalURL
  );


  // الرابط بدون www
  try {

    const parsed =
      new URL(
        originalURL
      );

    const hostname =
      parsed.hostname
        .replace(/^www\./, "");

    addAttempt(
      `https://${hostname}${parsed.pathname}${parsed.search}${parsed.hash}`
    );

  } catch (_) {}


  // ═══════════════════════════════════════════
  // 3️⃣ تجربة username
  // ═══════════════════════════════════════════

  const username =
    getUsernameFromURL(
      originalURL
    );


  if (username) {

    addAttempt(
      username
    );

    addAttempt(
      `https://www.facebook.com/${username}`
    );

    addAttempt(
      `https://facebook.com/${username}`
    );

    addAttempt(
      `https://www.facebook.com/profile.php?username=${encodeURIComponent(username)}`
    );
  }


  // ═══════════════════════════════════════════
  // 4️⃣ تجربة كل صيغة مع FCA
  // ═══════════════════════════════════════════

  for (
    const attempt
    of attempts
  ) {

    try {

      console.log(
        "[HINA CHECK] UID ATTEMPT:",
        attempt
      );


      const result =
        await api.getUserID(
          attempt
        );


      const found =
        findUIDInResult(
          result
        );


      if (found) {

        console.log(
          "[HINA CHECK] UID FOUND:",
          found
        );

        return found;
      }

    } catch (error) {

      console.log(
        "[HINA CHECK] UID ATTEMPT ERROR:",
        attempt,
        error?.message || error
      );
    }
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


    /*
     * ملاحظة:
     * هذه القيمة تثبت توفر صورة من FCA
     * لكنها لا تثبت وحدها أن الصورة مخصصة.
     */

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
      error?.message || error
    );

    return {
      success: false,
      exists: false,
      picture: null
    };
  }
}


// ═══════════════════════════════════════════════
// 📜 قراءة آخر 100 رسالة
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
            "getThreadHistory غير متوفرة في نسخة FCA"
        });

        return;
      }


      let finished = false;


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
// 🔎 استخراج الروابط من الرسالة
// ═══════════════════════════════════════════════

function extractLinksFromMessage(message) {

  const links = [];

  if (!message) {
    return links;
  }


  if (message.body) {

    links.push(
      ...extractFacebookLinks(
        message.body
      )
    );
  }


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

      `🔗 صلاحية الرابط ✓\n` +
      `🆔 استخراج UID ⏳\n` +
      `👤 وجود الحساب\n` +
      `🖼️ صورة الحساب\n` +
      `🚫 قراءة آخر ${NAFY_MESSAGE_LIMIT} رسالة من بوابة النفي`,
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

        `📋 تقرير الفحص\n\n` +

        `🔗 الرابط: ✓ صالح\n` +
        `🆔 UID: ✗ تعذر استخراجه\n\n` +

        `🔎 نوع الرابط:\n` +
        `${
          getUsernameFromURL(profileURL)
            ? "Username"
            : "رابط غير رقمي"
        }\n\n` +

        `⚠️ FCA لم يُرجع UID لهذا الرابط.\n` +
        `❌ لا يمكن إكمال الفحص بدون UID.`,
        threadID,
        messageID
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

        `📋 تقرير الفحص\n\n` +

        `🔗 الرابط: ✓ صالح\n` +
        `🆔 UID: ${uid}\n` +
        `👤 الحساب: ⚠️ تعذر التحقق\n\n` +

        `❌ لا يمكن إصدار نتيجة نهائية.`,
        threadID,
        messageID
      );
    }


    // ═══════════════════════════════════════════
    // ❌ الحساب غير متاح
    // ═══════════════════════════════════════════

    if (
      !account.exists
    ) {

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
    // 🖼️ حالة الصورة
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
    // 🚫 فحص بوابة النفي
    // ═══════════════════════════════════════════

    const nafy =
      await checkNafy(
        api,
        uid
      );


    // ═══════════════════════════════════════════
    // ⚠️ تعذر قراءة النفي
    // ═══════════════════════════════════════════

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

      `「 ${NAFY_GROUP_NAME} 」\n\n` +

      `📨 تم فحص آخر ${nafy.checked} رسالة\n\n` +

      `━━━━━━━━━━━━━━\n` +
      `🟢 النتيجة: مقبول مبدئيًا\n` +
      `━━━━━━━━━━━━━━\n\n` +

      `📌 معايير الفحص:\n` +
      `✓ رابط Facebook صالح\n` +
      `✓ الحساب موجود\n` +
      `${account.picture === true ? "✓" : "⚠️"} صورة الحساب متاحة\n` +
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