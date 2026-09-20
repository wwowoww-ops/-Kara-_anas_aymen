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
    version: "1.1.0",
    hasPermssion: 0,
    credits: "أبو هريرة",
    description: "تعديل الصور بالذكاء الاصطناعي",
    commandCategory: "Photos",
    usages: "عدلي <وصف التعديل>",
    cooldowns: 10
};

const HINA_HEADER = "⌬ ━━ 𝗛𝗜𝗡𝗔  ━━ ⌬\n\n";

/**
 * تحميل الصورة من Messenger
 */
async function downloadImage(url) {
    if (!url) {
        throw new Error("رابط الصورة غير موجود");
    }

    const response = await axios.get(url, {
        responseType: "arraybuffer",
        timeout: 60000,
        maxContentLength: 25 * 1024 * 1024,
        maxBodyLength: 25 * 1024 * 1024
    });

    const buffer = Buffer.from(response.data);

    if (!buffer.length) {
        throw new Error("الصورة التي تم تحميلها فارغة");
    }

    return buffer;
}

/**
 * رفع الصورة إلى Uguu
 */
async function uploadToUguu(buffer) {

    const form = new FormData();

    form.append(
        "files[]",
        buffer,
        {
            filename: "image.jpg",
            contentType: "image/jpeg"
        }
    );

    const response = await axios.post(
        "https://uguu.se/upload.php",
        form,
        {
            headers: {
                ...form.getHeaders()
            },
            timeout: 60000,
            maxContentLength: 25 * 1024 * 1024,
            maxBodyLength: 25 * 1024 * 1024
        }
    );

    const data = response.data;

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
 * إرسال الصورة إلى API التعديل
 */
async function editImage(imageUrl, prompt) {

    try {

        const response = await axios.get(
            "https://engez.a7a.online/api/v1/ai/ai/imgedit",
            {
                params: {
                    image_url: imageUrl,
                    prompt: prompt
                },
                timeout: 120000
            }
        );

        const data = response.data;

        if (
            data &&
            data.success &&
            data.response &&
            data.response.image
        ) {
            return {
                image: data.response.image,
                originalImage:
                    data.response.source_image ||
                    imageUrl,
                images:
                    data.response.images || [],
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
            JSON.stringify(data || {})
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
 * تحميل الصورة الناتجة
 */
async function getResultBuffer(url) {

    if (!url) {
        throw new Error(
            "لم يتم الحصول على رابط الصورة المعدلة"
        );
    }

    const response = await axios.get(
        url,
        {
            responseType: "arraybuffer",
            timeout: 120000,
            maxContentLength: 25 * 1024 * 1024,
            maxBodyLength: 25 * 1024 * 1024
        }
    );

    return Buffer.from(response.data);
}

module.exports.run = async function ({
    api,
    event,
    args
}) {

    const threadID = event.threadID;

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

    const reply = event.messageReply;

    /**
     * البحث عن الصورة
     */
    const attachments =
        reply.attachments || [];

    const image = attachments.find(
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
         * 1 — تحميل صورة Messenger
         */
        const imageBuffer =
            await downloadImage(image.url);

        /**
         * 2 — رفعها إلى Uguu
         */
        if (
            waitMessage &&
            waitMessage.messageID
        ) {
            await api.editMessage(
                HINA_HEADER +
                "⏳ جاري معالجة الصورة...\n\n" +
                "📤 رفع الصورة إلى الخادم...\n" +
                "✏️ التعديل: " +
                prompt,
                waitMessage.messageID
            ).catch(() => {});
        }

        const publicImageUrl =
            await uploadToUguu(imageBuffer);

        /**
         * 3 — إرسال الرابط العام إلى API
         */
        if (
            waitMessage &&
            waitMessage.messageID
        ) {
            await api.editMessage(
                HINA_HEADER +
                "⏳ جاري تعديل الصورة...\n\n" +
                "✏️ التعديل: " +
                prompt,
                waitMessage.messageID
            ).catch(() => {});
        }

        const result =
            await editImage(
                publicImageUrl,
                prompt
            );

        /**
         * 4 — تحميل الصورة الناتجة
         */
        const resultBuffer =
            await getResultBuffer(
                result.image
            );

        /**
         * حذف رسالة الانتظار
         */
        if (
            waitMessage &&
            waitMessage.messageID
        ) {
            await api.unsendMessage(
                waitMessage.messageID
            ).catch(() => {});
        }

        /**
         * 5 — إرسال الصورة المعدلة
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

                attachment: resultBuffer
            },
            threadID,
            event.messageID
        );

    } catch (error) {

        /**
         * حذف رسالة الانتظار
         */
        if (
            waitMessage &&
            waitMessage.messageID
        ) {
            await api.unsendMessage(
                waitMessage.messageID
            ).catch(() => {});
        }

        let errorMessage =
            error &&
            error.message
                ? error.message
                : "خطأ غير معروف";

        if (
            errorMessage.length > 2000
        ) {
            errorMessage =
                errorMessage.slice(0, 2000) +
                "\n...";
        }

        return api.sendMessage(
            HINA_HEADER +
            "❌ فشل تعديل الصورة\n\n" +
            "الخطأ:\n" +
            errorMessage +
            "\n\n" +
            "إذا ظهر API Error 500 فالمشكلة من خدمة التعديل نفسها أو من الرابط الذي استقبلته.",
            threadID,
            event.messageID
        );
    }
};