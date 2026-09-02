/**
 * ============================================================
 * نظام الحيوانات - بيانات الحيوانات
 * ============================================================
 *
 * هذا الملف يحتوي على بيانات الحيوانات فقط.
 * لا يحتوي على قاعدة بيانات ولا منطق الأوامر.
 *
 * تصميم البيانات هنا يسمح بإضافة:
 * - نظام المستويات
 * - الخبرة
 * - زيادة الصحة والقوة
 * - التطور
 * - المهارات
 * - الصور الخاصة
 * - الندرات الجديدة
 *
 * لاحقًا يمكن لـ leveling.js استخدام:
 *   pet.baseHealth
 *   pet.basePower
 *   pet.growth
 *   pet.rarity
 *
 * بدون الحاجة لتعديل بيانات الحيوانات.
 * ============================================================
 */


/* ============================================================
 * ترتيب الندرات
 * ============================================================ */

const RARITIES = {
  COMMON: "شائع",
  UNCOMMON: "غير شائع",
  RARE: "نادر",
  EPIC: "ملحمي",
  LEGENDARY: "أسطوري",
  MYTHICAL: "خرافي",
  CELESTIAL: "سماوية"
};


/* ============================================================
 * ترتيب الندرات من الأضعف إلى الأقوى
 * ============================================================ */

const RARITY_ORDER = [
  RARITIES.COMMON,
  RARITIES.UNCOMMON,
  RARITIES.RARE,
  RARITIES.EPIC,
  RARITIES.LEGENDARY,
  RARITIES.MYTHICAL,
  RARITIES.CELESTIAL
];


/* ============================================================
 * بيانات الحيوانات
 * ============================================================
 *
 * id:
 * رقم ثابت للحيوان
 *
 * type:
 * الاسم الذي يستخدمه النظام للتعرف على الحيوان
 *
 * name:
 * الاسم الظاهر للمستخدم
 *
 * rarity:
 * ندرة الحيوان
 *
 * price:
 * سعر الشراء
 *
 * basePower:
 * القوة الأساسية عند المستوى 1
 *
 * baseHealth:
 * الصحة الأساسية عند المستوى 1
 *
 * growth:
 * مقدار النمو الذي سيستخدمه نظام المستويات لاحقًا
 *
 * emoji:
 * الإيموجي الافتراضي للحيوان
 *
 * maxLevel:
 * أعلى مستوى يمكن أن يصل إليه الحيوان
 *
 * specialImageLevel:
 * المستوى الذي يحصل فيه الحيوان على الصورة الخاصة
 *
 * ============================================================
 */

