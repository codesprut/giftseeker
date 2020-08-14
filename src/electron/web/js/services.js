import ServiceIcon from "./controls/service-icon.js";
import ServicePanel from "./controls/service-panel.js";
import time from "./utlis/time.js";
import browser from "./browser.js";
import language from "./language.js";
const { remote } = require("electron");
const { services, settings } = remote.getGlobal("sharedData");

const iconsWrap = document.querySelector(".services-icons");
const panelsWrap = document.querySelector(".services-panels");

for (const service of services) {
  service.icon = new ServiceIcon(service.name, service.state);
  service.panel = new ServicePanel(service);

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

  service.on("state.changed", state => {
    service.icon.setState(state);

    let buttonTranslation = `service.btn_${
      service.isStarted() ? "stop" : "start"
    }`;

    if (state === "process") {
      serviceButton.classList.add("disabled");
      buttonTranslation = `service.btn_checking`;
    } else {
      serviceButton.classList.remove("disabled");
    }

    serviceButton.innerText = language.get(buttonTranslation);
  });

  service.on("userinfo.updated", userInfo =>
    service.panel.userPanel.updateInfo(userInfo),
  );

  service.on("value.changed", newValue =>
    service.panel.userPanel.setValue(newValue),
  );

  service.on("tick", totalTicks => {
    const timeElapsed =
      service.workerInterval() - (totalTicks % service.workerInterval());

    if (service.isStarted() && !serviceButton.classList.contains("hovered"))
      serviceButton.innerText = time.elapsed(timeElapsed);
  });

  serviceButton.onclick = async () => {
    if (serviceButton.classList.contains("disabled")) return;

    if (service.isStarted()) await service.stop();
    else {
      const authState = await service.start();

      if (authState === 0) {
        serviceButton.classList.add("disabled");
        serviceButton.innerText = language.get("service.btn_awaiting");
        const cookies = await browser.runForAuth(
          service.websiteUrl,
          service.authPageUrl,
          service.authContent,
        );

        service.setCookie(cookies);
        await service.start();
      }
    }
  };

  serviceButton.onmouseenter = () => {
    serviceButton.classList.add("hovered");
    if (service.isStarted())
      serviceButton.innerText = language.get("service.btn_stop");
  };

  serviceButton.onmouseleave = () => serviceButton.classList.remove("hovered");

  if (settings.get("autostart")) service.start(true);
  service.runWorker();
}

services[0].icon.setActive();
services[0].panel.setActive();

window.addEventListener("beforeunload", () => {
  services.forEach(service => {
    service.stopWorker();
    service.clearEvents();
  });
});
