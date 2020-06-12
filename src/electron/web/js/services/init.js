const { remote } = require("electron");
const { services } = remote.getGlobal("sharedData");
import { createIcon } from "./controls.js";

const servicesKeys = Object.keys(services);
const iconsWrap = document.querySelector(".services-icons");

for (const serviceKey of servicesKeys) {
  const service = services[serviceKey];
  service.icon = createIcon(service.name, service.getStatus());
  service.icon.appendTo(iconsWrap);

  service.icon.onClick(() => {
    document
      .querySelectorAll(".service-icon, .service-panel")
      .forEach(el => el.classList.remove("active"));

    service.icon.setActive();
  });
}

services[servicesKeys[0]].icon.setActive();
