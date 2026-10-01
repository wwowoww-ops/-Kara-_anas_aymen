/**
 * ايام.js
 * الإصدار 2.1.0
 *
 * إحصائيات آخر 7 أيام
 *
 * - لا يحسب رسائل البوت
 * - Pagination ثابت حسب طريقة getThreadHistory
 * - 50 رسالة في كل صفحة
 * - حتى 1000 صفحة
 * - إزالة الرسائل المتكررة
 * - إعادة المحاولة عند فشل الصفحة
 * - الأيام التي لم يتم الوصول إليها تظهر "فشل جلب"
 * - إرسال "جاري جلب الإحصائيات..." أولًا
 */

module.exports.config = {
    name: "ايام",
    version: "2.1.0",
    hasPermssion: 0,
    credits: "أبو هريرة",
    description: "عرض إحصائيات المجموعة خلال آخر 7 أيام",
    commandCategory: "Utility",
    usages: "ايام",
    cooldowns: 10
};


// ==================================================
// الإعدادات
// ==================================================

/*
 * توثيق getThreadHistory يستخدم 50
 * في مثال pagination.
 */

const HISTORY_AMOUNT = 50;


/*
 * 1000 × 50 = 50,000 رسالة
 *
 * هذا يسمح للمجموعات النشطة جدًا
 * بتغطية فترة أطول من 7 أيام.
 */

const MAX_HISTORY_PAGES = 1000;


/*
 * عدد محاولات إعادة جلب الصفحة.
 */

const PAGE_RETRIES = 3;


const ONE_DAY =
    24 *
    60 *
    60 *
    1000;


// ==================================================
// Timestamp
// ==================================================

function normalizeTimestamp(value) {

    const number = Number(value);

    if (!Number.isFinite(number)) {
        return 0;
    }

    /*
     * دعم seconds و milliseconds.
     */

    if (
        number > 0 &&
        number < 100000000000
    ) {

        return number * 1000;
    }

    return number;
}


function getMessageTimestamp(message) {

    if (!message) {
        return 0;
    }

    return normalizeTimestamp(
        message.timestamp ||
        message.time ||
        message.createdAt
    );
}


// ==================================================
// بداية اليوم بتوقيت تونس
// ==================================================

function getTunisiaDayStart(
    date = new Date()
) {

    const formatter =
        new Intl.DateTimeFormat(
            "en-US",
            {
                timeZone: "Africa/Tunis",
                year: "numeric",
                month: "2-digit",
                day: "2-digit"
            }
        );

    const parts =
        formatter.formatToParts(date);

    const values = {};

    for (const part of parts) {

        if (
            part.type !== "literal"
        ) {

            values[part.type] =
                part.value;
        }
    }

    return (
        Date.UTC(
            Number(values.year),
            Number(values.month) - 1,
            Number(values.day),
            0,
            0,
            0,
            0
        ) -
        (
            60 *
            60 *
            1000
        )
    );
}


// ==================================================
// اسم اليوم
// ==================================================

function getDayName(timestamp) {

    return new Intl.DateTimeFormat(
        "ar-TN",
        {
            timeZone: "Africa/Tunis",
            weekday: "long"
        }
    ).format(
        new Date(timestamp)
    );
}


// ==================================================
// التاريخ
// ==================================================

function getDateText(timestamp) {

    return new Intl.DateTimeFormat(
        "ar-TN",
        {
            timeZone: "Africa/Tunis",
            day: "2-digit",
            month: "2-digit"
        }
    ).format(
        new Date(timestamp)
    );
}


// ==================================================
// الصور
// ==================================================

function isImageAttachment(
    attachment
) {

    if (!attachment) {
        return false;
    }

    const type =
        String(
            attachment.type ||
            attachment.mimeType ||
            attachment.mime ||
            ""
        ).toLowerCase();

    if (
        type === "photo" ||
        type === "image" ||
        type === "image/jpeg" ||
        type === "image/jpg" ||
        type === "image/png" ||
        type === "image/webp" ||
        type === "image/gif"
    ) {

        return true;
    }

    if (
        attachment.photoID ||
        attachment.photoId ||
        attachment.imageID ||
        attachment.imageId
    ) {

        return true;
    }

    const url =
        String(
            attachment.url ||
            attachment.href ||
            attachment.src ||
            attachment.previewUrl ||
            attachment.previewURL ||
            ""
        ).toLowerCase();

    return /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(
        url
    );
}


