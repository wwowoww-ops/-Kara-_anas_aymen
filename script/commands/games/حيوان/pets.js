/**
 * ============================================================
 * نظام الحيوانات - بيانات الحيوانات
 * ============================================================
 *
 * نظام التطوير:
 *
 * Level 0 → Level 60
 *
 * عند Level 60 يمكن ترقية الحيوان:
 *
 * 0★ → 1★ → 2★ → 3★ → 4★ → 5★
 *
 * عند الترقية:
 * - Level = 0
 * - XP = 0
 * - القوة لا تعود للصفر
 * - الصحة لا تعود للصفر
 * - الشبع لا يعود للصفر
 * - الإحصائيات تستمر بالتطور
 *
 * Level 60:
 * - يحصل الحيوان على صورته الخاصة
 *
 * 5★ Level 60:
 * - ختم اللعبة
 *
 * ============================================================
 */


/* ============================================================
 * الندرات
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
 * ترتيب الندرات
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
 * إعدادات النظام
 * ============================================================ */

const MAX_LEVEL = 60;
const MAX_STARS = 5;

/*
 * الصورة الخاصة تظهر عند Level 60
 */
const SPECIAL_IMAGE_LEVEL = 60;


/* ============================================================
 * الشبع حسب الندرة
 * ============================================================
 *
 * تم رفع تطور الشبع بشكل كبير استعدادًا لنظام القتال
 * والأنظمة المستقبلية.
 *
 * base:
 * الحد الأساسي للشبع عند Level 0
 *
 * growth:
 * مقدار زيادة الحد الأقصى للشبع
 * مع كل مستوى فعلي
 *
 * المستوى الفعلي:
 *
 * 0★ Lv0  = 0
 * 0★ Lv60 = 60
 * 1★ Lv0  = 60
 * 1★ Lv60 = 120
 * 2★ Lv60 = 180
 * 3★ Lv60 = 240
 * 4★ Lv60 = 300
 * 5★ Lv60 = 360
 *
 * ============================================================
 */

const HUNGER_BY_RARITY = {

  [RARITIES.COMMON]: {
    base: 100,
    growth: 4
  },

  [RARITIES.UNCOMMON]: {
    base: 115,
    growth: 6
  },

  [RARITIES.RARE]: {
    base: 130,
    growth: 8
  },

  [RARITIES.EPIC]: {
    base: 150,
    growth: 11
  },

  [RARITIES.LEGENDARY]: {
    base: 175,
    growth: 14
  },

  [RARITIES.MYTHICAL]: {
    base: 205,
    growth: 17
  },

  [RARITIES.CELESTIAL]: {
    base: 240,
    growth: 22
  }

};


/* ============================================================
 * بيانات الحيوانات
 * ============================================================
 *
 * تم رفع نمو القوة والصحة مع الحفاظ على الفروقات
 * الأصلية بين الحيوانات.
 *
 * ============================================================
 */

