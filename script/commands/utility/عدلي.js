/**
 * عدلي.js
 * تعديل الصور بالذكاء الاصطناعي
 *
 * الاستخدام:
 * رد على صورة واكتب:
 * عدلي خلي الشعر أسود
 */

const axios = require("axios");
const FormData = require("form-data");

module.exports.config = {
    name: "عدلي",
    version: "1.2.0",
    hasPermssion: 0,
    credits: "أبو هريرة",
    description: "تعديل الصور بالذكاء الاصطناعي",
    commandCategory: "pic",
    usages: "عدلي <وصف التعديل>",
    cooldowns: 10
};

const HINA_HEADER =
    "⌬ ━━ 𝗛𝗜𝗡𝗔  ━━ ⌬\n\n";

/**
 * ==================================================
 * تعديل رسالة بشكل آمن
 * ==================================================
 *
 * مهم:
 * hut-chat-api عندك يستخدم callback
 * وليس Promise في api.editMessage
 */
function safeEditMessage(api, message, messageID) {

    if (!messageID) {
        return;
    }

    try {

        api.editMessage(
            message,
            messageID,
            (error) => {

                if (error) {

                    console.error(
                        "[HINA AI EDIT] Edit Message Error:",
                        error.message || error
                    );

                }

            }
        );

    } catch (error) {

        console.error(
            "[HINA AI EDIT] Edit Message Exception:",
            error.message || error
        );

    }

}

/**
 * ==================================================
 * حذف رسالة بشكل آمن
 * ==================================================
 */
function safeUnsendMessage(api, messageID) {

    if (!messageID) {
        return;
    }

    try {

        api.unsendMessage(
            messageID,
            (error) => {

                if (error) {

                    console.error(
                        "[HINA AI EDIT] Unsend Message Error:",
                        error.message || error
                    );

                }

            }
        );

    } catch (error) {

        console.error(
            "[HINA AI EDIT] Unsend Message Exception:",
            error.message || error
        );

    }

}

/**
 * ==================================================
 * تحميل الصورة من Messenger
 * ==================================================
 */
async function downloadImage(url) {

    if (!url) {

        throw new Error(
            "رابط الصورة غير موجود"
        );

    }

    const response =
        await axios.get(
            url,
            {
                responseType: "arraybuffer",

                timeout: 60000,

                maxContentLength:
                    25 * 1024 * 1024,

                maxBodyLength:
                    25 * 1024 * 1024
            }
        );

    const buffer =
        Buffer.from(response.data);

    if (!buffer.length) {

        throw new Error(
            "الصورة التي تم تحميلها فارغة"
        );

    }

    return buffer;

}

/**
 * ==================================================
 * رفع الصورة إلى Uguu
 * ==================================================
 */
async function uploadToUguu(buffer) {

    const form =
        new FormData();

    form.append(
        "files[]",
        buffer,
        {
            filename: "image.jpg",
            contentType: "image/jpeg"
        }
    );

    const response =
        await axios.post(
            "https://uguu.se/upload.php",
            form,
            {
                headers: {
                    ...form.getHeaders()
                },

                timeout: 60000,

                maxContentLength:
                    25 * 1024 * 1024,

                maxBodyLength:
                    25 * 1024 * 1024
            }
        );

    const data =
        response.data;

    if (
        !data ||
        !data.files ||
        !data.files.length ||
        !data.files[0].url
    ) {

        throw new Error(
            "فشل رفع الصورة إلى Uguu: " +
            JSON.stringify(data || {})
        );

    }

    return data.files[0].url;

}

/**
 * ==================================================
 * إرسال الصورة إلى API التعديل
 * ==================================================
 */
