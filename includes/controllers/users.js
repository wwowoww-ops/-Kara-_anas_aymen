const path = require("path");

module.exports = function ({ models, api }) {
    // استدعاء محرك المونغو لربط المستخدمين
    const mongodb = require(path.join(process.cwd(), "includes", "mongodb.js"));

    async function getInfo(id) {
        try {
            return (await api.getUserInfo(id))[id];
        }
        catch (e) {
            return false;
        }
    }

    async function getNameUser(id) {
        try {
            // محاولة جلب الاسم من ذاكرة البوت أولاً للسرعة
            if (global.data.userName.has(id)) return global.data.userName.get(id);
            
            // إذا لم يوجد، نجلب البيانات من المونغو
            const userData = await mongodb.getUserData(id);
            if (userData && userData.user.name) {
                return userData.user.name;
            } else {
                // محاولة أخيرة من فيسبوك
                const info = await api.getUserInfo(id);
                return info[id].name || "مستخدم فيسبوك";
            }
        }
        catch (error) { 
            return "مستخدم فيسبوك"; 
        }
    }

    async function getData(userID) {
        try {
            // جلب كامل بيانات العضو من البنك السحابي
            let data = await mongodb.getUserData(userID);
            if (data) {
                // تنسيق البيانات لتناسب السورس
                return {
                    userID: data.senderID,
                    name: data.user.name,
                    exp: data.currency.exp,
                    money: data.currency.money,
                    data: data.user
                };
            }
            return false;
        }
        catch (error) {
            console.error("❌ [Users] خطأ في جلب البيانات:", error);
            return false;
        }
    }

    async function setData(userID, options = {}) {
        try {
            // تحديث بيانات المستخدم (مثل الاسم أو الرتبة) في المونغو
            await mongodb.updateUserData(userID, options);
            return true;
        }
        catch (error) {
            console.error("❌ [Users] فشل في تحديث بيانات العضو");
            return false;
        }
    }

    async function createData(userID, defaults = {}) {
        try {
            // ✅ التعديل هنا: استخدام ensureUser بدلاً من createUser
            await mongodb.ensureUser(userID);
            return true;
        }
        catch (error) {
            console.error(error);
            return false;
        }
    }

    async function getAll() {
        try {
            // جلب قائمة بجميع المستخدمين المسجلين في KiraDB
            return await mongodb.getAllUsers();
        }
        catch (error) {
            return [];
        }
    }

    return {
        getInfo,
        getNameUser,
        getAll,
        getData,
        setData,
        createData,
        // بقيت دالة getUserFull كما هي لجلب البيانات العميقة من فيسبوك عند الحاجة
        getUserFull: async function(id) {
            // الكود الخاص بـ Graph API
        }
    };
};