const PETS = [

  /* ==========================================================
   * شائع
   * ========================================================== */

  {
    id: 1,
    type: "قطة",
    name: "قطة",
    rarity: RARITIES.COMMON,
    price: 5000,

    basePower: 10,
    baseHealth: 100,

    growth: {
      power: 12,
      health: 48
    },

    emoji: "🐱"
  },

  {
    id: 2,
    type: "كلب",
    name: "كلب",
    rarity: RARITIES.COMMON,
    price: 6000,

    basePower: 12,
    baseHealth: 110,

    growth: {
      power: 12,
      health: 53
    },

    emoji: "🐶"
  },

  {
    id: 3,
    type: "أرنب",
    name: "أرنب",
    rarity: RARITIES.COMMON,
    price: 5500,

    basePower: 9,
    baseHealth: 95,

    growth: {
      power: 12,
      health: 46
    },

    emoji: "🐰"
  },

  {
    id: 4,
    type: "هامستر",
    name: "هامستر",
    rarity: RARITIES.COMMON,
    price: 5000,

    basePower: 8,
    baseHealth: 90,

    growth: {
      power: 10,
      health: 43
    },

    emoji: "🐹"
  },

  {
    id: 5,
    type: "سنجاب",
    name: "سنجاب",
    rarity: RARITIES.COMMON,
    price: 6000,

    basePower: 10,
    baseHealth: 100,

    growth: {
      power: 12,
      health: 48
    },

    emoji: "🐿️"
  },

  {
    id: 6,
    type: "فراشة",
    name: "فراشة",
    rarity: RARITIES.COMMON,
    price: 5000,

    basePower: 7,
    baseHealth: 80,

    growth: {
      power: 10,
      health: 38
    },

    emoji: "🦋"
  },

  {
    id: 7,
    type: "حلزون",
    name: "حلزون",
    rarity: RARITIES.COMMON,
    price: 5500,

    basePower: 6,
    baseHealth: 125,

    growth: {
      power: 10,
      health: 60
    },

    emoji: "🐌"
  },

  {
    id: 8,
    type: "سمكة",
    name: "سمكة",
    rarity: RARITIES.COMMON,
    price: 5500,

    basePower: 8,
    baseHealth: 90,

    growth: {
      power: 10,
      health: 43
    },

    emoji: "🐟"
  },

  {
    id: 38,
    type: "قنفذ",
    name: "قنفذ",
    rarity: RARITIES.COMMON,
    price: 15000,

    basePower: 18,
    baseHealth: 130,

    growth: {
      power: 14,
      health: 62
    },

    emoji: "🦔"
  },


  /* ==========================================================
   * غير شائع
   * ========================================================== */

  {
    id: 9,
    type: "ثعلب",
    name: "ثعلب",
    rarity: RARITIES.UNCOMMON,
    price: 20000,

    basePower: 25,
    baseHealth: 150,

    growth: {
      power: 18,
      health: 75
    },

    emoji: "🦊"
  },

  {
    id: 10,
    type: "باندا",
    name: "باندا",
    rarity: RARITIES.UNCOMMON,
    price: 28000,

    basePower: 30,
    baseHealth: 190,

    growth: {
      power: 20,
      health: 95
    },

    emoji: "🐼"
  },

  {
    id: 11,
    type: "ببغاء",
    name: "ببغاء",
    rarity: RARITIES.UNCOMMON,
    price: 32000,

    basePower: 32,
    baseHealth: 160,

    growth: {
      power: 20,
      health: 80
    },

    emoji: "🦜"
  },

  {
    id: 12,
    type: "سلحفاة",
    name: "سلحفاة",
    rarity: RARITIES.UNCOMMON,
    price: 30000,

    basePower: 28,
    baseHealth: 230,

    growth: {
      power: 18,
      health: 115
    },

    emoji: "🐢"
  },

  {
    id: 13,
    type: "بطريق",
    name: "بطريق",
    rarity: RARITIES.UNCOMMON,
    price: 25000,

    basePower: 25,
    baseHealth: 170,

    growth: {
      power: 18,
      health: 85
    },

    emoji: "🐧"
  },

  {
    id: 14,
    type: "كوالا",
    name: "كوالا",
    rarity: RARITIES.UNCOMMON,
    price: 30000,

    basePower: 27,
    baseHealth: 180,

    growth: {
      power: 18,
      health: 90
    },

    emoji: "🐨"
  },

  {
    id: 15,
    type: "غراب",
    name: "غراب",
    rarity: RARITIES.UNCOMMON,
    price: 38000,

    basePower: 35,
    baseHealth: 165,

    growth: {
      power: 23,
      health: 83
    },

    emoji: "🐦‍⬛"
  },


  /* ==========================================================
   * نادر
   * ========================================================== */

  {
    id: 16,
    type: "ذئب",
    name: "ذئب",
    rarity: RARITIES.RARE,
    price: 75000,

    basePower: 35,
    baseHealth: 220,

    growth: {
      power: 30,
      health: 132
    },

    emoji: "🐺"
  },

  {
    id: 17,
    type: "حصان",
    name: "حصان",
    rarity: RARITIES.RARE,
    price: 90000,

    basePower: 55,
    baseHealth: 280,

    growth: {
      power: 39,
      health: 168
    },

    emoji: "🐴"
  },

  {
    id: 18,
    type: "نمر",
    name: "نمر",
    rarity: RARITIES.RARE,
    price: 105000,

    basePower: 50,
    baseHealth: 260,

    growth: {
      power: 36,
      health: 156
    },

    emoji: "🐯"
  },

  {
    id: 19,
    type: "أسد",
    name: "أسد",
    rarity: RARITIES.RARE,
    price: 125000,

    basePower: 60,
    baseHealth: 300,

    growth: {
      power: 42,
      health: 180
    },

    emoji: "🦁"
  },

  {
    id: 20,
    type: "دب",
    name: "دب",
    rarity: RARITIES.RARE,
    price: 150000,

    basePower: 65,
    baseHealth: 350,

    growth: {
      power: 45,
      health: 210
    },

    emoji: "🐻"
  },


  /* ==========================================================
   * ملحمي
   * ========================================================== */

  {
    id: 21,
    type: "غزال",
    name: "غزال",
    rarity: RARITIES.EPIC,
    price: 250000,

    basePower: 45,
    baseHealth: 260,

    growth: {
      power: 46,
      health: 182
    },

    emoji: "🦌"
  },

  {
    id: 22,
    type: "نسر",
    name: "نسر",
    rarity: RARITIES.EPIC,
    price: 300000,

    basePower: 70,
    baseHealth: 300,

    growth: {
      power: 60,
      health: 210
    },

    emoji: "🦅"
  },

  {
    id: 23,
    type: "بومة",
    name: "بومة",
    rarity: RARITIES.EPIC,
    price: 280000,

    basePower: 58,
    baseHealth: 290,

    growth: {
      power: 49,
      health: 203
    },

    emoji: "🦉"
  },

  {
    id: 24,
    type: "غوريلا",
    name: "غوريلا",
    rarity: RARITIES.EPIC,
    price: 400000,

    basePower: 85,
    baseHealth: 430,

    growth: {
      power: 70,
      health: 301
    },

    emoji: "🦍"
  },

  {
    id: 25,
    type: "فهد",
    name: "فهد",
    rarity: RARITIES.EPIC,
    price: 450000,

    basePower: 88,
    baseHealth: 360,

    growth: {
      power: 74,
      health: 252
    },

    emoji: "🐆"
  },

  {
    id: 26,
    type: "تمساح",
    name: "تمساح",
    rarity: RARITIES.EPIC,
    price: 430000,

    basePower: 78,
    baseHealth: 450,

    growth: {
      power: 63,
      health: 315
    },

    emoji: "🐊"
  },

  {
    id: 27,
    type: "قرش",
    name: "قرش",
    rarity: RARITIES.EPIC,
    price: 480000,

    basePower: 82,
    baseHealth: 420,

    growth: {
      power: 67,
      health: 294
    },

    emoji: "🦈"
  },

  {
    id: 28,
    type: "حوت",
    name: "حوت",
    rarity: RARITIES.EPIC,
    price: 600000,

    basePower: 90,
    baseHealth: 600,

    growth: {
      power: 74,
      health: 420
    },

    emoji: "🐋"
  },

  {
    id: 29,
    type: "زرافة",
    name: "زرافة",
    rarity: RARITIES.EPIC,
    price: 380000,

    basePower: 65,
    baseHealth: 380,

    growth: {
      power: 56,
      health: 266
    },

    emoji: "🦒"
  },

  {
    id: 30,
    type: "شمبانزي",
    name: "شمبانزي",
    rarity: RARITIES.EPIC,
    price: 260000,

    basePower: 55,
    baseHealth: 300,

    growth: {
      power: 49,
      health: 210
    },

    emoji: "🐒"
  },


  /* ==========================================================
   * أسطوري
   * ========================================================== */

  {
    id: 31,
    type: "وحيد القرن",
    name: "وحيد القرن",
    rarity: RARITIES.LEGENDARY,
    price: 1000000,

    basePower: 105,
    baseHealth: 650,

    growth: {
      power: 100,
      health: 520
    },

    emoji: "🦏"
  },

  {
    id: 32,
    type: "فيل",
    name: "فيل",
    rarity: RARITIES.LEGENDARY,
    price: 1500000,

    basePower: 110,
    baseHealth: 800,

    growth: {
      power: 104,
      health: 640
    },

    emoji: "🐘"
  },

  {
    id: 33,
    type: "صقر",
    name: "صقر",
    rarity: RARITIES.LEGENDARY,
    price: 1200000,

    basePower: 95,
    baseHealth: 450,

    growth: {
      power: 92,
      health: 360
    },

    emoji: "🦅"
  },

  {
    id: 34,
    type: "وحش أسطوري",
    name: "وحش أسطوري",
    rarity: RARITIES.LEGENDARY,
    price: 3000000,

    basePower: 150,
    baseHealth: 900,

    growth: {
      power: 140,
      health: 720
    },

    emoji: "👹"
  },


  /* ==========================================================
   * خرافي
   * ========================================================== */

  {
    id: 36,
    type: "يونيكورن",
    name: "يونيكورن",
    rarity: RARITIES.MYTHICAL,
    price: 5000000,

    basePower: 140,
    baseHealth: 850,

    growth: {
      power: 158,
      health: 765
    },

    emoji: "🦄"
  },

  {
    id: 37,
    type: "كراكن",
    name: "كراكن",
    rarity: RARITIES.MYTHICAL,
    price: 8500000,

    basePower: 180,
    baseHealth: 1200,

    growth: {
      power: 203,
      health: 1080
    },

    emoji: "🐙"
  },

  {
    id: 40,
    type: "ماموث خرافي",
    name: "ماموث خرافي",
    rarity: RARITIES.MYTHICAL,
    price: 12000000,

    basePower: 220,
    baseHealth: 1500,

    growth: {
      power: 225,
      health: 1350
    },

    emoji: "🦣"
  },


  /* ==========================================================
   * سماوية
   * ========================================================== */

  {
    id: 35,
    type: "تنين",
    name: "تنين",
    rarity: RARITIES.CELESTIAL,
    price: 30000000,

    basePower: 250,
    baseHealth: 1800,

    growth: {
      power: 325,
      health: 1750
    },

    emoji: "🐉"
  },

  {
    id: 39,
    type: "عنقاء",
    name: "عنقاء",
    rarity: RARITIES.CELESTIAL,
    price: 50000000,

    basePower: 300,
    baseHealth: 2000,

    growth: {
      power: 375,
      health: 2000
    },

    emoji: "🐦‍🔥"
  }

];


