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

fs.ensureDirSync(DATA_DIR);

// ======================================================
// JSON
// ======================================================

function readJSON(file, fallback = {}) {
  try {
    if (!fs.existsSync(file)) {
      return fallback;
    }

    const content = fs
      .readFileSync(file, "utf8")
      .trim();

    if (!content) {
      return fallback;
    }

    return JSON.parse(content);

  } catch (error) {
    console.error(
      "TRACK LEFT READ ERROR:",
      error
    );

    return fallback;
  }
}

function writeJSON(file, data) {
  try {
    fs.writeFileSync(
      file,
      JSON.stringify(data, null, 2),
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
// تحويل أي قيمة إلى UID
// ======================================================

function normalizeID(value) {
  if (
    value === undefined ||
    value === null
  ) {
    return null;
  }

  if (
    typeof value === "object"
  ) {

    const possible =
      value.id ||
      value.uid ||
      value.userID ||
      value.userId ||
      value.fbId ||
      value.fbID;

    if (
      possible !== undefined &&
      possible !== null
    ) {
      return String(possible);
    }

    return null;
  }

  const id =
    String(value).trim();

  return id || null;
}

// ======================================================
// الحصول على ID البوت
// ======================================================

function getBotID(api, event) {

  // ----------------------------------------------
  // الطريقة الأساسية
  // ----------------------------------------------

  try {
    if (
      api &&
      typeof api.getCurrentUserID ===
      "function"
    ) {

      const id =
        api.getCurrentUserID();

      if (id) {
        return String(id);
      }
    }
  } catch (e) {}

  // ----------------------------------------------
  // البحث في global.config
  // ----------------------------------------------

  try {

    const config =
      global.config || {};

    const candidates = [
      config.APPSTATE?.userID,
      config.BOT_ID,
      config.botID,
      config.userID,
      config.uid
    ];

    for (
      const candidate of candidates
    ) {

      const id =
        normalizeID(candidate);

      if (id) {
        return id;
      }
    }

  } catch (e) {}

  // ----------------------------------------------
  // البحث في event
  // ----------------------------------------------

  try {

    const candidates = [

      event?.botID,

      event?.botId,

      event?.bot?.id,

      event?.bot?.userID,

      event?.api?.getCurrentUserID
        ? event.api.getCurrentUserID()
        : null

    ];

    for (
      const candidate of candidates
    ) {

      const id =
        normalizeID(candidate);

      if (id) {
        return id;
      }
    }

  } catch (e) {}

  return null;
}

// ======================================================
// استخراج كل IDs المحتملة من الحدث
// ======================================================

function collectEventUserIDs(event) {

  const ids = new Set();

  function add(value) {

    const id =
      normalizeID(value);

    if (id) {
      ids.add(id);
    }
  }

  // ==================================================
  // الحقول المباشرة
  // ==================================================

  add(event?.leftParticipantFbId);
  add(event?.leftParticipantID);
  add(event?.leftParticipantId);

  add(event?.removedParticipantFbId);
  add(event?.removedParticipantID);
  add(event?.removedParticipantId);

  add(event?.participantFbId);
  add(event?.participantID);
  add(event?.participantId);

  add(event?.userID);
  add(event?.userId);
  add(event?.uid);

  add(event?.author);
  add(event?.actor);
  add(event?.senderID);
  add(event?.senderId);

  // ==================================================
  // logMessageData
  // ==================================================

  const data =
    event?.logMessageData;

  if (data) {

    add(data.leftParticipantFbId);
    add(data.leftParticipantID);
    add(data.leftParticipantId);

    add(data.removedParticipantFbId);
    add(data.removedParticipantID);
    add(data.removedParticipantId);

    add(data.participantFbId);
    add(data.participantID);
    add(data.participantId);

    add(data.userFbId);
    add(data.userFbID);
    add(data.userID);
    add(data.userId);
    add(data.uid);

    add(data.author);
    add(data.actor);

    // ----------------------------------------------
    // participants
    // ----------------------------------------------

    if (
      Array.isArray(data.participants)
    ) {

      for (
        const participant of data.participants
      ) {
        add(participant);
      }
    }

    // ----------------------------------------------
    // participant
    // ----------------------------------------------

    add(data.participant);

    // ----------------------------------------------
    // user
    // ----------------------------------------------

    add(data.user);

    // ----------------------------------------------
    // actor
    // ----------------------------------------------

    add(data.actor);
  }

  // ==================================================
  // participants المباشرة
  // ==================================================

  if (
    Array.isArray(event?.participants)
  ) {

    for (
      const participant of event.participants
    ) {
      add(participant);
    }
  }

  return [
    ...ids
  ];
}

// ======================================================
// تسجيل المجموعة
// ======================================================

function saveLeftThread(
  threadID,
  event,
  botID,
  removedUserID
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

  data[id] = {

    threadID: id,

    type:
      "bot_left_or_kicked",

    time:
      Date.now(),

    eventType:
      event?.logMessageType ||
      "log:unsubscribe",

    botID:
      botID || null,

    removedUserID:
      removedUserID || null
  };

  return writeJSON(
    LEFT_THREADS_FILE,
    data
  );
}

// ======================================================
// فحص الحدث
// ======================================================

function isUnsubscribeEvent(event) {

  const type =
    String(
      event?.logMessageType || ""
    ).toLowerCase();

  return (
    type === "log:unsubscribe" ||
    type === "log:unsubscribe".toLowerCase()
  );
}

// ======================================================
// EVENT CONFIG
// ======================================================

module.exports.config = {

  name: "trackLeftThreads",

  eventType: "log:unsubscribe",

  version: "2.0.0",

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

    // ==================================================
    // التأكد من نوع الحدث
    // ==================================================

    if (
      !isUnsubscribeEvent(event)
    ) {
      return;
    }

    const threadID =
      event.threadID;

    if (!threadID) {
      return;
    }

    // ==================================================
    // الحصول على ID البوت
    // ==================================================

    const botID =
      getBotID(
        api,
        event
      );

    if (!botID) {

      console.log(
        "[TRACK LEFT] تعذر الحصول على ID البوت"
      );

      return;
    }

    // ==================================================
    // استخراج جميع IDs الموجودة في الحدث
    // ==================================================

    const eventUserIDs =
      collectEventUserIDs(
        event
      );

    // ==================================================
    // البحث عن ID البوت
    // ==================================================

    const botWasRemoved =
      eventUserIDs.some(
        id =>
          String(id) ===
          String(botID)
      );

    if (!botWasRemoved) {

      /*
       * الحدث يخص عضوًا آخر
       * وليس البوت
       */

      return;
    }

    // ==================================================
    // تسجيل المجموعة
    // ==================================================

    const saved =
      saveLeftThread(
        threadID,
        event,
        botID,
        botID
      );

    if (saved) {

      console.log(
`
[TRACK LEFT]

تم تسجيل مجموعة خرج منها البوت أو طُرد منها

ThreadID:
${threadID}

BotID:
${botID}

Event:
${event.logMessageType}
`
      );

    }

  } catch (error) {

    console.error(
      "TRACK LEFT EVENT ERROR:",
      error
    );

  }
};