module.exports = function ({
    sequelize,
    Sequelize
}) {

    const Nicknames =
        sequelize.define(
            "Nicknames",
            {

                id: {
                    type: Sequelize.INTEGER,
                    primaryKey: true,
                    autoIncrement: true
                },

                threadID: {
                    type: Sequelize.STRING,
                    allowNull: false,
                    unique: "nickname_member"
                },

                userID: {
                    type: Sequelize.STRING,
                    allowNull: false,
                    unique: "nickname_member"
                },

                userName: {
                    type: Sequelize.STRING,
                    allowNull: false
                },

                nickname: {
                    type: Sequelize.STRING,
                    allowNull: false
                },

                updatedAt: {
                    type: Sequelize.DATE,
                    allowNull: false,
                    defaultValue: Sequelize.NOW
                }

            }
        );

    return Nicknames;
};