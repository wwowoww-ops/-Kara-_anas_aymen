module.exports.config = {
    name: "academyJoin",
    eventType: ["log:subscribe"],
    version: "3.0.0",
    credits: "أبو هريرة",
    description: "نظام أكاديمية ANGELS للترحيب والكنية والترقيم",
    category: "events"
};

// ==================================================
// مجموعة الأكاديمية فقط
// ==================================================

const ACADEMY_THREAD_ID =
    "8555825081107393";


// ==================================================
// الإعدادات
// ==================================================

const NICKNAME_DELAY = 3000; // 3 ثوانٍ بعد الاختبارات
const WAIT_TIME = 5 * 60 * 1000; // 5 دقائق


// ==================================================
// الجلسات المؤقتة
// ==================================================

const pending = new Map();


// ==================================================
// الاسم الأول
// ==================================================

function getFirstName(name) {

    const clean =
        String(name || "")
            .trim()
            .replace(/\s+/g, " ");

    if (!clean) {
        return "عضو";
    }

    return clean.split(" ")[0];
}


// ==================================================
// تغيير الكنية
// ==================================================

function changeNickname(
    api,
    threadID,
    userID,
    nickname
) {

    return new Promise(resolve => {

        try {

            api.changeNickname(
                nickname,
                threadID,
                userID,
                error => {

                    if (error) {

                        console.error(
                            "[academyJoin] NICKNAME ERROR:",
                            error
                        );

                        return resolve(false);
                    }

                    resolve(true);
                }
            );

        } catch (error) {

            console.error(
                "[academyJoin] NICKNAME EXCEPTION:",
                error
            );

            resolve(false);
        }
    });
}


// ==================================================
// معلومات المجموعة
// ==================================================

function getThreadInfo(
    api,
    threadID
) {

    return new Promise(resolve => {

        try {

            api.getThreadInfo(
                threadID,
                (error, info) => {

                    if (error || !info) {
                        return resolve(null);
                    }

                    resolve(info);
                }
            );

        } catch (error) {

            resolve(null);
        }
    });
}


// ==================================================
// إزالة HandleReply قديم
// ==================================================

function removeHandleReply(
    messageID
) {

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
                String(item.messageID) !==
                String(messageID)
        );
}


// ==================================================
// إرسال رسالة طلب الكنية
// ==================================================

async function askNickname(
    api,
    threadID,
    userID,
    accountName
) {

    const firstName =
        getFirstName(accountName);


    return new Promise(resolve => {

        const text =
`⌬ ━━ 𝗛𝗜𝗡𝗔 〢 𝗔𝗡𝗚𝗘𝗟𝗦 𝗔𝗖𝗔𝗗𝗘𝗠𝗬 ━━ ⌬

@${accountName}

أرسل كنيتك بالرد على هذه الرسالة.

يمكن للعضو أو أحد أدمن المجموعة تحديد الكنية.

لديك 5 دقائق للرد.

إذا لم يصل أي رد سيتم استخدام اسم حسابك الأول تلقائيًا.

❈『 ANGELS ~ ACADEMY 』❈`;


        api.sendMessage(
            {
                body: text,

                mentions: [
                    {
                        tag: `@${accountName}`,
                        id: userID,
                        fromIndex:
                            text.indexOf(
                                `@${accountName}`
                            )
                    }
                ]
            },

            threadID,

            (error, info) => {

                if (error) {

                    console.error(
                        "[academyJoin] ASK NICKNAME ERROR:",
                        error
                    );

                    return resolve();
                }


                if (
                    !info ||
                    !info.messageID
                ) {

                    return resolve();
                }


                const messageID =
                    String(
                        info.messageID
                    );


                const session = {

                    type: "nickname",

                    messageID,

                    threadID,

                    userID,

                    accountName,

                    firstName,

                    finished: false,

                    timeout: null
                };


                pending.set(
                    messageID,
                    session
                );


                // تسجيل الرد في نظام البوت
                if (
                    !global.client.handleReply
                ) {

                    global.client.handleReply = [];

                }


                global.client.handleReply.push({

                    name: "academyJoin",

                    messageID,

                    author: userID,

                    targetID: userID,

                    threadID,

                    type: "nickname"

                });


                // مهلة الكنية
                session.timeout =
                    setTimeout(
                        async () => {

                            if (
                                session.finished
                            ) {
                                return;
                            }


                            session.finished =
                                true;


                            pending.delete(
                                messageID
                            );


                            removeHandleReply(
                                messageID
                            );


                            // لم يرد أحد
                            // نستخدم الاسم الأول
                            await askNumber(
                                api,
                                threadID,
                                userID,
                                firstName,
                                accountName
                            );

                        },
                        WAIT_TIME
                    );


                resolve();

            }
        );

    });
}


