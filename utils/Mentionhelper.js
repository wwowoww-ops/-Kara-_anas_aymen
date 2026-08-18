/**
 * ============================================================
 * HINA Mention Helper
 * المطور: أبو هريرة
 * ============================================================
 *
 * يدعم:
 * - @منشن
 * - الرد على رسالة عضو
 * - ID مباشر
 * - mentions غير معرفة
 * - أكثر من منشن
 * ============================================================
 */


/**
 * استخراج أول ID من المنشن
 *
 * @param {Object} event
 * @param {Array} args
 * @returns {String|null}
 */
module.exports.extractMention = function(event, args = []) {

  if (!event) {
    return null;
  }


  // ==========================================================
  // 1 - البحث عن المنشن
  // ==========================================================

  const mentions = event.mentions || {};

  if (
    mentions &&
    typeof mentions === "object" &&
    Object.keys(mentions).length > 0
  ) {

    const mentionIDs =
      Object.keys(mentions);

    if (mentionIDs.length > 0) {

      return String(
        mentionIDs[0]
      );

    }
  }


  // ==========================================================
  // 2 - الرد على رسالة
  // ==========================================================

  if (event.messageReply) {

    const replyID =
      event.messageReply.senderID;

    if (replyID) {

      return String(
        replyID
      );

    }
  }


  // ==========================================================
  // 3 - البحث عن ID مباشر
  // ==========================================================

  if (
    Array.isArray(args)
  ) {

    for (
      const arg of args
    ) {

      if (
        arg &&
        /^\d+$/.test(
          String(arg)
        )
      ) {

        return String(arg);

      }
    }
  }


  // ==========================================================
  // لا يوجد هدف
  // ==========================================================

  return null;
};


/**
 * ============================================================
 * استخراج جميع الأشخاص المذكورين
 * ============================================================
 *
 * @param {Object} event
 * @returns {Array}
 */
module.exports.extractMentions = function(event) {

  if (!event) {
    return [];
  }

  const mentions =
    event.mentions || {};

  if (
    !mentions ||
    typeof mentions !== "object"
  ) {
    return [];
  }

  return Object.keys(
    mentions
  ).map(id => String(id));
};


/**
 * ============================================================
 * التحقق هل الرسالة تحتوي على منشن
 * ============================================================
 *
 * @param {Object} event
 * @returns {Boolean}
 */
module.exports.hasMention = function(event) {

  if (!event) {
    return false;
  }

  const mentions =
    event.mentions || {};

  return (
    Object.keys(mentions).length > 0
  );
};


/**
 * ============================================================
 * تحويل النص إلى Bold Sans
 * ============================================================
 *
 * @param {String} text
 * @returns {String}
 */
module.exports.toBoldSans = function(text) {

  if (
    text === null ||
    text === undefined
  ) {
    return "";
  }

  const chars = {

    a: "𝗔",
    b: "𝗕",
    c: "𝗖",
    d: "𝗗",
    e: "𝗘",
    f: "𝗙",
    g: "𝗚",
    h: "𝗛",
    i: "𝗜",
    j: "𝗝",
    k: "𝗞",
    l: "𝗟",
    m: "𝗠",
    n: "𝗡",
    o: "𝗢",
    p: "𝗣",
    q: "𝗤",
    r: "𝗥",
    s: "𝗦",
    t: "𝗧",
    u: "𝗨",
    v: "𝗩",
    w: "𝗪",
    x: "𝗫",
    y: "𝗬",
    z: "𝗭",

    A: "𝗔",
    B: "𝗕",
    C: "𝗖",
    D: "𝗗",
    E: "𝗘",
    F: "𝗙",
    G: "𝗚",
    H: "𝗛",
    I: "𝗜",
    J: "𝗝",
    K: "𝗞",
    L: "𝗟",
    M: "𝗠",
    N: "𝗡",
    O: "𝗢",
    P: "𝗣",
    Q: "𝗤",
    R: "𝗥",
    S: "𝗦",
    T: "𝗧",
    U: "𝗨",
    V: "𝗩",
    W: "𝗪",
    X: "𝗫",
    Y: "𝗬",
    Z: "𝗭"
  };


  return String(text)
    .split("")
    .map(
      char =>
        chars[char] || char
    )
    .join("");
};


/**
 * ============================================================
 * استخراج الهدف بطريقة موحدة
 * ============================================================
 *
 * الأولوية:
 *
 * 1. منشن
 * 2. رد
 * 3. ID
 *
 * @param {Object} event
 * @param {Array} args
 * @returns {Object|null}
 */
module.exports.getTarget = function(
  event,
  args = []
) {

  const targetID =
    module.exports.extractMention(
      event,
      args
    );

  if (!targetID) {
    return null;
  }


  const mentions =
    event?.mentions || {};


  let name = null;


  if (
    mentions[targetID]
  ) {

    name =
      String(
        mentions[targetID]
      ).replace(
        /^@/,
        ""
      );

  }


  return {

    id: String(targetID),

    name: name,

    type:
      Object.keys(
        mentions
      ).length > 0
        ? "mention"
        : event.messageReply
          ? "reply"
          : "id"
  };
};