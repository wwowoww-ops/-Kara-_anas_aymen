module.exports = function ({ models }) {

    const Threads =
        models &&
        models.model &&
        models.model.Threads;

    const DEFAULT_PROTECTION = {
        enabled: {
            groupName: false,
            nicknames: false,
            theme: false,
            image: false,
            emoji: false,
            description: false
        },

        saved: {
            name: null,
            theme: null,
            emoji: null,
            description: null,
            nicknames: {},
            image: null
        }
    };


    function createDefault() {
        return JSON.parse(
            JSON.stringify(DEFAULT_PROTECTION)
        );
    }


    function mergeProtection(data) {

        const result =
            createDefault();

        if (
            data &&
            typeof data === "object"
        ) {

            if (
                data.enabled &&
                typeof data.enabled === "object"
            ) {

                Object.assign(
                    result.enabled,
                    data.enabled
                );

            }

            if (
                data.saved &&
                typeof data.saved === "object"
            ) {

                Object.assign(
                    result.saved,
                    data.saved
                );

            }

        }

        return result;
    }


    async function getProtection(threadID) {

        threadID =
            String(threadID);

        try {

            if (!Threads) {

                console.error(
                    "❌ [Protection] موديل Threads غير موجود"
                );

                return createDefault();

            }

            const row =
                await Threads.findOne({
                    where: {
                        threadID
                    }
                });

            if (!row) {

                return createDefault();

            }

            const data =
                row.data &&
                typeof row.data === "object"
                    ? row.data
                    : {};

            return mergeProtection(
                data.protection
            );

        } catch (error) {

            console.error(
                `❌ [Protection] فشل جلب الحماية ${threadID}:`,
                error
            );

            return createDefault();

        }

    }


    async function saveProtection(
        threadID,
        protection
    ) {

        threadID =
            String(threadID);

        try {

            if (!Threads) {

                console.error(
                    "❌ [Protection] موديل Threads غير موجود"
                );

                return false;

            }

            const cleanProtection =
                mergeProtection(
                    protection
                );

            let row =
                await Threads.findOne({
                    where: {
                        threadID
                    }
                });

            if (!row) {

                await Threads.create({
                    threadID,
                    threadInfo: {},
                    data: {
                        protection:
                            cleanProtection
                    }
                });

                return true;

            }

            const currentData =
                row.data &&
                typeof row.data === "object"
                    ? row.data
                    : {};

            const newData = {
                ...currentData,
                protection:
                    cleanProtection
            };

            await row.update({
                data: newData
            });

            return true;

        } catch (error) {

            console.error(
                `❌ [Protection] فشل حفظ الحماية ${threadID}:`,
                error
            );

            return false;

        }

    }


    async function toggle(
        threadID,
        protectionName
    ) {

        const protection =
            await getProtection(
                threadID
            );

        if (
            !Object.prototype.hasOwnProperty.call(
                protection.enabled,
                protectionName
            )
        ) {

            return null;

        }

        protection.enabled[
            protectionName
        ] =
            !protection.enabled[
                protectionName
            ];

        return protection;

    }


    async function enableAll(
        threadID
    ) {

        const protection =
            await getProtection(
                threadID
            );

        for (
            const key of
            Object.keys(
                protection.enabled
            )
        ) {

            protection.enabled[key] =
                true;

        }

        return protection;

    }


    async function disableAll(
        threadID
    ) {

        const protection =
            await getProtection(
                threadID
            );

        for (
            const key of
            Object.keys(
                protection.enabled
            )
        ) {

            protection.enabled[key] =
                false;

        }

        return protection;

    }


    async function saveValue(
        threadID,
        type,
        value
    ) {

        const protection =
            await getProtection(
                threadID
            );

        if (
            !Object.prototype.hasOwnProperty.call(
                protection.saved,
                type
            )
        ) {

            return false;

        }

        protection.saved[type] =
            value;

        return saveProtection(
            threadID,
            protection
        );

    }


    return {
        getProtection,
        saveProtection,
        toggle,
        enableAll,
        disableAll,
        saveValue
    };

};