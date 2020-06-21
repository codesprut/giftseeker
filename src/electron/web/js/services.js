const { remote } = require("electron");
const { services, settings } = remote.getGlobal("sharedData");
import ServiceIcon from "./controls/serviceIcon.js";
import ServicePanel from "./controls/servicePanel.js";
import browser from "./browser.js";

const iconsWrap = document.querySelector(".services-icons");
const panelsWrap = document.querySelector(".services-panels");

for (const service of services) {
  service.icon = new ServiceIcon(service.name, service.status);
  service.panel = new ServicePanel(service.name, service.websiteUrl, service.settings, {
    enabled: service.withValue,
    current: service.currentValue,
    translationKey: service.translationKey("value_label")
  });

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

  service.panel.userPanel.mainButton.onclick = async ev => {
    if (ev.target.classList.contains("disabled")) return;

    ev.target.classList.add("disabled");

    if (service.started) await service.stop();
    else await service.start();

    ev.target.classList.remove("disabled");
  };
}

services[0].icon.setActive();
services[0].panel.setActive();
