module.exports = function ({ models, api }) {
    const Users = models.use("Users");

    async function getInfo(id) {
        try {
            const info = await api.getUserInfo(id);
            return info[id] || false;
        } catch (error) {
            return false;
        }
    }

    async function getNameUser(id) {
        try {
            if (global.data.userName.has(id)) {
                return global.data.userName.get(id);
            }

            const user = await Users.findOne({
                where: { userID: String(id) }
            });

            if (user && user.name) {
                return user.name;
            }

            const info = await getInfo(id);

            if (info && info.name) {
                return info.name;
            }

            return "مستخدم فيسبوك";
        } catch (error) {
            return "مستخدم فيسبوك";
        }
    }

    async function getData(userID) {
        try {
            return await Users.findOne({
                where: { userID: String(userID) }
            });
        } catch (error) {
            console.error("❌ [Users] getData:", error);
            return false;
        }
    }

    async function setData(userID, options = {}) {
        try {
            let user = await getData(userID);

            if (!user) {
                user = await createData(userID, options);
            }

            if (!user) return false;

            const allowed = [
                "name",
                "gender",
                "data"
            ];

            for (const key of allowed) {
                if (Object.prototype.hasOwnProperty.call(options, key)) {
                    user[key] = options[key];
                }
            }

            await user.save();

            if (user.name) {
                global.data.userName.set(
                    String(userID),
                    user.name
                );
            }

            return user;
        } catch (error) {
            console.error("❌ [Users] setData:", error);
            return false;
        }
    }

    async function createData(userID, defaults = {}) {
        try {
            let user = await getData(userID);

            if (user) return user;

            let name = defaults.name || null;

            if (!name) {
                const info = await getInfo(userID);
                if (info) name = info.name || null;
            }

            user = await Users.create({
                userID: String(userID),
                name,
                gender: defaults.gender || null,
                data: defaults.data || {}
            });

            if (user.name) {
                global.data.userName.set(
                    String(userID),
                    user.name
                );
            }

            return user;
        } catch (error) {
            console.error("❌ [Users] createData:", error);
            return false;
        }
    }

    async function getAll() {
        try {
            return await Users.findAll();
        } catch (error) {
            console.error("❌ [Users] getAll:", error);
            return [];
        }
    }

    async function getUserFull(id) {
        try {
            return await getInfo(id);
        } catch (error) {
            return false;
        }
    }

    return {
        getInfo,
        getNameUser,
        getAll,
        getData,
        setData,
        createData,
        getUserFull
    };
};