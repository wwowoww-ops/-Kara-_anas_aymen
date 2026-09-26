module.exports.config = {
    name: "academyJoin",
    eventType: ["log:subscribe"],
    version: "4.0.0",
    credits: "أبو هريرة",
    description: "نظام أكاديمية ANGELS عند دخول عضو جديد",
    category: "events"
};

const ACADEMY_THREAD_ID =
    "8555825081107393";

const NICKNAME_DELAY = 3000;
const SERIAL_WAIT_TIME = 5 * 60 * 1000;

const pending = new Map();

/*
 * ==========================================================
 * أدوات مساعدة
 * ==========================================================
 */

function getFirstName(name) {

    if (!name) {
        return "عضو";
    }

    return String(name)
        .trim()
        .split(/\s+/)[0] || "عضو";
}


async function getThreadInfo(api, threadID) {

    try {

        if (
            api &&
            typeof api.getThreadInfo === "function"
        ) {

            return await api.getThreadInfo(
                threadID
            );

        }

    } catch (error) {

        console.error(
            "[academyJoin] THREAD INFO ERROR:",
            error.message
        );

    }

    return null;
}


/*
 * ==========================================================
 * الحصول على اسم المستخدم
 * ==========================================================
 */

async function getUserName(api, userID) {

    try {

        if (
            api &&
            typeof api.getUserInfo === "function"
        ) {

            const info =
                await api.getUserInfo(
                    String(userID)
                );

            const user =
                info &&
                (
                    info[String(userID)] ||
                    info[userID]
                );

            if (
                user &&
                user.name
            ) {

                return String(
                    user.name
                ).trim();

            }

        }

    } catch (error) {

        console.error(
            "[academyJoin] GET NAME ERROR:",
            error.message
        );

    }

    return "عضو";
}


/*
 * ==========================================================
 * حذف HandleReply
 * ==========================================================
 */

function removeHandleReply(messageID) {

    if (
        !global.client ||
        !Array.isArray(
            global.client.handleReply
        )
    ) {
        return;
    }

    global.client.handleReply =
        global.client.handleReply.filter(
            item =>
                item.messageID != messageID
        );
}


/*
 * ==========================================================
 * تغيير الكنية
 * ==========================================================
 */

function changeNickname(
    api,
    threadID,
    userID,
    nickname
) {

    return new Promise(
        resolve => {

            try {

                api.changeNickname(
                    nickname,
                    threadID,
                    userID,
                    error => {

                        if (error) {

                            console.error(
                                "[academyJoin] CHANGE NICKNAME ERROR:",
                                error.message || error
                            );

                        }

                        resolve(!error);

                    }
                );

            } catch (error) {

                console.error(
                    "[academyJoin] CHANGE NICKNAME EXCEPTION:",
                    error.message
                );

                resolve(false);

            }

        }
    );
}


/*
 * ==========================================================
 * إنهاء الكنية
 * ==========================================================
 */

async function finishNickname(
    api,
    threadID,
    targetID,
    nickname,
    serial
) {

    const cleanSerial =
        String(serial || "00")
            .replace(
                /^EX_/i,
                ""
            )
            .replace(
                /\D/g,
                ""
            ) || "00";

    const finalSerial =
        cleanSerial
            .padStart(2, "0");

    const finalNickname =
        `EX_${finalSerial} (${nickname})`;

    await changeNickname(
        api,
        threadID,
        targetID,
        finalNickname
    );

    const mentions = [
        {
            tag: `@${nickname}`,
            id: String(targetID),
            fromIndex:
                (
                    `⌬ ━━ 𝗛𝗜𝗡𝗔 〢 𝗔𝗡𝗚𝗘𝗟𝗦 𝗔𝗖𝗔𝗗𝗘𝗠𝗬 ━━ ⌬\n\n`
                    + "تم تسجيل "
                ).length
        }
    ];

    const prefix =
`⌬ ━━ 𝗛𝗜𝗡𝗔 〢 𝗔𝗡𝗚𝗘𝗟𝗦 𝗔𝗖𝗔𝗗𝗘𝗠𝗬 ━━ ⌬

تم تسجيل `;

    const tag =
        `@${nickname}`;

    const body =
`${prefix}${tag}

الكنية: ${finalNickname}

تم اعتماد الرقم بنجاح.`;

    try {

        await api.sendMessage(
            {
                body,
                mentions
            },
            threadID
        );

    } catch (error) {

        console.error(
            "[academyJoin] FINAL MESSAGE ERROR:",
            error.message
        );

    }

    pending.delete(
        String(targetID)
    );
}


