module.exports.config = {
    name: "nicknameRestore",
    eventType: [
        "log:subscribe",
        "log:user-nickname"
    ],
    version: "2.1.0",
    credits: "أبو هريرة",
    description: "حفظ واسترجاع كنيات الأعضاء تلقائياً"
};

module.exports.run = async function ({
    api,
    event,
    models
}) {

    if (!api || !event || !models) {
        return;
    }

    const Nicknames =
        models.use("Nicknames");

    const Users =
        models.use("Users");

    if (!Nicknames) {
        console.error(
            "[nicknameRestore] Nicknames model غير موجود"
        );
        return;
    }

    const threadID =
        String(event.threadID || "");

    if (!threadID) {
        return;
    }

    /*
     * في FCA:
     *
     * event.type
     * = "event"
     *
     * event.logMessageType
     * = "log:subscribe"
     * أو
     * = "log:user-nickname"
     */

    const eventType =
        event.logMessageType ||
        event.type;


    // =========================================================
    // تغيير كنية عضو
    // =========================================================

    if (
        eventType === "log:user-nickname"
    ) {

        const data =
            event.logMessageData || {};

        let userID =
            data.participant_id ||
            data.participantID ||
            data.changedFor ||
            data.userID ||
            data.userFbId ||
            event.participantID ||
            event.changedFor ||
            event.userID ||
            event.userFbId;

        if (!userID) {
            console.log(
                "[nicknameRestore] لم يتم العثور على userID في حدث تغيير الكنية"
            );
            return;
        }

        userID = String(userID);


        let nickname =
            data.nickname ??
            data.newNickname ??
            data.new_nickname ??
            event.nickname ??
            event.newNickname ??
            event.new_nickname ??
            "";


        if (
            nickname === null ||
            nickname === undefined
        ) {
            nickname = "";
        }

        nickname =
            String(nickname).trim();


        // -----------------------------------------------------
        // إذا تم حذف الكنية
        // -----------------------------------------------------

        if (!nickname) {

            try {

                await Nicknames.destroy({
                    where: {
                        threadID,
                        userID
                    }
                });

                console.log(
                    `[nicknameRestore] تم حذف سجل الكنية: ${userID} | ${threadID}`
                );

            } catch (error) {

                console.error(
                    "[nicknameRestore] فشل حذف الكنية:",
                    error.message || error
                );

            }

            return;
        }


        // -----------------------------------------------------
        // الحصول على الاسم الحقيقي
        // -----------------------------------------------------

        let userName =
            data.userName ||
            data.fullName ||
            event.userName ||
            event.fullName ||
            "عضو غير معروف";


        try {

            if (Users) {

                const userData =
                    await Users.getData(userID);

                if (
                    userData &&
                    userData.name
                ) {

                    userName =
                        userData.name;

                }

            }

        } catch (_) {}


        // -----------------------------------------------------
        // حفظ الكنية
        // -----------------------------------------------------

        try {

            await Nicknames.upsert({
                threadID,
                userID,
                userName,
                nickname,
                updatedAt: new Date()
            });

            console.log(
                `[nicknameRestore] تم حفظ الكنية: ${userID} -> ${nickname}`
            );

        } catch (error) {

            console.error(
                "[nicknameRestore] فشل حفظ الكنية:",
                error.message || error
            );

        }

        return;
    }


    // =========================================================
    // دخول عضو للمجموعة
    // =========================================================

    if (
        eventType === "log:subscribe"
    ) {

        const data =
            event.logMessageData || {};

        const addedParticipants =
            data.addedParticipants || [];


        if (
            !Array.isArray(addedParticipants) ||
            addedParticipants.length === 0
        ) {

            console.log(
                "[nicknameRestore] log:subscribe بدون أعضاء مضافين"
            );

            return;
        }


        for (
            const participant
            of addedParticipants
        ) {

            const userID =
                String(
                    participant.userFbId ||
                    participant.userID ||
                    participant.id ||
                    participant.userId ||
                    ""
                );


            if (!userID) {
                continue;
            }


            console.log(
                `[nicknameRestore] عضو جديد: ${userID}`
            );


            // -------------------------------------------------
            // البحث عن الكنية القديمة
            // -------------------------------------------------

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
                    "[nicknameRestore] فشل البحث عن الكنية:",
                    error.message || error
                );

                continue;
            }


            // -------------------------------------------------
            // لا يوجد سجل سابق
            // -------------------------------------------------

            if (!savedRecord) {

                console.log(
                    `[nicknameRestore] لا توجد كنية محفوظة للعضو ${userID}`
                );

                continue;
            }


            const nickname =
                String(
                    savedRecord.nickname || ""
                ).trim();


            if (!nickname) {
                continue;
            }


            // -------------------------------------------------
            // استرجاع الكنية
            // -------------------------------------------------

            try {

                await new Promise(
                    (resolve, reject) => {

                        api.changeNickname(
                            nickname,
                            threadID,
                            userID,
                            error => {

                                if (error) {
                                    return reject(
                                        error
                                    );
                                }

                                resolve();

                            }
                        );

                    }
                );


                // ------------------------------------------------
                // الاسم المحفوظ
                // ------------------------------------------------

                const userName =
                    savedRecord.userName ||
                    participant.fullName ||
                    "عضو غير معروف";


                // ------------------------------------------------
                // رسالة HINA
                // ------------------------------------------------

                await new Promise(
                    resolve => {

                        api.sendMessage(
`⌬ ━━ 𝗛𝗜𝗡𝗔 ━━ ⌬

🏷️ تم استرجاع الكنية بنجاح

👤 ${userName}
✦ الكنية: ${nickname}`,
                            threadID,
                            () => resolve()
                        );

                    }
                );


                console.log(
                    `[nicknameRestore] تم استرجاع كنية ${userName}: ${nickname}`
                );


            } catch (error) {

                console.error(
                    `[nicknameRestore] فشل استرجاع كنية ${userID}:`,
                    error.message || error
                );

            }

        }

    }

};