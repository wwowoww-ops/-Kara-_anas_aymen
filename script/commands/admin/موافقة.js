/**
 * موافقة.js
 *
 * .موافقة
 * عرض حالة موافقة الأدمن على إضافة الأعضاء
 *
 * .موافقة تشغيل
 * تفعيل موافقة الأدمن
 *
 * .موافقة إيقاف
 * تعطيل موافقة الأدمن
 *
 * الحالة مستقلة لكل مجموعة
 * ويتم حفظها في:
 * data/approval.json
 */

const fs = require("fs");
const path = require("path");

module.exports.config = {
    name: "موافقة",
    version: "1.0.0",
    hasPermssion: 1,
    credits: "أبو هريرة",
    description: "التحكم في موافقة الأدمن على انضمام الأعضاء",
    commandCategory: "admin",
    usages: "موافقة | موافقة تشغيل | موافقة إيقاف",
    cooldowns: 3
};

// ==================================================
// HINA
// ==================================================

const HEADER =
    "⌬ ━━ 𝗛𝗜𝗡𝗔  ━━ ⌬\n\n";

// ==================================================
// ملف حفظ الحالات
// ==================================================

const DATA_DIR = path.join(
    process.cwd(),
    "data"
);

const DATA_FILE = path.join(
    DATA_DIR,
    "approval.json"
);

// ==================================================
// إنشاء ملف البيانات إذا لم يكن موجودًا
// ==================================================

function ensureDataFile() {

    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, {
            recursive: true
        });
    }

    if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(
            DATA_FILE,
            JSON.stringify({}, null, 2),
            "utf8"
        );
    }
}

// ==================================================
// قراءة الحالات
// ==================================================

function readData() {

    ensureDataFile();

    try {

        const content =
            fs.readFileSync(
                DATA_FILE,
                "utf8"
            );

        if (!content.trim()) {
            return {};
        }

        const data =
            JSON.parse(content);

        if (
            !data ||
            typeof data !== "object" ||
            Array.isArray(data)
        ) {
            return {};
        }

        return data;

    } catch (error) {

        console.error(
            "[APPROVAL DATA READ ERROR]:",
            error
        );

        return {};
    }
}

// ==================================================
// حفظ الحالات
// ==================================================

function writeData(data) {

    ensureDataFile();

    const tempFile =
        DATA_FILE + ".tmp";

    fs.writeFileSync(
        tempFile,
        JSON.stringify(data, null, 2),
        "utf8"
    );

    fs.renameSync(
        tempFile,
        DATA_FILE
    );
}

// ==================================================
// الحصول على حالة المجموعة
// ==================================================

function getStatus(threadID) {

    const data =
        readData();

    return data[String(threadID)] === true;
}

// ==================================================
// حفظ حالة المجموعة
// ==================================================

function setStatus(threadID, status) {

    const data =
        readData();

    data[String(threadID)] =
        Boolean(status);

    writeData(data);
}

// ==================================================
// تنفيذ changeApprovalMode
// ==================================================

function changeApprovalMode(
    api,
    threadID,
    enabled
) {

    return new Promise(
        (resolve, reject) => {

            if (
                !api ||
                typeof api.changeApprovalMode !== "function"
            ) {

                return reject(
                    new Error(
                        "إصدار hut-chat-api الحالي لا يدعم changeApprovalMode."
                    )
                );
            }

            const mode =
                enabled ? 1 : 0;

            let finished = false;

            const callback = (error) => {

                if (finished) {
                    return;
                }

                finished = true;

                if (error) {
                    return reject(error);
                }

                resolve();
            };

            try {

                const result =
                    api.changeApprovalMode(
                        mode,
                        String(threadID),
                        callback
                    );

                /*
                 * بعض نسخ API قد تعيد Promise
                 * بدل callback.
                 */

                if (
                    result &&
                    typeof result.then === "function"
                ) {

                    result
                        .then(() => {

                            if (finished) {
                                return;
                            }

                            finished = true;
                            resolve();

                        })
                        .catch((error) => {

                            if (finished) {
                                return;
                            }

                            finished = true;
                            reject(error);
                        });
                }

            } catch (error) {

                if (!finished) {
                    finished = true;
                    reject(error);
                }
            }
        }
    );
}

