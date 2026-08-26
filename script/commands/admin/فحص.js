const axios = require("axios");

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

// مدة حفظ Username → UID في الذاكرة
const UID_CACHE_TIME = 30 * 60 * 1000;

const uidCache = new Map();


// ═══════════════════════════════════════════════
// 🔗 تنظيف الرابط
// ═══════════════════════════════════════════════

function cleanURL(url) {
  return String(url)
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
// 🔗 استخراج روابط Facebook من النص
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
// 🔎 استخراج Username
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
      "recover",
      "notifications",
      "settings",
      "home"
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
// 🧩 تحليل أي نتيجة وإيجاد UID بداخلها
// ═══════════════════════════════════════════════

function parseUIDResult(result, depth = 0) {

  if (
    result === null ||
    result === undefined ||
    depth > 8
  ) {
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

    return match
      ? match[0]
      : null;
  }


  // Number
  if (typeof result === "number") {

    if (
      Number.isSafeInteger(result) &&
      result > 10000
    ) {
      return String(result);
    }

    return null;
  }


  // Array
  if (Array.isArray(result)) {

    for (const item of result) {

      const uid =
        parseUIDResult(
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
      "userid",
      "uid",
      "id",
      "authorID",
      "authorId",
      "profileID",
      "profileId",
      "user_id",
      "userId"
    ];

    for (const key of keys) {

      if (
        result[key] !== undefined &&
        result[key] !== null
      ) {

        const value =
          String(result[key]);

        if (
          /^\d{5,}$/.test(value)
        ) {
          return value;
        }
      }
    }


    // البحث داخل أشهر الحقول
    const nestedKeys = [
      "data",
      "user",
      "profile",
      "result",
      "body",
      "payload",
      "response"
    ];

    for (const key of nestedKeys) {

      if (
        result[key] !== undefined &&
        result[key] !== null
      ) {

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
// 💾 Cache
// ═══════════════════════════════════════════════

function getCachedUID(key) {

  const item =
    uidCache.get(
      String(key).toLowerCase()
    );

  if (!item) {
    return null;
  }

  if (
    Date.now() - item.time >
    UID_CACHE_TIME
  ) {

    uidCache.delete(
      String(key).toLowerCase()
    );

    return null;
  }

  return item.uid;
}


function saveCachedUID(key, uid) {

  if (!key || !uid) {
    return;
  }

  uidCache.set(
    String(key).toLowerCase(),
    {
      uid: String(uid),
      time: Date.now()
    }
  );
}


// ═══════════════════════════════════════════════
// 🌐 قراءة صفحة Facebook
// ═══════════════════════════════════════════════

async function fetchFacebookPage(url) {

  try {

    const response =
      await axios.get(
        cleanURL(url),
        {
          timeout: 12000,

          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",

            "Accept":
              "text/html,application/xhtml+xml"
          },

          maxRedirects: 5,

          validateStatus:
            status =>
              status >= 200 &&
              status < 400
        }
      );

    return {
      success: true,
      data: String(
        response.data || ""
      )
    };

  } catch (error) {

    console.log(
      "[HINA CHECK] PAGE ERROR:",
      error?.message || error
    );

    return {
      success: false,
      data: ""
    };
  }
}


// ═══════════════════════════════════════════════
// 🔍 استخراج UID من HTML
// ═══════════════════════════════════════════════

function extractUIDFromHTML(html) {

  if (!html) {
    return null;
  }

  const patterns = [

    // profile_id
    /"profile_id"\s*:\s*"(\d{5,})"/i,

    // userID
    /"userID"\s*:\s*"(\d{5,})"/i,

    // user_id
    /"user_id"\s*:\s*"(\d{5,})"/i,

    // actor_id
    /"actor_id"\s*:\s*"(\d{5,})"/i,

    // entity_id
    /"entity_id"\s*:\s*"(\d{5,})"/i,

    // page_id
    /"page_id"\s*:\s*"(\d{5,})"/i,

    // owner_id
    /"owner_id"\s*:\s*"(\d{5,})"/i,

    // generic profile id
    /profile(?:_id|ID)["']?\s*[:=]\s*["']?(\d{5,})/i
  ];

  for (const pattern of patterns) {

    const match =
      html.match(pattern);

    if (match) {
      return String(match[1]);
    }
  }

  return null;
}


// ═══════════════════════════════════════════════
// 🆔 محاولة واحدة عبر FCA
// ═══════════════════════════════════════════════

async function tryFCAGetUserID(api, target) {

  if (
    typeof api.getUserID !==
    "function"
  ) {
    return null;
  }

  try {

    console.log(
      "[HINA CHECK] FCA getUserID:",
      target
    );

    const result =
      await api.getUserID(
        target
      );

    const uid =
      parseUIDResult(result);

    if (uid) {

      console.log(
        "[HINA CHECK] FCA UID FOUND:",
        uid
      );

      return uid;
    }

  } catch (error) {

    console.log(
      "[HINA CHECK] FCA ERROR:",
      target,
      error?.message || error
    );
  }

  return null;
}


// ═══════════════════════════════════════════════
// 🆔 استخراج UID متعدد المحاولات
// ═══════════════════════════════════════════════

async function extractUID(api, url) {

  url = cleanURL(url);


  // ═══════════════════════════════════════════
  // المحاولة 1 — UID مباشر
  // ═══════════════════════════════════════════

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


  // ═══════════════════════════════════════════
  // Username
  // ═══════════════════════════════════════════

  const username =
    getUsernameFromURL(url);


  // ═══════════════════════════════════════════
  // Cache
  // ═══════════════════════════════════════════

  if (username) {

    const cached =
      getCachedUID(username);

    if (cached) {

      console.log(
        "[HINA CHECK] CACHE UID:",
        cached
      );

      return {
        uid: cached,
        method: "cache"
      };
    }
  }


  // ═══════════════════════════════════════════
  // تجهيز الأهداف
  // ═══════════════════════════════════════════

  const attempts = [];

  attempts.push(url);

  if (username) {

    attempts.push(username);

    attempts.push(
      `https://www.facebook.com/${username}`
    );

    attempts.push(
      `https://facebook.com/${username}`
    );

    attempts.push(
      `https://m.facebook.com/${username}`
    );

    attempts.push(
      `https://mbasic.facebook.com/${username}`
    );
  }


  const uniqueAttempts =
    [
      ...new Set(attempts)
    ];


  // ═══════════════════════════════════════════
  // المحاولات عبر FCA
  // ═══════════════════════════════════════════

  for (
    const target
    of uniqueAttempts
  ) {

    const uid =
      await tryFCAGetUserID(
        api,
        target
      );

    if (uid) {

      if (username) {
        saveCachedUID(
          username,
          uid
        );
      }

      return {
        uid,
        method: "fca"
      };
    }
  }


  // ═══════════════════════════════════════════
  // محاولة إضافية عبر getUserID بالـ Username
  // ═══════════════════════════════════════════

  if (username) {

    const variants = [
      `@${username}`,
      username.trim()
    ];

    for (const target of variants) {

      const uid =
        await tryFCAGetUserID(
          api,
          target
        );

      if (uid) {

        saveCachedUID(
          username,
          uid
        );

        return {
          uid,
          method: "fca_username"
        };
      }
    }
  }


  // ═══════════════════════════════════════════
  // قراءة صفحة Facebook
  // ═══════════════════════════════════════════

  const page =
    await fetchFacebookPage(url);

  if (page.success) {

    const uid =
      extractUIDFromHTML(
        page.data
      );

    if (uid) {

      console.log(
        "[HINA CHECK] HTML UID FOUND:",
        uid
      );

      if (username) {
        saveCachedUID(
          username,
          uid
        );
      }

      return {
        uid,
        method: "html"
      };
    }
  }


  // ═══════════════════════════════════════════
  // فشل
  // ═══════════════════════════════════════════

  console.log(
    "[HINA CHECK] UID NOT FOUND:",
    url
  );

  return {
    uid: null,
    method: null
  };
}


// ═══════════════════════════════════════════════
// 👤 فحص الحساب
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
// 📜 قراءة سجل بوابة النفي
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

        result.then(history => {

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

        }).catch(error => {

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
        !directUID
      ) {

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

          foundLinks.push(
            link
          );
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

function getProfileURL(event, args) {

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
    // 🆔 استخراج UID
    // ═══════════════════════════════════════════

    const extracted =
      await extractUID(
        api,
        profileURL
      );


    const uid =
      extracted.uid;


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
        `🆔 UID: ⚠️ غير متاح\n` +
        `👤 الحساب: ⚠️ تعذر التحقق\n\n` +
        `⚠️ تمت تجربة عدة طرق لاستخراج UID.\n` +
        `❌ FCA وقراءة صفحة الحساب لم يعيدا UID.\n\n` +
        `📌 هذا لا يعني بالضرورة أن الحساب غير موجود.`,
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
    // 🚫 بوابة النفي
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
    // 🟢 مقبول
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