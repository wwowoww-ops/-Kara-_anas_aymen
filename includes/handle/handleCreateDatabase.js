module.exports = function ({
    Users,
    Threads,
    Currencies
}) {

    const logger =
        require("../../utils/log.js");

    return async function ({ event }) {

        try {

            if (!event) {
                return;
            }

            const {
                allUserID,
                allCurrenciesID,
                allThreadID,
                userName,
                threadInfo,
                threadData
            } = global.data;

            if (
                global.config.autoCreateDB === false
            ) {

                return;
            }

            let senderID =
                String(event.senderID || "");

            let threadID =
                String(event.threadID || "");

            if (!senderID) {
                return;
            }

            // ==================================================
            // GROUP
            // ==================================================

            if (
                threadID &&
                event.isGroup === true &&
                !allThreadID.includes(threadID)
            ) {

                const threadInfoFromFB =
                    await Threads.getInfo(threadID);

                if (
                    !threadInfoFromFB ||
                    typeof threadInfoFromFB !== "object"
                ) {

                    return;
                }

                const dataThread = {
                    threadName:
                        threadInfoFromFB.threadName || "",

                    adminIDs:
                        threadInfoFromFB.adminIDs || [],

                    nicknames:
                        threadInfoFromFB.nicknames || {}
                };

                allThreadID.push(threadID);

                if (
                    threadInfo &&
                    typeof threadInfo.set === "function"
                ) {

                    threadInfo.set(
                        threadID,
                        dataThread
                    );

                }

                if (
                    threadData &&
                    typeof threadData.set === "function"
                ) {

                    threadData.set(
                        threadID,
                        {}
                    );

                }

                // إنشاء المجموعة في Mongo
                try {

                    const existing =
                        await Threads.getData(
                            threadID
                        );

                    if (
                        !existing ||
                        existing === false
                    ) {

                        await Threads.createData(
                            threadID,
                            {
                                threadInfo:
                                    dataThread,

                                data: {}
                            }
                        );

                    }

                } catch (error) {

                    console.error(
                        "THREAD CREATE ERROR:",
                        error
                    );

                }

                // ==================================================
                // USERS OF GROUP
                // ==================================================

                if (
                    Array.isArray(
                        threadInfoFromFB.userInfo
                    )
                ) {

                    for (
                        const singleData
                        of threadInfoFromFB.userInfo
                    ) {

                        if (!singleData) {
                            continue;
                        }

                        const uid =
                            String(
                                singleData.id || ""
                            );

                        if (!uid) {
                            continue;
                        }

                        const name =
                            singleData.name || "";

                        if (
                            userName &&
                            typeof userName.set ===
                            "function"
                        ) {

                            userName.set(
                                uid,
                                name
                            );

                        }

                        // مهم:
                        // لا نضيف الاسم إلى allUserID
                        if (
                            !allUserID.includes(uid)
                        ) {

                            try {

                                await Users.createData(
                                    uid,
                                    {
                                        name,
                                        data: {}
                                    }
                                );

                            } catch (error) {

                                try {

                                    await Users.setData(
                                        uid,
                                        {
                                            name
                                        }
                                    );

                                } catch (e) {}

                            }

                            allUserID.push(uid);

                            logger(
                                `New user: ${name} || ${uid}`,
                                "[ USER ]"
                            );

                        }

                    }

                }

                logger(
                    `New group: ${threadID} || ${dataThread.threadName}`,
                    "[ THREAD ]"
                );

            }

            // ==================================================
            // CURRENT USER
            // ==================================================

            if (
                senderID &&
                (
                    !allUserID.includes(senderID) ||
                    !userName.has(senderID)
                )
            ) {

                try {

                    const infoUser =
                        await Users.getInfo(
                            senderID
                        );

                    const name =
                        infoUser?.name || "";

                    if (
                        !allUserID.includes(senderID)
                    ) {

                        try {

                            await Users.createData(
                                senderID,
                                {
                                    name,
                                    data: {}
                                }
                            );

                        } catch (error) {

                            try {

                                await Users.setData(
                                    senderID,
                                    {
                                        name
                                    }
                                );

                            } catch (e) {}

                        }

                        allUserID.push(
                            senderID
                        );

                    } else {

                        try {

                            await Users.setData(
                                senderID,
                                {
                                    name
                                }
                            );

                        } catch (e) {}

                    }

                    if (
                        userName &&
                        typeof userName.set ===
                        "function"
                    ) {

                        userName.set(
                            senderID,
                            name
                        );

                    }

                    logger(
                        `New user: ${name} || ${senderID}`,
                        "[ USER ]"
                    );

                } catch (error) {

                    console.error(
                        "CURRENT USER DATABASE ERROR:",
                        error
                    );

                }

            }

            // ==================================================
            // CURRENCY
            // ==================================================

            if (
                senderID &&
                !allCurrenciesID.includes(senderID)
            ) {

                try {

                    await Currencies.createData(
                        senderID,
                        {
                            data: {}
                        }
                    );

                } catch (error) {

                    console.error(
                        "CURRENCY CREATE ERROR:",
                        error
                    );

                }

                if (
                    !allCurrenciesID.includes(
                        senderID
                    )
                ) {

                    allCurrenciesID.push(
                        senderID
                    );

                }

            }

        } catch (error) {

            console.error(
                "HANDLE CREATE DATABASE ERROR:",
                error
            );

        }

    };

};