function getImageCount(message) {

    if (
        !message ||
        !Array.isArray(
            message.attachments
        )
    ) {

        return 0;
    }

    let count = 0;

    for (
        const attachment
        of message.attachments
    ) {

        if (
            isImageAttachment(
                attachment
            )
        ) {

            count++;
        }
    }

    return count;
}


// ==================================================
// معرف ثابت للرسالة
// ==================================================

function getMessageKey(message) {

    if (!message) {
        return "";
    }

    /*
     * الأولوية للـ messageID.
     */

    const messageID =
        message.messageID ||
        message.messageId ||
        message.id;

    if (messageID) {

        return `id:${String(messageID)}`;
    }


    /*
     * احتياط في حال عدم وجود messageID.
     */

    const timestamp =
        getMessageTimestamp(
            message
        );

    const senderID =
        String(
            message.senderID ||
            message.authorID ||
            ""
        );

    const body =
        typeof message.body === "string"
            ? message.body
            : "";

    const attachments =
        Array.isArray(
            message.attachments
        )
            ? message.attachments
            : [];

    const attachmentIDs =
        attachments
            .map(
                attachment =>
                    String(
                        attachment?.photoID ||
                        attachment?.photoId ||
                        attachment?.id ||
                        attachment?.url ||
                        ""
                    )
            )
            .join(",");

    return [
        "fallback",
        timestamp,
        senderID,
        body,
        attachmentIDs
    ].join("|");
}


// ==================================================
// جلب صفحة
// ==================================================

async function fetchHistoryPage(
    api,
    threadID,
    timestamp
) {

    let lastError = null;

    for (
        let attempt = 1;
        attempt <= PAGE_RETRIES;
        attempt++
    ) {

        try {

            const history =
                await api.getThreadHistory(
                    String(threadID),
                    HISTORY_AMOUNT,
                    timestamp
                );

            if (
                Array.isArray(history)
            ) {

                return history;
            }

            return [];

        } catch (error) {

            lastError =
                error;

            console.error(
                `[ايام] فشل الصفحة ${attempt}/${PAGE_RETRIES}:`,
                error?.message ||
                error
            );

            if (
                attempt < PAGE_RETRIES
            ) {

                await new Promise(
                    resolve =>
                        setTimeout(
                            resolve,
                            1000 * attempt
                        )
                );
            }
        }
    }

    throw (
        lastError ||
        new Error(
            "فشل تحميل سجل الرسائل."
        )
    );
}


// ==================================================
// جلب آخر 7 أيام
// ==================================================

