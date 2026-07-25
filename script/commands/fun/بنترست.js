const axios = require("axios");

module.exports.config = {
  name: "بنترست",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "جلب صور من بنترست مع إمكانية طلب المزيد",
  commandCategory: "صور",
  usages: "بنترست [البحث]",
  cooldowns: 5
};


// جلب الصور
async function getImages(query, start = 0) {
  const res = await axios.get(
    `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(query)}`,
    {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    }
  );

  let images = [
    ...res.data.matchAll(/https:\/\/i\.pinimg\.com\/[^"]+/g)
  ]
    .map(x => x[0].replace(/\\u002F/g, "/"));

  return images.slice(start, start + 5);
}


// الأمر الأساسي
module.exports.run = async function({ api, event, args }) {

  const { threadID, messageID, senderID } = event;

  if (!args.length) {
    return api.sendMessage(
      "📌 الاستخدام:\nبنترست [الكلمة]\n\nمثال:\nبنترست ناروتو",
      threadID,
      messageID
    );
  }

  const query = args.join(" ");

  try {

    const images = await getImages(query, 0);

    if (!images.length) {
      return api.sendMessage(
        "❌ لم أجد صورًا لهذا البحث.",
        threadID,
        messageID
      );
    }


    let attachments = [];

    for (const img of images) {

      const stream = await axios.get(img, {
        responseType: "stream"
      });

      attachments.push(stream.data);
    }


    const sent = await api.sendMessage(
      {
        body:
`⌬ ━━ HINA FUN ━━ ⌬

📌 البحث: ${query}

🖼️ تم إرسال 5 صور
💬 رد بكلمة "مزيد" للحصول على المزيد`,
        attachment: attachments
      },
      threadID
    );


    global.client.handleReply.push({

      name: "بنترست",

      messageID: sent.messageID,

      author: senderID,

      query: query,

      page: 1

    });


  } catch (e) {

    api.sendMessage(
      "❌ حدث خطأ أثناء جلب الصور.",
      threadID,
      messageID
    );

  }

};



// عند الرد بكلمة مزيد
module.exports.handleReply = async function({
  api,
  event,
  handleReply
}) {

  const { threadID, messageID, senderID } = event;


  if (!event.body) return;


  if (event.body.trim() !== "مزيد") return;


  // فقط صاحب البحث يستطيع طلب المزيد
  if (senderID !== handleReply.author) {

    return api.sendMessage(
      "⚠️ هذا البحث ليس لك.",
      threadID,
      messageID
    );

  }


  try {

    const images = await getImages(
      handleReply.query,
      handleReply.page * 5
    );


    if (!images.length) {

      return api.sendMessage(
        "❌ لا توجد صور إضافية.",
        threadID,
        messageID
      );

    }


    let attachments = [];


    for (const img of images) {

      const stream = await axios.get(img, {
        responseType: "stream"
      });

      attachments.push(stream.data);

    }


    const sent = await api.sendMessage(
      {
        body:
`📌 صور إضافية لـ: ${handleReply.query}

🖼️ تم إرسال 5 صور أخرى
💬 أرسل "مزيد" للمزيد`,
        attachment: attachments
      },
      threadID
    );


    // تحديث الصفحة
    global.client.handleReply.push({

      name: "بنترست",

      messageID: sent.messageID,

      author: handleReply.author,

      query: handleReply.query,

      page: handleReply.page + 1

    });


  } catch (e) {

    api.sendMessage(
      "❌ حدث خطأ أثناء جلب المزيد.",
      threadID,
      messageID
    );

  }

};