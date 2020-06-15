const { remote } = require("electron");
const { language } = remote.getGlobal("sharedData");

export default class UserPanel {
  constructor(value) {
    this.value = value;
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

    this.mainButton = document.createElement("button");
    this.mainButton.classList.add("seeker-button", "start-button");
    this.mainButton.innerText = language.get("service.btn_start");

    this.panel.appendChild(this.mainButton);
  }

  updateInfo(data) {
    this.avatar.style.backgroundImage = `url('${data.avatar}')`;
    this.username.innerText = data.username;

    this.setValue(data.value);
  }

  setValue(newValue) {
    if (newValue && this.value.enabled) this.valueLabel.innerText = newValue;
  }

  appendTo(element) {
    element.appendChild(this.panel);
  }
}
