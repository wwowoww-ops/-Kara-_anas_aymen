/**
 * عدلي.js
 * تعديل الصور بالذكاء الاصطناعي
 *
 * الاستخدام:
 * رد على صورة واكتب:
 * عدلي خلي شعرها اسود
 */

const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
    name: "عدلي",
    version: "1.0.1",
    hasPermssion: 0,
    credits: "أبو هريرة",
    description: "تعديل الصور بالذكاء الاصطناعي",
    commandCategory: "photos",
    usages: "عدلي <وصف التعديل>",
    cooldowns: 10
};

const HINA_HEADER =
    "⌬ ━━ 𝗛𝗜𝗡𝗔  ━━ ⌬\n\n";

const CACHE_DIR = path.join(
    __dirname,
    "cache",
    "عدلي"
);

fs.ensureDirSync(CACHE_DIR);

function hinaMessage(text) {
    return HINA_HEADER + text;
}

function getReplyImage(event) {
    const reply = event.messageReply;

    if (
        !reply ||
        !Array.isArray(reply.attachments)
    ) {
        return null;
    }

    for (const attachment of reply.attachments) {
        if (!attachment) continue;

        const type = String(
            attachment.type || ""
        ).toLowerCase();

        if (
            (
                type === "photo" ||
                type === "image"
            ) &&
            attachment.url
        ) {
            return attachment.url;
        }
    }

    return null;
}

async function safeEditMessage(
    api,
    messageID,
    text
) {
    if (!messageID) return;

    try {
        const result = api.editMessage(
            text,
            messageID
        );

        if (
            result &&
            typeof result.then === "function"
        ) {
            await result;
        }
    } catch (error) {
        console.log(
            "[عدلي] تعذر تعديل رسالة الانتظار:",
            error.message
        );
    }
}

async function safeUnsendMessage(
    api,
    messageID
) {
    if (!messageID) return;

    try {
        const result = api.unsendMessage(
            messageID
        );

        if (
            result &&
            typeof result.then === "function"
        ) {
            await result;
        }
    } catch (error) {
        console.log(
            "[عدلي] تعذر حذف رسالة الانتظار:",
            error.message
        );
    }
}

// ==================================================
// رفع الصورة إلى Uguu
// ==================================================

async function uploadToUguu(
    buffer,
    ext = "jpg"
) {
    const form = new FormData();

    form.append(
        "files[]",
        buffer,
        `image.${ext}`
    );

    try {
        const response =
            await axios.post(
                "https://uguu.se/upload.php",
                form,
                {
                    timeout: 60000,
                    headers: {
                        ...form.getHeaders()
                    },
                    maxContentLength:
                        Infinity,
                    maxBodyLength:
                        Infinity
                }
            );

        const result =
            response.data;

        if (
            !result ||
            !Array.isArray(result.files) ||
            !result.files.length ||
            !result.files[0].url
        ) {
            throw new Error(
                "لم يتم الحصول على رابط الصورة من Uguu"
            );
        }

        return result.files[0].url;

    } catch (error) {

        if (error.response) {
            throw new Error(
                `Uguu Error ${error.response.status}: ` +
                JSON.stringify(
                    error.response.data
                )
            );
        }

        throw new Error(
            `فشل رفع الصورة: ${error.message}`
        );
    }
}

// ==================================================
// تحميل الصورة
// ==================================================

async function downloadImage(url) {

    const response =
        await axios.get(
            url,
            {
                responseType:
                    "arraybuffer",

                timeout: 60000,

                maxRedirects: 10,

                headers: {
                    "User-Agent":
                        "Mozilla/5.0"
                },

                maxContentLength:
                    Infinity,

                maxBodyLength:
                    Infinity
            }
        );

    const contentType =
        String(
            response.headers[
                "content-type"
            ] || ""
        ).toLowerCase();

    if (
        contentType &&
        !contentType.startsWith("image/")
    ) {
        throw new Error(
            "الرابط لا يحتوي على صورة"
        );
    }

    return Buffer.from(
        response.data
    );
}

// ==================================================
// API تعديل الصورة
// ==================================================

async function editImageWithAPI(
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

        if (
            data?.success &&
            data?.response?.image
        ) {

            return {
                success: true,

                originalImage:
                    data.response.source_image,

                editedImage:
                    data.response.image,

                images:
                    data.response.images,

                serial_no:
                    data.response.serial_no,

                prompt:
                    data.response.prompt
            };
        }

        throw new Error(
            JSON.stringify(
                data ||
                "فشل في تعديل الصورة"
            )
        );

    } catch (error) {

        if (error.response) {
            throw new Error(
                `API Error ${error.response.status}: ` +
                JSON.stringify(
                    error.response.data
                )
            );
        }

        throw new Error(
            `فشل في تعديل الصورة: ${error.message}`
        );
    }
}

// ==================================================
// تحميل الصورة المعدلة وإرسالها
// ==================================================