/*
 * ==========================================================
 * طلب الرقم من الأدمن
 * ==========================================================
 */

async function askNumber(
    api,
    threadID,
    targetID,
    nickname
) {

    const targetKey =
        String(targetID);

    const session =
        pending.get(targetKey);

    if (!session) {
        return;
    }

    session.nickname =
        nickname || session.nickname;

    session.type =
        "number";

    /*
     * لا نعتمد على قائمة الأدمن القديمة.
     * يتم التحقق من الأدمن عند الرد نفسه.
     */

    const message =
`⌬ ━━ 𝗛𝗜𝗡𝗔 〢 𝗔𝗡𝗚𝗘𝗟𝗦 𝗔𝗖𝗔𝗗𝗘𝗠𝗬 ━━ ⌬

تم اعتماد الكنية:

${session.nickname}

الآن نحتاج رقم العضو.

الأدمن فقط يرسل الرقم بالرد على هذه الرسالة.

مثال:
07
أو
EX_07

إذا لم يرسل أي أدمن رقمًا خلال 5 دقائق سيتم اعتماد EX_00 تلقائيًا.`;

    try {

        await api.sendMessage(
            message,
            threadID,
            (error, info) => {

                if (error) {

                    console.error(
                        "[academyJoin] NUMBER REQUEST ERROR:",
                        error
                    );

                    return;
                }

                if (
                    !info ||
                    !info.messageID
                ) {
                    return;
                }

                session.numberMessageID =
                    info.messageID;

                global.client.handleReply.push({
                    name: "academyJoin",
                    messageID: info.messageID,
                    author: targetID,
                    targetID: targetID,
                    threadID: threadID,
                    type: "number"
                });

                session.numberTimeout =
                    setTimeout(
                        async () => {

                            const current =
                                pending.get(
                                    targetKey
                                );

                            if (
                                !current ||
                                current.type !==
                                "number"
                            ) {
                                return;
                            }

                            removeHandleReply(
                                current.numberMessageID
                            );

                            await finishNickname(
                                api,
                                threadID,
                                targetID,
                                current.nickname,
                                "00"
                            );

                        },
                        SERIAL_WAIT_TIME
                    );

            }
        );

    } catch (error) {

        console.error(
            "[academyJoin] ASK NUMBER ERROR:",
            error
        );

    }
}


/*
 * ==========================================================
 * طلب الكنية
 * ==========================================================
 */

async function askNickname(
    api,
    threadID,
    targetID
) {

    const targetKey =
        String(targetID);

    if (
        pending.has(targetKey)
    ) {
        return;
    }

    const accountName =
        await getUserName(
            api,
            targetID
        );

    const firstName =
        getFirstName(
            accountName
        );

    const session = {
        targetID,
        threadID,
        accountName,
        firstName,
        nickname: null,
        type: "nickname",
        nicknameMessageID: null,
        numberMessageID: null,
        nicknameTimeout: null,
        numberTimeout: null
    };

    pending.set(
        targetKey,
        session
    );

    const message =
`⌬ ━━ 𝗛𝗜𝗡𝗔 〢 𝗔𝗡𝗚𝗘𝗟𝗦 𝗔𝗖𝗔𝗗𝗘𝗠𝗬 ━━ ⌬

@${firstName}

أرسل الكنية التي تريد اعتمادها في الأكاديمية بالرد على هذه الرسالة.

يمكنك أنت أو أحد الأدمن إرسال الكنية.

مثال:
Mohamed`;

    try {

        await api.sendMessage(
            {
                body: message,
                mentions: [
                    {
                        tag: `@${firstName}`,
                        id: String(targetID),
                        fromIndex:
                            (
                                "⌬ ━━ 𝗛𝗜𝗡𝗔 〢 𝗔𝗡𝗚𝗘𝗟𝗦 𝗔𝗖𝗔𝗗𝗘𝗠𝗬 ━━ ⌬\n\n"
                            ).length
                    }
                ]
            },
            threadID,
            (error, info) => {

                if (error) {

                    console.error(
                        "[academyJoin] NICKNAME REQUEST ERROR:",
                        error
                    );

                    return;
                }

                if (
                    !info ||
                    !info.messageID
                ) {
                    return;
                }

                session.nicknameMessageID =
                    info.messageID;

                global.client.handleReply.push({
                    name: "academyJoin",
                    messageID: info.messageID,
                    author: targetID,
                    targetID: targetID,
                    threadID: threadID,
                    type: "nickname"
                });

                session.nicknameTimeout =
                    setTimeout(
                        async () => {

                            const current =
                                pending.get(
                                    targetKey
                                );

                            if (
                                !current ||
                                current.type !==
                                "nickname"
                            ) {
                                return;
                            }

                            removeHandleReply(
                                current.nicknameMessageID
                            );

                            const fallbackNickname =
                                current.firstName ||
                                "عضو";

                            await askNumber(
                                api,
                                threadID,
                                targetID,
                                fallbackNickname
                            );

                        },
                        SERIAL_WAIT_TIME
                    );

            }
        );

    } catch (error) {

        console.error(
            "[academyJoin] ASK NICKNAME ERROR:",
            error
        );

    }
}


