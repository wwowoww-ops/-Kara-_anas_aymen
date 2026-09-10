module.exports.config = {
    name: "صداقة",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "أبو هريرة",
    description: "عرض وإدارة طلبات الصداقة",
    commandCategory: "developer",
    usages: "صداقة",
    cooldowns: 5
};

const DEVELOPER_ID = "61578581225040";
const PAGE_SIZE = 10;

// ==================================================
// أدوات مساعدة
// ==================================================

function sendMessage(api, body, threadID, messageID) {
    return new Promise(resolve => {
        api.sendMessage(
            body,
            threadID,
            (error, info) => resolve({ error, info }),
            messageID
        );
    });
}

function getFriends(api) {
    return new Promise((resolve, reject) => {
        try {
            api.getFriendsList((error, data) => {
                if (error) return reject(error);
                resolve(Array.isArray(data) ? data : []);
            });
        } catch (error) {
            reject(error);
        }
    });
}

function handleFriendRequest(api, userID, accept) {
    return new Promise((resolve, reject) => {
        try {
            api.handleFriendRequest(
                String(userID),
                Boolean(accept),
                error => {
                    if (error) return reject(error);
                    resolve();
                }
            );
        } catch (error) {
            reject(error);
        }
    });
}

// ==================================================
// استخراج طلبات الصداقة
// ==================================================

function getPendingRequests(list) {
    if (!Array.isArray(list)) {
        return [];
    }

    console.log(
        "[FRIEND REQUEST FULL DEBUG]",
        JSON.stringify(list, null, 2)
    );

    return [];
}

// ==================================================
// إنشاء الصفحة
// ==================================================

function createPage(requests, page) {

    const totalPages = Math.max(
        1,
        Math.ceil(requests.length / PAGE_SIZE)
    );

    const safePage = Math.min(
        Math.max(page, 1),
        totalPages
    );

    const start = (safePage - 1) * PAGE_SIZE;

    const items = requests.slice(
        start,
        start + PAGE_SIZE
    );

    let text =
`╭───〔 𝗛𝗜𝗡𝗔 〢 𝗙𝗥𝗜𝗘𝗡𝗗𝗦 〕───╮

طلبات الصداقة الواردة

`;

    if (items.length === 0) {

        text += "لا توجد طلبات صداقة حالياً\n";

    } else {

        items.forEach((user, index) => {

            const number = start + index + 1;

            const name =
                user.name ||
                user.fullName ||
                user.full_name ||
                "مستخدم بدون اسم";

            text +=
`${number} ـ ${name}
UID: ${user.userID}

`;
        });
    }

    text +=
`الصفحة ${safePage} من ${totalPages}

رد برقم الشخص لقبول طلبه
مثال: 3

رد: رفض 3 لرفض الطلب

رد: التالي للصفحة التالية
رد: السابق للصفحة السابقة`;

    return {
        text,
        page: safePage,
        totalPages
    };
}

// ==================================================
// الأمر
// ==================================================

