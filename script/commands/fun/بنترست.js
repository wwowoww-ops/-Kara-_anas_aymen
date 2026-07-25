const axios = require("axios");

module.exports.config = {
  name: "بنترست",
  version: "3.0.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "جلب صور حسب الطلب مع المزيد",
  commandCategory: "fun",
  usages: "بنترست [الكلمة]",
  cooldowns: 5
};


// جلب روابط الصور
async function getImages(query, start = 0) {

  const url =
    `https://www.bing.com/images/async?q=${encodeURIComponent(query)}&first=${start}&count=20&adlt=moderate`;

  const res = await axios.get(url, {
    headers: {
      "User-Agent": "Mozilla/5.0"
    }
  });


  let images = [
    ...res.data.matchAll(/murl&quot;:&quot;(.*?)&quot;/g)
  ]
  .map(x => x[1]);


  return [...new Set(images)].slice(0, 5);
}


// تحميل الصور
async function getAttachments(images) {

  let attachments = [];

  for (const img of images) {

    try {

      const data = await axios.get(img, {
        responseType: "stream",
        timeout: 8000
      });

      attachments.push(data.data);

    } catch {}

  }

  return attachments;
}



// أمر البحث
module.exports.run = async function({ api, event, args }) {

  const { threadID, messageID, senderID } = event;


  if (!args.length) {

    return api.sendMessage(
      "📌 اكتب اسم الصورة\nمثال:\nبنترست غوجو",
      threadID,
      messageID
    );

  }


  const query = args.join(" ");


  try {

    const images = await getImages(query);


    if (!images.length) {

      return api.sendMessage(
        "❌ لم أجد صورًا لهذا البحث.",
        threadID,
        messageID
      );

    }


    const attachments = await getAttachments(images);


    if (!attachments.length) {

      return api.sendMessage(
        "❌ تعذر تحميل الصور.",
        threadID,
        messageID
      );

    }


    const msg = await api.sendMessage(
      {
        body:
`⌬ ━━ HINA FUN ━━ ⌗

🔎 البحث: ${query}

🖼️ تم إرسال ${attachments.length} صور
💬 رد بـ "مزيد" للحصول على المزيد`,
        attachment: attachments
      },
      threadID
    );


    global.client.handleReply.push({

      name: "بنترست",
      messageID: msg.messageID,
      author: senderID,
      query: query,
      page: 1

    });


  } catch (err) {

    console.log(err);

    api.sendMessage(
      "❌ حدث خطأ أثناء جلب الصور.",
      threadID,
      messageID
    );

  }

};



// المزيد
module.exports.handleReply = async function({
  api,
  event,
  handleReply
}) {

  if (!event.body) return;


  if (event.body.trim() !== "مزيد") return;


  if (event.senderID !== handleReply.author) return;


  try {


    const images = await getImages(
      handleReply.query,
      handleReply.page * 5
    );


    if (!images.length) {

      return api.sendMessage(
        "❌ لا توجد صور أخرى.",
        event.threadID,
        event.messageID
      );

    }


    const attachments = await getAttachments(images);


    const msg = await api.sendMessage(
      {
        body:
`📌 المزيد عن: ${handleReply.query}

🖼️ تم إرسال ${attachments.length} صور
💬 اكتب "مزيد" للمزيد`,
        attachment: attachments
      },
      event.threadID
    );


    global.client.handleReply.push({

      name: "بنترست",
      messageID: msg.messageID,
      author: handleReply.author,
      query: handleReply.query,
      page: handleReply.page + 1

    });


  } catch (err) {

    console.log(err);

    api.sendMessage(
      "❌ حدث خطأ أثناء جلب المزيد.",
      event.threadID,
      event.messageID
    );

  }

};