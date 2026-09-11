module.exports.config = {
    name: "guardBot",
    eventType: ["log:subscribe"],
    version: "1.2.0",
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

// ==================================================
// تحويل أي ID إلى String بشكل آمن
// ==================================================

function normalizeID(id) {

    if (
        id === undefined ||
        id === null
    ) {
        return "";
    }

    return String(id).trim();

}

// ==================================================
// استخراج ID من كائن مشارك
// ==================================================

function getParticipantID(participant) {

    if (!participant) {
        return "";
    }

    return normalizeID(
        participant.userFbId ||
        participant.userFbID ||
        participant.userID ||
        participant.userId ||
        participant.id ||
        participant.uid ||
        ""
    );

}

// ==================================================
// الحدث
// ==================================================

module.exports.handleEvent = async function ({
    api,
    event
}) {

    try {

        if (!event) {
            return;
        }

        // ==================================================
        // بيانات المجموعة
        // ==================================================

        const threadID =
            normalizeID(
                event.threadID
            );

        if (!threadID) {
            return;
        }

        // ==================================================
        // ID البوت
        // ==================================================

        let botID = "";

        try {

            if (
                api &&
                typeof api.getCurrentUserID === "function"
            ) {

                botID =
                    normalizeID(
                        api.getCurrentUserID()
                    );

            }

        } catch (error) {

            console.error(
                "[guardBot] فشل الحصول على ID البوت:",
                error.message
            );

        }

        if (!botID) {

            console.error(
                "[guardBot] تعذر الحصول على ID البوت"
            );

            return;
        }

        // ==================================================
        // بيانات حدث الإضافة
        // ==================================================

        const logMessageData =
            event.logMessageData || {};

        const addedParticipants =
            Array.isArray(
                logMessageData.addedParticipants
            )
                ? logMessageData.addedParticipants
                : [];

        if (
            addedParticipants.length === 0
        ) {

            return;
        }

        // ==================================================
        // معرفة من تمت إضافته
        // ==================================================

        const addedIDs =
            addedParticipants
                .map(
                    participant =>
                        getParticipantID(
                            participant
                        )
                )
                .filter(Boolean);

        console.log(
            `[guardBot] Added IDs: ${addedIDs.join(", ")}`
        );

        // ==================================================
        // التأكد أن البوت هو أحد المضافين
        // ==================================================

        const botAdded =
            addedIDs.includes(botID);

        if (!botAdded) {

            return;
        }

        // ==================================================
        // الشخص الذي قام بالإضافة
        // ==================================================

        const author =
            normalizeID(
                event.author ||
                event.senderID ||
                logMessageData.author ||
                logMessageData.authorID ||
                logMessageData.actor ||
                logMessageData.actorID ||
                ""
            );

        console.log(
            `[guardBot] Bot ID: ${botID}`
        );

        console.log(
            `[guardBot] Author ID: ${author || "غير معروف"}`
        );

        console.log(
            `[guardBot] Thread ID: ${threadID}`
        );

        // ==================================================
        // إذا لم نستطع معرفة من أضاف البوت
        // ==================================================

        if (!author) {

            console.error(
                "[guardBot] لم يتم العثور على ID الشخص الذي أضاف البوت"
            );

            console.error(
                "[guardBot] Event:",
                JSON.stringify(
                    event,
                    null,
                    2
                )
            );

            return;
        }

        // ==================================================
        // التحقق من المطور
        // ==================================================

        const isDeveloper =
            DEVELOPER_IDS.includes(
                author
            );

        // ==================================================
        // المطور مسموح له
        // ==================================================

        if (isDeveloper) {

            console.log(
                `[guardBot] إضافة مصرح بها من المطور: ${author}`
            );

            return;
        }

        // ==================================================
        // إضافة غير مصرح بها
        // ==================================================

        console.log(
            "[guardBot] ⚠️ إضافة غير مصرح بها"
        );

        console.log(
            `[guardBot] الشخص: ${author}`
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
        // إرسال الرسالة
        // ==================================================

        try {

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

        } catch (error) {

            console.error(
                "[guardBot] خطأ أثناء إرسال الرسالة:",
                error
            );

        }

        // ==================================================
        // انتظار بسيط
        // ==================================================

        await new Promise(
            resolve =>
                setTimeout(
                    resolve,
                    1000
                )
        );

        // ==================================================
        // إخراج البوت
        // ==================================================

        try {

            await new Promise(
                (resolve, reject) => {

                    api.removeUserFromGroup(
                        botID,
                        threadID,
                        error => {

                            if (error) {

                                console.error(
                                    "[guardBot] فشل خروج البوت:",
                                    error
                                );

                                return reject(
                                    error
                                );

                            }

                            console.log(
                                `[guardBot] خرج البوت بنجاح من: ${threadID}`
                            );

                            resolve();

                        }
                    );

                }
            );

        } catch (error) {

            console.error(
                "[guardBot] Remove User Error:",
                error
            );

        }

    } catch (error) {

        console.error(
            "================================="
        );

        console.error(
            "❌ GUARD BOT ERROR"
        );

        console.error(
            error
        );

        console.error(
            "================================="
        );

    }

};
