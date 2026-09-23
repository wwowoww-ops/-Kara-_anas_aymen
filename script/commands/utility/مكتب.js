/**
 * مكتب.js
 *
 * نظام تقرير مكتب التوظيف التفاعلي
 *
 * الأوامر:
 *
 * .مكتب جديد
 * .مكتب عرض
 * .مكتب انهاء
 *
 * جميع البيانات مؤقتة ولا تحتاج قاعدة بيانات.
 */

module.exports.config = {
    name: "مكتب",
    version: "3.1.0",
    hasPermssion: 0,
    credits: "أبو هريرة",
    description: "إنشاء تقرير مكتب التوظيف بشكل تفاعلي",
    commandCategory: "Utility",
    usages: "مكتب جديد | مكتب عرض | مكتب انهاء",
    cooldowns: 2
};

const HEADER = "⌬ ━━ 𝗛𝗜𝗡𝗔  ━━ ⌬\n\n";

// ==================================================
// التقارير المؤقتة
// ==================================================

const reports = new Map();


// ==================================================
// إنشاء تقرير
// ==================================================

function createReport() {
    return {
        step: 0,

        date: "",
        reporter: "",

        activities: [
            {
                organizer: "",
                winner: "",
                participants: ""
            },

            {
                organizer: "",
                winner: "",
                participants: ""
            },

            {
                organizer: "",
                winner: "",
                participants: ""
            }
        ],

        lesson: {
            teacher: "",
            testMaker: "",
            participants: ""
        },

        promotions: "",

        notes: "",

        staff: "",

        first: "",
        second: ""
    };
}


// ==================================================
// إنشاء جلسة رد
// ==================================================

function createReply(threadID, step, messageID) {
    return {
        name: "مكتب",
        author: "office-system",

        threadID: String(threadID),

        // مهم جدًا:
        // هذا هو ID رسالة السؤال التي يجب الرد عليها
        messageID: messageID,

        step: step
    };
}


// ==================================================
// إرسال سؤال وحفظ جلسة الرد
// ==================================================

function ask(api, event, report, text, step) {

    report.step = step;

    return api.sendMessage(
        HEADER + text,
        event.threadID,

        (error, info) => {

            if (error) {
                console.error(
                    "[OFFICE REPLY ERROR]:",
                    error
                );

                return;
            }

            global.client.handleReply =
                global.client.handleReply || [];


            // ==========================================
            // حذف أي جلسة مكتب قديمة لنفس المجموعة
            // ==========================================

            global.client.handleReply =
                global.client.handleReply.filter(item => {

                    return !(
                        String(item.threadID) ===
                            String(event.threadID) &&

                        item.name === "مكتب"
                    );
                });


            // ==========================================
            // حفظ جلسة الرد الجديدة
            // ==========================================

            global.client.handleReply.push(
                createReply(
                    event.threadID,
                    step,

                    info &&
                    info.messageID
                        ? info.messageID
                        : null
                )
            );


            console.log(
                "[OFFICE REPLY] " +
                `step=${step} ` +
                `messageID=${
                    info && info.messageID
                        ? info.messageID
                        : "UNKNOWN"
                } ` +
                `thread=${event.threadID}`
            );
        },

        event.messageID
    );
}


// ==================================================
// حذف جلسات الرد القديمة لنفس المجموعة
// ==================================================

function removeOldReplies(threadID) {

    if (
        !global.client ||
        !Array.isArray(global.client.handleReply)
    ) {
        return;
    }

    global.client.handleReply =
        global.client.handleReply.filter(item => {

            return !(
                String(item.threadID) ===
                    String(threadID) &&

                item.name === "مكتب"
            );
        });
}


// ==================================================
// تنسيق قائمة المشاركين
// ==================================================

function participantBlock(text) {

    if (
        !text ||
        !String(text).trim()
    ) {
        return "```🕹️📋\n```";
    }

    /*
     * مهم:
     * لا نقوم بتحليل القائمة
     * ولا حذف الرموز
     * ولا استخراج الأسماء
     *
     * يتم وضعها كما أرسلها المستخدم.
     */

    return (
        "```🕹️📋\n" +
        String(text).trim() +
        "\n```"
    );
}


// ==================================================
// بناء التقرير
// ==================================================

