module.exports.config = {
  name: "فحصجنس",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "فحص بيانات المستخدم من Users و API",
  commandCategory: "Utility",
  usages: "فحصجنس [منشن] أو بالرد",
  cooldowns: 3
};

module.exports.run = async function({ api, event, Users }) {
  const {
    threadID,
    messageID,
    senderID,
    messageReply,
    mentions
  } = event;

  try {
    let targetID;

    // ══════════════════════════════════════════
    // تحديد الشخص
    // ══════════════════════════════════════════
    if (messageReply) {
      targetID = messageReply.senderID;
    } else if (mentions && Object.keys(mentions).length > 0) {
      targetID = Object.keys(mentions)[0];
    } else {
      targetID = senderID;
    }

    // ══════════════════════════════════════════
    // Users.getData
    // ══════════════════════════════════════════
    let usersData = null;

    try {
      usersData = await Users.getData(targetID);
    } catch (error) {
      console.error("Users.getData error:", error);
    }

    // ══════════════════════════════════════════
    // api.getUserInfo
    // ══════════════════════════════════════════
    let apiData = null;

    try {
      apiData = await api.getUserInfo(targetID);
    } catch (error) {
      console.error("api.getUserInfo error:", error);
    }

    const userInfo = apiData?.[targetID] || apiData || {};

    // ══════════════════════════════════════════
    // عرض كل شيء في الكونسول
    // ══════════════════════════════════════════
    console.log("\n════════════════════════════════════");
    console.log("HINA USER GENDER CHECK");
    console.log("ID:", targetID);

    console.log("\n--- Users.getData ---");
    console.dir(usersData, { depth: null });

    console.log("\n--- api.getUserInfo ---");
    console.dir(apiData, { depth: null });

    console.log("\n--- API USER INFO KEYS ---");
    console.log(Object.keys(userInfo));

    console.log("════════════════════════════════════\n");

    // ══════════════════════════════════════════
    // البحث عن الحقول المتعلقة بالجنس
    // ══════════════════════════════════════════
    const possibleGenderFields = [
      "gender",
      "sex",
      "genderType",
      "gender_type",
      "genderTypeEnum"
    ];

    const foundGender = {};

    for (const key of possibleGenderFields) {
      if (userInfo[key] !== undefined) {
        foundGender[key] = userInfo[key];
      }
    }

    // ══════════════════════════════════════════
    // النتيجة
    // ══════════════════════════════════════════
    let message =
      `⌬ ━━ HINA USER CHECK ━━ ⌬\n\n` +
      `🆔 ID: ${targetID}\n` +
      `👤 الاسم: ${userInfo.name || userInfo.fullName || "غير موجود"}\n\n` +
      `━━ api.getUserInfo ━━\n\n` +
      `📋 الحقول:\n` +
      `${Object.keys(userInfo).join(", ") || "لا توجد"}\n\n`;

    if (Object.keys(foundGender).length > 0) {
      message +=
        `⚧ بيانات الجنس الموجودة:\n` +
        `${JSON.stringify(foundGender, null, 2)}`;
    } else {
      message +=
        `⚧ لم يتم العثور على حقل gender أو sex مباشرة.`;
    }

    return api.sendMessage(
      message,
      threadID,
      messageID
    );

  } catch (error) {
    console.error("❌ فحصجنس:", error);

    return api.sendMessage(
      `⌬ ━━ HINA USER CHECK ━━ ⌬\n\n` +
      `❌ حدث خطأ:\n${error.message || error}`,
      threadID,
      messageID
    );
  }
};