/*
 * ==========================================================
 * الحدث الأساسي
 * ==========================================================
 */

module.exports.handleEvent =
async function ({
    api,
    event
}) {

    try {

        if (!event) {
            return;
        }

        const threadID =
            String(
                event.threadID || ""
            );

        if (
            threadID !==
            ACADEMY_THREAD_ID
        ) {
            return;
        }

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

        const botID =
            String(
                api.getCurrentUserID()
            );

        const newMembers =
            addedParticipants.filter(
                participant =>
                    String(
                        participant.userFbId || ""
                    ) !== botID
            );

        if (
            newMembers.length === 0
        ) {
            return;
        }

        const mentions = [];
        let mentionText = "";

        for (
            const participant
            of newMembers
        ) {

            const userID =
                String(
                    participant.userFbId || ""
                );

            if (!userID) {
                continue;
            }

            const name =
                String(
                    participant.fullName ||
                    participant.name ||
                    "عضو جديد"
                );

            const tag =
                `@${name}`;

            const fromIndex =
                mentionText.length;

            mentionText +=
                tag + " ";

            mentions.push({
                tag,
                id: userID,
                fromIndex
            });
        }

        if (
            mentions.length === 0
        ) {
            return;
        }

        /*
         * ==================================================
         * رسالة الاختبارات الأصلية
         * ==================================================
         */

        const message =
`⌬ ━━ 𝗛𝗜𝗡𝗔 〢 𝗔𝗡𝗚𝗘𝗟𝗦 𝗔𝗖𝗔𝗗𝗘𝗠𝗬 ━━ ⌬

${mentionText}

أهلاً وسهلاً بك في أكاديمية الفرقة

★ الاختبارات الخاصة بالأكاديمية ★

★ وضع الشعار:
وضع شعار الأكاديمية على صورة البروفايل بطريقة صحيحة وثابتة.

★ تصميم منشورات:
إعداد منشور يحمل شعار أكاديمية الفرقة.

❈『 #ANGELS_ACADEMY 』❈

★ التعليق التفاعلي (20 تعليق):
كتابة 20 تعليقًا يتماشى مع ضوابط التفاعل الرسمية، مع توثيق كل تعليق بسكرين شوت وتجميعها وإرسالها لنا.

❈『 ANGELS ~ ACADEMY 』❈

★ إضافة أعضاء (20 عضو):
دعوة 20 عضوًا إلى مجموعة "أنمي باور" مع توثيق ذلك بسكرين وإرساله مع التعليقات السابقة.

★ تأمين الحساب (اختياري):
لمن يرغب في تعزيز أمان حسابه.

━━━━━━━━━━━━━━━━━━

مدة الأكاديمية يومين كحد أدنى.

ويُذكر اسمك مع إرسال التوثيق الخاص بالاختبارات.

بالتوفيق لك في الأكاديمية.`;

        await api.sendMessage(
            {
                body: message,
                mentions
            },
            threadID
        );

        /*
         * ==================================================
         * طلب الكنية بعد 3 ثوانٍ
         * ==================================================
         */

        setTimeout(
            async () => {

                for (
                    const participant
                    of newMembers
                ) {

                    const userID =
                        String(
                            participant.userFbId || ""
                        );

                    if (!userID) {
                        continue;
                    }

                    try {

                        await askNickname(
                            api,
                            threadID,
                            userID
                        );

                    } catch (error) {

                        console.error(
                            "[academyJoin] NICKNAME EVENT ERROR:",
                            error.message
                        );

                    }

                }

            },
            NICKNAME_DELAY
        );

    } catch (error) {

        console.error(
            "[academyJoin] ERROR:",
            error
        );

    }

};


