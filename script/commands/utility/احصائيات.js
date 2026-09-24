const path = require("path");

module.exports.config = {
    name: "احصائيات",
    version: "3.0.0",
    hasPermssion: 0,
    credits: "أبو هريرة",
    description: "عرض إحصائيات المجموعة وأكثر الأعضاء نشاطًا خلال اليوم",
    commandCategory: "utility",
    usages: "احصائيات",
    cooldowns: 5
};

// ==================================================
// الإعدادات
// ==================================================

const HISTORY_AMOUNT = 100;
const MAX_HISTORY_PAGES = 100;

// ==================================================
// الحصول على اسم المستخدم
// ==================================================

async function getUserName(api, Users, uid) {

    try {

        if (
            Users &&
            typeof Users.getNameUser === "function"
        ) {

            const name =
                await Users.getNameUser(
                    String(uid)
                );

            if (name) {
                return name;
            }
        }

    } catch (e) {}

    try {

        if (
            api &&
            typeof api.getUserInfo === "function"
        ) {

            const info =
                await api.getUserInfo(
                    String(uid)
                );

            if (
                info &&
                info[String(uid)] &&
                info[String(uid)].name
            ) {

                return info[String(uid)].name;
            }
        }

    } catch (e) {}

    return "عضو غير معروف";
}

// ==================================================
// تحويل timestamp إلى milliseconds
// ==================================================

function normalizeTimestamp(value) {

    const number =
        Number(value);

    if (!Number.isFinite(number)) {
        return 0;
    }

    // بعض نسخ الـ API قد تعطي ثواني
    if (number < 100000000000) {
        return number * 1000;
    }

    return number;
}

// ==================================================
// بداية اليوم بتوقيت تونس
// ==================================================

function getTunisiaDayStart() {

    const now = new Date();

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
        formatter.formatToParts(now);

    const values = {};

    for (const part of parts) {

        if (part.type !== "literal") {
            values[part.type] = part.value;
        }
    }

    const year =
        Number(values.year);

    const month =
        Number(values.month);

    const day =
        Number(values.day);

    /*
     * تونس UTC+1.
     * نحول منتصف الليل في تونس إلى Unix timestamp UTC.
     */
    return (
        Date.UTC(
            year,
            month - 1,
            day,
            0,
            0,
            0,
            0
        ) - 60 * 60 * 1000
    );
}

// ==================================================
// قراءة سجل المجموعة من بداية اليوم
// ==================================================

async function getTodayMessages(api, threadID) {

    if (
        !api ||
        typeof api.getThreadHistory !== "function"
    ) {

        throw new Error(
            "API لا يدعم getThreadHistory."
        );
    }

    const dayStart =
        getTunisiaDayStart();

    const messages = [];

    const messageIDs =
        new Set();

    let timestamp;

    let previousOldestTimestamp =
        null;

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
                "[احصائيات HISTORY ERROR]",
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

        /*
         * getThreadHistory يعيد الرسائل من الأحدث
         * إلى الأقدم، وأول عنصر يكون أقدم رسالة
         * في الصفحة الحالية حسب API.
         */

        let oldestTimestamp =
            null;

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

            if (
                !messageTimestamp
            ) {
                continue;
            }

            if (
                oldestTimestamp === null ||
                messageTimestamp < oldestTimestamp
            ) {

                oldestTimestamp =
                    messageTimestamp;
            }

            /*
             * إذا وصلنا إلى رسائل قبل بداية اليوم
             * فلا نحتاج إلى إضافتها.
             */
            if (
                messageTimestamp < dayStart
            ) {
                continue;
            }

            /*
             * نتأكد أن الرسالة تخص اليوم الحالي.
             */
            if (
                messageTimestamp >= dayStart
            ) {

                const messageID =
                    String(
                        message.messageID ||
                        message.threadingID ||
                        `${messageTimestamp}_${message.senderID || ""}_${message.body || ""}`
                    );

                if (
                    !messageIDs.has(
                        messageID
                    )
                ) {

                    messageIDs.add(
                        messageID
                    );

                    messages.push(
                        message
                    );
                }
            }
        }

        /*
         * وصلنا إلى بداية اليوم.
         */
        if (
            oldestTimestamp !== null &&
            oldestTimestamp < dayStart
        ) {
            break;
        }

        /*
         * حماية من تكرار نفس الصفحة
         * أو توقف الـ API عن التقدم.
         */
        if (
            oldestTimestamp === null ||
            oldestTimestamp === previousOldestTimestamp
        ) {
            break;
        }

        previousOldestTimestamp =
            oldestTimestamp;

        /*
         * الصفحة التالية تكون قبل أقدم
         * رسالة حصلنا عليها.
         */
        timestamp =
            oldestTimestamp;
    }

    return {
        messages,
        dayStart
    };
}