async function getWeekMessages(
    api,
    threadID
) {

    const todayStart =
        getTunisiaDayStart();

    /*
     * الخميس 01/10
     * ← الجمعة 25/09
     */

    const weekStart =
        todayStart -
        (
            6 *
            ONE_DAY
        );


    const messages = [];

    const messageKeys =
        new Set();


    /*
     * undefined = آخر الرسائل.
     */

    let timestamp;


    let oldestSeen =
        null;


    let pageCount = 0;


    let complete =
        false;


    let stoppedReason =
        "unknown";


    for (
        let page = 0;
        page < MAX_HISTORY_PAGES;
        page++
    ) {

        pageCount++;


        let history;

        try {

            history =
                await fetchHistoryPage(
                    api,
                    threadID,
                    timestamp
                );

        } catch (error) {

            stoppedReason =
                "history_error";

            break;
        }


        /*
         * لا توجد رسائل أخرى.
         */

        if (
            !history ||
            history.length === 0
        ) {

            /*
             * إذا وصلنا إلى ما قبل
             * بداية الفترة فكل شيء مكتمل.
             */

            if (
                oldestSeen !== null &&
                oldestSeen < weekStart
            ) {

                complete = true;

                stoppedReason =
                    "reached_start";

            } else {

                stoppedReason =
                    "empty_history";
            }

            break;
        }


        /*
         * ترتيب الصفحة من الأقدم
         * إلى الأحدث.
         */

        const validMessages =
            history
                .filter(
                    message =>
                        getMessageTimestamp(
                            message
                        ) > 0
                )
                .sort(
                    (a, b) =>
                        getMessageTimestamp(a) -
                        getMessageTimestamp(b)
                );


        if (
            validMessages.length === 0
        ) {

            stoppedReason =
                "no_valid_timestamps";

            break;
        }


        /*
         * حسب توثيق getThreadHistory:
         *
         * أقدم رسالة في الصفحة
         * هي cursor الصفحة التالية.
         */

        const pageOldest =
            getMessageTimestamp(
                validMessages[0]
            );


        /*
         * حماية إضافية.
         */

        if (
            oldestSeen === null ||
            pageOldest < oldestSeen
        ) {

            oldestSeen =
                pageOldest;
        }


        /*
         * إضافة الرسائل.
         */

        for (
            const message
            of validMessages
        ) {

            const messageTimestamp =
                getMessageTimestamp(
                    message
                );


            /*
             * أقدم من بداية الأيام السبعة.
             */

            if (
                messageTimestamp <
                weekStart
            ) {

                continue;
            }


            const key =
                getMessageKey(
                    message
                );


            if (!key) {
                continue;
            }


            /*
             * التخلص من الرسالة
             * المتكررة بين الصفحات.
             */

            if (
                messageKeys.has(key)
            ) {

                continue;
            }


            messageKeys.add(key);

            messages.push(
                message
            );
        }


        /*
         * وصلنا إلى بداية الفترة.
         */

        if (
            pageOldest <
            weekStart
        ) {

            complete = true;

            stoppedReason =
                "reached_start";

            break;
        }


        /*
         * إذا كانت الصفحة التالية
         * لن تتحرك للخلف فهذا يعني
         * أن pagination عالق.
         */

        if (
            timestamp !== undefined &&
            pageOldest >= timestamp
        ) {

            stoppedReason =
                "pagination_stuck";

            break;
        }


        /*
         * مهم جدًا:
         *
         * لا نطرح 1 من timestamp.
         *
         * نستخدم timestamp الأقدم
         * نفسه كما هو موضح في API.
         *
         * الرسالة الحدّية ستتكرر،
         * و getMessageKey سيحذف التكرار.
         */

        timestamp =
            pageOldest;
    }


    /*
     * وصلنا إلى الحد الأقصى
     * بدون الوصول إلى بداية الفترة.
     */

    if (
        !complete &&
        pageCount >=
        MAX_HISTORY_PAGES
    ) {

        stoppedReason =
            "max_pages";
    }


    /*
     * ترتيب نهائي.
     */

    messages.sort(
        (a, b) =>
            getMessageTimestamp(a) -
            getMessageTimestamp(b)
    );


    return {
        messages,
        weekStart,
        todayStart,
        pageCount,
        complete,
        stoppedReason,
        oldestSeen
    };
}


// ==================================================
// معلومات المجموعة
// ==================================================

async function getThreadInfo(
    api,
    Threads,
    threadID
) {

    let info = null;


    try {

        if (
            Threads &&
            typeof Threads.getInfo ===
            "function"
        ) {

            info =
                await Threads.getInfo(
                    String(threadID)
                );
        }

    } catch (error) {}


    if (!info) {

        try {

            info =
                await api.getThreadInfo(
                    String(threadID)
                );

        } catch (error) {}
    }


    return info;
}


// ==================================================
// الأعضاء
// ==================================================

function getParticipants(info) {

    if (
        Array.isArray(
            info?.participantIDs
        )
    ) {

        return info.participantIDs.map(
            id => String(id)
        );
    }


    if (
        Array.isArray(
            info?.participants
        )
    ) {

        return info.participants
            .map(
                user => {

                    if (
                        typeof user === "string" ||
                        typeof user === "number"
                    ) {

                        return String(user);
                    }


                    return String(
                        user?.id ||
                        user?.userID ||
                        ""
                    );
                }
            )
            .filter(Boolean);
    }


    return [];
}


// ==================================================
// تحليل الرسائل
// ==================================================

