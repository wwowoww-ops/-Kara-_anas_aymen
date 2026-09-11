module.exports.config = {
  name: "فحصجنس",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "فحص بيانات المستخدم لمعرفة وجود معلومات الجنس",
  commandCategory: "Utility",
  usages: "فحصجنس [منشن] أو بالرد",
  cooldowns: 3
};

module.exports.run = async function({ api, event, Users }) {
  const { threadID, messageID, senderID, messageReply, mentions } = event;

  try {
    let targetID;

    // الرد
    if (messageReply) {
      targetID = messageReply.senderID;
    }

    // المنشن
    else if (mentions && Object.keys(mentions).length > 0) {
      targetID = Object.keys(mentions)[0];
    }

    // بدون تحديد شخص
    else {
      targetID = senderID;
    }

    const data = await Users.getData(targetID);

    console.log("════════════════════════════════");
    console.log("فحص المستخدم:", targetID);
    console.log(data);
    console.log("════════════════════════════════");

    // استخراج أهم الحقول المحتملة
    const result = {
      id: targetID,
      name: data?.name,
      gender: data?.gender,
      sex: data?.sex,
      genderType: data?.genderType,
      firstName: data?.firstName,
      lastName: data?.lastName,
      dataKeys: data ? Object.keys(data) : []
    };

    return api.sendMessage(
      `⌬ ━━ HINA USER CHECK ━━ ⌬\n\n` +
      `🆔 ID: ${targetID}\n` +
      `👤 الاسم: ${result.name || "غير موجود"}\n` +
      `⚧ gender: ${result.gender ?? "غير موجود"}\n` +
      `⚧ sex: ${result.sex ?? "غير موجود"}\n` +
      `⚧ genderType: ${result.genderType ?? "غير موجود"}\n\n` +
      `📋 الحقول الموجودة:\n` +
      `${result.dataKeys.join(", ") || "لا توجد بيانات"}\n\n` +
      `تم فحص Users.getData`,
      threadID,
      messageID
    );

  } catch (error) {
    console.error("❌ خطأ في فحص الجنس:", error);

    return api.sendMessage(
      `⌬ ━━ HINA USER CHECK ━━ ⌬\n\n` +
      `❌ حدث خطأ:\n${error.message || error}`,
      threadID,
      messageID
    );
  }
};