// ==================================================
// طلب الرقم من الأدمن
// ==================================================

async function askNumber(
    api,
    threadID,
    userID,
    nickname,
    accountName
) {

    try {

        const threadInfo =
            await getThreadInfo(
                api,
                threadID
            );


        if (!threadInfo) {
            return;
        }


        const adminIDs =
            new Set(
                Array.isArray(
                    threadInfo.adminIDs
                )
                    ? threadInfo.adminIDs.map(
                        id => String(id)
                    )
                    : []
            );


        return new Promise(resolve => {

            const text =
`⌬ ━━ 𝗛𝗜𝗡𝗔 〢 𝗔𝗡𝗚𝗘𝗟𝗦 𝗔𝗖𝗔𝗗𝗘𝗠𝗬 ━━ ⌬

تم تسجيل الكنية:

${nickname}

الآن نحتاج الرقم التسلسلي.

أحد أدمن المجموعة فقط يرد على هذه الرسالة بالرقم المطلوب.

مثال:
07

إذا لم يحدد أحد الأدمن الرقم خلال 5 دقائق سيتم تعيين:

EX_00

الكنية النهائية ستكون بالشكل:

EX_07 (${nickname})`;


            api.sendMessage(
                text,
                threadID,

                (error, info) => {

                    if (error) {

                        console.error(
                            "[academyJoin] ASK NUMBER ERROR:",
                            error
                        );

                        return resolve();
                    }


                    if (
                        !info ||
                        !info.messageID
                    ) {
                        return resolve();
                    }


                    const messageID =
                        String(
                            info.messageID
                        );


                    const session = {

                        type: "number",

                        messageID,

                        threadID,

                        userID,

                        nickname,

                        accountName,

                        adminIDs,

                        finished: false,

                        timeout: null
                    };


                    pending.set(
                        messageID,
                        session
                    );


                    // تسجيل HandleReply
                    if (
                        !global.client.handleReply
                    ) {

                        global.client.handleReply = [];

                    }


                    global.client.handleReply.push({

                        name: "academyJoin",

                        messageID,

                        author: userID,

                        targetID: userID,

                        threadID,

                        type: "number"

                    });


                    // مهلة الرقم
                    session.timeout =
                        setTimeout(
                            async () => {

                                if (
                                    session.finished
                                ) {
                                    return;
                                }


                                session.finished =
                                    true;


                                pending.delete(
                                    messageID
                                );


                                removeHandleReply(
                                    messageID
                                );


                                // لا يوجد رقم من الأدمن
                                await finishNickname(
                                    api,
                                    session,
                                    "00"
                                );

                            },
                            WAIT_TIME
                        );


                    resolve();

                }
            );

        });

    } catch (error) {

        console.error(
            "[academyJoin] ASK NUMBER EXCEPTION:",
            error
        );
    }
}


// ==================================================
// الكنية النهائية
// ==================================================

async function finishNickname(
    api,
    session,
    number
) {

    const cleanNumber =
        String(number)
            .trim()
            .replace(/^EX_/i, "")
            .padStart(2, "0");


    const finalNickname =
        `EX_${cleanNumber} (${session.nickname})`;


    const changed =
        await changeNickname(
            api,
            session.threadID,
            session.userID,
            finalNickname
        );


    if (!changed) {

        return api.sendMessage(
            `تعذر تغيير كنية العضو إلى:

${finalNickname}`,
            session.threadID
        );
    }


    return api.sendMessage(
        `⌬ ━━ 𝗛𝗜𝗡𝗔 〢 𝗔𝗡𝗚𝗘𝗟𝗦 𝗔𝗖𝗔𝗗𝗘𝗠𝗬 ━━ ⌬

تم تعيين الكنية بنجاح:

${finalNickname}`,
        session.threadID
    );
}


