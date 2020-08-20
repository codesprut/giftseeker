import language from "../language.js";

export default class ServiceControlPanel {
  constructor(websiteUrl, value) {
    this.value = value;
    this.panel = document.createElement("div");
    this.panel.classList.add("service-control-panel");

    this.userInfo = document.createElement("div");
    this.userInfo.classList.add("user-info", "no-selectable");

    this.avatar = document.createElement("div");
    this.avatar.classList.add("avatar");
    this.username = document.createElement("span");
    this.username.classList.add("username");

    this.mainButton = document.createElement("button");
    this.mainButton.classList.add("seeker-button", "start-button");
    this.mainButton.innerText = language.get("service.btn_start");

    const buttonWrap = document.createElement("div");
    buttonWrap.appendChild(this.mainButton);

    this.panel.appendChild(buttonWrap);

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

    this.buttons = document.createElement("div");
    this.buttons.classList.add("service-control-panel-buttons");

    this.panel.appendChild(this.buttons);

    const websiteLink = document.createElement("span");
    websiteLink.classList.add("open-website", "fa", "fa-external-link-alt");
    websiteLink.dataset.tippyTranslate = "service.open_website";
    websiteLink.dataset.link = websiteUrl;

    this.appendButton(websiteLink);
  }

  appendButton(button) {
    button.classList.add("service-control-button");
    language.updateNode(button);

    this.buttons.appendChild(button);
  }

  updateInfo(data) {
    this.userInfo.classList.add("visible");

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
