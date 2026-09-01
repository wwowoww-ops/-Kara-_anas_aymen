module.exports = function({ sequelize, Sequelize }) {
    const PetCurrency = sequelize.define("PetCurrency", {

        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },

        userID: {
            type: Sequelize.BIGINT,
            unique: true,
            allowNull: false
        },

        money: {
            type: Sequelize.BIGINT,
            defaultValue: 0
        },

        data: {
            type: Sequelize.JSON
        }

    });

    return PetCurrency;
};