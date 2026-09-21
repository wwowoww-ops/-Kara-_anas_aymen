/**
 * مكتب.js
 *
 * نظام تقرير مكتب التوظيف
 *
 * بدون قاعدة بيانات
 * البيانات مؤقتة وتختفي عند إعادة تشغيل البوت
 *
 * الأوامر:
 *
 * .مكتب
 * .مكتب جديد
 * .مكتب تاريخ 21/09/2026
 * .مكتب تقرير أبو هريرة
 *
 * .مكتب ف1 يانو | ساكا | آدم، نرجس، شوتو
 * .مكتب ف2 نصرو | حمزة | يوسف، فايز
 * .مكتب ف3 أبو هريرة | شوتو | سارومي، ياتو
 *
 * .مكتب درس يانو | أبو هريرة | آدم، نرجس
 *
 * .مكتب ترقية شيماء | G جناح
 * .مكتب ترقية شوتو | H نجم نخبة + G جناح
 *
 * .مكتب ملاحظة لا يوجد مشاكل
 *
 * .مكتب مسؤول يانو | ليدر قسم المكتب
 *
 * .مكتب نشاط يانو | نصرو
 *
 * .مكتب عرض
 * .مكتب مسح
 * .مكتب إنهاء
 */

module.exports.config = {
    name: "مكتب",
    version: "2.0.0",
    hasPermssion: 0,
    credits: "أبو هريرة",
    description: "إنشاء تقرير مكتب التوظيف",
    commandCategory: "utility",
    usages: "مكتب",
    cooldowns: 2
};

// ==================================================
// الإعدادات
// ==================================================

const HEADER = "⌬ ━━ 𝗛𝗜𝗡𝗔 ━━ ⌬\n\n";

const reports = new Map();

// ==================================================
// إنشاء تقرير جديد
// ==================================================

function createReport() {
    return {
        date: "__/**/2026",
        reporter: "أبو هريرة",

        activities: {
            1: {
                organizer: "",
                winner: "",
                participants: []
            },

            2: {
                organizer: "",
                winner: "",
                participants: []
            },

            3: {
                organizer: "",
                winner: "",
                participants: []
            }
        },

        lesson: {
            teacher: "",
            testMaker: "",
            participants: []
        },

        promotions: [],

        notes: [],

        staff: [
            {
                name: "يـانـو",
                role: "ليدر قسم المكتب",
                type: "normal"
            },

            {
                name: "نـصـࢪو",
                role: "الـنـائـب 1 [ الـمكـتـب ]",
                type: "deputy"
            },

            {
                name: "أبـو هࢪيࢪة",
                role: "الـنـائـب 2 [ الـمكـتـب ]",
                type: "deputy"
            }
        ],

        activityRanking: {
            first: "",
            second: ""
        }
    };
}

// ==================================================
// الحصول على تقرير المجموعة
// ==================================================

function getReport(threadID) {
    if (!reports.has(threadID)) {
        reports.set(threadID, createReport());
    }

    return reports.get(threadID);
}

// ==================================================
// أدوات
// ==================================================

function clean(value) {
    return String(value || "").trim();
}

function splitPipe(text) {
    return String(text || "")
        .split("|")
        .map(x => x.trim());
}

function splitNames(text) {
    if (!text) return [];

    return String(text)
        .split(/[,،]/)
        .map(x => x.trim())
        .filter(Boolean);
}

// ==================================================
// تنسيق المشاركين
// ==================================================

function formatParticipants(participants) {
    if (!participants || !participants.length) {
        return "لا يوجد";
    }

    return participants
        .map(name => `- ${name}`)
        .join("\n");
}

// ==================================================
// تنسيق الفعالية
// ==================================================

