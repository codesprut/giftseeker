const { remote } = require("electron");
const { services } = remote.getGlobal("sharedData");
import { createIcon, createPanel } from "./controls/bundle.js";

const servicesKeys = Object.keys(services);
const iconsWrap = document.querySelector(".services-icons");
const panelsWrap = document.querySelector(".services-panels");

for (const serviceKey of servicesKeys) {
  const service = services[serviceKey];
  service.icon = createIcon(service.name, service.getStatus());
  service.panel = createPanel();

  service.icon.appendTo(iconsWrap);
  service.panel.appendTo(panelsWrap);

  service.icon.onClick(() => {
    document
      .querySelectorAll(".service-icon, .service-panel")
      .forEach(el => el.classList.remove("active"));

    service.icon.setActive();
    service.panel.setActive();
  });
}

services[servicesKeys[0]].icon.setActive();
services[servicesKeys[0]].panel.setActive();
