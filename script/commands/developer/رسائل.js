module.exports.config = {
    name: "رسائل",
    version: "2.0.0",
    hasPermssion: 0,
    credits: "أبو هريرة",
    description: "إرسال الرسالة 10 مرات تلقائيا",
    commandCategory: "Developer",
    usages: "رسائل <الرسالة>",
    cooldowns: 5
};

const DEVELOPER_ID = "61578581225040";
const MESSAGE_COUNT = 10;
const DELAY = 500;

module.exports.run = async function ({ api, event }) {
    const threadID = String(event.threadID || "");
    const senderID = String(event.senderID || "");

    if (!threadID) return;

    // المطور فقط
    if (senderID !== DEVELOPER_ID) {
        return api.sendMessage(
            "هذا الأمر مخصص للمطور فقط",
            threadID,
            event.messageID
        );
    }

    const body = String(event.body || "").trim();

    // إزالة اسم الأمر واستخراج الرسالة فقط
    const message = body.replace(/^رسائل\s*/i, "").trim();

    if (!message) {
        return api.sendMessage(
            "الاستخدام الصحيح:\nرسائل <الرسالة>\n\nمثال:\nرسائل مرحبا",
            threadID,
            event.messageID
        );
    }

    // إرسال الرسالة 10 مرات
    for (let i = 0; i < MESSAGE_COUNT; i++) {
        await new Promise(resolve => {
            api.sendMessage(message, threadID, () => resolve());
        });

        // تأخير بسيط بين الرسائل
        if (i < MESSAGE_COUNT - 1) {
            await new Promise(resolve => setTimeout(resolve, DELAY));
        }
    }
};