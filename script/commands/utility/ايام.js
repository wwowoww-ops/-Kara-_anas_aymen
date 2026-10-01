const path = require("path");

module.exports.config = {
    name: "ايام",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "أبو هريرة",
    description: "عرض إحصائيات المجموعة خلال آخر 7 أيام",
    commandCategory: "utility",
    usages: "ايام",
    cooldowns: 10
};

// ==================================================
// الإعدادات
// ==================================================

const HISTORY_AMOUNT = 100;
const MAX_HISTORY_PAGES = 100;

// ==================================================
// تحويل timestamp إلى milliseconds
// ==================================================

function normalizeTimestamp(value) {

    const number = Number(value);

    if (!Number.isFinite(number)) {
        return 0;
    }

    if (number < 100000000000) {
        return number * 1000;
    }

    return number;
}

// ==================================================
// بداية اليوم بتوقيت تونس
// ==================================================

function getTunisiaDayStart(date = new Date()) {

    const formatter = new Intl.DateTimeFormat(
        "en-US",
        {
            timeZone: "Africa/Tunis",
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        }
    );

    const parts = formatter.formatToParts(date);
    const values = {};

    for (const part of parts) {

        if (part.type !== "literal") {
            values[part.type] = part.value;
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
        60 * 60 * 1000
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
    ).format(new Date(timestamp));
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
    ).format(new Date(timestamp));
}

// ==================================================
// معرفة هل المرفق صورة
// ==================================================

function isImageAttachment(attachment) {

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
        type === "image/png" ||
        type === "image/webp" ||
        type === "image/gif"
    ) {
        return true;
    }

    const url =
        String(
            attachment.url ||
            attachment.href ||
            attachment.src ||
            attachment.previewUrl ||
            ""
        ).toLowerCase();

    return /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(url);
}

// ==================================================
// عدد الصور
// ==================================================

function getImageCount(message) {

    if (
        !message ||
        !Array.isArray(message.attachments)
    ) {
        return 0;
    }

    let count = 0;

    for (const attachment of message.attachments) {

        if (isImageAttachment(attachment)) {
            count++;
        }
    }

    return count;
}

// ==================================================
// ID البوت
// ==================================================

async function getBotID(api) {

    try {

        if (
            api &&
            typeof api.getCurrentUserID === "function"
        ) {

            const id =
                await api.getCurrentUserID();

            if (id) {
                return String(id);
            }
        }

    } catch (e) {}

    return "";
}

// ==================================================
// قراءة آخر 7 أيام
// ==================================================

async function getWeekMessages(
    api,
    threadID
) {

    if (
        !api ||
        typeof api.getThreadHistory !== "function"
    ) {

        throw new Error(
            "API لا يدعم getThreadHistory."
        );
    }

    const todayStart =
        getTunisiaDayStart();

    /*
     * اليوم الحالي + 6 أيام سابقة
     */

    const weekStart =
        todayStart -
        (
            6 *
            24 *
            60 *
            60 *
            1000
        );

    const messages = [];
    const messageIDs = new Set();

    let timestamp;
    let previousOldestTimestamp = null;

    for (
        let page = 0;
        page < MAX_HISTORY_PAGES;
        page++
    ) {

        let history;

        try {

            history =
                await api.getThreadHistory(
                    String(threadID),
                    HISTORY_AMOUNT,
                    timestamp
                );

        } catch (error) {

            console.error(
                "[ايام HISTORY ERROR]",
                error
            );

            break;
        }

        if (
            !Array.isArray(history) ||
            history.length === 0
        ) {
            break;
        }

        let oldestTimestamp = null;

        for (const message of history) {

            if (!message) {
                continue;
            }

            const messageTimestamp =
                normalizeTimestamp(
                    message.timestamp ||
                    message.time ||
                    message.createdAt
                );

            if (!messageTimestamp) {
                continue;
            }

            if (
                oldestTimestamp === null ||
                messageTimestamp < oldestTimestamp
            ) {

                oldestTimestamp =
                    messageTimestamp;
            }

            if (
                messageTimestamp < weekStart
            ) {
                continue;
            }

            const messageID =
                String(
                    message.messageID ||
                    message.threadingID ||
                    `${messageTimestamp}_${message.senderID || ""}_${message.body || ""}`
                );

            if (!messageIDs.has(messageID)) {

                messageIDs.add(messageID);
                messages.push(message);
            }
        }

        /*
         * وصلنا لما قبل آخر 7 أيام
         */

        if (
            oldestTimestamp !== null &&
            oldestTimestamp < weekStart
        ) {
            break;
        }

        /*
         * حماية من تكرار الصفحة
         */

        if (
            oldestTimestamp === null ||
            oldestTimestamp ===
            previousOldestTimestamp
        ) {
            break;
        }

        previousOldestTimestamp =
            oldestTimestamp;

        /*
         * جلب الصفحة الأقدم
         */

        timestamp =
            oldestTimestamp;
    }

    return {
        messages,
        weekStart
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
            typeof Threads.getInfo === "function"
        ) {

            info =
                await Threads.getInfo(
                    String(threadID)
                );
        }

    } catch (e) {}

    if (!info) {

        try {

            info =
                await api.getThreadInfo(
                    String(threadID)
                );

        } catch (e) {}
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
            .map(user => {

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
            })
            .filter(Boolean);
    }

    return [];
}

