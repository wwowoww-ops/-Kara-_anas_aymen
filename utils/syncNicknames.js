module.exports = async function syncNicknames({
    api,
    Users,
    Nicknames
}) {
    if (!api) {
        throw new Error("syncNicknames: api غير موجود");
    }

    if (!Nicknames) {
        throw new Error("syncNicknames: Nicknames model غير موجود");
    }

    console.log(
        "[nicknameSync] بدء مزامنة الكنيات الحالية..."
    );

    const botID = String(api.getCurrentUserID());

    const threadList = await new Promise((resolve, reject) => {
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

    let saved = 0;
    let skipped = 0;
    let failed = 0;

    for (const thread of threadList) {

        const threadID = String(
            thread.threadID || ""
        );

        if (!threadID) {
            continue;
        }

        try {

            const threadInfo = await new Promise(
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

            if (!threadInfo) {
                continue;
            }

            const nicknames =
                threadInfo.nicknames || {};

            for (const [userID, nicknameValue] of Object.entries(
                nicknames
            )) {

                const normalizedUserID =
                    String(userID);

                if (
                    normalizedUserID === botID ||
                    !nicknameValue ||
                    typeof nicknameValue !== "string"
                ) {
                    skipped++;
                    continue;
                }

                const nickname =
                    nicknameValue.trim();

                if (!nickname) {
                    skipped++;
                    continue;
                }

                let userName =
                    "عضو غير معروف";

                try {

                    if (Users) {

                        const userData =
                            await Users.getData(
                                normalizedUserID
                            );

                        if (
                            userData &&
                            userData.name
                        ) {
                            userName =
                                userData.name;
                        }
                    }

                } catch (_) {
                    // نستخدم الاسم الافتراضي
                }

                await Nicknames.upsert({
                    threadID,
                    userID: normalizedUserID,
                    userName,
                    nickname,
                    updatedAt: new Date()
                });

                saved++;
            }

        } catch (error) {

            failed++;

            console.error(
                `[nicknameSync] فشل في المجموعة ${threadID}:`,
                error.message || error
            );
        }
    }

    console.log(
        `[nicknameSync] انتهت المزامنة | محفوظ: ${saved} | متجاهل: ${skipped} | فشل: ${failed}`
    );

    return {
        saved,
        skipped,
        failed
    };
};