module.exports.run = async function ({
    api,
    event
}) {

    const senderID = String(
        event.senderID || ""
    );

    const threadID = String(
        event.threadID || ""
    );

    if (senderID !== DEVELOPER_ID) {

        return api.sendMessage(
            "هذا الأمر مخصص للمطور فقط",
            threadID,
            event.messageID
        );
    }

    try {

        const friends = await getFriends(api);

        const requests =
            getPendingRequests(friends);

        const pageData =
            createPage(requests, 1);

        const sent =
            await sendMessage(
                api,
                pageData.text,
                threadID,
                event.messageID
            );

        if (
            sent.error ||
            !sent.info ||
            !sent.info.messageID
        ) {
            console.error(
                "[صداقة] فشل إرسال القائمة:",
                sent.error
            );

            return;
        }

        // ==================================================
        // تسجيل الرد
        // ==================================================

        if (
            Array.isArray(
                global.client.handleReply
            )
        ) {

            global.client.handleReply.push({
                name: "صداقة",
                messageID: sent.info.messageID,
                author: senderID,
                threadID,
                type: "friendRequests",
                page: 1
            });
        }

    } catch (error) {

        console.error(
            "[صداقة ERROR]",
            error
        );

        return api.sendMessage(
            "حدث خطأ أثناء جلب طلبات الصداقة",
            threadID,
            event.messageID
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

        const senderID = String(
            event.senderID || ""
        );

        const threadID = String(
            event.threadID || ""
        );

        // المطور فقط
        if (senderID !== DEVELOPER_ID) {
            return;
        }

        // حماية إضافية
        if (
            String(handleReply.author) !==
            senderID
        ) {
            return;
        }

        if (
            String(handleReply.threadID) !==
            threadID
        ) {
            return;
        }

        const body = String(
            event.body || ""
        ).trim();

        if (!body) return;

        // ==================================================
        // جلب الطلبات من جديد
        // ==================================================

        const friends =
            await getFriends(api);

        const requests =
            getPendingRequests(friends);

        // ==================================================
        // التالي
        // ==================================================

        if (
            body === "التالي" ||
            body.toLowerCase() === "next"
        ) {

            const nextPage =
                Number(handleReply.page || 1) + 1;

            const pageData =
                createPage(
                    requests,
                    nextPage
                );

            return sendMessage(
                api,
                pageData.text,
                threadID,
                event.messageID
            );
        }

        // ==================================================
        // السابق
        // ==================================================

        if (
            body === "السابق" ||
            body.toLowerCase() === "prev"
        ) {

            const previousPage =
                Number(handleReply.page || 1) - 1;

            const pageData =
                createPage(
                    requests,
                    previousPage
                );

            return sendMessage(
                api,
                pageData.text,
                threadID,
                event.messageID
            );
        }

        // ==================================================
        // رفض رقم
        // ==================================================

        const rejectMatch =
            body.match(
                /^رفض\s+(\d+)$/i
            );

        if (rejectMatch) {

            const number =
                Number(rejectMatch[1]);

            const page =
                Number(handleReply.page || 1);

            const start =
                (page - 1) * PAGE_SIZE;

            const index =
                number - start - 1;

            const user =
                requests[index];

            if (!user) {

                return api.sendMessage(
                    "رقم الطلب غير موجود في هذه الصفحة",
                    threadID,
                    event.messageID
                );
            }

            await handleFriendRequest(
                api,
                user.userID,
                false
            );

            return api.sendMessage(
                `تم رفض طلب ${user.name || "المستخدم"} بنجاح`,
                threadID,
                event.messageID
            );
        }

        // ==================================================
        // قبول رقم
        // ==================================================

        if (/^\d+$/.test(body)) {

            const number =
                Number(body);

            const page =
                Number(handleReply.page || 1);

            const start =
                (page - 1) * PAGE_SIZE;

            const index =
                number - start - 1;

            const user =
                requests[index];

            if (!user) {

                return api.sendMessage(
                    "رقم الطلب غير موجود في هذه الصفحة",
                    threadID,
                    event.messageID
                );
            }

            await handleFriendRequest(
                api,
                user.userID,
                true
            );

            return api.sendMessage(
                `تم قبول طلب ${user.name || "المستخدم"} بنجاح`,
                threadID,
                event.messageID
            );
        }

        // ==================================================
        // رد غير معروف
        // ==================================================

        return api.sendMessage(
            "الرد غير صحيح\n\nاستخدم رقم لقبول الطلب\nأو رفض + الرقم لرفضه\nأو التالي / السابق للتنقل",
            threadID,
            event.messageID
        );

    } catch (error) {

        console.error(
            "[صداقة HANDLE REPLY ERROR]",
            error
        );

        return api.sendMessage(
            "حدث خطأ أثناء معالجة طلب الصداقة",
            event.threadID,
            event.messageID
        );
    }
};