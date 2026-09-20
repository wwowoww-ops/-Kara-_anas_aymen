/**
 * موافقة.js
 *
 * .موافقة
 * عرض حالة موافقة الأدمن الحقيقية
 *
 * .موافقة تشغيل
 * تفعيل موافقة الأدمن
 *
 * .موافقة إيقاف
 * إيقاف موافقة الأدمن
 *
 * لا يستخدم قاعدة بيانات
 * ولا يحتاج approval.json
 */

const axios = require("axios");

module.exports.config = {
    name: "موافقة",
    version: "2.0.0",
    hasPermssion: 1,
    credits: "أبو هريرة",
    description: "التحكم في موافقة الأدمن على إضافة الأعضاء",
    commandCategory: "Admin",
    usages: "موافقة | موافقة تشغيل | موافقة إيقاف",
    cooldowns: 5
};

const HEADER =
    "⌬ ━━ 𝗛𝗜𝗡𝗔  ━━ ⌬\n\n";

// ==================================================
// الحصول على معلومات المجموعة
// ==================================================

function getThreadInfo(api, threadID) {

    return new Promise((resolve, reject) => {

        api.getThreadInfo(
            threadID,
            (error, info) => {

                if (error) {
                    return reject(error);
                }

                resolve(info);
            }
        );

    });
}

// ==================================================
// تحويل AppState إلى Cookie
// ==================================================

function buildCookie(appState) {

    if (!Array.isArray(appState)) {
        throw new Error(
            "تعذر الحصول على AppState."
        );
    }

    return appState
        .map(cookie => {
            if (
                !cookie ||
                !cookie.key ||
                cookie.value === undefined
            ) {
                return null;
            }

            return `${cookie.key}=${cookie.value}`;
        })
        .filter(Boolean)
        .join("; ");
}

// ==================================================
// استخراج fb_dtsg من صفحة Facebook
// ==================================================

function extractDTSG(html) {

    if (!html) {
        return null;
    }

    let match =
        html.match(
            /"DTSGInitialData",\[\],\{"token":"([^"]+)"/
        );

    if (match && match[1]) {
        return match[1];
    }

    match =
        html.match(
            /"token":"([^"]+)"/
        );

    if (match && match[1]) {
        return match[1];
    }

    match =
        html.match(
            /name="fb_dtsg"\s+value="([^"]+)"/
        );

    if (match && match[1]) {
        return match[1];
    }

    return null;
}

// ==================================================
// الحصول على fb_dtsg
// ==================================================

async function getFacebookTokens(cookie) {

    const response =
        await axios.get(
            "https://www.facebook.com/",
            {
                timeout: 20000,

                headers: {
                    Cookie: cookie,

                    "User-Agent":
                        "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36",

                    Accept:
                        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
                },

                maxRedirects: 5
            }
        );

    const html =
        String(
            response.data || ""
        );

    const fb_dtsg =
        extractDTSG(html);

    if (!fb_dtsg) {

        throw new Error(
            "تعذر استخراج fb_dtsg من جلسة Facebook."
        );
    }

    return {
        fb_dtsg
    };
}

// ==================================================
// تغيير وضع الموافقة مباشرة
// ==================================================