// ==================================================
// إرسال رسالة
// ==================================================

function send(
    api,
    threadID,
    messageID,
    text
) {

    return api.sendMessage(
        HEADER + text,
        threadID,
        messageID
    );
}

// ==================================================
// تنفيذ الأمر
// ==================================================

module.exports.run = async function ({
    api,
    event
}) {

    const threadID =
        String(
            event.threadID || ""
        );

    if (!threadID) {
        return;
    }

    // ==================================================
    // التأكد من أنها مجموعة
    // ==================================================

    if (event.isGroup === false) {

        return send(
            api,
            threadID,
            event.messageID,
            "هذا الأمر يعمل داخل المجموعات فقط."
        );
    }

    // ==================================================
    // قراءة الأمر
    // ==================================================

    const body =
        String(
            event.body || ""
        )
        .trim();

    const args =
        body
            .split(/\s+/)
            .slice(1);

    const action =
        String(
            args[0] || ""
        )
        .toLowerCase();

    // ==================================================
    // عرض الحالة
    // ==================================================

    if (!action) {

        const enabled =
            getStatus(threadID);

        return send(
            api,
            threadID,
            event.messageID,

            enabled
                ? "موافقة إضافة الأعضاء: مفعلة\n\nيجب موافقة أحد أدمن المجموعة قبل انضمام عضو جديد."
                : "موافقة إضافة الأعضاء: متوقفة\n\nيمكن للأعضاء الانضمام دون تفعيل نظام الموافقة."
        );
    }

    // ==================================================
    // تشغيل
    // ==================================================

    if (
        action === "تشغيل" ||
        action === "on" ||
        action === "enable"
    ) {

        if (getStatus(threadID)) {

            return send(
                api,
                threadID,
                event.messageID,
                "موافقة إضافة الأعضاء مفعلة بالفعل."
            );
        }

        try {

            await changeApprovalMode(
                api,
                threadID,
                true
            );

            setStatus(
                threadID,
                true
            );

            console.log(
                `[APPROVAL] ENABLED thread=${threadID}`
            );

            return send(
                api,
                threadID,
                event.messageID,
                "تم تفعيل موافقة الأدمن على إضافة الأعضاء."
            );

        } catch (error) {

            console.error(
                "[APPROVAL ENABLE ERROR]:",
                error
            );

            return send(
                api,
                threadID,
                event.messageID,

                "فشل تفعيل موافقة الأدمن.\n\n" +
                (
                    error &&
                    error.message
                        ? error.message
                        : "خطأ غير معروف"
                )
            );
        }
    }

    // ==================================================
    // إيقاف
    // ==================================================

    if (
        action === "إيقاف" ||
        action === "off" ||
        action === "disable"
    ) {

        if (!getStatus(threadID)) {

            return send(
                api,
                threadID,
                event.messageID,
                "موافقة إضافة الأعضاء متوقفة بالفعل."
            );
        }

        try {

            await changeApprovalMode(
                api,
                threadID,
                false
            );

            setStatus(
                threadID,
                false
            );

            console.log(
                `[APPROVAL] DISABLED thread=${threadID}`
            );

            return send(
                api,
                threadID,
                event.messageID,
                "تم إيقاف موافقة الأدمن على إضافة الأعضاء."
            );

        } catch (error) {

            console.error(
                "[APPROVAL DISABLE ERROR]:",
                error
            );

            return send(
                api,
                threadID,
                event.messageID,

                "فشل إيقاف موافقة الأدمن.\n\n" +
                (
                    error &&
                    error.message
                        ? error.message
                        : "خطأ غير معروف"
                )
            );
        }
    }

    // ==================================================
    // أمر غير معروف
    // ==================================================

    return send(
        api,
        threadID,
        event.messageID,

        "الاستخدام الصحيح:\n\n" +
        ".موافقة\n" +
        ".موافقة تشغيل\n" +
        ".موافقة إيقاف"
    );
};