function formatActivity(activity, number) {

    if (!activity.organizer && !activity.winner) {
        return (
            `• فعالية ${number === 1 ? "الاولى" : number === 2 ? "ثانية" : "ثالثة"}\n\n` +
            `• المشاركون :\n\n` +
            "```🕹️📋\n" +
            "لا يوجد\n" +
            "```"
        );
    }

    const activityName =
        number === 1
            ? "الاولى"
            : number === 2
                ? "ثانية"
                : "ثالثة";

    return (
        `• فعالية ${activityName} و التي قام بها ❀${activity.organizer || "..."} ❀ و فاز بها ❀${activity.winner || "..."} ❀\n\n` +

        `• المشاركون :\n\n` +

        "```🕹️📋\n" +

        formatParticipants(activity.participants) +

        "\n```"
    );
}

// ==================================================
// الترقيات
// ==================================================

function formatPromotions(report) {

    if (!report.promotions.length) {
        return "-\n\n- \n\n- \n\n-";
    }

    return report.promotions
        .map(promotion => `- ${promotion.name} → ${promotion.rank}`)
        .join("\n\n");
}

// ==================================================
// المسؤولين
// ==================================================

function formatStaff(report) {

    return report.staff
        .map(member => {

            if (member.type === "deputy") {
                return `🔱️ ${member.name} - ${member.role} 🔱`;
            }

            return `▪️${member.name} - ${member.role}▪️`;
        })
        .join("\n\n");
}

// ==================================================
// التقرير النهائي
// ==================================================

function buildReport(report) {

    let text = "";

    text += `📃تقرير يوم ${report.date}📃 تقرير : ${report.reporter}\n\n`;

    text += "```🖋📋\n";
    text += "```\n\n";

    // =========================
    // الفعالية الأولى
    // =========================

    text += formatActivity(report.activities[1], 1);
    text += "\n\n";

    // =========================
    // الفعالية الثانية
    // =========================

    text += formatActivity(report.activities[2], 2);
    text += "\n\n";

    // =========================
    // الفعالية الثالثة
    // =========================

    text += formatActivity(report.activities[3], 3);
    text += "\n\n";

    text += "```🎟️🧫\n";
    text += "```\n\n";

    // =========================
    // الدرس والاختبار
    // =========================

    text +=
        `📕درس تم تقديمه من طرف ♡${report.lesson.teacher || "..."} ♡ ` +
        `📄الاختبار تم عمله من طرف ♡${report.lesson.testMaker || "..."} ♡\n\n`;

    text += "• المشاركون :\n\n";

    text += "```🎟️🧫\n";

    text += formatParticipants(report.lesson.participants);

    text += "\n```\n\n";

    // =========================
    // الترقيات
    // =========================

    text += "```\n";
    text += "          ♡•••ترقيات•••♡\n";
    text += "```\n\n";

    text += formatPromotions(report);

    text += "\n\n";

    // =========================
    // الملاحظات
    // =========================

    text += "```\n\n";

    text += "• ملاحظات ومشاكل في المكتب :\n";

    if (report.notes.length) {

        for (const note of report.notes) {
            text += `♡ ${note}\n`;
        }

    } else {
        text += "♡ لا يوجد مشاكل\n";
    }

    text += "\n";

    text += "-‏- ‏~~~~~~~~~🤍🪄~~~~~~~~~~~~\n";

    // =========================
    // المسؤولين
    // =========================

    text += "• مسؤولين المكتب :\n\n";

    text += formatStaff(report);

    text += "\n\n";

    text += "```\n";

    // =========================
    // النشاط
    // =========================

    text += "☆أكثر العمال نشاطا☆ :\n\n";

    text += "```♡~~~~\n\n";

    text += `- المركز الاول : ${report.activityRanking.first || ""}\n`;
    text += `- المركز الثاني : ${report.activityRanking.second || ""}\n`;

    text += "\n```";

    return text;
}

// ==================================================
// المساعدة
// ==================================================

