/**

============================================================

نظام الحيوانات - المستويات والخبرة

============================================================

مسؤولية هذا الملف:

المستوى الحالي


XP


XP المطلوبة لكل مستوى


إضافة XP


حساب تقدم المستوى


حساب القوة والصحة والجوع حسب المستوى


نظام النجوم والترقية موجود في:

stars.js

الإحصائيات المتقدمة موجودة في:

stats.js

============================================================
*/


"use strict";

const {
getPetByID,
getPetByType,
calculatePower,
calculateHealth,
calculateMaxHunger,
hasSpecialImage
} = require("./pets");

/* ============================================================

الإعدادات الأساسية

============================================================ */


const DEFAULT_MAX_LEVEL = 60;
const DEFAULT_LEVEL = 0;
const DEFAULT_XP = 0;

/* ============================================================

إعدادات XP

============================================================ */


const XP_BASE = 250;
const XP_EXPONENT = 2.05;

/* ============================================================

الحصول على بيانات الحيوان

============================================================ */


function resolvePet(pet) {

if (!pet) {
return null;
}

if (typeof pet === "object") {

if (pet.id !== undefined) {  
  return getPetByID(pet.id) || pet;  
}  

if (pet.type) {  
  return getPetByType(pet.type) || pet;  
}  

return pet;

}

if (!isNaN(Number(pet))) {
return getPetByID(Number(pet));
}

return getPetByType(String(pet));
}

/* ============================================================

تنظيم المستوى

============================================================ */


function normalizeLevel(
level = DEFAULT_LEVEL,
pet = null
) {

const resolvedPet =
resolvePet(pet);

const maxLevel =
Number(resolvedPet?.maxLevel) ||
DEFAULT_MAX_LEVEL;

level = Number(level);

if (!Number.isFinite(level)) {
level = DEFAULT_LEVEL;
}

level = Math.floor(level);

return Math.max(
DEFAULT_LEVEL,
Math.min(
level,
maxLevel
)
);
}

/* ============================================================

تنظيم XP

============================================================ */


function normalizeXP(
xp = DEFAULT_XP
) {

xp = Number(xp);

if (
!Number.isFinite(xp) ||
xp < 0
) {
return DEFAULT_XP;
}

return Math.floor(xp);
}

/* ============================================================

XP المطلوبة للمستوى التالي

============================================================ */


function getRequiredXP(
level = DEFAULT_LEVEL
) {

level = Math.max(
DEFAULT_LEVEL,
Math.floor(
Number(level) ||
DEFAULT_LEVEL
)
);

return Math.floor(
XP_BASE *
Math.pow(
level + 1,
XP_EXPONENT
)
);
}

/* ============================================================

XP المطلوبة للمستوى التالي

============================================================ */


function getXPForNextLevel(
level = DEFAULT_LEVEL,
pet = null
) {

const resolvedPet =
resolvePet(pet);

const currentLevel =
normalizeLevel(
level,
resolvedPet
);

const maxLevel =
Number(resolvedPet?.maxLevel) ||
DEFAULT_MAX_LEVEL;

if (
currentLevel >=
maxLevel
) {
return 0;
}

return getRequiredXP(
currentLevel
);
}

/* ============================================================

إجمالي XP للوصول لمستوى معين

============================================================ */


function getTotalXPForLevel(
level = DEFAULT_LEVEL,
pet = null
) {

const resolvedPet =
resolvePet(pet);

level =
normalizeLevel(
level,
resolvedPet
);

let totalXP = 0;

for (
let currentLevel = DEFAULT_LEVEL;
currentLevel < level;
currentLevel++
) {

totalXP +=  
  getRequiredXP(  
    currentLevel  
  );

}

return totalXP;
}

/* ============================================================

حساب تقدم المستوى

============================================================ */


