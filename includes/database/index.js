const Sequelize = require("sequelize");

const DATABASE_URL =
process.env.DATABASE_URL ||
global.config?.DATABASE_URL;

if (!DATABASE_URL) {
throw new Error(
"DATABASE_URL غير موجود. ضع رابط PostgreSQL في متغير البيئة."
);
}

module.exports.sequelize = new Sequelize(DATABASE_URL, {
dialect: "postgres",
logging: false,

pool: {
    max: 20,
    min: 0,
    acquire: 60000,
    idle: 20000
},

retry: {
    match: [
        /SQLITE_BUSY/,
        /ECONNRESET/,
        /ETIMEDOUT/,
        /EAI_AGAIN/
    ],
    name: "query",
    max: 10
},

define: {
    underscored: false,
    freezeTableName: true,
    timestamps: true
}

});

module.exports.Sequelize = Sequelize;