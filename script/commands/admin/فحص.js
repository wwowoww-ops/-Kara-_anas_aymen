module.exports.config = {
  name: "فحص",
  version: "4.0.0",
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
  return String(url || "")
    .trim()
    .replace(/[)\]}>,"'،؛.!؟]+$/g, "");
}


// ═══════════════════════════════════════════════
// 🔗 التحقق من Facebook
// ═══════════════════════════════════════════════

function isFacebookURL(url) {
  try {
    const parsed = new URL(cleanURL(url));

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
// 🔗 استخراج روابط Facebook
// ═══════════════════════════════════════════════

function extractFacebookLinks(text) {

  if (!text) {
    return [];
  }

  const matches = String(text).match(
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
// 🆔 استخراج UID مباشر من الرابط
// ═══════════════════════════════════════════════

function getDirectUID(url) {

  url = cleanURL(url);

  try {

    const parsed = new URL(url);

    const id = parsed.searchParams.get("id");

    if (
      id &&
      /^\d{5,}$/.test(String(id))
    ) {
      return String(id);
    }

  } catch (_) {}


  const idMatch = url.match(
    /[?&]id=(\d{5,})/i
  );

  if (idMatch) {
    return String(idMatch[1]);
  }


  const numericPath = url.match(
    /(?:facebook\.com|fb\.com)\/(\d{5,})(?:[/?#]|$)/i
  );

  if (numericPath) {
    return String(numericPath[1]);
  }


  return null;
}


// ═══════════════════════════════════════════════
// 👤 استخراج Username
// ═══════════════════════════════════════════════

function getUsernameFromURL(url) {

  try {

    const parsed = new URL(
      cleanURL(url)
    );

    const parts = parsed.pathname
      .split("/")
      .filter(Boolean);

    if (!parts.length) {
      return null;
    }

    const first = parts[0];

    const ignored = [
      "profile.php",
      "share",
      "sharer",
      "dialog",
      "plugins",
      "groups",
      "group",
      "pages",
      "events",
      "watch",
      "marketplace",
      "reel",
      "reels",
      "stories",
      "story",
      "photo",
      "photos",
      "permalink",
      "posts",
      "login",
      "recover",
      "home",
      "friends",
      "messages",
      "settings"
    ];

    if (
      ignored.includes(
        first.toLowerCase()
      )
    ) {
      return null;
    }

    if (/^\d+$/.test(first)) {
      return null;
    }

    return first;

  } catch (_) {
    return null;
  }
}


// ═══════════════════════════════════════════════
// 🧩 تحليل أي نتيجة وإيجاد UID
// ═══════════════════════════════════════════════

function parseUIDResult(result, depth = 0) {

  if (!result || depth > 6) {
    return null;
  }


  // String
  if (typeof result === "string") {

    const value = result.trim();

    if (/^\d{5,}$/.test(value)) {
      return value;
    }

    const match = value.match(
      /\b\d{5,}\b/
    );

    if (match) {
      return match[0];
    }

    return null;
  }


  // Number
  if (typeof result === "number") {

    if (
      Number.isSafeInteger(result) &&
      result >= 10000
    ) {
      return String(result);
    }

    return null;
  }


  // Array
  if (Array.isArray(result)) {

    for (const item of result) {

      const uid = parseUIDResult(
        item,
        depth + 1
      );

      if (uid) {
        return uid;
      }
    }

    return null;
  }


  // Object
  if (typeof result === "object") {

    const keys = [
      "userID",
      "userId",
      "uid",
      "id",
      "authorID",
      "authorId",
      "profileID",
      "profileId",
      "senderID",
      "senderId",
      "participantID",
      "participantId"
    ];


    for (const key of keys) {

      if (
        result[key] !== undefined &&
        result[key] !== null
      ) {

        const value =
          String(result[key]);

        if (/^\d{5,}$/.test(value)) {
          return value;
        }
      }
    }


    const nestedKeys = [
      "data",
      "user",
      "profile",
      "result",
      "results",
      "body",
      "response"
    ];


    for (const key of nestedKeys) {

      if (result[key]) {

        const uid =
          parseUIDResult(
            result[key],
            depth + 1
          );

        if (uid) {
          return uid;
        }
      }
    }
  }


  return null;
}


// ═══════════════════════════════════════════════
// 🆔 استخراج UID متعدد المحاولات
// ═══════════════════════════════════════════════

async function extractUID(api, url) {

  url = cleanURL(url);


  // 1️⃣ UID موجود داخل الرابط
  const directUID =
    getDirectUID(url);

  if (directUID) {

    console.log(
      "[HINA CHECK] DIRECT UID:",
      directUID
    );

    return {
      uid: directUID,
      method: "direct"
    };
  }


  // 2️⃣ استخراج Username
  const username =
    getUsernameFromURL(url);


  if (!username) {

    return {
      uid: null,
      method: "unknown",
      username: null
    };
  }


  console.log(
    "[HINA CHECK] USERNAME:",
    username
  );


  // إذا كانت الدالة غير موجودة
  if (
    typeof api.getUserID !==
    "function"
  ) {

    return {
      uid: null,
      method: "username",
      username
    };
  }


  // ═══════════════════════════════════════════
  // قائمة المحاولات
  // ═══════════════════════════════════════════

  const attempts = [
    url,
    username,
    `https://www.facebook.com/${username}`,
    `https://facebook.com/${username}`,
    `https://m.facebook.com/${username}`,
    `https://mbasic.facebook.com/${username}`
  ];


  const uniqueAttempts = [
    ...new Set(attempts)
  ];


  // ═══════════════════════════════════════════
  // تجربة getUserID
  // ═══════════════════════════════════════════

  for (
    const target
    of uniqueAttempts
  ) {

    try {

      console.log(
        "[HINA CHECK] UID ATTEMPT:",
        target
      );


      const result =
        await api.getUserID(target);


      const uid =
        parseUIDResult(result);


      if (uid) {

        console.log(
          "[HINA CHECK] UID FOUND:",
          uid
        );

        return {
          uid,
          method: "username",
          username
        };
      }

    } catch (error) {

      console.log(
        "[HINA CHECK] ATTEMPT FAILED:",
        target,
        error?.message || error
      );
    }
  }


  // ═══════════════════════════════════════════
  // فشل استخراج UID
  // لكن Username معروف
  // ═══════════════════════════════════════════

  return {
    uid: null,
    method: "username",
    username
  };
}


// ═══════════════════════════════════════════════
// 👤 فحص الحساب بواسطة UID
// ═══════════════════════════════════════════════

async function checkAccountByUID(api, uid) {

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
      picture,
      user
    };

  } catch (error) {

    console.log(
      "[HINA CHECK] ACCOUNT UID ERROR:",
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
// 👤 محاولة فحص Username مباشرة
// ═══════════════════════════════════════════════

async function checkAccountByUsername(
  api,
  username,
  url
) {

  /*
   * هذه المحاولة لا تفترض أن FCA قادر
   * على تحويل Username إلى UID.
   *
   * نجرب getUserInfo بالـUsername فقط
   * إذا كانت نسخة FCA تدعم ذلك.
   */

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


  const attempts = [
    username,
    url,
    `https://www.facebook.com/${username}`
  ];


  for (
    const target
    of [...new Set(attempts)]
  ) {

    try {

      console.log(
        "[HINA CHECK] USERNAME ACCOUNT ATTEMPT:",
        target
      );


      const info =
        await api.getUserInfo(target);


      if (!info) {
        continue;
      }


      /*
       * إذا رجع Object يحتوي UID
       */

      const uid =
        parseUIDResult(info);


      if (uid) {

        const account =
          await checkAccountByUID(
            api,
            uid
          );


        if (account.success) {

          return {
            ...account,
            uid
          };
        }
      }


      /*
       * إذا رجع معلومات مستخدم بدون UID
       */

      if (
        typeof info === "object" &&
        Object.keys(info).length > 0
      ) {

        const firstKey =
          Object.keys(info)[0];

        const user =
          info[firstKey];


        if (
          user &&
          typeof user === "object"
        ) {

          return {
            success: true,
            exists: true,
            picture: Boolean(
              user.thumbSrc ||
              user.imageSrc ||
              user.profilePic ||
              user.profilePicture ||
              user.avatar
            ),
            uid: firstKey
          };
        }
      }

    } catch (error) {

      console.log(
        "[HINA CHECK] USERNAME ACCOUNT ERROR:",
        target,
        error?.message || error
      );
    }
  }


  return {
    success: false,
    exists: false,
    picture: null
  };
}


// ═══════════════════════════════════════════════
// 📜 قراءة تاريخ بوابة النفي
// ═══════════════════════════════════════════════

function getThreadHistory(api) {

  return new Promise(resolve => {

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


    let finished = false;


    const done =
      (error, history) => {

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
                error?.message ||
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
            error?.message ||
            String(error)
        });
      }
    }
  });
}


// ═══════════════════════════════════════════════
// 🔎 استخراج روابط من رسالة
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
  targetUID,
  targetUsername
) {

  const result =
    await getThreadHistory(api);


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

      // ═════════════════════════════════════
      // 1️⃣ مقارنة UID
      // ═════════════════════════════════════

      const directUID =
        getDirectUID(link);


      if (
        targetUID &&
        directUID &&
        String(directUID) ===
        String(targetUID)
      ) {

        foundLinks.push(link);

        continue;
      }


      // ═════════════════════════════════════
      // 2️⃣ تحويل Username إلى UID
      // ═════════════════════════════════════

      if (
        targetUID &&
        !directUID
      ) {

        try {

          const extracted =
            await extractUID(
              api,
              link
            );


          if (
            extracted.uid &&
            String(extracted.uid) ===
            String(targetUID)
          ) {

            foundLinks.push(link);

            continue;
          }

        } catch (_) {}
      }


      // ═════════════════════════════════════
      // 3️⃣ إذا لم نملك UID
      // نقارن Username نفسه
      // ═════════════════════════════════════

      if (
        !targetUID &&
        targetUsername
      ) {

        const foundUsername =
          getUsernameFromURL(
            link
          );


        if (
          foundUsername &&
          foundUsername.toLowerCase() ===
          targetUsername.toLowerCase()
        ) {

          foundLinks.push(link);
        }
      }
    }
  }


  return {
    success: true,
    denied:
      foundLinks.length > 0,
    checked:
      history.length,
    foundLinks: [
      ...new Set(foundLinks)
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
      extractFacebookLinks(text);


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


    // ═══════════════════════════════════════════
    // 🔗 التحقق من الرابط
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
    // ⏳ بدء الفحص
    // ═══════════════════════════════════════════

    await api.sendMessage(
      `⌬ ━━ HINA CHECK ━━ ⌬\n\n` +
      `⏳ جارٍ فحص الحساب...\n\n` +
      `🔗 الرابط ✓\n` +
      `🆔 محاولة استخراج UID ⏳\n` +
      `👤 فحص الحساب\n` +
      `🖼️ فحص الصورة\n` +
      `🚫 فحص بوابة النفي`,
      threadID
    );


    // ═══════════════════════════════════════════
    // 🆔 استخراج UID
    // ═══════════════════════════════════════════

    const identity =
      await extractUID(
        api,
        profileURL
      );


    let uid =
      identity.uid;

    const username =
      identity.username ||
      getUsernameFromURL(
        profileURL
      );


    // ═══════════════════════════════════════════
    // 👤 فحص الحساب
    // ═══════════════════════════════════════════

    let account = null;


    // عند توفر UID
    if (uid) {

      account =
        await checkAccountByUID(
          api,
          uid
        );
    }


    // إذا لم يوجد UID
    // نحاول Username
    if (
      !uid &&
      username
    ) {

      account =
        await checkAccountByUsername(
          api,
          username,
          profileURL
        );


      if (
        account &&
        account.uid
      ) {

        uid =
          String(account.uid);
      }
    }


    // ═══════════════════════════════════════════
    // ❌ الحساب غير قابل للفحص
    // ═══════════════════════════════════════════

    if (
      !account ||
      !account.success
    ) {

      return api.sendMessage(
        `⌬ ━━ HINA CHECK ━━ ⌬\n\n` +

        `📋 تقرير الفحص\n\n` +

        `🔗 الرابط: ✓ صالح\n` +

        `🔎 النوع:\n` +
        `${
          username
            ? `Username: ${username}`
            : "رابط Facebook"
        }\n\n` +

        `${
          uid
            ? `🆔 UID: ${uid}\n`
            : `🆔 UID: ⚠️ غير متاح\n`
        }` +

        `👤 الحساب: ⚠️ تعذر التحقق\n\n` +

        `❌ نسخة FCA الحالية لم تستطع الوصول إلى بيانات الحساب.\n\n` +

        `📌 ملاحظة:\n` +

        `وجود Username لا يعني أن FCA قادر دائمًا على تحويله إلى UID.`,
        threadID,
        messageID
      );
    }


    // ═══════════════════════════════════════════
    // ❌ الحساب غير موجود
    // ═══════════════════════════════════════════

    if (!account.exists) {

      return api.sendMessage(
        `⌬ ━━ HINA CHECK ━━ ⌬\n\n` +

        `📋 تقرير الفحص\n\n` +

        `🔗 الرابط: ✓ صالح\n` +

        `${
          username
            ? `🔎 Username: ${username}\n`
            : ""
        }` +

        `${
          uid
            ? `🆔 UID: ${uid}\n`
            : `🆔 UID: غير متاح\n`
        }` +

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
        uid,
        username
      );


    // ═══════════════════════════════════════════
    // ⚠️ تعذر قراءة النفي
    // ═══════════════════════════════════════════

    if (!nafy.success) {

      return api.sendMessage(
        `⌬ ━━ HINA CHECK ━━ ⌬\n\n` +

        `📋 تقرير الفحص\n\n` +

        `🔗 الرابط: ✓ صالح\n` +

        `${
          username
            ? `🔎 Username: ${username}\n`
            : ""
        }` +

        `${
          uid
            ? `🆔 UID: ${uid}\n`
            : `🆔 UID: ⚠️ غير متاح\n`
        }` +

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

        `${
          username
            ? `🔎 Username: ${username}\n`
            : ""
        }` +

        `${
          uid
            ? `🆔 UID: ${uid}\n`
            : `🆔 UID: غير متاح\n`
        }` +

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
    // 🟢 مقبول
    // ═══════════════════════════════════════════

    return api.sendMessage(
      `⌬ ━━ HINA CHECK ━━ ⌬\n\n` +

      `📋 تقرير فحص الحساب\n\n` +

      `🔗 الرابط: ✓ صالح\n` +

      `${
        username
          ? `🔎 Username:\n${username}\n\n`
          : ""
      }` +

      `${
        uid
          ? `🆔 UID:\n${uid}\n\n`
          : `🆔 UID: ⚠️ غير متاح\n\n`
      }` +

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

      `${
        uid
          ? "✓ UID تم التحقق منه\n"
          : "⚠️ تم التعرف على الحساب بواسطة Username\n"
      }` +

      `✓ الحساب موجود\n` +

      `${
        account.picture === true
          ? "✓ صورة الحساب متاحة\n"
          : "⚠️ تعذر تأكيد صورة مخصصة\n"
      }` +

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