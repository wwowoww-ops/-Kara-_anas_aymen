const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "ارسل",
  version: "2.1.0",
  hasPermssion: 2,
  credits: "أبو هريرة",
  description: "اختيار مجموعة وإرسال رسالة لها",
  commandCategory: "developer",
  usages: "ارسل [النص] أو بالرد على صورة/فيديو",
  cooldowns: 5
};

// ==================================================
// الأمر الرئيسي
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
  // التحقق من المطور
  // ==================================================

  const admins =
    global.config.ADMINBOT || [];

  const isDeveloper =
    admins.some(
      id =>
        String(id) ===
        String(senderID)
    );

  if (!isDeveloper) {
    return api.sendMessage(
      "⌬ ━━ 𝗛𝗜𝗡𝗔 ━━ ⌬\n\n" +
      "هذا الأمر مخصص للمطور فقط.",
      threadID,
      messageID
    );
  }

  // ==================================================
  // الحصول على النص
  // ==================================================

  const content =
    Array.isArray(args)
      ? args.join(" ").trim()
      : "";

  // ==================================================
  // التحقق من وجود نص أو مرفق
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
      "خطأ getThreadList:",
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
  // إنشاء قائمة المجموعات
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
  // مجلد الكاش
  // ==================================================

  const cacheDir =
    path.join(
      __dirname,
      "cache"
    );

  try {
    await fs.ensureDir(
      cacheDir
    );
  } catch (error) {
    console.error(
      "خطأ إنشاء cache:",
      error
    );
  }

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

      if (!attachment || !attachment.url) {
        continue;
      }

      let extension = "bin";

      if (
        attachment.type ===
        "photo"
      ) {
        extension = "jpg";
      } else if (
        attachment.type ===
        "video"
      ) {
        extension = "mp4";
      } else if (
        attachment.type ===
        "audio"
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
          `فشل تحميل المرفق ${i}:`,
          error.message
        );
      }
    }
  }

  // ==================================================
  // تجهيز بيانات HandleReply
  // ==================================================

  if (!Array.isArray(
    global.client.handleReply
  )) {
    global.client.handleReply = [];
  }

  const replyData = {
    name: "ارسل",
    messageID: messageID,
    author: String(senderID),

    data: {
      content: content,

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

      attachmentPaths:
        attachmentPaths
    }
  };

  // ==================================================
  // تسجيل HandleReply
  // ==================================================

  global.client.handleReply.push(
    replyData
  );

  console.log(
    `𝗛𝗜𝗡𝗔 | ارسل | تم تسجيل HandleReply | ${messageID}`
  );

  // ==================================================
  // إرسال القائمة
  // ==================================================

  return api.sendMessage(
    groupList,
    threadID,
    messageID
  );
};

// ==================================================
// HandleReply
// ==================================================

module.exports.handleReply =
  async function ({
    api,
    event,
    handleReply
  }) {
    try {

      const {
        threadID,
        messageID,
        senderID,
        body
      } = event;

      // ==================================================
      // التحقق من صاحب الطلب
      // ==================================================

      if (
        String(senderID) !==
        String(handleReply.author)
      ) {
        return;
      }

      // ==================================================
      // التحقق من البيانات
      // ==================================================

      if (
        !handleReply.data ||
        !Array.isArray(
          handleReply.data.groupThreads
        )
      ) {
        return api.sendMessage(
          "⌬ ━━ 𝗛𝗜𝗡𝗔 ━━ ⌬\n\n" +
          "حدث خطأ في بيانات الطلب",
          threadID,
          messageID
        );
      }

      const groups =
        handleReply.data.groupThreads;

      // ==================================================
      // قراءة الاختيار
      // ==================================================

      const text =
        String(body || "")
          .trim();

      const choice =
        Number(text);

      // ==================================================
      // التحقق من الرقم
      // ==================================================

      if (
        !Number.isInteger(choice) ||
        choice < 1 ||
        choice > groups.length
      ) {
        return api.sendMessage(
          "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗦𝗘𝗟𝗘𝗖𝗧 ━━ ⌬\n\n" +
          "الرقم غير صحيح\n\n" +
          `اختر رقمًا من 1 إلى ${groups.length}`,
          threadID,
          messageID
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
          "تعذر العثور على المجموعة المختارة.",
          threadID,
          messageID
        );
      }

      const content =
        handleReply.data.content || "";

      const attachmentPaths =
        Array.isArray(
          handleReply.data.attachmentPaths
        )
          ? handleReply.data.attachmentPaths
          : [];

      // ==================================================
      // إزالة الطلب من HandleReply
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
        const streams =
          validFiles.map(
            file =>
              fs.createReadStream(file)
          );

        msgObject.attachment =
          streams;
      }

      // ==================================================
      // بدء الإرسال
      // ==================================================

      api.setMessageReaction(
        "⏳",
        messageID,
        () => {},
        true
      );

      console.log(
        `𝗛𝗜𝗡𝗔 | ارسل | إرسال إلى: ${selectedGroup.threadID}`
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
        messageID,
        () => {},
        true
      );

      // ==================================================
      // تنظيف الملفات
      // ==================================================

      for (
        const file of attachmentPaths
      ) {
        try {
          if (
            fs.existsSync(file)
          ) {
            await fs.unlink(file);
          }
        } catch (error) {
          console.error(
            "فشل حذف ملف:",
            error.message
          );
        }
      }

      // ==================================================
      // النتيجة
      // ==================================================

      return api.sendMessage(
        "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗗𝗘𝗩 ━━ ⌬\n\n" +
        "تم إرسال الرسالة بنجاح\n\n" +
        `المجموعة:\n${selectedGroup.name}`,
        threadID,
        messageID
      );

    } catch (error) {

      console.error(
        "𝗛𝗜𝗡𝗔 | ارسل HandleReply:",
        error
      );

      api.setMessageReaction(
        "❌",
        messageID,
        () => {},
        true
      );

      // ==================================================
      // تنظيف الملفات حتى عند الفشل
      // ==================================================

      const attachmentPaths =
        handleReply &&
        handleReply.data &&
        Array.isArray(
          handleReply.data.attachmentPaths
        )
          ? handleReply.data.attachmentPaths
          : [];

      for (
        const file of attachmentPaths
      ) {
        try {
          if (
            fs.existsSync(file)
          ) {
            await fs.unlink(file);
          }
        } catch (e) {}
      }

      return api.sendMessage(
        "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗗𝗘𝗩 ━━ ⌬\n\n" +
        "فشل إرسال الرسالة\n\n" +
        `المجموعة:\n${
          handleReply &&
          handleReply.data &&
          handleReply.data.groupThreads
            ? "المجموعة المختارة"
            : "غير معروفة"
        }\n\n` +
        `الخطأ:\n${error.message || "خطأ غير معروف"}`,
        threadID,
        messageID
      );
    }
  };