async function sendEditedImage(
    api,
    event,
    imageUrl,
    prompt,
    serialNo
) {

    const response =
        await axios.get(
            imageUrl,
            {
                responseType:
                    "arraybuffer",

                timeout: 120000,

                maxRedirects: 10,

                headers: {
                    "User-Agent":
                        "Mozilla/5.0"
                },

                maxContentLength:
                    Infinity,

                maxBodyLength:
                    Infinity
            }
        );

    const contentType =
        String(
            response.headers[
                "content-type"
            ] || ""
        ).toLowerCase();

    let ext = "jpg";

    if (
        contentType.includes("png")
    ) {
        ext = "png";
    } else if (
        contentType.includes("webp")
    ) {
        ext = "webp";
    } else if (
        contentType.includes("gif")
    ) {
        ext = "gif";
    }

    const fileName =
        `edited_${Date.now()}.${ext}`;

    const filePath =
        path.join(
            CACHE_DIR,
            fileName
        );

    await fs.writeFile(
        filePath,
        Buffer.from(
            response.data
        )
    );

    try {

        await api.sendMessage(
            {
                body:
                    hinaMessage(
                        "تم تعديل الصورة بنجاح\n\n" +
                        `التعديل: ${prompt}\n` +
                        `رقم المهمة: ${serialNo || "غير متوفر"}`
                    ),

                attachment:
                    fs.createReadStream(
                        filePath
                    )
            },

            event.threadID,

            event.messageID
        );

    } finally {

        setTimeout(() => {
            fs.remove(
                filePath
            ).catch(() => {});
        }, 30000);
    }
}

// ==================================================
// الأمر
// ==================================================

module.exports.run = async function ({
    api,
    event,
    args
}) {

    const prompt =
        Array.isArray(args)
            ? args.join(" ").trim()
            : "";

    if (!prompt) {

        return api.sendMessage(
            hinaMessage(
                "تعديل الصور بالذكاء الاصطناعي\n\n" +
                "طريقة الاستخدام:\n" +
                "رد على صورة واكتب:\n" +
                "عدلي <وصف التعديل>\n\n" +
                "أمثلة:\n" +
                "عدلي خلي شعرها اسود\n" +
                "عدلي حط نظارة شمسية\n" +
                "عدلي غير لون الملابس إلى البنفسجي"
            ),
            event.threadID,
            event.messageID
        );
    }

    const imageUrl =
        getReplyImage(event);

    if (!imageUrl) {

        return api.sendMessage(
            hinaMessage(
                "يجب أن ترد على صورة أولًا.\n\n" +
                "مثال:\n" +
                "رد على الصورة واكتب:\n" +
                "عدلي خلي شعرها اسود"
            ),
            event.threadID,
            event.messageID
        );
    }

    let waitMessage = null;

    try {

        // ------------------------------------------
        // رسالة الانتظار
        // ------------------------------------------

        waitMessage =
            await api.sendMessage(
                hinaMessage(
                    "جاري معالجة الصورة...\n\n" +
                    `التعديل: ${prompt}\n\n` +
                    "يرجى الانتظار..."
                ),
                event.threadID,
                event.messageID
            );

        // ------------------------------------------
        // تحميل الصورة
        // ------------------------------------------

        const imageBuffer =
            await downloadImage(
                imageUrl
            );

        if (
            !imageBuffer ||
            !imageBuffer.length
        ) {
            throw new Error(
                "فشل تحميل الصورة"
            );
        }

        // ------------------------------------------
        // رفع الصورة
        // ------------------------------------------

        await safeEditMessage(
            api,
            waitMessage?.messageID,
            hinaMessage(
                "جاري رفع الصورة إلى الخادم...\n\n" +
                `التعديل: ${prompt}`
            )
        );

        const uploadedUrl =
            await uploadToUguu(
                imageBuffer,
                "jpg"
            );

        if (!uploadedUrl) {
            throw new Error(
                "فشل الحصول على رابط الصورة"
            );
        }

        // ------------------------------------------
        // تعديل الصورة
        // ------------------------------------------

        await safeEditMessage(
            api,
            waitMessage?.messageID,
            hinaMessage(
                "جاري تعديل الصورة بالذكاء الاصطناعي...\n\n" +
                `التعديل: ${prompt}\n\n` +
                "قد تستغرق العملية بعض الوقت."
            )
        );

        const result =
            await editImageWithAPI(
                uploadedUrl,
                prompt
            );

        if (
            !result ||
            !result.editedImage
        ) {
            throw new Error(
                "لم يتم الحصول على الصورة المعدلة"
            );
        }

        // ------------------------------------------
        // حذف رسالة الانتظار
        // ------------------------------------------

        await safeUnsendMessage(
            api,
            waitMessage?.messageID
        );

        // ------------------------------------------
        // إرسال النتيجة
        // ------------------------------------------

        await sendEditedImage(
            api,
            event,
            result.editedImage,
            result.prompt ||
                prompt,
            result.serial_no
        );

    } catch (error) {

        await safeUnsendMessage(
            api,
            waitMessage?.messageID
        );

        let errorMessage =
            error?.message ||
            "خطأ غير معروف";

        if (
            errorMessage.length > 2500
        ) {
            errorMessage =
                errorMessage.slice(
                    0,
                    2500
                ) +
                "\n...";
        }

        console.error(
            "[عدلي] ERROR:",
            error
        );

        return api.sendMessage(
            hinaMessage(
                "فشل تعديل الصورة\n\n" +
                `الخطأ:\n${errorMessage}\n\n` +
                "حاول مرة أخرى بعد قليل."
            ),
            event.threadID,
            event.messageID
        );
    }
};

module.exports.editImageWithAPI =
    editImageWithAPI;

module.exports.uploadToUguu =
    uploadToUguu;