const path = require("path");

module.exports = function ({
    models,
    api
}) {

    const mongodb =
        require(
            path.join(
                process.cwd(),
                "includes",
                "mongodb.js"
            )
        );

    // ============================================================
    // Facebook Thread Info
    // ============================================================

    async function getInfo(threadID) {

        try {

            if (
                !threadID ||
                !api ||
                typeof api.getThreadInfo !==
                "function"
            ) {

                return null;
            }

            return await api.getThreadInfo(
                String(threadID)
            );

        } catch (error) {

            console.error(
                "THREADS GETINFO ERROR:",
                error.message
            );

            return null;
        }
    }

    // ============================================================
    // All Threads
    // ============================================================

    async function getAll() {

        try {

            const result =
                await mongodb.getAllThreads();

            return Array.isArray(result)
                ? result
                : [];

        } catch (error) {

            console.error(
                "THREADS GETALL ERROR:",
                error
            );

            return [];
        }
    }

    // ============================================================
    // Thread Data
    // ============================================================

    async function getData(threadID) {

        try {

            if (!threadID) {
                return null;
            }

            const data =
                await mongodb.getThreadData(
                    String(threadID)
                );

            return data || null;

        } catch (error) {

            console.error(
                "THREADS GETDATA ERROR:",
                error
            );

            return null;
        }
    }

    // ============================================================
    // Set Data
    // ============================================================

    async function setData(
        threadID,
        options = {}
    ) {

        try {

            if (!threadID) {
                return false;
            }

            await mongodb.updateThreadData(
                String(threadID),
                options
            );

            return true;

        } catch (error) {

            console.error(
                "THREADS SETDATA ERROR:",
                error
            );

            return false;
        }
    }

    // ============================================================
    // Create
    // ============================================================

    async function createData(
        threadID,
        defaults = {}
    ) {

        try {

            if (!threadID) {
                return false;
            }

            await mongodb.createThread(
                String(threadID),
                defaults
            );

            return true;

        } catch (error) {

            console.error(
                "THREADS CREATEDATA ERROR:",
                error
            );

            return false;
        }
    }

    // ============================================================
    // Delete
    // ============================================================

    async function delData(threadID) {

        try {

            if (!threadID) {
                return false;
            }

            await mongodb.deleteThread(
                String(threadID)
            );

            return true;

        } catch (error) {

            console.error(
                "THREADS DELDATA ERROR:",
                error
            );

            return false;
        }
    }

    return {

        getInfo,

        getAll,

        getData,

        setData,

        createData,

        delData

    };
};