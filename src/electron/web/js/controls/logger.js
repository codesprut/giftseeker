const { remote } = require("electron");
const { language } = remote.getGlobal("sharedData");

import time from "../utlis/time.js";

export default class Logger {
  constructor() {
    this.logField = document.createElement("div");

    this.clearButton = document.createElement("span");
    this.clearButton.classList.add("clear-log");
    this.clearButton.dataset.lang = "service.clear_log";
    this.clearButton.onclick = () => this.clear();
  }

  appendTo(element) {
    this.parent = element;
    element.appendChild(this.logField);
    element.appendChild(this.clearButton);
  }

  add(text, logType) {
    const logNode = document.createElement("div");
    logNode.classList.add(logType ? "warn" : "normal");
    logNode.innerHTML = `<span class="time">${time.format(
      "hh:mm:ss"
    )}</span>${text}`;
    this.logField.appendChild(logNode);

    if (this.parent) this.parent.scrollTop = this.parent.scrollHeight;
  }

  clear() {
    this.logField.innerHTML = "";
    this.add(language.get("service.log_cleared"));
  }
}
