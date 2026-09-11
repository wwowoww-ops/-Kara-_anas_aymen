const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "ارسل",
  version: "2.2.0",
  hasPermssion: 2,
  credits: "أبو هريرة",
  description: "اختيار مجموعة وإرسال رسالة لها",
  commandCategory: "developer",
  usages: "ارسل [النص] أو بالرد على صورة/فيديو",
  cooldowns: 5
};

// ==================================================
// التحقق من المطور
// ==================================================

function isDeveloper(senderID) {
  const admins =
    global.config.ADMINBOT || [];

  return admins.some(
    id =>
      String(id) ===
      String(senderID)
  );
}

// ==================================================
// حذف الملفات
// ==================================================

async function cleanFiles(files) {
  if (!Array.isArray(files)) return;

  for (const file of files) {
    try {
      if (file && fs.existsSync(file)) {
        await fs.unlink(file);
      }
    } catch (error) {
      console.error(
        "HINA CLEAN FILE ERROR:",
        error.message
      );
    }
  }
}

// ==================================================
// RUN
// ==================================================

module.exports.run = async function ({
  api,
  event,
  args
}) {

  const {
    threadID,
    messageID,
    senderID,
    type,
    messageReply
  } = event;

  // ==================================================
  // المطور فقط
  // ==================================================

  if (!isDeveloper(senderID)) {
    return api.sendMessage(
      "⌬ ━━ 𝗛𝗜𝗡𝗔 ━━ ⌬\n\n" +
      "هذا الأمر مخصص للمطور فقط.",
      threadID,
      messageID
    );
  }

  // ==================================================
  // النص
  // ==================================================

  const content =
    Array.isArray(args)
      ? args.join(" ").trim()
      : "";

  // ==================================================
  // التحقق من المرفقات
  // ==================================================

  const hasAttachments =
    type === "message_reply" &&
    messageReply &&
    Array.isArray(
      messageReply.attachments
    ) &&
    messageReply.attachments.length > 0;

  if (!content && !hasAttachments) {
    return api.sendMessage(
      "⌬ ━━ 𝗛𝗜𝗡𝗔 ━━ ⌬\n\n" +
      "يرجى كتابة نص الرسالة أو الرد على صورة أو فيديو.",
      threadID,
      messageID
    );
  }

  // ==================================================
  // جلب المجموعات
  // ==================================================

  let allThreads;

  try {

    allThreads =
      await api.getThreadList(
        500,
        null,
        ["INBOX"]
      );

  } catch (error) {

    console.error(
      "HINA getThreadList ERROR:",
      error
    );

    return api.sendMessage(
      "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗕𝗥𝗢𝗔𝗗𝗖𝗔𝗦𝗧 ━━ ⌬\n\n" +
      "تعذر الحصول على قائمة المجموعات.\n\n" +
      `${error.message || "خطأ غير معروف"}`,
      threadID,
      messageID
    );
  }

  if (!Array.isArray(allThreads)) {
    return api.sendMessage(
      "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗕𝗥𝗢𝗔𝗗𝗖𝗔𝗦𝗧 ━━ ⌬\n\n" +
      "تعذر قراءة قائمة المجموعات.",
      threadID,
      messageID
    );
  }

  // ==================================================
  // فلترة المجموعات
  // ==================================================

  const groupThreads =
    allThreads.filter(
      group =>
        group &&
        group.isGroup &&
        String(group.threadID) !==
          String(threadID)
    );

  if (groupThreads.length === 0) {
    return api.sendMessage(
      "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗕𝗥𝗢𝗔𝗗𝗖𝗔𝗦𝗧 ━━ ⌬\n\n" +
      "لا توجد مجموعات متاحة للإرسال.",
      threadID,
      messageID
    );
  }

  // ==================================================
  // قائمة المجموعات
  // ==================================================

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
    "\n━━━━━━━━━━━━━━━━━━\n" +
    "أرسل رقم المجموعة التي تريد الإرسال إليها";

  // ==================================================
  // الكاش
  // ==================================================

  const cacheDir =
    path.join(
      __dirname,
      "cache"
    );

  await fs.ensureDir(
    cacheDir
  );

  const uniqueID =
    `${senderID}_${Date.now()}`;

  const attachmentPaths = [];

  // ==================================================
  // تحميل المرفقات
  // ==================================================

  if (hasAttachments) {

    for (
      let i = 0;
      i < messageReply.attachments.length;
      i++
    ) {

      const attachment =
        messageReply.attachments[i];

      if (
        !attachment ||
        !attachment.url
      ) {
        continue;
      }

      let extension = "bin";

      if (
        attachment.type === "photo"
      ) {
        extension = "jpg";

      } else if (
        attachment.type === "video"
      ) {
        extension = "mp4";

      } else if (
        attachment.type === "audio"
      ) {
        extension = "mp3";
      }

      const filePath =
        path.join(
          cacheDir,
          `broadcast_${uniqueID}_${i}.${extension}`
        );

      try {

        const response =
          await axios.get(
            attachment.url,
            {
              responseType:
                "arraybuffer",
              timeout: 30000
            }
          );

        await fs.writeFile(
          filePath,
          Buffer.from(
            response.data
          )
        );

        attachmentPaths.push(
          filePath
        );

      } catch (error) {

        console.error(
          `HINA ATTACHMENT ${i} ERROR:`,
          error.message
        );
      }
    }
  }

  // ==================================================
  // تجهيز بيانات HR
  // ==================================================

  const replyData = {
    name: "ارسل",

    author:
      String(senderID),

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
  };

  // ==================================================
  // إرسال القائمة
  // ==================================================
  // مهم جدًا:
  // نأخذ messageID من info.messageID
  // مثل أمر لاست بالضبط
  // ==================================================

  return api.sendMessage(
    groupList,
    threadID,
    (error, info) => {

      if (error) {

        console.error(
          "HINA SEND LIST ERROR:",
          error
        );

        cleanFiles(
          attachmentPaths
        );

        return;
      }

      if (
        !info ||
        !info.messageID
      ) {

        console.error(
          "HINA: لم يتم الحصول على messageID للقائمة"
        );

        cleanFiles(
          attachmentPaths
        );

        return;
      }

      // ==================================================
      // إنشاء handleReply
      // ==================================================

      if (
        !Array.isArray(
          global.client.handleReply
        )
      ) {
        global.client.handleReply = [];
      }

      global.client.handleReply.push({
        name: "ارسل",

        messageID:
          info.messageID,

        author:
          String(senderID),

        data:
          replyData.data
      });

      console.log(
        `𝗛𝗜𝗡𝗔 | ارسل | HR registered: ${info.messageID}`
      );
    }
  );
};

