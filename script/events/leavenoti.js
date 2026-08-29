module.exports.config = {
    name: "leaveNoti",
    eventType: ["log:unsubscribe"],
    version: "9.0.0",
    credits: "HINA System - Abu Huraira",
    description: "نظام وداع سريع عند مغادرة أو طرد أعضاء المجموعة",
    category: "events"
};

module.exports.handleEvent = async function ({
    api,
    event,
    Users,
    Threads
}) {

    try {

        if (!event) return;

        // ==================================================
        // التأكد من نوع الحدث
        // ==================================================

        if (
            event.logMessageType !==
            "log:unsubscribe"
        ) {
            return;
        }

        // ==================================================
        // البيانات الأساسية
        // ==================================================

        const threadID =
            String(event.threadID || "");

        if (!threadID) return;

        const logData =
            event.logMessageData || {};

        const leftID =
            String(
                logData.leftParticipantFbId || ""
            );

        if (!leftID) return;

        // ==================================================
        // ID البوت
        // ==================================================

        const botID =
            String(
                api.getCurrentUserID()
            );

        // ==================================================
        // تجاهل خروج البوت
        // ==================================================

        if (leftID === botID) {
            return;
        }

        // ==================================================
        // الاسم
        // نستخدم اسم الحدث أولًا حتى يكون الإرسال سريعًا
        // ==================================================

        let userName =
            String(
                logData.leftParticipantName ||
                logData.leftParticipantFullName ||
                "العضو"
            ).trim();

        if (!userName) {
            userName = "العضو";
        }

        // ==================================================
        // معرفة نوع المغادرة
        // ==================================================

        const author =
            String(event.author || "");

        const leftVoluntarily =
            author === leftID;

        // ==================================================
        // الرسالة
        // ==================================================

        let message;

        // ==================================================
        // خروج العضو بنفسه
        // ==================================================

        if (leftVoluntarily) {

            message =
`╭━━━━━━━━━━━━━━━━╮
     𝗛𝗜𝗡𝗔          〢       وداع
╰━━━━━━━━━━━━━━━━╯

👋 وداعًا
    @${userName}

✦ قرر ${userName} أخيرًا أن يتركنا
✦ بعد أن أتعب المجموعة بحضوره

نتمنى له رحلة موفقة
ولا تنسَ أن الباب مفتوح... من الخارج فقط

╭━━━━━━━━━━━━━━━━╮
                      وداعًا
╰━━━━━━━━━━━━━━━━╯`;

        }

        // ==================================================
        // تم طرد العضو
        // ==================================================

        else {

            message =
`╭━━━━━━━━━━━━━━━━╮
     𝗛𝗜𝗡𝗔          〢       وداع
╰━━━━━━━━━━━━━━━━╯

👋 وداعًا
    @${userName}

✦ تم طرد ${userName} من المجموعة
✦ يبدو أن المجموعة قررت أخذ استراحة منه

نتمنى له حظًا سعيدًا في مكان آخر

╭━━━━━━━━━━━━━━━━╮
                      وداعًا
╰━━━━━━━━━━━━━━━━╯`;

        }

        // ==================================================
        // المنشن
        // ==================================================

        const mentions = [
            {
                tag: userName,
                id: leftID
            }
        ];

        // ==================================================
        // الإرسال الفوري
        // لا ننتظر Users أو Threads
        // ==================================================

        api.sendMessage(
            {
                body: message,
                mentions
            },
            threadID,
            error => {

                if (error) {

                    console.error(
                        "❌ LEAVE SEND ERROR:",
                        error
                    );

                }

            }
        );

        // ==================================================
        // تحديث البيانات في الخلفية
        // ==================================================

        setImmediate(async () => {

            try {

                // ------------------------------------------
                // تحديث بيانات العضو
                // ------------------------------------------

                if (
                    Users &&
                    typeof Users.getData ===
                    "function"
                ) {

                    try {

                        await Users.getData(
                            leftID
                        );

                    } catch (error) {

                        console.error(
                            "[LEAVE] USER UPDATE ERROR:",
                            error.message
                        );

                    }
                }

                // ------------------------------------------
                // تحديث بيانات الشخص الذي قام بالطرد
                // ------------------------------------------

                if (
                    !leftVoluntarily &&
                    author &&
                    Users &&
                    typeof Users.getData ===
                    "function"
                ) {

                    try {

                        await Users.getData(
                            author
                        );

                    } catch (error) {

                        console.error(
                            "[LEAVE] KICKER UPDATE ERROR:",
                            error.message
                        );

                    }
                }

                // ------------------------------------------
                // تحديث بيانات المجموعة
                // ------------------------------------------

                if (
                    Threads &&
                    typeof Threads.getInfo ===
                    "function"
                ) {

                    try {

                        await Threads.getInfo(
                            threadID
                        );

                    } catch (error) {

                        console.error(
                            "[LEAVE] THREAD UPDATE ERROR:",
                            error.message
                        );

                    }
                }

            } catch (error) {

                console.error(
                    "❌ BACKGROUND LEAVE ERROR:",
                    error
                );

            }

        });

    } catch (error) {

        console.error(
            "❌ LEAVE EVENT ERROR:",
            error
        );

    }

};