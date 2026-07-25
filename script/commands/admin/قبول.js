module.exports.config = {
  name: "قبول",
  version: "8.0.0",
  hasPermssion: 1,
  credits: "أبو هريرة",
  description: "إدارة طلبات انضمام الأعضاء للمجموعة",
  commandCategory: "admin",
  usages: "قبول [قائمة/رقم/الكل/رفض]",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  try {
    const threadInfo = await api.getThreadInfo(threadID);
    const isAdmin = threadInfo.adminIDs.some(admin => admin.id === senderID);
    if (!isAdmin) {
      return api.sendMessage(
        `⌬ ━━ HINA ADMIN ━━ ⌬\n\n⛔ هذا الأمر للأدمن فقط!`,
        threadID,
        messageID
      );
    }

    const isBotAdmin = threadInfo.adminIDs.some(admin => admin.id === api.getCurrentUserID());
    if (!isBotAdmin) {
      return api.sendMessage(
        `⌬ ━━ HINA ADMIN ━━ ⌬\n\n⚠️ يجب أن أكون أدمن في المجموعة.`,
        threadID,
        messageID
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🔍 جلب الطلبات من approvalQueue
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    let pendingRequests = threadInfo.approvalQueue || [];

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📋 عرض القائمة مع الأسماء
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (!args[0] || args[0] === "قائمة" || args[0] === "list") {
      if (pendingRequests.length === 0) {
        return api.sendMessage(
          `⌬ ━━ HINA ADMIN ━━ ⌬\n\n📭 لا توجد طلبات انضمام معلقة.`,
          threadID,
          messageID
        );
      }

      let msg = `⌬ ━━ HINA ADMIN ━━ ⌬\n\n📋 قائمة طلبات الانضمام (${pendingRequests.length}):\n\n`;
      
      for (let i = 0; i < Math.min(pendingRequests.length, 20); i++) {
        const req = pendingRequests[i];
        
        // محاولة جلب الاسم من مصادر مختلفة
        let name = "مستخدم";
        let id = "غير معروف";
        
        // المصدر 1: requesterName
        if (req.requesterName) {
          name = req.requesterName;
        }
        // المصدر 2: name
        else if (req.name) {
          name = req.name;
        }
        // المصدر 3: userInfo
        else if (req.userInfo && req.userInfo.name) {
          name = req.userInfo.name;
        }
        // المصدر 4: جلب من API
        else if (req.requesterID) {
          try {
            const userInfo = await api.getUserInfo(req.requesterID);
            if (userInfo && userInfo[req.requesterID]) {
              name = userInfo[req.requesterID].name || "مستخدم";
            }
          } catch (e) {
            console.log("⚠️ فشل جلب اسم المستخدم:", e.message);
          }
        }
        
        // جلب المعرف
        if (req.requesterID) {
          id = req.requesterID;
        } else if (req.id) {
          id = req.id;
        } else if (req.userID) {
          id = req.userID;
        }
        
        msg += `${i+1}. ${name}\n`;
        msg += `   🆔 ${id}\n\n`;
      }

      if (pendingRequests.length > 20) {
        msg += `... و ${pendingRequests.length - 20} طلب آخر\n`;
      }

      msg += `\n📝 الأوامر:\n• قبول [رقم] (لقبول طلب معين)\n• قبول الكل (لقبول جميع الطلبات)\n• قبول رفض (لرفض جميع الطلبات)`;

      return api.sendMessage(msg, threadID, messageID);
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ✅ قبول طلب معين
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (!isNaN(args[0])) {
      const index = parseInt(args[0]) - 1;

      if (pendingRequests.length === 0) {
        return api.sendMessage(
          `⌬ ━━ HINA ADMIN ━━ ⌬\n\n📭 لا توجد طلبات.`,
          threadID,
          messageID
        );
      }

      if (index < 0 || index >= pendingRequests.length) {
        return api.sendMessage(
          `⌬ ━━ HINA ADMIN ━━ ⌬\n\n⚠️ رقم غير صحيح!`,
          threadID,
          messageID
        );
      }

      const target = pendingRequests[index];
      const userID = target.requesterID || target.id || target.userID;

      if (!userID) {
        return api.sendMessage(
          `⌬ ━━ HINA ADMIN ━━ ⌬\n\n❌ لا يمكن تحديد المستخدم.`,
          threadID,
          messageID
        );
      }

      // جلب اسم المستخدم
      let userName = "المستخدم";
      try {
        const userInfo = await api.getUserInfo(userID);
        if (userInfo && userInfo[userID]) {
          userName = userInfo[userID].name || "المستخدم";
        }
      } catch (e) {
        userName = target.requesterName || target.name || "المستخدم";
      }

      try {
        await new Promise((resolve, reject) => {
          api.addUserToGroup(userID, threadID, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
        
        pendingRequests.splice(index, 1);
        
        return api.sendMessage(
          `⌬ ━━ HINA ADMIN ━━ ⌬\n\n✅ تم قبول ${userName} بنجاح!`,
          threadID,
          messageID
        );
      } catch (error) {
        console.error("❌ خطأ في القبول:", error);
        
        let errorMsg = error.message || "خطأ غير معروف";
        if (errorMsg.includes("permission")) {
          errorMsg = "البوت ليس لديه صلاحية. تأكد من أن البوت أدمن.";
        } else if (errorMsg.includes("blocked")) {
          errorMsg = "المستخدم محظور أو قام بحظر البوت.";
        }
        
        return api.sendMessage(
          `⌬ ━━ HINA ADMIN ━━ ⌬\n\n❌ فشل قبول ${userName}:\n${errorMsg}`,
          threadID,
          messageID
        );
      }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ✅ قبول الكل
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (args[0] === "الكل" || args[0] === "all") {
      if (pendingRequests.length === 0) {
        return api.sendMessage(
          `⌬ ━━ HINA ADMIN ━━ ⌬\n\n📭 لا توجد طلبات.`,
          threadID,
          messageID
        );
      }

      let accepted = 0;
      let failed = 0;

      for (const req of pendingRequests) {
        const userID = req.requesterID || req.id || req.userID;
        if (!userID) {
          failed++;
          continue;
        }

        try {
          await new Promise((resolve, reject) => {
            api.addUserToGroup(userID, threadID, (err) => {
              if (err) reject(err);
              else resolve();
            });
          });
          accepted++;
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (e) {
          failed++;
          console.log(`❌ فشل قبول ${userID}:`, e.message);
        }
      }

      pendingRequests.length = 0;

      return api.sendMessage(
        `⌬ ━━ HINA ADMIN ━━ ⌬\n\n✅ تم قبول ${accepted} طلب.\n❌ فشل: ${failed}`,
        threadID,
        messageID
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ❌ رفض الكل
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (args[0] === "رفض" || args[0] === "reject") {
      const count = pendingRequests.length;
      pendingRequests.length = 0;
      return api.sendMessage(
        `⌬ ━━ HINA ADMIN ━━ ⌬\n\n❌ تم رفض ${count} طلب.`,
        threadID,
        messageID
      );
    }

    return api.sendMessage(
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n📝 الاستخدام:\n• قبول (لعرض القائمة)\n• قبول [رقم] (لقبول طلب معين)\n• قبول الكل (لقبول جميع الطلبات)\n• قبول رفض (لرفض جميع الطلبات)`,
      threadID,
      messageID
    );

  } catch (error) {
    console.error("❌ خطأ في قبول:", error);
    return api.sendMessage(
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n❌ حدث خطأ: ${error.message}`,
      threadID,
      messageID
    );
  }
};