async function editImage(
    imageUrl,
    prompt
) {

    try {

        const response =
            await axios.get(
                "https://engez.a7a.online/api/v1/ai/ai/imgedit",
                {
                    params: {
                        image_url:
                            imageUrl,

                        prompt:
                            prompt
                    },

                    timeout: 120000
                }
            );

        const data =
            response.data;

        console.log(
            "[HINA AI EDIT] API Status:",
            response.status
        );

        console.log(
            "[HINA AI EDIT] API Response:",
            JSON.stringify(data)
        );

        if (
            data &&
            data.success &&
            data.response &&
            data.response.image
        ) {

            return {

                image:
                    data.response.image,

                originalImage:
                    data.response.source_image ||
                    imageUrl,

                images:
                    data.response.images ||
                    [],

                serial_no:
                    data.response.serial_no ||
                    "غير متوفر",

                prompt:
                    data.response.prompt ||
                    prompt

            };

        }

        throw new Error(
            "API لم يرجع صورة صالحة:\n" +
            JSON.stringify(
                data || {}
            )
        );

    } catch (error) {

        if (error.response) {

            let apiError;

            try {

                apiError =
                    typeof error.response.data === "string"
                        ? error.response.data
                        : JSON.stringify(
                            error.response.data
                        );

            } catch {

                apiError =
                    "استجابة غير معروفة من API";

            }

            throw new Error(
                `API Error ${error.response.status}: ${apiError}`
            );

        }

        throw error;

    }

}

/**
 * ==================================================
 * تحميل الصورة الناتجة
 * ==================================================
 */
async function getResultBuffer(url) {

    if (!url) {

        throw new Error(
            "لم يتم الحصول على رابط الصورة المعدلة"
        );

    }

    const response =
        await axios.get(
            url,
            {
                responseType:
                    "arraybuffer",

                timeout:
                    120000,

                maxContentLength:
                    25 * 1024 * 1024,

                maxBodyLength:
                    25 * 1024 * 1024
            }
        );

    const buffer =
        Buffer.from(
            response.data
        );

    if (!buffer.length) {

        throw new Error(
            "الصورة الناتجة فارغة"
        );

    }

    return buffer;

}

/**
 * ==================================================
 * الأمر الأساسي
 * ==================================================
 */
