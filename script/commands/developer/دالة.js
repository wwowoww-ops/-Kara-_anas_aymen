module.exports.config = {
  name: "دالة",
  version: "14.0.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "اكتشاف استعلامات GraphQL الخاصة بطلبات الصداقة",
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

    const patterns = [
      "graphql",
      "doc_id",
      "docID",
      "variables",
      "FriendingComet",
      "FriendRequest",
      "FriendRequests",
      "friend_request",
      "friendRequests",
      "request_id"
    ];

    const found = [];
    const seen = new Set();

    for (const pattern of patterns) {
      let pos = 0;

      while (true) {
        const index = html.indexOf(pattern, pos);

        if (index === -1) break;

        const start = Math.max(0, index - 1800);
        const end = Math.min(html.length, index + 3500);

        const context = html.slice(start, end);

        const key = `${pattern}:${index}`;

        if (!seen.has(key)) {
          seen.add(key);

          // استخراج doc_id إن وجد
          const docIds = [
            ...context.matchAll(
              /(?:doc_id|docID)["']?\s*[:=]\s*["']?(\d{5,30})/gi
            )
          ].map(m => m[1]);

          // استخراج GraphQL URLs
          const graphqlUrls = [
            ...context.matchAll(
              /https?:\\?\/\\?\/[^"'\\ ]*graphql[^"'\\ ]*/gi
            )
          ].map(m => m[0]);

          // البحث عن request-related identifiers
          const requestIds = [
            ...context.matchAll(
              /(?:request_id|requestID|friend_request_id|friendRequestId)["']?\s*[:=]\s*["']?([A-Za-z0-9_-]{5,100})/gi
            )
          ].map(m => m[1]);

          found.push({
            pattern,
            index,
            docIds: [...new Set(docIds)],
            graphqlUrls: [...new Set(graphqlUrls)],
            requestIds: [...new Set(requestIds)],
            context
          });
        }

        pos = index + pattern.length;
      }
    }

    let msg =
      "╭───〔 𝗛𝗜𝗡𝗔 〢 𝗚𝗥𝗔𝗣𝗛𝗤𝗟 𝗦𝗖𝗔𝗡 〕───╮\n" +
      `حجم الصفحة: ${html.length}\n` +
      `عدد المناطق: ${found.length}\n\n`;

    if (!found.length) {
      msg +=
        "لم أجد استعلامات مرتبطة بطلبات الصداقة داخل HTML\n";
    } else {

      let displayed = 0;

      for (const item of found) {

        // نريد المناطق التي فيها معلومات مفيدة
        const useful =
          item.docIds.length ||
          item.graphqlUrls.length ||
          item.requestIds.length ||
          item.pattern === "graphql" ||
          item.pattern === "doc_id";

        if (!useful) continue;

        displayed++;

        msg += `━━━ نتيجة ${displayed} ━━━\n`;
        msg += `الكلمة: ${item.pattern}\n`;
        msg += `الموقع: ${item.index}\n`;

        if (item.docIds.length) {
          msg +=
            "\ndoc_id:\n" +
            item.docIds.slice(0, 10).join("\n") +
            "\n";
        }

        if (item.requestIds.length) {
          msg +=
            "\nrequest IDs:\n" +
            item.requestIds.slice(0, 10).join("\n") +
            "\n";
        }

        if (item.graphqlUrls.length) {
          msg +=
            "\nGraphQL:\n" +
            item.graphqlUrls.slice(0, 5).join("\n") +
            "\n";
        }

        let context = item.context;

        // تنظيف بعض escape characters
        context = context
          .replace(/\\u0026/g, "&")
          .replace(/\\u003D/g, "=")
          .replace(/\\u002F/g, "/")
          .replace(/\\"/g, '"');

        if (context.length > 2500) {
          context = context.slice(0, 2500) +
            "\n...[اختصار]";
        }

        msg +=
          "\nالسياق:\n" +
          context +
          "\n\n";

        // لا نريد رسالة ضخمة
        if (displayed >= 8) break;
      }

      if (!displayed) {
        msg +=
          "وجدت كلمات مرتبطة بالصداقة لكن لم يظهر معها doc_id أو request_id واضح\n";
      }
    }

    msg += "╰────────────────────╯";

    return api.sendMessage(msg, threadID);

  } catch (error) {

    console.error("GRAPHQL SCAN ERROR:", error);

    return api.sendMessage(
      "╭───〔 𝗛𝗜𝗡𝗔 〢 𝗚𝗥𝗔𝗣𝗛𝗤𝗟 𝗦𝗖𝗔𝗡 〕───╮\n" +
      "حدث خطأ أثناء تحليل الصفحة\n\n" +
      String(error?.message || error) +
      "\n╰────────────────────╯",
      threadID
    );
  }
};