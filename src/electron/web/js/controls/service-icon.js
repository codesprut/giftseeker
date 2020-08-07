export default class ServiceIcon {
  constructor(serviceName, defaultState) {
    this.icon = document.createElement("div");
    this.icon.classList.add("service-icon");

    this.bg = document.createElement("div");
    this.bg.classList.add("bg");
    this.bg.style.backgroundImage = `url('images/services/${serviceName}.png')`;

    this.stateIcon = document.createElement("div");

    this.stateIcon.classList.add("service-state");

    this.nameLabel = document.createElement("span");
    this.nameLabel.classList.add("service-name");
    this.nameLabel.innerText = serviceName;

    this.icon.appendChild(this.bg);
    this.icon.appendChild(this.stateIcon);
    this.icon.appendChild(this.nameLabel);

    this.setState(defaultState);
  }

  appendTo(element) {
    element.appendChild(this.icon);
  }

  setActive() {
    this.icon.classList.add("active");
  }

  setState(state) {
    this.stateIcon.dataset.state = state;
  }

  onClick(callback) {
    this.icon.onclick = callback;
  }
}