function buildReport(report) {

    let text = "";

    text +=
        `📃تقرير يوم ${
            report.date || "**/**/2026"
        }📃 ` +
        `تقرير : ${
            report.reporter || "أبو هريرة"
        }\n\n`;


    // ==================================================
    // رأس التقرير
    // ==================================================

    text += "```🖋📋\n";
    text += "```\n\n";


    // ==================================================
    // الفعالية الأولى
    // ==================================================

    text +=
        "• فعالية الاولى و التي قام بها " +
        `❀${
            report.activities[0].organizer ||
            "..."
        } ❀ ` +
        "و فاز بها " +
        `❀${
            report.activities[0].winner ||
            "..."
        } ❀\n\n`;

    text +=
        "• المشاركون :\n\n";

    text += participantBlock(
        report.activities[0].participants
    );

    text += "\n\n";


    // ==================================================
    // الفعالية الثانية
    // ==================================================

    text +=
        "• فعالية ثانية التي قام بها " +
        `❀${
            report.activities[1].organizer ||
            "..."
        } ❀ ` +
        "الذي فاز بها " +
        `❀${
            report.activities[1].winner ||
            "..."
        } ❀\n\n`;

    text +=
        "• المشاركين :\n\n";

    text += participantBlock(
        report.activities[1].participants
    );

    text += "\n\n";


    // ==================================================
    // الفعالية الثالثة
    // ==================================================

    text +=
        "•فعالية ثالثة الذي قام بها " +
        `❀${
            report.activities[2].organizer ||
            "..."
        } ❀ ` +
        "الذي فاز بها " +
        `❀${
            report.activities[2].winner ||
            "..."
        } ❀\n\n`;

    text +=
        "• المشاركون :\n\n";

    text += participantBlock(
        report.activities[2].participants
    );

    text += "\n\n";


    // ==================================================
    // فاصل
    // ==================================================

    text += "```🎟️🧫\n";
    text += "```\n\n";


    // ==================================================
    // الدرس والاختبار
    // ==================================================

    text +=
        `📕درس تم تقديمه من طرف ` +
        `♡${
            report.lesson.teacher ||
            "..."
        } ♡` +

        " " +

        `📄الاختبار تم عمله من طرف ` +
        `♡${
            report.lesson.testMaker ||
            "..."
        } ♡\n\n`;


    text +=
        "• المشاركون :\n\n";


    text +=
        "```🎟️🧫\n" +
        (
            report.lesson.participants ||
            ""
        ) +
        "\n```";


    text += "\n\n";


    // ==================================================
    // الترقيات
    // ==================================================

    text += "```\n";
    text += "          ♡•••ترقيات•••♡\n";
    text += "```\n\n";


    if (
        report.promotions &&
        report.promotions.trim()
    ) {

        text +=
            report.promotions.trim();

    } else {

        text +=
            "-\n\n" +
            "-\n\n" +
            "-\n\n" +
            "-";
    }


    text += "\n\n";


    // ==================================================
    // الملاحظات
    // ==================================================

    text += "```\n\n";

    text +=
        "• ملاحظات ومشاكل في المكتب :\n";


    if (
        report.notes &&
        report.notes.trim()
    ) {

        text +=
            report.notes.trim() +
            "\n";

    } else {

        text +=
            "♡ لا يوجد مشاكل\n";
    }


    text += "\n";

    text +=
        "-‏- ‏~~~~~~~~~🤍🪄~~~~~~~~~~~~\n";


    // ==================================================
    // مسؤولين المكتب
    // ==================================================

    text +=
        "• مسؤولين المكتب :\n\n";


    if (
        report.staff &&
        report.staff.trim()
    ) {

        text +=
            report.staff.trim() +
            "\n";

    } else {

        text +=
            "▪️يـانـو - ليدر قسم المكتب▪️\n\n" +

            "🔱️ نـصـࢪو - الـنـائـب 1 [ الـمكـتـب ] 🔱\n\n" +

            "🔱️ أبـو هࢪيࢪة - الـنـائـب 2 [ الـمكـتـب ] 🔱\n";
    }


    text += "\n";
    text += "```\n";


    // ==================================================
    // النشاط
    // ==================================================

    text += "\n";

    text +=
        "☆أكثر العمال نشاطا☆ :\n\n";


    text +=
        "```♡~~~~\n\n";


    text +=
        `- المركز الاول : ${
            report.first || ""
        }\n` +

        `- المركز الثاني : ${
            report.second || ""
        }\n`;


    text +=
        "\n```";


    return text;
}


