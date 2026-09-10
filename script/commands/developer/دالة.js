module.exports.config = {
  name: "دالة",
  version: "12.0.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "فحص بيانات Comet الخاصة بطلبات الصداقة",
  commandCategory: "Developer",
  usages: "دالة",
  cooldowns: 5
};

module.exports.run = async function ({ api, event }) {
  const threadID = event.threadID;

  try {
    const html = await api.httpGet(
      "https://www.facebook.com/reqs.php",
      {},
      {},
      null,
      true
    );

    const keywords = [
      "friend_requests",
      "friendRequests",
      "FriendRequests",
      "friend_request",
      "friendRequest",
      "FriendRequest",
      "jewel_requests",
      "jewelRequests",
      "friend_center_requests",
      "actorFbId",
      "friend_request_received"
    ];

    let found = [];
    const seen = new Set();

    for (const keyword of keywords) {
      let start = 0;

      while (true) {
        const index = html.indexOf(keyword, start);

        if (index === -1) break;

        const from = Math.max(0, index - 700);
        const to = Math.min(html.length, index + keyword.length + 1500);

        const context = html
          .slice(from, to)
          .replace(/\\u0025/g, "%")
          .replace(/\\u0026/g, "&")
          .replace(/\\u003D/g, "=")
          .replace(/\\u002F/g, "/")
          .replace(/\\u003A/g, ":")
          .replace(/\\u0022/g, '"')
          .replace(/\\u005C/g, "\\");

        const key = `${keyword}:${index}`;

        if (!seen.has(key)) {
          seen.add(key);

          found.push({
            keyword,
            index,
            context
          });
        }

        start = index + keyword.length;
      }
    }

    let msg =
      "╭───〔 𝗛𝗜𝗡𝗔 〢 𝗖𝗢𝗠𝗘𝗧 𝗦𝗖𝗔𝗡 〕───╮\n" +
      `حجم الصفحة: ${html.length}\n` +
      `عدد التطابقات: ${found.length}\n\n`;

    if (!found.length) {
      msg +=
        "لم أجد أي من الكلمات المرتبطة بطلبات الصداقة\n" +
        "سنحتاج البحث عن بيانات GraphQL أو أسماء مكونات Comet أخرى\n";
    } else {
      // نعرض أول 8 تطابقات فقط حتى لا تتجاوز الرسالة الحد
      const max = Math.min(found.length, 8);

      for (let i = 0; i < max; i++) {
        const item = found[i];

        // تقليل السياق حتى لا تصبح الرسالة ضخمة
        let context = item.context;

        if (context.length > 1800) {
          context = context.slice(0, 1800) + "\n...[تم اختصار السياق]";
        }

        msg +=
          `━━━ تطابق ${i + 1} ━━━\n` +
          `الكلمة: ${item.keyword}\n` +
          `الموقع: ${item.index}\n` +
          `${context}\n\n`;
      }

      if (found.length > max) {
        msg += `تم العثور على ${found.length - max} تطابقات إضافية لم يتم عرضها\n`;
      }
    }

    msg += "╰────────────────────╯";

    return api.sendMessage(msg, threadID);

  } catch (error) {
    console.error("COMET SCAN ERROR:", error);

    return api.sendMessage(
      "╭───〔 𝗛𝗜𝗡𝗔 〢 𝗖𝗢𝗠𝗘𝗧 𝗦𝗖𝗔𝗡 〕───╮\n" +
      "حدث خطأ أثناء قراءة صفحة طلبات الصداقة\n\n" +
      String(error?.message || error) +
      "\n╰────────────────────╯",
      threadID
    );
  }
};