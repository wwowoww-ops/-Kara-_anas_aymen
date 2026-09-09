module.exports.config = {
    name: "رسائل",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "أبو هريرة",
    description: "إرسال رسالة عدة مرات في المجموعة",
    commandCategory: "Developer",
    usages: "رسائل <الرسالة> <العدد>",
    cooldowns: 5
};

const DEVELOPER_ID = "61592700121061";
const MAX_MESSAGES = 20;

module.exports.run = async function ({ api, event }) {
    const threadID = String(event.threadID || "");
    const senderID = String(event.senderID || "");

    if (senderID !== DEVELOPER_ID) {
        return api.sendMessage(
            "هذا الأمر مخصص للمطور فقط",
            threadID,
            event.messageID
        );
    }

    const input = String(event.body || "").trim();

    const match = input.match(/^رسائل\s+([\s\S]+?)\s+(\d+)$/i);

    if (!match) {
        return api.sendMessage(
            "الاستخدام الصحيح:\nرسائل <الرسالة> <العدد>\n\nمثال:\nرسائل مرحبا 5",
            threadID,
            event.messageID
        );
    }

    const message = match[1].trim();
    const count = parseInt(match[2], 10);

    if (!message) {
        return api.sendMessage(
            "اكتب الرسالة التي تريد إرسالها",
            threadID,
            event.messageID
        );
    }

    if (!Number.isInteger(count) || count < 1) {
        return api.sendMessage(
            "العدد يجب أن يكون رقما صحيحا أكبر من 0",
            threadID,
            event.messageID
        );
    }

    if (count > MAX_MESSAGES) {
        return api.sendMessage(
            `الحد الأقصى هو ${MAX_MESSAGES} رسالة`,
            threadID,
            event.messageID
        );
    }

    for (let i = 0; i < count; i++) {
        await new Promise(resolve => {
            api.sendMessage(
                message,
                threadID,
                () => resolve()
            );
        });

        // تأخير بسيط بين الرسائل
        if (i < count - 1) {
            await new Promise(resolve =>
                setTimeout(resolve, 500)
            );
        }
    }
};