// ==================================================
// معلومات المجموعة
// ==================================================

async function getThreadInfo(api, Threads, threadID) {

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
// استخراج أعضاء المجموعة
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
// استخراج المشرفين
// ==================================================

function getAdmins(info) {

    if (
        Array.isArray(
            info?.adminIDs
        )
    ) {

        return info.adminIDs.map(
            id => String(id)
        );
    }

    if (
        Array.isArray(
            info?.admins
        )
    ) {

        return info.admins
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
// تنفيذ الأمر
// ==================================================

module.exports.run = async function ({
    api,
    event,
    Users,
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
            new Set(
                participants
            );

        // ==================================================
        // المشرفون
        // ==================================================

        const admins =
            getAdmins(info);

        // ==================================================
        // قراءة رسائل اليوم كاملة
        // ==================================================

        const {
            messages,
            dayStart
        } =
            await getTodayMessages(
                api,
                threadID
            );

        // ==================================================
        // حساب نشاط الأعضاء
        // ==================================================

        const activity =
            {};

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
             * لا نحسب إلا أعضاء المجموعة الحاليين.
             */
            if (
                !currentMembers.has(
                    senderID
                )
            ) {
                continue;
            }

            if (
                !activity[senderID]
            ) {

                activity[senderID] = {
                    messages: 0
                };
            }

            activity[senderID].messages++;
        }

        // ==================================================
        // ترتيب النشاط
        // ==================================================

        const ranking =
            Object.entries(activity)
                .sort(
                    (a, b) =>
                        Number(
                            b[1]?.messages || 0
                        ) -
                        Number(
                            a[1]?.messages || 0
                        )
                )
                .slice(0, 10);

        // ==================================================
        // إنشاء قائمة النشاط
        // ==================================================

        let rankingText =
            "";

        if (
            ranking.length === 0
        ) {

            rankingText =
                "لا توجد رسائل مسجلة اليوم.";

        } else {

            const medals = [
                "🥇",
                "🥈",
                "🥉"
            ];

            for (
                let i = 0;
                i < ranking.length;
                i++
            ) {

                const [
                    uid,
                    data
                ] = ranking[i];

                const name =
                    await getUserName(
                        api,
                        Users,
                        uid
                    );

                const medal =
                    medals[i] ||
                    `${i + 1}.`;

                const count =
                    Number(
                        data?.messages || 0
                    );

                rankingText +=
                    `${medal} ${name} — ${count} رسالة\n`;
            }
        }

        // ==================================================
        // إجمالي رسائل اليوم
        // ==================================================

        let totalMessages =
            0;

        for (
            const data
            of Object.values(activity)
        ) {

            totalMessages +=
                Number(
                    data?.messages || 0
                );
        }

        // ==================================================
        // اسم المجموعة
        // ==================================================

        const groupName =
            info.threadName ||
            info.name ||
            "بدون اسم";

        // ==================================================
        // تاريخ اليوم
        // ==================================================

        const today =
            new Intl.DateTimeFormat(
                "ar-TN",
                {
                    timeZone: "Africa/Tunis",
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit"
                }
            ).format(
                new Date()
            );

        // ==================================================
        // الرسالة النهائية
        // ==================================================

        const text =
`⌬ ━━ 𝗛𝗜𝗡𝗔 UTILITY ━━ ⌬

📊 إحصائيات المجموعة

━━━━━━━━━━━━━━━━━━

🏷️ الاسم:
${groupName}

📅 التاريخ:
${today}

👥 عدد الأعضاء:
${participants.length}

👑 عدد المشرفين:
${admins.length}

💬 رسائل اليوم:
${totalMessages}

━━━━━━━━━━━━━━━━━━

🔥 أكثر الأعضاء نشاطًا اليوم:

${rankingText}
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
            "[احصائيات ERROR]",
            error
        );

        return api.sendMessage(
            `⌬ ━━ 𝗛𝗜𝗡𝗔 UTILITY ━━ ⌬

❌ حدث خطأ أثناء قراءة إحصائيات اليوم.

${error?.message || "خطأ غير معروف"}`,
            threadID,
            messageID
        );
    }
};