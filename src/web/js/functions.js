"use strict";

window.timeStr = function() {
  let date = new Date();
  let h = date.getHours(),
    i = date.getMinutes(),
    s = date.getSeconds();
  return (
    (h > 9 ? h : "0" + h) +
    ":" +
    (i > 9 ? i : "0" + i) +
    ":" +
    (s > 9 ? s : "0" + s)
  );
};

window.timeToStr = function(time) {
  let str = "";
  let h = Math.floor(time / 60 / 60),
    i = Math.floor((time - h * 60) / 60),
    s = time % 60;

  if (h > 0) str += h + ":";

  if (i > 0) str += i + ":";

  if (s < 9) s = "0" + s;

  str += s;

  return str;
};
