module.exports = function (input) {

    const force = false;

    const Users = require("./models/users")(input);
    const Threads = require("./models/threads")(input);
    const Currencies = require("./models/currencies")(input);
    const Pets = require("./models/Pets")(input);
    const PetCurrency = require("./models/PetCurrency")(input);

    const models = {
        Users,
        Threads,
        Currencies,
        Pets,
        PetCurrency
    };

    /*
     * ============================================================
     * Database initialization
     * ============================================================
     *
     * مهم:
     * لا نسمح لفشل PostgreSQL بإيقاف البوت بالكامل.
     *
     * إذا كانت قاعدة البيانات متاحة:
     *    يتم عمل sync طبيعي.
     *
     * إذا كانت قاعدة البيانات متوقفة أو تجاوزت الحصة:
     *    يظهر الخطأ في اللوج فقط
     *    ويستمر البوت في التشغيل.
     */

    async function syncModel(name, model) {

        if (!model || typeof model.sync !== "function") {
            console.error(
                `❌ [DB] Model غير صالح: ${name}`
            );

            return false;
        }

        try {

            await model.sync({
                force
            });

            console.log(
                `✅ [DB] ${name} جاهز`
            );

            return true;

        } catch (error) {

            console.error(
                `❌ [DB] فشل تهيئة ${name}`
            );

            console.error(
                error?.original?.message ||
                error?.parent?.message ||
                error?.message ||
                error
            );

            return false;
        }
    }


    /*
     * ============================================================
     * Start database initialization
     * ============================================================
     *
     * لا نستخدم await هنا حتى لا نمنع require()
     * وباقي البوت من إكمال التشغيل.
     */

    Promise.resolve()
        .then(async () => {

            console.log(
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            );

            console.log(
                "🗄️ [DB] بدء تهيئة قاعدة البيانات..."
            );

            const results = {};

            results.Users =
                await syncModel(
                    "Users",
                    Users
                );

            results.Threads =
                await syncModel(
                    "Threads",
                    Threads
                );

            results.Currencies =
                await syncModel(
                    "Currencies",
                    Currencies
                );

            results.Pets =
                await syncModel(
                    "Pets",
                    Pets
                );

            results.PetCurrency =
                await syncModel(
                    "PetCurrency",
                    PetCurrency
                );

            const success =
                Object.values(results)
                    .every(Boolean);

            if (success) {

                console.log(
                    "✅ [DB] جميع الجداول جاهزة"
                );

            } else {

                console.warn(
                    "⚠️ [DB] قاعدة البيانات غير متاحة بالكامل"
                );

                console.warn(
                    "⚠️ [DB] سيستمر البوت في العمل"
                );

            }

            console.log(
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            );

        })
        .catch(error => {

            /*
             * حماية إضافية:
             * أي خطأ غير متوقع أثناء تهيئة قاعدة البيانات
             * لن يؤدي إلى إيقاف البوت.
             */

            console.error(
                "❌ [DB] خطأ غير متوقع أثناء التهيئة:"
            );

            console.error(
                error?.message ||
                error
            );

            console.warn(
                "⚠️ [DB] تم تجاوز خطأ قاعدة البيانات"
            );

        });


    /*
     * ============================================================
     * API القديمة للنظام
     * ============================================================
     *
     * نحافظ عليها حتى لا نضطر لتعديل باقي الملفات.
     */

    return {

        model: models,

        use: function (modelName) {

            return this.model[
                `${modelName}`
            ];

        }

    };
};