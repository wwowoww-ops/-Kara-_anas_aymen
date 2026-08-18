const fs = require("fs-extra");
const path = require("path");

const DATA_FILE = path.join(
  process.cwd(),
  "data",
  "protection.json"
);

function loadData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return {};
    }

    return fs.readJsonSync(DATA_FILE);
  } catch (e) {
    console.error(
      "Protection Load Error:",
      e.message
    );

    return {};
  }
}

function saveData(data) {
  try {
    fs.ensureDirSync(
      path.dirname(DATA_FILE)
    );

    fs.writeJsonSync(
      DATA_FILE,
      data,
      { spaces: 2 }
    );
  } catch (e) {
    console.error(
      "Protection Save Error:",
      e.message
    );
  }
}

async function isAdmin(api, threadID, userID) {
  try {
    const info =
      await api.getThreadInfo(threadID);

    return (
      info &&
      Array.isArray(info.adminIDs) &&
      info.adminIDs.some(
        x =>
          String(x.id) ===
          String(userID)
      )
    );
  } catch (e) {
    return false;
  }
}

module.exports.config = {
  name: "protection",
  eventType: [
    "event"
  ],
  version: "2.0.0",
  credits: "أبو هريرة"
};

module.exports.run = async function({
  api,
  event
}) {
  try {
    if (!event) return;

    if (event.type !== "event") {
      return;
    }

    const threadID =
      event.threadID;

    if (!threadID) return;

    const data = loadData();
    const protection =
      data[String(threadID)];

    if (!protection) return;

    /*
     * لا تعمل الحماية إذا كانت
     * الحماية العامة متوقفة.
     */
    if (!protection.enabled) {
      return;
    }

    const settings =
      protection.settings || {};

    const original =
      protection.original || {};

    const author =
      event.author ||
      event.senderID;

    /*
     * إذا كان صاحب التغيير أدمن
     * لا نتدخل.
     */
    if (
      author &&
      await isAdmin(
        api,
        threadID,
        author
      )
    ) {
      return;
    }

    const type =
      event.logMessageType ||
      event.logMessageData?.type ||
      "";

    console.log(
      `[PROTECTION] ${type}`
    );

    /*
     * ==========================================
     * حماية اسم المجموعة
     * ==========================================
     */

    if (
      settings.groupName &&
      (
        type === "log:thread-name" ||
        type === "change_thread_name"
      )
    ) {
      if (!original.groupName) return;

      try {
        await api.setTitle(
          original.groupName,
          threadID
        );

        console.log(
          `🛡️ تم استرجاع اسم المجموعة: ${threadID}`
        );
      } catch (e) {
        console.error(
          "❌ فشل استرجاع اسم المجموعة:",
          e.message
        );
      }

      return;
    }

    /*
     * ==========================================
     * حماية الإيموجي
     * ==========================================
     */

    if (
      settings.emoji &&
      (
        type === "log:thread-icon" ||
        type === "change_thread_icon"
      )
    ) {
      if (
        original.emoji === null ||
        original.emoji === undefined
      ) {
        return;
      }

      try {
        if (
          typeof api.changeThreadEmoji ===
          "function"
        ) {
          await api.changeThreadEmoji(
            original.emoji,
            threadID
          );

          console.log(
            `🛡️ تم استرجاع إيموجي المجموعة`
          );
        }
      } catch (e) {
        console.error(
          "❌ فشل استرجاع الإيموجي:",
          e.message
        );
      }

      return;
    }

    /*
     * ==========================================
     * حماية الثيم
     * ==========================================
     */

    if (
      settings.theme &&
      (
        type === "log:thread-theme" ||
        type === "change_thread_theme"
      )
    ) {
      if (!original.theme) return;

      try {
        if (
          typeof api.changeThreadColor ===
          "function"
        ) {
          await api.changeThreadColor(
            original.theme,
            threadID
          );

          console.log(
            `🛡️ تم استرجاع ثيم المجموعة`
          );
        }
      } catch (e) {
        console.error(
          "❌ فشل استرجاع الثيم:",
          e.message
        );
      }

      return;
    }

    /*
     * ==========================================
     * حماية الكنيات
     * ==========================================
     */

    if (
      settings.nicknames &&
      (
        type === "log:user-nickname" ||
        type === "change_thread_nickname"
      )
    ) {
      const info =
        event.logMessageData || {};

      const targetID =
        info.participant_id;

      if (!targetID) return;

      const nicknames =
        original.nicknames || {};

      if (
        !Object.prototype.hasOwnProperty.call(
          nicknames,
          String(targetID)
        )
      ) {
        return;
      }

      const oldNickname =
        nicknames[String(targetID)];

      try {
        if (
          typeof api.changeNickname ===
          "function"
        ) {
          await api.changeNickname(
            oldNickname || "",
            threadID,
            targetID
          );

          console.log(
            `🛡️ تم استرجاع كنية ${targetID}`
          );
        }
      } catch (e) {
        console.error(
          "❌ فشل استرجاع الكنية:",
          e.message
        );
      }

      return;
    }

    /*
     * ==========================================
     * حماية إضافة الأعضاء
     * ==========================================
     */

    if (
      settings.addMember &&
      (
        type === "log:subscribe" ||
        type === "log:subscribe-event"
      )
    ) {
      const added =
        event.logMessageData?.addedParticipants ||
        event.logMessageData?.added_users ||
        [];

      for (const user of added) {
        const userID =
          user.userFbId ||
          user.userID ||
          user.id;

        if (!userID) continue;

        /*
         * لا تطرد الأدمن.
         */
        if (
          await isAdmin(
            api,
            threadID,
            userID
          )
        ) {
          continue;
        }

        try {
          if (
            typeof api.removeUserFromGroup ===
            "function"
          ) {
            await api.removeUserFromGroup(
              userID,
              threadID
            );

            console.log(
              `🛡️ تم إخراج العضو المضاف: ${userID}`
            );
          }
        } catch (e) {
          console.error(
            "❌ فشل إخراج العضو:",
            e.message
          );
        }
      }

      return;
    }

  } catch (e) {
    console.error(
      "❌ Protection Event Error:",
      e.message
    );
  }
};