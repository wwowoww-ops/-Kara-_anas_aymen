module.exports.config = {
name: "leaveNoti",
eventType: ["log:unsubscribe"],
version: "6.0.0",
credits: "HINA System - Abu Huraira",
description: "نظام وداع أعضاء المجموعة",
category: "events"
};

module.exports.handleEvent = async function ({
api,
event,
Users,
Threads
}) {

try {

    // ==================================================
    // التأكد من وجود Event
    // ==================================================

    if (!event) {
        return;
    }

    // ==================================================
    // التأكد أن الحدث مغادرة
    // ==================================================

    if (
        event.logMessageType !==
        "log:unsubscribe"
    ) {
        return;
    }

    // ==================================================
    // IDs
    // ==================================================

    const threadID =
        String(event.threadID || "");

    if (!threadID) {
        return;
    }

    const logData =
        event.logMessageData || {};

    const leftID =
        String(
            logData.leftParticipantFbId || ""
        );

    if (!leftID) {
        return;
    }

    const botID =
        String(
            api.getCurrentUserID()
        );

    // ==================================================
    // تجاهل مغادرة البوت
    // ==================================================

    if (leftID === botID) {
        return;
    }

    // ==================================================
    // اسم العضو
    // ==================================================

    let userName = "";

    try {

        if (
            Users &&
            typeof Users.getData === "function"
        ) {

            const userData =
                await Users.getData(leftID);

            if (
                userData &&
                userData.name &&
                String(userData.name).trim()
            ) {

                userName =
                    String(userData.name).trim();

            }

        }

    } catch (error) {

        console.error(
            "[LEAVE] USER DATA ERROR:",
            error.message
        );

    }

    // ==================================================
    // محاولة الحصول على الاسم الحالي من API
    // ==================================================

    if (!userName) {

        try {

            if (
                typeof api.getUserInfo ===
                "function"
            ) {

                const userInfo =
                    await new Promise(
                        (resolve) => {

                            api.getUserInfo(
                                leftID,
                                (err, data) => {

                                    if (
                                        err ||
                                        !data
                                    ) {
                                        return resolve(null);
                                    }

                                    resolve(
                                        data[leftID] ||
                                        null
                                    );

                                }
                            );

                        }
                    );

                if (
                    userInfo &&
                    userInfo.name
                ) {

                    userName =
                        String(
                            userInfo.name
                        ).trim();

                }

            }

        } catch (error) {

            console.error(
                "[LEAVE] API USER INFO ERROR:",
                error.message
            );

        }

    }

    // ==================================================
    // إذا تعذر الحصول على الاسم
    // ==================================================

    if (!userName) {
        userName = "العضو";
    }

    // ==================================================
    // اسم المجموعة
    // ==================================================

    let threadName = "المجموعة";

    try {

        if (
            Threads &&
            typeof Threads.getInfo ===
            "function"
        ) {

            const info =
                await Threads.getInfo(
                    threadID
                );

            if (info?.threadName) {

                threadName =
                    info.threadName;

            }

        }

    } catch (error) {

        try {

            if (
                typeof api.getThreadInfo ===
                "function"
            ) {

                const info =
                    await api.getThreadInfo(
                        threadID
                    );

                if (info?.threadName) {

                    threadName =
                        info.threadName;

                }

            }

        } catch (e) {}

    }

    // ==================================================
    // معرفة نوع المغادرة
    // ==================================================

    const author =
        String(
            event.author || ""
        );

    const leftVoluntarily =
        author === leftID;

    // ==================================================
    // اسم من قام بالطرد
    // ==================================================

    let kickerName = "مشرف";

    if (
        !leftVoluntarily &&
        author
    ) {

        try {

            const kickerData =
                await Users.getData(
                    author
                );

            if (
                kickerData &&
                kickerData.name
            ) {

                kickerName =
                    String(
                        kickerData.name
                    ).trim();

            }

        } catch (error) {}

    }

    // ==================================================
    // رسالة الوداع
    // ==================================================

    let message;

    if (leftVoluntarily) {

        message =

`⌬ ━━ 𝗛𝗜𝗡𝗔  ━━ ⌬

👋 وداعًا @${userName}

قرر ${userName} أخيرًا أن يتركنا
بعد أن أتعب المجموعة بحضوره

نتمنى له رحلة موفقة
ولا تنسَ أن الباب مفتوح... من الخارج فقط

⌬ ━━━━━━━━━ ⌬`;

    } else {

        message =

`⌬ ━━ 𝗛𝗜𝗡𝗔  ━━ ⌬

👋 وداعًا @${userName}

تم طرده بواسطة ${kickerName}

يبدو أن المجموعة قررت أخذ استراحة منه

نتمنى له حظًا سعيدًا في مكان آخر

⌬ ━━━━━━━━━ ⌬`;

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
    // إرسال الرسالة
    // ==================================================

    return api.sendMessage(
        {
            body: message,
            mentions
        },
        threadID
    );

} catch (error) {

    console.error(
        "❌ LEAVE EVENT ERROR:",
        error
    );

}

};