/*
 * ==========================================================
 * الرد على رسائل الأكاديمية
 * ==========================================================
 */

module.exports.handleReply =
async function ({
    api,
    event,
    handleReply
}) {

    try {

        if (!event || !handleReply) {
            return;
        }

        const threadID =
            String(
                event.threadID || ""
            );

        if (
            threadID !==
            ACADEMY_THREAD_ID
        ) {
            return;
        }

        const targetID =
            String(
                handleReply.targetID || ""
            );

        if (!targetID) {
            return;
        }

        const targetKey =
            String(targetID);

        const session =
            pending.get(targetKey);

        if (!session) {
            return;
        }

        const senderID =
            String(
                event.senderID || ""
            );

        const body =
            String(
                event.body || ""
            ).trim();

        if (!body) {
            return;
        }

        /*
         * ==================================================
         * مرحلة الكنية
         * ==================================================
         */

        if (
            handleReply.type ===
            "nickname"
        ) {

            /*
             * العضو نفسه أو أي أدمن يستطيع
             * إرسال الكنية.
             */

            let isAdmin = false;

            try {

                const threadInfo =
                    await getThreadInfo(
                        api,
                        threadID
                    );

                const adminIDs =
                    Array.isArray(
                        threadInfo &&
                        threadInfo.adminIDs
                    )
                        ? threadInfo.adminIDs
                            .map(
                                id =>
                                    String(
                                        typeof id === "object"
                                            ? (
                                                id.id ||
                                                id.userFbId ||
                                                id.userID
                                            )
                                            : id
                                    )
                            )
                        : [];

                isAdmin =
                    adminIDs.includes(
                        senderID
                    );

            } catch (error) {

                console.error(
                    "[academyJoin] ADMIN CHECK ERROR:",
                    error.message
                );

            }

            if (
                senderID !== targetID &&
                !isAdmin
            ) {
                return;
            }

            clearTimeout(
                session.nicknameTimeout
            );

            removeHandleReply(
                handleReply.messageID
            );

            session.nickname =
                body;

            await askNumber(
                api,
                threadID,
                targetID,
                body
            );

            return;
        }


        /*
         * ==================================================
         * مرحلة الرقم
         * ==================================================
         */

        if (
            handleReply.type ===
            "number"
        ) {

            /*
             * فحص الأدمن لحظة الرد.
             * لا نعتمد على قائمة قديمة.
             */

            const threadInfo =
                await getThreadInfo(
                    api,
                    threadID
                );

            if (!threadInfo) {
                return;
            }

            const rawAdminIDs =
                Array.isArray(
                    threadInfo.adminIDs
                )
                    ? threadInfo.adminIDs
                    : [];

            const adminIDs =
                rawAdminIDs.map(
                    admin =>
                        String(
                            typeof admin === "object"
                                ? (
                                    admin.id ||
                                    admin.userFbId ||
                                    admin.userID
                                )
                                : admin
                        )
                );

            const isAdmin =
                adminIDs.includes(
                    senderID
                );

            if (!isAdmin) {
                return;
            }

            /*
             * قبول:
             * 7
             * 07
             * EX_07
             */

            const match =
                body.match(
                    /^(?:EX_)?(\d{1,3})$/i
                );

            if (!match) {
                return;
            }

            clearTimeout(
                session.numberTimeout
            );

            removeHandleReply(
                handleReply.messageID
            );

            await finishNickname(
                api,
                threadID,
                targetID,
                session.nickname,
                match[1]
            );

            return;
        }

    } catch (error) {

        console.error(
            "[academyJoin] HANDLE REPLY ERROR:",
            error
        );

    }

};