// ==================================================
// بدء التقرير
// ==================================================

async function startReport({ api, event }) {

    const threadID =
        String(event.threadID);


    // حذف أي جلسات قديمة
    removeOldReplies(threadID);


    // إنشاء التقرير
    const report =
        createReport();


    reports.set(
        threadID,
        report
    );


    return ask(
        api,
        event,
        report,

        "تم إنشاء تقرير مكتب جديد.\n\n" +

        "الخطوة 1 من 15\n\n" +

        "أرسل تاريخ التقرير بالرد على هذه الرسالة.\n\n" +

        "مثال:\n" +

        "23/09/2026",

        1
    );
}


// ==================================================
// معالجة الردود
// ==================================================

module.exports.handleReply = async function ({
    api,
    event,
    handleReply
}) {

    try {

        const threadID =
            String(event.threadID);


        const report =
            reports.get(threadID);


        if (!report) {
            return;
        }


        // ==================================================
        // التحقق من أن الرد على رسالة مكتب
        // ==================================================

        if (
            handleReply.messageID &&
            event.messageReply &&
            event.messageReply.messageID &&
            String(
                event.messageReply.messageID
            ) !== String(
                handleReply.messageID
            )
        ) {

            return;
        }


        const body =
            String(
                event.body || ""
            ).trim();


        if (!body) {

            return api.sendMessage(
                HEADER +
                "لم يتم استلام أي نص.\n\n" +
                "أرسل الإجابة بالرد على رسالة المكتب.",

                event.threadID,
                event.messageID
            );
        }


        // ==================================================
        // 1 - التاريخ
        // ==================================================

        if (handleReply.step === 1) {

            report.date = body;


            return ask(
                api,
                event,
                report,

                "تم حفظ التاريخ.\n\n" +

                "الخطوة 2 من 15\n\n" +

                "أرسل اسم صاحب التقرير بالرد على هذه الرسالة.",

                2
            );
        }


        // ==================================================
        // 2 - صاحب التقرير
        // ==================================================

        if (handleReply.step === 2) {

            report.reporter = body;


            return ask(
                api,
                event,
                report,

                "تم حفظ اسم صاحب التقرير.\n\n" +

                "الخطوة 3 من 15\n\n" +

                "أرسل اسم منظم الفعالية الأولى والفائز بها بهذا الشكل:\n\n" +

                "يانو | ساكا",

                3
            );
        }


        // ==================================================
        // 3 - الفعالية الأولى
        // ==================================================

        if (handleReply.step === 3) {

            const parts =
                body.split("|");


            report.activities[0].organizer =
                (
                    parts[0] ||
                    ""
                ).trim();


            report.activities[0].winner =
                (
                    parts[1] ||
                    ""
                ).trim();


            return ask(
                api,
                event,
                report,

                "تم حفظ الفعالية الأولى.\n\n" +

                "الخطوة 4 من 15\n\n" +

                "أرسل قائمة المشاركين في الفعالية الأولى بالرد على هذه الرسالة.\n\n" +

                "سأحفظ القائمة كما ترسلها بدون تغيير.",

                4
            );
        }


        // ==================================================
        // 4 - قائمة الفعالية الأولى
        // ==================================================

        if (handleReply.step === 4) {

            report.activities[0].participants =
                body;


            return ask(
                api,
                event,
                report,

                "تم حفظ قائمة الفعالية الأولى.\n\n" +

                "الخطوة 5 من 15\n\n" +

                "أرسل اسم منظم الفعالية الثانية والفائز بها بهذا الشكل:\n\n" +

                "نصرو | حمزة",

                5
            );
        }


        // ==================================================
        // 5 - الفعالية الثانية
        // ==================================================

        if (handleReply.step === 5) {

            const parts =
                body.split("|");


            report.activities[1].organizer =
                (
                    parts[0] ||
                    ""
                ).trim();


            report.activities[1].winner =
                (
                    parts[1] ||
                    ""
                ).trim();


            return ask(
                api,
                event,
                report,

                "تم حفظ الفعالية الثانية.\n\n" +

                "الخطوة 6 من 15\n\n" +

                "أرسل قائمة المشاركين في الفعالية الثانية بالرد على هذه الرسالة.\n\n" +

                "ستُحفظ كما هي بدون تغيير.",

                6
            );
        }


        // ==================================================
        // 6 - قائمة الفعالية الثانية
        // ==================================================

        if (handleReply.step === 6) {

            report.activities[1].participants =
                body;


            return ask(
                api,
                event,
                report,

                "تم حفظ قائمة الفعالية الثانية.\n\n" +

                "الخطوة 7 من 15\n\n" +

                "أرسل اسم منظم الفعالية الثالثة والفائز بها بهذا الشكل:\n\n" +

                "أبو هريرة | شوتو",

                7
            );
        }


        // ==================================================
        // 7 - الفعالية الثالثة
        // ==================================================

        if (handleReply.step === 7) {

            const parts =
                body.split("|");


            report.activities[2].organizer =
                (
                    parts[0] ||
                    ""
                ).trim();


            report.activities[2].winner =
                (
                    parts[1] ||
                    ""
                ).trim();


            return ask(
                api,
                event,
                report,

                "تم حفظ الفعالية الثالثة.\n\n" +

                "الخطوة 8 من 15\n\n" +

                "أرسل قائمة المشاركين في الفعالية الثالثة بالرد على هذه الرسالة.\n\n" +

                "ستُحفظ كما هي بدون تغيير.",

                8
            );
        }


        // ==================================================
        // 8 - قائمة الفعالية الثالثة
        // ==================================================

        if (handleReply.step === 8) {

            report.activities[2].participants =
                body;


            return ask(
                api,
                event,
                report,

                "تم حفظ قائمة الفعالية الثالثة.\n\n" +

                "الخطوة 9 من 15\n\n" +

                "أرسل اسم مقدم الدرس واسم من قام بالاختبار بهذا الشكل:\n\n" +

                "يانو | أبو هريرة",

                9
            );
        }


        // ==================================================
        // 9 - الدرس والاختبار
        // ==================================================

        if (handleReply.step === 9) {

            const parts =
                body.split("|");


            report.lesson.teacher =
                (
                    parts[0] ||
                    ""
                ).trim();


            report.lesson.testMaker =
                (
                    parts[1] ||
                    ""
                ).trim();


            return ask(
                api,
                event,
                report,

                "تم حفظ مقدم الدرس والاختبار.\n\n" +

                "الخطوة 10 من 15\n\n" +

                "أرسل قائمة المشاركين في الدرس والاختبار بالرد على هذه الرسالة.\n\n" +

                "ستُحفظ كما هي بدون تغيير.",

                10
            );
        }


        // ==================================================
        // 10 - المشاركون في الدرس والاختبار
        // ==================================================

        if (handleReply.step === 10) {

            report.lesson.participants =
                body;


            return ask(
                api,
                event,
                report,

                "تم حفظ قائمة المشاركين.\n\n" +

                "الخطوة 11 من 15\n\n" +

                "أرسل جميع الترقيات بالطول بالرد على هذه الرسالة.\n\n" +

                "كل ترقية في سطر مستقل.\n\n" +

                "مثال:\n" +

                "- شيماء G جناح\n" +

                "- شوتو H نجم نخبة + G جناح",

                11
            );
        }


        // ==================================================
        // 11 - الترقيات
        // ==================================================

        if (handleReply.step === 11) {

            report.promotions =
                body;


            return ask(
                api,
                event,
                report,

                "تم حفظ الترقيات.\n\n" +

                "الخطوة 12 من 15\n\n" +

                "أرسل ملاحظات ومشاكل المكتب بالرد على هذه الرسالة.\n\n" +

                "إذا لا توجد مشاكل اكتب:\n" +

                "لا يوجد مشاكل",

                12
            );
        }


        // ==================================================
        // 12 - الملاحظات
        // ==================================================

        if (handleReply.step === 12) {

            report.notes =
                body;


            return ask(
                api,
                event,
                report,

                "تم حفظ الملاحظات.\n\n" +

                "الخطوة 13 من 15\n\n" +

                "أرسل مسؤولين المكتب بالترتيب وبنفس التنسيق الذي تريد ظهوره في التقرير.",

                13
            );
        }


        // ==================================================
        // 13 - المسؤولين
        // ==================================================

        if (handleReply.step === 13) {

            report.staff =
                body;


            return ask(
                api,
                event,
                report,

                "تم حفظ مسؤولين المكتب.\n\n" +

                "الخطوة 14 من 15\n\n" +

                "أرسل اسم صاحب المركز الأول في أكثر العمال نشاطًا.",

                14
            );
        }


        // ==================================================
        // 14 - المركز الأول
        // ==================================================

        if (handleReply.step === 14) {

            report.first =
                body;


            return ask(
                api,
                event,
                report,

                "تم حفظ المركز الأول.\n\n" +

                "الخطوة 15 من 15\n\n" +

                "أرسل اسم صاحب المركز الثاني.",

                15
            );
        }


        // ==================================================
        // 15 - المركز الثاني
        // ==================================================

        if (handleReply.step === 15) {

            report.second =
                body;


            report.step = 16;


            removeOldReplies(threadID);


            return api.sendMessage(
                HEADER +

                "تم جمع جميع بيانات تقرير المكتب.\n\n" +

                "استخدم:\n\n" +

                ".مكتب عرض\n\n" +

                "لمعاينة التقرير.\n\n" +

                "إذا كان كل شيء صحيحًا استخدم:\n\n" +

                ".مكتب انهاء",

                event.threadID,
                event.messageID
            );
        }

    } catch (error) {

        console.error(
            "[OFFICE HANDLE REPLY ERROR]:",
            error
        );


        return api.sendMessage(
            HEADER +

            "حدث خطأ أثناء حفظ الإجابة:\n\n" +

            (
                error.message ||
                "خطأ غير معروف"
            ),

            event.threadID,
            event.messageID
        );
    }
};