/* ============================================================
 * تجهيز بيانات الحيوانات
 * ============================================================
 */

for (const pet of PETS) {

  /* المستوى الأقصى */
  pet.maxLevel = MAX_LEVEL;

  /* النجوم القصوى */
  pet.maxStars = MAX_STARS;

  /* مستوى الصورة الخاصة */
  pet.specialImageLevel =
    SPECIAL_IMAGE_LEVEL;


  /* --------------------------------
   * بيانات الشبع حسب الندرة
   * -------------------------------- */

  const hungerData =
    HUNGER_BY_RARITY[
      pet.rarity
    ] ||
    HUNGER_BY_RARITY[
      RARITIES.COMMON
    ];


  /*
   * الشبع الأساسي
   */

  pet.baseHunger =
    hungerData.base;


  /*
   * زيادة الشبع مع كل مستوى فعلي
   */

  if (!pet.growth) {
    pet.growth = {};
  }

  pet.growth.hunger =
    hungerData.growth;
}


/* ============================================================
 * البحث عن حيوان بواسطة ID
 * ============================================================ */

function getPetByID(id) {

  const numericID =
    Number(id);

  return PETS.find(
    pet =>
      pet.id === numericID
  ) || null;
}


/* ============================================================
 * البحث عن حيوان بواسطة النوع
 * ============================================================ */

