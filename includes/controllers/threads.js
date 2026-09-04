module.exports = function ({ models, api }) {

    // ============================================================
    // موديل Threads من Sequelize / Neon
    // ============================================================

    const Threads =
        models &&
        models.model &&
        models.model.Threads;


    // ============================================================
    // جلب معلومات المجموعة من Facebook
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
    // جلب جميع المجموعات من Neon
    // ============================================================

    async function getAll() {

        try {

            if (!Threads) {

                console.error(
                    "❌ [Threads] موديل Threads غير موجود"
                );

                return [];

            }

            const rows =
                await Threads.findAll();

            return rows.map(
                row => row.toJSON()
            );

        } catch (error) {

            console.error(
                "❌ [Threads] خطأ في getAll:",
                error
            );

            return [];

        }

    }


    // ============================================================
    // جلب بيانات المجموعة من Neon
    // ============================================================

    async function getData(threadID) {

        threadID = String(threadID);

        try {

            if (!Threads) {

                console.error(
                    "❌ [Threads] موديل Threads غير موجود"
                );

                return false;

            }

            const row =
                await Threads.findOne({
                    where: {
                        threadID
                    }
                });


            if (!row) {

                return {
                    threadID,
                    threadName: "HINA Group",
                    settings: {}
                };

            }


            const data =
                row.data &&
                typeof row.data === "object"
                    ? row.data
                    : {};


            return {
                threadID,
                ...data
            };

        } catch (error) {

            console.error(
                `❌ [Threads] خطأ في getData (${threadID}):`,
                error
            );

            return false;

        }

    }


    // ============================================================
    // تحديث بيانات المجموعة في Neon
    // ============================================================

    async function setData(
        threadID,
        options = {}
    ) {

        threadID = String(threadID);

        try {

            if (!Threads) {

                console.error(
                    "❌ [Threads] موديل Threads غير موجود"
                );

                return false;

            }


            if (
                !options ||
                typeof options !== "object"
            ) {

                options = {};

            }


            let row =
                await Threads.findOne({
                    where: {
                        threadID
                    }
                });


            // ----------------------------------------------------
            // إذا لم تكن المجموعة موجودة ننشئها
            // ----------------------------------------------------

            if (!row) {

                await Threads.create({

                    threadID,

                    threadInfo: {},

                    data: options

                });

                return true;

            }


            // ----------------------------------------------------
            // البيانات الحالية
            // ----------------------------------------------------

            const currentData =
                row.data &&
                typeof row.data === "object"
                    ? row.data
                    : {};


            // ----------------------------------------------------
            // دمج البيانات الجديدة
            // ----------------------------------------------------

            const newData = {

                ...currentData,

                ...options

            };


            await row.update({

                data: newData

            });


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

            if (!Threads) {

                console.error(
                    "❌ [Threads] موديل Threads غير موجود"
                );

                return false;

            }


            if (
                !defaults ||
                typeof defaults !== "object"
            ) {

                defaults = {};

            }


            const exists =
                await Threads.findOne({
                    where: {
                        threadID
                    }
                });


            if (exists) {

                return true;

            }


            await Threads.create({

                threadID,

                threadInfo: {},

                data: defaults

            });


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

            if (!Threads) {

                console.error(
                    "❌ [Threads] موديل Threads غير موجود"
                );

                return false;

            }


            await Threads.destroy({

                where: {
                    threadID
                }

            });


            return true;

        } catch (error) {

            console.error(
                `❌ [Threads] فشل حذف بيانات المجموعة ${threadID}:`,
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

        createData,

        delData

    };

};