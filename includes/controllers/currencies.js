module.exports = function ({ models }) {
    const Currencies = models.use("Currencies");

    async function getAll() {
        try {
            return await Currencies.findAll();
        } catch (error) {
            console.error("❌ [Currencies] getAll:", error);
            return [];
        }
    }

    async function getData(userID) {
        try {
            return await Currencies.findOne({
                where: { userID: String(userID) }
            });
        } catch (error) {
            console.error("❌ [Currencies] getData:", error);
            return false;
        }
    }

    async function createData(userID, defaults = {}) {
        try {
            let currency = await Currencies.findOne({
                where: { userID: String(userID) }
            });

            if (currency) return currency;

            return await Currencies.create({
                userID: String(userID),
                money: defaults.money ?? 0,
                exp: defaults.exp ?? 0,
                data: defaults.data ?? {}
            });
        } catch (error) {
            console.error("❌ [Currencies] createData:", error);
            return false;
        }
    }

    async function increaseMoney(userID, money) {
        try {
            let currency = await getData(userID);

            if (!currency) {
                currency = await createData(userID);
            }

            currency.money =
                Number(currency.money || 0) + Number(money || 0);

            await currency.save();

            return currency.money;
        } catch (error) {
            console.error("❌ [Currencies] increaseMoney:", error);
            return false;
        }
    }

    async function decreaseMoney(userID, money) {
        try {
            let currency = await getData(userID);

            if (!currency) {
                currency = await createData(userID);
            }

            const currentMoney = Number(currency.money || 0);
            const amount = Number(money || 0);

            if (currentMoney < amount) {
                return false;
            }

            currency.money = currentMoney - amount;

            await currency.save();

            return currency.money;
        } catch (error) {
            console.error("❌ [Currencies] decreaseMoney:", error);
            return false;
        }
    }

    async function setData(userID, options = {}) {
        try {
            let currency = await getData(userID);

            if (!currency) {
                currency = await createData(userID, options);
            }

            const allowed = ["money", "exp", "data"];

            for (const key of allowed) {
                if (Object.prototype.hasOwnProperty.call(options, key)) {
                    currency[key] = options[key];
                }
            }

            await currency.save();

            return currency;
        } catch (error) {
            console.error("❌ [Currencies] setData:", error);
            return false;
        }
    }

    return {
        getAll,
        getData,
        createData,
        setData,
        increaseMoney,
        decreaseMoney
    };
};