// ==================================================
// تحليل الرسائل
// ==================================================

function analyzeMessages(
    messages,
    currentMembers,
    botID,
    weekStart
) {

    const ONE_DAY =
        24 *
        60 *
        60 *
        1000;

    const days = [];

    /*
     * إنشاء 7 أيام
     */

    for (let i = 0; i < 7; i++) {

        const start =
            weekStart +
            (
                i *
                ONE_DAY
            );

        days.push({
            start,
            messages: 0,
            images: 0
        });
    }

    for (const message of messages) {

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
         * تجاهل البوت
         */

        if (
            botID &&
            senderID === botID
        ) {
            continue;
        }

        /*
         * أعضاء المجموعة الحاليون فقط
         */

        if (
            !currentMembers.has(senderID)
        ) {
            continue;
        }

        const messageTimestamp =
            normalizeTimestamp(
                message.timestamp ||
                message.time ||
                message.createdAt
            );

        if (!messageTimestamp) {
            continue;
        }

        const dayIndex =
            Math.floor(
                (
                    messageTimestamp -
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

        const imageCount =
            getImageCount(message);

        /*
         * الصور
         */

        if (imageCount > 0) {

            days[dayIndex].images +=
                imageCount;
        }

        /*
         * نفس منطق احصائيات:
         * الرسالة التي تحتوي صورة
         * لا تحسب كرسالة نصية.
         */

        if (imageCount > 0) {
            continue;
        }

        const body =
            typeof message.body === "string"
                ? message.body.trim()
                : "";

        if (!body) {
            continue;
        }

        days[dayIndex].messages++;
    }

    return days;
}

// ==================================================
// تنفيذ الأمر
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
                `⌬ ━━ 𝗛𝗜𝗡𝗔 UTILITY ━━ ⌬

❌ تعذر الحصول على معلومات المجموعة.`,
                threadID,
                messageID
            );
        }

        // ==================================================
        // الأعضاء
        // ==================================================

        const participants =
            getParticipants(info);

        const currentMembers =
            new Set(participants);

        // ==================================================
        // ID البوت
        // ==================================================

        const botID =
            await getBotID(api);

        // ==================================================
        // قراءة الرسائل
        // ==================================================

        const {
            messages,
            weekStart
        } =
            await getWeekMessages(
                api,
                threadID
            );

        // ==================================================
        // تحليل
        // ==================================================

        const days =
            analyzeMessages(
                messages,
                currentMembers,
                botID,
                weekStart
            );

        // ==================================================
        // الإجماليات
        // ==================================================

        let totalMessages = 0;
        let totalImages = 0;

        for (const day of days) {

            totalMessages +=
                day.messages;

            totalImages +=
                day.images;
        }

        // ==================================================
        // أكثر يوم نشاطًا
        // ==================================================

        let mostActiveDay = null;

        for (const day of days) {

            const activity =
                day.messages +
                day.images;

            if (
                !mostActiveDay ||
                activity >
                (
                    mostActiveDay.messages +
                    mostActiveDay.images
                )
            ) {

                mostActiveDay = day;
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
        // تفاصيل الأيام
        // ==================================================

        let daysText = "";

        for (const day of days) {

            const dayName =
                getDayName(day.start);

            const dateText =
                getDateText(day.start);

            daysText +=
`📅 ${dayName} ${dateText}
💬 ${day.messages} رسالة
🖼️ ${day.images} صورة

`;
        }

        // ==================================================
        // أكثر يوم نشاطًا
        // ==================================================

        let activeText =
            "لا توجد رسائل مسجلة.";

        if (
            mostActiveDay &&
            (
                mostActiveDay.messages > 0 ||
                mostActiveDay.images > 0
            )
        ) {

            activeText =
`${getDayName(mostActiveDay.start)} ${getDateText(mostActiveDay.start)}
💬 ${mostActiveDay.messages} رسالة
🖼️ ${mostActiveDay.images} صورة`;
        }

        // ==================================================
        // الرسالة النهائية
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

🆔 ID:
${threadID}`;

        return api.sendMessage(
            text,
            threadID,
            messageID
        );

    } catch (error) {

        console.error(
            "[ايام ERROR]",
            error
        );

        return api.sendMessage(
            `⌬ ━━ 𝗛𝗜𝗡𝗔 UTILITY ━━ ⌬

❌ حدث خطأ أثناء قراءة إحصائيات الأيام.

${error?.message || "خطأ غير معروف"}`,
            threadID,
            messageID
        );
    }
};