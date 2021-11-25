import time from "../utlis/time.js";
import language from "../language.js";

export default class Logger {
  constructor() {
    this.logField = document.createElement("div");

    this.clearButton = document.createElement("span");
    this.clearButton.classList.add("clear-log");
    this.clearButton.innerText = language.get("service.clear_log");
    this.clearButton.dataset.lang = "service.clear_log";
    this.clearButton.onclick = () => this.clear();
  }

  appendTo(element) {
    this.parent = element;
    element.appendChild(this.logField);
    element.appendChild(this.clearButton);
  }

  add(message, severity) {
    const logText = this.parseLog(message);
    const logRow = document.createElement("div");
    logRow.classList.add(severity);
    logRow.innerHTML = `<span class="time">${time.format(
      "hh:mm:ss",
    )}</span>${logText}`;
    this.logField.appendChild(logRow);

    if (this.parent) {
      this.parent.scrollTop = this.parent.scrollHeight;
    }
  }

  parseLog(log) {
    if (typeof log === "string") {
      return log;
    }

    return log.text.replace(
      "#link#",
      `<span class="open-website" data-link="${log.url}">${log.anchor}</span>`,
    );
  }

  clear() {
    this.logField.innerHTML = "";
    this.add(language.get("service.log_cleared"));
  }
}
