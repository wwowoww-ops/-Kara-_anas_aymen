module.exports.config = {
    name: "nicknameRestore",
    eventType: [
        "log:subscribe",
        "log:user-nickname"
    ],
    version: "3.0.0",
    credits: "أبو هريرة",
    description: "حفظ واسترجاع كنى الأعضاء",
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
            !Nicknames
        ) {
            return;
        }

        const threadID =
            String(event.threadID || "");

        if (!threadID) {
            return;
        }

        const botID =
            String(
                api.getCurrentUserID()
            );

        /*
         * ==========================================================
         * أولًا: حفظ الكنية عند تغييرها
         * ==========================================================
         */

        if (
            event.logMessageType ===
            "log:user-nickname"
        ) {

            const data =
                event.logMessageData || {};

            /*
             * بعض نسخ FCA تستخدم changedFor
             * وبعضها تستخدم participantID
             */

            const userID =
                String(
                    data.changedFor ||
                    data.participantID ||
                    data.userFbId ||
                    data.userID ||
                    ""
                );

            if (
                !userID ||
                userID === botID
            ) {
                return;
            }

            /*
             * محاولة استخراج الكنية الجديدة
             */

            const nickname =
                String(
                    data.nickname ||
                    data.newNickname ||
                    data.new_nickname ||
                    ""
                ).trim();

            /*
             * إذا أصبحت الكنية فارغة
             * فهذا يعني أن العضو أزيلت كنيته
             * لذلك نحذف السجل القديم
             */

            if (!nickname) {

                try {

                    await Nicknames.destroy({
                        where: {
                            threadID,
                            userID
                        }
                    });

                } catch (error) {

                    console.error(
                        "[nicknameRestore] DELETE NICKNAME ERROR:",
                        error.message
                    );

                }

                return;
            }

            let userName =
                "العضو";

            try {

                if (
                    Users &&
                    typeof Users.getData ===
                    "function"
                ) {

                    const userData =
                        await Users.getData(
                            userID
                        );

                    if (
                        userData &&
                        userData.name
                    ) {

                        userName =
                            String(
                                userData.name
                            ).trim();

                    }
                }

            } catch (error) {

                console.error(
                    "[nicknameRestore] USER NAME ERROR:",
                    error.message
                );

            }

            try {

                await Nicknames.upsert({

                    threadID,
                    userID,
                    userName,
                    nickname,
                    updatedAt:
                        new Date()

                });

            } catch (error) {

                console.error(
                    "[nicknameRestore] SAVE NICKNAME ERROR:",
                    error.message
                );

            }

            return;
        }

        /*
         * ==========================================================
         * ثانيًا: استرجاع الكنية عند رجوع العضو
         * ==========================================================
         */

        if (
            event.logMessageType !==
            "log:subscribe"
        ) {
            return;
        }

        const logData =
            event.logMessageData || {};

        const addedParticipants =
            Array.isArray(
                logData.addedParticipants
            )
                ? logData.addedParticipants
                : [];

        if (
            !addedParticipants.length
        ) {
            return;
        }

        /*
         * إذا دخل البوت نفسه
         * لا نسترجع أي كنية
         */

        if (
            addedParticipants.some(
                participant =>
                    String(
                        participant.userFbId ||
                        ""
                    ) === botID
            )
        ) {
            return;
        }

        /*
         * نبحث فقط عن السجلات الموجودة مسبقًا
         *
         * مهم:
         * لا نحفظ أي كنية جديدة هنا
         */

        for (
            const participant
            of addedParticipants
        ) {

            const userID =
                String(
                    participant.userFbId ||
                    ""
                );

            if (
                !userID ||
                userID === botID
            ) {
                continue;
            }

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
                    "[nicknameRestore] FIND ERROR:",
                    error.message
                );

                continue;
            }

            /*
             * لا يوجد سجل سابق
             * إذن العضو جديد بالنسبة لنظام الكنى
             */

            if (!savedRecord) {
                continue;
            }

            const savedNickname =
                String(
                    savedRecord.nickname ||
                    ""
                ).trim();

            const savedUserName =
                String(
                    savedRecord.userName ||
                    "العضو"
                ).trim();

            if (!savedNickname) {
                continue;
            }

            /*
             * تطبيق الكنية القديمة
             */

            try {

                await new Promise(
                    (resolve, reject) => {

                        api.changeNickname(
                            savedNickname,
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

                /*
                 * رسالة HINA
                 */

                const message =
`⌬ ━━ 𝗛𝗜𝗡𝗔 ━━ ⌬

🏷️ تم استرجاع الكنية بنجاح

👤 ${savedUserName}
✦ الكنية: ${savedNickname}`;

                await api.sendMessage(
                    message,
                    threadID
                );

            } catch (error) {

                console.error(
                    "[nicknameRestore] RESTORE ERROR:",
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