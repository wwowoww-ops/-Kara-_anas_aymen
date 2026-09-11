module.exports.config = {
  name: "منشن",
  version: "3.0.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "فحص كامل لبيانات المنشن داخل event",
  commandCategory: "Utility",
  usages: "منشن @شخص",
  cooldowns: 3
};

// ============================================================
// البحث العميق داخل أي كائن
// ============================================================

function deepSearch(value, path = "event", results = [], visited = new WeakSet()) {

  if (value === null || value === undefined) return results;

  // النصوص
  if (typeof value === "string") {

    const text = value.trim();

    if (
      text &&
      (
        path.toLowerCase().includes("mention") ||
        path.toLowerCase().includes("user") ||
        path.toLowerCase().includes("participant") ||
        path.toLowerCase().includes("author") ||
        path.toLowerCase().includes("actor") ||
        path.toLowerCase().includes("sender")
      )
    ) {

      results.push({
        path,
        value: text
      });
    }

    return results;
  }

  // أرقام / Boolean
  if (
    typeof value === "number" ||
    typeof value === "boolean"
  ) {

    if (
      path.toLowerCase().includes("mention") ||
      path.toLowerCase().includes("user") ||
      path.toLowerCase().includes("participant") ||
      path.toLowerCase().includes("author") ||
      path.toLowerCase().includes("actor") ||
      path.toLowerCase().includes("sender")
    ) {

      results.push({
        path,
        value: String(value)
      });
    }

    return results;
  }

  // منع التكرار
  if (typeof value === "object") {

    try {

      if (visited.has(value)) {
        return results;
      }

      visited.add(value);

    } catch (e) {}
  }

  // Array
  if (Array.isArray(value)) {

    value.forEach((item, index) => {

      deepSearch(
        item,
        `${path}[${index}]`,
        results,
        visited
      );

    });

    return results;
  }

  // Object
  if (typeof value === "object") {

    let keys = [];

    try {
      keys = Object.keys(value);
    } catch (e) {
      return results;
    }

    for (const key of keys) {

      try {

        deepSearch(
          value[key],
          `${path}.${key}`,
          results,
          visited
        );

      } catch (e) {}

    }
  }

  return results;
}

// ============================================================
// البحث عن UID محتمل
// ============================================================

function findPossibleIDs(event) {

  const found = [];

  function scan(value, path = "event", visited = new WeakSet()) {

    if (value === null || value === undefined) return;

    if (typeof value === "string") {

      const text = value.trim();

      // Facebook UID غالبًا رقم طويل
      if (/^\d{8,25}$/.test(text)) {

        found.push({
          path,
          id: text
        });

      }

      return;
    }

    if (typeof value === "number") {

      const text = String(value);

      if (/^\d{8,25}$/.test(text)) {

        found.push({
          path,
          id: text
        });

      }

      return;
    }

    if (typeof value !== "object") return;

    try {

      if (visited.has(value)) return;

      visited.add(value);

    } catch (e) {}

    if (Array.isArray(value)) {

      value.forEach((item, index) => {

        scan(
          item,
          `${path}[${index}]`,
          visited
        );

      });

      return;
    }

    for (const key of Object.keys(value)) {

      try {

        scan(
          value[key],
          `${path}.${key}`,
          visited
        );

      } catch (e) {}

    }
  }

  scan(event);

  return found;
}

// ============================================================
// COMMAND
// ============================================================

module.exports.run = async function ({
  api,
  event
}) {

  const {
    threadID,
    messageID
  } = event;

  // ==========================================================
  // البيانات الأساسية
  // ==========================================================

  const direct = {
    mentionID: event.mentionID,
    mentionIDs: event.mentionIDs,
    mentions: event.mentions,
    body: event.body,
    senderID: event.senderID
  };

  // ==========================================================
  // البحث العميق
  // ==========================================================

  const deepResults = deepSearch(event);

  // ==========================================================
  // البحث عن IDs
  // ==========================================================

  const possibleIDs = findPossibleIDs(event);

  // إزالة التكرار
  const uniqueIDs = [];

  for (const item of possibleIDs) {

    if (
      !uniqueIDs.some(
        x =>
          x.id === item.id &&
          x.path === item.path
      )
    ) {

      uniqueIDs.push(item);
    }
  }

  // ==========================================================
  // إخراج محدود حتى لا تتجاوز الرسالة الحد
  // ==========================================================

  let message =
`╭──────────────╮
│ HINA 〢 MENTION DEBUG
╰──────────────╯

[ BODY ]
${event.body || "لا يوجد"}

[ mentionID ]
${event.mentionID || "غير موجود"}

[ mentionIDs ]
${
  Array.isArray(event.mentionIDs)
    ? JSON.stringify(event.mentionIDs)
    : "غير موجود"
}

[ mentions ]
${
  event.mentions
    ? JSON.stringify(event.mentions)
    : "غير موجود"
}

[ POSSIBLE IDS ]
`;

  if (uniqueIDs.length === 0) {

    message += "لم يتم العثور على UID\n";

  } else {

    for (const item of uniqueIDs.slice(0, 30)) {

      message +=
        `\n${item.id}\nPATH: ${item.path}\n`;
    }
  }

  message +=
`
[ DEEP DATA ]

`;

  if (deepResults.length === 0) {

    message += "لم يتم العثور على بيانات مرتبطة بالمنشن\n";

  } else {

    for (const item of deepResults.slice(0, 40)) {

      let value = String(item.value);

      if (value.length > 150) {
        value = value.slice(0, 150) + "...";
      }

      message +=
        `${item.path}\n→ ${value}\n\n`;
    }
  }

  message +=
`
[ EVENT KEYS ]

${Object.keys(event).join("\n")}
`;

  return api.sendMessage(
    message,
    threadID,
    messageID
  );
};