function getLevelProgress(
level = DEFAULT_LEVEL,
xp = DEFAULT_XP,
pet = null
) {

const resolvedPet =
resolvePet(pet);

level =
normalizeLevel(
level,
resolvedPet
);

xp =
normalizeXP(xp);

const maxLevel =
Number(resolvedPet?.maxLevel) ||
DEFAULT_MAX_LEVEL;

if (
level >=
maxLevel
) {

return {  
  level,  
  xp: 0,  
  requiredXP: 0,  
  remainingXP: 0,  
  percentage: 100,  
  isMaxLevel: true  
};

}

const requiredXP =
getRequiredXP(level);

const percentage =
Math.min(
100,
Math.floor(
(xp / requiredXP) *
100
)
);

return {
level,
xp,
requiredXP,

remainingXP:  
  Math.max(  
    0,  
    requiredXP - xp  
  ),  

percentage,  
isMaxLevel: false

};
}

/* ============================================================

حساب القوة

============================================================ */


function getPetPower(
pet,
level = DEFAULT_LEVEL
) {

const resolvedPet =
resolvePet(pet);

if (!resolvedPet) {
return 0;
}

level =
normalizeLevel(
level,
resolvedPet
);

return calculatePower(
resolvedPet,
level
);
}

/* ============================================================

حساب الصحة

============================================================ */


function getPetHealth(
pet,
level = DEFAULT_LEVEL
) {

const resolvedPet =
resolvePet(pet);

if (!resolvedPet) {
return 0;
}

level =
normalizeLevel(
level,
resolvedPet
);

return calculateHealth(
resolvedPet,
level
);
}

/* ============================================================

حساب الحد الأقصى للجوع

============================================================ */


function getPetMaxHunger(
pet,
level = DEFAULT_LEVEL
) {

const resolvedPet =
resolvePet(pet);

if (!resolvedPet) {
return 100;
}

level =
normalizeLevel(
level,
resolvedPet
);

return calculateMaxHunger(
resolvedPet,
level
);
}

/* ============================================================

التحقق من الصورة الخاصة

============================================================ */


function checkSpecialImage(
pet,
level = DEFAULT_LEVEL
) {

const resolvedPet =
resolvePet(pet);

if (!resolvedPet) {
return false;
}

level =
normalizeLevel(
level,
resolvedPet
);

return hasSpecialImage(
resolvedPet,
level
);
}

/* ============================================================

إحصائيات الحيوان

============================================================

هذه الدالة موجودة للتوافق مع الاختبارات

والأوامر القديمة التي تستعمل leveling.getPetStats().

لا تحتوي على النجوم.

============================================================ */


function getPetStats(
pet,
level = DEFAULT_LEVEL
) {

const resolvedPet =
resolvePet(pet);

if (!resolvedPet) {
return null;
}

level =
normalizeLevel(
level,
resolvedPet
);

const power =
getPetPower(
resolvedPet,
level
);

const health =
getPetHealth(
resolvedPet,
level
);

const maxHunger =
getPetMaxHunger(
resolvedPet,
level
);

return {
level,

power,  

health,  

maxHealth:  
  health,  

hunger:  
  maxHunger,  

maxHunger,  

powerGain:  
  getPowerGain(  
    resolvedPet  
  ),  

healthGain:  
  getHealthGain(  
    resolvedPet  
  ),  

hungerGain:  
  getHungerGain(  
    resolvedPet  
  ),  

hasSpecialImage:  
  hasSpecialImage(  
    resolvedPet,  
    level  
  )

};
}

/* ============================================================

مقدار زيادة القوة

============================================================ */


function getPowerGain(pet) {

const resolvedPet =
resolvePet(pet);

if (!resolvedPet) {
return 0;
}

return Math.max(
0,
Number(
resolvedPet.growth?.power
) || 0
);
}

/* ============================================================

مقدار زيادة الصحة

============================================================ */


function getHealthGain(pet) {

const resolvedPet =
resolvePet(pet);

if (!resolvedPet) {
return 0;
}

return Math.max(
0,
Number(
resolvedPet.growth?.health
) || 0
);
}

/* ============================================================

مقدار زيادة الجوع

============================================================ */


