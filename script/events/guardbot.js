module.exports.config = {
    name: "guardBot",
    eventType: ["log:subscribe"],
    version: "1.1.0",
    credits: "أبو هريرة",
    description: "حماية زنجوبة من الإضافة بدون إذن المطور",
    category: "events"
};

// ==================================================
// المطورون المسموح لهم بإضافة البوت
// ==================================================

const DEVELOPER_IDS = [
    "61592700121061",
    "61578581225040"
];

module.exports.handleEvent = async function ({
    api,
    event
}) {

    try {

        if (!event) return;

        const threadID =
            String(event.threadID || "");

        const author =
            String(event.author || "");

        if (!threadID || !author) return;

        // ==================================================
        // ID البوت
        // ==================================================

        const botID =
            String(
                api.getCurrentUserID()
            );

        if (!botID) {
            console.error(
                "[guardBot] تعذر الحصول على ID البوت"
            );

            return;
        }

        // ==================================================
        // بيانات الإضافة
        // ==================================================

        const logMessageData =
            event.logMessageData || {};

        const addedParticipants =
            Array.isArray(
                logMessageData.addedParticipants
            )
                ? logMessageData.addedParticipants
                : [];

        if (!addedParticipants.length) {
            return;
        }

        // ==================================================
        // التأكد أن زنجوبة هي التي تمت إضافتها
        // ==================================================

        const botAdded =
            addedParticipants.some(
                participant =>
                    String(
                        participant.userFbId || ""
                    ) === botID
            );

        if (!botAdded) {
            return;
        }

        // ==================================================
        // التحقق من المطورين
        // ==================================================

        const isDeveloper =
            DEVELOPER_IDS.includes(author);

        // ==================================================
        // إذا كان أحد المطورين هو من أضاف البوت
        // ==================================================

        if (isDeveloper) {

            console.log(
                `[guardBot] تمت إضافة البوت بواسطة مطور مصرح به: ${author}`
            );

            return;
        }

        // ==================================================
        // إضافة غير مصرح بها
        // ==================================================

        console.log(
            `[guardBot] إضافة غير مصرح بها`
        );

        console.log(
            `[guardBot] الشخص الذي أضاف البوت: ${author}`
        );

        console.log(
            `[guardBot] المجموعة: ${threadID}`
        );

        // ==================================================
        // رسالة زنجوبة
        // ==================================================

        const message =
`إنت أضفتني بدون إذن المطور؟
ماشي، بس إذنه أول وبعدها نحكي '-'`;

        // ==================================================
        // إرسال الرسالة قبل الخروج
        // ==================================================

        await new Promise(resolve => {

            api.sendMessage(
                message,
                threadID,
                error => {

                    if (error) {

                        console.error(
                            "[guardBot] فشل إرسال رسالة الخروج:",
                            error
                        );

                    }

                    resolve();

                }
            );

        });

        // ==================================================
        // انتظار بسيط حتى تصل الرسالة
        // ==================================================

        await new Promise(resolve =>
            setTimeout(resolve, 1200)
        );

        // ==================================================
        // خروج البوت من المجموعة
        // ==================================================

        await new Promise((resolve, reject) => {

            api.removeUserFromGroup(
                botID,
                threadID,
                error => {

                    if (error) {

                        console.error(
                            "[guardBot] فشل خروج البوت من المجموعة:",
                            error
                        );

                        return reject(error);
                    }

                    console.log(
                        `[guardBot] خرج البوت من المجموعة بنجاح: ${threadID}`
                    );

                    resolve();

                }
            );

        });

    } catch (error) {

        console.error(
            "❌ GUARD BOT ERROR:",
            error
        );

    }

};