const { remote } = require("electron");
const { services } = remote.getGlobal("sharedData");
import ServiceIcon from "./controls/serviceIcon.js";
import ServicePanel from "./controls/servicePanel.js";

const iconsWrap = document.querySelector(".services-icons");
const panelsWrap = document.querySelector(".services-panels");

for (const service of services) {
  service.icon = new ServiceIcon(service.name, service.getStatus());
  service.panel = new ServicePanel(
    service.name,
    service.settings,
    service.withValue
  );

  service.icon.appendTo(iconsWrap);
  service.panel.appendTo(panelsWrap);

  service.icon.onClick(() => {
    document
      .querySelectorAll(".service-icon, .service-panel")
      .forEach(el => el.classList.remove("active"));

    service.icon.setActive();
    service.panel.setActive();
  });

  service.panel.setMenuItemClickCallback(pageCode => {
    for (const service of services) service.panel.selectPage(pageCode);
  });
}

services[0].icon.setActive();
services[0].panel.setActive();