module.exports.run = async function ({
    api,
    event,
    args
}) {

    const threadID =
        event.threadID;

    /**
     * يجب أن يكون الأمر ردًا على رسالة
     */
    if (!event.messageReply) {

        return api.sendMessage(
            HINA_HEADER +
            "🎨 تعديل الصور بالذكاء الاصطناعي\n\n" +
            "رد على صورة واكتب:\n\n" +
            "عدلي <وصف التعديل>\n\n" +
            "مثال:\n" +
            "عدلي خلي الشعر أسود\n\n" +
            "عدلي حط نظارة شمسية",

            threadID,

            event.messageID
        );

    }

    const reply =
        event.messageReply;

    /**
     * البحث عن الصورة
     */
    const attachments =
        reply.attachments || [];

    const image =
        attachments.find(
            attachment =>
                attachment &&
                attachment.url &&
                (
                    attachment.type === "photo" ||
                    attachment.type === "image" ||
                    !attachment.type
                )
        );

    if (!image) {

        return api.sendMessage(
            HINA_HEADER +
            "❌ الرسالة التي رددت عليها لا تحتوي على صورة.\n\n" +
            "رد على صورة مباشرة ثم اكتب وصف التعديل.",

            threadID,

            event.messageID
        );

    }

    /**
     * وصف التعديل
     */
    const prompt =
        Array.isArray(args)
            ? args.join(" ").trim()
            : "";

    if (!prompt) {

        return api.sendMessage(
            HINA_HEADER +
            "❌ اكتب وصف التعديل أولًا.\n\n" +
            "مثال:\n" +
            "عدلي خلي الشعر أسود",

            threadID,

            event.messageID
        );

    }

    /**
     * رسالة الانتظار
     */
    const waitMessage =
        await api.sendMessage(
            HINA_HEADER +
            "⏳ جاري معالجة الصورة...\n\n" +
            "📥 تحميل الصورة...\n" +
            "✏️ التعديل: " +
            prompt,

            threadID
        );

    try {

        /**
         * ==========================================
         * 1 — تحميل صورة Messenger
         * ==========================================
         */
        console.log(
            "[HINA AI EDIT] Downloading Messenger image..."
        );

        const imageBuffer =
            await downloadImage(
                image.url
            );

        console.log(
            "[HINA AI EDIT] Image downloaded:",
            imageBuffer.length,
            "bytes"
        );

        /**
         * ==========================================
         * 2 — رفعها إلى Uguu
         * ==========================================
         */
        safeEditMessage(
            api,

            HINA_HEADER +
            "⏳ جاري معالجة الصورة...\n\n" +
            "📤 رفع الصورة إلى الخادم...\n" +
            "✏️ التعديل: " +
            prompt,

            waitMessage &&
            waitMessage.messageID
        );

        console.log(
            "[HINA AI EDIT] Uploading image to Uguu..."
        );

        const publicImageUrl =
            await uploadToUguu(
                imageBuffer
            );

        console.log(
            "[HINA AI EDIT] Public image URL:",
            publicImageUrl
        );

        /**
         * ==========================================
         * 3 — إرسال الرابط إلى API
         * ==========================================
         */
        safeEditMessage(
            api,

            HINA_HEADER +
            "⏳ جاري تعديل الصورة...\n\n" +
            "✏️ التعديل: " +
            prompt,

            waitMessage &&
            waitMessage.messageID
        );

        console.log(
            "[HINA AI EDIT] Sending image to AI API..."
        );

        const result =
            await editImage(
                publicImageUrl,
                prompt
            );

        console.log(
            "[HINA AI EDIT] AI image received."
        );

        /**
         * ==========================================
         * 4 — تحميل الصورة الناتجة
         * ==========================================
         */
        const resultBuffer =
            await getResultBuffer(
                result.image
            );

        console.log(
            "[HINA AI EDIT] Result downloaded:",
            resultBuffer.length,
            "bytes"
        );

        /**
         * حذف رسالة الانتظار
         */
        safeUnsendMessage(
            api,

            waitMessage &&
            waitMessage.messageID
        );

        /**
         * ==========================================
         * 5 — إرسال الصورة المعدلة
         * ==========================================
         */
        return api.sendMessage(
            {
                body:
                    HINA_HEADER +
                    "✅ تم تعديل الصورة بنجاح\n\n" +
                    "✏️ التعديل: " +
                    result.prompt +
                    "\n" +
                    "🔢 رقم المهمة: " +
                    result.serial_no,

                attachment:
                    resultBuffer
            },

            threadID,

            event.messageID
        );

    } catch (error) {

        console.error(
            "================================="
        );

        console.error(
            "[HINA AI EDIT] ERROR"
        );

        console.error(
            "Message:",
            error.message
        );

        console.error(
            "Status:",
            error.response?.status
        );

        console.error(
            "Response:",
            error.response?.data
        );

        console.error(
            "URL:",
            error.config?.url
        );

        console.error(
            "================================="
        );

        /**
         * حذف رسالة الانتظار
         */
        safeUnsendMessage(
            api,

            waitMessage &&
            waitMessage.messageID
        );

        let errorMessage =
            error &&
            error.message
                ? error.message
                : "خطأ غير معروف";

        if (
            errorMessage.length > 2000
        ) {

            errorMessage =
                errorMessage.slice(
                    0,
                    2000
                ) +
                "\n...";

        }

        return api.sendMessage(
            HINA_HEADER +
            "❌ فشل تعديل الصورة\n\n" +
            "الخطأ:\n" +
            errorMessage +
            "\n\n" +
            "إذا ظهر API Error 500 فغالبًا المشكلة من خدمة التعديل الخارجية أو من الرابط الذي استقبلته.",

            threadID,

            event.messageID
        );

    }

};