function help() {

    return (
        HEADER +

        "نظام مكتب التوظيف\n\n" +

        ".مكتب جديد\n" +
        ".مكتب تاريخ اليوم/الشهر/السنة\n" +
        ".مكتب تقرير الاسم\n\n" +

        "إضافة الفعاليات:\n" +
        ".مكتب ف1 المنظم | الفائز | المشاركون\n" +
        ".مكتب ف2 المنظم | الفائز | المشاركون\n" +
        ".مكتب ف3 المنظم | الفائز | المشاركون\n\n" +

        "الدرس والاختبار:\n" +
        ".مكتب درس مقدم الدرس | مقدم الاختبار | المشاركون\n\n" +

        "الترقيات:\n" +
        ".مكتب ترقية الاسم | الرتبة\n\n" +

        "الملاحظات:\n" +
        ".مكتب ملاحظة النص\n\n" +

        "المسؤولون:\n" +
        ".مكتب مسؤول الاسم | المنصب\n\n" +

        "النشاط:\n" +
        ".مكتب نشاط المركز الأول | المركز الثاني\n\n" +

        ".مكتب عرض\n" +
        ".مكتب إنهاء\n" +
        ".مكتب مسح"
    );
}

// ==================================================
// التنفيذ
// ==================================================

module.exports.run = async function ({ api, event, args }) {

    const threadID = String(event.threadID);

    try {

        const action = clean(args[0]);

        // ------------------------------------------
        // بدون أمر
        // ------------------------------------------

        if (!action) {

            return api.sendMessage(
                help(),
                event.threadID,
                event.messageID
            );
        }

        // ------------------------------------------
        // تقرير جديد
        // ------------------------------------------

        if (action === "جديد") {

            reports.set(threadID, createReport());

            return api.sendMessage(
                HEADER +
                "تم إنشاء تقرير مكتب جديد.\n\n" +
                "يمكنك الآن إدخال بيانات التقرير.",
                event.threadID,
                event.messageID
            );
        }

        const report = getReport(threadID);

        // ------------------------------------------
        // التاريخ
        // ------------------------------------------

        if (action === "تاريخ") {

            const date = clean(args.slice(1).join(" "));

            if (!date) {

                return api.sendMessage(
                    HEADER +
                    "اكتب التاريخ.\n\n" +
                    "مثال:\n" +
                    ".مكتب تاريخ 21/09/2026",
                    event.threadID,
                    event.messageID
                );
            }

            report.date = date;

            return api.sendMessage(
                HEADER +
                `تم تحديد تاريخ التقرير: ${date}`,
                event.threadID,
                event.messageID
            );
        }

        // ------------------------------------------
        // اسم صاحب التقرير
        // ------------------------------------------

        if (action === "تقرير") {

            const name = clean(args.slice(1).join(" "));

            if (!name) {

                return api.sendMessage(
                    HEADER +
                    "اكتب اسم صاحب التقرير.",
                    event.threadID,
                    event.messageID
                );
            }

            report.reporter = name;

            return api.sendMessage(
                HEADER +
                `تم تحديد صاحب التقرير: ${name}`,
                event.threadID,
                event.messageID
            );
        }

        // ------------------------------------------
        // الفعالية الأولى
        // ------------------------------------------

        if (action === "ف1") {

            const values = splitPipe(args.slice(1).join(" "));

            report.activities[1].organizer = clean(values[0]);
            report.activities[1].winner = clean(values[1]);
            report.activities[1].participants = splitNames(values[2]);

            return api.sendMessage(
                HEADER +
                "تم تسجيل الفعالية الأولى.",
                event.threadID,
                event.messageID
            );
        }

        // ------------------------------------------
        // الفعالية الثانية
        // ------------------------------------------

        if (action === "ف2") {

            const values = splitPipe(args.slice(1).join(" "));

            report.activities[2].organizer = clean(values[0]);
            report.activities[2].winner = clean(values[1]);
            report.activities[2].participants = splitNames(values[2]);

            return api.sendMessage(
                HEADER +
                "تم تسجيل الفعالية الثانية.",
                event.threadID,
                event.messageID
            );
        }

        // ------------------------------------------
        // الفعالية الثالثة
        // ------------------------------------------

        if (action === "ف3") {

            const values = splitPipe(args.slice(1).join(" "));

            report.activities[3].organizer = clean(values[0]);
            report.activities[3].winner = clean(values[1]);
            report.activities[3].participants = splitNames(values[2]);

            return api.sendMessage(
                HEADER +
                "تم تسجيل الفعالية الثالثة.",
                event.threadID,
                event.messageID
            );
        }

        // ------------------------------------------
        // الدرس + الاختبار
        // ------------------------------------------

        if (action === "درس") {

            const values = splitPipe(args.slice(1).join(" "));

            report.lesson.teacher = clean(values[0]);
            report.lesson.testMaker = clean(values[1]);
            report.lesson.participants = splitNames(values[2]);

            return api.sendMessage(
                HEADER +
                "تم تسجيل الدرس والاختبار والمشاركين.",
                event.threadID,
                event.messageID
            );
        }

        // ------------------------------------------
        // ترقية
        // ------------------------------------------

        if (action === "ترقية") {

            const values = splitPipe(args.slice(1).join(" "));

            const name = clean(values[0]);
            const rank = clean(values[1]);

            if (!name || !rank) {

                return api.sendMessage(
                    HEADER +
                    "الصيغة:\n\n" +
                    ".مكتب ترقية الاسم | الرتبة",
                    event.threadID,
                    event.messageID
                );
            }

            report.promotions.push({
                name,
                rank
            });

            return api.sendMessage(
                HEADER +
                `تمت إضافة ترقية ${name}.`,
                event.threadID,
                event.messageID
            );
        }

        // ------------------------------------------
        // ملاحظة
        // ------------------------------------------

        if (action === "ملاحظة") {

            const note = clean(args.slice(1).join(" "));

            if (!note) {

                return api.sendMessage(
                    HEADER +
                    "اكتب الملاحظة.",
                    event.threadID,
                    event.messageID
                );
            }

            report.notes.push(note);

            return api.sendMessage(
                HEADER +
                "تمت إضافة الملاحظة.",
                event.threadID,
                event.messageID
            );
        }

        // ------------------------------------------
        // مسؤول
        // ------------------------------------------

        if (action === "مسؤول") {

            const values = splitPipe(args.slice(1).join(" "));

            const name = clean(values[0]);
            const role = clean(values[1]);

            if (!name || !role) {

                return api.sendMessage(
                    HEADER +
                    "الصيغة:\n\n" +
                    ".مكتب مسؤول الاسم | المنصب",
                    event.threadID,
                    event.messageID
                );
            }

            report.staff.push({
                name,
                role,
                type: "normal"
            });

            return api.sendMessage(
                HEADER +
                `تمت إضافة المسؤول: ${name}`,
                event.threadID,
                event.messageID
            );
        }

        // ------------------------------------------
        // النشاط
        // ------------------------------------------

        if (action === "نشاط") {

            const values = splitPipe(args.slice(1).join(" "));

            report.activityRanking.first = clean(values[0]);
            report.activityRanking.second = clean(values[1]);

            return api.sendMessage(
                HEADER +
                "تم تسجيل أكثر العمال نشاطًا.",
                event.threadID,
                event.messageID
            );
        }

        // ------------------------------------------
        // عرض
        // ------------------------------------------

        if (action === "عرض") {

            return api.sendMessage(
                buildReport(report),
                event.threadID,
                event.messageID
            );
        }

        // ------------------------------------------
        // إنهاء
        // ------------------------------------------

        if (
            action === "انهاء" ||
            action === "إنهاء"
        ) {

            const finalReport = buildReport(report);

            reports.delete(threadID);

            return api.sendMessage(
                finalReport,
                event.threadID,
                event.messageID
            );
        }

        // ------------------------------------------
        // مسح
        // ------------------------------------------

        if (action === "مسح") {

            reports.delete(threadID);

            return api.sendMessage(
                HEADER +
                "تم مسح تقرير المكتب.",
                event.threadID,
                event.messageID
            );
        }

        // ------------------------------------------
        // أمر غير معروف
        // ------------------------------------------

        return api.sendMessage(
            help(),
            event.threadID,
            event.messageID
        );

    } catch (error) {

        console.error("[OFFICE ERROR]:", error);

        return api.sendMessage(
            HEADER +
            "حدث خطأ في نظام المكتب:\n\n" +
            (error.message || "خطأ غير معروف"),
            event.threadID,
            event.messageID
        );
    }
};
