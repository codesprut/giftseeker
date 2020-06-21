const { remote } = require("electron");
const { services, settings, language } = remote.getGlobal("sharedData");
import ServiceIcon from "./controls/serviceIcon.js";
import ServicePanel from "./controls/servicePanel.js";
import browser from "./browser.js";
import time from "./utlis/time.js";

const iconsWrap = document.querySelector(".services-icons");
const panelsWrap = document.querySelector(".services-panels");

for (const service of services) {
  service.icon = new ServiceIcon(service.name, service.status);
  service.panel = new ServicePanel(
    service.name,
    service.websiteUrl,
    service.settings,
    {
      enabled: service.withValue,
      current: service.currentValue,
      translationKey: service.translationKey("value_label")
    }
  );

  const serviceButton = service.panel.userPanel.mainButton;

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

  service.on("log", ({ text, type }) => {
    service.panel.logger.add(text, type);
  });

  service.on("status.changed", status => {
    service.icon.statusIcon.dataset.status = status;

    serviceButton.innerText = language.get(
      `service.btn_${service.isStarted() ? "stop" : "start"}`
    );
  });

  service.on("userinfo.updated", userInfo =>
    service.panel.userPanel.updateInfo(userInfo)
  );

  service.on("value.changed", newValue =>
    service.panel.userPanel.setValue(newValue)
  );

  service.on("tick", totalTicks => {
    const timeElapsed =
      service.workerInterval() - (totalTicks % service.workerInterval());

    if (service.isStarted() && !serviceButton.classList.contains("hovered"))
      serviceButton.innerText = time.elapsed(timeElapsed);
  });

  serviceButton.onclick = async ev => {
    const button = ev.target;
    if (button.classList.contains("disabled")) return;

    button.classList.add("disabled");

    if (service.isStarted()) await service.stop();
    else {
      const authState = await service.start();

      if (authState === 0) {
        const cookies = await browser.runForAuth(
          service.websiteUrl,
          service.authPageUrl,
          service.authContent
        );

        service.setCookie(cookies);
        await service.start();
      }
    }

    button.classList.remove("disabled");
  };

  serviceButton.onmouseenter = () => {
    serviceButton.classList.add("hovered");
    serviceButton.innerText = language.get("service.btn_stop");
  };

  serviceButton.onmouseleave = () => serviceButton.classList.remove("hovered");

  if (settings.get("autostart")) service.start(true);
  service.runWorker();
}

services[0].icon.setActive();
services[0].panel.setActive();