function getPetByType(type) {

  if (!type) {
    return null;
  }

  const search =
    String(type).trim();

  return PETS.find(
    pet =>
      pet.type === search ||
      pet.name === search
  ) || null;
}


/* ============================================================
 * جلب الحيوانات حسب الندرة
 * ============================================================ */

function getPetsByRarity(rarity) {

  return PETS.filter(
    pet =>
      pet.rarity === rarity
  );
}


/* ============================================================
 * مستوى الندرة
 * ============================================================ */

function getRarityLevel(rarity) {

  return RARITY_ORDER.indexOf(
    rarity
  );
}


/* ============================================================
 * التحقق من الندرة
 * ============================================================ */

function isValidRarity(rarity) {

  return RARITY_ORDER.includes(
    rarity
  );
}


/* ============================================================
 * أعلى ندرة
 * ============================================================ */

function getHighestRarity() {

  return RARITY_ORDER[
    RARITY_ORDER.length - 1
  ];
}


/* ============================================================
 * حساب القوة
 * ============================================================
 *
 * لا يوجد حد 360 هنا.
 *
 * leveling.js هو المسؤول عن تحويل:
 *
 * النجمة + المستوى
 *
 * إلى المستوى الفعلي.
 *
 * ============================================================
 */

function calculatePower(
  pet,
  level = 0
) {

  if (!pet) {
    return 0;
  }

  level =
    Number(level);

  if (!Number.isFinite(level)) {
    level = 0;
  }

  level =
    Math.max(
      0,
      level
    );


  const basePower =
    Number(pet.basePower) || 0;

  const growth =
    Number(
      pet.growth?.power
    ) || 0;


  return Math.floor(
    basePower +
    (
      level *
      growth
    )
  );
}


