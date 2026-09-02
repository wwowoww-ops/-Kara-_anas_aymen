"use strict";

module.exports.config = {
  name: "تجربة",
  version: "1.0.0",
  credits: "أبو هريرة",
  description: "اختبار نظام الحيوانات الجديد",
  commandCategory: "Games",
  hasPermssion: 0,
  usages: "تجربة",
  cooldowns: 3
};

module.exports.run = async function (context) {
  const testCommand = require("./حيوان/تجربة.js");

  return testCommand.run(context);
};