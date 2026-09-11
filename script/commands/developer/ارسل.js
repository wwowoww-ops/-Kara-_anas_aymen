const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "ارسل",
  version: "2.0.0",
  hasPermssion: 2,
  credits: "أبو هريرة",
  description: "اختيار مجموعة وإرسال رسالة لها",
  commandCategory: "developer",
  usages: "ارسل [النص] أو بالرد على صورة/فيديو",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  const {
    threadID,
    messageID,
    senderID,
    type,
    messageReply
  } = event;

  // التحقق من المطور
  if (
    !global.config.ADMINBOT.includes(
      String(senderID)
    )
  ) {
    return api.sendMessage(
      "⌬ ━━ 𝗛𝗜𝗡𝗔 ━━ ⌬\n\n⚠️ هذا الأمر مخصص للمطور فقط.",
      threadID,
      messageID
    );
  }

  // النص
  const content = args.join(" ");

  if (
    !content &&
    type !== "message_reply"
  ) {
    return api.sendMessage(
      "⌬ ━━ 𝗛𝗜𝗡𝗔 ━━ ⌬\n\n⚠️ يرجى كتابة نص الرسالة أو الرد على صورة/فيديو.",
      threadID,
      messageID
    );
  }

  // جلب المجموعات
  let allThreads;

  try {
    allThreads = await api.getThreadList(
      500,
      null,
      ["INBOX"]
    );
  } catch (error) {
    return api.sendMessage(
      `⌬ ━━ 𝗛𝗜𝗡𝗔 ━━ ⌬

❌ تعذر الحصول على قائمة المجموعات.

📝 ${error.message || "خطأ غير معروف"}`,
      threadID,
      messageID
    );
  }

  const groupThreads = allThreads.filter(
    t =>
      t.isGroup &&
      t.threadID !== threadID
  );

  if (groupThreads.length === 0) {
    return api.sendMessage(
      "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗕𝗥𝗢𝗔𝗗𝗖𝗔𝗦𝗧 ━━ ⌬\n\n❌ لا توجد مجموعات متاحة.",
      threadID,
      messageID
    );
  }

  // إنشاء قائمة المجموعات
  let groupList =
    "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗦𝗘𝗟𝗘𝗖𝗧 ━━ ⌬\n\n";

  groupThreads.forEach(
    (group, index) => {
      const name =
        group.name ||
        "مجموعة بدون اسم";

      groupList +=
        `${index + 1} ┊ ${name}\n`;
    }
  );

  groupList +=
    "\n⌬ أرسل رقم المجموعة التي تريد الإرسال إليها";

  // تجهيز الكاش
  const cacheDir =
    path.join(
      __dirname,
      "cache"
    );

  await fs.ensureDir(cacheDir);

  const cachePath =
    path.join(
      cacheDir,
      `broadcast_${senderID}_${Date.now()}`
    );

  const attachmentPaths = [];

  // تحميل المرفقات
  if (
    type === "message_reply" &&
    messageReply &&
    Array.isArray(
      messageReply.attachments
    ) &&
    messageReply.attachments.length > 0
  ) {
    for (
      let i = 0;
      i < messageReply.attachments.length;
      i++
    ) {
      const att =
        messageReply.attachments[i];

      if (!att.url) continue;

      const ext =
        att.type === "photo"
          ? "jpg"
          : att.type === "video"
            ? "mp4"
            : att.type === "audio"
              ? "mp3"
              : "bin";

      const filePath =
        `${cachePath}_${i}.${ext}`;

      try {
        const response =
          await axios.get(
            att.url,
            {
              responseType:
                "arraybuffer",
              timeout: 30000
            }
          );

        fs.writeFileSync(
          filePath,
          Buffer.from(response.data)
        );

        attachmentPaths.push(
          filePath
        );
      } catch (error) {
        console.error(
          "فشل تحميل المرفق:",
          error
        );
      }
    }
  }

  // تسجيل الرد
  if (!global.client.handleReply) {
    global.client.handleReply = [];
  }

  global.client.handleReply.push({
    name: "ارسل",
    messageID,
    author: String(senderID),

    data: {
      content,

      groupThreads:
        groupThreads.map(
          group => ({
            threadID:
              String(group.threadID),

            name:
              group.name ||
              "مجموعة بدون اسم"
          })
        ),

      attachmentPaths
    }
  });

  return api.sendMessage(
    groupList,
    threadID,
    messageID
  );
};

