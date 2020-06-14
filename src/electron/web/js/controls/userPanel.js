const { remote } = require("electron");
const { language } = remote.getGlobal("sharedData");

export default class UserPanel {
  constructor(value) {
    this.panel = document.createElement("div");
    this.panel.classList.add("service-user-panel");

    this.userInfo = document.createElement("div");
    this.userInfo.classList.add("user-info", "no-selectable");

    this.avatar = document.createElement("div");
    this.avatar.classList.add("avatar");
    this.username = document.createElement("span");
    this.username.classList.add("username");

    this.userInfo.appendChild(this.avatar);
    this.userInfo.appendChild(this.username);

    this.panel.appendChild(this.userInfo);

    if (value.enabled) {
      const valueWrap = document.createElement("span");
      valueWrap.classList.add("value");
      valueWrap.innerHTML = `<span data-lang="${
        value.translationKey
      }">${language.get(value.translationKey)}</span>: `;

      this.valueLabel = document.createElement("span");
      this.valueLabel.innerText = value.current;

      this.userInfo.appendChild(valueWrap);
      valueWrap.appendChild(this.valueLabel);
    }
  }

  setValue(value) {
    this.valueLabel.innerText = value;
  }

  appendTo(element) {
    element.appendChild(this.panel);
  }
}
