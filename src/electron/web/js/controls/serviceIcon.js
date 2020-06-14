export default class ServiceIcon {
  constructor(serviceName, defaultStatus) {
    this.icon = document.createElement("div");
    this.icon.classList.add("service-icon");

    this.bg = document.createElement("div");
    this.bg.classList.add("bg");
    this.bg.style.backgroundImage = `url('images/services/${serviceName}.png')`;

    this.statusIcon = document.createElement("div");
    this.statusIcon.classList.add("service-status");

    this.nameLabel = document.createElement("span");
    this.nameLabel.classList.add("service-name");
    this.nameLabel.innerText = serviceName;

    this.icon.appendChild(this.bg);
    this.icon.appendChild(this.statusIcon);
    this.icon.appendChild(this.nameLabel);

    this.setStatus(defaultStatus);
  }

  appendTo(element) {
    element.appendChild(this.icon);
  }

  setActive() {
    this.icon.classList.add("active");
  }

  setStatus(status) {
    this.statusIcon.dataset.status = status;
  }

  onClick(callback) {
    this.icon.onclick = callback;
  }
}
