const fs = require("fs-extra");
const path = require("path");

// ======================================================
// الإعدادات
// ======================================================

const DATA_DIR = path.join(
  process.cwd(),
  "data"
);

const LEFT_THREADS_FILE = path.join(
  DATA_DIR,
  "leftThreads.json"
);

fs.ensureDirSync(
  DATA_DIR
);

// ======================================================
// JSON
// ======================================================

function readJSON(
  file,
  fallback = {}
) {

  try {

    if (
      !fs.existsSync(file)
    ) {
      return fallback;
    }

    const content =
      fs
        .readFileSync(
          file,
          "utf8"
        )
        .trim();

    if (!content) {
      return fallback;
    }

    return JSON.parse(
      content
    );

  } catch (error) {

    console.error(
      "TRACK LEFT READ ERROR:",
      error
    );

    return fallback;
  }
}

function writeJSON(
  file,
  data
) {

  try {

    fs.writeFileSync(
      file,
      JSON.stringify(
        data,
        null,
        2
      ),
      "utf8"
    );

    return true;

  } catch (error) {

    console.error(
      "TRACK LEFT WRITE ERROR:",
      error
    );

    return false;
  }
}

// ======================================================
// معرفة ID البوت
// ======================================================

function getBotID(api) {

  try {

    if (
      api &&
      typeof api.getCurrentUserID ===
      "function"
    ) {

      return String(
        api.getCurrentUserID()
      );
    }

  } catch (e) {}

  return null;
}

// ======================================================
// استخراج UID الشخص الذي تسبب في الحدث
// ======================================================

function getRemovedUserID(event) {

  const candidates = [

    event?.logMessageData?.leftParticipantFbId,

    event?.logMessageData?.removedParticipantFbId,

    event?.logMessageData?.participantFbId,

    event?.logMessageData?.userFbId,

    event?.logMessageData?.author,

    event?.logMessageData?.actor,

    event?.leftParticipantID,

    event?.removedParticipantID,

    event?.participantID,

    event?.userID

  ];

  for (
    const id of candidates
  ) {

    if (
      id !== undefined &&
      id !== null &&
      String(id).trim()
    ) {

      return String(id);
    }
  }

  return null;
}

// ======================================================
// تسجيل المجموعة
// ======================================================

function saveLeftThread(
  threadID,
  event,
  botID
) {

  if (!threadID) {
    return false;
  }

  const id =
    String(threadID);

  const data =
    readJSON(
      LEFT_THREADS_FILE,
      {}
    );

  /*
   * إذا كانت المجموعة مسجلة من قبل
   * نحدث معلوماتها فقط
   */

  data[id] = {

    threadID: id,

    type: "bot_left_or_kicked",

    time: Date.now(),

    eventType:
      event?.logMessageType ||
      "log:unsubscribe",

    botID:
      botID || null

  };

  return writeJSON(
    LEFT_THREADS_FILE,
    data
  );
}

// ======================================================
// EVENT
// ======================================================

module.exports.config = {

  name: "trackLeftThreads",

  eventType: "log:unsubscribe",

  version: "1.0.0",

  credits: "أبو هريرة",

  description:
    "تسجيل المجموعات التي خرج منها البوت أو تم طرده منها"

};

// ======================================================
// HANDLE EVENT
// ======================================================

module.exports.handleEvent = async function ({
  api,
  event
}) {

  try {

    if (!event) {
      return;
    }

    /*
     * هذا الحدث خاص بخروج عضو أو طرده
     */

    if (
      event.logMessageType !==
      "log:unsubscribe"
    ) {
      return;
    }

    const threadID =
      event.threadID;

    if (!threadID) {
      return;
    }

    /*
     * الحصول على ID البوت
     */

    const botID =
      getBotID(api);

    if (!botID) {
      return;
    }

    /*
     * معرفة العضو الذي خرج/تمت إزالته
     */

    const removedUserID =
      getRemovedUserID(
        event
      );

    /*
     * إذا كان العضو الذي خرج
     * هو البوت نفسه
     *
     * فهذا يعني:
     * - البوت طُرد
     * أو
     * - البوت خرج من المجموعة
     */

    if (
      !removedUserID ||
      String(removedUserID) !==
      String(botID)
    ) {
      return;
    }

    /*
     * تسجيل المجموعة
     */

    const saved =
      saveLeftThread(
        threadID,
        event,
        botID
      );

    if (saved) {

      console.log(
`[TRACK LEFT]

تم تسجيل مجموعة خرج منها البوت:

ThreadID: ${threadID}`
      );

    }

  } catch (error) {

    console.error(
      "TRACK LEFT EVENT ERROR:",
      error
    );
  }
};