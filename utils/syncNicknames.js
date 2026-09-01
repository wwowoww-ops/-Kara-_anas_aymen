module.exports = async function syncNicknames({
    api,
    Users,
    Nicknames
}) {

    if (!api || !Nicknames) {
        throw new Error(
            "syncNicknames: api أو Nicknames غير موجود"
        );
    }

    console.log(
        "[nicknameSync] بدء مزامنة الكنيات الحالية..."
    );

    const botID =
        String(api.getCurrentUserID());

    /*
     * جلب قائمة المحادثات
     */
    const threadList =
        await new Promise((resolve, reject) => {

            api.getThreadList(
                100,
                null,
                [],
                (error, list) => {

                    if (error) {
                        return reject(error);
                    }

                    resolve(
                        Array.isArray(list)
                            ? list
                            : []
                    );

                }
            );

        });

    let groups = 0;
    let saved = 0;

    for (const thread of threadList) {

        const threadID =
            String(
                thread.threadID || ""
            );

        if (!threadID) {
            continue;
        }

        /*
         * بعض المحادثات قد تكون فردية
         * لذلك نعتمد على threadInfo
         */
        let threadInfo;

        try {

            threadInfo =
                await new Promise(
                    (resolve, reject) => {

                        api.getThreadInfo(
                            threadID,
                            (error, info) => {

                                if (error) {
                                    return reject(
                                        error
                                    );
                                }

                                resolve(info);
                            }
                        );

                    }
                );

        } catch (error) {

            console.error(
                `[nicknameSync] فشل جلب المجموعة ${threadID}:`,
                error.message
            );

            continue;
        }

        if (!threadInfo) {
            continue;
        }

        /*
         * لا نريد المحادثات الفردية
         */
        const participantIDs =
            Array.isArray(
                threadInfo.participantIDs
            )
                ? threadInfo.participantIDs
                : [];

        if (participantIDs.length < 2) {
            continue;
        }

        const nicknames =
            threadInfo.nicknames || {};

        const nicknameIDs =
            Object.keys(nicknames);

        if (!nicknameIDs.length) {
            continue;
        }

        groups++;

        for (
            const userID
            of nicknameIDs
        ) {

            const normalizedUserID =
                String(userID || "");

            if (
                !normalizedUserID ||
                normalizedUserID === botID
            ) {
                continue;
            }

            const nickname =
                String(
                    nicknames[userID] || ""
                ).trim();

            if (!nickname) {
                continue;
            }

            let userName =
                "العضو";

            /*
             * الاسم من قاعدة Users
             */
            if (
                Users &&
                typeof Users.getData ===
                "function"
            ) {

                try {

                    const userData =
                        await Users.getData(
                            normalizedUserID
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

                } catch (error) {

                    console.error(
                        `[nicknameSync] فشل جلب اسم ${normalizedUserID}:`,
                        error.message
                    );

                }
            }

            /*
             * حفظ:
             *
             * threadID + userID
             *
             * لذلك نفس الشخص يستطيع امتلاك
             * كنية مختلفة في مجموعة أخرى.
             */
            try {

                await Nicknames.upsert({

                    threadID,
                    userID:
                        normalizedUserID,
                    userName,
                    nickname,
                    updatedAt:
                        new Date()

                });

                saved++;

            } catch (error) {

                console.error(
                    `[nicknameSync] فشل حفظ كنية ${normalizedUserID}:`,
                    error.message
                );

            }
        }
    }

    console.log(
        `[nicknameSync] تمت المزامنة — مجموعات: ${groups} | كنيات محفوظة: ${saved}`
    );

    return {
        groups,
        saved
    };
};