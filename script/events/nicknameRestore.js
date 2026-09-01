module.exports.config = {
name: "nicknameRestore",
eventType: ["log:subscribe"],
version: "2.0.0",
credits: "أبو هريرة",
description: "استرجاع كنى الأعضاء السابقين عند عودتهم",
category: "events"
};

module.exports.handleEvent = async function ({
api,
event,
Users,
Nicknames
}) {

try {

    if (
        !event ||
        !Nicknames ||
        !Users
    ) {
        return;
    }

    // ==================================================
    // التأكد من نوع الحدث
    // ==================================================

    if (
        event.logMessageType !==
        "log:subscribe"
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

    const addedParticipants =
        Array.isArray(
            logData.addedParticipants
        )
            ? logData.addedParticipants
            : [];

    if (!addedParticipants.length) {
        return;
    }

    // ==================================================
    // ID البوت
    // ==================================================

    const botID =
        String(
            api.getCurrentUserID()
        );

    // ==================================================
    // تجاهل دخول البوت
    // ==================================================

    if (
        addedParticipants.some(
            participant =>
                String(
                    participant.userFbId || ""
                ) === botID
        )
    ) {
        return;
    }

    // ==================================================
    // الحصول على معلومات المجموعة
    // ==================================================

    const threadInfo =
        await new Promise(
            (resolve, reject) => {

                api.getThreadInfo(
                    threadID,
                    (error, info) => {

                        if (error) {
                            return reject(error);
                        }

                        resolve(info);

                    }
                );

            }
        );

    if (!threadInfo) return;

    const currentNicknames =
        threadInfo.nicknames || {};

    // ==================================================
    // دالة الحصول على اسم العضو من قاعدة Users
    // ==================================================

    async function getDatabaseName(userID) {

        try {

            const userData =
                await Users.getData(
                    String(userID)
                );

            if (
                userData &&
                userData.name
            ) {

                return String(
                    userData.name
                ).trim();

            }

        } catch (error) {

            console.error(
                "[nicknameRestore] USER DATABASE ERROR:",
                error.message
            );

        }

        return "العضو";
    }

    // ==================================================
    // أولًا:
    // معالجة الأعضاء الذين دخلوا
    // ==================================================

    for (
        const participant
        of addedParticipants
    ) {

        const userID =
            String(
                participant.userFbId || ""
            );

        if (!userID) continue;

        // ==================================================
        // البحث عن سجل سابق
        // ==================================================

        let savedRecord = null;

        try {

            savedRecord =
                await Nicknames.findOne({

                    where: {
                        threadID,
                        userID
                    }

                });

        } catch (error) {

            console.error(
                "[nicknameRestore] DATABASE FIND ERROR:",
                error.message
            );

            continue;
        }

        // ==================================================
        // عضو سابق
        // ==================================================

        if (savedRecord) {

            const savedNickname =
                String(
                    savedRecord.nickname || ""
                ).trim();

            const savedUserName =
                String(
                    savedRecord.userName || ""
                ).trim();

            if (
                !savedNickname
            ) {
                continue;
            }

            try {

                await new Promise(
                    (resolve, reject) => {

                        api.changeNickname(
                            savedNickname,
                            threadID,
                            userID,
                            error => {

                                if (error) {
                                    return reject(error);
                                }

                                resolve();

                            }
                        );

                    }
                );

                // ==================================================
                // رسالة النجاح
                // الاسم والكنية من قاعدة البيانات
                // ==================================================

                const message =

`⌬ ━━ 𝗛𝗜𝗡𝗔 ━━ ⌬

🏷️ تم استرجاع الكنية بنجاح

👤 ${savedUserName || "العضو"}
✦ الكنية: ${savedNickname}`;

                api.sendMessage(
                    message,
                    threadID
                );

            } catch (error) {

                console.error(
                    "[nicknameRestore] CHANGE NICKNAME ERROR:",
                    error.message
                );

            }

            continue;
        }

        // ==================================================
        // عضو جديد لأول مرة
        // ==================================================

        const currentNickname =
            String(
                currentNicknames[userID] || ""
            ).trim();

        // لا توجد كنية أصلًا
        if (
            !currentNickname
        ) {
            continue;
        }

        // ==================================================
        // الحصول على الاسم من قاعدة Users
        // ==================================================

        const userName =
            await getDatabaseName(
                userID
            );

        // ==================================================
        // حفظ العضو للمستقبل
        // ==================================================

        try {

            await Nicknames.upsert({

                threadID,
                userID,
                userName,
                nickname: currentNickname,
                updatedAt: new Date()

            });

        } catch (error) {

            console.error(
                "[nicknameRestore] DATABASE SAVE ERROR:",
                error.message
            );

        }

    }

    // ==================================================
    // ثانيًا:
    // حفظ الكنى الحالية لبقية أعضاء المجموعة
    //
    // هذا يجعل النظام يتعلم الكنى أثناء وجود الأعضاء
    // ==================================================

    for (
        const userID of Object.keys(
            currentNicknames
        )
    ) {

        const normalizedUserID =
            String(userID || "");

        const nickname =
            String(
                currentNicknames[userID] || ""
            ).trim();

        if (
            !normalizedUserID ||
            !nickname ||
            normalizedUserID === botID
        ) {
            continue;
        }

        try {

            const existing =
                await Nicknames.findOne({

                    where: {
                        threadID,
                        userID:
                            normalizedUserID
                    }

                });

            // ==================================================
            // لا نغيّر السجل القديم بدون حاجة
            // ==================================================

            if (existing) {
                continue;
            }

            // ==================================================
            // الاسم من قاعدة Users
            // ==================================================

            const userName =
                await getDatabaseName(
                    normalizedUserID
                );

            await Nicknames.create({

                threadID,
                userID:
                    normalizedUserID,
                userName,
                nickname,
                updatedAt:
                    new Date()

            });

        } catch (error) {

            console.error(
                "[nicknameRestore] SNAPSHOT SAVE ERROR:",
                error.message
            );

        }

    }

} catch (error) {

    console.error(
        "❌ NICKNAME RESTORE ERROR:",
        error
    );

}

};