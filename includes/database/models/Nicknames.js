module.exports = function ({ sequelize, Sequelize }) {

const Nicknames = sequelize.define("Nicknames", {

    // ==================================================
    // ID
    // ==================================================

    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    // ==================================================
    // المجموعة
    // ==================================================

    threadID: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: "nickname_member"
    },

    // ==================================================
    // العضو
    // ==================================================

    userID: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: "nickname_member"
    },

    // ==================================================
    // اسم العضو من قاعدة Users
    // ==================================================

    userName: {
        type: Sequelize.STRING,
        allowNull: false
    },

    // ==================================================
    // الكنية
    // ==================================================

    nickname: {
        type: Sequelize.STRING,
        allowNull: false
    },

    // ==================================================
    // آخر تحديث
    // ==================================================

    updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
    }

});

return Nicknames;

};