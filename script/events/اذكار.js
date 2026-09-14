const cron = require("node-cron");

// ============================================================
// CONFIG
// ============================================================

module.exports.config = {
    name: "اذكار",
    eventType: ["message"],
    version: "1.0.0",
    credits: "أبو هريرة",
    description: "إرسال الأذكار تلقائياً",
    category: "events"
};

// ============================================================
// SETTINGS
// ============================================================

const TIMEZONE = "Africa/Tunis";

let started = false;

// ============================================================
// الأذكار
// ============================================================

const MORNING = [
    "أصبحنا وأصبح الملك لله والحمد لله لا إله إلا الله وحده لا شريك له له الملك وله الحمد وهو على كل شيء قدير",

    "اللهم بك أصبحنا وبك أمسينا وبك نحيا وبك نموت وإليك النشور",

    "رضيت بالله رباً وبالإسلام ديناً وبمحمد ﷺ نبياً",

    "اللهم إني أسألك العفو والعافية في الدنيا والآخرة",

    "سبحان الله وبحمده سبحان الله العظيم",

    "أستغفر الله وأتوب إليه"
];

const AFTERNOON = [
    "سبحان الله",

    "الحمد لله",

    "الله أكبر",

    "لا إله إلا الله",

    "أستغفر الله وأتوب إليه",

    "اللهم صل وسلم على نبينا محمد ﷺ"
];

const EVENING = [
    "أمسينا وأمسى الملك لله والحمد لله لا إله إلا الله وحده لا شريك له له الملك وله الحمد وهو على كل شيء قدير",

    "اللهم بك أمسينا وبك أصبحنا وبك نحيا وبك نموت وإليك المصير",

    "رضيت بالله رباً وبالإسلام ديناً وبمحمد ﷺ نبياً",

    "اللهم إني أسألك العفو والعافية في الدنيا والآخرة",

    "أستغفر الله وأتوب إليه",

    "سبحان الله وبحمده سبحان الله العظيم"
];

const FRIDAY = [
    `🕌 تذكير يوم الجمعة

📖 لا تنسوا قراءة سورة الكهف

اللهم صل وسلم وبارك على نبينا محمد ﷺ

أكثروا من الصلاة على النبي ﷺ`,

    `🕌 يوم الجمعة

📖 سورة الكهف

لا تنسوا قراءتها اليوم

اللهم صل وسلم على نبينا محمد ﷺ`,

    `🕌 جمعة مباركة

أكثروا من ذكر الله والصلاة على النبي ﷺ

📖 وتذكروا قراءة سورة الكهف`
];

// ============================================================
// اختيار عشوائي
// ============================================================

function randomItem(array) {

    return array[
        Math.floor(
            Math.random() * array.length
        )
    ];
}

// ============================================================
// معرفة المجموعات
// ============================================================

function getThreads() {

    const result = [];

    try {

        if (
            global.data &&
            Array.isArray(
                global.data.allThreadID
            )
        ) {

            for (
                const id of global.data.allThreadID
            ) {

                if (id) {
                    result.push(
                        String(id)
                    );
                }

            }

        }

        if (
            !result.length &&
            global.data &&
            global.data.threadInfo instanceof Map
        ) {

            for (
                const id of global.data.threadInfo.keys()
            ) {

                if (id) {
                    result.push(
                        String(id)
                    );
                }

            }

        }

    } catch (error) {

        console.error(
            "[اذكار] THREAD ERROR:",
            error.message
        );

    }

    return [
        ...new Set(result)
    ];
}

// ============================================================
// إرسال لكل المجموعات
// ============================================================

async function sendToGroups(
    api,
    message
) {

    const threads =
        getThreads();

    if (!threads.length) {

        console.log(
            "[اذكار] لا توجد مجموعات"
        );

        return;
    }

    for (
        const threadID of threads
    ) {

        try {

            await new Promise(
                resolve => {

                    try {

                        api.sendMessage(
                            message,
                            threadID,
                            () => resolve()
                        );

                    } catch (error) {

                        console.error(
                            "[اذكار] SEND ERROR:",
                            error.message
                        );

                        resolve();
                    }

                }
            );

            // تأخير بسيط بين المجموعات
            await new Promise(
                resolve =>
                    setTimeout(
                        resolve,
                        500
                    )
            );

        } catch (error) {

            console.error(
                "[اذكار] ERROR:",
                error.message
            );

        }

    }
}

// ============================================================
// تحديد رسالة الجمعة
// ============================================================

function isFriday() {

    const date =
        new Date();

    const tunisDate =
        new Intl.DateTimeFormat(
            "en-US",
            {
                timeZone: TIMEZONE,
                weekday: "short"
            }
        ).format(date);

    return tunisDate === "Fri";
}

// ============================================================
// تشغيل الجدولة
// ============================================================

function startScheduler(api) {

    if (started) {
        return;
    }

    started = true;

    console.log(
        "[HINA ADHKAR] تم تشغيل نظام الأذكار"
    );

    // ========================================================
    // 07:00 أذكار الصباح
    // ========================================================

    cron.schedule(
        "0 7 * * *",
        async () => {

            if (isFriday()) {

                await sendToGroups(
                    api,
                    randomItem(FRIDAY)
                );

                return;
            }

            const message =
`⌬ ━━ 𝗛𝗜𝗡𝗔 ━━ ⌬

🌅 أذكار الصباح

${randomItem(MORNING)}

🤍 اذكروا الله يذكركم`;

            await sendToGroups(
                api,
                message
            );

        },
        {
            timezone: TIMEZONE
        }
    );

    // ========================================================
    // 13:00 ذكر
    // ========================================================

    cron.schedule(
        "0 13 * * *",
        async () => {

            if (isFriday()) {
                return;
            }

            const message =
`⌬ ━━ 𝗛𝗜𝗡𝗔 ━━ ⌬

📿 تذكير بالذكر

${randomItem(AFTERNOON)}

🤍 لا تنسوا ذكر الله`;

            await sendToGroups(
                api,
                message
            );

        },
        {
            timezone: TIMEZONE
        }
    );

    // ========================================================
    // 18:00 أذكار المساء
    // ========================================================

    cron.schedule(
        "0 18 * * *",
        async () => {

            if (isFriday()) {

                await sendToGroups(
                    api,
                    randomItem(FRIDAY)
                );

                return;
            }

            const message =
`⌬ ━━ 𝗛𝗜𝗡𝗔 ━━ ⌬

🌙 أذكار المساء

${randomItem(EVENING)}

🤍 اذكروا الله يذكركم`;

            await sendToGroups(
                api,
                message
            );

        },
        {
            timezone: TIMEZONE
        }
    );

    // ========================================================
    // 22:00 ذكر الليل
    // ========================================================

    cron.schedule(
        "0 22 * * *",
        async () => {

            const message =
`⌬ ━━ 𝗛𝗜𝗡𝗔 ━━ ⌬

🌙 تذكير

أكثروا من الاستغفار وذكر الله

أستغفر الله وأتوب إليه

سبحان الله وبحمده
سبحان الله العظيم

🤍 تصبحون على خير`;

            await sendToGroups(
                api,
                message
            );

        },
        {
            timezone: TIMEZONE
        }
    );
}

// ============================================================
// HANDLE EVENT
// ============================================================

module.exports.handleEvent =
async function ({
    api,
    event
}) {

    try {

        if (!api) {
            return;
        }

        // تشغيل الجدولة مرة واحدة فقط
        startScheduler(api);

    } catch (error) {

        console.error(
            "[HINA ADHKAR ERROR]",
            error
        );

    }

};