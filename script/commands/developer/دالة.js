module.exports.config = {
  name: "دالة",
  version: "13.0.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "تحليل بيانات طلبات الصداقة داخل Comet",
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
      "FriendingCometFriendRequest",
      "FriendRequest",
      "friend_requests",
      "friendRequests",
      "friend_request",
      "friendRequest",
      "friend_center",
      "friendCenter",
      "FriendRequests",
      "Friending"
    ];

    let results = [];
    const seen = new Set();

    for (const keyword of keywords) {
      let pos = 0;

      while (true) {
        const index = html.indexOf(keyword, pos);

        if (index === -1) break;

        const start = Math.max(0, index - 3000);
        const end = Math.min(html.length, index + 5000);

        let context = html.slice(start, end);

        // البحث عن أرقام Facebook UID داخل السياق
        const ids = [
          ...context.matchAll(/(?:^|["':,])(\d{10,20})(?=["':,]|$)/g)
        ].map(x => x[1]);

        // أسماء الحقول المهمة
        const interesting = [];

        const fieldRegex =
          /"(?:id|userID|user_id|actorID|actorFbId|name|full_name|fullName|profile_picture|profilePicture|uri|url)"\s*:\s*("[^"]*"|\d{10,20})/gi;

        let match;

        while ((match = fieldRegex.exec(context)) !== null) {
          interesting.push(match[0]);
        }

        const uniqueIds = [...new Set(ids)];

        const key = `${keyword}:${index}`;

        if (!seen.has(key)) {
          seen.add(key);

          results.push({
            keyword,
            index,
            ids: uniqueIds.slice(0, 30),
            fields: interesting.slice(0, 40),
            context
          });
        }

        pos = index + keyword.length;
      }
    }

    let msg =
      "╭───〔 𝗛𝗜𝗡𝗔 〢 𝗙𝗥𝗜𝗘𝗡𝗗 𝗗𝗔𝗧𝗔 〕───╮\n" +
      `حجم الصفحة: ${html.length}\n` +
      `عدد المناطق: ${results.length}\n\n`;

    if (!results.length) {
      msg +=
        "لم يتم العثور على بيانات مرتبطة بمكونات الصداقة\n";
    } else {

      for (let i = 0; i < Math.min(results.length, 6); i++) {

        const item = results[i];

        msg += `━━━ المنطقة ${i + 1} ━━━\n`;
        msg += `الكلمة: ${item.keyword}\n`;
        msg += `الموقع: ${item.index}\n`;

        if (item.ids.length) {
          msg +=
            "UIDs:\n" +
            item.ids.join("\n") +
            "\n";
        }

        if (item.fields.length) {
          msg +=
            "\nالحقول:\n" +
            item.fields.slice(0, 15).join("\n") +
            "\n";
        }

        // نعرض جزءاً من السياق فقط
        let context = item.context;

        if (context.length > 2200) {
          context = context.slice(0, 2200) +
            "\n...[اختصار]";
        }

        msg += "\nالسياق:\n" + context + "\n\n";
      }

      if (results.length > 6) {
        msg +=
          `تم العثور على ${results.length - 6} مناطق إضافية\n`;
      }
    }

    msg += "╰────────────────────╯";

    return api.sendMessage(msg, threadID);

  } catch (error) {

    console.error("FRIEND DATA ERROR:", error);

    return api.sendMessage(
      "╭───〔 𝗛𝗜𝗡𝗔 〢 𝗙𝗥𝗜𝗘𝗡𝗗 𝗗𝗔𝗧𝗔 〕───╮\n" +
      "حدث خطأ أثناء تحليل الصفحة\n\n" +
      String(error?.message || error) +
      "\n╰────────────────────╯",
      threadID
    );
  }
};