// ==================================================
// الأوامر الرئيسية
// ==================================================

module.exports.run = async function ({
    api,
    event,
    args
}) {

    const threadID =
        String(event.threadID);


    try {

        const action =
            String(args[0] || "")
                .trim()
                .toLowerCase();


        // ==================================================
        // مكتب فقط
        // ==================================================

        if (!action) {

            return api.sendMessage(
                HEADER +

                "نظام مكتب التوظيف\n\n" +

                ".مكتب جديد\n" +

                ".مكتب عرض\n" +

                ".مكتب انهاء",

                event.threadID,
                event.messageID
            );
        }


        // ==================================================
        // جديد
        // ==================================================

        if (action === "جديد") {

            return startReport({
                api,
                event
            });
        }


        // ==================================================
        // عرض
        // ==================================================

        if (action === "عرض") {

            const report =
                reports.get(threadID);


            if (!report) {

                return api.sendMessage(
                    HEADER +

                    "لا يوجد تقرير قيد الإنشاء.\n\n" +

                    "استخدم:\n" +

                    ".مكتب جديد",

                    event.threadID,
                    event.messageID
                );
            }


            return api.sendMessage(
                buildReport(report),

                event.threadID,
                event.messageID
            );
        }


        // ==================================================
        // إنهاء
        // ==================================================

        if (
            action === "انهاء" ||
            action === "إنهاء"
        ) {

            const report =
                reports.get(threadID);


            if (!report) {

                return api.sendMessage(
                    HEADER +

                    "لا يوجد تقرير قيد الإنشاء.",

                    event.threadID,
                    event.messageID
                );
            }


            const finalReport =
                buildReport(report);


            reports.delete(threadID);

            removeOldReplies(threadID);


            return api.sendMessage(
                finalReport,

                event.threadID,
                event.messageID
            );
        }


        // ==================================================
        // أمر غير معروف
        // ==================================================

        return api.sendMessage(
            HEADER +

            "الأوامر المتاحة:\n\n" +

            ".مكتب جديد\n" +

            ".مكتب عرض\n" +

            ".مكتب انهاء",

            event.threadID,
            event.messageID
        );

    } catch (error) {

        console.error(
            "[OFFICE ERROR]:",
            error
        );


        return api.sendMessage(
            HEADER +

            "حدث خطأ:\n\n" +

            (
                error.message ||
                "خطأ غير معروف"
            ),

            event.threadID,
            event.messageID
        );
    }
};