// ==================================================
// HANDLE REPLY
// ==================================================

module.exports.handleReply =
  async function ({
    api,
    event,
    handleReply
  }) {

    try {

      // ==================================================
      // التحقق من المطور
      // ==================================================

      if (
        !isDeveloper(
          event.senderID
        )
      ) {
        return;
      }

      // ==================================================
      // التحقق من HR
      // ==================================================

      if (
        !handleReply ||
        handleReply.name !== "ارسل"
      ) {
        return;
      }

      // ==================================================
      // التحقق من صاحب الطلب
      // ==================================================

      if (
        String(event.senderID) !==
        String(handleReply.author)
      ) {
        return;
      }

      // ==================================================
      // قراءة الرقم
      // ==================================================

      const body =
        String(
          event.body || ""
        ).trim();

      if (!body) return;

      const choice =
        parseInt(
          body,
          10
        );

      const groups =
        handleReply.data &&
        Array.isArray(
          handleReply.data.groupThreads
        )
          ? handleReply.data.groupThreads
          : [];

      // ==================================================
      // رقم غير صحيح
      // ==================================================

      if (
        !Number.isInteger(choice) ||
        choice < 1 ||
        choice > groups.length
      ) {

        return api.sendMessage(
          "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗦𝗘𝗟𝗘𝗖𝗧 ━━ ⌬\n\n" +
          "الرقم غير صحيح.\n\n" +
          `اختر رقمًا من 1 إلى ${groups.length}`,
          event.threadID,
          event.messageID
        );
      }

      // ==================================================
      // المجموعة المختارة
      // ==================================================

      const selectedGroup =
        groups[choice - 1];

      if (
        !selectedGroup ||
        !selectedGroup.threadID
      ) {

        return api.sendMessage(
          "⌬ ━━ 𝗛𝗜𝗡𝗔 ━━ ⌬\n\n" +
          "تعذر العثور على المجموعة.",
          event.threadID,
          event.messageID
        );
      }

      const content =
        handleReply.data.content ||
        "";

      const attachmentPaths =
        Array.isArray(
          handleReply.data.attachmentPaths
        )
          ? handleReply.data.attachmentPaths
          : [];

      // ==================================================
      // إزالة HR
      // ==================================================

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

      // ==================================================
      // تجهيز الرسالة
      // ==================================================

      const msgObject = {
        body:
          "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗕𝗥𝗢𝗔𝗗𝗖𝗔𝗦𝗧 ━━ ⌬\n\n" +
          "رسالة من المطور:\n\n" +
          content
      };

      // ==================================================
      // تجهيز المرفقات
      // ==================================================

      const validFiles =
        attachmentPaths.filter(
          file =>
            file &&
            fs.existsSync(file)
        );

      if (
        validFiles.length > 0
      ) {

        msgObject.attachment =
          validFiles.map(
            file =>
              fs.createReadStream(file)
          );
      }

      // ==================================================
      // إرسال
      // ==================================================

      api.setMessageReaction(
        "⏳",
        event.messageID,
        () => {},
        true
      );

      console.log(
        `𝗛𝗜𝗡𝗔 | ارسل | sending to ${selectedGroup.threadID}`
      );

      await api.sendMessage(
        msgObject,
        selectedGroup.threadID
      );

      // ==================================================
      // نجاح
      // ==================================================

      api.setMessageReaction(
        "✅",
        event.messageID,
        () => {},
        true
      );

      await cleanFiles(
        attachmentPaths
      );

      return api.sendMessage(
        "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗗𝗘𝗩 ━━ ⌬\n\n" +
        "تم إرسال الرسالة بنجاح\n\n" +
        `المجموعة:\n${selectedGroup.name}`,
        event.threadID,
        event.messageID
      );

    } catch (error) {

      console.error(
        "HINA ارسل HANDLE ERROR:",
        error
      );

      api.setMessageReaction(
        "❌",
        event.messageID,
        () => {},
        true
      );

      const attachmentPaths =
        handleReply &&
        handleReply.data &&
        Array.isArray(
          handleReply.data.attachmentPaths
        )
          ? handleReply.data.attachmentPaths
          : [];

      await cleanFiles(
        attachmentPaths
      );

      return api.sendMessage(
        "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗗𝗘𝗩 ━━ ⌬\n\n" +
        "فشل إرسال الرسالة\n\n" +
        `الخطأ:\n${
          error.message ||
          "خطأ غير معروف"
        }`,
        event.threadID,
        event.messageID
      );
    }
  };