function analyzeMessages(
    messages,
    botID,
    weekStart,
    complete,
    oldestSeen
) {

    const days = [];


    /*
     * إنشاء 7 أيام.
     */

    for (
        let i = 0;
        i < 7;
        i++
    ) {

        const start =
            weekStart +
            (
                i *
                ONE_DAY
            );


        days.push({

            start,

            messages: 0,

            images: 0,

            activeUsers:
                new Set(),

            failed: false
        });
    }


    /*
     * إذا لم نصل إلى بداية الفترة،
     * الأيام التي لم نصل إليها
     * لا يجوز اعتبارها 0.
     */

    if (!complete) {

        /*
         * إذا لم نصل لأي timestamp
         * فلا نملك أي يوم مؤكد.
         */

        if (
            !oldestSeen
        ) {

            for (
                const day
                of days
            ) {

                day.failed = true;
            }

        } else {

            /*
             * أي يوم يبدأ قبل أقدم
             * timestamp وصلنا إليه
             * يعتبر غير مكتمل.
             */

            for (
                const day
                of days
            ) {

                if (
                    day.start <=
                    oldestSeen
                ) {

                    day.failed = true;
                }
            }
        }
    }


    /*
     * تحليل الرسائل.
     */

    for (
        const message
        of messages
    ) {

        if (!message) {
            continue;
        }


        const senderID =
            String(
                message.senderID ||
                message.authorID ||
                ""
            );


        if (!senderID) {
            continue;
        }


        /*
         * لا نحسب رسائل البوت.
         */

        if (
            botID &&
            senderID === botID
        ) {

            continue;
        }


        const timestamp =
            getMessageTimestamp(
                message
            );


        if (!timestamp) {
            continue;
        }


        const dayIndex =
            Math.floor(
                (
                    timestamp -
                    weekStart
                ) /
                ONE_DAY
            );


        if (
            dayIndex < 0 ||
            dayIndex > 6
        ) {

            continue;
        }


        /*
         * إذا فشل جلب اليوم
         * لا نعطيه أرقامًا.
         */

        if (
            days[dayIndex].failed
        ) {

            continue;
        }


        /*
         * الصور.
         */

        const imageCount =
            getImageCount(
                message
            );


        if (
            imageCount > 0
        ) {

            days[
                dayIndex
            ].images +=
                imageCount;


            days[
                dayIndex
            ].activeUsers.add(
                senderID
            );


            continue;
        }


        /*
         * الرسائل النصية.
         */

        const body =
            typeof message.body ===
            "string"
                ? message.body.trim()
                : "";


        if (!body) {
            continue;
        }


        days[
            dayIndex
        ].messages++;


        days[
            dayIndex
        ].activeUsers.add(
            senderID
        );
    }


    return days;
}


// ==================================================
// الأمر
// ==================================================

