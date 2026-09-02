const PETS = [
  { id: 1, type: "قطة", name: "قطة", price: 0, rarity: "شائع", power: 10, emoji: "🐱" },
  { id: 2, type: "كلب", name: "كلب", price: 0, rarity: "شائع", power: 12, emoji: "🐶" },
  { id: 3, type: "أرنب", name: "أرنب", price: 0, rarity: "شائع", power: 8, emoji: "🐰" },
  { id: 4, type: "هامستر", name: "هامستر", price: 0, rarity: "شائع", power: 7, emoji: "🐹" },
  { id: 5, type: "سنجاب", name: "سنجاب", price: 0, rarity: "شائع", power: 9, emoji: "🐿️" },
  { id: 6, type: "فراشة", name: "فراشة", price: 0, rarity: "شائع", power: 6, emoji: "🦋" },
  { id: 7, type: "حلزون", name: "حلزون", price: 0, rarity: "شائع", power: 5, emoji: "🐌" },
  { id: 8, type: "سمكة", name: "سمكة", price: 0, rarity: "شائع", power: 7, emoji: "🐟" },

  { id: 9, type: "ثعلب", name: "ثعلب", price: 500, rarity: "غير شائع", power: 25, emoji: "🦊" },
  { id: 10, type: "باندا", name: "باندا", price: 1500, rarity: "غير شائع", power: 30, emoji: "🐼" },
  { id: 11, type: "ببغاء", name: "ببغاء", price: 2500, rarity: "غير شائع", power: 32, emoji: "🦜" },
  { id: 12, type: "سلحفاة", name: "سلحفاة", price: 1800, rarity: "غير شائع", power: 28, emoji: "🐢" },
  { id: 13, type: "بطريق", name: "بطريق", price: 2200, rarity: "غير شائع", power: 25, emoji: "🐧" },
  { id: 14, type: "كوالا", name: "كوالا", price: 2800, rarity: "غير شائع", power: 27, emoji: "🐨" },
  { id: 15, type: "غراب", name: "غراب", price: 3000, rarity: "غير شائع", power: 35, emoji: "🐦‍⬛" },

  { id: 16, type: "ذئب", name: "ذئب", price: 4000, rarity: "نادر", power: 35, emoji: "🐺" },
  { id: 17, type: "حصان", name: "حصان", price: 5000, rarity: "نادر", power: 55, emoji: "🐴" },
  { id: 18, type: "نمر", name: "نمر", price: 6000, rarity: "نادر", power: 50, emoji: "🐯" },
  { id: 19, type: "أسد", name: "أسد", price: 7000, rarity: "نادر", power: 60, emoji: "🦁" },
  { id: 20, type: "دب", name: "دب", price: 7500, rarity: "نادر", power: 65, emoji: "🐻" },

  { id: 21, type: "غزال", name: "غزال", price: 8000, rarity: "ملحمي", power: 45, emoji: "🦌" },
  { id: 22, type: "نسر", name: "نسر", price: 9000, rarity: "ملحمي", power: 70, emoji: "🦅" },
  { id: 23, type: "بومة", name: "بومة", price: 9500, rarity: "ملحمي", power: 58, emoji: "🦉" },
  { id: 24, type: "غوريلا", name: "غوريلا", price: 10000, rarity: "ملحمي", power: 85, emoji: "🦍" },
  { id: 25, type: "فهد", name: "فهد", price: 11000, rarity: "ملحمي", power: 88, emoji: "🐆" },
  { id: 26, type: "تمساح", name: "تمساح", price: 10500, rarity: "ملحمي", power: 78, emoji: "🐊" },
  { id: 27, type: "قرش", name: "قرش", price: 12000, rarity: "ملحمي", power: 82, emoji: "🦈" },
  { id: 28, type: "حوت", name: "حوت", price: 13000, rarity: "ملحمي", power: 90, emoji: "🐋" },
  { id: 29, type: "زرافة", name: "زرافة", price: 11500, rarity: "ملحمي", power: 65, emoji: "🦒" },
  { id: 30, type: "شمبانزي", name: "شمبانزي", price: 8500, rarity: "ملحمي", power: 55, emoji: "🐒" },

  { id: 31, type: "وحيد القرن", name: "وحيد القرن", price: 15000, rarity: "أسطوري", power: 105, emoji: "🦏" },
  { id: 32, type: "فيل", name: "فيل", price: 16000, rarity: "أسطوري", power: 110, emoji: "🐘" },
  { id: 33, type: "صقر", name: "صقر", price: 14000, rarity: "أسطوري", power: 95, emoji: "🦅" },
  { id: 34, type: "وحش أسطوري", name: "وحش أسطوري", price: 20000, rarity: "أسطوري", power: 150, emoji: "👹" },

  { id: 35, type: "تنين", name: "تنين", price: 30000, rarity: "خرافي", power: 150, emoji: "🐉" },
  { id: 36, type: "يونيكورن", name: "يونيكورن", price: 25000, rarity: "خرافي", power: 140, emoji: "🦄" },
  { id: 37, type: "كراكن", name: "كراكن", price: 40000, rarity: "خرافي", power: 180, emoji: "🐙" }
];

const RARITY_ORDER = [
  "شائع",
  "غير شائع",
  "نادر",
  "ملحمي",
  "أسطوري",
  "خرافي"
];

function getPetByID(id) {
  return PETS.find(pet => pet.id === Number(id));
}

function getPetByType(type) {
  return PETS.find(
    pet => String(pet.type) === String(type)
  );
}

module.exports = {
  PETS,
  RARITY_ORDER,
  getPetByID,
  getPetByType
};