/* ============================================================
 * حساب الصحة
 * ============================================================ */

function calculateHealth(
  pet,
  level = 0
) {

  if (!pet) {
    return 0;
  }

  level =
    Number(level);

  if (!Number.isFinite(level)) {
    level = 0;
  }

  level =
    Math.max(
      0,
      level
    );


  const baseHealth =
    Number(pet.baseHealth) || 0;

  const growth =
    Number(
      pet.growth?.health
    ) || 0;


  return Math.floor(
    baseHealth +
    (
      level *
      growth
    )
  );
}


/* ============================================================
 * حساب الحد الأقصى للشبع
 * ============================================================
 *
 * الشبع يتطور مع:
 *
 * 1. ندرة الحيوان
 * 2. المستوى الفعلي
 * 3. النجوم من خلال المستوى الفعلي
 *
 * ============================================================
 */

function calculateMaxHunger(
  pet,
  level = 0
) {

  if (!pet) {
    return 0;
  }

  level =
    Number(level);

  if (!Number.isFinite(level)) {
    level = 0;
  }

  level =
    Math.max(
      0,
      level
    );


  const rarityData =
    HUNGER_BY_RARITY[
      pet.rarity
    ] ||
    HUNGER_BY_RARITY[
      RARITIES.COMMON
    ];


  const baseHunger =
    Number.isFinite(
      Number(pet.baseHunger)
    )
      ? Number(pet.baseHunger)
      : rarityData.base;


  const growth =
    Number.isFinite(
      Number(pet.growth?.hunger)
    )
      ? Number(pet.growth.hunger)
      : rarityData.growth;


  return Math.floor(
    baseHunger +
    (
      level *
      growth
    )
  );
}


/* ============================================================
 * حساب مستوى الشبع بالنسبة المئوية
 * ============================================================ */

function calculateHungerPercentage(
  pet,
  hunger,
  level = 0
) {

  const maxHunger =
    calculateMaxHunger(
      pet,
      level
    );

  if (maxHunger <= 0) {
    return 0;
  }

  hunger =
    Number(hunger);

  if (!Number.isFinite(hunger)) {
    hunger = 0;
  }

  hunger =
    Math.max(
      0,
      Math.min(
        hunger,
        maxHunger
      )
    );

  return Math.floor(
    (
      hunger /
      maxHunger
    ) * 100
  );
}


/* ============================================================
 * الصورة الخاصة
 * ============================================================
 */

function hasSpecialImage(
  pet,
  level = 0
) {

  if (!pet) {
    return false;
  }

  const specialLevel =
    Number(
      pet.specialImageLevel
    ) || SPECIAL_IMAGE_LEVEL;


  return (
    Number(level) >=
    specialLevel
  );
}


/* ============================================================
 * هل الحيوان في أقصى مستوى؟
 * ============================================================ */

function isMaxLevel(level) {

  level =
    Number(level);

  if (!Number.isFinite(level)) {
    return false;
  }

  return (
    level >=
    MAX_LEVEL
  );
}


/* ============================================================
 * هل وصلت النجوم للحد الأقصى؟
 * ============================================================ */

function isMaxStars(stars) {

  stars =
    Number(stars);

  if (!Number.isFinite(stars)) {
    return false;
  }

  return (
    stars >=
    MAX_STARS
  );
}


/* ============================================================
 * التصدير
 * ============================================================ */

module.exports = {

  PETS,

  RARITIES,

  RARITY_ORDER,

  MAX_LEVEL,

  MAX_STARS,

  SPECIAL_IMAGE_LEVEL,

  HUNGER_BY_RARITY,

  getPetByID,

  getPetByType,

  getPetsByRarity,

  getRarityLevel,

  isValidRarity,

  getHighestRarity,

  calculatePower,

  calculateHealth,

  calculateMaxHunger,

  calculateHungerPercentage,

  hasSpecialImage,

  isMaxLevel,

  isMaxStars

};