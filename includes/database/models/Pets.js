module.exports = function({ sequelize, Sequelize }) {
  const Pets = sequelize.define("Pets", {
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

    type: {
      type: Sequelize.STRING,
      allowNull: false
    },

    name: {
      type: Sequelize.STRING,
      allowNull: false
    },

    level: {
      type: Sequelize.INTEGER,
      defaultValue: 1
    },

    health: {
      type: Sequelize.INTEGER,
      defaultValue: 100
    },

    hunger: {
      type: Sequelize.INTEGER,
      defaultValue: 100
    },

    createdAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW
    }
  });

  return Pets;
};