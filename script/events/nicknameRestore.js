module.exports.config = {
    name: "nicknameRestore",
    eventType: [
        "log:subscribe",
        "log:user-nickname"
    ],
    version: "2.0.0",
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


    // =========================================================
    // تغيير كنية عضو
    // =========================================================

    if (
        event.type === "log:user-nickname"
    ) {

        let userID =
            event.participantID ||
            event.changedFor ||
            event.userID ||
            event.userFbId;

        if (!userID) {
            return;
        }

        userID = String(userID);

        let nickname =
            event.nickname ??
            event.newNickname ??
            event.new_nickname ??
            event.name ??
            "";

        if (
            nickname === null ||
            nickname === undefined
        ) {
            nickname = "";
        }

        nickname = String(nickname).trim();


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
        // الحصول على الاسم الحقيقي وتخزينه
        // -----------------------------------------------------

        let userName =
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
        event.type === "log:subscribe"
    ) {

        const addedParticipants =
            event.addedParticipants || [];

        if (
            !Array.isArray(addedParticipants) ||
            addedParticipants.length === 0
        ) {
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
                    ""
                );

            if (!userID) {
                continue;
            }


            // -------------------------------------------------
            // البحث عن الكنية القديمة
            // -------------------------------------------------

            const savedRecord =
                await Nicknames.findOne({
                    where: {
                        threadID,
                        userID
                    }
                });


            // لا يوجد سجل قديم = لا نفعل شيئاً
            if (!savedRecord) {
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
                // رسالة HINA
                // ------------------------------------------------

                const userName =
                    savedRecord.userName ||
                    participant.fullName ||
                    "عضو غير معروف";

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