const PETS = [

  /* =========================
   * شائع
   * ========================= */

  {
    id: 1,
    type: "قطة",
    name: "قطة",
    rarity: RARITIES.COMMON,
    price: 0,

    basePower: 10,
    baseHealth: 100,

    growth: {
      power: 5,
      health: 20
    },

    emoji: "🐱",

    maxLevel: 100,
    specialImageLevel: 30
  },

  {
    id: 2,
    type: "كلب",
    name: "كلب",
    rarity: RARITIES.COMMON,
    price: 0,

    basePower: 12,
    baseHealth: 110,

    growth: {
      power: 5,
      health: 22
    },

    emoji: "🐶",

    maxLevel: 100,
    specialImageLevel: 30
  },

  {
    id: 3,
    type: "أرنب",
    name: "أرنب",
    rarity: RARITIES.COMMON,
    price: 0,

    basePower: 8,
    baseHealth: 90,

    growth: {
      power: 5,
      health: 18
    },

    emoji: "🐰",

    maxLevel: 100,
    specialImageLevel: 30
  },

  {
    id: 4,
    type: "هامستر",
    name: "هامستر",
    rarity: RARITIES.COMMON,
    price: 0,

    basePower: 7,
    baseHealth: 85,

    growth: {
      power: 4,
      health: 17
    },

    emoji: "🐹",

    maxLevel: 100,
    specialImageLevel: 30
  },

  {
    id: 5,
    type: "سنجاب",
    name: "سنجاب",
    rarity: RARITIES.COMMON,
    price: 0,

    basePower: 9,
    baseHealth: 95,

    growth: {
      power: 5,
      health: 19
    },

    emoji: "🐿️",

    maxLevel: 100,
    specialImageLevel: 30
  },

  {
    id: 6,
    type: "فراشة",
    name: "فراشة",
    rarity: RARITIES.COMMON,
    price: 0,

    basePower: 6,
    baseHealth: 75,

    growth: {
      power: 4,
      health: 15
    },

    emoji: "🦋",

    maxLevel: 100,
    specialImageLevel: 30
  },

  {
    id: 7,
    type: "حلزون",
    name: "حلزون",
    rarity: RARITIES.COMMON,
    price: 0,

    basePower: 5,
    baseHealth: 120,

    growth: {
      power: 4,
      health: 25
    },

    emoji: "🐌",

    maxLevel: 100,
    specialImageLevel: 30
  },

  {
    id: 8,
    type: "سمكة",
    name: "سمكة",
    rarity: RARITIES.COMMON,
    price: 0,

    basePower: 7,
    baseHealth: 85,

    growth: {
      power: 4,
      health: 17
    },

    emoji: "🐟",

    maxLevel: 100,
    specialImageLevel: 30
  },

  {
    id: 38,
    type: "قنفذ",
    name: "قنفذ",
    rarity: RARITIES.COMMON,
    price: 1800,

    basePower: 18,
    baseHealth: 130,

    growth: {
      power: 6,
      health: 26
    },

    emoji: "🦔",

    maxLevel: 100,
    specialImageLevel: 30
  },


  /* =========================
   * غير شائع
   * ========================= */

  {
    id: 9,
    type: "ثعلب",
    name: "ثعلب",
    rarity: RARITIES.UNCOMMON,
    price: 500,

    basePower: 25,
    baseHealth: 150,

    growth: {
      power: 7,
      health: 30
    },

    emoji: "🦊",

    maxLevel: 100,
    specialImageLevel: 30
  },

  {
    id: 10,
    type: "باندا",
    name: "باندا",
    rarity: RARITIES.UNCOMMON,
    price: 1500,

    basePower: 30,
    baseHealth: 190,

    growth: {
      power: 8,
      health: 38
    },

    emoji: "🐼",

    maxLevel: 100,
    specialImageLevel: 30
  },

  {
    id: 11,
    type: "ببغاء",
    name: "ببغاء",
    rarity: RARITIES.UNCOMMON,
    price: 2500,

    basePower: 32,
    baseHealth: 160,

    growth: {
      power: 8,
      health: 32
    },

    emoji: "🦜",

    maxLevel: 100,
    specialImageLevel: 30
  },

  {
    id: 12,
    type: "سلحفاة",
    name: "سلحفاة",
    rarity: RARITIES.UNCOMMON,
    price: 1800,

    basePower: 28,
    baseHealth: 230,

    growth: {
      power: 7,
      health: 46
    },

    emoji: "🐢",

    maxLevel: 100,
    specialImageLevel: 30
  },

  {
    id: 13,
    type: "بطريق",
    name: "بطريق",
    rarity: RARITIES.UNCOMMON,
    price: 2200,

    basePower: 25,
    baseHealth: 170,

    growth: {
      power: 7,
      health: 34
    },

    emoji: "🐧",

    maxLevel: 100,
    specialImageLevel: 30
  },

  {
    id: 14,
    type: "كوالا",
    name: "كوالا",
    rarity: RARITIES.UNCOMMON,
    price: 2800,

    basePower: 27,
    baseHealth: 180,

    growth: {
      power: 7,
      health: 36
    },

    emoji: "🐨",

    maxLevel: 100,
    specialImageLevel: 30
  },

  {
    id: 15,
    type: "غراب",
    name: "غراب",
    rarity: RARITIES.UNCOMMON,
    price: 3000,

    basePower: 35,
    baseHealth: 165,

    growth: {
      power: 9,
      health: 33
    },

    emoji: "🐦‍⬛",

    maxLevel: 100,
    specialImageLevel: 30
  },


  /* =========================
   * نادر
   * ========================= */

  {
    id: 16,
    type: "ذئب",
    name: "ذئب",
    rarity: RARITIES.RARE,
    price: 4000,

    basePower: 35,
    baseHealth: 220,

    growth: {
      power: 10,
      health: 44
    },

    emoji: "🐺",

    maxLevel: 100,
    specialImageLevel: 30
  },

  {
    id: 17,
    type: "حصان",
    name: "حصان",
    rarity: RARITIES.RARE,
    price: 5000,

    basePower: 55,
    baseHealth: 280,

    growth: {
      power: 13,
      health: 56
    },

    emoji: "🐴",

    maxLevel: 100,
    specialImageLevel: 30
  },

  {
    id: 18,
    type: "نمر",
    name: "نمر",
    rarity: RARITIES.RARE,
    price: 6000,

    basePower: 50,
    baseHealth: 260,

    growth: {
      power: 12,
      health: 52
    },

    emoji: "🐯",

    maxLevel: 100,
    specialImageLevel: 30
  },

  {
    id: 19,
    type: "أسد",
    name: "أسد",
    rarity: RARITIES.RARE,
    price: 7000,

    basePower: 60,
    baseHealth: 300,

    growth: {
      power: 14,
      health: 60
    },

    emoji: "🦁",

    maxLevel: 100,
    specialImageLevel: 30
  },

  {
    id: 20,
    type: "دب",
    name: "دب",
    rarity: RARITIES.RARE,
    price: 7500,

    basePower: 65,
    baseHealth: 350,

    growth: {
      power: 15,
      health: 70
    },

    emoji: "🐻",

    maxLevel: 100,
    specialImageLevel: 30
  },


  /* =========================
   * ملحمي
   * ========================= */

  {
    id: 21,
    type: "غزال",
    name: "غزال",
    rarity: RARITIES.EPIC,
    price: 8000,

    basePower: 45,
    baseHealth: 260,

    growth: {
      power: 13,
      health: 52
    },

    emoji: "🦌",

    maxLevel: 100,
    specialImageLevel: 30
  },

  {
    id: 22,
    type: "نسر",
    name: "نسر",
    rarity: RARITIES.EPIC,
    price: 9000,

    basePower: 70,
    baseHealth: 300,

    growth: {
      power: 17,
      health: 60
    },

    emoji: "🦅",

    maxLevel: 100,
    specialImageLevel: 30
  },

  {
    id: 23,
    type: "بومة",
    name: "بومة",
    rarity: RARITIES.EPIC,
    price: 9500,

    basePower: 58,
    baseHealth: 290,

    growth: {
      power: 14,
      health: 58
    },

    emoji: "🦉",

    maxLevel: 100,
    specialImageLevel: 30
  },

  {
    id: 24,
    type: "غوريلا",
    name: "غوريلا",
    rarity: RARITIES.EPIC,
    price: 10000,

    basePower: 85,
    baseHealth: 430,

    growth: {
      power: 20,
      health: 86
    },

    emoji: "🦍",

    maxLevel: 100,
    specialImageLevel: 30
  },

  {
    id: 25,
    type: "فهد",
    name: "فهد",
    rarity: RARITIES.EPIC,
    price: 11000,

    basePower: 88,
    baseHealth: 360,

    growth: {
      power: 21,
      health: 72
    },

    emoji: "🐆",

    maxLevel: 100,
    specialImageLevel: 30
  },

  {
    id: 26,
    type: "تمساح",
    name: "تمساح",
    rarity: RARITIES.EPIC,
    price: 10500,

    basePower: 78,
    baseHealth: 450,

    growth: {
      power: 18,
      health: 90
    },

    emoji: "🐊",

    maxLevel: 100,
    specialImageLevel: 30
  },

  {
    id: 27,
    type: "قرش",
    name: "قرش",
    rarity: RARITIES.EPIC,
    price: 12000,

    basePower: 82,
    baseHealth: 420,

    growth: {
      power: 19,
      health: 84
    },

    emoji: "🦈",

    maxLevel: 100,
    specialImageLevel: 30
  },

  {
    id: 28,
    type: "حوت",
    name: "حوت",
    rarity: RARITIES.EPIC,
    price: 13000,

    basePower: 90,
    baseHealth: 600,

    growth: {
      power: 21,
      health: 120
    },

    emoji: "🐋",

    maxLevel: 100,
    specialImageLevel: 30
  },

  {
    id: 29,
    type: "زرافة",
    name: "زرافة",
    rarity: RARITIES.EPIC,
    price: 11500,

    basePower: 65,
    baseHealth: 380,

    growth: {
      power: 16,
      health: 76
    },

    emoji: "🦒",

    maxLevel: 100,
    specialImageLevel: 30
  },

  {
    id: 30,
    type: "شمبانزي",
    name: "شمبانزي",
    rarity: RARITIES.EPIC,
    price: 8500,

    basePower: 55,
    baseHealth: 300,

    growth: {
      power: 14,
      health: 60
    },

    emoji: "🐒",

    maxLevel: 100,
    specialImageLevel: 30
  },


  /* =========================
   * أسطوري
   * ========================= */

  {
    id: 31,
    type: "وحيد القرن",
    name: "وحيد القرن",
    rarity: RARITIES.LEGENDARY,
    price: 15000,

    basePower: 105,
    baseHealth: 650,

    growth: {
      power: 25,
      health: 130
    },

    emoji: "🦏",

    maxLevel: 100,
    specialImageLevel: 30
  },

  {
    id: 32,
    type: "فيل",
    name: "فيل",
    rarity: RARITIES.LEGENDARY,
    price: 16000,

    basePower: 110,
    baseHealth: 800,

    growth: {
      power: 26,
      health: 160
    },

    emoji: "🐘",

    maxLevel: 100,
    specialImageLevel: 30
  },

  {
    id: 33,
    type: "صقر",
    name: "صقر",
    rarity: RARITIES.LEGENDARY,
    price: 14000,

    basePower: 95,
    baseHealth: 450,

    growth: {
      power: 23,
      health: 90
    },

    emoji: "🦅",

    maxLevel: 100,
    specialImageLevel: 30
  },

  {
    id: 34,
    type: "وحش أسطوري",
    name: "وحش أسطوري",
    rarity: RARITIES.LEGENDARY,
    price: 20000,

    basePower: 150,
    baseHealth: 900,

    growth: {
      power: 35,
      health: 180
    },

    emoji: "👹",

    maxLevel: 100,
    specialImageLevel: 30
  },


  /* =========================
   * خرافي
   * ========================= */

  {
    id: 35,
    type: "تنين",
    name: "تنين",
    rarity: RARITIES.MYTHICAL,
    price: 30000,

    basePower: 150,
    baseHealth: 1000,

    growth: {
      power: 38,
      health: 200
    },

    emoji: "🐉",

    maxLevel: 100,
    specialImageLevel: 30
  },

  {
    id: 36,
    type: "يونيكورن",
    name: "يونيكورن",
    rarity: RARITIES.MYTHICAL,
    price: 25000,

    basePower: 140,
    baseHealth: 850,

    growth: {
      power: 35,
      health: 170
    },

    emoji: "🦄",

    maxLevel: 100,
    specialImageLevel: 30
  },

  {
    id: 37,
    type: "كراكن",
    name: "كراكن",
    rarity: RARITIES.MYTHICAL,
    price: 40000,

    basePower: 180,
    baseHealth: 1200,

    growth: {
      power: 45,
      health: 240
    },

    emoji: "🐙",

    maxLevel: 100,
    specialImageLevel: 30
  },


  /* =========================
   * سماوية
   * ========================= */

  {
    id: 39,
    type: "عنقاء",
    name: "عنقاء",
    rarity: RARITIES.CELESTIAL,
    price: 10000000000000,

    basePower: 300,
    baseHealth: 2000,

    growth: {
      power: 75,
      health: 400
    },

    emoji: "🔥",

    maxLevel: 100,
    specialImageLevel: 30
  }

];