function getHungerGain(pet) {

const resolvedPet =
resolvePet(pet);

if (!resolvedPet) {
return 0;
}

return Math.max(
0,
Number(
resolvedPet.growth?.hunger
) || 0
);
}

/* ============================================================

إضافة XP

============================================================ */


function addXP(
level = DEFAULT_LEVEL,
xp = DEFAULT_XP,
amount = 0,
pet = null
) {

const resolvedPet =
resolvePet(pet);

let currentLevel =
normalizeLevel(
level,
resolvedPet
);

let currentXP =
normalizeXP(xp);

amount = Number(amount);

if (
!Number.isFinite(amount) ||
amount < 0
) {
amount = 0;
}

amount =
Math.floor(amount);

currentXP += amount;

const maxLevel =
Number(resolvedPet?.maxLevel) ||
DEFAULT_MAX_LEVEL;

let levelsGained = 0;

while (
currentLevel < maxLevel &&
currentXP >=
getRequiredXP(
currentLevel
)
) {

currentXP -=  
  getRequiredXP(  
    currentLevel  
  );  

currentLevel++;  

levelsGained++;

}

if (
currentLevel >=
maxLevel
) {
currentXP = 0;
}

return {
level:
currentLevel,

xp:  
  currentXP,  

levelsGained,  

leveledUp:  
  levelsGained > 0,  

power:  
  getPetPower(  
    resolvedPet,  
    currentLevel  
  ),  

health:  
  getPetHealth(  
    resolvedPet,  
    currentLevel  
  ),  

maxHunger:  
  getPetMaxHunger(  
    resolvedPet,  
    currentLevel  
  ),  

hasSpecialImage:  
  hasSpecialImage(  
    resolvedPet,  
    currentLevel  
  )

};
}

/* ============================================================

معلومات المستوى

============================================================ */


function getLevelInfo(
pet,
level = DEFAULT_LEVEL
) {

const resolvedPet =
resolvePet(pet);

if (!resolvedPet) {
return null;
}

level =
normalizeLevel(
level,
resolvedPet
);

const progress =
getLevelProgress(
level,
DEFAULT_XP,
resolvedPet
);

return {
id:
resolvedPet.id,

type:  
  resolvedPet.type,  

name:  
  resolvedPet.name,  

rarity:  
  resolvedPet.rarity,  

level,  

maxLevel:  
  Number(  
    resolvedPet.maxLevel  
  ) ||  
  DEFAULT_MAX_LEVEL,  

power:  
  getPetPower(  
    resolvedPet,  
    level  
  ),  

health:  
  getPetHealth(  
    resolvedPet,  
    level  
  ),  

maxHunger:  
  getPetMaxHunger(  
    resolvedPet,  
    level  
  ),  

basePower:  
  Number(  
    resolvedPet.basePower  
  ) || 0,  

baseHealth:  
  Number(  
    resolvedPet.baseHealth  
  ) || 0,  

powerGain:  
  getPowerGain(  
    resolvedPet  
  ),  

healthGain:  
  getHealthGain(  
    resolvedPet  
  ),  

hungerGain:  
  getHungerGain(  
    resolvedPet  
  ),  

xpRequired:  
  getXPForNextLevel(  
    level,  
    resolvedPet  
  ),  

totalXP:  
  getTotalXPForLevel(  
    level,  
    resolvedPet  
  ),  

progress

};
}

/* ============================================================

التصدير

============================================================ */


module.exports = {

/* الإعدادات */
DEFAULT_MAX_LEVEL,
DEFAULT_LEVEL,
DEFAULT_XP,

XP_BASE,
XP_EXPONENT,

/* البيانات */
resolvePet,

/* التنظيم */
normalizeLevel,
normalizeXP,

/* XP */
getRequiredXP,
getXPForNextLevel,
getTotalXPForLevel,
getLevelProgress,
addXP,

/* الإحصائيات */
getPetPower,
getPetHealth,
getPetMaxHunger,
getPetStats,
checkSpecialImage,

/* النمو */
getPowerGain,
getHealthGain,
getHungerGain,

/* المعلومات */
getLevelInfo
};