// ==================================================
// معالجة اختيار المجموعة
// ==================================================

module.exports.handleReply =
  async function ({
    api,
    event,
    handleReply
  }) {
    const {
      threadID,
      messageID,
      senderID,
      body
    } = event;

    // التأكد من صاحب الطلب
    if (
      String(senderID) !==
      String(handleReply.author)
    ) {
      return;
    }

    const choice =
      parseInt(
        String(body).trim()
      );

    const groups =
      handleReply.data.groupThreads;

    // التحقق من الرقم
    if (
      isNaN(choice) ||
      choice < 1 ||
      choice > groups.length
    ) {
      return api.sendMessage(
        `⌬ ━━ 𝗛𝗜𝗡𝗔 𝗦𝗘𝗟𝗘𝗖𝗧 ━━ ⌬

❌ الرقم غير صحيح.

اختر رقمًا من 1 إلى ${groups.length}`,
        threadID,
        messageID
      );
    }

    const selectedGroup =
      groups[choice - 1];

    const content =
      handleReply.data.content;

    const attachmentPaths =
      handleReply.data.attachmentPaths ||
      [];

    // حذف HandleReply
    const index =
      global.client.handleReply.indexOf(
        handleReply
      );

    if (index !== -1) {
      global.client.handleReply.splice(
        index,
        1
      );
    }

    // تجهيز الرسالة
    const msgObject = {
      body:
        `⌬ ━━ 𝗛𝗜𝗡𝗔 𝗕𝗥𝗢𝗔𝗗𝗖𝗔𝗦𝗧 ━━ ⌬\n\n` +
        `📢 رسالة من المطور:\n\n` +
        `${content || ""}`
    };

    // المرفقات
    if (
      attachmentPaths.length > 0
    ) {
      const streams =
        attachmentPaths
          .filter(file =>
            fs.existsSync(file)
          )
          .map(file =>
            fs.createReadStream(file)
          );

      if (streams.length > 0) {
        msgObject.attachment =
          streams;
      }
    }

    // الإرسال
    try {
      api.setMessageReaction(
        "⏳",
        messageID,
        () => {},
        true
      );

      await api.sendMessage(
        msgObject,
        selectedGroup.threadID
      );

      api.setMessageReaction(
        "✅",
        messageID,
        () => {},
        true
      );

      // تنظيف الملفات
      for (
        const file of attachmentPaths
      ) {
        try {
          if (
            fs.existsSync(file)
          ) {
            fs.unlinkSync(file);
          }
        } catch (e) {}
      }

      return api.sendMessage(
        `⌬ ━━ 𝗛𝗜𝗡𝗔 𝗗𝗘𝗩 ━━ ⌬

✅ تم إرسال الرسالة بنجاح

📌 المجموعة:
${selectedGroup.name}`,
        threadID,
        messageID
      );

    } catch (error) {

      api.setMessageReaction(
        "❌",
        messageID,
        () => {},
        true
      );

      for (
        const file of attachmentPaths
      ) {
        try {
          if (
            fs.existsSync(file)
          ) {
            fs.unlinkSync(file);
          }
        } catch (e) {}
      }

      return api.sendMessage(
        `⌬ ━━ 𝗛𝗜𝗡𝗔 𝗗𝗘𝗩 ━━ ⌬

❌ فشل إرسال الرسالة

📌 المجموعة:
${selectedGroup.name}

📝 ${error.message || "خطأ غير معروف"}`,
        threadID,
        messageID
      );
    }
  };