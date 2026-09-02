module.exports = function ({ sequelize, Sequelize }) {

  const Pets = sequelize.define("Pets", {

    // ==================================================
    // ID
    // ==================================================

    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },

    // ==================================================
    // صاحب الحيوان
    // ==================================================

    userID: {
      type: Sequelize.BIGINT,
      unique: true,
      allowNull: false
    },

    // ==================================================
    // نوع الحيوان
    // ==================================================

    type: {
      type: Sequelize.STRING,
      allowNull: false
    },

    // ==================================================
    // اسم الحيوان
    // ==================================================

    name: {
      type: Sequelize.STRING,
      allowNull: false
    },

    // ==================================================
    // الندرة
    // ==================================================

    rarity: {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: "شائع"
    },

    // ==================================================
    // القوة
    // ==================================================

    power: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 5
    },

    // ==================================================
    // المستوى
    // من 0 إلى 60
    // ==================================================

    level: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,

      validate: {
        min: 0,
        max: 60
      }
    },

    // ==================================================
    // النجوم
    // من 0★ إلى 5★
    // ==================================================

    stars: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,

      validate: {
        min: 0,
        max: 5
      }
    },

    // ==================================================
    // الخبرة
    // يتم تصفيرها عند الترقية إلى نجمة جديدة
    // ==================================================

    exp: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    },

    // ==================================================
    // الصحة
    // ==================================================

    health: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 100
    },

    // ==================================================
    // الشبع
    // ==================================================

    hunger: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 100
    },

    // ==================================================
    // الحالة
    // ==================================================

    status: {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: "سعيد"
    },

    // ==================================================
    // آخر تدريب
    // ==================================================

    lastTrain: {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null
    },

    // ==================================================
    // تاريخ إنشاء الحيوان
    // ==================================================

    createdAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW
    }

  });

  return Pets;
};