async function setApprovalMode(
    api,
    threadID,
    enabled
) {

    // --------------------------------------------------
    // الحصول على AppState الحالي
    // --------------------------------------------------

    if (
        typeof api.getAppState !== "function"
    ) {

        throw new Error(
            "API الحالي لا يوفر getAppState."
        );
    }

    const appState =
        api.getAppState();

    const cookie =
        buildCookie(
            appState
        );

    if (!cookie) {

        throw new Error(
            "تعذر إنشاء Cookie من AppState."
        );
    }

    // --------------------------------------------------
    // الحصول على fb_dtsg
    // --------------------------------------------------

    const tokens =
        await getFacebookTokens(
            cookie
        );

    // --------------------------------------------------
    // تجهيز البيانات
    // --------------------------------------------------

    const form =
        new URLSearchParams();

    form.append(
        "set_mode",
        enabled ? "1" : "0"
    );

    form.append(
        "thread_fbid",
        String(threadID)
    );

    form.append(
        "fb_dtsg",
        tokens.fb_dtsg
    );

    form.append(
        "jazoest",
        "25436"
    );

    // --------------------------------------------------
    // إرسال الطلب الداخلي
    // --------------------------------------------------

    const response =
        await axios.post(
            "https://www.facebook.com/messaging/set_approval_mode/?dpr=1",
            form.toString(),
            {
                timeout: 20000,

                headers: {
                    Cookie: cookie,

                    "User-Agent":
                        "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36",

                    "Content-Type":
                        "application/x-www-form-urlencoded",

                    Accept:
                        "*/*",

                    Origin:
                        "https://www.facebook.com",

                    Referer:
                        "https://www.facebook.com/"
                },

                maxRedirects: 5
            }
        );

    const result =
        String(
            response.data || ""
        );

    console.log(
        "[APPROVAL RAW RESPONSE]:",
        result.substring(0, 1000)
    );

    // --------------------------------------------------
    // فحص الرد
    // --------------------------------------------------

    if (
        result.includes(
            "approval_mode"
        ) ||
        result.includes(
            '"success":true'
        ) ||
        result.includes(
            '"success": true'
        )
    ) {

        return true;
    }

    /*
     * Facebook قد يعيد HTML أو JSON مختلف
     * حسب الجلسة والإصدار.
     *
     * لذلك نتحقق بعد الطلب من الحالة الحقيقية.
     */

    const info =
        await getThreadInfo(
            api,
            threadID
        );

    const current =
        info &&
        (
            info.approvalMode === true ||
            info.approvalMode === 1 ||
            info.approvalMode === "1"
        );

    if (current === Boolean(enabled)) {
        return true;
    }

    throw new Error(
        "Facebook لم يغيّر حالة موافقة الأدمن."
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

    try {

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
        // قراءة الحالة الحقيقية
        // ==================================================

        const threadInfo =
            await getThreadInfo(
                api,
                threadID
            );

        const approvalMode =
            threadInfo &&
            threadInfo.approvalMode;

        const enabled =
            approvalMode === true ||
            approvalMode === 1 ||
            approvalMode === "1";

        // ==================================================
        // .موافقة
        // ==================================================

        if (!action) {

            return api.sendMessage(

                HEADER +
                "حالة موافقة الأدمن\n\n" +
                `الحالة: ${
                    enabled
                        ? "مفعلة"
                        : "متوقفة"
                }\n\n` +
                `approvalMode: ${String(
                    approvalMode
                )}`,

                threadID,
                event.messageID
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

            if (enabled) {

                return api.sendMessage(
                    HEADER +
                    "موافقة إضافة الأعضاء مفعلة بالفعل.",
                    threadID,
                    event.messageID
                );
            }

            console.log(
                `[APPROVAL] محاولة تفعيل المجموعة ${threadID}`
            );

            await setApprovalMode(
                api,
                threadID,
                true
            );

            // التحقق النهائي
            const updatedInfo =
                await getThreadInfo(
                    api,
                    threadID
                );

            const updated =
                updatedInfo &&
                (
                    updatedInfo.approvalMode === true ||
                    updatedInfo.approvalMode === 1 ||
                    updatedInfo.approvalMode === "1"
                );

            if (!updated) {

                throw new Error(
                    "تم إرسال الطلب لكن حالة المجموعة لم تتغير."
                );
            }

            return api.sendMessage(

                HEADER +
                "تم تفعيل موافقة الأدمن على إضافة الأعضاء.",

                threadID,
                event.messageID
            );
        }

        // ==================================================
        // إيقاف
        // ==================================================

        if (
            action === "إيقاف" ||
            action === "off" ||
            action === "disable"
        ) {

            if (!enabled) {

                return api.sendMessage(
                    HEADER +
                    "موافقة إضافة الأعضاء متوقفة بالفعل.",
                    threadID,
                    event.messageID
                );
            }

            console.log(
                `[APPROVAL] محاولة إيقاف المجموعة ${threadID}`
            );

            await setApprovalMode(
                api,
                threadID,
                false
            );

            // التحقق النهائي
            const updatedInfo =
                await getThreadInfo(
                    api,
                    threadID
                );

            const updated =
                updatedInfo &&
                (
                    updatedInfo.approvalMode === true ||
                    updatedInfo.approvalMode === 1 ||
                    updatedInfo.approvalMode === "1"
                );

            if (updated) {

                throw new Error(
                    "تم إرسال الطلب لكن حالة المجموعة لم تتغير."
                );
            }

            return api.sendMessage(

                HEADER +
                "تم إيقاف موافقة الأدمن على إضافة الأعضاء.",

                threadID,
                event.messageID
            );
        }

        // ==================================================
        // استخدام خاطئ
        // ==================================================

        return api.sendMessage(

            HEADER +
            "الاستخدام الصحيح:\n\n" +
            ".موافقة\n" +
            ".موافقة تشغيل\n" +
            ".موافقة إيقاف",

            threadID,
            event.messageID
        );

    } catch (error) {

        console.error(
            "========================================"
        );

        console.error(
            "[APPROVAL ERROR]"
        );

        console.error(
            error
        );

        console.error(
            "========================================"
        );

        return api.sendMessage(

            HEADER +
            "حدث خطأ أثناء تغيير موافقة الأدمن.\n\n" +
            (
                error &&
                error.message
                    ? error.message
                    : "خطأ غير معروف"
            ),

            threadID,
            event.messageID
        );
    }
};