/* ============================================================
 * دوال الوصول إلى البيانات
 * ============================================================ */

/**
 * الحصول على حيوان بواسطة ID
 */
function getPetByID(id) {
  return PETS.find(
    pet => pet.id === Number(id)
  );
}


/**
 * الحصول على حيوان بواسطة النوع
 */
function getPetByType(type) {
  if (!type) return null;

  const search = String(type).trim();

  return PETS.find(
    pet =>
      pet.type === search ||
      pet.name === search
  );
}


/**
 * الحصول على جميع الحيوانات حسب الندرة
 */
function getPetsByRarity(rarity) {
  return PETS.filter(
    pet => pet.rarity === rarity
  );
}


/**
 * الحصول على رقم الندرة
 *
 * مثال:
 * شائع = 0
 * غير شائع = 1
 * ...
 * سماوية = 6
 */
function getRarityLevel(rarity) {
  return RARITY_ORDER.indexOf(rarity);
}


/**
 * التحقق من وجود ندرة
 */
function isValidRarity(rarity) {
  return RARITY_ORDER.includes(rarity);
}


/**
 * الحصول على أعلى ندرة
 */
function getHighestRarity() {
  return RARITY_ORDER[RARITY_ORDER.length - 1];
}


/**
 * حساب القوة الأساسية حسب المستوى
 *
 * هذه الدالة مخصصة لاستخدام leveling.js لاحقًا.
 *
 * المستوى 1 = القوة الأساسية
 * كل مستوى بعده يضيف growth.power
 */
function calculatePower(pet, level = 1) {
  if (!pet) return 0;

  level = Math.max(1, Number(level));

  return Math.floor(
    pet.basePower +
    ((level - 1) * pet.growth.power)
  );
}


/**
 * حساب الصحة الأساسية حسب المستوى
 *
 * المستوى 1 = الصحة الأساسية
 * كل مستوى بعده يضيف growth.health
 */
function calculateHealth(pet, level = 1) {
  if (!pet) return 0;

  level = Math.max(1, Number(level));

  return Math.floor(
    pet.baseHealth +
    ((level - 1) * pet.growth.health)
  );
}


/**
 * معرفة هل الحيوان وصل لمستوى الصورة الخاصة
 */
function hasSpecialImage(pet, level = 1) {
  if (!pet) return false;

  return Number(level) >= pet.specialImageLevel;
}


/* ============================================================
 * التصدير
 * ============================================================ */

module.exports = {
  PETS,

  RARITIES,
  RARITY_ORDER,

  getPetByID,
  getPetByType,
  getPetsByRarity,

  getRarityLevel,
  isValidRarity,
  getHighestRarity,

  calculatePower,
  calculateHealth,
  hasSpecialImage
};