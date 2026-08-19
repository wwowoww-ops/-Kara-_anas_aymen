const path = require("path");

module.exports = function ({ models, api }) {

    const mongodb = require(
        path.join(
            process.cwd(),
            "includes",
            "mongodb.js"
        )
    );


    // ============================================================
    // جلب معلومات المجموعة
    // يدعم FCA التي تستخدم Callback
    // ============================================================

    async function getInfo(threadID) {

        threadID = String(threadID);

        return new Promise((resolve) => {

            try {

                if (
                    !api ||
                    typeof api.getThreadInfo !== "function"
                ) {

                    console.error(
                        "❌ [Threads] api.getThreadInfo غير موجود"
                    );

                    resolve(null);
                    return;

                }


                api.getThreadInfo(
                    threadID,
                    (error, info) => {

                        if (error) {

                            console.error(
                                `❌ [Threads] فشل جلب المجموعة ${threadID}:`,
                                error.message || error
                            );

                            resolve(null);
                            return;

                        }


                        if (
                            !info ||
                            typeof info !== "object"
                        ) {

                            console.error(
                                `❌ [Threads] معلومات المجموعة فارغة: ${threadID}`
                            );

                            resolve(null);
                            return;

                        }


                        resolve(info);

                    }
                );

            } catch (error) {

                console.error(
                    `❌ [Threads] خطأ في getInfo (${threadID}):`,
                    error
                );

                resolve(null);

            }

        });

    }


    // ============================================================
    // جلب جميع المجموعات من MongoDB
    // ============================================================

    async function getAll() {

        try {

            if (
                !mongodb ||
                typeof mongodb.getAllThreads !== "function"
            ) {

                return [];

            }

            const threads =
                await mongodb.getAllThreads();

            return Array.isArray(threads)
                ? threads
                : [];

        } catch (error) {

            console.error(
                "❌ [Threads] خطأ في getAll:",
                error
            );

            return [];

        }

    }


    // ============================================================
    // جلب بيانات المجموعة من MongoDB
    // ============================================================

    async function getData(threadID) {

        threadID = String(threadID);

        try {

            if (
                !mongodb ||
                typeof mongodb.getThreadData !== "function"
            ) {

                return {
                    threadID,
                    threadName: "KIRA Group",
                    settings: {}
                };

            }


            const data =
                await mongodb.getThreadData(
                    threadID
                );


            if (!data) {

                return {
                    threadID,
                    threadName: "KIRA Group",
                    settings: {}
                };

            }


            return data;

        } catch (error) {

            console.error(
                `❌ [Threads] خطأ في getData (${threadID}):`,
                error
            );

            return false;

        }

    }


    // ============================================================
    // تحديث بيانات المجموعة
    // ============================================================

    async function setData(
        threadID,
        options = {}
    ) {

        threadID = String(threadID);

        try {

            if (
                !mongodb ||
                typeof mongodb.updateThreadData !== "function"
            ) {

                console.error(
                    "❌ [Threads] mongodb.updateThreadData غير موجود"
                );

                return false;

            }


            if (
                !options ||
                typeof options !== "object"
            ) {

                options = {};

            }


            await mongodb.updateThreadData(
                threadID,
                options
            );


            return true;

        } catch (error) {

            console.error(
                `❌ [Threads] فشل تحديث بيانات المجموعة ${threadID}:`,
                error
            );

            return false;

        }

    }


    // ============================================================
    // إنشاء بيانات مجموعة
    // ============================================================

    async function createData(
        threadID,
        defaults = {}
    ) {

        threadID = String(threadID);

        try {

            if (
                !mongodb ||
                typeof mongodb.createThread !== "function"
            ) {

                console.error(
                    "❌ [Threads] mongodb.createThread غير موجود"
                );

                return false;

            }


            if (
                !defaults ||
                typeof defaults !== "object"
            ) {

                defaults = {};

            }


            await mongodb.createThread(
                threadID,
                defaults
            );


            return true;

        } catch (error) {

            console.error(
                `❌ [Threads] فشل إنشاء المجموعة ${threadID}:`,
                error
            );

            return false;

        }

    }


    // ============================================================
    // حذف بيانات المجموعة
    // ============================================================

    async function delData(threadID) {

        threadID = String(threadID);

        try {

            if (
                !mongodb ||
                typeof mongodb.deleteThread !== "function"
            ) {

                console.error(
                    "❌ [Threads] mongodb.deleteThread غير موجود"
                );

                return false;

            }


            await mongodb.deleteThread(
                threadID
            );


            return true;

        } catch (error) {

            console.error(
                `❌ [Threads] فشل حذف المجموعة ${threadID}:`,
                error
            );

            return false;

        }

    }


    // ============================================================
    // إرجاع الدوال
    // ============================================================

    return {

        getInfo,

        getAll,

        getData,

        setData,

        delData,

        createData

    };

};