const fs = require("fs-extra");
const axios = require("axios");
const jimp = require("jimp");
const Canvas = require("canvas");

module.exports.config = {
  name: "قبر",
  version: "1.1.0",
  role: 0,
  credits: "أبو هريرة",
  description: "صنع صورة قبر للشخص المنشن أو بالرد على رسالته",
  category: "fun",
  usages: "[@منشن] او [رد على رسالة]",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID, type, messageReply, mentions } = event;
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🎯 تحديد المعرف (ID) - دعم الرد والمنشن
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  let id;
  let name = "الميت";
  
  if (type === "message_reply") {
    id = messageReply.senderID;
    try {
      const userInfo = await api.getUserInfo(id);
      name = userInfo[id]?.name || "الميت";
    } catch (e) {}
  } else if (Object.keys(mentions).length > 0) {
    id = Object.keys(mentions)[0];
    name = mentions[id].replace("@", "");
  } else {
    id = senderID;
    try {
      const userInfo = await api.getUserInfo(id);
      name = userInfo[id]?.name || "الميت";
    } catch (e) {}
  }

  const pathImg = __dirname + `/cache/grave_${id}.png`;

  try {
    api.sendMessage("🕯️ | جاري تحضير القبر في نظام HINA...", threadID, messageID);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📸 جلب الصورة الشخصية
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const avatarUrl = `https://graph.facebook.com/${id}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
    
    // معالجة الصورة دائرية باستخدام Jimp
    const avatarRaw = await jimp.read(avatarUrl);
    avatarRaw.circle();
    const avatarBuffer = await avatarRaw.getBufferAsync(jimp.MIME_PNG);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🎨 إعداد Canvas لدمج الصور
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const canvas = Canvas.createCanvas(500, 670);
    const ctx = canvas.getContext('2d');
    
    // تحميل الخلفية وصورة الشخص
    const background = await Canvas.loadImage('https://i.imgur.com/A4quyh3.jpg');
    const avatarImg = await Canvas.loadImage(avatarBuffer);

    // رسم الخلفية
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
    
    // رسم الصورة الشخصية داخل القبر
    ctx.drawImage(avatarImg, 160, 70, 160, 160);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 💀 إضافة نص القبر (RIP + الاسم)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    ctx.font = "bold 30px Arial";
    ctx.textAlign = "center";
    ctx.shadowColor = "#ffffff";
    ctx.shadowBlur = 10;
    ctx.fillStyle = "#ffffff";
    ctx.fillText("RIP", 240, 260);
    
    // إضافة اسم الميت
    ctx.font = "bold 20px Arial";
    ctx.shadowColor = "#000000";
    ctx.shadowBlur = 5;
    ctx.fillStyle = "#ffcc00";
    ctx.fillText(name, 240, 295);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🕊️ إضافة تاريخ الوفاة (عشوائي)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const deathDate = new Date();
    deathDate.setDate(deathDate.getDate() - Math.floor(Math.random() * 30));
    const dateStr = deathDate.toLocaleDateString('ar-EG');
    
    ctx.font = "16px Arial";
    ctx.shadowColor = "#000000";
    ctx.shadowBlur = 3;
    ctx.fillStyle = "#aaaaaa";
    ctx.fillText(`تاريخ الوفاة: ${dateStr}`, 240, 330);

    const imageBuffer = canvas.toBuffer();
    fs.writeFileSync(pathImg, imageBuffer);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📨 رسائل مضحكة حسب الميت
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const funnyMessages = [
      `🕊️ اللهم ارحم ${name} واغفر له.. اقرأ الفاتحة 🤲`,
      `💀 ${name} مات... لكنه عاش حياة جميلة (قبل البوت) 😂`,
      `🪦 RIP ${name}.. كان شخصاً طيباً (نسبياً) 😅`,
      `⚰️ ${name} في ذمة الله.. اللهم ارحمه 🤲`,
      `😢 ${name} رحل عنا.. لكن ذكراه باقية في الشات 💔`,
      `🕯️ ${name} مات موتة البطل! (بطل التيك توك) 😂`
    ];
    
    const randomMsg = funnyMessages[Math.floor(Math.random() * funnyMessages.length)];

    return api.sendMessage({
      body: `⌬ ━━ HINA FUN ━━ ⌬\n\n${randomMsg}`,
      attachment: fs.createReadStream(pathImg)
    }, threadID, () => {
      if (fs.existsSync(pathImg)) fs.unlinkSync(pathImg);
    }, messageID);

  } catch (error) {
    console.error("❌ HINA Grave Error:", error);
    return api.sendMessage(
      `⌬ ━━ HINA FUN ━━ ⌬\n\n❌ حدث خطأ أثناء تجهيز القبر: ${error.message}`,
      threadID,
      messageID
    );
  }
};