module.exports.run = async function ({
    api,
    event,
    Threads
}) {

    const {
        threadID,
        messageID
    } = event;


    // ==================================================
    // رسالة البداية
    // ==================================================

    await new Promise(
        resolve => {

            api.sendMessage(
                "⌬ ━━ 𝗛𝗜𝗡𝗔 UTILITY ━━ ⌬\n\n" +
                "⏳ جاري جلب الإحصائيات...",
                threadID,
                () => resolve(),
                messageID
            );

        }
    );


    try {

        // ==================================================
        // معلومات المجموعة
        // ==================================================

        const info =
            await getThreadInfo(
                api,
                Threads,
                threadID
            );


        if (!info) {

            return api.sendMessage(
                "⌬ ━━ 𝗛𝗜𝗡𝗔 UTILITY ━━ ⌬\n\n" +
                "❌ فشل جلب معلومات المجموعة.",
                threadID,
                messageID
            );
        }


        // ==================================================
        // الأعضاء
        // ==================================================

        const participants =
            getParticipants(info);


        // ==================================================
        // ID البوت
        // ==================================================

        const botID =
            await getBotID(api);


        // ==================================================
        // جلب التاريخ
        // ==================================================

        const history =
            await getWeekMessages(
                api,
                threadID
            );


        // ==================================================
        // تحليل الأيام
        // ==================================================

        const days =
            analyzeMessages(
                history.messages,
                botID,
                history.weekStart,
                history.complete,
                history.oldestSeen
            );


        // ==================================================
        // الإجماليات
        // ==================================================

        let totalMessages = 0;

        let totalImages = 0;


        for (
            const day
            of days
        ) {

            if (
                day.failed
            ) {

                continue;
            }


            totalMessages +=
                day.messages;


            totalImages +=
                day.images;
        }


        // ==================================================
        // أكثر يوم نشاطًا
        // ==================================================

        let mostActiveDay =
            null;


        let highestActivity =
            -1;


        for (
            const day
            of days
        ) {

            if (
                day.failed
            ) {

                continue;
            }


            const activity =
                day.messages +
                day.images;


            if (
                activity >
                highestActivity
            ) {

                highestActivity =
                    activity;


                mostActiveDay =
                    day;
            }
        }


        // ==================================================
        // اسم المجموعة
        // ==================================================

        const groupName =
            info.threadName ||
            info.name ||
            "بدون اسم";


        // ==================================================
        // الأيام
        // ==================================================

        let daysText = "";


        for (
            const day
            of days
        ) {

            const dayName =
                getDayName(
                    day.start
                );


            const dateText =
                getDateText(
                    day.start
                );


            if (
                day.failed
            ) {

                daysText +=
`📅 ${dayName} ${dateText}
❌ فشل جلب إحصائيات هذا اليوم

`;

                continue;
            }


            daysText +=
`📅 ${dayName} ${dateText}
💬 ${day.messages} رسالة
🖼️ ${day.images} صورة
👥 ${day.activeUsers.size} أعضاء نشطين

`;
        }


        // ==================================================
        // أكثر يوم نشاطًا
        // ==================================================

        let activeText =
            "لا توجد بيانات مكتملة.";


        if (
            mostActiveDay &&
            highestActivity > 0
        ) {

            activeText =
`${getDayName(
    mostActiveDay.start
)} ${getDateText(
    mostActiveDay.start
)}
💬 ${mostActiveDay.messages} رسالة
🖼️ ${mostActiveDay.images} صورة`;
        }


        // ==================================================
        // حالة السجل
        // ==================================================

        let historyStatus;


        if (
            history.complete
        ) {

            historyStatus =
`✅ تم جلب كامل فترة الـ7 أيام
📚 الصفحات المقروءة: ${history.pageCount}`;

        } else {

            historyStatus =
`⚠️ تعذر جلب كامل فترة الـ7 أيام
📚 الصفحات المقروءة: ${history.pageCount}
🔎 السبب: ${history.stoppedReason}`;
        }


        // ==================================================
        // التقرير
        // ==================================================

        const text =
`⌬ ━━ 𝗛𝗜𝗡𝗔 UTILITY ━━ ⌬

📅 إحصائيات آخر 7 أيام

━━━━━━━━━━━━━━━━━━

🏷️ الاسم:
${groupName}

👥 عدد الأعضاء:
${participants.length}

━━━━━━━━━━━━━━━━━━

${daysText}━━━━━━━━━━━━━━━━━━

📊 الإجمالي:

💬 الرسائل النصية:
${totalMessages}

🖼️ الصور المرسلة:
${totalImages}

━━━━━━━━━━━━━━━━━━

🔥 أكثر يوم نشاطًا:

${activeText}

━━━━━━━━━━━━━━━━━━

📚 حالة السجل:

${historyStatus}

━━━━━━━━━━━━━━━━━━

🆔 ID:
${threadID}`;


        return api.sendMessage(
            text,
            threadID,
            messageID
        );

    } catch (error) {

        console.error(
            "[ايام v2.1 ERROR]",
            error
        );


        return api.sendMessage(
            "⌬ ━━ 𝗛𝗜𝗡𝗔 UTILITY ━━ ⌬\n\n" +
            "❌ فشل جلب إحصائيات الأيام.\n\n" +
            (
                error?.message ||
                "خطأ غير معروف"
            ),
            threadID,
            messageID
        );
    }
};


// ==================================================
// ID البوت
// ==================================================

async function getBotID(api) {

    try {

        if (
            api &&
            typeof api.getCurrentUserID ===
            "function"
        ) {

            const id =
                await api.getCurrentUserID();


            if (id) {

                return String(id);
            }
        }

    } catch (error) {}


    return "";
}