// ==================================================
// حدث دخول عضو
// ==================================================

module.exports.handleEvent = async function ({
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


        // ==================================================
        // المنشنات
        // ==================================================

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


        // ==================================================
        // رسالة الاختبارات الأصلية
        // ==================================================

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


        // ==================================================
        // إرسال الاختبارات أولًا
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
                        "[academyJoin] TEST SEND ERROR:",
                        error
                    );

                }

            }
        );


        // ==================================================
        // بعد 3 ثوانٍ طلب الكنية
        // ==================================================

        setTimeout(
            async () => {

                try {

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


                        await askNickname(
                            api,
                            threadID,
                            userID,
                            name
                        );

                    }

                } catch (error) {

                    console.error(
                        "[academyJoin] NICKNAME DELAY ERROR:",
                        error
                    );

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


// ==================================================
// نظام الرد
// ==================================================

module.exports.handleReply = async function ({
    api,
    event,
    handleReply
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


        if (!handleReply) {
            return;
        }


        const messageID =
            String(
                handleReply.messageID || ""
            );


        const session =
            pending.get(
                messageID
            );


        if (!session) {
            return;
        }


        if (session.finished) {
            return;
        }


        const senderID =
            String(
                event.senderID || ""
            );


        // ==================================================
        // مرحلة الكنية
        // ==================================================

        if (
            session.type ===
            "nickname"
        ) {

            const isMember =
                senderID ===
                session.userID;


            // نحتاج معلومات الأدمن
            const threadInfo =
                await getThreadInfo(
                    api,
                    threadID
                );


            const adminIDs =
                new Set(
                    Array.isArray(
                        threadInfo?.adminIDs
                    )
                        ? threadInfo.adminIDs.map(
                            id => String(id)
                        )
                        : []
                );


            const isAdmin =
                adminIDs.has(
                    senderID
                );


            // العضو أو الأدمن فقط
            if (
                !isMember &&
                !isAdmin
            ) {
                return;
            }


            const nickname =
                String(
                    event.body || ""
                )
                    .trim()
                    .replace(/\s+/g, " ");


            if (!nickname) {
                return;
            }


            if (
                nickname.length > 40
            ) {

                return api.sendMessage(
                    "الكنية طويلة جدًا.",
                    threadID,
                    event.messageID
                );

            }


            session.finished =
                true;


            if (session.timeout) {
                clearTimeout(
                    session.timeout
                );
            }


            pending.delete(
                messageID
            );


            removeHandleReply(
                messageID
            );


            // بعد الحصول على الكنية
            // نطلب الرقم من الأدمن
            return askNumber(
                api,
                threadID,
                session.userID,
                nickname,
                session.accountName
            );
        }


        // ==================================================
        // مرحلة الرقم
        // ==================================================

        if (
            session.type ===
            "number"
        ) {

            // الرقم للأدمن فقط
            if (
                !session.adminIDs.has(
                    senderID
                )
            ) {
                return;
            }


            const numberText =
                String(
                    event.body || ""
                )
                    .trim();


            // نقبل:
            // 0
            // 00
            // 7
            // 07
            // EX_07

            const match =
                numberText.match(
                    /^(?:EX_)?(\d{1,3})$/i
                );


            if (!match) {

                return api.sendMessage(
                    "أرسل رقم الترتيب فقط، مثال: 07",
                    threadID,
                    event.messageID
                );

            }


            const number =
                Number(
                    match[1]
                );


            if (
                number < 0 ||
                number > 999
            ) {

                return;
            }


            session.finished =
                true;


            if (session.timeout) {
                clearTimeout(
                    session.timeout
                );
            }


            pending.delete(
                messageID
            );


            removeHandleReply(
                messageID
            );


            return finishNickname(
                api,
                session,
                formatNumber(number)
            );
        }

    } catch (error) {

        console.error(
            "[academyJoin] HANDLE REPLY ERROR:",
            error
        );

    }

};