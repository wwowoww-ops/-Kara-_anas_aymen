const axios = require("axios");

module.exports.config = {
  name: "بنترست",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "جلب صور حسب الطلب مع المزيد",
  commandCategory: "fun",
  usages: "بنترست [البحث]",
  cooldowns: 5
};


// جلب الصور من Bing
async function getImages(query, start = 0) {

  const res = await axios.get(
    `https://www.bing.com/images/search?q=${encodeURIComponent(query)}`,
    {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    }
  );


  let images = [
    ...res.data.matchAll(/murl&quot;:&quot;(.*?)&quot;/g)
  ]
  .map(x => x[1]);


  return [...new Set(images)].slice(start, start + 5);
}


// تحويل الروابط إلى مرفقات
async function makeAttachments(images) {

  let attachments = [];

  for (const img of images) {

    try {

      const stream = await axios.get(img, {
        responseType: "stream",
        timeout: 10000
      });

      attachments.push(stream.data);

    } catch {}

  }

  return attachments;
}



// الأمر الأساسي
module.exports.run = async function({ api, event, args }) {

  const { threadID, messageID, senderID } = event;


  if (!args.length) {

    return api.sendMessage(
      "📌 اكتب ما تريد البحث عنه\nمثال:\nبنترست انمي",
      threadID,
      messageID
    );

  }


  const query = args.join(" ");


  try {

    const images = await getImages(query);


    if (!images.length) {

      return api.sendMessage(
        "❌ لم أجد صورًا.",
        threadID,
        messageID
      );

    }


    const attachments = await makeAttachments(images);


    if (!attachments.length) {

      return api.sendMessage(
        "❌ لم أستطع تحميل الصور.",
        threadID,
        messageID
      );

    }


    const msg = await api.sendMessage(
      {
        body:
`⌬ ━━ HINA FUN ━━ ⌬

📌 البحث: ${query}

🖼️ تم إرسال ${attachments.length} صور
💬 رد بكلمة "مزيد" للحصول على المزيد`,
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


  } catch (e) {

    console.log(e);

    api.sendMessage(
      "❌ حدث خطأ أثناء جلب الصور.",
      threadID,
      messageID
    );

  }

};



// نظام المزيد
module.exports.handleReply = async function({
  api,
  event,
  handleReply
}) {

  if (!event.body) return;


  if (event.body.trim() !== "مزيد") return;


  if (event.senderID !== handleReply.author) {

    return;

  }


  try {

    const images = await getImages(
      handleReply.query,
      handleReply.page * 5
    );


    if (!images.length) {

      return api.sendMessage(
        "❌ لا توجد صور إضافية.",
        event.threadID,
        event.messageID
      );

    }


    const attachments = await makeAttachments(images);


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


  } catch (e) {

    console.log(e);

    api.sendMessage(
      "❌ حدث خطأ أثناء جلب المزيد.",
      event.threadID,
      event.messageID
    );

  }

};